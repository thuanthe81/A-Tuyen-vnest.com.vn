"use client";

import { useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { resolveLocalized, type Locale } from "@/domain/locale";
import { OWNER_JOURNEY_UI, SERVICES, type ServiceId } from "@/features/demo/owner-journey";
import { rememberService } from "@/features/partner/remember-service";
import { ServiceVisual } from "@/features/partner/ServiceVisual";
import { consultationHref } from "@/features/partner/routes";
import type { ServicePhoto } from "@/features/partner/service-visuals";
import styles from "./PartnerShowcase.module.css";

/**
 * CONCEPT A · EDITORIAL SERVICE SHOWCASE (exploration, 8/11/2026; not on the homepage).
 *
 * Desktop: two columns. Left, the section heading and three service rows (index, name, a copper rule and arrow on the
 * chosen one). Right, ONE story panel for the chosen service: its visual, the client's expanded description set into
 * the visual's lower edge, and its CTA. Phones and tablets: the heading, a compact three-part selector, then the same
 * panel.
 *
 * A tab set (WAI-ARIA tabs, automatic activation): arrows, Home and End move between services. The three panels are
 * stacked in one grid cell, so the section keeps the height of the tallest and nothing below moves when the service
 * changes; the hidden two are `inert`. Cross-fade 220 ms, none with reduced motion. The chosen service is kept in the
 * address (`?dich-vu=`), as the approved section does.
 */
export function PartnerShowcase({
  locale,
  photo,
  initial = "van-hanh",
  ctaHref = (service: ServiceId) => consultationHref(service, locale),
  onCta,
}: {
  locale: Locale;
  photo: ServicePhoto | null;
  initial?: ServiceId;
  /** Where each CTA leads; by default the approved homepage form with the service chosen. */
  ctaHref?: (service: ServiceId) => string;
  /** On the homepage: the section's own "go to the form with this service" handler. */
  onCta?: (service: ServiceId, event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const ui = resolveLocalized(OWNER_JOURNEY_UI, locale);
  const [active, setActive] = useState<ServiceId>(initial);
  const uid = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabId = (id: ServiceId) => `${uid}-tab-${id}`;
  const panelId = (id: ServiceId) => `${uid}-panel-${id}`;

  const select = (id: ServiceId) => {
    setActive(id);
    rememberService(id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = SERVICES.length - 1;
    const next = { ArrowDown: index + 1, ArrowRight: index + 1, ArrowUp: index - 1, ArrowLeft: index - 1, Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const target = (next + SERVICES.length) % SERVICES.length;
    select(SERVICES[target]!.id);
    tabs.current[target]?.focus();
  };

  return (
    <section id="hop-tac" lang={locale} className={styles.section} aria-labelledby={`${uid}-title`} data-concept="a">
      <div className={styles.lead}>
        <div className={styles.head}>
          <p className={styles.kicker}>{ui.servicesKicker}</p>
          <h2 id={`${uid}-title`} className={styles.h2}>
            {ui.servicesTitle}
          </h2>
        </div>

        <div className={styles.tabs} role="tablist" aria-labelledby={`${uid}-title`} aria-orientation="vertical">
          {SERVICES.map((s, i) => {
            const selected = s.id === active;
            return (
              <button
                key={s.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={tabId(s.id)}
                aria-selected={selected}
                aria-controls={panelId(s.id)}
                tabIndex={selected ? 0 : -1}
                className={styles.tab}
                data-service={s.id}
                onClick={() => select(s.id)}
                onKeyDown={(event) => onKeyDown(event, i)}
              >
                <span className={styles.tabNo}>{s.no}</span>
                <span className={styles.tabText}>
                  <span className={styles.tabTitle}>{resolveLocalized(s.title, locale)}</span>
                  {s.sub ? <span className={styles.tabSub}>{resolveLocalized(s.sub, locale)}</span> : null}
                </span>
                <span className={styles.tabMark} aria-hidden="true">
                  →
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.stage}>
        {SERVICES.map((s) => {
          const selected = s.id === active;
          return (
            <div key={s.id} id={panelId(s.id)} role="tabpanel" aria-labelledby={tabId(s.id)} className={styles.panel} data-active={selected} data-service={s.id} inert={!selected}>
              <div className={styles.frame}>
                <ServiceVisual service={s} locale={locale} photo={photo} eager={s.id === initial} />
              </div>
              <div className={styles.copy}>
                <p className={styles.text}>{resolveLocalized(s.description, locale)}</p>
                <a className={styles.cta} href={ctaHref(s.id)} onClick={onCta ? (event) => onCta(s.id, event) : undefined}>
                  {resolveLocalized(s.cta, locale)}
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
