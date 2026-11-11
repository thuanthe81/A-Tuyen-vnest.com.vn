import type { BrandId } from "@/app/dev/brand-collection/data";
import type { Filters } from "@/app/dev/brand-collection/filter";
import type { LocalizedText } from "@/domain/locale";
import { BRAND_ORDER, BRAND_WEBSITES, type BrandWebsite } from "./brand-showcase";

/**
 * COMING SOON (homepage Discovery; Phase C revision, 8/11/2026). One brand teaser card, NOT inventory. Nothing here is a
 * property, has a page, a city, a date, a price, rooms or availability, and nothing is sent to a booking provider. The six
 * real stays come from the client collection; these never join it.
 *
 * Placement (owner, 8/11/2026): no section of its own. With "Tất cả" there is no teaser; with one brand chosen, that
 * brand's teaser closes its list of real stays, inside the same grid. The card leads to the brand's official website
 * (`BRAND_WEBSITES`); while a website is not confirmed the card is drawn without a link, never pointed elsewhere.
 *
 * Copy is the build team's wording, deliberately free of facts; English is a draft for when Discovery is translated.
 */

/** Brands that have a teaser, in the approved brand order. */
export const COMING_SOON_BRANDS: readonly BrandId[] = BRAND_ORDER;

export const COMING_SOON_COPY = {
  /** The one visible line on each card. */
  label: { vi: "Sắp ra mắt", en: "Coming Soon" },
  /** Screen readers only, after the brand name, when the card links to the brand's website. */
  website: { vi: "website của thương hiệu, mở trong thẻ mới", en: "brand website, opens in a new tab" },
} as const satisfies Record<string, LocalizedText>;

/** The teaser to show after the real stays: the chosen brand's, or none with "Tất cả". */
export function comingSoonFor(filters: Pick<Filters, "brand">): BrandId | null {
  return filters.brand && COMING_SOON_BRANDS.includes(filters.brand) ? filters.brand : null;
}

/** Where a brand's teaser leads: its confirmed official website, or `null` (no link) until one is confirmed. */
export function comingSoonHref(brand: BrandId, websites: Readonly<Record<BrandId, BrandWebsite | null>> = BRAND_WEBSITES): string | null {
  return websites[brand]?.url ?? null;
}
