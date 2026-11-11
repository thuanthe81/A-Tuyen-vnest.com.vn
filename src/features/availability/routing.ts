/**
 * Where a stay search belongs. Two addresses share the work:
 *
 *   /stays                 every property: discovery, and results when there are dates
 *   /stays/[property]      one property: its page, and its rooms for the stay
 *
 * A property used to be chosen with `/stays?property=<slug>`. The booking bar (section 02.1,
 * frozen) still builds that address, and links to it may exist, so it is honoured by
 * redirecting to the property's own page. Pure functions, so the rule is tested without a server.
 */

import { parseMockAvailabilityScenario } from "@/config/mock-scenarios";
import { routes } from "@/config/routes";
import type { Locale } from "@/domain/locale";
import type { QueryInput, SearchCriteria } from "@/domain/search";
import { parseStaySearch } from "@/domain/search";

/** Adds the development scenario to a URL that may already carry a query. Nothing is added without one. */
export function withMockScenario(href: string, scenario: string | undefined): string {
  return scenario ? `${href}${href.includes("?") ? "&" : "?"}mock=${scenario}` : href;
}

/** A property's page for a stay. Dates and guests travel with every link, so no page has to ask twice. */
export function propertyHref(slug: string, locale: Locale, criteria: SearchCriteria, mockScenario?: string): string {
  return withMockScenario(routes.property(slug, locale, criteria), mockScenario);
}

/**
 * The address a legacy `/stays?property=<slug>` request should be sent to, or undefined when
 * it should stay on `/stays`.
 *
 * Only what can be read is carried over: valid dates and a valid guest count. A malformed
 * value is dropped, exactly as `/stays` would drop it, and never passed along. A property
 * the site does not know is no reason to redirect: the search then covers every property,
 * as it always has. Nothing from the request is copied into the address unparsed.
 */
export function legacyPropertyRedirect(query: QueryInput, knownSlugs: readonly string[], locale: Locale, options: { mockEnabled?: boolean } = {}): string | undefined {
  const { state } = parseStaySearch(query);
  const slug = state.filters.property;
  if (!slug || !knownSlugs.includes(slug)) return undefined;
  const scenario = options.mockEnabled ? parseMockAvailabilityScenario(query.mock) : undefined;
  return propertyHref(slug, locale, state.criteria, scenario);
}
