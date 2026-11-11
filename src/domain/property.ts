/**
 * The property content model: everything VNest itself says about a stay.
 *
 * VNest controls this content. It holds no availability and no bookable price; those come
 * only from the booking provider for specific dates (see availability.ts).
 *
 * Optional fields are genuinely optional: absent means "not supplied yet", and nothing
 * is ever filled in with invented facts.
 */

import type { IsoDate } from "./dates.ts";
import type { Locale, LocalizedText, Resolved } from "./locale.ts";
import { resolveLocalized } from "./locale.ts";
import type { ImageAsset, VideoAsset } from "./media.ts";

/** Where a record came from. Anything "mock" is labelled as sample data and never indexed. */
export type DataSource = "mock" | "client-supplied" | "provider";

/** "approved" means VNest has verified the record's facts and wording for publication. */
export type ContentStatus = "draft" | "approved";

export interface Money {
  /** Amount in the currency's main unit (e.g. đồng, not thousands of đồng). */
  amount: number;
  /** ISO 4217 code, e.g. "VND". */
  currency: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  id: string;
  slug: string;
  name: LocalizedText;
}

/**
 * The pictograms an amenity may be shown with. A fixed list, so an icon is always a choice
 * VNest made for that amenity and never a guess from its wording. An amenity without a key
 * is drawn with a neutral mark.
 */
export const AMENITY_ICONS = [
  "wifi",
  "pool",
  "breakfast",
  "restaurant",
  "bar",
  "kitchen",
  "parking",
  "air-conditioning",
  "workspace",
  "garden",
  "view",
  "spa",
  "gym",
  "laundry",
  "shuttle",
  "pets",
] as const;
export type AmenityIcon = (typeof AMENITY_ICONS)[number];

export interface Amenity {
  id: string;
  label: LocalizedText;
  /** Which pictogram stands for this amenity. Absent means none was chosen. */
  icon?: AmenityIcon;
  group?: LocalizedText;
  description?: LocalizedText;
  /** Marks what is particular to this property, as opposed to what every stay offers. */
  signature?: boolean;
}

export interface Policy {
  id: string;
  title: LocalizedText;
  body: LocalizedText;
}

export interface Faq {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
}

export type NearbyCategory = "nature" | "culture" | "food-drink" | "activity" | "transport" | "shopping" | "other";

/** Something near the property worth knowing about. Distances and times are stated only when verified. */
export interface NearbyExperience {
  id: string;
  name: LocalizedText;
  category: NearbyCategory;
  description?: LocalizedText;
  distanceMeters?: number;
  travelTime?: { minutes: number; mode: "walk" | "drive" | "boat" | "other" };
  coordinates?: Coordinates;
  url?: string;
  mediaId?: string;
}

export interface RoomType {
  id: string;
  slug: string;
  name: LocalizedText;
  /**
   * The one thing that sets this room type apart, in VNest's own words and on one line.
   * Absent means VNest has not said; nothing is composed in its place.
   */
  highlight?: LocalizedText;
  description?: LocalizedText;
  maxOccupancy?: number;
  bedding?: LocalizedText;
  areaSqm?: number;
  amenities: readonly Amenity[];
  mediaIds: readonly string[];
}

/**
 * An editorial "from" price that VNest has verified and chosen to state. It is a reference
 * only: it is never offered for booking and never emitted as structured-data pricing.
 * Bookable prices come from the provider for the searched dates.
 */
export interface RateReference {
  id: string;
  roomTypeId?: string;
  from: Money;
  /** What the figure refers to, e.g. per night for two guests in low season. */
  basis: LocalizedText;
  verifiedOn: IsoDate;
}

/** Who the property is and what stands for it. */
export interface PropertyIdentity {
  name: LocalizedText;
  tagline?: LocalizedText;
  /** A short label for the kind of stay, in VNest's own words. */
  category?: LocalizedText;
  /** The one image or video that stands for this property everywhere it is introduced. */
  signatureMediaId?: string;
  /**
   * The pictures (and, later, video) that open the property page, in the order VNest wants
   * them seen. The first is the primary one. Absent means the signature visual stands alone.
   */
  galleryMediaIds?: readonly string[];
  logoMediaId?: string;
  /** Present only once VNest confirms which brand, if any, the property belongs to. */
  brandId?: string;
}

/** The short form of the property's story. Long-form storytelling lives in presentation sections. */
export interface PropertyNarrative {
  positioning?: LocalizedText;
  summary?: LocalizedText;
}

export interface PropertyPlace {
  area: Location;
  address?: LocalizedText;
  coordinates?: Coordinates;
  /**
   * IANA timezone, e.g. "Asia/Ho_Chi_Minh". Absent means unknown: the site then makes
   * no "today" judgement for this property and leaves it to the provider.
   */
  timeZone?: string;
}

export interface PropertySeo {
  /** Falls back to the property name. */
  title?: LocalizedText;
  /** Falls back to the narrative summary. Never invented. */
  description?: LocalizedText;
  shareImageId?: string;
  /** Extra facts for structured data. Each is emitted only when present on an approved record. */
  structuredData?: {
    lodgingType?: "Hotel" | "Resort" | "BedAndBreakfast" | "Hostel" | "LodgingBusiness";
    telephone?: string;
    checkInTime?: string;
    checkOutTime?: string;
    sameAs?: readonly string[];
  };
}

/**
 * One block of a property page. Layout templates decide how each kind and variant is drawn;
 * the record decides what is said, in which order, and with which media.
 */
export type PropertySection =
  | {
      kind: "narrative";
      id: string;
      variant?: string;
      eyebrow?: LocalizedText;
      heading?: LocalizedText;
      body: readonly LocalizedText[];
      mediaIds?: readonly string[];
    }
  | { kind: "media"; id: string; variant?: string; mediaIds: readonly string[]; caption?: LocalizedText }
  | {
      kind: "collection";
      id: string;
      variant?: string;
      heading?: LocalizedText;
      collection: "amenities" | "rooms" | "nearby" | "location" | "policies" | "faqs";
    };

/**
 * How this property presents itself. Three levers, from strongest to lightest:
 * a layout template of its own, the editorial sections it tells its story with,
 * and theme tokens. Distinctiveness is expected to come mainly from the first two.
 */
export interface PropertyPresentation {
  /** Id of an editorial layout template registered in src/content/layouts.ts. */
  layout: string;
  sections: readonly PropertySection[];
  theme?: { tokens: Readonly<Record<string, string>> };
}

/** How one booking provider knows this property and its room types. Identifiers only, never credentials. */
export interface ProviderPropertyMapping {
  propertyRef: string;
  /** VNest room type id → the provider's room type identifier. */
  roomRefs?: Readonly<Record<string, string>>;
}

/** The authoring shape: one record per property, with every translatable field as LocalizedText. */
export interface PropertyRecord {
  id: string;
  slug: string;
  source: DataSource;
  status: ContentStatus;
  /** Languages VNest has approved for this property. Others are not served, whatever text exists. */
  approvedLocales: readonly Locale[];
  identity: PropertyIdentity;
  narrative: PropertyNarrative;
  place: PropertyPlace;
  media: { images: readonly ImageAsset[]; videos: readonly VideoAsset[] };
  amenities: readonly Amenity[];
  nearby: readonly NearbyExperience[];
  rooms: readonly RoomType[];
  rateReferences: readonly RateReference[];
  policies: readonly Policy[];
  faqs: readonly Faq[];
  seo: PropertySeo;
  presentation: PropertyPresentation;
  /** Keyed by booking provider id. Server-side only: removed before a record reaches a page. */
  booking: { providers: Readonly<Record<string, ProviderPropertyMapping>> };
}

/** What pages and components receive: one language, plain strings, no provider mapping. */
export type Property = Resolved<Omit<PropertyRecord, "booking" | "approvedLocales">> & {
  locale: Locale;
  /** Languages this property can be served in, for language alternates. */
  availableLocales: readonly Locale[];
};

export type ResolvedImage = Resolved<ImageAsset>;
export type ResolvedVideo = Resolved<VideoAsset>;

/** Languages a record may be served in: approved for the record and enabled for the site. */
export function servedLocales(record: PropertyRecord, enabledLocales: readonly Locale[]): readonly Locale[] {
  return record.approvedLocales.filter((locale) => enabledLocales.includes(locale));
}

/** The record in one language, or nothing when that language is not approved and enabled. */
export function resolveProperty(record: PropertyRecord, locale: Locale, enabledLocales: readonly Locale[]): Property | undefined {
  const availableLocales = servedLocales(record, enabledLocales);
  if (!availableLocales.includes(locale)) return undefined;
  const { booking: _booking, approvedLocales: _approvedLocales, ...content } = record;
  return { ...resolveLocalized(content, locale), locale, availableLocales };
}

/** Only verified, non-sample records may be indexed, listed in the sitemap or described in structured data. */
export function isPublishable(property: Pick<PropertyRecord, "source" | "status">): boolean {
  return property.source !== "mock" && property.status === "approved";
}

export function findImage(property: Property, id: string | undefined): ResolvedImage | undefined {
  return id === undefined ? undefined : property.media.images.find((image) => image.id === id);
}

/**
 * The media that open the property page, in VNest's order: the gallery when the record has
 * one, otherwise the signature visual alone, otherwise nothing. Ids that point at nothing
 * are skipped here and reported by validation.
 */
export function galleryMedia(property: Property): readonly (ResolvedImage | ResolvedVideo)[] {
  const ids = property.identity.galleryMediaIds?.length ? property.identity.galleryMediaIds : property.identity.signatureMediaId ? [property.identity.signatureMediaId] : [];
  return ids.flatMap((id) => findImage(property, id) ?? findVideo(property, id) ?? []);
}

export function findVideo(property: Property, id: string | undefined): ResolvedVideo | undefined {
  return id === undefined ? undefined : property.media.videos.find((video) => video.id === id);
}
