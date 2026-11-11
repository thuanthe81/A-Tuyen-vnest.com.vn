/**
 * BRAND COLLECTION EXPLORATION: the content both concepts share, so the comparison is fair.
 *
 * What is real: the three brand names, the six property names, which brand each property
 * belongs to and its city, all as given in the owner's brief of 15/10/2026. Nothing else.
 *
 * What is not: no partner logo has been supplied, so `logo` is null and the UI draws a
 * labelled slot; no brand description has been approved, so there is none; pictures are the
 * drawn stand-ins from public/dev-fixtures/exploration, assigned arbitrarily.
 *
 * Areas (district or neighbourhood) are NOT verified for any property, so every property's
 * `area` is null and the Area filter says so. `SAMPLE_AREAS` exists only to let a reviewer
 * try the Area interaction (`?areas=sample`); its names say "mẫu" and match no real place.
 */

// The same identifiers as the client workbook records (src/content/vnest-workbook/ids.ts).
import type { BrandId, CityId } from "@/content/vnest-workbook/ids";
export type { BrandId, CityId };

/** A partner logo, once supplied. Placed on a light ground, never recoloured. */
export type BrandLogo = { src: string; width: number; height: number };

export type Brand = {
  id: BrandId;
  name: string;
  /** Short form, only where the full name cannot fit (the phone selector of concept B). */
  short: string;
  logo: BrandLogo | null;
};

export type Property = {
  id: string;
  name: string;
  brand: BrandId;
  city: CityId;
  /** Verified area id, or null while unverified. */
  area: string | null;
  picture: { src: string; width: number; height: number };
  /**
   * Client content only (03.3-C1): no picture may be shown yet, so the page draws a labelled
   * placeholder that says why. `picture` is then a plain beige frame. Absent on the mock.
   */
  placeholder?: { reason: string };
  /**
   * Client content only (03.3-C1 G2): an authorised local photograph, as responsive sources.
   * When present it is drawn instead of `picture`. Absent on the mock.
   */
  photo?: Photo;
  /**
   * Client content only (G2.1): the card's location label ("TP.HCM · Quận 1", or the city alone)
   * and what its panel shows. Display only: no filter reads it. Absent on the mock.
   */
  location?: PropertyLocation;
};

export type PropertyLocation = {
  label: string;
  /** Number and street; null while the house number is in conflict. */
  street: string | null;
  /** Current ward and city, as supplied by VNest. */
  ward: string | null;
  /** Only when the link is free of conflict and resolves to this property's Google place. */
  mapUrl: string | null;
  /** What is still pending, in one short line. */
  note: string | null;
};

/** A photograph as responsive sources: modern formats first, then a JPEG fallback. */
export type Photo = {
  width: number;
  height: number;
  sources: readonly { type: string; srcSet: string }[];
  fallback: { src: string; srcSet: string };
  /** CSS object-position for the crops (card 3:2, stage slices); centre when absent. */
  objectPosition?: string;
};

export type Area = { id: string; name: string; city: CityId };

export const BRANDS: readonly Brand[] = [
  { id: "bare", name: "Bare Boutique Stays", short: "Bare", logo: null },
  { id: "the-nang", name: "The Nắng Suites", short: "The Nắng", logo: null },
  { id: "pepper-house", name: "Pepper House", short: "Pepper House", logo: null },
];

export const CITIES: readonly { id: CityId; name: string; short: string }[] = [
  { id: "ho-chi-minh", name: "TP. Hồ Chí Minh", short: "TP.HCM" },
  { id: "da-nang", name: "Đà Nẵng", short: "Đà Nẵng" },
];

const picture = (file: string) => ({ src: `/dev-fixtures/exploration/${file}-l.svg`, width: 2000, height: 1125 });

export const PROPERTIES: readonly Property[] = [
  { id: "bare-chic", name: "Bare Chic", brand: "bare", city: "ho-chi-minh", area: null, picture: picture("a-facade") },
  { id: "bare-hyphen", name: "Bare Hyphen", brand: "bare", city: "ho-chi-minh", area: null, picture: picture("b-stair") },
  { id: "bare-da-kao", name: "Bare Đa Kao", brand: "bare", city: "ho-chi-minh", area: null, picture: picture("c-street") },
  { id: "bare-han", name: "Bare Hàn", brand: "bare", city: "da-nang", area: null, picture: picture("a-lobby") },
  { id: "the-nang-suites", name: "The Nắng Suites", brand: "the-nang", city: "da-nang", area: null, picture: picture("b-room") },
  { id: "pepper-house", name: "Pepper House", brand: "pepper-house", city: "ho-chi-minh", area: null, picture: picture("c-cafe") },
];

/** Verified areas. Empty until VNest confirms each property's address. */
export const VERIFIED_AREAS: readonly Area[] = [];

/** REVIEW ONLY. Placeholder areas so the Area control can be tried; not a classification. */
export const SAMPLE_AREAS: readonly Area[] = [
  { id: "mau-1", name: "Khu vực mẫu 1", city: "ho-chi-minh" },
  { id: "mau-2", name: "Khu vực mẫu 2", city: "ho-chi-minh" },
  { id: "mau-3", name: "Khu vực mẫu 3", city: "da-nang" },
];

const SAMPLE_ASSIGNMENT: Record<string, string> = {
  "bare-chic": "mau-1",
  "bare-hyphen": "mau-2",
  "bare-da-kao": "mau-1",
  "pepper-house": "mau-2",
  "bare-han": "mau-3",
  "the-nang-suites": "mau-3",
};

export type AreaMode = "verified" | "sample";

export function collection(mode: AreaMode): { properties: readonly Property[]; areas: readonly Area[] } {
  if (mode === "verified") return { properties: PROPERTIES, areas: VERIFIED_AREAS };
  return { properties: PROPERTIES.map((property) => ({ ...property, area: SAMPLE_ASSIGNMENT[property.id] ?? null })), areas: SAMPLE_AREAS };
}

export const brandById = (id: BrandId) => BRANDS.find((brand) => brand.id === id)!;
export const cityById = (id: CityId) => CITIES.find((city) => city.id === id)!;

/** The cities a brand is present in, in CITIES order. */
export function brandCities(properties: readonly Property[], brand: BrandId): CityId[] {
  return CITIES.map((city) => city.id).filter((city) => properties.some((property) => property.brand === brand && property.city === city));
}
