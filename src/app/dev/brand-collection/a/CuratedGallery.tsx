"use client";

import { useRef } from "react";
import { BRANDS, brandCities, cityById, type AreaMode, type Brand } from "../data";
import { GeoFilters, HeroStub, LogoSlot, PropertyGrid, ResultBar, ReviewBar, sharedStyles, VNestSymbol } from "../shared";
import { useCollection, type CollectionModel } from "../useCollection";
import styles from "./a.module.css";
import { Thread } from "./Thread";

/**
 * CONCEPT A, CURATED BRAND GALLERY. The three brands hang side by side like works in one
 * exhibition, each on its own white mount; VNest is the wall and the opening panel, the
 * curator rather than a fourth exhibit. Every brand is visible at once, sized by how many
 * places it holds (Bare's panel carries its four), and each panel is itself the filter.
 *
 * The mount is light so a supplied logo keeps its own colours. Choosing a brand quiets the
 * other brands' photographs, never their logos.
 *
 * `thread` (chosen by the owner on 15/10/2026, from concept B): the chosen panel is tied to
 * the result line by a copper thread, in place of the tick. Without it, this is the concept
 * as first reviewed, kept at /dev/brand-collection/a-original.
 */
export function CuratedGallery({ mode, thread = true }: { mode: AreaMode; thread?: boolean }) {
  const model = useCollection(mode);
  const { state, dispatch, counts } = model;
  const pageRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={pageRef} className={`${sharedStyles.page} ${styles.page}`}>
      <ReviewBar concept="a" mode={mode} path={thread ? undefined : "/dev/brand-collection/a-original"} label={thread ? "A" : "A (bản gốc)"} />
      <HeroStub />
      <section className={styles.section} aria-labelledby="bc-a-title" data-thread={thread || undefined}>
        <div className={sharedStyles.wrap}>
          <header className={styles.head}>
            <p className={styles.eyebrow}>
              <VNestSymbol size={18} />
              Hệ sinh thái lưu trú VNest
            </p>
            <h2 id="bc-a-title" className={styles.title}>
              Ba thương hiệu. <span className={styles.titleSoft}>Sáu nơi ở.</span>
            </h2>
          </header>

          <div ref={groupRef} className={styles.exhibits} role="group" aria-label="Chọn thương hiệu">
            <button
              type="button"
              className={styles.all}
              aria-pressed={state.brand === null}
              aria-label={`Tất cả thương hiệu, ${counts.allBrands} nơi ở`}
              onClick={() => dispatch({ type: "brand", brand: null })}
            >
              <VNestSymbol size={56} className={styles.allSymbol} />
              <span className={styles.allCount} aria-hidden="true">
                {counts.allBrands}
              </span>
              <span className={styles.allText}>
                <span className={styles.allLabel}>{state.brand === null ? "Tất cả nơi ở" : "Xem tất cả"}</span>
                <span className={styles.allMeta}>{BRANDS.length} thương hiệu</span>
              </span>
            </button>
            {BRANDS.map((brand, index) => (
              <Exhibit key={brand.id} brand={brand} index={index} model={model} tick={!thread} />
            ))}
          </div>

          <div className={styles.toolbar}>
            <GeoFilters model={model} layout="row" />
          </div>
        </div>
      </section>
      <div className={sharedStyles.wrap}>
        <div className={styles.results}>
          <ResultBar model={model} id="bc-a-result" />
          <PropertyGrid properties={model.shown} labelledBy="bc-a-result" />
        </div>
      </div>
      {thread && <Thread pageRef={pageRef} groupRef={groupRef} resultId="bc-a-result" chosen={state.brand ?? "all"} />}
    </div>
  );
}

function Exhibit({ brand, index, model, tick }: { brand: Brand; index: number; model: CollectionModel; tick: boolean }) {
  const { state, dispatch, counts, context } = model;
  const selected = state.brand === brand.id;
  const quiet = state.brand !== null && !selected;
  const count = counts.brand(brand.id);
  const own = context.properties.filter((property) => property.brand === brand.id);
  const where = state.area ? context.areas.find((area) => area.id === state.area)?.name : state.city ? cityById(state.city).name : null;
  const meta = where ? (count ? `tại ${where}` : `Chưa có tại ${where}`) : brandCities(context.properties, brand.id).map((city) => cityById(city).short).join(" · ");
  return (
    <button
      type="button"
      className={styles.exhibit}
      data-wide={own.length > 1 || undefined}
      data-quiet={quiet || undefined}
      aria-pressed={selected}
      aria-label={`${brand.name}, ${count} nơi ở${where ? ` tại ${where}` : ""}`}
      onClick={() => dispatch({ type: "brand", brand: selected ? null : brand.id })}
    >
      <span className={styles.index} aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className={styles.mount}>
        <LogoSlot brand={brand} height="var(--logo-h)" align="center" />
      </span>
      <span className={styles.strip} data-n={own.length}>
        {own.map((property) => {
          const inPlace = (!state.city || property.city === state.city) && (!state.area || property.area === state.area);
          return (
            <span key={property.id} className={styles.frame} data-out={!inPlace || undefined}>
              {/* eslint-disable-next-line @next/next/no-img-element -- drawn SVG stand-in */}
              <img src={property.picture.src} alt="" width={property.picture.width} height={property.picture.height} />
            </span>
          );
        })}
        {tick && (
          <span className={styles.check} aria-hidden="true">
            <svg viewBox="0 0 12 12" width="12" height="12">
              <path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </span>
        )}
      </span>
      <span className={styles.meta} aria-hidden="true">
        <span className={styles.metaCount}>{count}</span>
        <span>
          nơi ở <span className={styles.metaWhere}>{meta}</span>
        </span>
      </span>
    </button>
  );
}
