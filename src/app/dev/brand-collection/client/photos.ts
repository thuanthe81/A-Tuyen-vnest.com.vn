/**
 * AUTHORISED LOCAL PHOTOGRAPHS for the client preview (03.3-C1 G2). Server only.
 *
 * Reads the manifest written by docs/content/g2/fetch-photos.mjs (public/dev-client-media/,
 * git-ignored) and gives a property its photograph only when all of these hold:
 * - an authorisation is recorded (media.ts, `G2_AUTHORISATION`) and covers that exact file;
 * - the manifest's file is the property's proposed primary image (same Drive file id);
 * - the property's photo folders are not in conflict (Bare Hàn and The Nắng Suites never qualify).
 * Otherwise the property keeps its labelled placeholder. Without a manifest (a fresh clone, or
 * before G2), nothing changes, so the route always renders.
 */
import type { Photo, Property } from "../data";
import { G2_AUTHORISATION, isAuthorised, PROPOSED_IMAGES, type Authorisation } from "@/content/vnest-workbook/media";
import { OBJECT_POSITION, type PhotoManifest } from "@/content/vnest-workbook/photo-manifest";
import type { ClientProperty } from "@/content/vnest-workbook/records";
import type { ClientCollection } from "./adapter";

const FORMAT_ORDER = ["image/avif", "image/webp"];

export function toPhoto(entry: Pick<PhotoManifest["photos"][string], "width" | "height" | "variants">, objectPosition?: string): Photo {
  const srcSet = (type: string) =>
    entry.variants
      .filter((v) => v.type === type)
      .sort((a, b) => a.width - b.width)
      .map((v) => `${v.src} ${v.width}w`)
      .join(", ");
  const jpegs = entry.variants.filter((v) => v.type === "image/jpeg").sort((a, b) => a.width - b.width);
  return {
    width: entry.width,
    height: entry.height,
    sources: FORMAT_ORDER.filter((type) => entry.variants.some((v) => v.type === type)).map((type) => ({ type, srcSet: srcSet(type) })),
    fallback: { src: jpegs.at(-1)!.src, srcSet: srcSet("image/jpeg") },
    ...(objectPosition ? { objectPosition } : {}),
  };
}

/** The collection with authorised photographs in place of placeholders, where allowed. */
export function withPhotos(content: ClientCollection, records: readonly ClientProperty[], manifest: PhotoManifest | null, authorisation: Authorisation | null = G2_AUTHORISATION): ClientCollection {
  if (!manifest || !authorisation) return content;
  const properties = content.properties.map((property): Property => {
    const record = records.find((r) => r.id === property.id);
    const primary = PROPOSED_IMAGES[property.id]?.find((image) => image.role === "primary");
    const entry = manifest.photos[property.id];
    const allowed = record && record.picture.reason !== "folder-conflict" && primary && entry && entry.driveFileId === primary.driveFileId && isAuthorised(primary.driveFileId, authorisation) && entry.variants.some((v) => v.type === "image/jpeg");
    if (!allowed) return property;
    const { placeholder: _placeholder, ...rest } = property;
    return { ...rest, photo: toPhoto(entry, OBJECT_POSITION[property.id]) };
  });
  return { ...content, properties };
}
