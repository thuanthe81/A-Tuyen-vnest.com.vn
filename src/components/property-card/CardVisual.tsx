import Image from "next/image";
import type { CardImage } from "./model";

/** Wording for pictures that are not VNest's own. Draft, like the rest of the interface copy. */
const STAND_IN_LABEL = "Ảnh mẫu";
const NO_IMAGE_LABEL = "Chưa có hình ảnh";

/**
 * A picture in a fixed frame, so nothing moves while it loads. The frame is sized by the
 * caller (an aspect ratio or fixed dimensions) and must be `relative`.
 *
 * A stand-in is always labelled; a placeholder with no file, or no image at all, draws a
 * quiet block that says so instead of leaving a hole.
 */
export function CardVisual({
  image,
  sizes,
  priority = false,
  showLabel = true,
  className = "",
}: {
  image: CardImage | undefined;
  /** The rendered width at each breakpoint, for the browser's choice of file. */
  sizes: string;
  /** True for pictures expected in the first screen: they load at once instead of waiting to be scrolled to. */
  priority?: boolean;
  /** False where the frame is too small to carry a label and the surrounding text already says "sample". */
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-surface-muted ${className}`}>
      {image?.src ? (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          // Vector stand-ins need no resizing; real photographs go through the optimiser.
          unoptimized={image.src.endsWith(".svg")}
          className="object-cover"
          style={image.position ? { objectPosition: image.position } : undefined}
        />
      ) : (
        <div role="img" aria-label={image?.alt ?? NO_IMAGE_LABEL} className="absolute inset-0 flex items-center justify-center p-3 text-center text-xs text-ink-muted">
          {showLabel ? NO_IMAGE_LABEL : null}
        </div>
      )}
      {image?.src && image.standIn && showLabel ? (
        <span className="absolute top-3 left-3 rounded-(--vn-radius-sm) bg-ink/75 px-2 py-1 text-[0.6875rem] font-medium tracking-[0.08em] text-surface-raised uppercase">
          {STAND_IN_LABEL}
        </span>
      ) : null}
    </div>
  );
}
