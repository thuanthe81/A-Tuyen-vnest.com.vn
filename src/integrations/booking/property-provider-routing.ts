/**
 * VNEST V3 — PROPERTY-TO-BOOKING-PROVIDER ROUTING & CONFIGURATION CONTRACTS (30/10/2026).
 *
 * Codifies the owner-approved booking provider assignment across the six VNest properties:
 *   - GoHost (`"gohost"`):   `bare-da-kao` (Bare Đa Kao), `pepper-house` (Pepper House)
 *   - ezCloud (`"ezcloud"`): `bare-chic` (Bare Chic), `bare-hyphen` (Bare Hyphen),
 *                            `bare-han` (Bare Hàn), `the-nang-suites` (The Nắng Suites)
 *
 * Contract-only readiness module:
 * - Preserves official workbook room ordering (`WORKBOOK_ROOM_ORDER_BY_PROPERTY`).
 * - Does NOT invent booking endpoints, rate plans, live availability, or reservation responses.
 * - Fails closed (`readyForLiveBooking: false`) until official provider-specific identifiers,
 *   credentials, and room/rate mappings are supplied by VNest.
 */
import { WORKBOOK_ROOM_ORDER_BY_PROPERTY } from "@/content/vnest-workbook/property-details";
import type { ProviderPropertyMapping } from "@/domain/property";

import {
  LIVE_BOOKING_PROVIDER_IDS,
  LIVE_BOOKING_PROVIDER_LABELS,
  PROPERTY_PROVIDER_ASSIGNMENT,
  type LiveBookingProviderId,
} from "@/domain/hybrid-booking/provider-assignment";

export { LIVE_BOOKING_PROVIDER_IDS, LIVE_BOOKING_PROVIDER_LABELS, PROPERTY_PROVIDER_ASSIGNMENT };
export type { LiveBookingProviderId };

import type { BookingIntegrationBlockerCode } from "@/domain/hybrid-booking/property-availability";

export type { BookingIntegrationBlockerCode };

export type BookingIntegrationReadinessStatus =
  | "awaiting-provider-identifiers"
  | "partially-mapped"
  | "ready-for-live-booking";

export interface PropertyBookingProviderRoute {
  readonly propertyId: string;
  readonly providerId: LiveBookingProviderId;
  readonly providerName: string;
  /** Official room IDs in workbook order (`VNest_Informationv2.xlsx`, rows 4–25). */
  readonly officialRoomIds: readonly string[];
  /** Provider-assigned property identifier (`null` until supplied by VNest). */
  readonly providerPropertyRef: string | null;
  /** Map of VNest `roomId` → provider room/unit identifier (`null` until supplied by VNest). */
  readonly roomRefs: Readonly<Record<string, string | null>>;
}

export interface BookingProviderConnectionConfig {
  readonly providerId: LiveBookingProviderId;
  /** Official API or booking-engine handoff base URL (`null` until supplied). */
  readonly endpointUrl: string | null;
  /** Whether server-side credentials are present in the deployment environment. */
  readonly hasServerCredentials: boolean;
  /** Optional externally supplied property/room identifier mappings. */
  readonly propertyMappings?: Readonly<Record<string, ProviderPropertyMapping>>;
  /** Whether rate-plan and tax/fee rules have been confirmed for live quoting. */
  readonly ratePlanContractConfirmed?: boolean;
}

export interface PropertyBookingReadinessReport {
  readonly propertyId: string;
  readonly providerId: LiveBookingProviderId;
  readonly providerName: string;
  readonly status: BookingIntegrationReadinessStatus;
  readonly readyForLiveBooking: boolean;
  readonly resolvedMapping: ProviderPropertyMapping | null;
  readonly unmappedRoomIds: readonly string[];
  readonly blockers: readonly BookingIntegrationBlockerCode[];
}

function buildInitialRoute(propertyId: string, providerId: LiveBookingProviderId): PropertyBookingProviderRoute {
  const orderedRooms = WORKBOOK_ROOM_ORDER_BY_PROPERTY[propertyId];
  if (!orderedRooms || orderedRooms.length === 0) {
    throw new Error(`Cannot build booking provider route for unknown property "${propertyId}"`);
  }
  const officialRoomIds = Object.freeze(orderedRooms.map((room) => room.id));
  const roomRefs = Object.freeze(Object.fromEntries(officialRoomIds.map((id) => [id, null])));
  return Object.freeze({
    propertyId,
    providerId,
    providerName: LIVE_BOOKING_PROVIDER_LABELS[providerId],
    officialRoomIds,
    providerPropertyRef: null,
    roomRefs,
  });
}

/**
 * Complete routing table for all six VNest properties, keyed by `propertyId`.
 */
export const PROPERTY_BOOKING_PROVIDER_ROUTING: Readonly<Record<string, PropertyBookingProviderRoute>> = Object.freeze(
  Object.fromEntries(
    Object.entries(PROPERTY_PROVIDER_ASSIGNMENT).map(([propertyId, providerId]) => [
      propertyId,
      buildInitialRoute(propertyId, providerId),
    ]),
  ),
);

/** Returns the designated booking provider route for `propertyId`, or `undefined` if unknown. */
export function resolvePropertyBookingProviderRoute(propertyId: string): PropertyBookingProviderRoute | undefined {
  return PROPERTY_BOOKING_PROVIDER_ROUTING[propertyId];
}

/** Returns all property IDs assigned to a given `providerId` (`"gohost"` or `"ezcloud"`). */
export function propertiesForBookingProvider(providerId: LiveBookingProviderId): readonly string[] {
  return Object.values(PROPERTY_BOOKING_PROVIDER_ROUTING)
    .filter((route) => route.providerId === providerId)
    .map((route) => route.propertyId);
}

/**
 * Evaluates whether a property has all required provider configuration, credentials, and room mappings
 * to enable live booking. Fails closed (`readyForLiveBooking: false`) whenever any contract requirement
 * is still pending.
 */
export function evaluatePropertyBookingReadiness(
  propertyId: string,
  config?: BookingProviderConnectionConfig,
): PropertyBookingReadinessReport {
  const route = resolvePropertyBookingProviderRoute(propertyId);
  if (!route) {
    throw new Error(`Unknown VNest propertyId "${propertyId}"`);
  }

  const blockers: BookingIntegrationBlockerCode[] = [];
  const effectiveConfig = config?.providerId === route.providerId ? config : undefined;

  const endpointUrl = effectiveConfig?.endpointUrl?.trim() ?? "";
  if (!endpointUrl) {
    blockers.push("missing-provider-endpoint");
  }

  if (!effectiveConfig?.hasServerCredentials) {
    blockers.push("missing-server-credentials");
  }

  const candidateMapping = effectiveConfig?.propertyMappings?.[propertyId];
  const propertyRef = candidateMapping?.propertyRef?.trim() || route.providerPropertyRef;
  if (!propertyRef) {
    blockers.push("missing-property-identifier");
  }

  const suppliedRoomRefs = candidateMapping?.roomRefs ?? {};
  const unmappedRoomIds = route.officialRoomIds.filter((roomId) => {
    const ref = suppliedRoomRefs[roomId]?.trim() ?? route.roomRefs[roomId];
    return !ref;
  });

  if (unmappedRoomIds.length > 0) {
    blockers.push("missing-room-mappings");
  }

  if (!effectiveConfig?.ratePlanContractConfirmed) {
    blockers.push("missing-rate-plan-contract");
  }

  const hasAnyMapping = Boolean(propertyRef) || unmappedRoomIds.length < route.officialRoomIds.length;
  const readyForLiveBooking = blockers.length === 0;

  const status: BookingIntegrationReadinessStatus = readyForLiveBooking
    ? "ready-for-live-booking"
    : hasAnyMapping
      ? "partially-mapped"
      : "awaiting-provider-identifiers";

  const resolvedMapping: ProviderPropertyMapping | null =
    propertyRef && unmappedRoomIds.length === 0
      ? {
          propertyRef,
          roomRefs: Object.fromEntries(
            route.officialRoomIds.map((roomId) => [roomId, suppliedRoomRefs[roomId]!.trim()]),
          ),
        }
      : null;

  return {
    propertyId: route.propertyId,
    providerId: route.providerId,
    providerName: route.providerName,
    status,
    readyForLiveBooking,
    resolvedMapping,
    unmappedRoomIds,
    blockers,
  };
}
