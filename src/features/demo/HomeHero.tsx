"use client";

import type { ReactNode } from "react";
import type { HeroSlide } from "./hero-slides";
import { HERO_AUTOPLAY_INTERVAL } from "./hero-timing";
import { useLocale } from "@/features/locale/LocaleProvider";
import { HeroCarousel } from "./HeroCarousel";
import { siteCopyFor } from "./site-copy";
import styles from "./Demo.module.css";

/**
 * CEO DEMO HERO (21/10/2026; carousel from VNest V3 Stage 1, 24/10/2026): the dominant first
 * screen (about 66vh on desktop) with the frozen 02.1 floating bar over its lower edge, passed in
 * as `booking`. The single Pepper House poster became a curated carousel of approved photographs
 * (CEO R04; `hero-slides.ts`), still opening on Pepper House. The heading and lead are unchanged.
 *
 * No video: the Pepper House showcase on YouTube (EBBBXnSAX0E) is published by GEMA Architecture &
 * Interior Design, not VNest, and its reuse rights are not cleared (the CEO asked for photographs).
 */
export function HomeHero({ booking, slides }: { booking: ReactNode; slides: readonly HeroSlide[] }) {
  const copy = siteCopyFor(useLocale());
  return (
    <HeroCarousel
      slides={slides}
      interval={HERO_AUTOPLAY_INTERVAL}
      labelledBy="demo-title"
      booking={booking}
      text={
        <>
          <p className={styles.heroKicker}>VNest · Hospitality Management</p>
          <h1 id="demo-title" className={styles.heroTitle}>
            {copy.heroTitle}
          </h1>
          <p className={styles.heroLead}>{copy.heroLead}</p>
        </>
      }
    />
  );
}
