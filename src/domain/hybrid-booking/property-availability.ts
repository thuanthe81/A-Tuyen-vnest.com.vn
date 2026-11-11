import type { IsoDate } from "../dates.ts";
import type { LiveBookingProviderId } from "./provider-assignment.ts";

/** What is still missing before a property's integration can serve live booking. */
export type BookingIntegrationBlockerCode =
  | "missing-provider-endpoint"
  | "missing-server-credentials"
  | "missing-property-identifier"
  | "missing-room-mappings"
  | "missing-rate-plan-contract";

/**
 * WHAT VNEST KNOWS ABOUT A PROPERTY'S AVAILABILITY FOR A STAY (client-safe types).
 *
 * There is no verified availability source for all six properties. Each property is therefore in
 * exactly one of these states, and only `available` and `unavailable` are claims about rooms:
 *
 * - `available`            confirmed by a live provider response for these dates and guests.
 * - `unavailable`          confirmed by a live provider response.
 * - `needs-provider-check` VNest cannot check it itself (the booking page of the provider decides, or the
 *                          stay has no dates yet).
 * - `unconfigured`         the integration is not set up (credentials, identifiers, mappings missing).
 * - `error`                the check was attempted and failed. This is NEVER shown as sold out.
 */
export const AVAILABILITY_STATUSES = ["available", "unavailable", "needs-provider-check", "unconfigured", "error"] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

/** A price the provider quoted for the searched stay. Absent unless a provider (or a labelled simulation) said so. */
export type VerifiedQuote = {
  /** `provider` came from a live response. `simulation` is a labelled development fixture and never a real price. */
  source: "provider" | "simulation";
  currency: string;
  /** Whole currency units for the entire stay. */
  totalAmount: number;
  nights: number;
  /** Rate context to show beside the price, e.g. the rate plan name. */
  rateContext: string;
  /** Conditions that apply to this rate (cancellation, taxes), shown as written by the provider. */
  conditions: readonly string[];
};

export type RoomAvailability = {
  roomId: string;
  /** Provider-confirmed number of units for the stay. */
  availableUnits: number;
  quote: VerifiedQuote | null;
};

export type AvailabilityErrorCode = "timeout" | "provider-error" | "invalid-response" | "contract-not-implemented";

/**
 * `occupancy-correction`: dates are set, but the guests do not fit the rooms (1–2 per room) until the guest corrects it.
 * `children-policy`: the party has children and VNest has not confirmed a child policy (guest-party.ts), so the provider is
 * not asked about an adults-only stay that is not the guest's.
 */
export type NeedsCheckReason = "external-booking-engine" | "dates-required" | "occupancy-correction" | "children-policy";

export type PropertyAvailabilityState =
  | {
      status: "available";
      provider: LiveBookingProviderId;
      verifiedAt: string;
      simulated: boolean;
      /** Lowest quote across the available rooms, when the provider gave one. */
      startingQuote: VerifiedQuote | null;
      rooms: readonly RoomAvailability[];
    }
  | { status: "unavailable"; provider: LiveBookingProviderId; verifiedAt: string; simulated: boolean }
  | { status: "needs-provider-check"; provider: LiveBookingProviderId; reason: NeedsCheckReason }
  | { status: "unconfigured"; provider: LiveBookingProviderId; missing: readonly BookingIntegrationBlockerCode[] }
  | { status: "error"; provider: LiveBookingProviderId; code: AvailabilityErrorCode; retryable: boolean };

/** The stay a guest searched, as the booking layer needs it. */
export type StayRequest = {
  checkIn?: IsoDate;
  checkOut?: IsoDate;
  /** Adults per room; its length is the number of rooms. */
  roomAdults: readonly number[];
  /** Children in the party (no age bands, not allocated to rooms: no policy is confirmed). Absent = none. */
  children?: number;
};

/** True for the two states that are claims about rooms. */
export function isVerifiedAvailability(state: PropertyAvailabilityState): state is Extract<PropertyAvailabilityState, { status: "available" | "unavailable" }> {
  return state.status === "available" || state.status === "unavailable";
}

/** A state shown for a stay that changed after it was checked: nothing verified carries over. */
export function staleAvailability(state: PropertyAvailabilityState): PropertyAvailabilityState {
  if (!isVerifiedAvailability(state)) return state;
  return { status: "needs-provider-check", provider: state.provider, reason: "dates-required" };
}
