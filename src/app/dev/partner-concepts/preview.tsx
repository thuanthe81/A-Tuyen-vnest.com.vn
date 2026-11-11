import Link from "next/link";
import type { ReactNode } from "react";
import { isLocale, resolveLocalized, type Locale } from "@/domain/locale";
import { isServiceId, type ServiceId } from "@/features/demo/owner-journey";
import { PARTNER_CONCEPT_COPY } from "@/features/partner-concepts/partner-concepts";
import demoStyles from "@/features/demo/Demo.module.css";
import styles from "./preview.module.css";

/**
 * Review frame for the two Hợp tác concepts (private, local, noindex): a slim bar to move between Concept A, Concept B
 * and the approved section on the demo homepage, and the page's beige ground. The bar is review chrome, never part of a
 * concept. `?lang=en` previews English; `?dich-vu=` opens a service.
 */
export type PreviewQuery = { lang?: string | string[]; "dich-vu"?: string | string[] };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export function readPreviewQuery(query: PreviewQuery): { locale: Locale; service: ServiceId | null } {
  const lang = first(query.lang);
  const service = first(query["dich-vu"]);
  return { locale: lang && isLocale(lang) ? lang : "vi", service: isServiceId(service) ? service : null };
}

export function PartnerPreview({ concept, locale, children }: { concept: "a" | "b"; locale: Locale; children: ReactNode }) {
  const copy = resolveLocalized(PARTNER_CONCEPT_COPY, locale);
  const lang = locale === "vi" ? "" : `?lang=${locale}`;
  const links = [
    { href: `/dev/partner-concepts/a${lang}`, label: copy.conceptA, current: concept === "a" },
    { href: `/dev/partner-concepts/b${lang}`, label: copy.conceptB, current: concept === "b" },
    { href: `/dev/demo?intro=0${lang ? `&lang=${locale}` : ""}#hop-tac`, label: copy.current, current: false },
  ];
  const other = locale === "vi" ? "en" : "vi";
  return (
    <main className={demoStyles.page}>
      <nav className={styles.bar} aria-label={copy.previewTitle} data-preview-bar>
        <span className={styles.title}>{copy.previewTitle}</span>
        <span className={styles.links}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={styles.link} aria-current={l.current ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
          <Link href={`/dev/partner-concepts/${concept}${other === "vi" ? "?lang=vi" : `?lang=${other}`}`} className={styles.lang} lang={other}>
            {other.toUpperCase()}
          </Link>
        </span>
      </nav>
      {children}
    </main>
  );
}
