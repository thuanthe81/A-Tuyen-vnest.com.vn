import assert from "node:assert/strict";
import { test } from "node:test";
import type { MockAvailabilityScenario, MockHandoffScenario } from "@/config/mock-scenarios";
import type { AvailabilityAnswer, OfferRef } from "@/domain/availability";
import { getPropertyOutcome } from "@/domain/availability";
import { getBookingReadiness } from "@/domain/booking";
import type { BookingIntent, HandoffContext } from "@/domain/booking";
import { parseIsoDate } from "@/domain/dates";
import type { DatedCriteria } from "@/domain/search";
import { createMockBookingProvider } from "@/integrations/booking/mock/provider";
import { unconnectedBookingProvider } from "@/integrations/booking/none/provider";
import { mockPropertyRecords } from "@/integrations/content/mock/records";
import { createPropertyRepository } from "@/integrations/content/repository";

const repository = createPropertyRepository(mockPropertyRecords, { enabledLocales: ["vi"] });
const criteria: DatedCriteria = { checkIn: parseIsoDate("2026-12-10")!, checkOut: parseIsoDate("2026-12-12")!, adults: 2 };
const context: HandoffContext = { locale: "vi", returnUrl: "http://localhost:3000/stays/co-so-mau-a" };
const A = "prop-mock-a";
const ALL = ["a", "b", "c", "d", "e", "f"].map((key) => `prop-mock-${key}`);
const ROOM_1 = "room-mock-a1";

function provider(availabilityScenario: MockAvailabilityScenario = "mixed", handoffScenario: MockHandoffScenario = "not-integrated") {
  return createMockBookingProvider({
    properties: repository,
    availabilityScenario,
    handoffScenario,
    engineUrl: "http://localhost:3000/dev/mock-booking-engine",
  });
}

async function answer(scenario: MockAvailabilityScenario, request = criteria, propertyIds = [A]): Promise<AvailabilityAnswer> {
  const result = await provider(scenario).searchAvailability({ criteria: request, scope: propertyIds.length === 1 ? "single-property" : "all-properties", propertyIds });
  assert.equal(result.status, "ok");
  return result as AvailabilityAnswer;
}

test("repository resolves properties to plain strings in an enabled language", async () => {
  const property = await repository.getProperty("co-so-mau-a", "vi");
  assert.equal(property?.identity.name, "Cơ sở mẫu A");
  assert.equal(property?.place.area.name, "Địa điểm mẫu 1");
  assert.equal(await repository.getProperty("co-so-mau-a", "en"), undefined);
  assert.equal(await repository.getProperty("missing", "vi"), undefined);
});

test("repository filters by destination and lists each area once", async () => {
  assert.equal((await repository.listProperties("vi")).length, 6);
  const inArea1 = await repository.listProperties("vi", { destination: "dia-diem-mau-1" });
  assert.deepEqual(inArea1.map((property) => property.slug), ["co-so-mau-a", "co-so-mau-c"]);
  assert.deepEqual((await repository.listLocations("vi")).map((area) => area.name), ["Địa điểm mẫu 1", "Địa điểm mẫu 2", "Địa điểm mẫu 3"]);
  assert.deepEqual(await repository.listProperties("en"), []);
});

test("booking targets carry identifiers and capacities only", async () => {
  assert.deepEqual(await repository.getBookingTarget(A, "mock"), {
    propertyId: A,
    timeZone: "Asia/Ho_Chi_Minh",
    rooms: [
      { roomTypeId: ROOM_1, maxOccupancy: 2 },
      { roomTypeId: "room-mock-a2", maxOccupancy: 4 },
    ],
    mapping: { propertyRef: "MOCK-A", roomRefs: { "room-mock-a1": "MOCK-A-1", "room-mock-a2": "MOCK-A-2" } },
  });
  assert.equal((await repository.getBookingTarget(A, "another-provider"))?.mapping, undefined);
  assert.equal(await repository.getBookingTarget("missing", "mock"), undefined);
});

test("mock availability: every answer is marked as mock and echoes the criteria", async () => {
  const mixed = await answer("mixed");
  assert.equal(mixed.source, "mock");
  assert.deepEqual(mixed.criteria, criteria);
  assert.deepEqual(mixed.items[0]?.rooms.map((room) => [room.status, room.offers.length]), [["available", 1], ["sold-out", 0]]);
});

test("mock availability: scenarios", async () => {
  const all = await answer("all-available");
  assert.deepEqual(all.items[0]?.rooms.map((room) => [room.status, room.offers.length]), [["available", 2], ["available", 2]]);
  assert.ok(all.items[0]?.rooms.every((room) => room.offers.every((offer) => offer.price.kind === "not-provided")));

  const rated = await answer("with-rates");
  assert.deepEqual(rated.items[0]?.rooms[0]?.offers[0]?.price, {
    kind: "dated",
    total: { amount: 2_000_000, currency: "VND" },
    nights: 2,
    taxesAndFees: "unknown",
  });

  const soldOut = await answer("sold-out");
  assert.ok(soldOut.items[0]?.rooms.every((room) => room.status === "sold-out" && room.offers.length === 0));

  assert.deepEqual(await provider("error").searchAvailability({ criteria, scope: "single-property", propertyIds: [A] }), { status: "error", reason: "provider", retryable: true });
  assert.deepEqual(await provider("timeout").searchAvailability({ criteria, scope: "single-property", propertyIds: [A] }), { status: "error", reason: "timeout", retryable: true });
});

test("mock availability: a room is never offered to more guests than it takes", async () => {
  const three = await answer("all-available", { ...criteria, adults: 3 });
  assert.deepEqual(three.items[0]?.rooms[0], { roomTypeId: ROOM_1, status: "unknown", offers: [], maxOccupancy: 2 });
  assert.equal(three.items[0]?.rooms[1]?.status, "available");
});

test("mock availability: a search across all properties answers for each of the six fixtures", async () => {
  const result = await answer("mixed", criteria, ALL);
  assert.deepEqual(result.items.map((item) => item.propertyId), ALL);
  assert.equal(result.failures, undefined);
});

test("mock availability: an unmapped or unknown property gets no answer", async () => {
  // A record with no mapping to this provider stands for a property that cannot be booked online yet.
  const unmapped = { ...mockPropertyRecords[2]!, booking: { providers: {} } };
  const withUnmapped = createPropertyRepository([mockPropertyRecords[0]!, unmapped], { enabledLocales: ["vi"] });
  const result = await createMockBookingProvider({ properties: withUnmapped, availabilityScenario: "all-available", handoffScenario: "not-integrated", engineUrl: "http://localhost:3000/dev/mock-booking-engine" }).searchAvailability({
    criteria,
    scope: "all-properties",
    propertyIds: [A, unmapped.id, "missing"],
  });
  if (result.status !== "ok") return assert.fail("expected an answer");
  assert.deepEqual(result.items.map((item) => item.propertyId), [A]);
  assert.equal(getPropertyOutcome(result, unmapped.id).kind, "no-answer");
});

test("mock availability: answers are stamped, and only the stale-prices scenario states a validity", async () => {
  const at = new Date("2026-10-08T09:00:00Z");
  const stamped = (scenario: MockAvailabilityScenario) =>
    createMockBookingProvider({ properties: repository, availabilityScenario: scenario, handoffScenario: "not-integrated", engineUrl: "http://localhost:3000/x", now: () => at }).searchAvailability({
      criteria,
      scope: "single-property",
      propertyIds: [A],
    });
  const rated = await stamped("with-rates");
  assert.equal(rated.status === "ok" && rated.fetchedAt, "2026-10-08T09:00:00.000Z");
  assert.equal(rated.status === "ok" && rated.validUntil, undefined);
  const expiring = await stamped("stale-prices");
  assert.equal(expiring.status === "ok" && expiring.validUntil, "2026-10-08T09:00:20.000Z");
});

test("mock availability: only some properties available, and a property behaves the same asked for alone", async () => {
  const partial = await answer("partial-availability", criteria, ALL);
  const available = partial.items.filter((item) => item.rooms.some((room) => room.status === "available")).map((item) => item.propertyId);
  assert.deepEqual(available, ["prop-mock-a", "prop-mock-c", "prop-mock-e"]);
  const soldOut = partial.items.filter((item) => item.rooms.every((room) => room.status === "sold-out")).map((item) => item.propertyId);
  assert.deepEqual(soldOut, ["prop-mock-b", "prop-mock-d", "prop-mock-f"]);

  // The same offer at the same simulated price, whether the property was asked for alone or with the others.
  const together = (await answer("with-rates", criteria, ALL)).items.find((item) => item.propertyId === "prop-mock-d");
  const alone = (await answer("with-rates", criteria, ["prop-mock-d"])).items[0];
  assert.deepEqual(alone, together);
  assert.equal(alone?.rooms[0]?.offers.length, 4, "the fourth fixture has more rate plans than a room shows at once");
});

test("mock availability: a failed property is never among the answered ones, and answers when retried alone", async () => {
  const result = await answer("partial-failure", criteria, ALL);
  assert.deepEqual(result.failures, [{ propertyId: "prop-mock-c", reason: "provider", retryable: true }]);
  assert.equal(result.items.some((item) => item.propertyId === "prop-mock-c"), false);
  assert.deepEqual(ALL.map((id) => getPropertyOutcome(result, id).kind), ["answered", "answered", "failed", "answered", "no-answer", "answered"]);
  const retried = await answer("partial-failure", criteria, ["prop-mock-c"]);
  assert.equal(getPropertyOutcome(retried, "prop-mock-c").kind, "answered");
});

test("mock availability: simulated terms say they are simulated, and no-answer claims nothing", async () => {
  const rated = await answer("with-rates");
  const texts = rated.items.flatMap((item) => item.rooms.flatMap((room) => room.offers.flatMap((offer) => [offer.ratePlan?.name, offer.cancellationPolicy, offer.paymentTerms, ...(offer.ratePlan?.inclusions ?? [])])));
  assert.ok(texts.filter((text): text is string => text !== undefined).every((text) => /mẫu|mô phỏng/.test(text)));
  const silent = await answer("no-answer", criteria, ALL);
  assert.deepEqual(silent.items, []);
});

test("mock answers read as simulated in the domain, never bookable", async () => {
  const availability = await answer("mixed");
  const readiness = getBookingReadiness({ propertyId: A, roomTypeId: ROOM_1, criteria, issues: [], availability, maxOccupancy: 2 });
  assert.equal(readiness.kind, "simulated");
  const choose = getBookingReadiness({ propertyId: A, roomTypeId: ROOM_1, criteria, issues: [], availability: await answer("all-available") });
  assert.equal(choose.kind, "select-rate");
});

test("mock hand-off: each scenario, and capabilities that match it", async () => {
  const offerRef = (await answer("mixed")).items[0]!.rooms[0]!.offers[0]!.offerRef;
  const intent: BookingIntent = { propertyId: A, roomTypeId: ROOM_1, criteria, offerRef };
  const begin = (scenario: MockHandoffScenario) => provider("mixed", scenario).beginBooking(intent, context);

  assert.deepEqual(await begin("not-integrated"), { kind: "not-integrated" });
  assert.deepEqual(await begin("offer-expired"), { kind: "unavailable", reason: "offer-expired" });
  assert.deepEqual(await begin("error"), { kind: "error", reason: "provider", retryable: true });
  assert.equal((await begin("native")).kind, "native");

  const redirect = await begin("redirect");
  assert.equal(redirect.kind, "redirect");
  if (redirect.kind === "redirect") {
    const url = new URL(redirect.url);
    assert.equal(url.pathname, "/dev/mock-booking-engine");
    assert.equal(url.searchParams.get("offer"), offerRef);
    assert.equal(url.searchParams.get("return"), context.returnUrl);
  }
  assert.equal((await begin("embedded")).kind, "embedded");

  assert.deepEqual(provider("mixed", "not-integrated").capabilities.handoff, []);
  assert.deepEqual(provider("mixed", "embedded").capabilities.handoff, ["embedded"]);
  assert.equal(provider("with-rates").capabilities.rates, true);
  assert.equal(provider("mixed").capabilities.rates, false);
});

test("mock hand-off: an offer reference it did not issue for that room is refused", async () => {
  const intent: BookingIntent = { propertyId: A, roomTypeId: ROOM_1, criteria, offerRef: "forged" as OfferRef };
  assert.deepEqual(await provider("mixed", "redirect").beginBooking(intent, context), { kind: "unavailable", reason: "offer-expired" });
});

test("no provider connected: nothing is claimed and nothing can be booked", async () => {
  assert.deepEqual(unconnectedBookingProvider.capabilities.handoff, []);
  assert.deepEqual(await unconnectedBookingProvider.searchAvailability({ criteria, scope: "single-property", propertyIds: [A] }), {
    status: "error",
    reason: "not-configured",
    retryable: false,
  });
  const intent: BookingIntent = { propertyId: A, roomTypeId: ROOM_1, criteria, offerRef: "x" as OfferRef };
  assert.deepEqual(await unconnectedBookingProvider.beginBooking(intent, context), { kind: "not-integrated" });
});
