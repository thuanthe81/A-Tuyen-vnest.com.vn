"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import styles from "./CityNotes.module.css";
import type { CityNotesView } from "./view";

/**
 * VNEST CITY NOTES (spec docs/sections/city-notes-spec.md; CS-1 to CS-7 approved as direction
 * 20/10/2026, not frozen). One module for every property page: two category tabs, the first
 * places of the selected one, and an inline expansion to the whole city list.
 *
 * The server renders exactly what a guest with script sees first (the Ăn & uống tab, collapsed),
 * so hydration moves nothing. Without script, the <noscript> style shows both lists in full under
 * their own headings and hides the controls that need script.
 *
 * Tabs: the WAI-ARIA tabs pattern, automatic activation, roving tabindex, Left/Right/Home/End.
 *
 * Inactive panels and collapsed places are hidden by data attributes, not the `hidden` attribute:
 * the global base layer sets `[hidden] { display: none !important }` inside a cascade layer, which
 * no unlayered rule can override, so the no-script style could never reveal them. display: none
 * removes them from the accessibility tree all the same.
 */

function Bowl() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 12h17a8.5 8.5 0 0 1-17 0Z" />
      <path d="M12 20.5V21M8.5 21h7" />
      <path d="m13.5 9.5 6.5-6M10.5 9.5l8-7.5" />
    </svg>
  );
}

function Compass() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="m14.8 9.2-1.6 4-4 1.6 1.6-4Z" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="m5 8 5 5 5-5" />
    </svg>
  );
}

const ICONS = { eat: <Bowl />, explore: <Compass /> };

/** Without script: both lists in full, no tabs, no expand button. */
const noScriptCss = `
.${styles.tabs}, .${styles.more} { display: none !important; }
.${styles.panel}[data-inactive], .${styles.place}[data-collapsed] { display: grid !important; }
.${styles.panel} + .${styles.panel} { margin-top: 2rem; }
.${styles.panelTitle} { position: static !important; width: auto !important; height: auto !important; overflow: visible !important; clip-path: none !important; white-space: normal !important; margin-top: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--cn-copper); font-size: 1rem; font-weight: 600; }
`;

export type MobileFeatured = 3 | 4;

export function CityNotes({ view, mobileFeatured = 4 }: { view: CityNotesView; mobileFeatured?: MobileFeatured }) {
  const base = useId();
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const moreRef = useRef<HTMLButtonElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const tabId = (i: number) => `${base}-tab-${i}`;
  const panelId = (i: number) => `${base}-panel-${i}`;
  const current = view.categories[active]!;

  // For QA: marks the moment the controls work. Set on the element, so rendering does not change.
  useEffect(() => {
    if (sectionRef.current) sectionRef.current.dataset.hydrated = "true";
  }, []);

  function select(i: number, focus = false) {
    const next = (i + view.categories.length) % view.categories.length;
    setActive(next);
    if (focus) tabRefs.current[next]?.focus();
  }

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, i: number) {
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: view.categories.length - 1 }[event.key];
    if (to === undefined) return;
    event.preventDefault();
    select(to, true);
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    // Collapsing shortens the section above the button: keep the button, which keeps focus, in view.
    if (!next) requestAnimationFrame(() => moreRef.current?.scrollIntoView({ block: "nearest" }));
  }

  return (
    <section id="so-tay-thanh-pho" className={styles.cityNotes} aria-labelledby={`${base}-title`} ref={sectionRef} data-open={open} data-mobile-featured={mobileFeatured}>
      <noscript dangerouslySetInnerHTML={{ __html: `<style>${noScriptCss}</style>` }} />
      <div className={styles.head}>
        <div>
          <p className={styles.label}>{view.label}</p>
          <h2 id={`${base}-title`} className={styles.title}>
            {view.heading}
          </h2>
        </div>
        <p className={styles.dek}>{view.dek}</p>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Loại địa điểm">
        {view.categories.map((category, i) => (
          <button
            key={category.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={tabId(i)}
            aria-selected={i === active}
            aria-controls={panelId(i)}
            tabIndex={i === active ? 0 : -1}
            className={styles.tab}
            onClick={() => select(i)}
            onKeyDown={(event) => onTabKey(event, i)}
          >
            {ICONS[category.id]}
            {category.label}
            <span className={styles.count}>
              {category.places.length}
              <span className={styles.srOnly}> địa điểm</span>
            </span>
          </button>
        ))}
      </div>

      {view.categories.map((category, i) => (
        <div key={category.id} id={panelId(i)} role="tabpanel" aria-labelledby={tabId(i)} tabIndex={0} data-inactive={i !== active ? "" : undefined} className={styles.panel}>
          <h3 className={`${styles.panelTitle} ${styles.srOnly}`}>{category.label}</h3>
          <ul className={styles.places} id={`${panelId(i)}-list`}>
            {category.places.map((place, n) => (
              <li key={place.id} className={styles.place} data-collapsed={!open && n >= category.featured ? "" : undefined} data-source={view.audience === "private-preview" ? place.source : undefined}>
                <p className={styles.name}>{place.name}</p>
                {place.location ? <p className={styles.where}>{place.location}</p> : null}
                {place.review ? <p className={styles.flag}>Chờ VNest · {place.review}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className={styles.foot}>
        {current.places.length > current.featured ? (
          <button ref={moreRef} type="button" className={styles.more} aria-expanded={open} aria-controls={`${panelId(active)}-list`} onClick={toggle}>
            <span>{open ? "Thu gọn" : `Xem tất cả ${current.places.length} ${current.noun}`}</span>
            <Chevron />
          </button>
        ) : null}
        <p className={styles.source}>{view.sourceLine}</p>
      </div>

      {view.pending.length ? (
        <aside className={styles.pending} aria-label="Ghi chú xem trước: nội dung chờ VNest">
          <p className={styles.pendingTitle}>Chờ VNest (chỉ hiện trong bản xem trước)</p>
          <ul>
            {view.pending.map((item) => (
              <li key={item.what}>
                {item.what} <span className={styles.pendingRef}>{item.questions.join(", ")}</span>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </section>
  );
}
