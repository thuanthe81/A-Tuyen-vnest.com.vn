"use client";

import { useMemo } from "react";
import type { PropertyCardModel } from "@/components/property-card/model";
import { site } from "@/config/site";
import type { CriteriaIssue, StayRules, StaySearchState } from "@/domain/search";
import { serializeStaySearch } from "@/domain/search";
import type { PropertyOption } from "@/features/booking-search/search-form";
import { StaySearchProvider } from "@/features/booking-search/StaySearchProvider";
import { AllPropertiesResults } from "./AllPropertiesResults";
import { ResultsSearchBar } from "./ResultsSearchBar";
import { propertyHref } from "./routing";
import { staySummaryText } from "./stay-summary";
import { useAvailability } from "./useAvailability";
import { useMockScenario } from "./useMockScenario";
import type { RoomView } from "./view-models";

/**
 * The results page in the browser: every property, and which of them has a room for the
 * searched stay. The server has already rendered what the site holds about each property;
 * this adds the one thing only a provider knows.
 *
 * A property chosen here opens that property's own page (/stays/[property]). The answer is
 * kept in the layout the two pages share, so its rooms appear from the answer already in hand.
 */
export function StaysExperience({
  cards,
  rooms,
  options,
  search,
  issues,
  rules,
  mock,
}: {
  /** Every property, in VNest's own order. */
  cards: readonly PropertyCardModel[];
  rooms: Readonly<Record<string, readonly RoomView[]>>;
  /** The same properties as the booking bar offers them. */
  options: readonly PropertyOption[];
  /** The search in the URL, parsed on the server. Never names a property: that is the property page's address. */
  search: StaySearchState;
  issues: readonly CriteriaIssue[];
  rules: StayRules;
  /** Present only when the mock provider is configured. */
  mock: { fromUrl: string | undefined } | undefined;
}) {
  const { criteria } = search;
  const mockScenario = useMockScenario(mock?.fromUrl, mock !== undefined);
  // The same list for the same cards, so a re-render never looks like a new search.
  const allPropertyIds = useMemo(() => cards.map((candidate) => candidate.id), [cards]);
  const { view, reload, retryProperty, retrying } = useAvailability({ criteria, issues, property: undefined, allPropertyIds, mockScenario });
  const stayKey = serializeStaySearch(search);

  return (
    <>
      {/* Keyed by the search, so the bar always shows the search the page is answering, including after back and forward. */}
      <StaySearchProvider key={stayKey} properties={options} initial={search} rules={rules}>
        <ResultsSearchBar />
      </StaySearchProvider>

      <main id="results">
        <AllPropertiesResults
          cards={cards}
          rooms={rooms}
          criteria={criteria}
          staySummary={staySummaryText(criteria)}
          view={view}
          timeZone={site.timeZone}
          retrying={retrying}
          onReload={reload}
          onRetryProperty={retryProperty}
          // Links carry the stay, and the development scenario when the URL names one.
          roomsHref={(slug) => propertyHref(slug, site.defaultLocale, criteria, mock?.fromUrl)}
        />
      </main>
    </>
  );
}
