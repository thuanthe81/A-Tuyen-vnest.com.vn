import type { Locale } from "@/domain/locale";
import { DEFAULT_LOCALE } from "@/domain/locale";
import { serializeCriteria, serializeStaySearch } from "@/domain/search";
import type { SearchCriteria, StaySearchState } from "@/domain/search";

/**
 * Every internal URL is built here, so stay criteria are carried consistently and the URL
 * scheme can change in one place.
 *
 * Path words are provisional: whether public URLs use English or Vietnamese words is VNest's
 * decision and must be settled before launch, because changing an indexed URL costs ranking.
 *
 * The primary language has no prefix; any other language is prefixed (/en/...).
 */
const SEGMENT = { stays: "stays", rooms: "rooms" } as const;

function localePrefix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "" : `/${locale}`;
}

function withQuery(path: string, query: string): string {
  return query ? `${path}?${query}` : path;
}

export const routes = {
  home: (locale: Locale = DEFAULT_LOCALE) => localePrefix(locale) || "/",
  stays: (locale: Locale = DEFAULT_LOCALE, state?: StaySearchState) =>
    withQuery(`${localePrefix(locale)}/${SEGMENT.stays}`, state ? serializeStaySearch(state) : ""),
  property: (slug: string, locale: Locale = DEFAULT_LOCALE, criteria?: SearchCriteria) =>
    withQuery(`${localePrefix(locale)}/${SEGMENT.stays}/${slug}`, criteria ? serializeCriteria(criteria) : ""),
  room: (propertySlug: string, roomSlug: string, locale: Locale = DEFAULT_LOCALE, criteria?: SearchCriteria) =>
    withQuery(
      `${localePrefix(locale)}/${SEGMENT.stays}/${propertySlug}/${SEGMENT.rooms}/${roomSlug}`,
      criteria ? serializeCriteria(criteria) : "",
    ),
  api: {
    /** Availability for one property, or for all properties when none is given. Never indexed, never cached. */
    availability: (criteria: SearchCriteria, propertySlug?: string, mockScenario?: string) =>
      withQuery(
        "/api/availability",
        [serializeStaySearch({ criteria, filters: propertySlug ? { property: propertySlug } : {} }), mockScenario ? `mock=${mockScenario}` : ""]
          .filter(Boolean)
          .join("&"),
      ),
  },
  /** Development-only previews. Never indexed, excluded in robots.txt. */
  dev: {
    bookingSearch: (state?: StaySearchState) => withQuery("/dev/booking-search", state ? serializeStaySearch(state) : ""),
    /** Stand-in search handler until the results page (section 02.2) exists. */
    bookingSearchResults: (state?: StaySearchState) => withQuery("/dev/booking-search/results", state ? serializeStaySearch(state) : ""),
  },
  /** Stand-in for a provider's hosted engine, used only by the mock hand-off scenarios. Built in Phase 02. */
  mockEngine: "/dev/mock-booking-engine",
} as const;
