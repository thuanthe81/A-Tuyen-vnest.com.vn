import { useId } from "react";
import type { Brand } from "@/app/dev/brand-collection/data";
import { sharedStyles } from "@/app/dev/brand-collection/shared";
import { resolveLocalized, type Locale } from "@/domain/locale";
import { COMING_SOON_COPY, comingSoonHref } from "./coming-soon";
import styles from "./ComingSoon.module.css";

/**
 * COMING SOON card (Phase C; artwork revised 8/11/2026): the chosen brand's next stay, as the last item of that brand's
 * list.
 *
 * Shell: the listing card's. Desktop ("tile") takes the property photo box (sharedStyles.cardImage, 3:2) with the label
 * where a stay's name sits; phones and tablets ("strip") take the mobile property strip, with the label below it, so
 * nothing is laid over the artwork. The only visible text is "Sắp ra mắt" ("Coming Soon"): the brand is carried by its
 * official logo (and named for screen readers).
 *
 * Artwork: one composition per brand around its OFFICIAL logo file (never redrawn or recoloured), with the VNest copper as
 * the one accent:
 * - Bare Boutique Stays (the first direction, kept): editorial paper, a dotted copper route that wanders across the page
 *   with two stops and arrives at an open point above the wordmark.
 * - Pepper House: the brand's own loading-screen language (pepperhouse.asia): a field of broken grid lines, the symbol's
 *   dashes repeated like a city map, with soft diagonal streets where the field fades. The symbol sits centred on a
 *   cleared block, its bars on the map's own lines, the block marked at its corners in copper. No route line.
 * - The Nắng Suites: warm light, centred. A low sun with a soft halo on a copper horizon, two concentric arcs, the mark
 *   rising inside the sun on the same axis, and its reflection below (the wave in the mark).
 * Each composition is measured in `cqh` (one unit = 1 % of the artwork's height) inside a centred group, so it keeps its
 * proportions from the 3:2 desktop tile to the wide 768 px strip.
 *
 * No booking control, price, city or availability. The whole card links to the brand's official website once one is
 * confirmed (coming-soon.ts); until then it is not a link.
 */

export type ComingSoonVariant = "tile" | "strip";

export function ComingSoonCard({ brand, locale, variant }: { brand: Brand; locale: Locale; variant: ComingSoonVariant }) {
  const copy = resolveLocalized(COMING_SOON_COPY, locale);
  const href = comingSoonHref(brand.id);
  const art = brand.id === "bare" ? <BareArt brand={brand} /> : brand.id === "pepper-house" ? <PepperArt brand={brand} /> : <NangArt brand={brand} />;
  const content = (
    <>
      <div className={`${styles.art} ${variant === "tile" ? sharedStyles.cardImage : ""}`}>{art}</div>
      <h3 className={styles.label}>
        <span className="sr-only">{brand.name}: </span>
        {copy.label}
        {href ? (
          <>
            <span aria-hidden="true" className={styles.arrow}>
              {" ↗"}
            </span>
            <span className="sr-only">, {copy.website}</span>
          </>
        ) : null}
      </h3>
    </>
  );

  const shared = { className: styles.card, "data-brand": brand.id, "data-variant": variant, "data-coming-soon": brand.id } as const;
  return href ? (
    <a {...shared} href={href} target="_blank" rel="noopener noreferrer" data-website="confirmed">
      {content}
    </a>
  ) : (
    <div {...shared} data-website="pending">
      {content}
    </div>
  );
}

/** The brand's official logo file, unaltered (decorative here: the label names the brand for screen readers). */
function Logo({ brand, className }: { brand: Brand; className?: string }) {
  if (!brand.logo) return null;
  // eslint-disable-next-line @next/next/no-img-element -- owner-supplied artwork, lossless, unaltered
  return <img className={className} src={brand.logo.src} width={brand.logo.width} height={brand.logo.height} alt="" />;
}

/*
 * Bare Boutique Stays. Group: 150 × 100 units (the 3:2 tile exactly), centred. The wordmark (767 × 402), 28 units tall,
 * sits bottom right; the route starts at a copper dot on the left, passes two stops and arrives at an open point above it.
 */
function BareArt({ brand }: { brand: Brand }) {
  return (
    <div className={styles.group} data-art="bare" aria-hidden="true">
      <svg className={styles.lines} viewBox="0 0 150 100" preserveAspectRatio="none">
        <path className={styles.route} d="M15 47 C 25 56, 33 58, 41 50 C 49 42, 49 30, 59 26 C 70 21.6, 82 28, 90 31 C 99 34.4, 107 30, 111 37 C 114 42.6, 108 49, 104 52.6" />
        <circle className={styles.dot} cx="15" cy="47" r="1.3" />
        <circle className={styles.dot} cx="59" cy="26" r="0.95" />
        <circle className={styles.dot} cx="90" cy="31" r="0.95" />
        <circle className={styles.ring} cx="102.4" cy="54.6" r="1.9" />
      </svg>
      <Logo brand={brand} className={styles.bareMark} />
    </div>
  );
}

/*
 * Pepper House. Group: 340 × 100 units (the widest strip), centred and cropped by narrower cards. The map is the brand's
 * loading-screen language (pepperhouse.asia): a broken grid with a 7-unit cell, lines at 7k + 3.5, dashes stopping short
 * of every crossing, with soft diagonal streets where it thins. The symbol is 37.7 units square so that its bars (31.4 %
 * and 68.5 %) are 14 units apart and fall on map lines: box at (152.65, 26.65), bars on x = 164.5 / 178.5 and
 * y = 38.5 / 52.5, centred on the card. It stands on a cleared block (map lines 143.5–199.5 × 17.5–73.5) whose corners
 * carry four small copper marks, as on a site plan. No route: the rhythm of the map alone.
 */
function PepperArt({ brand }: { brand: Brand }) {
  const id = useId();
  // The block's corners and the direction each mark opens to.
  const corners: readonly [number, number, number, number][] = [
    [143.5, 17.5, 1, 1],
    [199.5, 17.5, -1, 1],
    [143.5, 73.5, 1, -1],
    [199.5, 73.5, -1, -1],
  ];
  return (
    <div className={styles.group} data-art="pepper-house" aria-hidden="true">
      <svg className={styles.lines} viewBox="0 0 340 100" preserveAspectRatio="none">
        <defs>
          <pattern id={`${id}-map`} width="7" height="7" patternUnits="userSpaceOnUse">
            <path className={styles.mapLine} d="M0 3.5 H2.3 M4.7 3.5 H7 M3.5 0 V2.3 M3.5 4.7 V7" />
          </pattern>
          <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.8" />
          </filter>
          {/* The map is densest around the block and thins towards the edges. */}
          <radialGradient id={`${id}-focus`} cx="171.5" cy="45.5" r="150" gradientUnits="userSpaceOnUse">
            <stop offset="0.15" stopColor="#fff" />
            <stop offset="1" stopColor="#5c5c5c" />
          </radialGradient>
          <mask id={`${id}-streets`} maskUnits="userSpaceOnUse" x="0" y="0" width="340" height="100">
            <rect width="340" height="100" fill={`url(#${id}-focus)`} />
            <g filter={`url(#${id}-soft)`}>
              {/* Diagonal streets inside the 150-unit window every card shows (95–245), one more for the wide strip. */}
              <rect x="108" y="-60" width="13" height="240" fill="#000" transform="rotate(36 114 50)" />
              <rect x="222" y="-60" width="10" height="240" fill="#000" transform="rotate(-32 227 50)" />
              <rect x="40" y="-60" width="11" height="240" fill="#000" transform="rotate(30 46 50)" />
              <rect x="143.5" y="17.5" width="56" height="56" fill="#000" />
            </g>
          </mask>
        </defs>
        <rect width="340" height="100" fill={`url(#${id}-map)`} mask={`url(#${id}-streets)`} />
        <path className={styles.blockMarks} d={corners.map(([x, y, dx, dy]) => `M${x + 3 * dx} ${y} H${x} V${y + 3 * dy}`).join(" ")} />
      </svg>
      <Logo brand={brand} className={styles.pepperMark} />
    </div>
  );
}

/*
 * The Nắng Suites. Group: 120 × 100 units, centred on x = 60. Horizon at y = 68. The sun (r 32), its halo and two arcs
 * (r 44, r 58) share the mark's centre line; the mark (364 × 512, 28 units tall) rises inside the sun, its base on the
 * horizon; its reflection lies below, on the same axis.
 */
function NangArt({ brand }: { brand: Brand }) {
  const id = useId();
  return (
    <>
      <span className={styles.horizon} aria-hidden="true" />
      <div className={styles.group} data-art="the-nang" aria-hidden="true">
        <svg className={styles.lines} viewBox="0 0 120 100" preserveAspectRatio="none">
          <defs>
            <radialGradient id={`${id}-halo`} cx="60" cy="68" r="66" gradientUnits="userSpaceOnUse">
              <stop offset="0.35" stopColor="#f7dfa3" stopOpacity="0.5" />
              <stop offset="1" stopColor="#f7dfa3" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${id}-sun`} cx="60" cy="68" r="32" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#f6dc98" />
              <stop offset="0.7" stopColor="#f8e5b5" />
              <stop offset="1" stopColor="#faebc8" />
            </radialGradient>
            {/* The outer arc is strongest at its crown and fades towards the horizon on both sides. */}
            <linearGradient id={`${id}-crown`} x1="0" y1="10" x2="0" y2="68" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#c9a15a" stopOpacity="0.5" />
              <stop offset="1" stopColor="#c9a15a" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${id}-water`} x1="28" y1="0" x2="92" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#d6b26a" stopOpacity="0" />
              <stop offset="0.5" stopColor="#d6b26a" />
              <stop offset="1" stopColor="#d6b26a" stopOpacity="0" />
            </linearGradient>
            <clipPath id={`${id}-sky`}>
              <rect x="-200" y="-10" width="520" height="78" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}-sky)`}>
            <circle cx="60" cy="68" r="66" fill={`url(#${id}-halo)`} />
            <circle cx="60" cy="68" r="32" fill={`url(#${id}-sun)`} />
            <circle className={styles.arc} cx="60" cy="68" r="44" />
            <circle className={styles.arcOuter} stroke={`url(#${id}-crown)`} cx="60" cy="68" r="58" />
          </g>
          <g className={styles.reflection} stroke={`url(#${id}-water)`}>
            <line x1="34" y1="73.5" x2="86" y2="73.5" />
            <line x1="42" y1="78.5" x2="78" y2="78.5" />
            <line x1="51" y1="83.5" x2="69" y2="83.5" />
          </g>
        </svg>
        <Logo brand={brand} className={styles.nangMark} />
      </div>
    </>
  );
}
