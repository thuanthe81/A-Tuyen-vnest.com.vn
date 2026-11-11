"use client";

import type { IsoDate } from "@/domain/dates";
import { useLocale } from "@/features/locale/LocaleProvider";
import { searchCopyFor } from "../copy";
import { formatDayWithWeekday } from "../format";
import type { DateField } from "../search-form";

/** Shows both dates and which one the next pick will set. Used where the two dates share one control. */
export function DateFieldTabs({
  checkIn,
  checkOut,
  active,
  onSelect,
}: {
  checkIn: IsoDate | undefined;
  checkOut: IsoDate | undefined;
  active: DateField;
  onSelect: (field: DateField) => void;
}) {
  const locale = useLocale();
  const searchCopy = searchCopyFor(locale);
  const tab = (field: DateField, label: string, value: IsoDate | undefined) => (
    <button
      type="button"
      aria-pressed={active === field}
      onClick={() => onSelect(field)}
      className="flex h-14 min-w-0 flex-1 flex-col justify-center rounded-(--bk-r-field) px-5 text-left transition-colors duration-(--vn-duration-fast) aria-pressed:bg-surface-raised aria-pressed:shadow-field"
    >
      <span className="text-[0.6875rem] font-medium tracking-(--bk-label-tracking) text-ink-muted uppercase">{label}</span>
      <span className={`truncate text-[0.9375rem] ${value ? "font-medium text-ink" : "text-ink-muted"}`}>
        {value ? formatDayWithWeekday(value, locale) : searchCopy.chooseDate}
      </span>
    </button>
  );
  return (
    <div className="flex gap-1 rounded-(--bk-r-tabs) bg-capsule-field p-1">
      {tab("checkIn", searchCopy.checkIn, checkIn)}
      {tab("checkOut", searchCopy.checkOut, checkOut)}
    </div>
  );
}
