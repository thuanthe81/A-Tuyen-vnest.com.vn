"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { MouseEvent } from "react";
import { LOCALES, type Locale } from "@/domain/locale";
import { rememberLocale, useLocale } from "./LocaleProvider";
import { withLocale } from "./preview-locale";
import styles from "./LanguageSwitch.module.css";

const NAMES: Record<Locale, { short: string; name: string }> = {
  vi: { short: "VI", name: "Tiếng Việt" },
  en: { short: "EN", name: "English" },
};

/**
 * "VI | EN" (owner brief, 6/11/2026): two real links to the same page in each language, the active one marked. Switching
 * keeps every parameter (dates, guests, rooms, room choices) and the hash, replaces the history entry (language is a
 * preference: Back goes to the previous page, in the chosen language) and keeps the page's own state (a soft navigation).
 * Private review routes only, until the release gate in docs/i18n/BILINGUAL-PLAN.md §4.
 */
export function LanguageSwitch({ className, onSwitch }: { className?: string; onSwitch?: () => void }) {
  const locale = useLocale();
  const pathname = usePathname() ?? "/";
  const params = useSearchParams();
  const router = useRouter();
  const current = `${pathname}${params?.size ? `?${params.toString()}` : ""}`;

  const go = (event: MouseEvent<HTMLAnchorElement>, target: Locale) => {
    event.preventDefault();
    if (target === locale) return;
    rememberLocale(target);
    onSwitch?.();
    router.replace(withLocale(`${location.pathname}${location.search}${location.hash}`, target), { scroll: false });
  };

  return (
    <nav className={`${styles.switch} ${className ?? ""}`} aria-label={locale === "en" ? "Language" : "Ngôn ngữ"} data-testid="language-switch">
      {LOCALES.map((code, i) => (
        <span key={code} className={styles.item}>
          {i > 0 ? (
            <span className={styles.divider} aria-hidden="true">
              |
            </span>
          ) : null}
          <a
            href={withLocale(current, code)}
            hrefLang={code}
            lang={code}
            className={styles.link}
            aria-current={code === locale ? "true" : undefined}
            aria-label={NAMES[code].name}
            data-locale={code}
            onClick={(event) => go(event, code)}
          >
            {NAMES[code].short}
          </a>
        </span>
      ))}
    </nav>
  );
}
