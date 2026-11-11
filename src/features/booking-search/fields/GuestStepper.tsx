"use client";

import { useId } from "react";
import { useLocale } from "@/features/locale/LocaleProvider";
import { searchCopyFor } from "../copy";
import { MinusIcon, PlusIcon } from "../icons";

const stepButton =
  "flex size-11 items-center justify-center rounded-(--bk-r-control) border border-line text-ink transition-colors duration-(--vn-duration-fast) hover:border-ink disabled:border-line disabled:text-ink-muted/40";

/**
 * A labelled − value + stepper. With only `adults`, `max` and `onChange` it is the frozen 02.1 guests stepper; the
 * optional wording and `min` let the same control count rooms in the opt-in combined field.
 */
export function GuestStepper({
  adults,
  max,
  onChange,
  min = 1,
  label,
  decreaseLabel,
  increaseLabel,
  valueLabel,
}: {
  adults: number;
  max: number;
  onChange: (adults: number) => void;
  min?: number;
  label?: string;
  decreaseLabel?: string;
  increaseLabel?: string;
  valueLabel?: (count: number) => string;
}) {
  const copy = searchCopyFor(useLocale());
  label ??= copy.adults;
  decreaseLabel ??= copy.decreaseGuests;
  increaseLabel ??= copy.increaseGuests;
  valueLabel ??= copy.guestCount;
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={labelId} className="flex items-center justify-between gap-6">
      <span id={labelId} className="text-[0.9375rem] font-medium text-ink">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button type="button" aria-label={decreaseLabel} disabled={adults <= min} onClick={() => onChange(adults - 1)} className={stepButton}>
          <MinusIcon />
        </button>
        <output aria-live="polite" aria-label={valueLabel(adults)} className="w-9 text-center text-base font-semibold tabular-nums text-ink">
          {adults}
        </output>
        <button type="button" aria-label={increaseLabel} disabled={adults >= max} onClick={() => onChange(adults + 1)} className={stepButton}>
          <PlusIcon />
        </button>
      </div>
    </div>
  );
}
