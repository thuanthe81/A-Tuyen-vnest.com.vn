import { CardVisual } from "./CardVisual";
import type { PropertyCardModel } from "./model";

/**
 * How each presentation of the card is proportioned. Every variant shows the same anatomy
 * (model.ts) in the same order: visual, area, name, one line, signature amenities, then
 * whatever the context adds.
 *
 *   results    search results (section 02.2). The identity is kept compact so the decision,
 *              passed as children (availability, price, the way to rooms), stays in view.
 *
 * Phase 04 adds a `discovery` entry here for the six property discovery cards: the same
 * anatomy with a taller visual and larger type, and no booking decision. It is not built yet.
 */
const VARIANTS = {
  results: {
    // The picture leads. Its proportion changes with the column width so that, at each size,
    // the name and the price of the first row still fall within the first screen.
    frame: "aspect-[5/4] md:aspect-[8/9] xl:aspect-[6/5] rounded-(--bk-r-shell)",
    sizes: "(min-width: 80rem) 26rem, (min-width: 48rem) 45vw, 100vw",
    name: "text-(length:--vn-text-2xl) leading-[1.1] font-medium tracking-[-0.02em]",
  },
} as const;

export type PropertyCardVariant = keyof typeof VARIANTS;

export function PropertyCard({
  model,
  variant,
  status,
  priority = false,
  dimmed = false,
  children,
}: {
  model: PropertyCardModel;
  variant: PropertyCardVariant;
  /** Sits opposite the area, on the card's first line of text. In results: the availability status. */
  status?: React.ReactNode;
  /** True for cards expected in the first screen, whose pictures should not wait. */
  priority?: boolean;
  /** Quietens the picture when the card's information is not current. */
  dimmed?: boolean;
  /** The part that differs by context. In results: price and the way to rooms. */
  children?: React.ReactNode;
}) {
  const look = VARIANTS[variant];
  return (
    // `relative` lets the context stretch its one link over the whole card.
    <article className="relative flex h-full flex-col">
      <CardVisual image={model.visual} sizes={look.sizes} priority={priority} className={`${look.frame} transition-opacity duration-(--vn-duration-base) ${dimmed ? "opacity-60" : ""}`} />
      <div className="mt-5 flex items-baseline justify-between gap-4">
        <p className="min-w-0 truncate text-[0.6875rem] font-medium tracking-(--bk-label-tracking) text-ink-muted uppercase">
          {model.category ? `${model.category} · ${model.area}` : model.area}
        </p>
        {status}
      </div>
      <h2 className={`mt-2 text-balance ${look.name}`}>{model.name}</h2>
      {model.line ? <p className="mt-2 text-[0.9375rem] leading-snug text-pretty text-ink-muted">{model.line}</p> : null}
      {model.signatureAmenities.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-[0.8125rem] text-ink">
          {model.signatureAmenities.map((amenity, index) => (
            <li key={amenity} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true" className="size-[3px] rounded-full bg-ink-muted" /> : null}
              {amenity}
            </li>
          ))}
        </ul>
      ) : null}
      {children ? <div className="mt-auto pt-5">{children}</div> : null}
    </article>
  );
}

/**
 * The card's outline while its content is not known yet: the same frame and the same
 * rhythm of lines, so the page keeps its shape when the real card takes its place.
 */
export function PropertyCardSkeleton({ variant, children }: { variant: PropertyCardVariant; children?: React.ReactNode }) {
  const bar = "animate-pulse rounded-(--vn-radius-sm) bg-surface-muted motion-reduce:animate-none";
  return (
    <div aria-hidden="true" className="flex h-full flex-col">
      <div className={`${VARIANTS[variant].frame} animate-pulse bg-surface-muted motion-reduce:animate-none`} />
      <div className={`mt-5 h-3 w-28 ${bar}`} />
      <div className={`mt-3 h-7 w-48 ${bar}`} />
      <div className={`mt-3 h-4 w-56 max-w-full ${bar}`} />
      <div className={`mt-3 h-4 w-40 ${bar}`} />
      {children ? <div className="mt-auto pt-5">{children}</div> : null}
    </div>
  );
}
