import assert from "node:assert/strict";
import { test } from "node:test";
import type { AvailabilityAnswer } from "./availability.ts";
import { availabilityReducer, initialAvailabilityState } from "./availability-state.ts";
import { parseIsoDate } from "./dates.ts";
import type { DatedCriteria } from "./search.ts";

const first: DatedCriteria = { checkIn: parseIsoDate("2026-10-12")!, checkOut: parseIsoDate("2026-10-14")!, adults: 2 };
const second: DatedCriteria = { ...first, adults: 3 };
const answerFor = (criteria: DatedCriteria): AvailabilityAnswer => ({ status: "ok", criteria, items: [], source: "mock" });

test("request then answer", () => {
  const loading = availabilityReducer(initialAvailabilityState, { type: "requested", criteria: first });
  assert.deepEqual(loading, { kind: "loading", criteria: first });
  const ready = availabilityReducer(loading, { type: "settled", criteria: first, result: answerFor(first) });
  assert.deepEqual(ready, { kind: "ready", answer: answerFor(first) });
});

test("a failure keeps its reason and whether retrying can help", () => {
  const loading = availabilityReducer(initialAvailabilityState, { type: "requested", criteria: first });
  const failed = availabilityReducer(loading, {
    type: "settled",
    criteria: first,
    result: { status: "error", reason: "not-configured", retryable: false },
  });
  assert.deepEqual(failed, { kind: "failed", criteria: first, reason: "not-configured", retryable: false });
});

test("a late response for criteria the guest has changed is ignored", () => {
  let state = availabilityReducer(initialAvailabilityState, { type: "requested", criteria: first });
  state = availabilityReducer(state, { type: "requested", criteria: second });
  state = availabilityReducer(state, { type: "settled", criteria: first, result: answerFor(first) });
  assert.deepEqual(state, { kind: "loading", criteria: second });
  state = availabilityReducer(state, { type: "settled", criteria: second, result: answerFor(second) });
  assert.equal(state.kind, "ready");
});

test("a response after the search was cleared is ignored", () => {
  let state = availabilityReducer(initialAvailabilityState, { type: "requested", criteria: first });
  state = availabilityReducer(state, { type: "cleared" });
  state = availabilityReducer(state, { type: "settled", criteria: first, result: answerFor(first) });
  assert.deepEqual(state, { kind: "idle" });
});

test("an answer for other criteria than asked is a provider fault", () => {
  const loading = availabilityReducer(initialAvailabilityState, { type: "requested", criteria: first });
  const state = availabilityReducer(loading, { type: "settled", criteria: first, result: answerFor(second) });
  assert.deepEqual(state, { kind: "failed", criteria: first, reason: "provider", retryable: true });
});
