/**
 * Checks a property record before it can be served. Types catch shape errors; this catches
 * what types cannot: broken references, duplicate ids, incomplete translations, and
 * publication rules. It runs as a test over every record, so CI is the content gate.
 */

import { parseIsoDate } from "./dates.ts";
import { DEFAULT_LOCALE, missingTranslations } from "./locale.ts";
import { AMENITY_ICONS } from "./property.ts";
import type { PropertyRecord } from "./property.ts";
import { isSlug } from "./search.ts";

export interface ContentIssue {
  path: string;
  message: string;
}

export interface ValidationOptions {
  /** Ids of the editorial layout templates that exist. */
  layouts: readonly string[];
  /** Names of the design tokens a property theme may override. */
  themeableTokens: readonly string[];
}

function duplicates(ids: readonly string[]): string[] {
  return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
}

export function validatePropertyRecord(record: PropertyRecord, options: ValidationOptions): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const add = (path: string, message: string) => issues.push({ path, message });

  if (!record.id.trim()) add("id", "is empty");
  if (!isSlug(record.slug)) add("slug", `"${record.slug}" is not a lowercase, hyphen-separated slug`);
  if (!isSlug(record.place.area.slug)) add("place.area.slug", `"${record.place.area.slug}" is not a valid slug`);

  // Ids must be unique within their collection, because everything else refers to them.
  const images = [...record.media.images, ...record.media.videos.map((video) => video.poster)];
  const imageIds = images.map((image) => image.id);
  const videoIds = record.media.videos.map((video) => video.id);
  const mediaIds = [...imageIds, ...videoIds];
  const roomIds = record.rooms.map((room) => room.id);
  const collections: [string, readonly string[]][] = [
    ["media", mediaIds],
    ["rooms", roomIds],
    ["rooms (slug)", record.rooms.map((room) => room.slug)],
    ["amenities", record.amenities.map((amenity) => amenity.id)],
    ["nearby", record.nearby.map((place) => place.id)],
    ["policies", record.policies.map((policy) => policy.id)],
    ["faqs", record.faqs.map((faq) => faq.id)],
    ["rateReferences", record.rateReferences.map((rate) => rate.id)],
    ["presentation.sections", record.presentation.sections.map((section) => section.id)],
  ];
  for (const [path, ids] of collections) {
    for (const id of duplicates(ids)) add(path, `duplicate id "${id}"`);
  }

  for (const room of record.rooms) {
    if (!isSlug(room.slug)) add(`rooms.${room.id}.slug`, `"${room.slug}" is not a valid slug`);
    if (room.maxOccupancy !== undefined && (!Number.isInteger(room.maxOccupancy) || room.maxOccupancy < 1)) {
      add(`rooms.${room.id}.maxOccupancy`, "must be a whole number of at least 1");
    }
  }

  // Every reference must point at something that exists.
  const mediaRef = (path: string, id: string | undefined) => {
    if (id !== undefined && !mediaIds.includes(id)) add(path, `refers to unknown media "${id}"`);
  };
  const imageRef = (path: string, id: string | undefined) => {
    if (id !== undefined && !imageIds.includes(id)) add(path, `refers to unknown image "${id}"`);
  };
  const roomRef = (path: string, id: string | undefined) => {
    if (id !== undefined && !roomIds.includes(id)) add(path, `refers to unknown room type "${id}"`);
  };

  mediaRef("identity.signatureMediaId", record.identity.signatureMediaId);
  const gallery = record.identity.galleryMediaIds ?? [];
  gallery.forEach((id) => mediaRef("identity.galleryMediaIds", id));
  for (const id of duplicates(gallery)) add("identity.galleryMediaIds", `lists "${id}" more than once`);
  // A picture of one room type does not introduce the property.
  for (const asset of [...images, ...record.media.videos]) {
    if (asset.roomTypeId !== undefined && gallery.includes(asset.id)) add("identity.galleryMediaIds", `"${asset.id}" shows a room type; the gallery is for the property`);
  }
  // Records are typed, but content may arrive from a CMS or JSON one day: an icon outside the list is refused, not guessed.
  for (const amenity of [...record.amenities, ...record.rooms.flatMap((room) => room.amenities)]) {
    if (amenity.icon !== undefined && !(AMENITY_ICONS as readonly string[]).includes(amenity.icon)) add(`amenities.${amenity.id}.icon`, `"${amenity.icon}" is not a known amenity icon`);
  }
  for (const room of record.rooms) {
    const text = room.highlight?.vi ?? "";
    if (room.highlight !== undefined && (text.includes("\n") || text.length > 80)) add(`rooms.${room.id}.highlight`, "must be one line of at most 80 characters");
  }
  imageRef("identity.logoMediaId", record.identity.logoMediaId);
  imageRef("seo.shareImageId", record.seo.shareImageId);
  for (const room of record.rooms) room.mediaIds.forEach((id) => mediaRef(`rooms.${room.id}.mediaIds`, id));
  for (const place of record.nearby) mediaRef(`nearby.${place.id}.mediaId`, place.mediaId);
  for (const section of record.presentation.sections) {
    if (section.kind !== "collection") (section.mediaIds ?? []).forEach((id) => mediaRef(`presentation.sections.${section.id}.mediaIds`, id));
  }
  for (const asset of [...images, ...record.media.videos]) roomRef(`media.${asset.id}.roomTypeId`, asset.roomTypeId);
  for (const rate of record.rateReferences) {
    roomRef(`rateReferences.${rate.id}.roomTypeId`, rate.roomTypeId);
    if (!(rate.from.amount > 0)) add(`rateReferences.${rate.id}.from`, "must be a positive amount");
    if (!/^[A-Z]{3}$/.test(rate.from.currency)) add(`rateReferences.${rate.id}.from.currency`, "must be an ISO 4217 code");
    if (!parseIsoDate(rate.verifiedOn)) add(`rateReferences.${rate.id}.verifiedOn`, "must be a real calendar date");
  }
  for (const [providerId, mapping] of Object.entries(record.booking.providers)) {
    if (!mapping.propertyRef.trim()) add(`booking.providers.${providerId}.propertyRef`, "is empty");
    Object.keys(mapping.roomRefs ?? {}).forEach((id) => roomRef(`booking.providers.${providerId}.roomRefs`, id));
  }

  // Media must be drawable without layout shift, and readable without the file.
  for (const image of images) {
    if (!(image.width > 0 && image.height > 0)) add(`media.${image.id}`, "needs a positive width and height");
    if (!image.src && image.rights !== "placeholder") add(`media.${image.id}.src`, "is missing on a non-placeholder image");
    if (image.src && image.rights === "placeholder") add(`media.${image.id}.rights`, 'has a file, so it cannot be "placeholder"');
  }
  for (const video of record.media.videos) {
    if (!(video.width > 0 && video.height > 0)) add(`media.${video.id}`, "needs a positive width and height");
    if (video.sources.length === 0) add(`media.${video.id}.sources`, "has no source file");
  }

  // Presentation must use what exists.
  if (!options.layouts.includes(record.presentation.layout)) {
    add("presentation.layout", `"${record.presentation.layout}" is not a registered layout`);
  }
  for (const token of Object.keys(record.presentation.theme?.tokens ?? {})) {
    if (!options.themeableTokens.includes(token)) add("presentation.theme.tokens", `"${token}" is not a themeable token`);
  }

  if (record.place.timeZone !== undefined) {
    try {
      new Intl.DateTimeFormat("en", { timeZone: record.place.timeZone });
    } catch {
      add("place.timeZone", `"${record.place.timeZone}" is not an IANA timezone`);
    }
  }

  // Languages: the primary language is always there, and an approved language is complete.
  if (!record.approvedLocales.includes(DEFAULT_LOCALE) && record.approvedLocales.length > 0) {
    add("approvedLocales", `must include the primary language "${DEFAULT_LOCALE}"`);
  }
  const { booking: _booking, ...content } = record;
  for (const locale of new Set([DEFAULT_LOCALE, ...record.approvedLocales])) {
    for (const path of missingTranslations(content, locale)) add(path, `has no "${locale}" text`);
  }

  // Publication rules: sample data is never approved, and approved records show only cleared assets.
  if (record.source === "mock" && record.status === "approved") add("status", "a mock record can never be approved");
  if (record.status === "approved") {
    if (record.approvedLocales.length === 0) add("approvedLocales", "an approved record needs at least one approved language");
    for (const asset of [...images, ...record.media.videos]) {
      if (asset.rights !== "client-approved") add(`media.${asset.id}.rights`, `is "${asset.rights}" on an approved record`);
    }
  }

  return issues;
}
