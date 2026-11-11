/**
 * DRAFT CLIENT RECORDS, served only by the local "client-draft" content source (CONTENT_SOURCE,
 * src/server/services.ts). Production serves src/content/properties, which stays empty until a
 * record is approved. Server only: photographs are looked up in the local, git-ignored manifest.
 */
import { readPhotoManifest } from "@/content/vnest-workbook/photo-manifest";
import { selectionLookup } from "@/content/vnest-workbook/selection-photos";
import type { PropertyRecord } from "@/domain/property";
import { buildBareChic, type PhotoLookup } from "./bare-chic/record";

/** The largest JPEG derivative of an authorised photograph on this machine, or null. `sel-…` keys are the owner's image selection (26/10/2026). */
export const localPhotoLookup: PhotoLookup = (key) => {
  if (key.startsWith("sel-")) return selectionLookup()(key);
  const entry = readPhotoManifest()?.photos[key];
  const jpeg = entry?.variants.filter((v) => v.type === "image/jpeg").sort((a, b) => b.width - a.width)[0];
  return jpeg ? { src: jpeg.src, width: jpeg.width, height: jpeg.height } : null;
};

export function draftPropertyRecords(photo: PhotoLookup = localPhotoLookup): readonly PropertyRecord[] {
  return [buildBareChic(photo).record];
}
