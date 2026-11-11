"use client";

import Link from "next/link";
import { routes } from "@/config/routes";
import { site } from "@/config/site";
import { resultsCopy } from "@/features/availability/copy";
import { ArrowLeftIcon } from "@/features/availability/parts";
import { ResultsSearchBar } from "@/features/availability/ResultsSearchBar";
import { withMockScenario } from "@/features/availability/routing";
import type { PropertyOption } from "@/features/booking-search/search-form";
import { StaySearchProvider } from "@/features/booking-search/StaySearchProvider";
import { hasDates } from "@/domain/search";
import { useStayFromUrl } from "./useStayFromUrl";

/**
 * The booking criteria, always in reach at the top of a property page, and the one way back
 * to every property for the same stay. The bar is section 02.1's, placed unchanged: a search
 * from it goes where it always has, and the site then brings the guest to the right page.
 */
export function PropertySearchBar({ slug, timeZone, options, mockEnabled }: { slug: string; timeZone: string | undefined; options: readonly PropertyOption[]; mockEnabled: boolean }) {
  const { search, key, mockFromUrl } = useStayFromUrl(slug, timeZone);
  const all = withMockScenario(routes.stays(site.defaultLocale, { criteria: search.criteria, filters: {} }), mockEnabled ? mockFromUrl : undefined);
  return (
    <>
      {/* Keyed by the stay, so the bar always shows the search the page is answering, including after back and forward. */}
      <StaySearchProvider key={key} properties={options} initial={search}>
        <ResultsSearchBar />
      </StaySearchProvider>
      <nav aria-label={resultsCopy.backToAllBrowse} className="mx-auto max-w-site px-(--vn-gutter) pt-2">
        <Link href={all} className="-ml-1 inline-flex h-11 items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors duration-(--vn-duration-fast) hover:text-ink">
          <ArrowLeftIcon />
          {hasDates(search.criteria) ? resultsCopy.backToAll : resultsCopy.backToAllBrowse}
        </Link>
      </nav>
    </>
  );
}

/** The bar's place while the URL is read, so nothing below it moves when it arrives. */
export function PropertySearchBarFallback() {
  return (
    <>
      <div aria-hidden="true" className="sticky top-0 z-40 h-[4.0625rem] border-b border-line bg-surface" />
      <div aria-hidden="true" className="h-[3.25rem]" />
    </>
  );
}
