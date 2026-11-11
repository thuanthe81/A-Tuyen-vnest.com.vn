/**
 * The availability check behind /api/availability, kept free of HTTP so it can be tested.
 *
 * The browser asks this site, and only this site talks to the provider: credentials and
 * provider identifiers never leave the server.
 *
 * Two searches are supported. With `property`, one property is checked. Without it, every
 * property is checked: that is the default search, not an error.
 */

import { booking } from "@/config/booking";
import { site } from "@/config/site";
import type { AvailabilityResult, SearchScope } from "@/domain/availability";
import type { BookingCapabilities } from "@/domain/booking";
import type { IsoDate } from "@/domain/dates";
import { DEFAULT_LOCALE } from "@/domain/locale";
import type { CriteriaIssue, QueryInput, SearchCriteria, StayRules } from "@/domain/search";
import { hasDates, parseSlug, parseStaySearch, validateCriteria } from "@/domain/search";
import { todayInTimeZone } from "@/lib/today";
import type { Services } from "./services";

export interface ResolvedScope {
  scope: SearchScope;
  propertyIds: readonly string[];
  /** Timezone that decides "today": the property's own, or the site's for a search across properties. */
  timeZone: string | undefined;
}

/** Turns "one property or all of them" into the explicit list of properties a provider is asked about. */
export async function resolveSearchScope(services: Services, propertySlug: string | undefined): Promise<ResolvedScope | undefined> {
  if (propertySlug === undefined) {
    const properties = await services.properties.listProperties(DEFAULT_LOCALE);
    return { scope: "all-properties", propertyIds: properties.map((property) => property.id), timeZone: site.timeZone };
  }
  const property = await services.properties.getProperty(propertySlug, DEFAULT_LOCALE);
  return property ? { scope: "single-property", propertyIds: [property.id], timeZone: property.place.timeZone } : undefined;
}

export interface AvailabilityResponse {
  scope: SearchScope;
  propertyIds: readonly string[];
  criteria: SearchCriteria;
  /** Problems with the dates or guests. When any exist, no availability was asked for. */
  issues: readonly CriteriaIssue[];
  rules: StayRules;
  /** Today where the search applies, when the timezone is known. */
  today?: IsoDate;
  capabilities: BookingCapabilities;
  /** Absent in browse mode (no dates) and when the criteria have issues. */
  result?: AvailabilityResult;
  /**
   * This site's clock when it answered, as an ISO 8601 instant. The browser measures an
   * answer's age from here, not from its own clock, which may be wrong.
   */
  servedAt: string;
}

export type AvailabilityOutcome =
  | { status: 200; body: AvailabilityResponse }
  | { status: 400; body: { error: "invalid-property" } }
  | { status: 404; body: { error: "unknown-property" } };

function hasValue(value: string | readonly string[] | undefined): boolean {
  return (typeof value === "string" ? value : value?.[0])?.trim() ? true : false;
}

/** The provider's answer, or a timeout failure once the bound passes. The late answer is dropped. */
function bounded(search: Promise<AvailabilityResult>, timeoutMs: number): Promise<AvailabilityResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<AvailabilityResult>((resolve) => {
    timer = setTimeout(() => resolve({ status: "error", reason: "timeout", retryable: true }), timeoutMs);
  });
  return Promise.race([search, timeout]).finally(() => clearTimeout(timer));
}

export async function checkAvailability(
  services: Services,
  query: QueryInput,
  now: Date = new Date(),
  providerTimeoutMs: number = booking.providerTimeoutMs,
): Promise<AvailabilityOutcome> {
  const slug = parseSlug(query.property);
  // No property is a valid request for all properties; a property that cannot be read is a caller error.
  if (!slug && hasValue(query.property)) return { status: 400, body: { error: "invalid-property" } };

  const resolved = await resolveSearchScope(services, slug);
  if (!resolved) return { status: 404, body: { error: "unknown-property" } };
  const { scope, propertyIds } = resolved;

  const { state, issues: parseIssues } = parseStaySearch(query);
  const { criteria } = state;
  const rules = await services.booking.getStayRules(scope === "single-property" ? propertyIds[0] : undefined);
  const today = todayInTimeZone(resolved.timeZone, now);
  const issues = [...parseIssues, ...validateCriteria(criteria, { today, rules })];

  const result =
    issues.length === 0 && hasDates(criteria) && propertyIds.length > 0
      ? await bounded(
          services.booking.searchAvailability({ criteria, scope, propertyIds }).catch(
            // An adapter that throws is a provider fault; the caller still gets a value to render.
            (): AvailabilityResult => ({ status: "error", reason: "provider", retryable: true }),
          ),
          providerTimeoutMs,
        )
      : undefined;

  return {
    status: 200,
    body: {
      scope,
      propertyIds,
      criteria,
      issues,
      rules,
      ...(today ? { today } : {}),
      capabilities: services.booking.capabilities,
      ...(result ? { result } : {}),
      servedAt: now.toISOString(),
    },
  };
}
