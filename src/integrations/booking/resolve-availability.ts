import type { IsoDate } from "@/domain/dates";
import { createGoHostAdapter, stateFromFailure, type GoHostAdapter } from "./gohost-adapter";
import { type Simulation, simulatedState } from "@/domain/hybrid-booking/availability-simulation";
import type { PropertyAvailabilityState, RoomAvailability, StayRequest, VerifiedQuote } from "@/domain/hybrid-booking/property-availability";
import { PROPERTY_PROVIDER_ASSIGNMENT, providerForProperty } from "@/domain/hybrid-booking/provider-assignment";
import { validateStay } from "@/domain/hybrid-booking/stay-validation";
import { childPolicyPending } from "@/domain/hybrid-booking/guest-party";
import { readGoHostConfig, type ProviderEnvSource } from "./provider-config";

/**
 * SERVER-ONLY: THE AVAILABILITY STATE OF EVERY PROPERTY FOR ONE STAY.
 *
 * - GoHost properties ask the adapter. An unconfigured integration is `unconfigured`; a failed call is
 *   `error`. Neither is ever turned into "unavailable".
 * - ezCloud properties are `needs-provider-check`: VNest has no way to ask, and says nothing about rooms.
 * - A stay without valid dates cannot be checked, so GoHost properties are `needs-provider-check` too.
 * - A stay with children is not checked while no child policy is confirmed (`children-policy`).
 * - A throwing adapter is contained here: one property failing never blanks the others.
 */
export type ResolveDeps = {
  adapter?: GoHostAdapter;
  /** Server credentials, supplied by the composition root (`@/config/env`) and never read here. Absent = unconfigured. */
  env?: ProviderEnvSource;
  today?: IsoDate;
  /** Only passed on private review routes. */
  simulation?: Simulation;
};

function cheapest(quotes: readonly (VerifiedQuote | null)[]): VerifiedQuote | null {
  const real = quotes.filter((quote): quote is VerifiedQuote => quote !== null);
  return real.length ? real.reduce((best, quote) => (quote.totalAmount < best.totalAmount ? quote : best)) : null;
}

export async function resolvePropertyAvailability(
  propertyId: string,
  stay: StayRequest,
  deps: ResolveDeps = {},
): Promise<PropertyAvailabilityState> {
  const provider = providerForProperty(propertyId);
  if (!provider) throw new Error(`Unknown VNest propertyId "${propertyId}"`);

  // Children with no confirmed child policy: an adults-only answer would be about another stay. Checked before any
  // simulation so a review never shows "available" for a party the provider was not asked about.
  if (provider === "gohost" && childPolicyPending(stay.children)) {
    return { status: "needs-provider-check", provider, reason: "children-policy" };
  }

  const simulated = deps.simulation?.[propertyId];
  if (simulated) {
    const state = simulatedState(propertyId, simulated, stay);
    if (state) return state;
  }

  if (provider === "ezcloud") return { status: "needs-provider-check", provider, reason: "external-booking-engine" };

  const validity = validateStay(stay, deps.today);
  if (!validity.ok || !stay.checkIn || !stay.checkOut) {
    // Dates set but the guests do not fit the rooms: nothing is asked of the provider until the guest corrects it.
    const occupancyOnly =
      stay.checkIn && stay.checkOut && !validity.ok && validity.issues.every((issue) => issue === "adults-out-of-range" || issue === "rooms-out-of-range");
    return { status: "needs-provider-check", provider, reason: occupancyOnly ? "occupancy-correction" : "dates-required" };
  }

  const adapter = deps.adapter ?? createGoHostAdapter(readGoHostConfig(deps.env ?? {}));
  const request = { propertyId, stay: { ...stay, checkIn: stay.checkIn, checkOut: stay.checkOut } };
  try {
    const availability = await adapter.searchAvailability(request);
    if (!availability.ok) return stateFromFailure(provider, availability.failure);
    const rates = await adapter.readRates(request);
    const quotes = new Map(rates.ok ? rates.data.quotes.map((entry) => [entry.roomId, entry.quote] as const) : []);
    const rooms: RoomAvailability[] = availability.data.rooms.map((room) => ({ ...room, quote: room.quote ?? quotes.get(room.roomId) ?? null }));
    const free = rooms.filter((room) => room.availableUnits > 0);
    return free.length
      ? { status: "available", provider, verifiedAt: availability.verifiedAt, simulated: false, startingQuote: cheapest(free.map((room) => room.quote)), rooms: free }
      : { status: "unavailable", provider, verifiedAt: availability.verifiedAt, simulated: false };
  } catch {
    return { status: "error", provider, code: "provider-error", retryable: true };
  }
}

/** Every property's state, keyed by property id, in the catalog's fixed order. */
export async function resolveAllPropertyAvailability(
  stay: StayRequest,
  deps: ResolveDeps = {},
): Promise<Record<string, PropertyAvailabilityState>> {
  const ids = Object.keys(PROPERTY_PROVIDER_ASSIGNMENT);
  const states = await Promise.all(ids.map((id) => resolvePropertyAvailability(id, stay, deps)));
  return Object.fromEntries(ids.map((id, index) => [id, states[index]!]));
}
