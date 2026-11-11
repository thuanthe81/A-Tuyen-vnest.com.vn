/**
 * Stay search state and its URL representation.
 *
 * Two kinds of state share the query string:
 *
 *   SearchCriteria  checkIn, checkOut, adults    what the guest wants to book.
 *                                                Carried on every stay link.
 *   BrowseFilters   property, destination        which properties a search covers.
 *
 * No `property` means every VNest property: that is the default search, not a missing value.
 * On a property's own page the property is the route, not a parameter.
 */

import { isBefore, nightsBetween, parseIsoDate } from "./dates.ts";
import type { IsoDate } from "./dates.ts";

export const DEFAULT_ADULTS = 2;
/** Sanity ceiling for parsing only. Real limits come from provider StayRules. */
export const MAX_PARSEABLE_ADULTS = 99;

export interface SearchCriteria {
  checkIn?: IsoDate;
  checkOut?: IsoDate;
  adults: number;
  /** Reserved. Not parsed or shown until policy and the booking provider support children. */
  children?: number;
}

/** Criteria with both dates present: the only form an availability search accepts. */
export interface DatedCriteria extends SearchCriteria {
  checkIn: IsoDate;
  checkOut: IsoDate;
}

/** Browse filters narrow which properties a search covers; they are not stay criteria. */
export interface BrowseFilters {
  /** Slug of one property to search. Absent means all properties. Optional by design: never an error. */
  property?: string;
  destination?: string;
}

export interface StaySearchState {
  criteria: SearchCriteria;
  filters: BrowseFilters;
}

/** Stay restrictions. Supplied by the booking provider, which stays authoritative. */
export interface StayRules {
  minNights?: number;
  maxNights?: number;
  maxAdults?: number;
}

export type CriteriaIssue =
  | { code: "malformed-date"; field: "checkIn" | "checkOut" }
  | { code: "malformed-adults" }
  | { code: "missing-date"; field: "checkIn" | "checkOut" }
  | { code: "check-out-not-after-check-in" }
  | { code: "check-in-in-past" }
  | { code: "below-min-nights"; minNights: number }
  | { code: "above-max-nights"; maxNights: number }
  | { code: "above-max-adults"; maxAdults: number };

export type QueryInput = Readonly<Record<string, string | readonly string[] | undefined>>;

function first(value: string | readonly string[] | undefined): string | undefined {
  const single = typeof value === "string" ? value : value?.[0];
  const trimmed = single?.trim();
  return trimmed ? trimmed : undefined;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}

export function parseSlug(value: string | readonly string[] | undefined): string | undefined {
  const single = first(value);
  return single !== undefined && isSlug(single) ? single : undefined;
}

/**
 * Reads search state from URL query parameters. Never throws: values that cannot be
 * understood are dropped and reported, so a hand-edited or stale link still renders.
 */
export function parseStaySearch(query: QueryInput): { state: StaySearchState; issues: CriteriaIssue[] } {
  const issues: CriteriaIssue[] = [];
  const criteria: SearchCriteria = { adults: DEFAULT_ADULTS };

  for (const field of ["checkIn", "checkOut"] as const) {
    const raw = first(query[field]);
    if (raw === undefined) continue;
    const date = parseIsoDate(raw);
    if (date) criteria[field] = date;
    else issues.push({ code: "malformed-date", field });
  }

  const rawAdults = first(query.adults);
  if (rawAdults !== undefined) {
    const adults = /^\d{1,2}$/.test(rawAdults) ? Number(rawAdults) : Number.NaN;
    if (adults >= 1 && adults <= MAX_PARSEABLE_ADULTS) criteria.adults = adults;
    else issues.push({ code: "malformed-adults" });
  }

  const filters: BrowseFilters = {};
  // A property that cannot be read falls back to all properties without complaint.
  const property = parseSlug(query.property);
  if (property) filters.property = property;
  const destination = parseSlug(query.destination);
  if (destination) filters.destination = destination;

  return { state: { criteria, filters }, issues };
}

/** Query string for stay criteria only. Used on links into property and room pages. */
export function serializeCriteria(criteria: SearchCriteria): string {
  const params = new URLSearchParams();
  if (criteria.checkIn) params.set("checkIn", criteria.checkIn);
  if (criteria.checkOut) params.set("checkOut", criteria.checkOut);
  if (criteria.adults !== DEFAULT_ADULTS) params.set("adults", String(criteria.adults));
  return params.toString();
}

/** Query string for a stay search: browse filters followed by stay criteria. */
export function serializeStaySearch(state: StaySearchState): string {
  const params = new URLSearchParams();
  if (state.filters.property) params.set("property", state.filters.property);
  if (state.filters.destination) params.set("destination", state.filters.destination);
  const criteria = serializeCriteria(state.criteria);
  const filters = params.toString();
  return [filters, criteria].filter(Boolean).join("&");
}

export function hasDates(criteria: SearchCriteria): criteria is DatedCriteria {
  return criteria.checkIn !== undefined && criteria.checkOut !== undefined;
}

/** Whether two sets of criteria ask for the same stay. An answer for one says nothing about another. */
export function sameCriteria(a: SearchCriteria, b: SearchCriteria): boolean {
  return a.checkIn === b.checkIn && a.checkOut === b.checkOut && a.adults === b.adults && a.children === b.children;
}

export interface ValidationContext {
  /**
   * Today's calendar date at the property. Pass it only when the property's timezone
   * is known; without it no past-date judgement is made and the provider decides.
   */
  today?: IsoDate;
  rules?: StayRules;
}

/**
 * Checks criteria the frontend can judge by itself. This is a courtesy to the guest,
 * not the final word: provider restrictions remain authoritative.
 * No dates at all is valid (browse mode) and returns no issues.
 */
export function validateCriteria(criteria: SearchCriteria, context: ValidationContext = {}): CriteriaIssue[] {
  const issues: CriteriaIssue[] = [];
  const { checkIn, checkOut } = criteria;
  const { today, rules } = context;

  if (rules?.maxAdults !== undefined && criteria.adults > rules.maxAdults) {
    issues.push({ code: "above-max-adults", maxAdults: rules.maxAdults });
  }

  if (checkIn === undefined && checkOut === undefined) return issues;
  if (checkIn === undefined) return [...issues, { code: "missing-date", field: "checkIn" }];
  if (checkOut === undefined) return [...issues, { code: "missing-date", field: "checkOut" }];

  if (today !== undefined && isBefore(checkIn, today)) issues.push({ code: "check-in-in-past" });

  const nights = nightsBetween(checkIn, checkOut);
  if (nights <= 0) {
    issues.push({ code: "check-out-not-after-check-in" });
    return issues;
  }
  if (rules?.minNights !== undefined && nights < rules.minNights) {
    issues.push({ code: "below-min-nights", minNights: rules.minNights });
  }
  if (rules?.maxNights !== undefined && nights > rules.maxNights) {
    issues.push({ code: "above-max-nights", maxNights: rules.maxNights });
  }
  return issues;
}
