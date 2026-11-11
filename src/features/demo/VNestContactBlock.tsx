"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/features/locale/LocaleProvider";
import { ContactChannels } from "./ContactChannels";
import { DEMO_HOME } from "./links";
import { siteCopyFor } from "./site-copy";
import styles from "./OwnerJourney.module.css";

/**
 * VNest's identity: the official artwork (unaltered), "Hospitality Management" and, unless `compact`, the confirmed
 * one-line introduction. Used by the contact composition below and by the homepage's minimal footer.
 */
export function VNestBrand({ compact = false }: { compact?: boolean }) {
  const copy = siteCopyFor(useLocale());
  return (
    <div className={styles.footerBrand}>
      <a href={DEMO_HOME} className={styles.footerLogo} aria-label={copy.homeLabel}>
        {/* eslint-disable-next-line @next/next/no-img-element -- VNest's own artwork in approved Copper Bronze */}
        <img src="/dev-fixtures/brand-collection/vnest-symbol-approved.svg" alt="" width={456} height={449} style={{ height: compact ? "2.5rem" : "3rem" }} />
        {/* eslint-disable-next-line @next/next/no-img-element -- VNest's own artwork in approved Dark Olive */}
        <img src="/dev-fixtures/brand-collection/vnest-wordmark-approved.svg" alt="" width={704} height={168} style={{ height: compact ? "1.8rem" : "2.2rem" }} />
      </a>
      <p className={styles.footerTagline} lang="en">
        Hospitality Management
      </p>
      {compact ? null : <p className={styles.footerDescriptor}>{copy.footerDescriptor}</p>}
    </div>
  );
}

/**
 * VNest CONTACT COMPOSITION (footer design of 25/10/2026, restored as the homepage contact section after the owner's
 * review of 7/11/2026): VNest's identity on the left, a standalone Dark Olive (#37412F) contact card on the right with
 * "Bắt đầu một cuộc trò chuyện.", hotline, email, address, one consultation CTA (`cta`) and Facebook. Phones stack them.
 *
 * Written once for the homepage `#lien-he` section and the property pages' full footer. `titleId` names the card's `h2`;
 * with `cardSection` the card is its own landmark section (footer), otherwise the enclosing section labels itself with it.
 */
export function VNestContactBlock({ titleId, cta, cardSection = false }: { titleId: string; cta: ReactNode; cardSection?: boolean }) {
  const copy = siteCopyFor(useLocale());
  const Card = cardSection ? "section" : "div";
  return (
    <div className={styles.footerTop}>
      <VNestBrand />
      <Card className={styles.footerContact} aria-labelledby={cardSection ? titleId : undefined}>
        <p className={styles.footerContactKicker}>{copy.footerContactKicker}</p>
        <h2 id={titleId} className={styles.footerContactTitle}>
          {copy.footerContactTitle}
        </h2>
        <ContactChannels tone="dark" action={cta} />
      </Card>
    </div>
  );
}
