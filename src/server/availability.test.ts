import assert from "node:assert/strict";
import { test } from "node:test";
import { readEnv } from "@/config/env";
import { getPropertyOutcome } from "@/domain/availability";
import { checkAvailability } from "@/server/availability";
import { createServices } from "@/server/services";

const services = (overrides: Record<string, string> = {}) => createServices(readEnv(overrides));
// 09:00 UTC on 8 October 2026 is 16:00 the same day in Ho Chi Minh City.
const now = new Date("2026-10-08T09:00:00Z");
const ALL = ["a", "b", "c", "d", "e", "f"].map((key) => `prop-mock-${key}`);
const stay = { property: "co-so-mau-a", checkIn: "2026-12-10", checkOut: "2026-12-12" };

test("a property that cannot be read is a 400, an unknown one a 404", async () => {
  assert.deepEqual(await checkAvailability(services(), { property: "../etc" }, now), { status: 400, body: { error: "invalid-property" } });
  assert.deepEqual(await checkAvailability(services(), { property: "nowhere" }, now), { status: 404, body: { error: "unknown-property" } });
});

test("no property means all properties, never an error", async () => {
  for (const query of [{}, { property: "" }, { checkIn: stay.checkIn, checkOut: stay.checkOut }]) {
    const outcome = await checkAvailability(services(), query, now);
    assert.equal(outcome.status, 200);
    if (outcome.status !== 200) continue;
    assert.equal(outcome.body.scope, "all-properties");
    assert.deepEqual(outcome.body.propertyIds, ALL);
    assert.equal(outcome.body.today, "2026-10-08");
  }
});

test("a search across all properties asks the provider about every one of them", async () => {
  const outcome = await checkAvailability(services(), { checkIn: stay.checkIn, checkOut: stay.checkOut }, now);
  assert.equal(outcome.status, 200);
  if (outcome.status !== 200 || outcome.body.result?.status !== "ok") return assert.fail("expected an answer");
  assert.deepEqual(outcome.body.result.items.map((item) => item.propertyId), ALL);
});

test("a selected property restricts the search to that property", async () => {
  const outcome = await checkAvailability(services(), stay, now);
  assert.equal(outcome.status, 200);
  if (outcome.status !== 200 || outcome.body.result?.status !== "ok") return assert.fail("expected an answer");
  assert.equal(outcome.body.scope, "single-property");
  assert.deepEqual(outcome.body.propertyIds, ["prop-mock-a"]);
  assert.deepEqual(outcome.body.result.items.map((item) => item.propertyId), ["prop-mock-a"]);
});

test("without dates nothing is asked of the provider", async () => {
  const outcome = await checkAvailability(services(), { property: "co-so-mau-a" }, now);
  assert.equal(outcome.status, 200);
  if (outcome.status !== 200) return;
  assert.deepEqual(outcome.body.criteria, { adults: 2 });
  assert.deepEqual(outcome.body.issues, []);
  assert.equal(outcome.body.today, "2026-10-08");
  assert.equal(outcome.body.result, undefined);
});

test("valid dates return the provider's answer and its capabilities", async () => {
  const outcome = await checkAvailability(services(), stay, now);
  assert.equal(outcome.status, 200);
  if (outcome.status !== 200) return;
  assert.deepEqual(outcome.body.propertyIds, ["prop-mock-a"]);
  assert.equal(outcome.body.result?.status, "ok");
  assert.equal(outcome.body.capabilities.availability, true);
  if (outcome.body.result?.status === "ok") assert.equal(outcome.body.result.source, "mock");
});

test("invalid criteria are reported and never sent to the provider", async () => {
  const past = await checkAvailability(services(), { ...stay, checkIn: "2026-10-07", checkOut: "2026-10-09" }, now);
  const malformed = await checkAvailability(services(), { ...stay, checkOut: "soon" }, now);
  for (const outcome of [past, malformed]) {
    assert.equal(outcome.status, 200);
    if (outcome.status === 200) assert.equal(outcome.body.result, undefined);
  }
  if (past.status === 200) assert.deepEqual(past.body.issues, [{ code: "check-in-in-past" }]);
  if (malformed.status === 200) {
    assert.deepEqual(malformed.body.issues, [
      { code: "malformed-date", field: "checkOut" },
      { code: "missing-date", field: "checkOut" },
    ]);
  }
});

test("a property with no known timezone gets no past-date judgement", async () => {
  const outcome = await checkAvailability(services(), { property: "co-so-mau-b", checkIn: "2020-01-01", checkOut: "2020-01-03" }, now);
  assert.equal(outcome.status, 200);
  if (outcome.status !== 200) return;
  assert.equal(outcome.body.today, undefined);
  assert.deepEqual(outcome.body.issues, []);
});

test("provider failure is a value in a 200 response, not an HTTP error", async () => {
  const failed = await checkAvailability(services({ MOCK_AVAILABILITY_SCENARIO: "error" }), stay, now);
  assert.equal(failed.status, 200);
  if (failed.status === 200) assert.deepEqual(failed.body.result, { status: "error", reason: "provider", retryable: true });

  const unconnected = await checkAvailability(services({ BOOKING_PROVIDER: "none" }), stay, now);
  if (unconnected.status === 200) {
    assert.deepEqual(unconnected.body.result, { status: "error", reason: "not-configured", retryable: false });
    assert.equal(unconnected.body.capabilities.availability, false);
  }
});

test("with CONTENT_SOURCE=files and no real records yet, no property exists", async () => {
  const outcome = await checkAvailability(services({ CONTENT_SOURCE: "files" }), stay, now);
  assert.equal(outcome.status, 404);
  const all = await checkAvailability(services({ CONTENT_SOURCE: "files" }), { checkIn: stay.checkIn, checkOut: stay.checkOut }, now);
  assert.equal(all.status, 200);
  if (all.status === 200) {
    assert.deepEqual(all.body.propertyIds, []);
    assert.equal(all.body.result, undefined, "with no properties the provider is not asked");
  }
});

test("every response says when it was served, and a mock answer when it was produced", async () => {
  const browse = await checkAvailability(services(), {}, now);
  assert.equal(browse.status === 200 && browse.body.servedAt, "2026-10-08T09:00:00.000Z");
  const outcome = await checkAvailability(services(), stay, now);
  if (outcome.status !== 200 || outcome.body.result?.status !== "ok") return assert.fail("expected an answer");
  assert.equal(outcome.body.servedAt, "2026-10-08T09:00:00.000Z");
  assert.ok(!Number.isNaN(Date.parse(outcome.body.result.fetchedAt ?? "")));
});

test("one property failing is reported for that property and hides none of the others", async () => {
  const outcome = await checkAvailability(services({ MOCK_AVAILABILITY_SCENARIO: "partial-failure" }), { checkIn: stay.checkIn, checkOut: stay.checkOut }, now);
  if (outcome.status !== 200 || outcome.body.result?.status !== "ok") return assert.fail("expected an answer");
  const { result } = outcome.body;
  assert.deepEqual(result.failures, [{ propertyId: "prop-mock-c", reason: "provider", retryable: true }]);
  assert.deepEqual(result.items.map((item) => item.propertyId), ["prop-mock-a", "prop-mock-b", "prop-mock-d", "prop-mock-f"]);
  assert.deepEqual(ALL.map((id) => getPropertyOutcome(result, id).kind), ["answered", "answered", "failed", "answered", "no-answer", "answered"]);
});

test("a provider that does not answer in time becomes a timeout, never an endless wait and never 'sold out'", async () => {
  const base = services();
  const silent = { ...base, booking: { ...base.booking, searchAvailability: () => new Promise<never>(() => undefined) } };
  const outcome = await checkAvailability(silent, stay, now, 10);
  assert.equal(outcome.status, 200);
  if (outcome.status === 200) assert.deepEqual(outcome.body.result, { status: "error", reason: "timeout", retryable: true });
});

test("client-draft content with no provider: Bare Chic is known and honestly not connected", async () => {
  const draft = services({ DEPLOY_ENV: "development", CONTENT_SOURCE: "client-draft", BOOKING_PROVIDER: "none" });
  const outcome = await checkAvailability(draft, { property: "bare-chic", checkIn: stay.checkIn, checkOut: stay.checkOut, adults: "2" }, now);
  assert.equal(outcome.status, 200);
  if (outcome.status !== 200) return;
  assert.deepEqual(outcome.body.propertyIds, ["bare-chic"]);
  assert.deepEqual(outcome.body.result, { status: "error", reason: "not-configured", retryable: false }, "nothing about availability or price is simulated");
  // The mock content is not served alongside the drafts.
  assert.deepEqual(await checkAvailability(draft, { property: "co-so-mau-a" }, now), { status: 404, body: { error: "unknown-property" } });
});
