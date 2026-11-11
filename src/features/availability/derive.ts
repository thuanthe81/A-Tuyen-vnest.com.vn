/**
 * Every rule about what the results page shows, as pure functions: what a property's answer
 * means, which price is "from", what order things come in. Components only present what
 * these return, so the rules are tested without a browser.
 *
 * The rule that matters most: a failed or missing answer is never read as sold out.
 * "Sold out" is only ever the provider's own confirmed statement.
 */

import type { AvailabilityFailure, AvailabilityResult, OfferRef, Price, RateOffer, RoomAvailability } from "@/domain/availability";
import { findRoomAvailability, getPropertyOutcome } from "@/domain/availability";
import type { BookingCapabilities } from "@/domain/booking";
import { occupancyLimit } from "@/domain/booking";

export type DatedPrice = Extract<Price, { kind: "dated" }>;

/** What the site holds about one room type, from the property record. */
export interface RoomContent {
  id: string;
  name: string;
  maxOccupancy?: number;
  bedding?: string;
  areaSqm?: number;
}

/** What is known about a stay at one property. Each is shown differently, and none is ever shown as another. */
export type StayStatus =
  /** The provider confirmed at least one room the party can book. */
  | "available"
  /** The provider confirmed every room is sold out for the stay. */
  | "sold-out"
  /** The provider was reached and gave nothing bookable to act on, or was not asked. */
  | "unknown"
  /** The request for this property failed. Says nothing about its rooms. */
  | "error";

export type StayDetail =
  /** Rooms exist, but none takes this many guests. */
  | "over-capacity"
  /** The search succeeded and said nothing about this property. */
  | "no-answer"
  /** No booking provider is connected. */
  | "not-connected"
  /** The provider answered without a usable offer or a clear status. */
  | "no-offer";

export interface PropertyStay {
  propertyId: string;
  status: StayStatus;
  detail?: StayDetail;
  /** Only for "error": why, and whether asking again could help. */
  failure?: AvailabilityFailure;
  retryable: boolean;
  /** For "over-capacity": the most guests any of the property's rooms takes. */
  largestRoom?: number;
  /**
   * For "available": the lowest total among the offers the party can book, with the room it
   * belongs to. Absent when the provider supplied no comparable price; nothing is estimated.
   */
  from?: { price: DatedPrice; roomTypeId: string; offerRef: OfferRef };
}

/** The lowest dated total among offers. Offers in different currencies cannot be compared, so then there is none. */
export function lowestOffer(offers: readonly RateOffer[]): { offer: RateOffer; price: DatedPrice } | undefined {
  const dated = offers.flatMap((offer) => (offer.price.kind === "dated" ? [{ offer, price: offer.price }] : []));
  const [first] = dated;
  if (!first || dated.some((entry) => entry.price.total.currency !== first.price.total.currency)) return undefined;
  return dated.reduce((lowest, entry) => (entry.price.total.amount < lowest.price.total.amount ? entry : lowest), first);
}

/** The most guests a room takes: the lower of what VNest's record and the provider say. */
function roomLimit(room: RoomAvailability, content: readonly RoomContent[]): number | undefined {
  return occupancyLimit(content.find((candidate) => candidate.id === room.roomTypeId)?.maxOccupancy, room.maxOccupancy);
}

export function derivePropertyStay(result: AvailabilityResult, property: { id: string; rooms: readonly RoomContent[] }, adults: number): PropertyStay {
  const base = { propertyId: property.id, retryable: false };
  const outcome = getPropertyOutcome(result, property.id);

  if (outcome.kind === "failed") {
    // "Not configured" is not a fault to retry: online booking is simply not connected.
    if (outcome.reason === "not-configured") return { ...base, status: "unknown", detail: "not-connected" };
    return { ...base, status: "error", failure: outcome.reason, retryable: outcome.retryable };
  }
  if (outcome.kind === "no-answer") return { ...base, status: "unknown", detail: "no-answer" };

  const rooms = outcome.rooms.map((room) => {
    const limit = roomLimit(room, property.rooms);
    return { room, limit, tooSmall: limit !== undefined && adults > limit };
  });
  const bookable = rooms.filter(({ room, tooSmall }) => room.status === "available" && room.offers.length > 0 && !tooSmall);

  if (bookable.length > 0) {
    const candidates = bookable.flatMap(({ room }) => {
      const lowest = lowestOffer(room.offers);
      return lowest ? [{ ...lowest, roomTypeId: room.roomTypeId }] : [];
    });
    const [first] = candidates;
    const comparable = first !== undefined && candidates.every((candidate) => candidate.price.total.currency === first.price.total.currency);
    const from = comparable ? candidates.reduce((lowest, candidate) => (candidate.price.total.amount < lowest.price.total.amount ? candidate : lowest), first) : undefined;
    return { ...base, status: "available", ...(from ? { from: { price: from.price, roomTypeId: from.roomTypeId, offerRef: from.offer.offerRef } } : {}) };
  }

  // Sold out only when the provider said so for every room it has. An empty answer is not sold out.
  if (rooms.length > 0 && rooms.every(({ room }) => room.status === "sold-out")) return { ...base, status: "sold-out" };

  const others = rooms.filter(({ room }) => room.status !== "sold-out");
  if (others.length > 0 && others.every(({ tooSmall }) => tooSmall)) {
    return { ...base, status: "unknown", detail: "over-capacity", largestRoom: Math.max(...others.map(({ limit }) => limit ?? 0)) };
  }
  return { ...base, status: "unknown", detail: "no-offer" };
}

export type SortOrder = "editorial" | "price";

const GROUP: Record<StayStatus, number> = { available: 0, error: 1, unknown: 1, "sold-out": 2 };

/**
 * The order results are listed in. Available first; then properties that could not be
 * checked, which may still have rooms; confirmed sold out last. Inside each group the order
 * is VNest's own, unless the guest asks for price: then available properties go from the
 * lowest total up, and those without a price keep VNest's order after them.
 */
export function orderStays(stays: readonly PropertyStay[], sort: SortOrder = "editorial"): PropertyStay[] {
  return stays
    .map((stay, index) => ({ stay, index }))
    .sort((a, b) => {
      const group = GROUP[a.stay.status] - GROUP[b.stay.status];
      if (group !== 0) return group;
      if (sort === "price" && a.stay.status === "available") {
        const byPrice = (a.stay.from?.price.total.amount ?? Infinity) - (b.stay.from?.price.total.amount ?? Infinity);
        if (byPrice !== 0 && !Number.isNaN(byPrice)) return byPrice;
      }
      return a.index - b.index;
    })
    .map(({ stay }) => stay);
}

/**
 * The order fixed when an answer first arrives. Cards are laid out in it once and stay
 * where they are: a retry or a late answer updates a card in place and never moves it.
 * `listed` is the main list; `soldOut` the confirmed sold-out properties shown after it.
 */
export function initialLayout(stays: readonly PropertyStay[]): { listed: string[]; soldOut: string[] } {
  const ordered = orderStays(stays);
  return {
    listed: ordered.filter((stay) => stay.status !== "sold-out").map((stay) => stay.propertyId),
    soldOut: ordered.filter((stay) => stay.status === "sold-out").map((stay) => stay.propertyId),
  };
}

/** Whether sorting by price means anything: at least two available properties with a price in one currency. */
export function canSortByPrice(stays: readonly PropertyStay[]): boolean {
  const priced = stays.flatMap((stay) => (stay.status === "available" && stay.from ? [stay.from.price.total.currency] : []));
  return priced.length > 1 && new Set(priced).size === 1;
}

export interface StaySummary {
  available: number;
  soldOut: number;
  /** Failed or unknown: properties nothing reliable can be said about. */
  unchecked: number;
  total: number;
}

export function summarizeStays(stays: readonly PropertyStay[]): StaySummary {
  const count = (...statuses: StayStatus[]) => stays.filter((stay) => statuses.includes(stay.status)).length;
  return { available: count("available"), soldOut: count("sold-out"), unchecked: count("error", "unknown"), total: stays.length };
}

/** An offer with a verified total for the stay: the only thing that is ever called a rate. */
export type PricedOffer = RateOffer & { price: DatedPrice };

function isPriced(offer: RateOffer): offer is PricedOffer {
  return offer.price.kind === "dated";
}

/** How one room reads for the searched stay. */
export type RoomStay =
  /**
   * Available with at least one verified price: the rates to choose from. Offers the provider
   * sent without a price are listed apart in `unpriced` and can never be chosen as a rate.
   */
  | { kind: "rates"; room: RoomContent; offers: readonly PricedOffer[]; unpriced: readonly RateOffer[]; unitsLeft?: number }
  /** Available, but the provider gave no verified price for any offer. A room, not a rate. */
  | { kind: "unpriced"; room: RoomContent; offers: readonly RateOffer[]; unitsLeft?: number }
  | { kind: "sold-out"; room: RoomContent }
  | { kind: "over-capacity"; room: RoomContent; maxOccupancy: number }
  /** Nothing usable was said about this room. No claim is made. */
  | { kind: "unverified"; room: RoomContent };

/**
 * The rooms of one property for the searched stay, in the record's order, bookable rooms
 * first. Capacity is judged before availability, as in getBookingReadiness: an offer for a
 * party the room cannot take is never shown.
 */
export function deriveRoomStays(result: AvailabilityResult, property: { id: string; rooms: readonly RoomContent[] }, adults: number): RoomStay[] {
  const stays = property.rooms.map((room): RoomStay => {
    const availability = findRoomAvailability(result, property.id, room.id);
    const limit = occupancyLimit(room.maxOccupancy, availability?.maxOccupancy);
    if (limit !== undefined && adults > limit) return { kind: "over-capacity", room, maxOccupancy: limit };
    if (!availability || availability.status === "unknown") return { kind: "unverified", room };
    if (availability.status === "sold-out") return { kind: "sold-out", room };
    if (availability.offers.length === 0) return { kind: "unverified", room };
    const units = availability.unitsLeft !== undefined ? { unitsLeft: availability.unitsLeft } : {};
    const priced = availability.offers.filter(isPriced);
    if (priced.length === 0) return { kind: "unpriced", room, offers: availability.offers, ...units };
    return { kind: "rates", room, offers: priced, unpriced: availability.offers.filter((offer) => !isPriced(offer)), ...units };
  });
  const rank = (stay: RoomStay) => (stay.kind === "rates" ? 0 : stay.kind === "unpriced" ? 1 : 2);
  return stays.map((stay, index) => ({ stay, index })).sort((a, b) => rank(a.stay) - rank(b.stay) || a.index - b.index).map(({ stay }) => stay);
}

/**
 * What a guest can do with a room that is available but has no verified price. It depends
 * on what the provider declares, never on a hope about the next step:
 *
 *   select-room  the provider supports a hand-off, so the room itself can be taken forward.
 *                No price is promised: whether one appears later is the provider's to say.
 *   none         no hand-off is connected, so there is nothing truthful to continue to.
 */
export function unpricedRoomAction(capabilities: Pick<BookingCapabilities, "handoff"> | undefined): "select-room" | "none" {
  return capabilities !== undefined && capabilities.handoff.length > 0 ? "select-room" : "none";
}

/**
 * What the guest has chosen. The two are different things and are never shown as each other:
 * a rate is a room at a verified total; a room alone carries no price at all.
 */
export type Selection = { kind: "rate"; roomTypeId: string; offerRef: OfferRef } | { kind: "room"; roomTypeId: string };

export type Selected = { kind: "rate"; room: RoomContent; offer: PricedOffer } | { kind: "room"; room: RoomContent };

/**
 * The choice as the current answer has it, or nothing when the answer no longer supports it:
 * the rate is gone, or the room that had no price now has one (or is no longer available).
 */
export function findSelected(rooms: readonly RoomStay[], selection: Selection | undefined): Selected | undefined {
  if (!selection) return undefined;
  const stay = rooms.find((candidate) => candidate.room.id === selection.roomTypeId);
  if (!stay) return undefined;
  if (selection.kind === "room") return stay.kind === "unpriced" ? { kind: "room", room: stay.room } : undefined;
  if (stay.kind !== "rates") return undefined;
  const offer = stay.offers.find((candidate) => candidate.offerRef === selection.offerRef);
  return offer ? { kind: "rate", room: stay.room, offer } : undefined;
}

/** The average per night, for comparison only. Derived from the total, and always labelled as an average. */
export function averagePerNight(price: DatedPrice): number | undefined {
  return price.nights > 1 ? Math.round(price.total.amount / price.nights) : undefined;
}
