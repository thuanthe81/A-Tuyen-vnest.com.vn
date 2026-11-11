import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_SIGNATURE_AMENITIES, toPropertyCardModel } from "@/components/property-card/model";
import type { MockAvailabilityScenario } from "@/config/mock-scenarios";
import type { AvailabilityAnswer, AvailabilityResult, OfferRef, RateOffer, RoomAvailability } from "@/domain/availability";
import { parseIsoDate } from "@/domain/dates";
import type { DatedCriteria } from "@/domain/search";
import { createMockBookingProvider } from "@/integrations/booking/mock/provider";
import { mockPropertyRecords } from "@/integrations/content/mock/records";
import { createPropertyRepository } from "@/integrations/content/repository";
import type { PropertyStay, RoomContent } from "./derive";
import { averagePerNight, canSortByPrice, derivePropertyStay, deriveRoomStays, findSelected, initialLayout, lowestOffer, orderStays, summarizeStays, unpricedRoomAction } from "./derive";
import { formatMoney } from "./format";
import { toRoomViews } from "./view-models";

const criteria: DatedCriteria = { checkIn: parseIsoDate("2026-12-10")!, checkOut: parseIsoDate("2026-12-13")!, adults: 2 };
const offer = (ref: string, amount?: number, currency = "VND"): RateOffer => ({
  offerRef: ref as OfferRef,
  price: amount === undefined ? { kind: "not-provided" } : { kind: "dated", total: { amount, currency }, nights: 3, taxesAndFees: "unknown" },
});
const room = (roomTypeId: string, status: RoomAvailability["status"], offers: RateOffer[] = [], maxOccupancy?: number): RoomAvailability => ({
  roomTypeId,
  status,
  offers,
  ...(maxOccupancy !== undefined ? { maxOccupancy } : {}),
});
const answer = (rooms: RoomAvailability[], extra: Partial<AvailabilityAnswer> = {}): AvailabilityAnswer => ({ status: "ok", criteria, source: "provider", items: [{ propertyId: "p", rooms }], ...extra });
const content: RoomContent[] = [{ id: "r1", name: "One", maxOccupancy: 2 }, { id: "r2", name: "Two", maxOccupancy: 4 }];
const property = { id: "p", rooms: content };
const stay = (result: AvailabilityResult, adults = 2) => derivePropertyStay(result, property, adults);

test("available: the 'from' price is the lowest total among bookable offers, with the room it belongs to", () => {
  const derived = stay(answer([room("r1", "available", [offer("a", 3_600_000), offer("b", 3_300_000)]), room("r2", "available", [offer("c", 3_000_000), offer("d")])]));
  assert.equal(derived.status, "available");
  assert.deepEqual(derived.from, { price: { kind: "dated", total: { amount: 3_000_000, currency: "VND" }, nights: 3, taxesAndFees: "unknown" }, roomTypeId: "r2", offerRef: "c" });
});

test("available without a reliable price: no figure is produced, and none is estimated", () => {
  assert.deepEqual(stay(answer([room("r1", "available", [offer("a")])])), { propertyId: "p", retryable: false, status: "available" });
  // Offers in different currencies cannot be compared, so there is no "from".
  const mixed = stay(answer([room("r1", "available", [offer("a", 100, "USD")]), room("r2", "available", [offer("b", 3_000_000)])]));
  assert.equal(mixed.status, "available");
  assert.equal(mixed.from, undefined);
  assert.equal(lowestOffer([offer("a", 100, "USD"), offer("b", 3_000_000)]), undefined);
});

test("sold out only when the provider said so for every room", () => {
  assert.equal(stay(answer([room("r1", "sold-out"), room("r2", "sold-out")])).status, "sold-out");
  // An answer with no rooms, or with a room it is unsure about, is not sold out.
  assert.deepEqual(stay(answer([])), { propertyId: "p", retryable: false, status: "unknown", detail: "no-offer" });
  assert.equal(stay(answer([room("r1", "sold-out"), room("r2", "unknown")])).status, "unknown");
  assert.equal(stay(answer([room("r1", "available")])).detail, "no-offer", "available with no offer cannot be booked");
});

test("a failed PMS request is never presented as sold out", () => {
  const wholeFailure: AvailabilityResult = { status: "error", reason: "timeout", retryable: true };
  assert.deepEqual(stay(wholeFailure), { propertyId: "p", retryable: true, status: "error", failure: "timeout" });

  // Even when the provider also sent sold-out rooms for the property that failed.
  const partial = answer([room("r1", "sold-out"), room("r2", "sold-out")], { failures: [{ propertyId: "p", reason: "provider", retryable: true }] });
  assert.deepEqual(stay(partial), { propertyId: "p", retryable: true, status: "error", failure: "provider" });
  assert.deepEqual(deriveRoomStays(partial, property, 2).map((entry) => entry.kind), ["unverified", "unverified"]);

  for (const result of [wholeFailure, partial, answer([], { items: [] })]) assert.notEqual(stay(result).status, "sold-out");
});

test("unknown: no answer, not connected, and a party no room can take, each with its own reason", () => {
  assert.deepEqual(stay(answer([], { items: [] })), { propertyId: "p", retryable: false, status: "unknown", detail: "no-answer" });
  assert.deepEqual(stay({ status: "error", reason: "not-configured", retryable: false }), { propertyId: "p", retryable: false, status: "unknown", detail: "not-connected" });
  const five = stay(answer([room("r1", "unknown", [], 2), room("r2", "available", [offer("a", 1)], 4)]), 5);
  assert.deepEqual(five, { propertyId: "p", retryable: false, status: "unknown", detail: "over-capacity", largestRoom: 4 });
});

test("capacity is judged before availability: an offer for a party the room cannot take is never counted", () => {
  // The provider says available for 3, but VNest's record says the room takes 2.
  const derived = stay(answer([room("r1", "available", [offer("a", 1_000_000)]), room("r2", "available", [offer("b", 2_000_000)])]), 3);
  assert.equal(derived.from?.roomTypeId, "r2");
  assert.deepEqual(deriveRoomStays(answer([room("r1", "available", [offer("a", 1_000_000)])]), property, 3).map((entry) => entry.kind), ["over-capacity", "unverified"]);
});

const stays = (statuses: [string, PropertyStay["status"], number?][]): PropertyStay[] =>
  statuses.map(([propertyId, status, amount]) => ({
    propertyId,
    status,
    retryable: false,
    ...(amount !== undefined ? { from: { price: { kind: "dated", total: { amount, currency: "VND" }, nights: 3, taxesAndFees: "unknown" }, roomTypeId: "r", offerRef: "o" as OfferRef } } : {}),
  }));

test("order: available first, then unchecked, confirmed sold out last, VNest's order inside each group", () => {
  const list = stays([["a", "sold-out"], ["b", "available", 5], ["c", "error"], ["d", "available", 3], ["e", "unknown"], ["f", "sold-out"]]);
  assert.deepEqual(orderStays(list).map((entry) => entry.propertyId), ["b", "d", "c", "e", "a", "f"]);
  assert.deepEqual(summarizeStays(list), { available: 2, soldOut: 2, unchecked: 2, total: 6 });
});

test("sorting by price reorders only available properties, and those without a price keep their place after", () => {
  const list = stays([["a", "available", 5], ["b", "available"], ["c", "available", 3], ["d", "sold-out"], ["e", "available", 3]]);
  assert.deepEqual(orderStays(list, "price").map((entry) => entry.propertyId), ["c", "e", "a", "b", "d"]);
  assert.equal(canSortByPrice(list), true);
  assert.equal(canSortByPrice(stays([["a", "available", 5], ["b", "available"]])), false, "one price is nothing to sort");
});

test("rooms: bookable ones first with their rates, the rest after with the reason", () => {
  const result = answer([room("r1", "sold-out"), { ...room("r2", "available", [offer("a", 1), offer("b", 2)]), unitsLeft: 2 }]);
  const rooms = deriveRoomStays(result, property, 2);
  assert.deepEqual(rooms.map((entry) => [entry.kind, entry.room.id]), [["rates", "r2"], ["sold-out", "r1"]]);
  assert.equal(rooms[0]?.kind === "rates" && rooms[0].unitsLeft, 2);
  assert.deepEqual(deriveRoomStays(result, { id: "p", rooms: [...content].reverse() }, 2).map((entry) => entry.room.id), ["r2", "r1"]);
});

test("a chosen rate is found only while the current answer still holds it", () => {
  const before = deriveRoomStays(answer([room("r1", "available", [offer("a", 1), offer("b", 2)])]), property, 2);
  const selection = { kind: "rate", roomTypeId: "r1", offerRef: "b" as OfferRef } as const;
  const found = findSelected(before, selection);
  assert.equal(found?.kind === "rate" && found.offer.offerRef, "b");
  const refreshed = deriveRoomStays(answer([room("r1", "available", [offer("a", 1)])]), property, 2);
  assert.equal(findSelected(refreshed, selection), undefined, "the offer expired with the refresh");
  assert.equal(findSelected(before, { ...selection, roomTypeId: "r2" }), undefined, "an offer belongs to one room");
  assert.equal(findSelected(before, undefined), undefined);
});

test("an offer without a verified price is never a rate: the room is unpriced, and nothing about it can be chosen as a rate", () => {
  const rooms = deriveRoomStays(answer([room("r1", "available", [offer("a"), offer("b")]), room("r2", "available", [offer("c", 5), offer("d")])]), property, 2);
  assert.deepEqual(rooms.map((entry) => [entry.kind, entry.room.id]), [["rates", "r2"], ["unpriced", "r1"]]);
  const priced = rooms[0];
  assert.deepEqual(priced?.kind === "rates" && [priced.offers.map((entry) => entry.offerRef), priced.unpriced.map((entry) => entry.offerRef)], [["c"], ["d"]]);

  // Choosing an unpriced offer as if it were a rate finds nothing, in either kind of room.
  assert.equal(findSelected(rooms, { kind: "rate", roomTypeId: "r1", offerRef: "a" as OfferRef }), undefined);
  assert.equal(findSelected(rooms, { kind: "rate", roomTypeId: "r2", offerRef: "d" as OfferRef }), undefined);
  // The room itself can be chosen, and is reported as a room with no offer and no price attached.
  assert.deepEqual(findSelected(rooms, { kind: "room", roomTypeId: "r1" }), { kind: "room", room: content[0] });
  // A room that has verified rates is chosen by rate, never as a bare room.
  assert.equal(findSelected(rooms, { kind: "room", roomTypeId: "r2" }), undefined);
});

test("what can be done with an unpriced room follows the provider's declared capabilities, not a hope", () => {
  assert.equal(unpricedRoomAction({ handoff: [] }), "none");
  assert.equal(unpricedRoomAction(undefined), "none");
  assert.equal(unpricedRoomAction({ handoff: ["redirect"] }), "select-room");
});

test("the initial layout is fixed from the first answer: available, then unchecked, sold out apart", () => {
  const list = stays([["a", "sold-out"], ["b", "available", 5], ["c", "error"], ["d", "available", 3], ["e", "unknown"], ["f", "sold-out"]]);
  assert.deepEqual(initialLayout(list), { listed: ["b", "d", "c", "e"], soldOut: ["a", "f"] });
});

test("money and averages: totals as supplied, and the nightly figure only as a labelled average", () => {
  assert.equal(formatMoney({ amount: 3_000_000, currency: "VND" }), "3.000.000 ₫");
  assert.equal(formatMoney({ amount: 950, currency: "VND" }), "950 ₫");
  assert.equal(formatMoney({ amount: 1250.5, currency: "USD" }), "1.250,5 USD");
  assert.equal(averagePerNight({ kind: "dated", total: { amount: 3_500_000, currency: "VND" }, nights: 3, taxesAndFees: "unknown" }), 1_166_667);
  assert.equal(averagePerNight({ kind: "dated", total: { amount: 1_000_000, currency: "VND" }, nights: 1, taxesAndFees: "unknown" }), undefined);
});

// ---- The same rules against the six development fixtures and every mock scenario ----

const repository = createPropertyRepository(mockPropertyRecords, { enabledLocales: ["vi"] });

async function scenario(name: MockAvailabilityScenario, adults = 2) {
  const properties = await repository.listProperties("vi");
  const provider = createMockBookingProvider({ properties: repository, availabilityScenario: name, handoffScenario: "not-integrated", engineUrl: "http://localhost:3000/x" });
  const result = await provider.searchAvailability({ criteria: { ...criteria, adults }, scope: "all-properties", propertyIds: properties.map((entry) => entry.id) });
  const derived = properties.map((entry) => derivePropertyStay(result, { id: entry.id, rooms: toRoomViews(entry) }, adults));
  return { derived, statuses: derived.map((entry) => entry.status), summary: summarizeStays(derived) };
}

test("fixtures: all six properties return results", async () => {
  const { statuses, derived } = await scenario("with-rates");
  assert.deepEqual(statuses, Array(6).fill("available"));
  assert.deepEqual(derived.map((entry) => entry.from?.price.total.amount), [3_000_000, 3_600_000, 4_200_000, 4_800_000, 5_400_000, 6_000_000]);
});

test("fixtures: only some properties available, sold out listed after them", async () => {
  const { derived, summary } = await scenario("partial-availability");
  assert.deepEqual(summary, { available: 3, soldOut: 3, unchecked: 0, total: 6 });
  assert.deepEqual(orderStays(derived).map((entry) => entry.propertyId.slice(-1)), ["a", "c", "e", "b", "d", "f"]);
});

test("fixtures: one property fails while the others succeed, and it is not sold out", async () => {
  const { statuses, derived } = await scenario("partial-failure");
  assert.deepEqual(statuses, ["available", "available", "error", "available", "unknown", "sold-out"]);
  assert.equal(derived[2]?.retryable, true);
  assert.equal(derived[4]?.detail, "no-answer");
});

test("fixtures: all sold out, no reliable price, nothing answered, and a whole failure", async () => {
  assert.deepEqual((await scenario("sold-out")).summary, { available: 0, soldOut: 6, unchecked: 0, total: 6 });
  const unpriced = await scenario("all-available");
  assert.deepEqual(unpriced.statuses, Array(6).fill("available"));
  assert.ok(unpriced.derived.every((entry) => entry.from === undefined));
  assert.equal(canSortByPrice(unpriced.derived), false);
  assert.deepEqual((await scenario("no-answer")).statuses, Array(6).fill("unknown"));
  assert.deepEqual((await scenario("error")).statuses, Array(6).fill("error"));
  assert.deepEqual((await scenario("timeout")).derived.map((entry) => entry.failure), Array(6).fill("timeout"));
});

test("fixtures: changing the number of guests changes what is offered", async () => {
  // Three guests: rooms for two drop out, so the 'from' price moves to a larger room, or the property has none.
  const three = await scenario("with-rates", 3);
  assert.deepEqual(three.statuses, ["available", "available", "available", "available", "unknown", "available"]);
  assert.equal(three.derived[4]?.detail, "over-capacity");
  assert.equal(three.derived[0]?.from?.roomTypeId, "room-mock-a2");
  const seven = await scenario("with-rates", 7);
  // Property B's room has no known limit, so nothing is assumed about it.
  assert.deepEqual(seven.statuses, ["unknown", "available", "unknown", "unknown", "unknown", "unknown"]);
});

test("property card model: at most three amenities, only those flagged as signature, nothing invented", async () => {
  const cards = (await repository.listProperties("vi")).map(toPropertyCardModel);
  assert.deepEqual(cards.map((card) => card.signatureAmenities.length), [3, 0, 2, 3, 1, 3]);
  assert.ok(cards.every((card) => card.signatureAmenities.length <= MAX_SIGNATURE_AMENITIES && card.sample));
  const [a, b] = cards;
  assert.equal(a?.line, "Câu định vị mẫu cho cơ sở A.");
  assert.equal(b?.line, undefined, "a property with no positioning or tagline has no line");
  assert.deepEqual(a?.visual, { src: "/dev-fixtures/property-a.svg", alt: "Ảnh minh hoạ mẫu: hình ảnh đặc trưng của cơ sở mẫu A", width: 1600, height: 1200, standIn: true });
});
