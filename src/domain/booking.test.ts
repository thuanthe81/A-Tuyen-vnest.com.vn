import assert from "node:assert/strict";
import { test } from "node:test";
import type { AvailabilityResult, OfferRef, RateOffer, RoomAvailability } from "./availability.ts";
import { getBookingReadiness, occupancyLimit } from "./booking.ts";
import { parseIsoDate } from "./dates.ts";
import type { DataSource } from "./property.ts";
import type { DatedCriteria } from "./search.ts";

const criteria: DatedCriteria = {
  checkIn: parseIsoDate("2026-10-12")!,
  checkOut: parseIsoDate("2026-10-14")!,
  adults: 2,
};
const offerRef = "offer-1" as OfferRef;
const offer: RateOffer = { offerRef, price: { kind: "not-provided" } };
const flexible: RateOffer = { offerRef: "offer-2" as OfferRef, ratePlan: { id: "flex", name: "Flexible" }, price: { kind: "not-provided" } };

function result(room: Partial<RoomAvailability>, source: DataSource = "mock"): AvailabilityResult {
  return {
    status: "ok",
    criteria,
    source,
    items: [{ propertyId: "p1", rooms: [{ roomTypeId: "r1", status: "available", offers: [], ...room }] }],
  };
}

const base = { propertyId: "p1", roomTypeId: "r1", criteria, issues: [] };

test("no dates", () => {
  const readiness = getBookingReadiness({ ...base, criteria: { adults: 2 }, availability: undefined });
  assert.equal(readiness.kind, "no-dates");
});

test("invalid criteria wins over everything else", () => {
  const readiness = getBookingReadiness({
    ...base,
    issues: [{ code: "check-out-not-after-check-in" }],
    availability: result({ offers: [offer] }),
  });
  assert.equal(readiness.kind, "invalid-criteria");
});

test("unverified when availability is missing, failed, unknown or silent about the room", () => {
  const cases: (AvailabilityResult | undefined)[] = [
    undefined,
    { status: "error", reason: "network", retryable: true },
    result({ status: "unknown" }),
    result({ roomTypeId: "another-room", offers: [offer] }),
  ];
  for (const availability of cases) {
    assert.equal(getBookingReadiness({ ...base, availability }).kind, "unverified");
  }
});

test("available without an offer is not bookable", () => {
  assert.equal(getBookingReadiness({ ...base, availability: result({}) }).kind, "unverified");
});

test("an answer for different criteria does not verify this selection", () => {
  const other = { ...criteria, adults: 3 };
  assert.equal(getBookingReadiness({ ...base, criteria: other, availability: result({ offers: [offer] }) }).kind, "unverified");
});

test("sold out is unavailable", () => {
  assert.equal(getBookingReadiness({ ...base, availability: result({ status: "sold-out" }) }).kind, "unavailable");
});

test("mock availability is simulated, never bookable", () => {
  const readiness = getBookingReadiness({ ...base, availability: result({ offers: [offer] }) });
  assert.equal(readiness.kind, "simulated");
});

test("provider availability with a single offer is bookable without a rate choice", () => {
  const readiness = getBookingReadiness({ ...base, availability: result({ offers: [offer] }, "provider") });
  assert.deepEqual(readiness, {
    kind: "bookable",
    intent: { propertyId: "p1", roomTypeId: "r1", criteria, offerRef },
  });
});

test("several offers need a rate choice, and the chosen one is what gets booked", () => {
  const availability = result({ offers: [offer, flexible] }, "provider");
  assert.deepEqual(getBookingReadiness({ ...base, availability }), { kind: "select-rate", offers: [offer, flexible] });

  const chosen = getBookingReadiness({ ...base, availability, selectedOfferRef: flexible.offerRef });
  assert.deepEqual(chosen, {
    kind: "bookable",
    intent: { propertyId: "p1", roomTypeId: "r1", criteria, offerRef: flexible.offerRef },
  });
});

test("a selected rate missing from the current answer has expired", () => {
  const availability = result({ offers: [offer] }, "provider");
  assert.equal(getBookingReadiness({ ...base, availability, selectedOfferRef: "gone" as OfferRef }).kind, "unverified");
});

// Regression carried over from V1: a room for 2 guests was offered "continue booking" with 3 adults selected.
test("more guests than the room's capacity is never bookable, even with an offer", () => {
  const three = { ...criteria, adults: 3 };
  for (const source of ["mock", "provider"] as const) {
    const availability = { ...result({ offers: [offer] }, source), criteria: three } as AvailabilityResult;
    const readiness = getBookingReadiness({ ...base, criteria: three, availability, maxOccupancy: 2 });
    assert.deepEqual(readiness, { kind: "over-capacity", maxOccupancy: 2 });
  }
});

test("a guest count at the room's capacity stays bookable", () => {
  assert.equal(getBookingReadiness({ ...base, availability: result({ offers: [offer] }), maxOccupancy: 2 }).kind, "simulated");
  assert.equal(getBookingReadiness({ ...base, availability: result({ offers: [offer] }, "provider"), maxOccupancy: 2 }).kind, "bookable");
});

test("the provider's occupancy limit applies, and the lower limit wins", () => {
  const three = { ...criteria, adults: 3 };
  const answer = (room: Partial<RoomAvailability>) => ({ ...result(room, "provider"), criteria: three }) as AvailabilityResult;

  // Content says 4, provider says 2.
  assert.deepEqual(
    getBookingReadiness({ ...base, criteria: three, availability: answer({ offers: [offer], maxOccupancy: 2 }), maxOccupancy: 4 }),
    { kind: "over-capacity", maxOccupancy: 2 },
  );
  // Content silent, provider says 2.
  assert.equal(getBookingReadiness({ ...base, criteria: three, availability: answer({ offers: [offer], maxOccupancy: 2 }) }).kind, "over-capacity");
  // Both allow 3.
  assert.equal(
    getBookingReadiness({ ...base, criteria: three, availability: answer({ offers: [offer], maxOccupancy: 3 }), maxOccupancy: 4 }).kind,
    "bookable",
  );
});

test("over capacity is reported before dates are chosen and before availability loads", () => {
  assert.equal(getBookingReadiness({ ...base, criteria: { adults: 3 }, availability: undefined, maxOccupancy: 2 }).kind, "over-capacity");
  assert.equal(getBookingReadiness({ ...base, criteria: { ...criteria, adults: 3 }, availability: undefined, maxOccupancy: 2 }).kind, "over-capacity");
  assert.equal(
    getBookingReadiness({
      ...base,
      criteria: { ...criteria, adults: 3 },
      availability: { status: "error", reason: "network", retryable: true },
      maxOccupancy: 2,
    }).kind,
    "over-capacity",
  );
});

test("an unknown capacity adds no limit", () => {
  const five = { ...criteria, adults: 5 };
  const availability = { ...result({ offers: [offer] }), criteria: five } as AvailabilityResult;
  assert.equal(getBookingReadiness({ ...base, criteria: five, availability }).kind, "simulated");
});

test("occupancyLimit takes the lowest known limit", () => {
  assert.equal(occupancyLimit(), undefined);
  assert.equal(occupancyLimit(undefined, undefined), undefined);
  assert.equal(occupancyLimit(2, undefined), 2);
  assert.equal(occupancyLimit(4, 2), 2);
});
