import assert from "node:assert/strict";
import { test } from "node:test";
import type { AvailabilityAnswer, AvailabilityResult, RoomAvailability } from "./availability.ts";
import { findRoomAvailability, getPriceFreshness, getPropertyOutcome, mergeAnswers } from "./availability.ts";
import { getBookingReadiness } from "./booking.ts";
import { parseIsoDate } from "./dates.ts";
import type { DatedCriteria } from "./search.ts";

const criteria: DatedCriteria = { checkIn: parseIsoDate("2026-12-10")!, checkOut: parseIsoDate("2026-12-12")!, adults: 2 };
const soldOut: RoomAvailability = { roomTypeId: "r1", status: "sold-out", offers: [] };
const answer = (extra: Partial<AvailabilityAnswer> = {}): AvailabilityAnswer => ({ status: "ok", criteria, source: "provider", items: [], ...extra });
const minute = 60_000;
const at = (iso: string) => Date.parse(iso);

test("an answer written before per-property outcomes existed still reads the same", () => {
  // Backward compatibility: no failures, no timestamps.
  const legacy = answer({ items: [{ propertyId: "p1", rooms: [soldOut] }] });
  assert.deepEqual(getPropertyOutcome(legacy, "p1"), { kind: "answered", rooms: [soldOut] });
  assert.deepEqual(getPropertyOutcome(legacy, "p2"), { kind: "no-answer" });
  assert.deepEqual(findRoomAvailability(legacy, "p1", "r1"), soldOut);
});

test("a failed search is a failure for every property, never an answer", () => {
  const failed: AvailabilityResult = { status: "error", reason: "timeout", retryable: true };
  assert.deepEqual(getPropertyOutcome(failed, "p1"), { kind: "failed", reason: "timeout", retryable: true });
  assert.equal(findRoomAvailability(failed, "p1", "r1"), undefined);
});

test("a property that failed is never read as sold out, even if rooms were sent for it too", () => {
  const contradictory = answer({
    items: [{ propertyId: "p1", rooms: [soldOut] }, { propertyId: "p2", rooms: [soldOut] }],
    failures: [{ propertyId: "p1", reason: "provider", retryable: true }],
  });
  assert.deepEqual(getPropertyOutcome(contradictory, "p1"), { kind: "failed", reason: "provider", retryable: true });
  assert.equal(findRoomAvailability(contradictory, "p1", "r1"), undefined);
  // The single readiness function agrees: not "unavailable", only "unverified".
  const readiness = (propertyId: string) => getBookingReadiness({ propertyId, roomTypeId: "r1", criteria, issues: [], availability: contradictory }).kind;
  assert.equal(readiness("p1"), "unverified");
  assert.equal(readiness("p2"), "unavailable");
});

test("freshness: fresh until the provider's validity passes or the answer grows too old, whichever is first", () => {
  const fetchedAt = "2026-10-08T09:00:00.000Z";
  const limits = { maxAgeMs: 15 * minute };
  assert.deepEqual(getPriceFreshness({ fetchedAt }, { ...limits, now: at(fetchedAt) + minute }), { kind: "fresh", staleAt: at(fetchedAt) + 15 * minute });
  assert.deepEqual(getPriceFreshness({ fetchedAt }, { ...limits, now: at(fetchedAt) + 15 * minute }), { kind: "stale", reason: "aged" });

  const validUntil = "2026-10-08T09:05:00.000Z";
  assert.deepEqual(getPriceFreshness({ fetchedAt, validUntil }, { ...limits, now: at(fetchedAt) + minute }), { kind: "fresh", staleAt: at(validUntil) });
  assert.deepEqual(getPriceFreshness({ fetchedAt, validUntil }, { ...limits, now: at(validUntil) }), { kind: "stale", reason: "expired" });
  // A long validity does not outlive the site's own age limit.
  assert.deepEqual(getPriceFreshness({ fetchedAt, validUntil: "2026-10-09T09:00:00.000Z" }, { ...limits, now: at(fetchedAt) + 16 * minute }), { kind: "stale", reason: "aged" });
});

test("freshness: an answer with no timestamp is not assumed fresh, and an unreadable validity counts as passed", () => {
  const context = { now: at("2026-10-08T09:00:00.000Z"), maxAgeMs: 15 * minute };
  assert.deepEqual(getPriceFreshness({}, context), { kind: "undated" });
  assert.deepEqual(getPriceFreshness({ fetchedAt: "yesterday" }, context), { kind: "undated" });
  assert.deepEqual(getPriceFreshness({ validUntil: "soon" }, context), { kind: "stale", reason: "expired" });
  // The moment the site received the answer stands in when the provider gives no time.
  assert.equal(getPriceFreshness({}, { ...context, obtainedAt: context.now - minute }).kind, "fresh");
  assert.deepEqual(getPriceFreshness({}, { ...context, obtainedAt: context.now - 20 * minute }), { kind: "stale", reason: "aged" });
});

test("merging a retried property replaces only that property and keeps the stricter timestamps", () => {
  const available: RoomAvailability = { roomTypeId: "r1", status: "available", offers: [] };
  const held = answer({
    items: [{ propertyId: "p1", rooms: [soldOut] }],
    failures: [{ propertyId: "p2", reason: "provider", retryable: true }, { propertyId: "p3", reason: "timeout", retryable: true }],
    fetchedAt: "2026-10-08T09:00:00.000Z",
    validUntil: "2026-10-08T09:10:00.000Z",
  });
  const later = answer({ items: [{ propertyId: "p2", rooms: [available] }], fetchedAt: "2026-10-08T09:03:00.000Z", validUntil: "2026-10-08T09:13:00.000Z" });
  const merged = mergeAnswers(held, later, ["p2"]);
  assert.deepEqual(merged?.items.map((item) => item.propertyId), ["p1", "p2"]);
  assert.deepEqual(merged?.failures, [{ propertyId: "p3", reason: "timeout", retryable: true }]);
  assert.equal(merged?.fetchedAt, "2026-10-08T09:00:00.000Z");
  assert.equal(merged?.validUntil, "2026-10-08T09:10:00.000Z");

  // A retry that fails again stays a failure, and one that says nothing clears the failure without inventing an answer.
  const failedAgain = mergeAnswers(held, answer({ failures: [{ propertyId: "p2", reason: "timeout", retryable: true }] }), ["p2"]);
  assert.equal(getPropertyOutcome(failedAgain!, "p2").kind, "failed");
  assert.equal(getPropertyOutcome(mergeAnswers(held, answer(), ["p2"])!, "p2").kind, "no-answer");
  assert.equal(mergeAnswers(held, answer(), ["p2"])?.fetchedAt, undefined, "an undated part makes the whole undated");
});

test("answers for another stay or another source are never merged", () => {
  const held = answer();
  assert.equal(mergeAnswers(held, answer({ criteria: { ...criteria, adults: 3 } }), ["p1"]), undefined);
  assert.equal(mergeAnswers(held, answer({ source: "mock" }), ["p1"]), undefined);
});
