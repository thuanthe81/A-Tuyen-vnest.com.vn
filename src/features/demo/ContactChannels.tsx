"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/features/locale/LocaleProvider";
import { siteCopyFor } from "./site-copy";
import { VNEST_CONTACT } from "./vnest-contact";
import styles from "./OwnerJourney.module.css";

/**
 * VNest's contact channels (hotline, email, address, Facebook), written once for the homepage contact panel and the
 * property-page footer (`tone="dark"`, on Dark Olive) and the header menu (`tone="light"`, `compact`). `action` goes before
 * the Facebook link.
 */
export function ContactChannels({ tone, action, compact = false }: { tone: "light" | "dark"; action?: ReactNode; compact?: boolean }) {
  const copy = siteCopyFor(useLocale());
  return (
    <div className={styles.channelGroup} data-tone={tone} data-size={compact ? "compact" : undefined}>
      <ul className={styles.channels}>
        <li>
          <span className={styles.channelLabel}>Hotline</span>
          <a href={VNEST_CONTACT.phone.href} className={styles.channelBig}>
            {VNEST_CONTACT.phone.display}
          </a>
        </li>
        <li>
          <span className={styles.channelLabel}>Email</span>
          <a href={VNEST_CONTACT.email.href} className={styles.channelLink}>
            {VNEST_CONTACT.email.display}
          </a>
        </li>
        {/* The menu (compact) leaves the address to the contact section, so the overlay fits a phone screen. */}
        {compact ? null : (
          <li>
            <span className={styles.channelLabel}>{copy.footerAddress}</span>
            {/* A postal address is shown as written (Vietnamese), in both languages. */}
            <address className={styles.channelText} lang="vi">
              {VNEST_CONTACT.address}
            </address>
          </li>
        )}
      </ul>
      <div className={styles.channelActions}>
        {action}
        <a href={VNEST_CONTACT.facebook.href} className={styles.social} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V10.5H7.8v3h2.6V21h3.1Z" />
          </svg>
          Facebook<span className="sr-only"> {copy.footerFacebook}</span>
        </a>
      </div>
    </div>
  );
}
