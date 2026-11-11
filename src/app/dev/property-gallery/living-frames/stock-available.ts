import { existsSync } from "node:fs";
import path from "node:path";
import { STOCK_CLIP, STOCK_PHOTOS } from "./media";

/**
 * Whether every file of the media reality check is on this machine. The stock media is kept
 * out of Git on purpose (public/dev-fixtures/stock-test/.gitignore), so a fresh checkout
 * does not have it. Without it, /media-a and /media-b show the drawn stand-ins in the same
 * geometry, with a notice saying so, instead of broken pictures.
 *
 * Server only: it reads the disk. Checked at build time for these static pages, and on every
 * request in development.
 */
export function stockMediaAvailable(): boolean {
  const files = [
    ...Object.values(STOCK_PHOTOS).flatMap((photo) => photo.widths.flatMap((width) => ["avif", "webp", "jpg"].map((ext) => `${photo.base}-${width}.${ext}`))),
    STOCK_CLIP.wide,
    STOCK_CLIP.small,
  ];
  return files.every((file) => existsSync(path.join(process.cwd(), "public", file)));
}
