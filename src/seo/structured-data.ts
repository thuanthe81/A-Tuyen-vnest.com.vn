/**
 * schema.org structured data, built only from verified content.
 *
 * Rules: nothing is emitted for a record that is not publishable (sample or draft), a field
 * is emitted only when the record actually has it, and there is no price, availability or
 * rating markup at all: none of those has a verified, stable source on this site.
 */

import type { Property } from "@/domain/property";
import { findImage, isPublishable } from "@/domain/property";

export type JsonLd = Readonly<Record<string, unknown>>;

function withoutEmpty(data: Record<string, unknown>): JsonLd {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined && !(Array.isArray(value) && value.length === 0)),
  );
}

export function organizationJsonLd(organization: { name: string; url: string; logoUrl?: string; sameAs?: readonly string[] }): JsonLd {
  return withoutEmpty({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: organization.name,
    url: organization.url,
    logo: organization.logoUrl,
    sameAs: organization.sameAs ? [...organization.sameAs] : undefined,
  });
}

export function breadcrumbJsonLd(trail: readonly { name: string; url: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url })),
  };
}

/** Describes a property as a lodging business, or returns nothing when the record may not be published. */
export function lodgingJsonLd(property: Property, urls: { page: string; absolute: (path: string) => string }): JsonLd | undefined {
  if (!isPublishable(property)) return undefined;
  const facts = property.seo.structuredData ?? {};
  const images = property.media.images.flatMap((image) => (image.src ? [urls.absolute(image.src)] : []));
  const shareImage = findImage(property, property.seo.shareImageId);
  const { address, coordinates } = property.place;

  return withoutEmpty({
    "@context": "https://schema.org",
    "@type": facts.lodgingType ?? "LodgingBusiness",
    "@id": `${urls.page}#lodging`,
    name: property.identity.name,
    url: urls.page,
    description: property.seo.description ?? property.narrative.summary,
    image: shareImage?.src ? [urls.absolute(shareImage.src), ...images.filter((url) => url !== urls.absolute(shareImage.src ?? ""))] : images,
    address: address ? { "@type": "PostalAddress", streetAddress: address, addressLocality: property.place.area.name } : undefined,
    geo: coordinates ? { "@type": "GeoCoordinates", latitude: coordinates.latitude, longitude: coordinates.longitude } : undefined,
    telephone: facts.telephone,
    checkinTime: facts.checkInTime,
    checkoutTime: facts.checkOutTime,
    sameAs: facts.sameAs ? [...facts.sameAs] : undefined,
    amenityFeature: property.amenities.map((amenity) => ({ "@type": "LocationFeatureSpecification", name: amenity.label, value: true })),
  });
}

/** Serialised for a <script type="application/ld+json">. "<" is escaped so content can never close the tag. */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
