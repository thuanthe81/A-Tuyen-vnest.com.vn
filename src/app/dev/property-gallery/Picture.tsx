import { getImageProps } from "next/image";
import { type Concept, type Orientation, type Shot, shotAlt, shotSrc } from "./content";

/**
 * One stand-in picture filling its frame (the parent sets the size and must be positioned).
 *
 * "auto" is art direction: an upright crop below 768px and a wide one above, each its own
 * file, so a phone never downloads the desktop picture. Real photography will need the same
 * two crops per picture, or one picture with a focal point.
 */
export function Picture({
  concept,
  shot,
  orientation,
  sizes,
  wide = "(min-width: 48rem)",
  priority = false,
  className,
}: {
  concept: Concept;
  shot: Shot;
  orientation: Orientation | "auto";
  sizes: string;
  /** With "auto": when the wide crop is used. It should describe the frame's shape, not only the screen's width. */
  wide?: string;
  /** Only for the one picture expected to be the largest in the first screen. */
  priority?: boolean;
  className?: string;
}) {
  const common = { alt: shotAlt(shot), fill: true, sizes, unoptimized: true, loading: priority ? ("eager" as const) : ("lazy" as const), fetchPriority: priority ? ("high" as const) : undefined };
  const base = orientation === "auto" ? "p" : orientation;
  const { props } = getImageProps({ ...common, src: shotSrc(concept, shot.scene, base) });
  return (
    <picture>
      {orientation === "auto" ? <source media={wide} srcSet={shotSrc(concept, shot.scene, "l")} /> : null}
      <img {...props} alt={props.alt} className={className} style={{ ...props.style, objectFit: "cover" }} />
    </picture>
  );
}
