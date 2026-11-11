import type { StockPhoto } from "./media";

/**
 * One photograph filling its frame (the parent sets the size and must be positioned), from
 * files made ahead of time: AVIF, then WebP, then JPEG, each in several widths. The frame
 * crops towards the photograph's focal point.
 *
 * `wholeWhenWide` is for the gallery: an upright photograph in a wide frame is shown whole
 * from 768px, not cut to a band.
 */
export function Photo({ photo, sizes, priority = false, wholeWhenWide = false }: { photo: StockPhoto; sizes: string; priority?: boolean; wholeWhenWide?: boolean }) {
  const set = (extension: string) => photo.widths.map((width) => `${photo.base}-${width}.${extension} ${width}w`).join(", ");
  const fallback = photo.widths[Math.floor(photo.widths.length / 2)];
  return (
    <picture>
      <source type="image/avif" srcSet={set("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={set("webp")} sizes={sizes} />
      {/* Files of fixed widths made ahead of time: the image optimiser has nothing to add. */}
      <img
        src={`${photo.base}-${fallback}.jpg`}
        srcSet={set("jpg")}
        sizes={sizes}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className={wholeWhenWide ? "absolute inset-0 h-full w-full object-cover md:object-contain" : "absolute inset-0 h-full w-full object-cover"}
        style={{ objectPosition: photo.focus }}
      />
    </picture>
  );
}
