import { HERO_SELECTION, selectionImage } from "@/content/vnest-workbook/image-selection";
import { selectedEntry, type SelectionManifest } from "@/content/vnest-workbook/selection-photos";

/**
 * HOMEPAGE HERO CAROUSEL, the curated set. Since 26/10/2026 it is the owner's selection: six
 * slides, one per property, in the order of `HERO_SELECTION` (image-selection.ts): Bare Chic (1),
 * Bare Hyphen (5), Bare Đa Kao (9), Bare Hàn (11), The Nắng Suites (13), Pepper House (17).
 * (Replaces the 24/10 Stage 1 set of five.)
 *
 * A slide is shown only when the local selection manifest holds the exact original the registry
 * pins (SHA-256) and the photograph has no hold. Alt text and crops come from the registry; each
 * slide has one focal point per breakpoint (phone, tablet, desktop).
 */
export type HeroSlide = {
  id: string;
  alt: string;
  /** Visible credit: property, room when relevant, city. */
  caption: string;
  width: number;
  height: number;
  sources: { type: string; srcSet: string }[];
  fallback: { src: string; srcSet: string };
  /** object-position at ≥64rem, 48–64rem and <48rem. */
  position: string;
  tabletPosition: string;
  mobilePosition: string;
};

const FORMATS = ["image/avif", "image/webp"];

export { HERO_AUTOPLAY_INTERVAL } from "./hero-timing";

/** The selected slides this machine can show, in order, captioned from the workbook's own names and cities. */
export function heroSlides(manifest: SelectionManifest | null, properties: readonly { id: string; name: string; location?: { label: string } }[]): HeroSlide[] {
  return HERO_SELECTION.flatMap((n) => {
    const image = selectionImage(n);
    const entry = selectedEntry(manifest, image);
    const property = image && properties.find((p) => p.id === image.propertyId);
    if (!image || !entry || !property) return [];
    // The hero is never narrower than a phone at 2×: below 800 px wide would only ever be upscaled.
    const srcSet = (type: string) =>
      entry.variants
        .filter((v) => v.type === type && v.width >= 800)
        .sort((a, b) => a.width - b.width)
        .map((v) => `${v.src} ${v.width}w`)
        .join(", ");
    const jpegs = entry.variants.filter((v) => v.type === "image/jpeg").sort((a, b) => a.width - b.width);
    // "Bare Chic One" already names its property; "Pale Blue Eyes" does not.
    const place = image.room.startsWith(property.name) ? image.room : `${property.name} · ${image.room}`;
    const caption = [place, property.location?.label].filter(Boolean).join(" · ");
    return [
      {
        id: image.key,
        alt: image.alt,
        caption,
        width: entry.width,
        height: entry.height,
        sources: FORMATS.filter((type) => entry.variants.some((v) => v.type === type)).map((type) => ({ type, srcSet: srcSet(type) })),
        fallback: { src: jpegs.find((v) => v.width >= 1600)?.src ?? jpegs.at(-1)!.src, srcSet: srcSet("image/jpeg") },
        position: image.crop.desktop,
        tabletPosition: image.crop.tablet,
        mobilePosition: image.crop.mobile,
      },
    ];
  });
}
