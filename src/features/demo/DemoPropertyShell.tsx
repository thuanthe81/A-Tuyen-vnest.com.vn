"use client";

import Link from "next/link";
import { useLayoutEffect, type ReactNode } from "react";
import { serializeStaySearch, type StaySearchState } from "@/domain/search";
import type { PropertyOption } from "@/features/booking-search/search-form";
import { StaySearchProvider } from "@/features/booking-search/StaySearchProvider";
import { DemoBookingScope } from "./BookingCta";
import { DemoFooter } from "./DemoFooter";
import { DemoLinkGuard } from "./DemoLinkGuard";
import { HomepageBookingOverlays } from "./HomepageBookingOverlays";
import { DEMO_LINKS } from "./links";
import { SiteHeader } from "./SiteHeader";
import styles from "./Demo.module.css";

/**
 * A DEMO PROPERTY PAGE'S FRAME (VNest V3 Stage 1, 24/10/2026, CEO R02): the site header carrying
 * the one compact 02.1 bar, then the page. It replaces the pair the CEO saw on 23/10: the demo
 * header followed by the 02.2 results bar (`PropertySearchBar`), which brought its own "VNest" and
 * made two bars in a row.
 *
 * One StaySearchProvider wraps the whole page, so the bar, the photo viewers and the room drawers
 * share one stay: BOOK NOW anywhere carries the same property, dates and guests. It is keyed by the
 * stay in the address, as `PropertySearchBar` was, so the bar always shows the stay the page was
 * opened with (e.g. returning from the booking step).
 */
export function DemoPropertyShell({ initial, options, children }: { initial: StaySearchState; options: readonly PropertyOption[]; children: ReactNode }) {
  const propertySlug = initial.filters.property && initial.filters.property !== "all" ? initial.filters.property : undefined;

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [propertySlug]);

  return (
    <StaySearchProvider key={serializeStaySearch(initial)} properties={options} initial={initial}>
      <DemoBookingScope propertyId={propertySlug}>
        <HomepageBookingOverlays>
          <SiteHeader booking="always" />
          <DemoLinkGuard />
          <nav aria-label="Quay lại danh sách nơi ở" className={styles.backRow}>
            <Link href={DEMO_LINKS.discover} className={styles.back}>
              <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 10H4.5M9 5 4 10l5 5" />
              </svg>
              Xem tất cả nơi ở
            </Link>
          </nav>
          <div className={styles.demoPropertyScope}>{children}</div>
          <DemoFooter />
        </HomepageBookingOverlays>
      </DemoBookingScope>
    </StaySearchProvider>
  );
}
