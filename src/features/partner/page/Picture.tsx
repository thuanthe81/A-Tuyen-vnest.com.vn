import { resolveLocalized, type Locale } from "@/domain/locale";
import type { SelectionPicture } from "../service-visuals";

/**
 * A photograph of the owner's selection, filling its frame (object-fit: cover, the registry's focal point). Nothing at
 * all when the photograph is unavailable on this machine: the frame keeps its own ground, never a stand-in.
 */
export function Picture({
  photo,
  locale,
  className,
  sizes,
  position,
  eager = false,
}: {
  photo: SelectionPicture | null;
  locale: Locale;
  className?: string;
  sizes: string;
  /** A focal point for this frame, when the registry's (made for wide crops) does not suit it. */
  position?: string;
  eager?: boolean;
}) {
  if (!photo) return null;
  return (
    <picture>
      {photo.sources.map((s) => (
        <source key={s.type} type={s.type} srcSet={s.srcSet} sizes={sizes} />
      ))}
      <img
        className={className}
        src={photo.src}
        srcSet={photo.srcSet}
        sizes={sizes}
        width={photo.width}
        height={photo.height}
        alt={resolveLocalized(photo.alt, locale)}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        decoding="async"
        style={{ objectPosition: position ?? photo.position }}
      />
    </picture>
  );
}
