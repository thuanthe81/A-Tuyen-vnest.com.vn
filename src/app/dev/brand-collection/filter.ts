/**
 * Combined brand, city and area filtering, shared by both concepts. Pure functions only, so
 * the behaviour is tested once (filter.test.ts) and the concepts differ only in presentation.
 *
 * Rule for conflicts: the latest choice wins. Choosing a brand that has nothing in the chosen
 * city (Pepper House in Đà Nẵng) clears the city and area instead of showing an empty list,
 * and says so; choosing a city or area clears a brand that has nothing there. Nothing is ever
 * disabled, so every brand stays selectable, and no combination reaches a dead end.
 */

import { brandById, cityById, type Area, type Brand, type BrandId, type CityId, type Property } from "./data";

export type Filters = { brand: BrandId | null; city: CityId | null; area: string | null };
export type FilterState = Filters & { note: string | null };

export const NO_FILTERS: FilterState = { brand: null, city: null, area: null, note: null };

export type FilterAction =
  | { type: "brand"; brand: BrandId | null }
  | { type: "city"; city: CityId | null }
  | { type: "area"; area: string | null }
  | { type: "reset" }
  | { type: "load"; filters: Filters };

/** `brands`: the brands of the content shown; absent for the mock, which uses BRANDS. */
export type Context = { properties: readonly Property[]; areas: readonly Area[]; brands?: readonly Brand[] };

const brandName = (context: Context, id: BrandId) => (context.brands?.find((brand) => brand.id === id) ?? brandById(id)).name;

const byBrand = (brand: BrandId | null) => (property: Property) => brand === null || property.brand === brand;
const byCity = (city: CityId | null) => (property: Property) => city === null || property.city === city;
const byArea = (area: string | null) => (property: Property) => area === null || property.area === area;

export function matches(properties: readonly Property[], filters: Filters): Property[] {
  return properties.filter((property) => byBrand(filters.brand)(property) && byCity(filters.city)(property) && byArea(filters.area)(property));
}

/** How many properties each choice would show, given the other filters. */
export function counts(context: Context, filters: Filters) {
  const { properties, areas } = context;
  const geo = properties.filter((property) => byCity(filters.city)(property) && byArea(filters.area)(property));
  const branded = properties.filter(byBrand(filters.brand));
  return {
    total: properties.length,
    allBrands: geo.length,
    brand: (brand: BrandId) => geo.filter(byBrand(brand)).length,
    allCities: branded.length,
    city: (city: CityId) => branded.filter(byCity(city)).length,
    area: (area: string) => branded.filter(byArea(area)).length,
    /** Areas that can be chosen with the current city: all of them when no city is chosen. */
    areaOptions: areas.filter((area) => filters.city === null || area.city === filters.city),
  };
}

export function reduce(context: Context, state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "reset":
      return NO_FILTERS;
    case "load":
      return normalise(context, { ...action.filters, note: null });
    case "brand": {
      const next = { ...state, brand: action.brand, note: null };
      if (action.brand && (state.city || state.area) && matches(context.properties, next).length === 0) {
        const where = state.area ? areaName(context, state.area) : cityById(state.city!).name;
        return { brand: action.brand, city: null, area: null, note: `${brandName(context, action.brand)} chưa có nơi ở tại ${where}, nên bộ lọc địa điểm đã được bỏ.` };
      }
      return next;
    }
    case "city": {
      // A chosen area belongs to one city; a different city replaces it.
      const area = action.city && state.area && context.areas.find((a) => a.id === state.area)?.city !== action.city ? null : state.area;
      const next = { ...state, city: action.city, area: action.city === null ? null : area, note: null };
      if (action.city && state.brand && matches(context.properties, next).length === 0) {
        return { ...next, brand: null, note: `${brandName(context, state.brand)} chưa có nơi ở tại ${cityById(action.city).name}, nên bộ lọc thương hiệu đã được bỏ.` };
      }
      return next;
    }
    case "area": {
      // Choosing an area also chooses its city.
      const city = action.area ? (context.areas.find((a) => a.id === action.area)?.city ?? state.city) : state.city;
      const next = { ...state, area: action.area, city, note: null };
      if (action.area && state.brand && matches(context.properties, next).length === 0) {
        return { ...next, brand: null, note: `${brandName(context, state.brand)} chưa có nơi ở tại ${areaName(context, action.area)}, nên bộ lọc thương hiệu đã được bỏ.` };
      }
      return next;
    }
  }
}

function areaName(context: Context, id: string) {
  return context.areas.find((area) => area.id === id)?.name ?? id;
}

/** Drops anything unknown or contradictory, e.g. from a hand-edited address. */
function normalise(context: Context, state: FilterState): FilterState {
  const area = context.areas.find((a) => a.id === state.area);
  const city = area ? area.city : state.city;
  const next: FilterState = { ...state, area: area ? area.id : null, city };
  return matches(context.properties, next).length === 0 ? { ...next, brand: null } : next;
}

const BRAND_IDS: readonly BrandId[] = ["bare", "the-nang", "pepper-house"];
const CITY_IDS: readonly CityId[] = ["ho-chi-minh", "da-nang"];

export function fromSearch(search: string): Filters {
  const params = new URLSearchParams(search);
  const brand = params.get("brand");
  const city = params.get("city");
  return {
    brand: BRAND_IDS.includes(brand as BrandId) ? (brand as BrandId) : null,
    city: CITY_IDS.includes(city as CityId) ? (city as CityId) : null,
    area: params.get("area"),
  };
}

/** Writes the filters into the current address, keeping any other parameter. */
export function toSearch(search: string, filters: Filters): string {
  const params = new URLSearchParams(search);
  for (const key of ["brand", "city", "area"] as const) {
    const value = filters[key];
    if (value) params.set(key, value);
    else params.delete(key);
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

/** One sentence for the result summary, also announced to screen readers. */
export function summary(context: Context, state: Filters, shown: number): string {
  const parts = [state.brand && brandName(context, state.brand), state.area ? areaName(context, state.area) : state.city && cityById(state.city).name].filter(Boolean);
  const count = `${shown} nơi ở`;
  return parts.length ? `${count} · ${parts.join(" · ")}` : `Tất cả ${count}`;
}
