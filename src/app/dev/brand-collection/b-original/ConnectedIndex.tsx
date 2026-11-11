"use client";

import { useRef, type KeyboardEvent } from "react";
import { BRANDS, brandCities, CITIES, cityById, type AreaMode, type BrandId } from "../data";
import { GeoFilters, HeroStub, LogoSlot, PropertyGrid, ResultBar, ReviewBar, sharedStyles, VNestSymbol, VNestWordmark } from "../shared";
import { useCollection, type CollectionModel } from "../useCollection";
import styles from "./b.module.css";

/**
 * CONCEPT B AS FIRST REVIEWED (15/10/2026), kept unchanged for comparison with the
 * refinement at /dev/brand-collection/b.
 *
 * CONCEPT B, CONNECTED BRAND INDEX. A compact index of identities and one stage. The idea
 * comes from the VNest symbol: separate lines that become one system once they are
 * connected. Here a single copper thread runs through every entry of the index; the chosen
 * entry is tied with a ring and the thread runs from it into the stage, which shows that
 * brand alone: its logo, its places, where it is.
 *
 * The index is a radio group (arrow keys move and choose, as with any radio group), so one
 * identity is always chosen, VNest's "all" included. The thread is drawn, not traced from the
 * logo: the symbol itself appears only as the client supplied it.
 */
type Choice = BrandId | "all";
const CHOICES: readonly Choice[] = ["all", ...BRANDS.map((brand) => brand.id)];

export function ConnectedIndexOriginal({ mode }: { mode: AreaMode }) {
  const model = useCollection(mode);
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
    <div className={sharedStyles.page}>
      <ReviewBar concept="b" mode={mode} path="/dev/brand-collection/b-original" label="B (bản gốc)" />
      <HeroStub />
      <section className={styles.section} aria-labelledby="bc-b-title">
        <div className={`${sharedStyles.wrap} ${styles.layout}`}>
          <header className={styles.head}>
            <p className={styles.eyebrow}>Hệ sinh thái lưu trú VNest</p>
            <h2 id="bc-b-title" className={styles.title}>
              Ba thương hiệu,
              <br /> một sợi chỉ nối.
            </h2>
          </header>

          <div className={styles.index} role="radiogroup" aria-label="Thương hiệu" onKeyDown={onKeyDown} data-chosen={CHOICES.indexOf(chosen)}>
            {CHOICES.map((choice, i) => {
              const brand = choice === "all" ? null : BRANDS.find((b) => b.id === choice)!;
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
                    {brand ? (
                      <>
                        <span className={styles.entryLogo}>
                          <LogoSlot brand={brand} height="var(--index-logo-h)" />
                        </span>
                        <span className={styles.entryShort}>{brand.short}</span>
                      </>
                    ) : (
                      <span className={styles.entryAll}>
                        <VNestSymbol size={22} className={styles.entrySymbol} />
                        Tất cả
                      </span>
                    )}
                  </span>
                  <span className={styles.entryCount} aria-hidden="true">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <Stage model={model} chosen={chosen} />

          <div className={styles.filters}>
            <GeoFilters model={model} layout="row" />
          </div>
        </div>
      </section>
      <div className={sharedStyles.wrap}>
        <div className={styles.results}>
          <ResultBar model={model} id="bc-b-result" />
          <PropertyGrid properties={model.shown} labelledBy="bc-b-result" />
        </div>
      </div>
    </div>
  );
}

/** The one visual region: the chosen identity, its places and where they are. */
function Stage({ model, chosen }: { model: CollectionModel; chosen: Choice }) {
  const { context, state, counts } = model;
  const brand = chosen === "all" ? null : BRANDS.find((b) => b.id === chosen)!;
  const own = brand ? context.properties.filter((property) => property.brand === brand.id) : context.properties;
  const inPlace = (property: (typeof own)[number]) => (!state.city || property.city === state.city) && (!state.area || property.area === state.area);
  const lead = own.find(inPlace) ?? own[0]!;
  // "All" shows one place from each brand, side by side and labelled: the three threads before one is tied.
  const slices = brand
    ? [{ property: lead, label: null, count: 0 }]
    : BRANDS.map((b) => ({
        property: context.properties.find((property) => property.brand === b.id && inPlace(property)) ?? context.properties.find((property) => property.brand === b.id)!,
        label: b.short,
        count: counts.brand(b.id),
      }));
  const cities = brand ? brandCities(context.properties, brand.id) : CITIES.map((city) => city.id);
  const count = brand ? counts.brand(brand.id) : counts.allBrands;

  return (
    <div className={styles.stage} key={chosen} data-all={!brand || undefined}>
      <div className={styles.visual} data-n={slices.length}>
        {slices.map(({ property, label, count: n }) => (
          <span key={property.id} className={styles.slice}>
            {/* eslint-disable-next-line @next/next/no-img-element -- drawn SVG stand-in */}
            <img src={property.picture.src} alt="" width={property.picture.width} height={property.picture.height} />
            {label && (
              <span className={styles.sliceLabel} aria-hidden="true">
                {label}
                <span className={styles.sliceCount}> · {n}</span>
              </span>
            )}
          </span>
        ))}
      </div>
      <div className={styles.caption}>
        <h3 className={sharedStyles.visuallyHidden}>{brand ? brand.name : "Tất cả thương hiệu VNest"}</h3>
        <div className={styles.captionLogo} aria-hidden="true">
          {brand ? <LogoSlot brand={brand} height="var(--stage-logo-h)" /> : <VNestWordmark height={28} />}
        </div>
        <p className={styles.figure}>
          <span className={styles.figureCount}>{count}</span>
          <span className={styles.figureText}>
            nơi ở{brand ? "" : ` · ${BRANDS.length} thương hiệu`}
            <span className={styles.figureCities}>{cities.map((city) => cityById(city).name).join(" · ")}</span>
          </span>
        </p>
        {brand && (
          <ul className={styles.places} aria-label={`Các nơi ở của ${brand.name}`}>
            {own.map((property) => (
              <li key={property.id} data-out={!inPlace(property) || undefined}>
                {property.name}
              </li>
            ))}
          </ul>
        )}
        {brand && <p className={styles.story}>Câu chuyện thương hiệu · chờ nội dung được duyệt</p>}
      </div>
    </div>
  );
}
