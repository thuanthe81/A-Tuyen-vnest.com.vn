/**
 * The anatomy of a property card: the handful of things that introduce a property wherever
 * it appears. One model, so a property is described once and reads the same in search
 * results (section 02.2) and in property discovery (Phase 04).
 *
 * Everything comes from the property record. A field the record lacks is absent here and
 * the card renders without it; nothing is filled in.
 */

import type { Property, ResolvedImage } from "@/domain/property";
import { findImage } from "@/domain/property";

/** A card never lists more than this many amenities, however many a property flags. */
export const MAX_SIGNATURE_AMENITIES = 3;

export interface CardImage {
  /** Absent for a placeholder with no file: a labelled block is drawn at its ratio. */
  src?: string;
  alt: string;
  width: number;
  height: number;
  /** The point to keep in frame when cropped, as percentages from the top-left. */
  position?: string;
  /** True unless VNest has cleared the asset: the picture is then labelled as a stand-in. */
  standIn: boolean;
}

export interface PropertyCardModel {
  id: string;
  slug: string;
  /** Identity. */
  name: string;
  category?: string;
  /** One line in VNest's words: the positioning, or failing that the tagline. */
  line?: string;
  /** The signature visual: the one image that stands for the property. */
  visual?: CardImage;
  /** Location or area. */
  area: string;
  /** Only amenities VNest flagged as particular to this property, at most three, in the record's order. */
  signatureAmenities: readonly string[];
  /** True for sample data, which every presentation must label. */
  sample: boolean;
}

export function toCardImage(image: ResolvedImage | undefined): CardImage | undefined {
  if (!image) return undefined;
  return {
    ...(image.src ? { src: image.src } : {}),
    alt: image.alt,
    width: image.width,
    height: image.height,
    ...(image.focalPoint ? { position: `${image.focalPoint.x * 100}% ${image.focalPoint.y * 100}%` } : {}),
    // A stand-in shows no VNest property. VNest's own photographs, cleared or still pending, are not.
    standIn: image.rights !== "client-approved" && image.rights !== "client-supplied-pending",
  };
}

export function toPropertyCardModel(property: Property): PropertyCardModel {
  const line = property.narrative.positioning ?? property.identity.tagline;
  const visual = toCardImage(findImage(property, property.identity.signatureMediaId));
  return {
    id: property.id,
    slug: property.slug,
    name: property.identity.name,
    ...(property.identity.category ? { category: property.identity.category } : {}),
    ...(line ? { line } : {}),
    ...(visual ? { visual } : {}),
    area: property.place.area.name,
    signatureAmenities: property.amenities
      .filter((amenity) => amenity.signature === true)
      .slice(0, MAX_SIGNATURE_AMENITIES)
      .map((amenity) => amenity.label),
    sample: property.source === "mock",
  };
}
