import type { IsoDate } from "@/domain/dates";
import { goHostBlockers, type GoHostRuntimeConfig } from "./provider-config";
import type {
  AvailabilityErrorCode,
  BookingIntegrationBlockerCode,
  PropertyAvailabilityState,
  RoomAvailability,
  StayRequest,
  VerifiedQuote,
} from "@/domain/hybrid-booking/property-availability";
import { validateSelectionQuantities, type SelectionRequest, type SelectionValidation } from "@/domain/hybrid-booking/stay-validation";

/**
 * SERVER-ONLY GOHOST ADAPTER BOUNDARY.
 *
 * Five separate operations, so each can be tested, replaced and gated on its own:
 *   1. searchAvailability   read what is free for a stay
 *   2. readRates            read the quoted rates for a stay
 *   3. validateSelection    check requested room quantities against verified units (never client data)
 *   4. initiateBooking      start a booking          — DISABLED in this milestone
 *   5. readBookingStatus    read a booking's status  — DISABLED in this milestone
 *
 * GoHost's real endpoints, scopes, identifiers and payment capabilities have not been verified, so no
 * request is made and none is invented. The adapter reports `unconfigured` until every readiness
 * blocker is cleared, and `contract-not-implemented` after that, until the real contract is coded.
 * It never creates a reservation and never touches payment.
 */
export type AdapterFailure =
  | { kind: "unconfigured"; missing: readonly BookingIntegrationBlockerCode[] }
  | { kind: "error"; code: AvailabilityErrorCode; retryable: boolean };

export type AdapterResult<T> = { ok: true; data: T; verifiedAt: string } | { ok: false; failure: AdapterFailure };

export type AvailabilityRequest = { propertyId: string; stay: StayRequest & { checkIn: IsoDate; checkOut: IsoDate } };

export type AvailabilityData = { rooms: readonly RoomAvailability[] };
export type RateData = { quotes: ReadonlyArray<{ roomId: string; quote: VerifiedQuote }> };

export type BookingInitiation = { ok: false; reason: "booking-creation-disabled" };
export type BookingStatus = { ok: false; reason: "booking-status-disabled" };

export interface GoHostAdapter {
  searchAvailability(request: AvailabilityRequest): Promise<AdapterResult<AvailabilityData>>;
  readRates(request: AvailabilityRequest): Promise<AdapterResult<RateData>>;
  validateSelection(selection: SelectionRequest, verifiedRooms: readonly RoomAvailability[] | null): SelectionValidation;
  initiateBooking(): Promise<BookingInitiation>;
  readBookingStatus(bookingRef: string): Promise<BookingStatus>;
}

function failureFor(propertyId: string, config: GoHostRuntimeConfig): AdapterFailure {
  const missing = goHostBlockers(config)[propertyId] ?? ["missing-property-identifier"];
  if (missing.length > 0) return { kind: "unconfigured", missing };
  // Everything is supplied but the vendor contract is not coded: say so rather than guess a request.
  return { kind: "error", code: "contract-not-implemented", retryable: false };
}

export function createGoHostAdapter(config: GoHostRuntimeConfig): GoHostAdapter {
  const fail = <T>(propertyId: string): Promise<AdapterResult<T>> =>
    Promise.resolve({ ok: false, failure: failureFor(propertyId, config) });
  return {
    searchAvailability: (request) => fail(request.propertyId),
    readRates: (request) => fail(request.propertyId),
    validateSelection: (selection, verifiedRooms) => validateSelectionQuantities(selection, verifiedRooms),
    initiateBooking: () => Promise.resolve({ ok: false, reason: "booking-creation-disabled" }),
    readBookingStatus: () => Promise.resolve({ ok: false, reason: "booking-status-disabled" }),
  };
}

/** Maps an adapter failure to the availability state a guest-facing surface may show. */
export function stateFromFailure(provider: "gohost", failure: AdapterFailure): PropertyAvailabilityState {
  return failure.kind === "unconfigured"
    ? { status: "unconfigured", provider, missing: failure.missing }
    : { status: "error", provider, code: failure.code, retryable: failure.retryable };
}
