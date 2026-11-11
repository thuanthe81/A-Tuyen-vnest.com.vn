"use client";

import { BookingBar } from "./BookingBar";
import { MobileBookingSearch } from "./MobileBookingSearch";
import { useStaySearch } from "./StaySearchProvider";

/**
 * The compact booking search, fixed to the top once the guest has scrolled past the full bar.
 *
 * It is position: fixed, so appearing and disappearing never moves the page. While it is
 * away it is inert: not focusable, not announced. `leading` is the slot for the site's own
 * navigation mark, so the bar shares one row with it and cannot overlap it.
 */
export function StickyBookingBar({ leading }: { leading?: React.ReactNode }) {
  const { stickyActive } = useStaySearch();
  return (
    <div
      inert={!stickyActive}
      className={`fixed inset-x-0 top-0 z-40 border-b border-line bg-surface transition-[translate,visibility] duration-(--vn-duration-base) ease-(--vn-ease-out) ${
        stickyActive ? "visible translate-y-0" : "invisible -translate-y-full"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-site items-center gap-4 px-(--vn-gutter)">
        {leading ? <div className="shrink-0">{leading}</div> : null}
        <div className="flex min-w-0 flex-1 justify-center">
          <BookingBar variant="compact" hidden={!stickyActive} className="hidden md:flex" />
          <MobileBookingSearch variant="compact" className="flex md:hidden" />
        </div>
        {/* Balances the leading slot so the bar stays optically centred. */}
        {leading ? <div aria-hidden="true" className="invisible hidden shrink-0 lg:block">{leading}</div> : null}
      </div>
    </div>
  );
}
