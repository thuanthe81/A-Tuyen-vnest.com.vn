/**
 * Booking readiness, selection and hand-off.
 *
 * "Continue booking" is offered only for a selection the provider has confirmed.
 * A room id plus dates is not enough: a provider-issued OfferRef is required.
 */

import type { AvailabilityFailure, AvailabilityResult, OfferRef, RateOffer } from "./availability.ts";
import { findRoomAvailability } from "./availability.ts";
import type { Locale } from "./locale.ts";
import type { CriteriaIssue, DatedCriteria, SearchCriteria } from "./search.ts";
import { hasDates, sameCriteria } from "./search.ts";

/**
 * The most guests a room can take: the lowest of the limits that are known.
 * `undefined` limits (not supplied yet) are ignored; with none known there is no limit to apply.
 */
export function occupancyLimit(...limits: readonly (number | undefined)[]): number | undefined {
  const known = limits.filter((limit): limit is number => limit !== undefined);
  return known.length > 0 ? Math.min(...known) : undefined;
}

/** A complete selection: which room, which rate, for which stay. */
export interface BookingIntent {
  propertyId: string;
  roomTypeId: string;
  criteria: DatedCriteria;
  offerRef: OfferRef;
}

export type BookingReadiness =
  /** Browse mode. Ask the guest to choose dates. */
  | { kind: "no-dates" }
  /** Dates or guests need correcting before availability can be checked. */
  | { kind: "invalid-criteria"; issues: readonly CriteriaIssue[] }
  /** More guests than the room takes. Never bookable, whatever the availability answer says. */
  | { kind: "over-capacity"; maxOccupancy: number }
  /** Availability has not loaded, failed, answered for other criteria, or says nothing usable about this room. */
  | { kind: "unverified" }
  /** The provider says this room cannot be booked for these criteria. */
  | { kind: "unavailable" }
  /** The room is available at more than one rate and the guest has not chosen one. */
  | { kind: "select-rate"; offers: readonly RateOffer[] }
  /** Mock data says "available". For development only; never presented as real. */
  | { kind: "simulated"; intent: BookingIntent }
  /** A real provider confirmed the selection. */
  | { kind: "bookable"; intent: BookingIntent };

export function getBookingReadiness(input: {
  propertyId: string;
  roomTypeId: string;
  criteria: SearchCriteria;
  issues: readonly CriteriaIssue[];
  availability: AvailabilityResult | undefined;
  /** The room's confirmed capacity from content (RoomType.maxOccupancy), when it is known. */
  maxOccupancy?: number;
  /** The rate the guest picked. Not needed when the room has exactly one offer. */
  selectedOfferRef?: OfferRef;
}): BookingReadiness {
  const { propertyId, roomTypeId, criteria, issues, availability, maxOccupancy, selectedOfferRef } = input;

  if (issues.length > 0) return { kind: "invalid-criteria", issues };

  // Capacity is judged before anything else the provider says: an "available" answer or an
  // offer reference for a party the room cannot take must never read as bookable.
  const room = findRoomAvailability(availability, propertyId, roomTypeId);
  const limit = occupancyLimit(maxOccupancy, room?.maxOccupancy);
  if (limit !== undefined && criteria.adults > limit) return { kind: "over-capacity", maxOccupancy: limit };

  if (!hasDates(criteria)) return { kind: "no-dates" };
  if (!availability || availability.status !== "ok") return { kind: "unverified" };

  // An answer for different dates or guests says nothing about this selection.
  if (!sameCriteria(availability.criteria, criteria)) return { kind: "unverified" };

  if (!room || room.status === "unknown") return { kind: "unverified" };
  if (room.status === "sold-out") return { kind: "unavailable" };
  if (room.offers.length === 0) return { kind: "unverified" };

  const [onlyOffer] = room.offers;
  const offer =
    selectedOfferRef !== undefined
      ? room.offers.find((candidate) => candidate.offerRef === selectedOfferRef)
      : room.offers.length === 1
        ? onlyOffer
        : undefined;

  // A selected rate that the current answer no longer contains has expired.
  if (selectedOfferRef !== undefined && !offer) return { kind: "unverified" };
  if (!offer) return { kind: "select-rate", offers: room.offers };

  const intent: BookingIntent = { propertyId, roomTypeId, criteria, offerRef: offer.offerRef };
  return availability.source === "mock" ? { kind: "simulated", intent } : { kind: "bookable", intent };
}

/** The three ways a provider may let a guest complete a booking. A provider may support any subset. */
export type HandoffMode = "redirect" | "embedded" | "native";

/** What a provider can actually do. The UI offers only what is declared here. */
export interface BookingCapabilities {
  availability: boolean;
  /** Whether availability answers carry prices. */
  rates: boolean;
  /** Whether the provider reports minimum/maximum nights and guest limits. */
  stayRules: boolean;
  /** Whether stays with children can be searched and booked. */
  children: boolean;
  /** Supported hand-off modes, in the provider's order of preference. Empty means booking is not connected. */
  handoff: readonly HandoffMode[];
}

export interface HandoffContext {
  locale: Locale;
  /** Absolute URL on the VNest site the guest should come back to. */
  returnUrl: string;
  /** The mode the site wants, when the provider supports several. */
  preferredMode?: HandoffMode;
}

declare const checkoutRefBrand: unique symbol;
/** Opaque handle for a checkout session opened with the provider for native checkout. */
export type CheckoutRef = string & { readonly [checkoutRefBrand]: true };

/**
 * What happens after "continue booking".
 *
 * There is deliberately no "confirmed" outcome: a completed reservation is only ever
 * reported by the provider. The native branch carries a session reference only; its steps
 * (guest details, payment, confirmation) are added once a provider documents an API for them.
 */
export type BookingHandoff =
  /** Send the guest to the provider's own booking pages. */
  | { kind: "redirect"; url: string }
  /** Show the provider's booking engine inside a VNest page. */
  | { kind: "embedded"; frameUrl: string }
  /** Continue with checkout on the VNest site. */
  | { kind: "native"; checkoutRef: CheckoutRef; expiresAt?: string }
  /** The selection can no longer be booked; the guest must search again. */
  | { kind: "unavailable"; reason: "offer-expired" | "sold-out" }
  /** No provider is connected for booking. */
  | { kind: "not-integrated" }
  | { kind: "error"; reason: AvailabilityFailure; retryable: boolean };
