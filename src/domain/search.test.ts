import assert from "node:assert/strict";
import { test } from "node:test";
import { parseIsoDate } from "./dates.ts";
import type { IsoDate } from "./dates.ts";
import {
  DEFAULT_ADULTS,
  hasDates,
  parseStaySearch,
  sameCriteria,
  serializeCriteria,
  serializeStaySearch,
  validateCriteria,
} from "./search.ts";

const d = (value: string): IsoDate => {
  const parsed = parseIsoDate(value);
  assert.ok(parsed);
  return parsed;
};

test("empty query gives browse mode with default guests and no issues", () => {
  const { state, issues } = parseStaySearch({});
  assert.deepEqual(state, { criteria: { adults: DEFAULT_ADULTS }, filters: {} });
  assert.deepEqual(issues, []);
  assert.equal(hasDates(state.criteria), false);
  assert.deepEqual(validateCriteria(state.criteria), []);
});

test("full query parses criteria and filters separately", () => {
  const { state, issues } = parseStaySearch({
    destination: "dia-diem-mau-1",
    checkIn: "2026-10-12",
    checkOut: "2026-10-14",
    adults: "3",
  });
  assert.deepEqual(issues, []);
  assert.deepEqual(state.criteria, { checkIn: "2026-10-12", checkOut: "2026-10-14", adults: 3 });
  assert.deepEqual(state.filters, { destination: "dia-diem-mau-1" });
  assert.equal(hasDates(state.criteria), true);
});

test("blank form fields are treated as absent", () => {
  const { state, issues } = parseStaySearch({ destination: "", checkIn: "", checkOut: " ", adults: "" });
  assert.deepEqual(state, { criteria: { adults: DEFAULT_ADULTS }, filters: {} });
  assert.deepEqual(issues, []);
});

test("malformed values are dropped and reported, never thrown", () => {
  const { state, issues } = parseStaySearch({
    checkIn: "2026-02-30",
    checkOut: "tomorrow",
    adults: "0",
    destination: "Not A Slug!",
  });
  assert.deepEqual(state, { criteria: { adults: DEFAULT_ADULTS }, filters: {} });
  assert.deepEqual(issues, [
    { code: "malformed-date", field: "checkIn" },
    { code: "malformed-date", field: "checkOut" },
    { code: "malformed-adults" },
  ]);
});

test("adults rejects non-integers and out-of-range values", () => {
  for (const adults of ["-1", "1.5", "2e1", "abc", "100"]) {
    const { state, issues } = parseStaySearch({ adults });
    assert.equal(state.criteria.adults, DEFAULT_ADULTS, adults);
    assert.deepEqual(issues, [{ code: "malformed-adults" }], adults);
  }
});

test("repeated parameters use the first value", () => {
  const { state } = parseStaySearch({ adults: ["4", "9"], destination: ["first-place", "other"] });
  assert.equal(state.criteria.adults, 4);
  assert.equal(state.filters.destination, "first-place");
});

test("children is not read from the URL", () => {
  const { state } = parseStaySearch({ children: "2" });
  assert.equal(state.criteria.children, undefined);
});

test("serialize then parse round-trips", () => {
  const original = {
    criteria: { checkIn: d("2026-12-30"), checkOut: d("2027-01-02"), adults: 4 },
    filters: { destination: "dia-diem-mau-1" },
  };
  const query = serializeStaySearch(original);
  assert.equal(query, "destination=dia-diem-mau-1&checkIn=2026-12-30&checkOut=2027-01-02&adults=4");
  const { state, issues } = parseStaySearch(Object.fromEntries(new URLSearchParams(query)));
  assert.deepEqual(state, original);
  assert.deepEqual(issues, []);
});

test("serializeCriteria omits filters and default values", () => {
  assert.equal(serializeCriteria({ adults: DEFAULT_ADULTS }), "");
  assert.equal(
    serializeCriteria({ checkIn: d("2026-10-12"), checkOut: d("2026-10-14"), adults: DEFAULT_ADULTS }),
    "checkIn=2026-10-12&checkOut=2026-10-14",
  );
  assert.equal(serializeStaySearch({ criteria: { adults: DEFAULT_ADULTS }, filters: {} }), "");
});

test("validate requires both dates or neither", () => {
  assert.deepEqual(validateCriteria({ checkIn: d("2026-10-12"), adults: 2 }), [
    { code: "missing-date", field: "checkOut" },
  ]);
  assert.deepEqual(validateCriteria({ checkOut: d("2026-10-12"), adults: 2 }), [
    { code: "missing-date", field: "checkIn" },
  ]);
});

test("validate rejects check-out on or before check-in", () => {
  const issue = [{ code: "check-out-not-after-check-in" }];
  assert.deepEqual(validateCriteria({ checkIn: d("2026-10-14"), checkOut: d("2026-10-12"), adults: 2 }), issue);
  assert.deepEqual(validateCriteria({ checkIn: d("2026-10-12"), checkOut: d("2026-10-12"), adults: 2 }), issue);
});

test("past check-in is judged only when the property's today is known", () => {
  const criteria = { checkIn: d("2026-10-07"), checkOut: d("2026-10-09"), adults: 2 };
  assert.deepEqual(validateCriteria(criteria), []);
  assert.deepEqual(validateCriteria(criteria, { today: d("2026-10-08") }), [{ code: "check-in-in-past" }]);
  assert.deepEqual(validateCriteria(criteria, { today: d("2026-10-07") }), []);
});

test("provider stay rules are applied when supplied", () => {
  const twoNights = { checkIn: d("2026-10-12"), checkOut: d("2026-10-14"), adults: 5 };
  assert.deepEqual(validateCriteria(twoNights, { rules: { minNights: 3, maxAdults: 4 } }), [
    { code: "above-max-adults", maxAdults: 4 },
    { code: "below-min-nights", minNights: 3 },
  ]);
  assert.deepEqual(validateCriteria(twoNights, { rules: { maxNights: 1 } }), [
    { code: "above-max-nights", maxNights: 1 },
  ]);
  assert.deepEqual(validateCriteria(twoNights, { rules: { minNights: 2, maxNights: 2, maxAdults: 5 } }), []);
});

test("guest limit applies in browse mode too", () => {
  assert.deepEqual(validateCriteria({ adults: 6 }, { rules: { maxAdults: 4 } }), [
    { code: "above-max-adults", maxAdults: 4 },
  ]);
});

test("sameCriteria compares dates and guests", () => {
  const stay = { checkIn: d("2026-10-12"), checkOut: d("2026-10-14"), adults: 2 };
  assert.equal(sameCriteria(stay, { ...stay }), true);
  assert.equal(sameCriteria(stay, { ...stay, adults: 3 }), false);
  assert.equal(sameCriteria(stay, { ...stay, checkOut: d("2026-10-15") }), false);
  assert.equal(sameCriteria({ adults: 2 }, { adults: 2 }), true);
});

test("a property filter is optional, carried as a slug, and never an issue", () => {
  const none = parseStaySearch({ checkIn: "2026-10-12", checkOut: "2026-10-14" });
  assert.equal(none.state.filters.property, undefined);
  assert.deepEqual(none.issues, []);

  const one = parseStaySearch({ property: "co-so-mau-a", adults: "3" });
  assert.deepEqual(one.state.filters, { property: "co-so-mau-a" });
  assert.equal(serializeStaySearch(one.state), "property=co-so-mau-a&adults=3");

  const unreadable = parseStaySearch({ property: "Not A Slug!" });
  assert.deepEqual(unreadable.state.filters, {});
  assert.deepEqual(unreadable.issues, []);
});

test("property comes before destination and criteria in the URL", () => {
  const state = { criteria: { checkIn: d("2026-10-12"), checkOut: d("2026-10-14"), adults: 2 }, filters: { property: "a", destination: "b" } };
  assert.equal(serializeStaySearch(state), "property=a&destination=b&checkIn=2026-10-12&checkOut=2026-10-14");
  assert.deepEqual(parseStaySearch(Object.fromEntries(new URLSearchParams(serializeStaySearch(state)))).state, state);
});
