/**
 * BRAND COLLECTION PROJECTION (03.3-C1): the shared workbook records (src/content/vnest-workbook)
 * as the content Concept B already uses: brands, six cards (name, city, location label), no
 * areas. The traced records themselves live in records.ts.
 */
import { CITIES, type Area, type Brand, type BrandId, type Property } from "../data";
import { BRANDS_BY_NAME, readClientProperties, type ClientProperty } from "@/content/vnest-workbook/records";
import { PLACEHOLDER_REASON } from "@/content/vnest-workbook/media";

/** Presentation only: the short form for the phone index, where the full name cannot fit (as in the mock). */
const BRAND_SHORT: Readonly<Record<BrandId, string>> = { bare: "Bare", "the-nang": "The Nắng", "pepper-house": "Pepper House" };

/** A plain beige frame. The label is drawn by the page, so an unaware component shows nothing misleading. */
export const PLACEHOLDER_PICTURE = { src: "/dev-fixtures/brand-collection/placeholder.svg", width: 1500, height: 1000 } as const;

export type ClientCollection = { brands: Brand[]; properties: Property[]; areas: Area[] };

/** What the homepage collection shows: brands in workbook order, six cards, no areas. */
export function clientCollection(records: readonly ClientProperty[] = readClientProperties()): ClientCollection {
  const brands: Brand[] = [];
  const properties = records.map((record): Property => {
    const brand = record.brand.display;
    const city = record.city.display;
    if (!brand || !city || !record.name.display) throw new Error(`${record.id}: brand, city and name are required to show a card`);
    if (!brands.some((b) => b.id === brand)) {
      const name = Object.keys(BRANDS_BY_NAME).find((key) => BRANDS_BY_NAME[key] === brand)!;
      brands.push({ id: brand, name, short: BRAND_SHORT[brand], logo: null });
    }
    const where = record.location;
    const label = [CITIES.find((c) => c.id === city)!.short, where.area.display].filter(Boolean).join(" · ");
    return {
      id: record.id,
      name: record.name.display,
      brand,
      city,
      // `area` drives the Area filter, which stays off; the location label is display only.
      area: null,
      picture: { ...PLACEHOLDER_PICTURE },
      placeholder: { reason: PLACEHOLDER_REASON[record.picture.reason] },
      location: { label, street: where.street.display, ward: where.ward.display, mapUrl: where.mapUrl.display, note: where.note },
    };
  });
  return { brands, properties, areas: [] };
}
