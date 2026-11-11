"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { brandCities, cityById, type Brand, type BrandId, type Photo, type Property } from "@/app/dev/brand-collection/data";
import { resolveLocalized, type Locale } from "@/domain/locale";
import { BRAND_COPY, BRAND_INDEX_UI, CITY_NAME } from "./brand-copy";
import { BRAND_PHOTO, BRAND_WEBSITES, orderBrands } from "./brand-showcase";
import { DemoPhoto } from "./DemoPhoto";
import home from "./HomeCollection.module.css";
import styles from "./BrandShowcase.module.css";

/**
 * BRAND SHOWCASE, homepage `#thuong-hieu` (Phase B of the client review, 7/11/2026; replaces the "Sổ thương hiệu" ledger
 * of 24/10). The heading stands on its own (its "Xem tất cả nơi ở" link was removed in Phase C, 7/11/2026); below it, the three brands (BRAND_ORDER) on the left and one stage on the right.
 *
 * One state for every screen size: `selected` (locked by a click, tap, Enter or Space; nothing at first) and `preview`
 * (mouse hover or keyboard focus, desktop only). Each brand row is a button with `aria-expanded`/`aria-controls` for its
 * own detail panel.
 * - Neutral (nothing selected): desktop shows the three brand photographs as bands beside the three rows; phones and
 *   tablets show the brand strip and a one-line hint, so nothing waits on an empty stage.
 * - Preview (desktop): the hovered or focused brand's photograph, logo and the client's Brand Hover line fade in over the
 *   stage; the other rows step back.
 * - Selected: the brand's detail panel (large logo, Brand Positioning, Brand About, cities | stays, "Visit us ↗").
 * Desktop stacks the three detail panels in one grid cell, so the stage keeps one height in every state and switching never
 * moves the page; below 1024 px only the selected panel takes space, under the strip.
 *
 * Copy: brand-copy.ts (client 05.11 Final, verbatim). Websites: brand-showcase.ts (none confirmed yet → the CTA is drawn
 * without a link).
 */

type Props = {
  brands: readonly Brand[];
  properties: readonly Property[];
  links: Readonly<Record<string, string>>;
  locale: Locale;
};

/** Hover intent: a short pause before a preview opens, a short grace before it closes. Moving between rows is instant. */
const HOVER_IN = 90;
const HOVER_OUT = 140;
const PREVIEW_QUERY = "(min-width: 64rem)";

/** The brand photographs are shown large: never the small 480w/800w derivatives. */
function largePhoto(photo: Photo): Photo {
  const strip = (srcSet: string) => {
    const kept = srcSet
      .split(",")
      .map((part) => part.trim())
      .filter((part) => !part.endsWith(" 480w") && !part.endsWith(" 800w"))
      .join(", ");
    return kept || srcSet;
  };
  return { ...photo, sources: photo.sources.map((s) => ({ ...s, srcSet: strip(s.srcSet) })), fallback: { ...photo.fallback, srcSet: strip(photo.fallback.srcSet) } };
}

export function BrandShowcase({ brands, properties, links, locale }: Props) {
  const ui = resolveLocalized(BRAND_INDEX_UI, locale);
  const ordered = orderBrands(brands);
  const [selected, setSelected] = useState<BrandId | null>(null);
  const [preview, setPreview] = useState<BrandId | null>(null);
  const rows = useRef<(HTMLButtonElement | null)[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);
  const uid = useId();
  const detailId = (id: BrandId) => `${uid}-detail-${id}`;
  const hoverId = (id: BrandId) => `${uid}-hover-${id}`;
  /** The brand being previewed over the stage (never the selected one: its panel is already showing). */
  const shown = preview !== null && preview !== selected ? preview : null;
  /** The row in front: the preview while there is one, otherwise the selection. */
  const front = shown ?? selected;

  const cityNames = (id: BrandId) => brandCities(properties, id).map((city) => (CITY_NAME[city] ? resolveLocalized(CITY_NAME[city], locale) : cityById(city).name));
  const photoOf = (id: BrandId) => {
    const photo = properties.find((p) => p.id === BRAND_PHOTO[id])?.photo;
    return photo ? largePhoto(photo) : undefined;
  };

  const clearTimers = () => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  };
  const dismiss = useCallback(() => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
    setPreview(null);
  }, []);
  useEffect(() => dismiss, [dismiss]);

  const want = (id: BrandId, immediate = false) => {
    clearTimers();
    if (!matchMedia(PREVIEW_QUERY).matches) return;
    if (immediate || preview !== null) setPreview(id);
    else openTimer.current = window.setTimeout(() => setPreview(id), HOVER_IN);
  };
  const release = (id: BrandId) => {
    window.clearTimeout(openTimer.current);
    closeTimer.current = window.setTimeout(() => setPreview((p) => (p === id ? null : p)), HOVER_OUT);
  };

  const choose = (id: BrandId) => {
    dismiss();
    setSelected(id);
    // Phones and tablets: the panel opens under the strip. When it starts low on the screen (or the strip is under the
    // header), scroll so the strip sits just below the header with the panel beneath it: the brand switch stays in sight.
    if (matchMedia(PREVIEW_QUERY).matches) return;
    requestAnimationFrame(() => {
      const panelEl = panelRef.current;
      const strip = navRef.current;
      if (!panelEl || !strip) return;
      const headerBottom = document.getElementById("top")?.getBoundingClientRect().bottom ?? 72;
      const stripTop = strip.getBoundingClientRect().top;
      if (panelEl.getBoundingClientRect().top > window.innerHeight * 0.6 || stripTop < headerBottom) {
        window.scrollBy({ top: stripTop - headerBottom - 12, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      }
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      dismiss();
      return;
    }
    const current = rows.current.findIndex((row) => row === document.activeElement);
    if (current < 0) return;
    const next = { ArrowDown: current + 1, ArrowRight: current + 1, ArrowUp: current - 1, ArrowLeft: current - 1, Home: 0, End: ordered.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    rows.current[(next + ordered.length) % ordered.length]?.focus();
  };

  return (
    <section id="thuong-hieu" lang={locale} className={styles.section} aria-labelledby="thuong-hieu-title">
      <header className={styles.head}>
        <p className={home.kicker}>{ui.kicker}</p>
        <h2 id="thuong-hieu-title" className={`${home.h2} ${styles.title}`}>
          {ui.titleStart} {ui.titleEnd}
        </h2>
      </header>

      <div className={styles.composition} data-state={selected ? "selected" : "neutral"}>
        <div ref={navRef} className={styles.nav} role="group" aria-label={ui.tablist} data-front={front ?? undefined} onKeyDown={onKeyDown}>
          {ordered.map((b, i) => (
            <button
              key={b.id}
              ref={(node) => {
                rows.current[i] = node;
              }}
              type="button"
              className={styles.row}
              data-brand={b.id}
              data-selected={selected === b.id || undefined}
              data-front={front === b.id || undefined}
              aria-expanded={selected === b.id}
              aria-controls={detailId(b.id)}
              aria-describedby={shown === b.id ? hoverId(b.id) : undefined}
              onClick={() => choose(b.id)}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") want(b.id);
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === "mouse") release(b.id);
              }}
              onFocus={(event) => {
                if (event.currentTarget.matches(":focus-visible")) want(b.id, true);
              }}
              onBlur={() => release(b.id)}
            >
              <span className={styles.dot} aria-hidden="true" />
              <span className={styles.logo} aria-hidden="true">
                {b.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- owner-supplied artwork, lossless, unaltered
                  <img src={b.logo.src} width={b.logo.width} height={b.logo.height} alt="" />
                ) : null}
              </span>
              <span className={styles.rowText}>
                <span className={styles.rowName}>{b.name}</span>
                <span className={styles.rowShort} aria-hidden="true">
                  {b.short}
                </span>
                <span className={styles.rowMeta}>{cityNames(b.id).join(" · ")}</span>
              </span>
            </button>
          ))}
        </div>

        {selected ? null : <p className={styles.hint}>{ui.choose}</p>}

        <div ref={panelRef} className={styles.stage} data-selected={selected ?? undefined}>
          {/* Neutral: one photograph per brand, a band beside each row. Decorative; the rows are the way in. */}
          <div className={styles.neutral} data-shown={(!selected && !shown) || undefined} aria-hidden="true">
            {ordered.map((b) => {
              const photo = photoOf(b.id);
              return (
                <div key={b.id} className={styles.band} data-brand={b.id} onClick={() => choose(b.id)}>
                  {photo ? <DemoPhoto photo={photo} sizes="(min-width: 64rem) 46rem, 1px" alt="" loading="lazy" /> : null}
                </div>
              );
            })}
          </div>

          {ordered.map((b) => (
            <BrandDetail key={b.id} brand={b} id={detailId(b.id)} active={selected === b.id} photo={photoOf(b.id)} properties={properties} links={links} cities={cityNames(b.id)} locale={locale} />
          ))}

          {/* Preview (desktop): over the stage, pointer-transparent, never announced on its own (the row points to its line). */}
          {ordered.map((b) => {
            const photo = photoOf(b.id);
            return (
              <div key={b.id} className={styles.preview} data-preview data-brand={b.id} data-shown={shown === b.id || undefined} aria-hidden="true">
                {photo ? <DemoPhoto photo={photo} sizes="(min-width: 64rem) 46rem, 1px" alt="" loading="lazy" /> : null}
                <div className={styles.previewCard}>
                  {b.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- owner-supplied artwork, lossless, unaltered
                    <img className={styles.previewLogo} src={b.logo.src} width={b.logo.width} height={b.logo.height} alt="" />
                  ) : null}
                  <p id={hoverId(b.id)} className={styles.previewLine}>
                    {resolveLocalized(BRAND_COPY[b.id].hover, locale)}
                  </p>
                  <p className={styles.previewHint}>{ui.previewHint}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** One brand's detail panel: photograph, large logo (the heading; the brand's name is its alt text), the client's
 * Positioning and About, cities | stays in two columns, and the website CTA. */
function BrandDetail({
  brand,
  id,
  active,
  photo,
  properties,
  links,
  cities,
  locale,
}: {
  brand: Brand;
  id: string;
  active: boolean;
  photo: Photo | undefined;
  properties: readonly Property[];
  links: Readonly<Record<string, string>>;
  cities: readonly string[];
  locale: Locale;
}) {
  const ui = resolveLocalized(BRAND_INDEX_UI, locale);
  const copy = resolveLocalized(BRAND_COPY[brand.id], locale);
  const stays = properties.filter((p) => p.brand === brand.id);
  return (
    <article id={id} className={styles.detail} data-brand={brand.id} data-shown={active || undefined} inert={!active} aria-labelledby={`${id}-name`}>
      <div className={styles.detailPhoto}>{photo ? <DemoPhoto photo={photo} sizes="(min-width: 64rem) 46rem, (min-width: 48rem) 92vw, 100vw" alt={ui.photoAlt.replace("{brand}", brand.name)} loading="lazy" /> : null}</div>
      <div className={styles.detailBody}>
        <div className={styles.detailHead}>
          {/* The logo is the panel's heading; its alt text is the brand's name (no repeated name on screen). */}
          <h3 id={`${id}-name`} className={styles.detailTitle}>
            {brand.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- owner-supplied artwork, lossless, unaltered
              <img className={styles.detailLogo} src={brand.logo.src} width={brand.logo.width} height={brand.logo.height} alt={brand.name} />
            ) : (
              brand.name
            )}
          </h3>
          <p className={styles.lead}>{copy.positioning}</p>
        </div>
        <p className={styles.about}>{copy.about}</p>
        <div className={styles.foot}>
          <dl className={styles.facts}>
            <div className={styles.fact}>
              <dt>{ui.city}</dt>
              <dd>
                <ul className={styles.list}>
                  {cities.map((city) => (
                    <li key={city}>{city}</li>
                  ))}
                </ul>
              </dd>
            </div>
            <div className={styles.fact}>
              <dt>{ui.stays}</dt>
              <dd>
                <ul className={styles.list} data-columns>
                  {stays.map((p) => (
                    <li key={p.id}>
                      {links[p.id] ? (
                        <Link href={links[p.id]!} className={styles.stayLink}>
                          {p.name}
                        </Link>
                      ) : (
                        p.name
                      )}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
          <VisitUs brand={brand} locale={locale} />
        </div>
      </div>
    </article>
  );
}

/** "Visit us ↗" to the brand's confirmed website. Without one it is drawn but not a link (no Facebook or guessed stand-in). */
function VisitUs({ brand, locale }: { brand: Brand; locale: Locale }) {
  const ui = resolveLocalized(BRAND_INDEX_UI, locale);
  const site = BRAND_WEBSITES[brand.id];
  const label = (
    <>
      {ui.visit}
      <span aria-hidden="true" className={styles.visitArrow}>
        ↗
      </span>
    </>
  );
  if (site) {
    return (
      <a href={site.url} target="_blank" rel="noopener noreferrer" className={styles.visit} data-brand-website={brand.id}>
        {label}
        <span className="sr-only"> {ui.visitOf.replace("{brand}", brand.name)}</span>
      </a>
    );
  }
  const pending = ui.websitePending.replace("{brand}", brand.name);
  return (
    <span role="link" aria-disabled="true" className={styles.visit} data-brand-website={brand.id} data-pending title={pending}>
      {label}
      <span className="sr-only"> {pending}</span>
    </span>
  );
}
