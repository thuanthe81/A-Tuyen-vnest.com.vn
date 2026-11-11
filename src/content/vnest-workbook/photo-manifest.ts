/**
 * THE LOCAL PHOTO MANIFEST written by docs/content/g2/fetch-photos.mjs (public/dev-client-media/,
 * git-ignored): which authorised photographs exist on this machine, with their derivatives.
 * Server only. Without a manifest (a fresh clone, or before an authorisation) it reads as null.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type ManifestVariant = { src: string; type: string; width: number; height: number; bytes: number };
export type PhotoManifest = { photos: Record<string, { driveFileId: string; sha256: string; width: number; height: number; variants: ManifestVariant[] }> };

/** Where the pipeline writes; served by Next from public/ on the local machine only. */
export const MANIFEST_PATH = join(process.cwd(), "public", "dev-client-media", "manifest.json");

export function readPhotoManifest(path = MANIFEST_PATH): PhotoManifest | null {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as PhotoManifest) : null;
}

/**
 * Crops, chosen after looking at each photograph at full size (18/10/2026). All four are 3:2, as
 * the card, so cards show the whole frame; only the narrow stage slices crop (about 0.6:1 on
 * desktop with Bare's four slices, 0.75:1 on phones), and these keep each subject in them.
 * Horizontal only: every subject sits mid-height.
 */
export const OBJECT_POSITION: Readonly<Record<string, string>> = {
  // Window over the sports ground, desk and sofa: centred already.
  "bare-chic": "55% 50%",
  // The round-windowed timber door (≈40% across) rather than the bed: "quá khứ – hiện đại".
  "bare-hyphen": "33% 50%",
  // Bamboo window, cup and pillow: centred already.
  "bare-da-kao": "50% 50%",
  // The window onto the trees and canal, with the armchair (≈30% across).
  "pepper-house": "20% 50%",
};
