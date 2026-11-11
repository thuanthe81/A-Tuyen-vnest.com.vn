import { selectionImage } from "@/content/vnest-workbook/image-selection";
import { readSelectionManifest, selectedEntry, type SelectionManifest } from "@/content/vnest-workbook/selection-photos";
import { SERVICE_PHOTO_ALT_EN, SERVICE_PHOTO_NUMBER, type SelectionPicture, type ServicePhoto } from "./service-visuals";

/**
 * Server only. A photograph of the owner's image selection (image-selection.ts, n° 1–17) as a responsive picture, or
 * `null` when it is on hold or this machine has no derived copy (a fresh clone): callers then show their plain ground,
 * never a stand-in image. Its Vietnamese alt is the registry's; `altEn` is the English one (build team DRAFT).
 */
export function selectionPicture(n: number, altEn: string, manifest: SelectionManifest | null = readSelectionManifest()): SelectionPicture | null {
  const image = selectionImage(n);
  const entry = selectedEntry(manifest, image);
  if (!image || !entry) return null;
  const set = (type: string) =>
    entry.variants
      .filter((v) => v.type === type)
      .sort((a, b) => a.width - b.width)
      .map((v) => `${v.src} ${v.width}w`)
      .join(", ");
  const jpegs = entry.variants.filter((v) => v.type === "image/jpeg").sort((a, b) => a.width - b.width);
  const fallback = jpegs.find((v) => v.width >= 1200) ?? jpegs.at(-1);
  if (!fallback) return null;
  return {
    src: fallback.src,
    srcSet: set("image/jpeg"),
    sources: ["image/avif", "image/webp"].map((type) => ({ type, srcSet: set(type) })).filter((s) => s.srcSet),
    width: entry.width,
    height: entry.height,
    alt: { vi: image.alt, en: altEn },
    position: image.crop.desktop,
    room: image.room,
    propertyId: image.propertyId,
  };
}

/** The Hospitality Management photograph (n° 16). */
export function servicePhoto(manifest: SelectionManifest | null = readSelectionManifest()): ServicePhoto | null {
  return selectionPicture(SERVICE_PHOTO_NUMBER, SERVICE_PHOTO_ALT_EN, manifest);
}
