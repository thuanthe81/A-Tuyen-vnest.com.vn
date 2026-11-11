import type { PropertyAvailabilityState, RoomAvailability, StayRequest } from "@/domain/hybrid-booking/property-availability";
import type { ProviderRoomInventoryOverlay } from "./booking-results-data";
import type { MultiRoomSearchState } from "./booking-results-state";

/**
 * Plain helpers for the hybrid results (server and client share them; a constant exported from a
 * "use client" file reaches a server component as a reference, not a value).
 */

/** What the server learned about the six properties for ONE stay. Serializable. */
export type HybridBookingContext = {
  states: Readonly<Record<string, PropertyAvailabilityState>>;
  /** The stay these states were checked for (`stayKey`). A different stay makes them stale. */
  stayKey: string;
  /** True when the states come from `?sim=`: the page labels it, nothing is real. */
  simulationActive: boolean;
};

export function stayRequestFromState(state: Pick<MultiRoomSearchState, "checkIn" | "checkOut" | "roomGroups" | "guests" | "children">): StayRequest {
  const roomAdults = state.roomGroups.map((group) => group.adults);
  // An address whose guests do not fit its rooms is sent as it is (the extra guests in the first room, or empty rooms
  // last), so the server's stay check refuses it and no provider is asked about a different, silently adjusted stay.
  if (state.guests !== undefined) {
    let diff = state.guests - roomAdults.reduce((a, b) => a + b, 0);
    if (diff > 0) roomAdults[0] = roomAdults[0]! + diff;
    for (let i = roomAdults.length - 1; diff < 0 && i >= 0; i--) {
      const take = Math.min(roomAdults[i]!, -diff);
      roomAdults[i] = roomAdults[i]! - take;
      diff += take;
    }
  }
  return {
    ...(state.checkIn ? { checkIn: state.checkIn } : {}),
    ...(state.checkOut ? { checkOut: state.checkOut } : {}),
    roomAdults,
    ...(state.children ? { children: state.children } : {}),
  };
}

/** A stable identity for the part of a search that availability depends on. */
export function stayKey(stay: StayRequest): string {
  return `${stay.checkIn ?? ""}|${stay.checkOut ?? ""}|${stay.roomAdults.join(",")}${stay.children ? `|c${stay.children}` : ""}`;
}

/** Provider-confirmed room facts as catalog overlays; with none, the catalog stays catalog-only. */
export function overlaysFromStates(states: Readonly<Record<string, PropertyAvailabilityState>>): ProviderRoomInventoryOverlay[] {
  const overlays: ProviderRoomInventoryOverlay[] = [];
  for (const state of Object.values(states)) {
    if (state.status !== "available" || state.simulated) continue;
    for (const room of state.rooms as readonly RoomAvailability[]) {
      overlays.push({
        roomId: room.roomId,
        availability: { providerId: state.provider, availableUnits: room.availableUnits, verifiedAt: state.verifiedAt },
        ...(room.quote
          ? { ratePlan: { ratePlanId: room.quote.rateContext, ratePlanName: room.quote.rateContext, totalStayPrice: room.quote.totalAmount, currency: room.quote.currency } }
          : {}),
      });
    }
  }
  return overlays;
}
