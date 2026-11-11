"use client";

import Link from "next/link";
import { useId, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { resolveLocalized, type Locale } from "@/domain/locale";
import { OWNER_JOURNEY_UI, SERVICES, type ServiceId } from "@/features/demo/owner-journey";
import { rememberService } from "./remember-service";
import { ServiceVisual } from "./ServiceVisual";
import { consultationHref } from "./routes";
import type { ServicePhoto } from "./service-visuals";
import styles from "./ServiceAccordion.module.css";

/**
 * HỢP TÁC CÙNG VNEST · VISUAL ACCORDION (Concept B of the 8/11/2026 exploration; approved by the client 9/11/2026 and
 * placed on the homepage, replacing the three-card section).
 *
 * Three full-width editorial rows, read as one collection: a large index, the service name and the client's card line,
 * and a round toggle. Opening a row reveals, inside it, the service's visual and the client's expanded description with
 * its one consultation CTA. One row open at a time; choosing the open row again closes it.
 *
 * Alignment (9/11/2026): the open row's visual starts on the index column (01/02/03); the description and CTA start on
 * the card line's column. Both come from the same column template as the row above (`--index`, `--toggle`, `--gap`), so
 * they stay aligned at every width without offsets.
 *
 * Disclosure buttons (aria-expanded / aria-controls) inside headings; closed content is `inert`. The opening row grows
 * (300 ms, none with reduced motion); a row closing ABOVE the one chosen closes at once and the page is moved by the
 * same amount, so the row under the pointer stays exactly where it was.
 *
 * Each open row's CTA is the approved solid Copper button (white label and arrow; restored on 9/11/2026 after the wipe
 * experiments, which belong to the partner page only). `more` adds ONE closing action after the rows (homepage → the
 * dedicated partner page, 10/11/2026): a footer row on the rows' own grid, its label on the names' column and its ↗ on
 * the toggles' column, one full-row link. It concludes the section rather than reading as a fourth service.
 *
 * All rows start closed (`initial` = null, 10/11/2026): nothing opens on arrival, after a refresh or on a language
 * switch; a row opens only when chosen.
 */
export function ServiceAccordion({
  locale,
  photo,
  initial = null,
  ctaHref = (service: ServiceId) => consultationHref(service, locale),
  onCta,
  more,
}: {
  locale: Locale;
  photo: ServicePhoto | null;
  /** The row open on arrival; `null` (the default) for none. */
  initial?: ServiceId | null;
  /** Where each CTA leads without script or in a new tab; by default the homepage form with the service chosen. */
  ctaHref?: (service: ServiceId) => string;
  /** The page's own handler (scroll to its form, choose the service). Call `event.preventDefault()` to stay on the page. */
  onCta?: (service: ServiceId, event: MouseEvent<HTMLAnchorElement>) => void;
  more?: { href: string; label: string };
}) {
  const ui = resolveLocalized(OWNER_JOURNEY_UI, locale);
  const [open, setOpen] = useState<ServiceId | null>(initial);
  const uid = useId();
  const triggers = useRef<Partial<Record<ServiceId, HTMLButtonElement | null>>>({});
  const anchor = useRef<{ id: ServiceId; top: number } | null>(null);

  useLayoutEffect(() => {
    const held = anchor.current;
    anchor.current = null;
    const el = held ? triggers.current[held.id] : null;
    if (!held || !el) return;
    const moved = el.getBoundingClientRect().top - held.top;
    if (Math.abs(moved) > 0.5) window.scrollBy({ top: moved, behavior: "instant" });
  }, [open]);

  const toggle = (id: ServiceId) => {
    const el = triggers.current[id];
    if (el) anchor.current = { id, top: el.getBoundingClientRect().top };
    const next = open === id ? null : id;
    setOpen(next);
    if (next) rememberService(next);
  };

  return (
    <section id="hop-tac" lang={locale} className={styles.section} aria-labelledby={`${uid}-title`} data-section="partner-services">
      <div className={styles.head}>
        <p className={styles.kicker}>{ui.servicesKicker}</p>
        <h2 id={`${uid}-title`} className={styles.h2}>
          {ui.servicesTitle}
        </h2>
      </div>

      <div className={styles.rows}>
        {SERVICES.map((s) => {
          const expanded = open === s.id;
          const regionId = `${uid}-${s.id}`;
          const buttonId = `${uid}-${s.id}-button`;
          return (
            <div key={s.id} className={styles.row} data-open={expanded} data-service={s.id}>
              <h3 className={styles.rowHeading}>
                <button
                  ref={(el) => {
                    triggers.current[s.id] = el;
                  }}
                  type="button"
                  id={buttonId}
                  className={styles.trigger}
                  aria-expanded={expanded}
                  aria-controls={regionId}
                  data-service={s.id}
                  onClick={() => toggle(s.id)}
                >
                  <span className={styles.no}>{s.no}</span>
                  <span className={styles.name}>
                    <span className={styles.title}>{resolveLocalized(s.title, locale)}</span>
                    {s.sub ? <span className={styles.sub}>{resolveLocalized(s.sub, locale)}</span> : null}
                  </span>
                  <span className={styles.line}>{resolveLocalized(s.line, locale)}</span>
                  <span className={styles.toggle} aria-hidden="true">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M10 4v12M4 10h12" />
                    </svg>
                  </span>
                </button>
              </h3>
              <div id={regionId} role="region" aria-labelledby={buttonId} className={styles.drawer} inert={!expanded}>
                <div className={styles.drawerInner}>
                  <div className={styles.body}>
                    <div className={styles.frame}>
                      <ServiceVisual service={s} locale={locale} photo={photo} eager={s.id === initial} />
                    </div>
                    <div className={styles.copy}>
                      <p className={styles.text}>{resolveLocalized(s.description, locale)}</p>
                      <a className={styles.cta} href={ctaHref(s.id)} data-service={s.id} onClick={onCta ? (event) => onCta(s.id, event) : undefined}>
                        {resolveLocalized(s.cta, locale)}
                        <span aria-hidden="true">→</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {more ? (
        <Link href={more.href} className={styles.moreLink} data-partner-page-link>
          <span className={styles.moreLabel}>{more.label}</span>
          <span className={styles.moreArrow} aria-hidden="true">
            ↗
          </span>
        </Link>
      ) : null}
    </section>
  );
}
