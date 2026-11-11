import { resultsCopy } from "./copy";

/** Says, before anything else on the page, that what follows is simulated. Rendered only for sample data. */
export function SampleBanner() {
  return (
    <p className="bg-ink px-(--vn-gutter) py-2 text-center text-xs leading-snug text-surface-raised">
      <strong className="font-semibold tracking-[0.08em] uppercase">{resultsCopy.sampleBanner}</strong>
      <span className="max-sm:sr-only"> · {resultsCopy.sampleBannerDetail}</span>
      <span className="sm:hidden"> · {resultsCopy.sampleBannerShort}</span>
    </p>
  );
}
