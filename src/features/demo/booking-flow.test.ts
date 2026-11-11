import assert from "node:assert/strict";
import { test } from "node:test";
import type { IsoDate } from "@/domain/dates";
import { demoBookingResultsUrl } from "./booking-flow";

const stay = (adults: number, property?: string) => ({
  criteria: { checkIn: "2026-12-10" as IsoDate, checkOut: "2026-12-12" as IsoDate, adults },
  filters: property ? { property } : {},
});
const query = (url: string) => new URL(url, "http://x").searchParams;

test("the combined field's rooms reach the results address; the room count is never changed for the guests", () => {
  const url = query(demoBookingResultsUrl(stay(3), { roomAdults: [2, 1] }));
  assert.equal(url.get("rooms"), "2,1");
  assert.equal(url.get("adults"), "3");
  assert.equal(query(demoBookingResultsUrl(stay(4), { roomAdults: [2, 1] })).get("rooms"), "2,2");
  assert.equal(query(demoBookingResultsUrl(stay(2), { roomAdults: [2] })).get("rooms"), "1", "one room stays rooms=1");
  // 3 guests in the field's one room (an outdated address): rooms and guests travel as they are, for the results page to correct.
  const over = query(demoBookingResultsUrl(stay(3), { roomAdults: [2] }));
  assert.equal(over.get("rooms"), "1", "the guest's one room is kept");
  assert.equal(over.get("adults"), "3", "and so are the three guests");
});

test("without the combined field, the address's own rooms are kept as before", () => {
  assert.equal(query(demoBookingResultsUrl(stay(3), { contextQuery: { rooms: "1,2" } })).get("rooms"), "1,2");
  // No room count anywhere: the search starts at the fewest rooms that hold the guests (two per room).
  assert.equal(query(demoBookingResultsUrl(stay(2, "pepper-house"))).get("rooms"), "1");
  assert.equal(query(demoBookingResultsUrl(stay(3, "pepper-house"))).get("rooms"), "2,1");
});
