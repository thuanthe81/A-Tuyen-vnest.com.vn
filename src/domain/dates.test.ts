import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, addMonths, dayOfWeek, firstOfMonth, isBefore, lastOfMonth, nightsBetween, parseIsoDate } from "./dates.ts";
import type { IsoDate } from "./dates.ts";

const d = (value: string): IsoDate => {
  const parsed = parseIsoDate(value);
  assert.ok(parsed, `expected ${value} to be a valid date`);
  return parsed;
};

test("parseIsoDate accepts real calendar dates only", () => {
  assert.equal(parseIsoDate("2026-10-12"), "2026-10-12");
  assert.equal(parseIsoDate("2028-02-29"), "2028-02-29");
  assert.equal(parseIsoDate("2026-02-29"), undefined);
  assert.equal(parseIsoDate("2100-02-29"), undefined);
  assert.equal(parseIsoDate("2026-13-01"), undefined);
  assert.equal(parseIsoDate("2026-04-31"), undefined);
  assert.equal(parseIsoDate("2026-10-00"), undefined);
});

test("parseIsoDate rejects other formats, including timestamps", () => {
  for (const value of ["", "12/10/2026", "2026-1-5", "2026-10-12T00:00:00Z", " 2026-10-12", "20261012"]) {
    assert.equal(parseIsoDate(value), undefined, value);
  }
});

test("nightsBetween counts calendar nights", () => {
  assert.equal(nightsBetween(d("2026-10-12"), d("2026-10-14")), 2);
  assert.equal(nightsBetween(d("2026-12-30"), d("2027-01-02")), 3);
  assert.equal(nightsBetween(d("2028-02-28"), d("2028-03-01")), 2);
  assert.equal(nightsBetween(d("2027-02-28"), d("2027-03-01")), 1);
  assert.equal(nightsBetween(d("2026-10-14"), d("2026-10-12")), -2);
  assert.equal(nightsBetween(d("2026-10-12"), d("2026-10-12")), 0);
});

test("nightsBetween is unaffected by daylight-saving changes", () => {
  // Ranges that cross DST transitions in zones that observe them.
  assert.equal(nightsBetween(d("2026-03-07"), d("2026-03-09")), 2);
  assert.equal(nightsBetween(d("2026-10-24"), d("2026-10-26")), 2);
  assert.equal(nightsBetween(d("2026-01-01"), d("2027-01-01")), 365);
  assert.equal(nightsBetween(d("2028-01-01"), d("2029-01-01")), 366);
});

test("isBefore compares calendar order", () => {
  assert.equal(isBefore(d("2026-10-12"), d("2026-10-13")), true);
  assert.equal(isBefore(d("2026-10-13"), d("2026-10-12")), false);
  assert.equal(isBefore(d("2026-10-12"), d("2026-10-12")), false);
});

test("addDays crosses months, years and leap days, and inverts nightsBetween", () => {
  assert.equal(addDays(d("2026-12-30"), 3), "2027-01-02");
  assert.equal(addDays(d("2028-02-28"), 1), "2028-02-29");
  assert.equal(addDays(d("2027-02-28"), 1), "2027-03-01");
  assert.equal(addDays(d("2026-03-01"), -1), "2026-02-28");
  assert.equal(addDays(d("2026-10-12"), 0), "2026-10-12");
  let date = d("2024-01-01");
  for (let step = 0; step < 1500; step += 1) {
    const next = addDays(date, 1);
    assert.equal(nightsBetween(date, next), 1);
    assert.ok(parseIsoDate(next), next);
    date = next;
  }
  assert.equal(date, "2028-02-09");
});

test("dayOfWeek counts from Monday", () => {
  assert.equal(dayOfWeek(d("1970-01-01")), 3); // Thursday
  assert.equal(dayOfWeek(d("2026-10-12")), 0); // Monday
  assert.equal(dayOfWeek(d("2026-10-18")), 6); // Sunday
  assert.equal(dayOfWeek(d("2028-02-29")), 1); // Tuesday
});

test("month helpers", () => {
  assert.equal(firstOfMonth(d("2026-10-12")), "2026-10-01");
  assert.equal(lastOfMonth(d("2028-02-10")), "2028-02-29");
  assert.equal(lastOfMonth(d("2026-04-10")), "2026-04-30");
  assert.equal(addMonths(d("2026-11-20"), 1), "2026-12-01");
  assert.equal(addMonths(d("2026-11-20"), 2), "2027-01-01");
  assert.equal(addMonths(d("2026-01-31"), -1), "2025-12-01");
  assert.equal(addMonths(d("2026-10-12"), 0), "2026-10-01");
});
