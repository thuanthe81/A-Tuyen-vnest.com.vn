import { resolveLocalized, type Locale } from "@/domain/locale";
import type { Service } from "@/features/demo/owner-journey";
import { FRANCHISE_BRANDS, SERVICE_VISUAL_COPY, SERVICE_VISUAL, VNEST_LOGO, type ServicePhoto } from "./service-visuals";
import styles from "./ServiceVisual.module.css";

/**
 * One visual per service, used by the homepage accordion and the partner page (the place decides the frame's shape;
 * each visual fills it):
 * - 01 Hospitality Management: the approved photograph (owner's selection n° 16), with nothing written over it.
 * - 02 Project Development: a planning sheet: a site, a building with its rooms, a dashed boundary for the partners'
 *   work. Its three notes are the client's Key Highlights for 02, verbatim; shown only where they have room. No
 *   dimensions, no numbers, no project.
 * - 03 Brand Franchising: the two franchised brands' official logos + VNest, labelled with the two halves of the client's
 *   phrase "Brand Franchising + VNest Management". A sum, not an organisation chart. The Nắng Suites is not part of it.
 * The photograph carries its alt text; the two compositions are decorative (the description beside them says it all).
 * `notes={false}` draws 02's sheet without its notes, for a page that lists the highlights beside it.
 */
export function ServiceVisual({
  service,
  locale,
  photo,
  eager = false,
  notes = true,
}: {
  service: Service;
  locale: Locale;
  photo: ServicePhoto | null;
  eager?: boolean;
  notes?: boolean;
}) {
  const kind = SERVICE_VISUAL[service.id];
  return (
    <div className={styles.visual} data-visual={kind}>
      {kind === "photo" ? <PhotoVisual photo={photo} locale={locale} eager={eager} /> : kind === "plan" ? <PlanVisual service={service} locale={locale} notes={notes} /> : <BrandsVisual locale={locale} />}
    </div>
  );
}

function PhotoVisual({ photo, locale, eager }: { photo: ServicePhoto | null; locale: Locale; eager: boolean }) {
  if (!photo) return null;
  // No caption over the photograph (owner, 9/11/2026): its alt text says what it shows; the registry keeps its source.
  return (
    <picture>
      {photo.sources.map((s) => (
        <source key={s.type} type={s.type} srcSet={s.srcSet} sizes="(min-width: 64rem) 50vw, 100vw" />
      ))}
      <img
        className={styles.photo}
        src={photo.src}
        srcSet={photo.srcSet}
        sizes="(min-width: 64rem) 50vw, 100vw"
        width={photo.width}
        height={photo.height}
        alt={resolveLocalized(photo.alt, locale)}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        style={{ objectPosition: photo.position }}
      />
    </picture>
  );
}

/*
 * Planning sheet, 600 × 375 units. The drawing (x 30–390): a site (an irregular plot with a survey point), a building
 * split into rooms of different sizes around a corridor (two rooms toned copper: the product), and a dashed copper
 * boundary around it (design and construction partners). Leaders run from each layer to its note (x 420–590).
 */
function PlanDrawing() {
  return (
    <>
      <path className={styles.plot} d="M48 58 L372 44 L390 318 L62 332 Z" />
      <circle className={styles.survey} cx="48" cy="58" r="6" />
      <circle className={styles.surveyDot} cx="48" cy="58" r="2" />
      <rect className={styles.partners} x="94" y="92" width="252" height="192" rx="2" />
      <rect className={styles.building} x="110" y="108" width="220" height="160" />
      <rect className={styles.roomTone} x="210" y="108" width="70" height="72" />
      <rect className={styles.roomToneSoft} x="180" y="196" width="80" height="72" />
      <path className={styles.rooms} d="M110 180 H330 M110 196 H330 M160 108 V180 M210 108 V180 M280 108 V180 M180 196 V268 M260 196 V268" />
      {/* Two doors, drawn as on a plan. */}
      <path className={styles.door} d="M136 180 A 14 14 0 0 1 150 166 M150 166 V180 M296 196 A 14 14 0 0 0 310 210 M310 210 V196" />
    </>
  );
}

function PlanVisual({ service, locale, notes }: { service: Service; locale: Locale; notes: boolean }) {
  // Where each note's leader starts (the layer it names) and its height on the sheet.
  const leaders = [
    { from: 374, y: 70 },
    { from: 280, y: 144 },
    { from: 346, y: 250 },
  ];
  if (!notes) {
    return (
      <div className={styles.planStage} aria-hidden="true">
        <svg className={styles.planSvg} viewBox="18 26 390 320">
          <PlanDrawing />
        </svg>
      </div>
    );
  }
  return (
    <div className={styles.planStage} aria-hidden="true">
      {/* Wide frames: the sheet with its notes. */}
      <svg className={`${styles.planSvg} ${styles.planWide}`} viewBox="0 0 600 375">
        <PlanDrawing />
        {leaders.map((l) => (
          <g key={l.y}>
            <path className={styles.leader} d={`M${l.from} ${l.y} H412`} />
            <circle className={styles.leaderDot} cx={l.from} cy={l.y} r="2.4" />
          </g>
        ))}
      </svg>
      {/* Narrow frames: the drawing alone, centred; the description says the rest. */}
      <svg className={`${styles.planSvg} ${styles.planNarrow}`} viewBox="18 26 390 320">
        <PlanDrawing />
      </svg>
      <ol className={styles.planNotes}>
        {service.highlights.map((h, i) => (
          <li key={i} style={{ top: `${(leaders[i]!.y / 375) * 100}%` }}>
            {resolveLocalized(h, locale)}
          </li>
        ))}
      </ol>
    </div>
  );
}

function BrandsVisual({ locale }: { locale: Locale }) {
  const [bare, pepper] = FRANCHISE_BRANDS;
  return (
    <div className={styles.brands} aria-hidden="true">
      <div className={styles.side}>
        <div className={styles.pair}>
          <span className={styles.tile} data-logo="bare">
            {/* eslint-disable-next-line @next/next/no-img-element -- official logo file, unaltered */}
            <img src={bare.logo.src} width={bare.logo.width} height={bare.logo.height} alt="" />
          </span>
          <span className={styles.tile} data-logo="pepper-house">
            {/* eslint-disable-next-line @next/next/no-img-element -- official logo file, unaltered */}
            <img src={pepper.logo.src} width={pepper.logo.width} height={pepper.logo.height} alt="" />
            <span className={styles.tileName}>{pepper.name}</span>
          </span>
        </div>
        <span className={styles.bracket} />
        <span className={styles.sideLabel}>{resolveLocalized(SERVICE_VISUAL_COPY.franchiseLabel, locale)}</span>
      </div>

      <span className={styles.plus}>+</span>

      <div className={styles.side}>
        <span className={styles.tile} data-logo="vnest">
          {/* The approved symbol over the approved wordmark, in the proportions of VNest's stacked lockup. */}
          <span className={styles.vnestLockup}>
            {/* eslint-disable-next-line @next/next/no-img-element -- VNest's own vector artwork */}
            <img className={styles.vnestSymbol} src={VNEST_LOGO.symbol.src} width={VNEST_LOGO.symbol.width} height={VNEST_LOGO.symbol.height} alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element -- VNest's own vector artwork */}
            <img className={styles.vnestWordmark} src={VNEST_LOGO.wordmark.src} width={VNEST_LOGO.wordmark.width} height={VNEST_LOGO.wordmark.height} alt="" />
          </span>
        </span>
        <span className={styles.bracket} />
        <span className={styles.sideLabel}>{resolveLocalized(SERVICE_VISUAL_COPY.managementLabel, locale)}</span>
      </div>
    </div>
  );
}
