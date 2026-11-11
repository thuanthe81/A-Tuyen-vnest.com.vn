"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { CITIES, type AreaMode, type Brand, type CityId, type Property, brandById, cityById } from "./data";
import { LocationDisclosure } from "./client/LocationDisclosure";
import { PriceArea } from "./client/PriceArea";
import type { PricePresentation } from "@/content/vnest-workbook/pricing";
import styles from "./shared.module.css";
import type { CollectionModel } from "./useCollection";

/**
 * Pieces both concepts share, so they differ only in the brand composition itself: the
 * logo slot, the city and area filters, the result line and the property list. The property
 * list stands in for the homepage's six-property collection, which is designed later; it is
 * deliberately plain.
 */

/** VNest's symbol, exactly as in the client's artwork (public/dev-fixtures/brand-collection). */
export function VNestSymbol({ size, className }: { size: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- a 7 KB vector, not a photograph
  return <img src="/dev-fixtures/brand-collection/vnest-symbol.svg" alt="" width={size} height={Math.round((size * 449.19) / 455.51)} className={className} />;
}

export function VNestWordmark({ height, className }: { height: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- a 4 KB vector
  return <img src="/dev-fixtures/brand-collection/vnest-wordmark.svg" alt="VNest" height={height} width={Math.round((height * 703.75) / 168.04)} className={className} />;
}

/**
 * Where a partner logo goes. The slot is a fixed height with a maximum width of 3.5 times
 * that height, so a square mark and a long wordmark both fit by "contain"; clear space is a
 * quarter of the slot height on every side and is part of the slot, so nothing can crowd it.
 * The ground is always light: logos are shown in their own colours, never recoloured, dimmed
 * or reversed. Until a file is supplied the slot is drawn as a labelled placeholder.
 */
export function LogoSlot({ brand, height, align = "start", label = brand.name }: { brand: Brand; height: string; align?: "start" | "center"; /** Placeholder text only: a shorter name where the slot is small. */ label?: string }) {
  const style = { "--slot-h": height } as CSSProperties;
  if (brand.logo) {
    return (
      <span className={styles.slot} data-align={align} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element -- supplied vector or bitmap logo */}
        <img src={brand.logo.src} alt="" width={brand.logo.width} height={brand.logo.height} className={styles.slotImage} />
      </span>
    );
  }
  return (
    <span className={styles.slot} data-align={align} data-placeholder style={style} aria-hidden="true">
      <span className={styles.slotName}>{label}</span>
      <span className={styles.slotTag}>Logo</span>
    </span>
  );
}

/** `showArea={false}` leaves the Area control out entirely (client preview, 03.3-C1: no verified areas). */
export function GeoFilters({ model, layout, showArea = true }: { model: CollectionModel; layout: "row" | "stack"; showArea?: boolean }) {
  const { state, dispatch, counts } = model;
  const areas = counts.areaOptions;
  const areaUnavailable = model.context.areas.length === 0;
  return (
    <div className={styles.geo} data-layout={layout}>
      <div role="group" aria-label="Thành phố" className={styles.cities}>
        <button type="button" className={styles.chip} aria-pressed={state.city === null} aria-label={`Mọi thành phố, ${counts.allCities} nơi ở`} onClick={() => dispatch({ type: "city", city: null })}>
          <span className={styles.long}>Mọi thành phố</span>
          <span className={styles.short}>Tất cả</span>
          <span className={styles.count}>{counts.allCities}</span>
        </button>
        {CITIES.map((city) => (
          <button
            key={city.id}
            type="button"
            className={styles.chip}
            aria-pressed={state.city === city.id}
            aria-label={`${city.name}, ${counts.city(city.id)} nơi ở`}
            onClick={() => dispatch({ type: "city", city: state.city === city.id ? null : city.id })}
          >
            <span className={styles.long}>{city.name}</span>
            <span className={styles.short}>{city.short}</span>
            <span className={styles.count}>{counts.city(city.id)}</span>
          </button>
        ))}
      </div>
      {showArea && (
        <label className={styles.area}>
          <span className={styles.areaLabel}>Khu vực</span>
          <select
            className={styles.select}
            value={state.area ?? ""}
            disabled={areaUnavailable}
            aria-describedby={areaUnavailable ? "area-pending" : undefined}
            onChange={(event) => dispatch({ type: "area", area: event.target.value || null })}
          >
            <option value="">{areaUnavailable ? "Chờ xác minh" : "Mọi khu vực"}</option>
            {state.city === null
              ? CITIES.map((city) => {
                  const inCity = areas.filter((area) => area.city === city.id);
                  return inCity.length ? (
                    <optgroup key={city.id} label={city.name}>
                      {inCity.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.name} ({counts.area(area.id)})
                        </option>
                      ))}
                    </optgroup>
                  ) : null;
                })
              : areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} ({counts.area(area.id)})
                  </option>
                ))}
          </select>
          {areaUnavailable && (
            <span id="area-pending" className={styles.visuallyHidden}>
              Chưa có khu vực nào được xác minh cho các nơi ở này.
            </span>
        )}
      </label>
      )}
    </div>
  );
}

/**
 * City and area as two labelled native selects side by side: the compact form for phones,
 * where the chips would take two rows. Same filter state and the same counts as the chips.
 */
export function GeoSelects({ model, showArea = true }: { model: CollectionModel; showArea?: boolean }) {
  const { state, dispatch, counts } = model;
  const areas = counts.areaOptions;
  const areaUnavailable = model.context.areas.length === 0;
  return (
    <div className={styles.selects} data-single={!showArea || undefined}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Thành phố</span>
        <select className={styles.fieldSelect} value={state.city ?? ""} onChange={(event) => dispatch({ type: "city", city: (event.target.value || null) as CityId | null })}>
          <option value="">Tất cả ({counts.allCities})</option>
          {CITIES.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name} ({counts.city(city.id)})
            </option>
          ))}
        </select>
      </label>
      {showArea && (
        <label className={styles.field} data-disabled={areaUnavailable || undefined}>
          <span className={styles.fieldLabel}>Khu vực</span>
          <select
            className={styles.fieldSelect}
            value={state.area ?? ""}
            disabled={areaUnavailable}
            aria-describedby={areaUnavailable ? "area-pending-compact" : undefined}
            onChange={(event) => dispatch({ type: "area", area: event.target.value || null })}
          >
            <option value="">{areaUnavailable ? "Chờ xác minh" : "Mọi khu vực"}</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name} ({counts.area(area.id)})
              </option>
            ))}
          </select>
          {areaUnavailable && (
            <span id="area-pending-compact" className={styles.visuallyHidden}>
              Chưa có khu vực nào được xác minh cho các nơi ở này.
            </span>
        )}
      </label>
      )}
    </div>
  );
}

/** The live line between the filters and the list: what is shown, why, and a way back. */
export function ResultBar({ model, id, className }: { model: CollectionModel; id: string; className?: string }) {
  return (
    <div className={className ? `${styles.result} ${className}` : styles.result}>
      <p id={id} className={styles.resultText} aria-live="polite" aria-atomic="true">
        <span>{model.summary}</span>
        {model.state.note && <span className={styles.note}>{model.state.note}</span>}
      </p>
      {model.active && (
        <button type="button" className={styles.reset} onClick={() => model.dispatch({ type: "reset" })}>
          Bỏ lọc
        </button>
      )}
    </div>
  );
}

/**
 * A property's picture. The mock's drawn stand-in renders exactly as before; client content
 * without an approved photograph (03.3-C1) gets a labelled placeholder that says why. Both are
 * decorative: the property's name follows in text, and the review bar says what is a placeholder.
 */
export function PropertyPicture({
  property,
  className,
  placeholderClassName,
  loading,
  named = false,
  sizes = "100vw",
}: {
  property: Property;
  className?: string;
  placeholderClassName?: string;
  loading?: "lazy";
  /** Placeholder only: also name the property, where no caption follows (the stage). */
  named?: boolean;
  /** Photo only: the displayed width, so the browser picks the right size. */
  sizes?: string;
}) {
  if (property.photo) {
    // An authorised local photograph (client preview, G2): AVIF, then WebP, then JPEG.
    const { photo } = property;
    return (
      <picture className={styles.picture}>
        {photo.sources.map((source) => (
          <source key={source.type} type={source.type} srcSet={source.srcSet} sizes={sizes} />
        ))}
        <img src={photo.fallback.src} srcSet={photo.fallback.srcSet} sizes={sizes} alt="" width={photo.width} height={photo.height} className={className} loading={loading} decoding="async" style={photo.objectPosition ? { objectPosition: photo.objectPosition } : undefined} />
      </picture>
    );
  }
  if (property.placeholder) {
    const classes = [className, placeholderClassName, styles.placeholder].filter(Boolean).join(" ");
    return (
      <span className={classes} aria-hidden="true">
        <span className={styles.placeholderTag}>Ảnh giữ chỗ</span>
        {named && <span className={styles.placeholderName}>{property.name}</span>}
        <span className={styles.placeholderReason}>{property.placeholder.reason}</span>
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- drawn SVG stand-in
  return <img src={property.picture.src} alt="" width={property.picture.width} height={property.picture.height} className={className} loading={loading} />;
}

/**
 * `dense`: two columns from the narrowest phone, so all six are within a short scroll.
 * `brands`: the brands of the content shown; absent for the mock, which uses BRANDS.
 * `prices`: client preview only (03.3-C1). The card then shows name and city on the left and a
 * price block beside them (below them on narrow cards). Absent for the mock, whose cards are unchanged.
 */
/** `trailing`: one optional item after the properties, in the same grid (the homepage's brand Coming Soon card). */
export function PropertyGrid({ properties, labelledBy, dense = false, brands, prices, links, trailing }: { properties: readonly Property[]; labelledBy: string; dense?: boolean; brands?: readonly Brand[]; prices?: Readonly<Record<string, PricePresentation>>; links?: Readonly<Record<string, string>>; trailing?: ReactNode }) {
  // A new key per result set replays the short entrance, so a change of filter is visible.
  const key = properties.map((property) => property.id).join(",");
  return (
    <ul key={key} className={styles.grid} data-dense={dense || undefined} aria-labelledby={labelledBy}>
      {properties.map((property, index) => (
        <li key={property.id} className={styles.card} style={{ "--i": index } as CSSProperties}>
          {links?.[property.id] ? (
            // The picture repeats the name's link for pointer users; keyboard and screen readers get the name once.
            <Link href={links[property.id]!} tabIndex={-1} aria-hidden="true" className={styles.cardPictureLink}>
              <PropertyPicture property={property} className={styles.cardImage} loading="lazy" sizes="(min-width: 64rem) 24rem, 50vw" />
            </Link>
          ) : (
            <PropertyPicture property={property} className={styles.cardImage} loading="lazy" sizes="(min-width: 64rem) 24rem, 50vw" />
          )}
          {prices ? (
            <div className={styles.cardBody}>
              <div className={styles.cardLayout}>
                {/* Name and city only: the brand is already carried by the index and the filters. */}
                <div className={styles.cardText}>
                  <h3 className={styles.cardName}>
                    {links?.[property.id] ? (
                      <Link href={links[property.id]!} className={styles.cardNameLink}>
                        {property.name}
                        <span aria-hidden="true"> →</span>
                      </Link>
                    ) : (
                      property.name
                    )}
                  </h3>
                  {property.location ? <LocationDisclosure location={property.location} propertyName={property.name} /> : <p className={styles.cardCity}>{cityById(property.city).name}</p>}
                </div>
                <PriceArea price={prices[property.id] ?? { kind: "unavailable", reason: "no-data" }} />
              </div>
            </div>
          ) : (
            <>
              <p className={styles.cardBrand}>{(brands?.find((brand) => brand.id === property.brand) ?? brandById(property.brand)).name}</p>
              <h3 className={styles.cardName}>{property.name}</h3>
              <p className={styles.cardCity}>{cityById(property.city).name}</p>
            </>
          )}
        </li>
      ))}
      {trailing ? (
        <li className={styles.card} data-trailing style={{ "--i": properties.length } as CSSProperties}>
          {trailing}
        </li>
      ) : null}
    </ul>
  );
}

/** Slim review line: what is a placeholder, and the switch between concepts and area data. */
export function ReviewBar({ concept, mode, path = `/dev/brand-collection/${concept}`, label = concept.toUpperCase() }: { concept: "a" | "b"; mode: AreaMode; path?: string; label?: string }) {
  const other = concept === "a" ? "b" : "a";
  const areas = mode === "sample" ? "" : "?areas=sample";
  return (
    <div className={styles.review}>
      <p>
        <strong>Khảo sát {label} · chưa duyệt.</strong> Logo ba thương hiệu là ô chờ; ảnh là tranh vẽ mẫu.{" "}
        {mode === "sample" ? "Đang dùng khu vực mẫu (không phải dữ liệu thật)." : "Khu vực chưa xác minh."}
      </p>
      <p className={styles.reviewLinks}>
        <a href={`${path}${areas}`}>{mode === "sample" ? "Bỏ khu vực mẫu" : "Thử với khu vực mẫu"}</a>
        <a href={`/dev/brand-collection/${other}${mode === "sample" ? "?areas=sample" : ""}`}>Sang khảo sát {other.toUpperCase()}</a>
      </p>
    </div>
  );
}

/** Where the hero sits on the homepage. Out of scope here; drawn short so the section is in view. */
export function HeroStub() {
  return (
    <div className={styles.hero} aria-hidden="true">
      <span>Màn hình đầu: điều hướng, video, thanh đặt phòng · giữ nguyên, ngoài phạm vi</span>
    </div>
  );
}

export { styles as sharedStyles };
