"use client";

import { routes } from "@/config/routes";
import { site } from "@/config/site";
import { staySummaryText } from "@/features/availability/stay-summary";
import { useStayFromUrl } from "@/features/property-page/useStayFromUrl";
import { ArrowRight } from "../b/icons";
import { COPY } from "../content";
import styles from "./lf.module.css";

/**
 * The guest's own stay, read from the address exactly as the criteria bar reads it. Nothing
 * here decides or asks anything about availability. Each use sits inside a Suspense boundary
 * with a placeholder of the same size, so the line arriving moves nothing.
 */
export function StayLine({ slug }: { slug: string }) {
  const { search } = useStayFromUrl(slug, undefined);
  return <>{staySummaryText(search.criteria) ?? COPY.noDates}</>;
}

/** The way into the existing room selection for this property, carrying the same stay. */
export function RoomsLink({ slug }: { slug: string }) {
  const { search } = useStayFromUrl(slug, undefined);
  return (
    <a href={`${routes.property(slug, site.defaultLocale, search.criteria)}#rooms`} className={styles.cta}>
      {COPY.seeRooms}
      <ArrowRight />
    </a>
  );
}
