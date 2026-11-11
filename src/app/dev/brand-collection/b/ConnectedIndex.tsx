"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { BRANDS, brandCities, CITIES, cityById, type Area, type AreaMode, type Brand, type BrandId, type Property } from "../data";
import { GeoFilters, GeoSelects, HeroStub, LogoSlot, PropertyGrid, PropertyPicture, ResultBar, ReviewBar, sharedStyles, VNestSymbol, VNestWordmark } from "../shared";
import type { PricePresentation } from "@/content/vnest-workbook/pricing";
import { useCollection, type CollectionModel } from "../useCollection";
import styles from "./b.module.css";

/**
 * CONCEPT B, CONNECTED BRAND INDEX, refinement 1 (15/10/2026, after the owner chose B over A).
 * The idea is unchanged: a copper thread runs through an index of identities, ties the chosen
 * one with two interlaced rings and carries on into a single stage.
 *
 * What the refinement changes, and why:
 * - Partner logos lead. Every index entry is the brand's logo slot (40 px tall on desktop,
 *   was 32; 22 px on a phone, where there were only names), and the stage carries the chosen
 *   logo on its own light plate (56 px desktop, 32 px phone). Slots keep the logo's own
 *   proportions and colours; see LogoSlot.
 * - Nothing said twice. The stage no longer repeats the count or lists the places (the cards
 *   right below do both); the result line shares one row with the filters on desktop.
 * - The stage answers the choice in its picture: one slice per place of the chosen brand
 *   (Bare shows four, places outside the chosen city step back), one per brand for "all".
 * - Fixed geometry: the stage is the same height whatever is chosen, so the cards never move.
 * - A dedicated phone layout: one-line heading, the index as a single row of logos, city and
 *   area as two labelled selects in one row, and the six cards in two columns.
 *
 * The first version is kept at /dev/brand-collection/b-original.
 *
 * Optional props for the client-content preview (03.3-C1, /dev/brand-collection/b-client):
 * `content` replaces the mock with the workbook's brands and properties, `showArea={false}`
 * leaves the Area control out, `review` replaces the review line, `prices` adds a price block to
 * each card (never to the index or the stage). Without them this renders
 * /dev/brand-collection/b exactly as before (checked pixel for pixel).
 */
type Choice = BrandId | "all";
export type Content = { brands: readonly Brand[]; properties: readonly Property[]; areas: readonly Area[] };

/**
 * `hero`, `links` and `review={null}` are used only by the CEO demo entry (/dev/demo): the hero
 * replaces the out-of-scope stub, `links` makes a card open its property page in the same tab,
 * `review={null}` leaves the review bar out, and `presentation` draws a missing partner logo as
 * the brand's name alone, without the dashed "Logo" slot. Without them the prototype is unchanged.
 */
export function ConnectedIndex({ mode, content, showArea = true, review, prices, hero, links, presentation = false }: { mode: AreaMode; content?: Content; showArea?: boolean; review?: ReactNode; prices?: Readonly<Record<string, PricePresentation>>; hero?: ReactNode; links?: Readonly<Record<string, string>>; presentation?: boolean }) {
  const model = useCollection(content ?? mode);
  const brands = content?.brands ?? BRANDS;
  const CHOICES: readonly Choice[] = ["all", ...brands.map((brand) => brand.id)];
  const { state, dispatch, counts } = model;
  const chosen: Choice = state.brand ?? "all";
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const choose = (choice: Choice) => dispatch({ type: "brand", brand: choice === "all" ? null : choice });
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = CHOICES.indexOf(chosen);
    const next = { ArrowDown: index + 1, ArrowRight: index + 1, ArrowUp: index - 1, ArrowLeft: index - 1, Home: 0, End: CHOICES.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const wrapped = (next + CHOICES.length) % CHOICES.length;
    choose(CHOICES[wrapped]!);
    refs.current[wrapped]?.focus();
  };

  return (
    <div className={sharedStyles.page} data-content={content ? "client" : undefined} data-presentation={presentation || undefined}>
      {review === undefined ? <ReviewBar concept="b" mode={mode} /> : review}
      {hero ?? <HeroStub />}
      <section className={styles.section} data-demo={presentation || undefined} aria-labelledby="bc-b-title">
        <div className={`${sharedStyles.wrap} ${styles.layout}`}>
          <header className={styles.head}>
            <p className={styles.eyebrow}>Hệ sinh thái lưu trú VNest</p>
            <h2 id="bc-b-title" className={styles.title}>
              Ba thương hiệu, <br className={styles.titleBreak} />
              một sợi chỉ nối.
            </h2>
          </header>

          <div className={styles.index} role="radiogroup" aria-label="Thương hiệu" onKeyDown={onKeyDown}>
            {CHOICES.map((choice, i) => {
              const brand = choice === "all" ? null : brands.find((b) => b.id === choice)!;
              const count = brand ? counts.brand(brand.id) : counts.allBrands;
              const checked = chosen === choice;
              return (
                <button
                  key={choice}
                  ref={(element) => {
                    refs.current[i] = element;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  tabIndex={checked ? 0 : -1}
                  aria-label={`${brand ? brand.name : "Tất cả thương hiệu"}, ${count} nơi ở`}
                  className={styles.entry}
                  data-zero={count === 0 || undefined}
                  onClick={() => choose(choice)}
                >
                  <span className={styles.node} aria-hidden="true" />
                  <span className={styles.identity} aria-hidden="true">
                    {brand && presentation && brand.logo ? (
                      <span className={styles.brandIdentity} data-brand={brand.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- lossless official artwork derivative */}
                        <img src={brand.logo.src} width={brand.logo.width} height={brand.logo.height} alt="" className={styles.indexArtwork} />
                        <span className={styles.brandName}>{brand.name}</span>
                        <span className={styles.brandShort}>{brand.short}</span>
                      </span>
                    ) : brand ? (
                      <>
                        <span className={styles.logoWide}>
                          <LogoSlot brand={presentation ? { ...brand, logo: null } : brand} height="2.5rem" />
                        </span>
                        <span className={styles.logoCompact}>
                          <LogoSlot brand={presentation ? { ...brand, logo: null } : brand} height="var(--index-logo-h)" align="center" label={brand.short} />
                        </span>
                      </>
                    ) : (
                      <span className={styles.all}>
                        <VNestSymbol size={28} className={styles.allSymbol} />
                        <span>Tất cả</span>
                      </span>
                    )}
                  </span>
                  <span className={styles.count} aria-hidden="true">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <Stage model={model} chosen={chosen} brands={brands} />

          <div className={styles.toolbar}>
            <div className={styles.geoWide}>
              <GeoFilters model={model} layout="row" showArea={showArea} />
            </div>
            <div className={styles.geoCompact}>
              <GeoSelects model={model} showArea={showArea} />
            </div>
            <ResultBar model={model} id="bc-b-result" className={styles.result} />
          </div>
        </div>
      </section>
      <div className={sharedStyles.wrap}>
        <PropertyGrid properties={model.shown} labelledBy="bc-b-result" dense brands={content?.brands} prices={prices} links={links} />
      </div>
    </div>
  );
}

/**
 * The width of photograph a stage slice needs (client preview photos only). Photos are 3:2, so a
 * narrow slice is filled by the photo's height and needs 1.5 × the stage height, whatever the
 * number of slices: 0.6 × the width of the 5:2 stage on tablets, 0.5 × on 3:1 phones, and on
 * desktop, where the stage is a fixed 322 px tall, about 483 px (31rem). A single slice needs the
 * full stage width (about 46rem on desktop).
 */
const sliceSizes = (count: number) => (count === 1 ? "(min-width: 64rem) 46rem, 100vw" : "(min-width: 64rem) 31rem, 60vw");

/** The one visual region. Its picture follows the choice; its plate carries the chosen identity. */
function Stage({ model, chosen, brands }: { model: CollectionModel; chosen: Choice; brands: readonly Brand[] }) {
  const { context, state } = model;
  const brand = chosen === "all" ? null : brands.find((b) => b.id === chosen)!;
  const inPlace = (property: Property) => (!state.city || property.city === state.city) && (!state.area || property.area === state.area);
  const slices = brand
    ? context.properties.filter((property) => property.brand === brand.id).map((property) => ({ property, label: null as string | null }))
    : brands.map((b) => {
        const own = context.properties.filter((property) => property.brand === b.id);
        return { property: own.find(inPlace) ?? own[0]!, label: b.short };
      });
  const cities = (brand ? brandCities(context.properties, brand.id) : CITIES.map((city) => city.id)).map((city) => cityById(city).name).join(" · ");

  return (
    <div className={styles.stage} key={chosen}>
      <h3 className={sharedStyles.visuallyHidden}>{brand ? brand.name : "Tất cả thương hiệu VNest"}</h3>
      <div className={styles.visual}>
        {slices.map(({ property, label }) => (
          <span key={property.id} className={styles.slice} data-out={!inPlace(property) || undefined}>
            <PropertyPicture property={property} placeholderClassName={styles.slicePlaceholder} named sizes={sliceSizes(slices.length)} />
            {label && (
              <span className={styles.sliceLabel} aria-hidden="true">
                {label}
              </span>
            )}
          </span>
        ))}
      </div>
      <div className={styles.plate} data-official-logo={!!brand?.logo || undefined}>
        {!brand?.logo && <span className={styles.plateLogo} aria-hidden="true">
          {brand ? <LogoSlot brand={brand} height="var(--stage-logo-h)" /> : <VNestWordmark height={32} />}
        </span>}
        <span className={styles.plateText}>
          {brand?.logo && <span className={styles.captionName}>{brand.name}</span>}
          <span className={styles.where}>{brand ? cities : `${brands.length} thương hiệu · ${cities}`}</span>
          {brand && !brand.logo && <span className={styles.story}>Câu chuyện thương hiệu · chờ nội dung được duyệt</span>}
        </span>
      </div>
    </div>
  );
}
