import assert from "node:assert/strict";
import { test } from "node:test";
import { parseIsoDate } from "@/domain/dates";
import type { IsoDate } from "@/domain/dates";
import { buildMonth, buildMonths, clampDate, dayRole } from "@/features/booking-search/calendar";
import { issueMessage } from "@/features/booking-search/copy";
import { formatDay, formatDayLong, formatDayWithWeekday, formatMonth } from "@/features/booking-search/format";
import {
  adultsLimit,
  checkSubmit,
  clearDates,
  criteriaFromForm,
  emptySearchForm,
  formFromSearch,
  pickDate,
  searchFromForm,
  selectedProperty,
  setAdults,
  setProperty,
} from "@/features/booking-search/search-form";
import type { PropertyOption, SearchFormState } from "@/features/booking-search/search-form";
import { datesSummary, staySummary } from "@/features/booking-search/summary";

const d = (value: string): IsoDate => {
  const parsed = parseIsoDate(value);
  assert.ok(parsed, value);
  return parsed;
};
const stay: SearchFormState = { propertyId: null, checkIn: d("2026-12-10"), checkOut: d("2026-12-12"), adults: 2 };
const properties: PropertyOption[] = [
  { id: "prop-a", slug: "stay-a", name: "Stay A", area: "Area 1" },
  { id: "prop-b", slug: "stay-b", name: "Stay B", area: "Area 2" },
];

test("the default search covers all properties", () => {
  assert.equal(emptySearchForm.propertyId, null);
  assert.equal(selectedProperty(emptySearchForm, properties), undefined);
  assert.deepEqual(searchFromForm(stay, criteriaFromForm(stay), properties).filters, {});
});

test("a chosen property travels as its slug, identified by its id", () => {
  const chosen = setProperty(stay, "prop-b", properties);
  assert.equal(chosen.propertyId, "prop-b");
  assert.equal(selectedProperty(chosen, properties)?.name, "Stay B");
  assert.deepEqual(searchFromForm(chosen, criteriaFromForm(chosen), properties), {
    criteria: { checkIn: "2026-12-10", checkOut: "2026-12-12", adults: 2 },
    filters: { property: "stay-b" },
  });
});

test("switching between one property and all properties keeps dates and guests", () => {
  const one = setProperty({ ...stay, adults: 3 }, "prop-a", properties);
  const all = setProperty(one, null, properties);
  assert.deepEqual(all, { ...stay, adults: 3, propertyId: null });
  assert.deepEqual(setProperty(all, "prop-b", properties), { ...stay, adults: 3, propertyId: "prop-b" });
});

test("an unknown property id or slug falls back to all properties, without an error", () => {
  assert.equal(setProperty(stay, "no-such-id", properties).propertyId, null);
  assert.equal(setProperty(stay, "Stay A", properties).propertyId, null, "a display name is not an identifier");
  const fromUrl = formFromSearch({ criteria: { adults: 2 }, filters: { property: "gone" } }, properties);
  assert.equal(fromUrl.propertyId, null);
});

test("a search read from the URL restores the property, dates and guests", () => {
  const form = formFromSearch(
    { criteria: { checkIn: d("2026-12-10"), checkOut: d("2026-12-12"), adults: 3 }, filters: { property: "stay-a" } },
    properties,
  );
  assert.deepEqual(form, { propertyId: "prop-a", checkIn: "2026-12-10", checkOut: "2026-12-12", adults: 3 });
  assert.deepEqual(searchFromForm(form, criteriaFromForm(form), properties).filters, { property: "stay-a" });
});

test("submitting never needs a property: both scenarios pass with valid dates", () => {
  assert.equal(checkSubmit(stay, { today: d("2026-10-10") }).ok, true);
  assert.equal(checkSubmit(setProperty(stay, "prop-a", properties), { today: d("2026-10-10") }).ok, true);
});

test("a missing property is never the reason a search is refused", () => {
  const refused = checkSubmit({ ...emptySearchForm, propertyId: null }, {});
  assert.equal(refused.ok, false);
  if (!refused.ok) assert.notEqual(refused.field, "property");
});

test("first pick sets check-in and asks for check-out; second completes the stay", () => {
  const first = pickDate(emptySearchForm, "checkIn", d("2026-12-10"));
  assert.deepEqual(first, { form: { propertyId: null, adults: 2, checkIn: "2026-12-10" }, next: "checkOut" });
  const second = pickDate(first.form, "checkOut", d("2026-12-12"));
  assert.deepEqual(second, { form: stay, next: "done" });
});

test("a check-out on or before check-in starts the stay again from that day", () => {
  for (const day of ["2026-12-10", "2026-12-08"]) {
    const picked = pickDate({ ...emptySearchForm, checkIn: d("2026-12-10") }, "checkOut", d(day));
    assert.deepEqual(picked, { form: { propertyId: null, adults: 2, checkIn: day }, next: "checkOut" });
  }
});

test("picking check-out with no check-in yet is read as check-in", () => {
  const picked = pickDate(emptySearchForm, "checkOut", d("2026-12-10"));
  assert.equal(picked.form.checkIn, "2026-12-10");
  assert.equal(picked.form.checkOut, undefined);
  assert.equal(picked.next, "checkOut");
});

test("changing check-in keeps a check-out that is still later, and clears one that is not", () => {
  const earlier = pickDate(stay, "checkIn", d("2026-12-09"));
  assert.deepEqual(earlier, { form: { ...stay, checkIn: "2026-12-09" }, next: "done" });

  for (const day of ["2026-12-12", "2026-12-20"]) {
    const later = pickDate(stay, "checkIn", d(day));
    assert.equal(later.form.checkIn, day);
    assert.equal(later.form.checkOut, undefined, "check-out is cleared, never moved");
    assert.equal(later.next, "checkOut");
  }
});

test("changing check-out on a complete stay moves only the check-out", () => {
  assert.deepEqual(pickDate(stay, "checkOut", d("2026-12-15")), { form: { ...stay, checkOut: "2026-12-15" }, next: "done" });
});

test("no pick sequence can produce a check-out that is not after check-in", () => {
  const days = ["2026-12-08", "2026-12-10", "2026-12-12", "2026-12-10", "2026-12-15", "2026-12-09"].map(d);
  let form = emptySearchForm;
  for (const field of ["checkIn", "checkOut"] as const) {
    for (const day of days) {
      form = pickDate(form, field, day).form;
      if (form.checkIn && form.checkOut) assert.ok(form.checkIn < form.checkOut, `${form.checkIn} → ${form.checkOut}`);
    }
  }
});

test("clearDates keeps the property and guests", () => {
  assert.deepEqual(clearDates({ ...stay, adults: 3, propertyId: "prop-a" }), { adults: 3, propertyId: "prop-a" });
});

test("guests: at least one, no invented maximum, a verified rule applies", () => {
  assert.equal(setAdults(stay, 0, {}).adults, 1);
  assert.equal(setAdults(stay, -4, {}).adults, 1);
  assert.equal(setAdults(stay, 3, {}).adults, 3);
  assert.equal(setAdults(stay, 500, {}).adults, 99);
  assert.equal(adultsLimit({}), 99);
  assert.equal(setAdults(stay, 9, { maxAdults: 6 }).adults, 6);
  assert.equal(setAdults(stay, Number.NaN, {}).adults, 1);
});

test("criteria carry dates and guests only", () => {
  assert.deepEqual(criteriaFromForm(stay), { checkIn: "2026-12-10", checkOut: "2026-12-12", adults: 2 });
});

test("submit: missing dates send the guest to the first missing date", () => {
  assert.deepEqual(checkSubmit(emptySearchForm, {}), { ok: false, issues: [{ code: "missing-date", field: "checkIn" }], field: "checkIn" });
  assert.deepEqual(checkSubmit({ ...emptySearchForm, checkIn: d("2026-12-10") }, {}), {
    ok: false,
    issues: [{ code: "missing-date", field: "checkOut" }],
    field: "checkOut",
  });
});

test("submit: a complete, valid stay is accepted", () => {
  assert.deepEqual(checkSubmit(stay, { today: d("2026-10-10") }), {
    ok: true,
    criteria: { checkIn: "2026-12-10", checkOut: "2026-12-12", adults: 2 },
  });
});

test("submit: past dates and verified stay rules are refused", () => {
  const past = checkSubmit(stay, { today: d("2026-12-11") });
  assert.deepEqual(past, { ok: false, issues: [{ code: "check-in-in-past" }], field: "checkIn" });

  const short = checkSubmit(stay, { rules: { minNights: 3 } });
  assert.deepEqual(short, { ok: false, issues: [{ code: "below-min-nights", minNights: 3 }], field: "checkOut" });

  const crowded = checkSubmit({ ...stay, adults: 5 }, { rules: { maxAdults: 4 } });
  assert.equal(crowded.ok, false);
  if (!crowded.ok) assert.equal(crowded.field, "guests");

  const backwards = checkSubmit({ ...stay, checkIn: d("2026-12-12"), checkOut: d("2026-12-10") }, {});
  assert.deepEqual(backwards, { ok: false, issues: [{ code: "check-out-not-after-check-in" }], field: "checkOut" });
});

test("every issue has a message", () => {
  assert.equal(issueMessage({ code: "missing-date", field: "checkOut" }), "Hãy chọn ngày trả phòng.");
  assert.equal(issueMessage({ code: "below-min-nights", minNights: 2 }), "Kỳ lưu trú tối thiểu 2 đêm.");
});

test("month grid: Monday first, padded to whole weeks", () => {
  const december = buildMonth(d("2026-12-10"));
  assert.equal(december.first, "2026-12-01");
  assert.equal(december.weeks.length, 5);
  assert.deepEqual(december.weeks[0], [null, "2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04", "2026-12-05", "2026-12-06"]);
  assert.deepEqual(december.weeks[4], ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", null, null, null]);
  const february = buildMonth(d("2027-02-01")); // starts on a Monday, 28 days
  assert.equal(february.weeks.length, 4);
  assert.equal(february.weeks[0]?.[0], "2027-02-01");
  assert.ok(buildMonth(d("2028-02-01")).weeks.flat().includes(d("2028-02-29")));
});

test("consecutive months cross the year", () => {
  assert.deepEqual(buildMonths(d("2026-11-01"), 3).map((month) => [month.year, month.month]), [[2026, 11], [2026, 12], [2027, 1]]);
});

test("dayRole marks the ends and the nights between", () => {
  const start = d("2026-12-10");
  const end = d("2026-12-12");
  assert.equal(dayRole(d("2026-12-10"), start, end), "start");
  assert.equal(dayRole(d("2026-12-11"), start, end), "between");
  assert.equal(dayRole(d("2026-12-12"), start, end), "end");
  assert.equal(dayRole(d("2026-12-13"), start, end), "none");
  assert.equal(dayRole(d("2026-12-10"), start, undefined), "single");
  assert.equal(dayRole(d("2026-12-11"), start, undefined), "none");
  assert.equal(dayRole(d("2026-12-10"), undefined, undefined), "none");
});

test("clampDate keeps a date inside the selectable window", () => {
  assert.equal(clampDate(d("2026-01-01"), d("2026-10-10"), d("2028-09-30")), "2026-10-10");
  assert.equal(clampDate(d("2029-01-01"), d("2026-10-10"), d("2028-09-30")), "2028-09-30");
  assert.equal(clampDate(d("2027-01-01"), d("2026-10-10"), d("2028-09-30")), "2027-01-01");
});

test("dates read the same on server and browser", () => {
  assert.equal(formatDay(d("2026-12-10")), "10 thg 12");
  assert.equal(formatDayWithWeekday(d("2026-12-10")), "Th 5, 10 thg 12");
  assert.equal(formatDayWithWeekday(d("2026-12-13")), "CN, 13 thg 12");
  assert.equal(formatDayLong(d("2026-12-10")), "Thứ Năm, 10 tháng 12, 2026");
  assert.equal(formatMonth(2026, 12), "Tháng 12, 2026");
});

test("one-line summaries", () => {
  assert.equal(datesSummary(emptySearchForm), "Chọn ngày");
  assert.equal(datesSummary({ ...emptySearchForm, checkIn: d("2026-12-10") }), "10 thg 12 – …");
  assert.equal(staySummary(stay), "10 thg 12 – 12 thg 12 · 2 khách");
});
