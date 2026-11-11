import type { Photo, PhotoGroup } from "./Lightbox";

/** How many photographs the wide-screen mosaic shows before "Xem tất cả ảnh". */
export const MOSAIC = 5;
/** Maximum slides rendered in the inline hero strip before opening the full Lightbox modal. */
export const MAX_HERO_STRIP = 6;

export type HeroStripSlide = {
  photo: Photo;
  /**
   * Official room label shown on the tile badge: present only on each official room's primary
   * representative cover tile (in workbook order), and `null` on additional mosaic tiles so
   * duplicate or artificial room labels are never shown.
   */
  roomLabel: string | null;
};

/** Each room's first photograph, then each room's second, and so on: the opening tiles show every room. */
function interleave(groups: readonly PhotoGroup[]) {
  const longest = Math.max(0, ...groups.map((g) => g.photos.length));
  return Array.from({ length: longest }, (_, i) => groups.flatMap((g) => (g.photos[i] ? [g.photos[i]!] : []))).flat();
}

/**
 * Builds the hero mosaic & mobile strip slides:
 * - Represents each official room with its selected cover image in workbook order (`groups` order).
 * - When there are more mosaic tiles than rooms, fills remaining tiles with visually distinct
 *   approved imagery (deduplicating by `photo.src ?? photo.id`) without inventing room positions
 *   or repeating misleading duplicate room labels.
 */
export function buildHeroStrip(
  groups: readonly PhotoGroup[],
  extraGroups: readonly PhotoGroup[] = [],
  maxTiles: number = MAX_HERO_STRIP,
): HeroStripSlide[] {
  const officialRooms = new Set(groups.map((g) => g.room));
  const candidates = [...interleave(groups), ...extraGroups.flatMap((g) => g.photos)];
  const seenAssets = new Set<string>();
  const labeledRooms = new Set<string>();
  const slides: HeroStripSlide[] = [];

  for (const photo of candidates) {
    if (slides.length >= maxTiles) break;
    const assetKey = photo.src ?? photo.id;
    if (seenAssets.has(assetKey)) continue;
    seenAssets.add(assetKey);

    let roomLabel: string | null = null;
    if (officialRooms.has(photo.room) && !labeledRooms.has(photo.room)) {
      roomLabel = photo.room;
      labeledRooms.add(photo.room);
    }
    slides.push({ photo, roomLabel });
  }

  return slides;
}
