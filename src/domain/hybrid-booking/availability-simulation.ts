import { nightsBetween, type IsoDate } from "../dates.ts";
import type { PropertyAvailabilityState, StayRequest, VerifiedQuote } from "./property-availability.ts";
import { providerForProperty } from "./provider-assignment.ts";

/**
 * DEVELOPMENT-ONLY AVAILABILITY SIMULATION.
 *
 * Lets the private review routes show every availability state (`?sim=bare-da-kao:available,pepper-house:error`)
 * without a provider. It is honoured only on routes the review-access rule allows, every simulated
 * verified state is flagged `simulated`, and the page labels it. The quote amounts are fixtures and
 * never a price VNest has. Nothing here is reachable on a production deployment.
 */
export const SIMULATABLE_STATUSES = ["available", "unavailable", "unconfigured", "error", "needs-provider-check"] as const;
export type SimulatableStatus = (typeof SIMULATABLE_STATUSES)[number];

export type Simulation = Readonly<Record<string, SimulatableStatus>>;

export function parseSimulation(raw: string | string[] | undefined): Simulation {
  const text = Array.isArray(raw) ? raw[0] : raw;
  const result: Record<string, SimulatableStatus> = {};
  if (!text) return result;
  for (const part of text.split(",")) {
    const [property, status] = part.split(":").map((value) => value.trim());
    if (!property || !status || !providerForProperty(property)) continue;
    if ((SIMULATABLE_STATUSES as readonly string[]).includes(status)) result[property] = status as SimulatableStatus;
  }
  return result;
}

function fixtureQuote(nights: number): VerifiedQuote {
  return {
    source: "simulation",
    currency: "VND",
    totalAmount: 1_000_000 * Math.max(1, nights),
    nights,
    rateContext: "Giá mô phỏng cho bản xem trước",
    conditions: [],
  };
}

export function simulatedState(propertyId: string, status: SimulatableStatus, stay: StayRequest): PropertyAvailabilityState | null {
  const provider = providerForProperty(propertyId);
  if (!provider) return null;
  const verifiedAt = new Date(0).toISOString();
  switch (status) {
    case "available": {
      const nights = stay.checkIn && stay.checkOut ? nightsBetween(stay.checkIn as IsoDate, stay.checkOut as IsoDate) : 1;
      return { status: "available", provider, verifiedAt, simulated: true, startingQuote: fixtureQuote(nights), rooms: [] };
    }
    case "unavailable":
      return { status: "unavailable", provider, verifiedAt, simulated: true };
    case "unconfigured":
      return { status: "unconfigured", provider, missing: ["missing-provider-endpoint", "missing-server-credentials"] };
    case "error":
      return { status: "error", provider, code: "provider-error", retryable: true };
    case "needs-provider-check":
      return { status: "needs-provider-check", provider, reason: "external-booking-engine" };
  }
}
