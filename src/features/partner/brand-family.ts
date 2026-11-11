import type { BrandId, CityId } from "@/app/dev/brand-collection/data";
import { clientCollection } from "@/app/dev/brand-collection/client/adapter";
import { readClientProperties, type ClientProperty } from "@/content/vnest-workbook/records";
import type { Locale } from "@/domain/locale";
import { CITY_NAME } from "@/features/demo/brand-copy";
import { BRAND_ORDER } from "@/features/demo/brand-showcase";
import { resolveLocalized } from "@/domain/locale";

/**
 * Server only. The VNest hospitality family as the workbook records describe it: each brand, its stays and cities, in
 * the homepage's brand order (Bare, Pepper House, The Nắng Suites). Nothing here is typed by hand, so the partner page's
 * figures follow the records. The partner page shows only the logos today (9/11/2026); stays, cities and the franchise
 * flag stay here for later use.
 *
 * `franchise` marks the two brands the client's 05.11 Final offers for franchising (service 03: Bare Boutique Stays and
 * Pepper House, always with VNest management). The Nắng Suites is part of the family, not of the offer.
 */
export type FamilyBrand = {
  id: BrandId;
  name: string;
  stays: string[];
  cities: CityId[];
  franchise: boolean;
  logo: BrandMark;
};

/**
 * A brand as the ecosystem row shows it (owner, 10/11/2026): an official mark, unaltered at its own proportions, centred
 * in a band shared by the three, and the name in the same spaced capitals under each, on one line. One structure for
 * all three, so the row reads as equals.
 * - `alt`: what the mark itself spells ("Bare" for Bare's script wordmark; empty for the two symbols).
 * - `caption`: the visible name under the mark (with `alt`, the brand's full name).
 * - `optical`: the mark's height as a share of the band, to give the three the same visual weight (a thin, wide script
 *   needs less height than it seems; a heavy square symbol less than a tall one).
 * - `lift`: an optical nudge up, as a share of the band, for a mark whose ink sits low in its own box (Bare's script:
 *   most of it is the short lowercase letters; The Nắng Suites: its heavy base). Centring the boxes alone left them
 *   looking low.
 */
export type BrandMark = { src: string; width: number; height: number; alt: string; caption: string; optical: number; lift: number };

export const FRANCHISED: readonly BrandId[] = ["bare", "pepper-house"];

/**
 * Owner-supplied artwork (public/dev-fixtures/brand-collection/official-logos/SOURCES.md): the lossless transparent
 * delivery copies, never recoloured or cropped further. Bare uses its script wordmark (the official derivative the
 * homepage brand index uses), not the full lockup: the lockup's tall gap between script and subtitle put the script
 * high and the subtitle low, so Bare never lined up with the two symbols (owner, 10/11/2026).
 */
const LOGOS: Readonly<Record<BrandId, BrandMark>> = {
  bare: { src: "/dev-fixtures/brand-collection/official-logos/bare-wordmark-transparent.webp", width: 767, height: 402, alt: "Bare", caption: "Boutique Stays", optical: 0.56, lift: 0.06 },
  "pepper-house": { src: "/dev-fixtures/brand-collection/official-logos/pepper-house-transparent.webp", width: 1406, height: 1406, alt: "", caption: "Pepper House", optical: 0.78, lift: 0 },
  "the-nang": { src: "/dev-fixtures/brand-collection/official-logos/the-nang-suites-transparent.webp", width: 364, height: 512, alt: "", caption: "The Nắng Suites", optical: 0.94, lift: 0.02 },
};

const order = (id: BrandId) => {
  const i = BRAND_ORDER.indexOf(id);
  return i < 0 ? BRAND_ORDER.length : i;
};

export function brandFamily(records: readonly ClientProperty[] = readClientProperties()): FamilyBrand[] {
  const { brands, properties } = clientCollection(records);
  return [...brands].sort((a, b) => order(a.id) - order(b.id)).map((brand) => {
    const own = properties.filter((p) => p.brand === brand.id);
    return {
      id: brand.id,
      name: brand.name,
      stays: own.map((p) => p.name),
      cities: [...new Set(own.map((p) => p.city))],
      franchise: FRANCHISED.includes(brand.id),
      logo: LOGOS[brand.id],
    };
  });
}

/** How many brands, stays and cities the family has, with the cities named in `locale`. */
export function familyCounts(family: readonly FamilyBrand[], locale: Locale) {
  const cities = [...new Set(family.flatMap((b) => b.cities))];
  return {
    brands: family.length,
    stays: family.reduce((n, b) => n + b.stays.length, 0),
    cities: cities.map((c) => resolveLocalized(CITY_NAME[c], locale)),
  };
}
