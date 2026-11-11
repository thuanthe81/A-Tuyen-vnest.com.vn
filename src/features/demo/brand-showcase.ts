import type { BrandId } from "@/app/dev/brand-collection/data";

/**
 * BRAND SHOWCASE CONFIGURATION (homepage `#thuong-hieu`, Phase B of the client review, 7/11/2026). One place for what the
 * brand section needs beyond the shared brand data (`@/app/dev/brand-collection/data`, workbook order, unchanged):
 * the display order, the representative photograph and the official links. Brand ids, property ids, routes and
 * booking-provider mappings are not touched here.
 */

/** Display order in the brand section (owner, 6/11/2026). The Discovery filters below keep their own order until Phase C. */
export const BRAND_ORDER: readonly BrandId[] = ["bare", "pepper-house", "the-nang"];

/** Brands in display order; brands not listed keep their incoming order after the listed ones. */
export function orderBrands<T extends { id: BrandId }>(brands: readonly T[]): T[] {
  const rank = (id: BrandId) => {
    const i = BRAND_ORDER.indexOf(id);
    return i < 0 ? BRAND_ORDER.length : i;
  };
  return [...brands].sort((a, b) => rank(a.id) - rank(b.id));
}

/** The approved property photograph that represents each brand (property id). */
export const BRAND_PHOTO: Readonly<Record<BrandId, string>> = { bare: "bare-chic", "pepper-house": "pepper-house", "the-nang": "the-nang-suites" };

/**
 * Each brand's OFFICIAL WEBSITE, the target of "Visit us ↗". Fill `url` only with an address VNest or the brand owner has
 * confirmed, with where and when it was confirmed. `null` = not supplied yet: the CTA is drawn non-operational (no link),
 * never pointed at Facebook, VNest or a guessed domain.
 *
 * Status 7/11/2026: no brand website exists in the repository or the client documents (client dependency, see
 * docs/qa/client-review-2026-11-06/phase-b/REVIEW.md).
 */
export type BrandWebsite = { url: string; source: string; checked: string };

export const BRAND_WEBSITES: Readonly<Record<BrandId, BrandWebsite | null>> = {
  bare: null,
  "pepper-house": null,
  "the-nang": null,
};

/**
 * Official brand Facebook Pages supplied by the client. Kept as verified brand data; since 7/11/2026 the brand section
 * no longer shows a Facebook button (owner: one "Visit us ↗" CTA to the website instead).
 */
export const BRAND_FACEBOOK_LINKS: Readonly<Record<BrandId, string>> = {
  bare: "https://www.facebook.com/bareboutiquestays",
  "pepper-house": "https://www.facebook.com/pepperhouse.asia",
  "the-nang": "https://www.facebook.com/TheNangSuites",
};
