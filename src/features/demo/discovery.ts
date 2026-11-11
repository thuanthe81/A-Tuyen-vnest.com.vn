import { brandCities, CITIES, type BrandId, type CityId, type Property } from "@/app/dev/brand-collection/data";
import type { Filters } from "@/app/dev/brand-collection/filter";
import { BRAND_ORDER } from "./brand-showcase";

/**
 * DISCOVERY FILTER RULES for the homepage stays (`#kham-pha`, Phase C, 7/11/2026). Pure functions over the real
 * properties; the filter state itself (brand, city, the address, the "latest choice wins" note) stays in the shared
 * `@/app/dev/brand-collection/filter` reducer.
 *
 * City chips show two different things, kept apart on purpose:
 * - the ACTIVE filter (`active`): the one city the guest chose; choosing it again clears it;
 * - AVAILABILITY for the chosen brand, never a filter: `only` marks the single city of a one-city brand (Pepper House →
 *   TP. Hồ Chí Minh, The Nắng Suites → Đà Nẵng); `unavailable` marks a city where the brand has no stay (it cannot be
 *   chosen, so no combination ends in an empty list). With "Tất cả" or a brand in both cities, both stay `available`;
 *   no city is ever selected automatically.
 */

export type CityChipState = "active" | "available" | "only" | "unavailable";
export type CityChip = { id: CityId; name: string; state: CityChipState };

export function cityChips(properties: readonly Property[], filters: Pick<Filters, "brand" | "city">): CityChip[] {
  const present = filters.brand ? brandCities(properties, filters.brand) : null;
  return CITIES.map(({ id, name }) => {
    if (filters.city === id) return { id, name, state: "active" };
    if (present && !present.includes(id)) return { id, name, state: "unavailable" };
    if (present && present.length === 1) return { id, name, state: "only" };
    return { id, name, state: "available" };
  });
}

/** The city filter after a tap: the active city clears, an unavailable city changes nothing (`undefined`). */
export function cityAfterTap(chip: CityChip): CityId | null | undefined {
  if (chip.state === "active") return null;
  if (chip.state === "unavailable") return undefined;
  return chip.id;
}

/** Real stays in the approved brand order (Bare → Pepper House → The Nắng), keeping their own order within a brand. */
export function inBrandOrder(properties: readonly Property[]): Property[] {
  const rank = (brand: BrandId) => BRAND_ORDER.indexOf(brand);
  return properties.map((property, index) => ({ property, index })).sort((a, b) => rank(a.property.brand) - rank(b.property.brand) || a.index - b.index).map(({ property }) => property);
}
