/**
 * Availability and bookable rates. Both arrive only from a BookingProvider for specific
 * dates and guests; neither is ever stored on a property record.
 *
 * These shapes are VNest's own. Each provider adapter maps its responses into them, so
 * nothing outside src/integrations/booking ever sees a provider's field names.
 */

import type { DataSource, Money } from "./property.ts";
import type { DatedCriteria } from "./search.ts";
import { sameCriteria } from "./search.ts";

export type Price =
  /** The provider confirmed availability but supplied no price. The UI says so; it never estimates. */
  | { kind: "not-provided" }
  /** The total for exactly the searched dates and guests. */
  | {
      kind: "dated";
      total: Money;
      nights: number;
      /** Whether the total already contains taxes and fees. "unknown" must be shown as such. */
      taxesAndFees: "included" | "excluded" | "unknown";
    };

declare const offerRefBrand: unique symbol;
/**
 * Opaque handle issued by the provider for one bookable room-and-rate selection. It stands
 * for whatever the provider needs to start a booking (rate plan, quote, its own identifiers).
 * The site passes it back untouched and never inspects or constructs it.
 */
export type OfferRef = string & { readonly [offerRefBrand]: true };

/** One way to book a room for the searched stay: a rate plan with its price and terms. */
export interface RateOffer {
  offerRef: OfferRef;
  /** The provider's rate plan, in the provider's wording. Absent when it distinguishes none. */
  ratePlan?: { id: string; name: string; inclusions?: readonly string[] };
  price: Price;
  /** Terms as plain text from the provider. The site never writes its own. */
  cancellationPolicy?: string;
  paymentTerms?: string;
}

export interface RoomAvailability {
  roomTypeId: string;
  status: "available" | "sold-out" | "unknown";
  /** Empty unless the room is available. An available room with no offer cannot be booked. */
  offers: readonly RateOffer[];
  /** The provider's own occupancy limit, when it reports one. The lower of this and the content limit applies. */
  maxOccupancy?: number;
  /** Units left, only when the provider states it. Never estimated. */
  unitsLeft?: number;
}

export interface PropertyAvailability {
  propertyId: string;
  rooms: readonly RoomAvailability[];
}

/**
 * One property the provider was asked about and could not answer for, inside a search that
 * otherwise succeeded. It says nothing about that property's rooms: a failed request is
 * never sold out, and never available.
 */
export interface PropertyFailure {
  propertyId: string;
  reason: AvailabilityFailure;
  /** Whether asking again for this property could help. */
  retryable: boolean;
}

/**
 * What the guest asked to search. "all-properties" is the default search from the booking bar;
 * "single-property" is a search the guest narrowed to one property.
 */
export type SearchScope = "single-property" | "all-properties";

export interface AvailabilityRequest {
  criteria: DatedCriteria;
  scope: SearchScope;
  /**
   * Every property to check, always listed explicitly: one for "single-property", all eligible
   * properties for "all-properties". An adapter never has to work out what "all" means. A
   * provider with no multi-property search is asked once per property inside its adapter.
   */
  propertyIds: readonly string[];
}

export type AvailabilityFailure = "network" | "timeout" | "provider" | "not-configured" | "unknown";

export interface AvailabilityAnswer {
  status: "ok";
  /** The criteria this answer is for. An answer is only ever used for exactly these. */
  criteria: DatedCriteria;
  items: readonly PropertyAvailability[];
  /** "mock" means simulated: the UI must say so wherever it shows anything from this answer. */
  source: DataSource;
  /**
   * Properties that were asked about and failed, while others answered. Absent means none.
   * A property is in `items` or here, never both; listed in neither, it simply got no answer
   * (for example it is not mapped to this provider) and nothing is claimed about it.
   */
  failures?: readonly PropertyFailure[];
  /** When the provider produced this answer, as an ISO 8601 instant. Absent when it does not say. */
  fetchedAt?: string;
  /**
   * Until when the prices and offers in this answer hold, as an ISO 8601 instant, only when
   * the provider states it. After it they are stale: shown as such, never as current.
   */
  validUntil?: string;
}

/** Failure is a value, not an exception, so every caller has to handle it. */
export interface AvailabilityError {
  status: "error";
  reason: AvailabilityFailure;
  /** Whether asking again could help. False for configuration problems. */
  retryable: boolean;
}

export type AvailabilityResult = AvailabilityAnswer | AvailabilityError;

/** What is known about one property after a search. Exactly one of these, for every property asked about. */
export type PropertyOutcome =
  /** The provider answered for this property. Its rooms may be available, sold out or unknown. */
  | { kind: "answered"; rooms: readonly RoomAvailability[] }
  /** The request for this property, or the whole search, failed. Not a statement about its rooms. */
  | { kind: "failed"; reason: AvailabilityFailure; retryable: boolean }
  /** The search succeeded and said nothing about this property. */
  | { kind: "no-answer" };

/**
 * The single reading of "what did the provider say about this property?".
 * A failure always wins over an answer, so a failed request can never be read as sold out.
 */
export function getPropertyOutcome(result: AvailabilityResult, propertyId: string): PropertyOutcome {
  if (result.status === "error") return { kind: "failed", reason: result.reason, retryable: result.retryable };
  const failure = result.failures?.find((candidate) => candidate.propertyId === propertyId);
  if (failure) return { kind: "failed", reason: failure.reason, retryable: failure.retryable };
  const item = result.items.find((candidate) => candidate.propertyId === propertyId);
  return item ? { kind: "answered", rooms: item.rooms } : { kind: "no-answer" };
}

/** How far the prices in an answer can be trusted at a given moment. */
export type PriceFreshness =
  | { kind: "fresh"; /** The instant the answer stops being fresh. */ staleAt: number }
  | { kind: "stale"; reason: "expired" | "aged" }
  /** The answer carries no usable timestamp, so its age cannot be judged. Treated as stale by callers that need certainty. */
  | { kind: "undated" };

/**
 * Judges an answer's age. It is stale once the provider's own validity has passed, or once
 * it is older than `maxAgeMs`, whichever comes first. `obtainedAt` stands in when the provider
 * gave no `fetchedAt`: the moment this site received the answer. Instants are epoch milliseconds.
 */
export function getPriceFreshness(
  answer: Pick<AvailabilityAnswer, "fetchedAt" | "validUntil">,
  context: { now: number; maxAgeMs: number; obtainedAt?: number },
): PriceFreshness {
  const parse = (value: string | undefined) => {
    const instant = value === undefined ? Number.NaN : Date.parse(value);
    return Number.isNaN(instant) ? undefined : instant;
  };
  const fetchedAt = parse(answer.fetchedAt) ?? context.obtainedAt;
  const validUntil = parse(answer.validUntil);
  // A validity the provider stated but that cannot be read must not be mistaken for "no limit".
  if (answer.validUntil !== undefined && validUntil === undefined) return { kind: "stale", reason: "expired" };
  if (fetchedAt === undefined && validUntil === undefined) return { kind: "undated" };
  if (validUntil !== undefined && context.now >= validUntil) return { kind: "stale", reason: "expired" };
  const agedAt = fetchedAt === undefined ? undefined : fetchedAt + context.maxAgeMs;
  if (agedAt !== undefined && context.now >= agedAt) return { kind: "stale", reason: "aged" };
  return { kind: "fresh", staleAt: Math.min(validUntil ?? Infinity, agedAt ?? Infinity) };
}

/**
 * Folds a later answer for some properties into an earlier one for the same stay: used to
 * retry only the properties that failed. Properties the later answer speaks for (answered or
 * failed) replace what was held; the rest are kept. Timestamps keep the older, stricter value,
 * so a merged answer is never fresher than its oldest part. Returns undefined when the two
 * are not for the same criteria or source, because they must then never be combined.
 */
export function mergeAnswers(
  held: AvailabilityAnswer,
  later: AvailabilityAnswer,
  laterPropertyIds: readonly string[],
): AvailabilityAnswer | undefined {
  if (!sameCriteria(held.criteria, later.criteria) || held.source !== later.source) return undefined;
  const replaced = new Set(laterPropertyIds);
  const keep = <T extends { propertyId: string }>(list: readonly T[] | undefined) => (list ?? []).filter((entry) => !replaced.has(entry.propertyId));
  const failures = [...keep(held.failures), ...(later.failures ?? [])];
  const older = (a: string | undefined, b: string | undefined) => (a !== undefined && b !== undefined ? (Date.parse(a) <= Date.parse(b) ? a : b) : (a ?? b));
  const fetchedAt = held.fetchedAt !== undefined && later.fetchedAt !== undefined ? older(held.fetchedAt, later.fetchedAt) : undefined;
  const validUntil = older(held.validUntil, later.validUntil);
  return {
    status: "ok",
    criteria: held.criteria,
    source: held.source,
    items: [...keep(held.items), ...later.items],
    ...(failures.length > 0 ? { failures } : {}),
    ...(fetchedAt !== undefined ? { fetchedAt } : {}),
    ...(validUntil !== undefined ? { validUntil } : {}),
  };
}

export function findRoomAvailability(
  result: AvailabilityResult | undefined,
  propertyId: string,
  roomTypeId: string,
): RoomAvailability | undefined {
  if (result?.status !== "ok") return undefined;
  // A property whose request failed has no rooms to speak of, whatever else the answer holds.
  const outcome = getPropertyOutcome(result, propertyId);
  return outcome.kind === "answered" ? outcome.rooms.find((room) => room.roomTypeId === roomTypeId) : undefined;
}
