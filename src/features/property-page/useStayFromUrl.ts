"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { parseMockAvailabilityScenario } from "@/config/mock-scenarios";
import type { CriteriaIssue, StaySearchState } from "@/domain/search";
import { parseStaySearch, serializeStaySearch, validateCriteria } from "@/domain/search";
import { todayInTimeZone } from "@/lib/today";

export interface StayFromUrl {
  /** The stay in the URL, with this property as the one searched. */
  search: StaySearchState;
  issues: readonly CriteriaIssue[];
  /** Changes exactly when the stay does. */
  key: string;
  /** Development only: the simulated scenario the URL names, if it is a known one. */
  mockFromUrl: string | undefined;
}

/**
 * The stay a property page was opened with, read in the browser.
 *
 * The server never reads the dates: that keeps the page itself the same for every guest, so
 * it can be generated ahead of time and cached, with one canonical address. Dates and guests
 * are the guest's own, and only the booking parts of the page need them.
 *
 * Anything that uses this must sit inside a Suspense boundary.
 */
export function useStayFromUrl(propertySlug: string, timeZone: string | undefined): StayFromUrl {
  const params = useSearchParams();
  const query = params.toString();
  // Parsed once per URL, so the same stay is the same object and never looks like a new search.
  return useMemo(() => {
    const read = Object.fromEntries(new URLSearchParams(query));
    const { state, issues } = parseStaySearch(read);
    const today = todayInTimeZone(timeZone);
    const search = { criteria: state.criteria, filters: { property: propertySlug } };
    return {
      search,
      issues: [...issues, ...validateCriteria(state.criteria, today ? { today } : {})],
      key: serializeStaySearch(search),
      mockFromUrl: parseMockAvailabilityScenario(read.mock),
    };
  }, [query, propertySlug, timeZone]);
}
