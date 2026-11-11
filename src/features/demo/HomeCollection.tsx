"use client";

import Link from "next/link";
import { useId, useState, type CSSProperties, type ReactNode } from "react";
import type { ClientCollection } from "@/app/dev/brand-collection/client/adapter";
import type { Locale } from "@/domain/locale";
import type { Brand, BrandId, Property } from "@/app/dev/brand-collection/data";
import { PropertyGrid, PropertyPicture, sharedStyles } from "@/app/dev/brand-collection/shared";
import { useCollection, type CollectionModel } from "@/app/dev/brand-collection/useCollection";
import type { PricePresentation } from "@/content/vnest-workbook/pricing";
import { useMediaQuery } from "@/features/booking-search/useMediaQuery";
import { orderBrands } from "./brand-showcase";
import { BrandShowcase } from "./BrandShowcase";
import { ComingSoonCard } from "./ComingSoon";
import { comingSoonFor } from "./coming-soon";
import { cityAfterTap, cityChips, inBrandOrder, type CityChip } from "./discovery";
import styles from "./HomeCollection.module.css";

/**
 * HOMEPAGE BRANDS + STAYS. The brand section (`#thuong-hieu`) is BrandShowcase.tsx (Phase B); the stays (`#kham-pha`) are
 * StayCollection below (Phase C, 7/11/2026; revised 8/11/2026).
 */

type Props = {
  content: ClientCollection;
  prices: Readonly<Record<string, PricePresentation>>;
  links: Readonly<Record<string, string>>;
  /** Language of the brand index (private `?lang=en` preview); the property grid stays Vietnamese. */
  locale?: Locale;
};

export function HomeCollection({ content, prices, links, locale = "vi" }: Props) {
  const model = useCollection(content);
  return (
    <div className={`${sharedStyles.page} ${styles.root}`} data-content="client" data-presentation>
      <BrandShowcase brands={content.brands} properties={content.properties} links={links} locale={locale} />
      <StayCollection model={model} brands={content.brands} prices={prices} links={links} />
    </div>
  );
}

/** Discovery is Vietnamese-only for now (the English preview covers the sections above it). */
const DISCOVERY_LOCALE = "vi" as const;

/**
 * The stays (Phase C, 7/11/2026; revised 8/11/2026): heading and description, then the filters in the earlier approved
 * layout (a labelled row per filter, options on one rounded track): brand ("Tất cả" and the three brands in the approved
 * order) and city (the two real cities only, nothing selected at first). Then the real stays in brand order and, with one
 * brand chosen, that brand's Coming Soon card as the last item of the same list (none with "Tất cả"). Filter rules:
 * discovery.ts (cities) and the shared reducer (brand/city conflicts, the address). Coming Soon is not a stay
 * (coming-soon.ts): it is passed to the lists as a trailing item, never mixed into the properties.
 */
function StayCollection({ model, brands, prices, links }: { model: CollectionModel; brands: readonly Brand[]; prices: Readonly<Record<string, PricePresentation>>; links: Readonly<Record<string, string>> }) {
  const { state, dispatch } = model;
  const desktop = useMediaQuery("(min-width: 64rem)");
  const uid = useId();
  /** A one-off explanation after tapping a city the chosen brand is not in. */
  const [hint, setHint] = useState<string | null>(null);
  const ordered = orderBrands(brands);
  const brand = ordered.find((b) => b.id === state.brand) ?? null;
  const chips = cityChips(model.context.properties, state);
  const shown = inBrandOrder(model.shown);
  const brandOptions: readonly { id: BrandId | null; label: string }[] = [{ id: null, label: "Tất cả" }, ...ordered.map((b) => ({ id: b.id, label: b.name }))];
  const teaserBrand = ordered.find((b) => b.id === comingSoonFor(state)) ?? null;
  const teaser = (variant: "tile" | "strip") => (teaserBrand ? <ComingSoonCard brand={teaserBrand} locale={DISCOVERY_LOCALE} variant={variant} /> : null);

  // "Tất cả" is the one reset (owner, 8/11/2026): it clears the brand AND the city, back to all six stays.
  const chooseBrand = (id: BrandId | null) => {
    setHint(null);
    dispatch(id === null ? { type: "reset" } : { type: "brand", brand: id });
  };
  const tapCity = (chip: CityChip) => {
    const city = cityAfterTap(chip);
    if (city === undefined) {
      setHint(`${brand?.name ?? ""} chưa có nơi ở tại ${chip.name}.`);
      return;
    }
    setHint(null);
    dispatch({ type: "city", city });
  };
  return (
    <section id="kham-pha" lang={DISCOVERY_LOCALE} className={styles.collection} aria-labelledby="kham-pha-title">
      <header className={styles.discoveryIntro}>
        <h2 id="kham-pha-title" className={`${styles.h2} ${styles.discoveryTitle}`}>
          Khám phá nơi ở
        </h2>
        <p className={styles.discoveryLead}>Các nơi ở thuộc Bare Boutique Stays, Pepper House và The Nắng Suites tại TP. Hồ Chí Minh và Đà Nẵng.</p>
      </header>

      <div className={styles.toolbar} role="group" aria-label="Lọc nơi ở">
        <div className={styles.filterRows}>
          <div className={styles.filterRow}>
            <span id={`${uid}-brand`} className={styles.filterLabel}>
              Thương hiệu
            </span>
            <div className={styles.segmented} role="radiogroup" aria-labelledby={`${uid}-brand`} data-filter="brand">
              {brandOptions.map((option) => (
                <label key={option.id ?? "all"} className={styles.segment}>
                  {/* A click on "Tất cả" while it is already chosen still clears a chosen city (no change event fires then). */}
                  <input type="radio" name={`${uid}-brand-choice`} value={option.id ?? ""} checked={state.brand === option.id} onChange={() => chooseBrand(option.id)} onClick={option.id === null && state.city ? () => chooseBrand(null) : undefined} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className={styles.filterRow}>
            <span id={`${uid}-city`} className={styles.filterLabel}>
              Thành phố
            </span>
            <div className={styles.segmented} role="group" aria-labelledby={`${uid}-city`} data-filter="city">
              {chips.map((chip) => (
                <button key={chip.id} type="button" className={styles.citySegment} data-city={chip.id} data-state={chip.state} aria-pressed={chip.state === "active"} aria-disabled={chip.state === "unavailable" || undefined} onClick={() => tapCity(chip)}>
                  {chip.name}
                  {chip.state === "only" ? <span className="sr-only"> (nơi có {brand?.name})</span> : null}
                  {chip.state === "unavailable" ? <span className="sr-only"> (chưa có nơi ở của {brand?.name})</span> : null}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* No visible result line or "Bỏ lọc" (owner, 8/11/2026): the count, a dropped city and an unavailable city's
            explanation are announced to screen readers only. "Tất cả" resets. */}
        <p id="kham-pha-result" className="sr-only" aria-live="polite" aria-atomic="true">
          {hint ? <span>{hint}</span> : model.active ? <span>{model.summary}</span> : null}
          {model.state.note && !hint ? <span> {model.state.note}</span> : null}
        </p>
      </div>

      {desktop ? (
        <PropertyGrid properties={shown} labelledBy="kham-pha-title" dense brands={brands} prices={prices} links={links} trailing={teaser("tile")} />
      ) : (
        <MobilePropertyCollection properties={shown} labelledBy="kham-pha-title" links={links} trailing={teaser("strip")} />
      )}
      {/* Unreachable with the current rules (every choosable combination has stays, see discovery.test.ts); kept as a guard. */}
      {shown.length === 0 ? <p className={styles.empty}>Chưa có nơi lưu trú phù hợp.</p> : null}
    </section>
  );
}

/**
 * Mobile Property Collection Redesign V2:
 * Full-width landscape property cards (1 per row, ~190–220px tall, 12–16px vertical gap).
 * Each card is a single semantic link wrapping the authentic property cover photograph,
 * restrained bottom gradient, property name aligned bottom-left, and prominent "Chọn phòng"
 * dark-Copper (#9A683C) CTA with arrow-up-right icon aligned bottom-right.
 */
function MobilePropertyCollection({
  properties,
  labelledBy,
  links,
  trailing,
}: {
  properties: readonly Property[];
  labelledBy: string;
  links: Readonly<Record<string, string>>;
  /** One optional item after the stays (the chosen brand's Coming Soon card). */
  trailing?: ReactNode;
}) {
  const key = properties.map((property) => property.id).join(",");
  return (
    <ul key={key} className={styles.mobilePropertyGrid} aria-labelledby={labelledBy}>
      {properties.map((property, index) => {
        const href = links[property.id] ?? `/dev/stays/${property.id}`;
        return (
          <li
            key={property.id}
            className={styles.mobilePropertyCard}
            data-property-id={property.id}
            style={{ "--i": index } as CSSProperties}
          >
            <Link href={href} className={styles.mobilePropertyLink}>
              <PropertyPicture
                property={property}
                className={styles.mobilePropertyImage}
                loading="lazy"
                sizes="(min-width: 48rem) 92vw, 100vw"
              />
              <span className={styles.mobilePropertyScrim} aria-hidden="true" />
              <div className={styles.mobilePropertyFooter}>
                <h3 className={styles.mobilePropertyName}>{property.name}</h3>
                <span className={styles.mobilePropertyCta}>
                  <span className={styles.mobilePropertyCtaLabel}>Chọn phòng</span>
                  <svg
                    className={styles.mobilePropertyCtaIcon}
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10"
                      stroke="currentColor"
                      strokeWidth="1.65"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </Link>
          </li>
        );
      })}
      {trailing ? (
        <li className={styles.mobilePropertyCard} data-trailing style={{ "--i": properties.length } as CSSProperties}>
          {trailing}
        </li>
      ) : null}
    </ul>
  );
}
