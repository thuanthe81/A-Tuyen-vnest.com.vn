"use client";

import { useEffect, useRef } from "react";
import { BookingBar } from "./BookingBar";
import { MobileBookingSearch } from "./MobileBookingSearch";
import { useStaySearch } from "./StaySearchProvider";

/**
 * The primary booking search, for placing over a hero: the floating bar from 768px up,
 * the booking pill below that.
 *
 * It also marks the boundary for the sticky bar. An IntersectionObserver reports when this
 * element has scrolled out past the top of the viewport; nothing listens to scroll events
 * and no pixel offset is hard-coded, so the hand-over is right whatever the hero's height.
 */
export function HeroBookingBar({ className = "" }: { className?: string }) {
  const { stickyActive, setStickyActive } = useStaySearch();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        // Out of view and above the fold means scrolled past, not "not reached yet".
        setStickyActive(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
      },
      { threshold: 0 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [setStickyActive]);

  return (
    <div ref={ref} className={`flex w-full justify-center ${className}`}>
      <BookingBar variant="full" hidden={stickyActive} className="hidden md:flex" />
      <MobileBookingSearch variant="hero" className="flex md:hidden" />
    </div>
  );
}
