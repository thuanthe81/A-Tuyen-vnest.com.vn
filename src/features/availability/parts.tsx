import { resultsCopy } from "./copy";
import type { DatedPrice } from "./derive";
import { averagePerNight } from "./derive";
import { formatMoney } from "./format";

/** Marks anything that came from mock data. Shown beside every simulated price and availability claim. */
export function SimulatedTag() {
  return (
    <span className="inline-flex items-center rounded-(--vn-radius-sm) border border-caution/50 px-1.5 py-px align-middle text-[0.6875rem] leading-4 font-medium tracking-[0.04em] text-caution uppercase">
      {resultsCopy.simulated}
    </span>
  );
}

const TAX_LABEL = { included: resultsCopy.taxIncluded, excluded: resultsCopy.taxExcluded, unknown: resultsCopy.taxUnknown } as const;

/**
 * The one place a price is printed, so its labels cannot be forgotten anywhere: the total
 * for the stay first, what it covers, and whether taxes and fees are in it. It accepts only
 * a verified total; a missing price has its own component and is never drawn as a figure.
 *
 * Built from spans, so it can sit inside a label or a link.
 */
export function PriceLine({
  price,
  simulated,
  prefix,
  caption,
  showAverage = false,
  stale = false,
  align = "start",
}: {
  price: DatedPrice;
  simulated: boolean;
  /** "từ" on a property card, where the figure is the lowest of several. */
  prefix?: string;
  /** What the price buys, e.g. the number of nights and the room. */
  caption?: string;
  showAverage?: boolean;
  /** Prices that may have changed are quietened, not hidden. */
  stale?: boolean;
  align?: "start" | "end";
}) {
  const side = align === "end" ? "sm:items-end sm:text-right" : "";
  const average = showAverage ? averagePerNight(price) : undefined;
  return (
    <span className={`flex flex-col ${side} ${stale ? "text-ink-muted" : "text-ink"}`}>
      <span className="flex items-baseline gap-x-1.5">
        {prefix ? <span className="text-sm text-ink-muted">{prefix}</span> : null}
        <span className="text-(length:--vn-text-xl) leading-tight font-semibold tracking-[-0.01em] whitespace-nowrap tabular-nums">{formatMoney(price.total)}</span>
      </span>
      <span className="mt-1 text-sm text-ink-muted">{caption ?? resultsCopy.totalFor(price.nights)}</span>
      <span className="text-xs leading-5 text-ink-muted">{TAX_LABEL[price.taxesAndFees]}</span>
      {average !== undefined ? <span className="text-xs leading-5 text-ink-muted">{resultsCopy.averagePerNight(formatMoney({ amount: average, currency: price.total.currency }))}</span> : null}
      {simulated ? (
        <span className="mt-1.5">
          <SimulatedTag />
        </span>
      ) : null}
    </span>
  );
}

/** Said in place of a price the provider did not verify. No figure, and no promise that one will follow. */
export function PriceUnavailable({ simulated, detail = true }: { simulated: boolean; detail?: boolean }) {
  return (
    <span className="flex flex-col">
      <span className="text-(length:--vn-text-lg) leading-tight font-semibold text-ink">{resultsCopy.priceUnavailable}</span>
      {detail ? <span className="mt-1 max-w-[18rem] text-sm leading-snug text-ink-muted">{resultsCopy.priceUnavailableDetail}</span> : null}
      {simulated ? (
        <span className="mt-1.5">
          <SimulatedTag />
        </span>
      ) : null}
    </span>
  );
}

export type StatusTone = "available" | "sold-out" | "unknown" | "error" | "stale" | "checking";

/** Each status has its own mark and its own words, so none is told apart by colour alone. */
const MARK: Record<StatusTone, { mark: string; text: string }> = {
  available: { mark: "rounded-full bg-positive", text: "text-positive" },
  "sold-out": { mark: "rounded-full border-[1.5px] border-ink-muted", text: "text-ink-muted" },
  unknown: { mark: "rounded-full border-[1.5px] border-dashed border-ink-muted", text: "text-ink-muted" },
  error: { mark: "rounded-[1px] bg-critical", text: "text-critical" },
  stale: { mark: "rotate-45 rounded-[1px] bg-caution", text: "text-caution" },
  checking: { mark: "rounded-full bg-line", text: "text-ink-muted" },
};

export function StatusLabel({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  return (
    <p className={`flex shrink-0 items-center gap-1.5 text-xs font-medium whitespace-nowrap ${MARK[tone].text}`}>
      <span aria-hidden="true" className={`size-2 ${MARK[tone].mark}`} />
      {children}
    </p>
  );
}

const icon = { width: 20, height: 20, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const ArrowRightIcon = () => (
  <svg {...icon}>
    <path d="M4 10h12m-4.5-4.5L16 10l-4.5 4.5" />
  </svg>
);

export const ArrowLeftIcon = () => (
  <svg {...icon}>
    <path d="M16 10H4m4.5-4.5L4 10l4.5 4.5" />
  </svg>
);

/** A block the size of what will replace it, so nothing moves when the answer arrives. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded-(--vn-radius-sm) bg-surface-muted motion-reduce:animate-none ${className}`} />;
}

export const buttonQuiet =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-(--bk-r-field) border border-ink px-4 text-sm font-semibold text-ink transition-colors duration-(--vn-duration-fast) hover:bg-ink hover:text-surface-raised";

export const buttonText =
  "inline-flex h-11 items-center rounded-(--bk-r-control) text-sm font-medium text-ink underline underline-offset-4 transition-colors duration-(--vn-duration-fast) hover:text-ink-muted";

/** A message in place of results: what happened, and the one thing to do about it. */
export function Notice({ tone = "neutral", title, children, action }: { tone?: "neutral" | "caution" | "critical"; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  const edge = tone === "critical" ? "border-critical/40" : tone === "caution" ? "border-caution/50" : "border-line";
  return (
    <div className={`flex flex-col gap-3 rounded-(--bk-r-shell) border bg-surface-raised p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5 ${edge}`}>
      <div className="min-w-0">
        <p className="font-semibold text-ink">{title}</p>
        {children ? <div className="mt-1 text-[0.9375rem] leading-snug text-pretty text-ink-muted">{children}</div> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}
