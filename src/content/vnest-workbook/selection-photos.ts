/**
 * THE OWNER IMAGE SELECTION ON THIS MACHINE (26/10/2026). Server only.
 *
 * Reads the manifest written by docs/content/selection/derive-selection.mjs
 * (public/dev-client-media/selection/, git-ignored) and hands out a selected photograph only when:
 * it has no hold (image-selection.ts), and the derived files come from the exact original the
 * registry pins (same SHA-256). Otherwise callers keep what they showed before, so a fresh clone
 * (no manifest) renders exactly as it did.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { isShowable, PROPERTY_COVER, SELECTION, selectionForRoom, selectionImage, type SelectionImage } from "./image-selection";
import type { ManifestVariant } from "./photo-manifest";

export type SelectionEntry = { sha256: string; width: number; height: number; variants: ManifestVariant[] };
export type SelectionManifest = { photos: Record<string, SelectionEntry> };

const SELECTION_BY_KEY = new Map(SELECTION.map((image) => [image.key, image]));

export const SELECTION_MANIFEST_PATH = join(process.cwd(), "public", "dev-client-media", "selection", "manifest.json");

export function readSelectionManifest(path = SELECTION_MANIFEST_PATH): SelectionManifest | null {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as SelectionManifest) : null;
}

/** The derived entry of a selected photograph, or null when it may not or cannot be shown. */
export function selectedEntry(manifest: SelectionManifest | null, image: SelectionImage | undefined): SelectionEntry | null {
  if (!manifest || !image || !isShowable(image)) return null;
  const entry = manifest.photos[image.key];
  return entry && entry.sha256 === image.sha256 && entry.variants.some((v) => v.type === "image/jpeg") ? entry : null;
}

/** The largest JPEG of an entry: what next/image and the room viewers take as their single source. */
export function largestJpeg(entry: Pick<SelectionEntry, "variants">) {
  return entry.variants.filter((v) => v.type === "image/jpeg").sort((a, b) => b.width - a.width)[0] ?? null;
}

/** A property's representative photograph, with its registry record. */
export function selectedCover(manifest: SelectionManifest | null, propertyId: string) {
  const image = selectionImage(PROPERTY_COVER[propertyId] ?? -1);
  const entry = selectedEntry(manifest, image);
  return image && entry ? { image, entry } : null;
}

/** A room's showable selected photographs, cover first. */
export function selectedRoomImages(manifest: SelectionManifest | null, roomIdOrName: string) {
  return selectionForRoom(roomIdOrName).flatMap((image) => {
    const entry = selectedEntry(manifest, image);
    return entry ? [{ image, entry }] : [];
  });
}

/**
 * A photo lookup (the draft records' `PhotoLookup` shape) for selection keys: `sel-…` resolves to
 * the largest JPEG, anything else to null so the caller's own lookup answers.
 */
export function selectionLookup(manifest: SelectionManifest | null = readSelectionManifest()) {
  return (key: string): { src: string; width: number; height: number } | null => {
    const image = key.startsWith("sel-") ? SELECTION_BY_KEY.get(key) : undefined;
    const entry = selectedEntry(manifest, image);
    const jpeg = entry ? largestJpeg(entry) : null;
    return jpeg ? { src: jpeg.src, width: jpeg.width, height: jpeg.height } : null;
  };
}
