"use client";

import Link from "next/link";
import { routes } from "@/config/routes";
import { site } from "@/config/site";
import { BookingBar } from "@/features/booking-search/BookingBar";
import { MobileBookingSearch } from "@/features/booking-search/MobileBookingSearch";
import { SEARCH_BAR_ATTRIBUTE } from "./search-control";

/**
 * The search this page answers, always in reach at the top: the compact booking bar from
 * section 02.1, placed as it is. Nothing of that section is changed; this only gives its
 * compact presentations a row to sit in, as its own sticky bar does.
 *
 * The site header (section 03.1) is not built, so a plain text link home stands where it will be.
 */
export function ResultsSearchBar() {
  const mark = (
    <Link href={routes.home()} className="flex h-11 items-center text-lg font-semibold tracking-tight text-ink">
      {site.name}
    </Link>
  );
  return (
    <div {...{ [SEARCH_BAR_ATTRIBUTE]: "" }} className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-site items-center gap-4 px-(--vn-gutter)">
        <div className="shrink-0">{mark}</div>
        <div className="flex min-w-0 flex-1 justify-center">
          <BookingBar variant="compact" className="hidden md:flex" />
          <MobileBookingSearch variant="compact" className="flex md:hidden" />
        </div>
        {/* Balances the mark so the bar stays optically centred. */}
        <div aria-hidden="true" className="invisible hidden shrink-0 lg:block">
          <span className="text-lg font-semibold tracking-tight">{site.name}</span>
        </div>
      </div>
    </div>
  );
}
