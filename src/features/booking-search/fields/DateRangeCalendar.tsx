"use client";

import { useEffect, useRef, useState } from "react";
import type { IsoDate } from "@/domain/dates";
import { addDays, addMonths, dateParts, dayOfWeek, firstOfMonth, isBefore, lastOfMonth } from "@/domain/dates";
import type { CalendarMonth } from "../calendar";
import { buildMonths, clampDate, dayRole } from "../calendar";
import { useLocale } from "@/features/locale/LocaleProvider";
import { searchCopyFor } from "../copy";
import { WEEKDAY_HEADINGS_BY_LOCALE, WEEKDAY_NAMES_BY_LOCALE, formatDayLong, formatMonth } from "../format";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";
import type { DateField } from "../search-form";

/**
 * How far ahead the calendar lets a guest look. An interface bound, not a booking rule:
 * whether a date can be booked is the provider's answer.
 */
const MONTHS_AHEAD = 18;

const KEY_STEPS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, PageUp: -28, PageDown: 28 };

export function DateRangeCalendar({
  today,
  checkIn,
  checkOut,
  activeField,
  onPick,
  layout,
  months = 1,
}: {
  today: IsoDate;
  checkIn: IsoDate | undefined;
  checkOut: IsoDate | undefined;
  /** Which date the next pick sets. */
  activeField: DateField;
  onPick: (date: IsoDate) => void;
  /** "paged" shows `months` side by side with arrows; "scroll" lists every month for touch scrolling. */
  layout: "paged" | "scroll";
  months?: number;
}) {
  const locale = useLocale();
  const searchCopy = searchCopyFor(locale);
  const minMonth = firstOfMonth(today);
  const maxMonth = addMonths(minMonth, MONTHS_AHEAD - 1);
  const maxDate = lastOfMonth(maxMonth);
  const lastAnchor = addMonths(maxMonth, -(months - 1));
  const clampAnchor = (month: IsoDate) => (isBefore(month, minMonth) ? minMonth : isBefore(lastAnchor, month) ? lastAnchor : month);

  const startDate = clampDate((activeField === "checkOut" ? checkOut : undefined) ?? checkIn ?? today, today, maxDate);
  const [anchor, setAnchor] = useState(() => clampAnchor(firstOfMonth(startDate)));
  const [focusDate, setFocusDate] = useState(startDate);
  const [hover, setHover] = useState<IsoDate>();
  const containerRef = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);

  const visible = layout === "scroll" ? buildMonths(minMonth, MONTHS_AHEAD) : buildMonths(clampAnchor(anchor), months);
  const firstVisible = visible[0]?.first ?? minMonth;
  const lastVisible = visible[visible.length - 1]?.first ?? minMonth;
  const focusVisible = !isBefore(focusDate, firstVisible) && !isBefore(lastOfMonth(lastVisible), focusDate);
  // Exactly one day is in the tab order: the focused day, or the first selectable day on show.
  const tabbable = focusVisible ? focusDate : isBefore(firstVisible, today) ? today : firstVisible;

  // While choosing check-out, the days up to the pointer preview the stay being formed.
  const previewEnd = checkOut ?? (activeField === "checkOut" && checkIn && hover && isBefore(checkIn, hover) ? hover : undefined);

  const dayButton = (date: IsoDate) => containerRef.current?.querySelector<HTMLButtonElement>(`[data-date="${date}"]`);

  useEffect(() => {
    // On opening: put keyboard focus on the starting day, and bring its month into view on touch layouts.
    const button = dayButton(startDate);
    if (layout === "scroll") button?.closest("[data-month]")?.scrollIntoView({ block: "start" });
    else button?.focus({ preventScroll: true });
    // Runs once per opening; the calendar is unmounted when it closes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    dayButton(focusDate)?.focus();
  }, [focusDate, anchor]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step =
      KEY_STEPS[event.key] ?? (event.key === "Home" ? -dayOfWeek(focusDate) : event.key === "End" ? 6 - dayOfWeek(focusDate) : undefined);
    if (step === undefined) return;
    event.preventDefault();
    const target = clampDate(addDays(tabbable, step), today, maxDate);
    const month = firstOfMonth(target);
    if (layout === "paged") {
      if (isBefore(month, firstVisible)) setAnchor(month);
      else if (isBefore(lastVisible, month)) setAnchor(clampAnchor(addMonths(month, -(months - 1))));
    }
    moveFocus.current = true;
    setFocusDate(target);
  };

  const renderMonth = (month: CalendarMonth, index: number) => {
    const titleId = `month-${month.first}`;
    return (
      <div key={month.first} data-month={month.first} className="w-[19.25rem] max-w-full shrink-0">
        <div className="relative flex h-11 items-center justify-center">
          {layout === "paged" && index === 0 ? (
            <button
              type="button"
              aria-label={searchCopy.previousMonth}
              disabled={!isBefore(minMonth, firstVisible)}
              onClick={() => setAnchor(clampAnchor(addMonths(firstVisible, -1)))}
              className="absolute left-0 flex size-11 items-center justify-center rounded-(--bk-r-control) text-ink transition-colors duration-(--vn-duration-fast) hover:bg-capsule-field disabled:text-ink-muted/40 disabled:hover:bg-transparent"
            >
              <ChevronLeftIcon />
            </button>
          ) : null}
          <h3 id={titleId} className="text-[0.9375rem] font-semibold text-ink">
            {formatMonth(month.year, month.month, locale)}
          </h3>
          {layout === "paged" && index === visible.length - 1 ? (
            <button
              type="button"
              aria-label={searchCopy.nextMonth}
              disabled={!isBefore(firstVisible, lastAnchor)}
              onClick={() => setAnchor(clampAnchor(addMonths(firstVisible, 1)))}
              className="absolute right-0 flex size-11 items-center justify-center rounded-(--bk-r-control) text-ink transition-colors duration-(--vn-duration-fast) hover:bg-capsule-field disabled:text-ink-muted/40 disabled:hover:bg-transparent"
            >
              <ChevronRightIcon />
            </button>
          ) : null}
        </div>
        <table role="grid" aria-labelledby={titleId} className="w-full border-collapse">
          <thead>
            <tr>
              {WEEKDAY_HEADINGS_BY_LOCALE[locale].map((heading, weekday) => (
                <th key={heading} scope="col" abbr={WEEKDAY_NAMES_BY_LOCALE[locale][weekday]} className="h-9 w-11 text-xs font-medium text-ink-muted">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {month.weeks.map((week, weekIndex) => (
              <tr key={weekIndex}>
                {week.map((day, dayIndex) => {
                  if (!day) return <td key={dayIndex} aria-hidden="true" className="size-11 p-0" />;
                  const role = dayRole(day, checkIn, previewEnd);
                  const selected = role === "start" || role === "end" || role === "single";
                  const committed = role === "single" || role === "start" || checkOut !== undefined;
                  const disabled = isBefore(day, today);
                  const label = [
                    formatDayLong(day, locale),
                    day === today ? searchCopy.today : undefined,
                    day === checkIn ? searchCopy.selectedCheckIn : undefined,
                    day === checkOut ? searchCopy.selectedCheckOut : undefined,
                    role === "between" && checkOut ? searchCopy.inStay : undefined,
                    disabled ? searchCopy.unavailableDay : undefined,
                  ]
                    .filter(Boolean)
                    .join(", ");
                  // The band behind the days joins the two ends into one shape: a stay, not two dots.
                  const band =
                    role === "between"
                      ? "bg-capsule-field"
                      : role === "start"
                        ? "bg-linear-to-r from-transparent from-50% to-capsule-field to-50%"
                        : role === "end"
                          ? "bg-linear-to-l from-transparent from-50% to-capsule-field to-50%"
                          : "";
                  return (
                    <td key={dayIndex} role="gridcell" aria-selected={selected} className={`size-11 p-0 ${band}`}>
                      <button
                        type="button"
                        data-date={day}
                        tabIndex={day === tabbable ? 0 : -1}
                        disabled={disabled}
                        aria-label={label}
                        aria-pressed={selected}
                        onClick={() => {
                          setFocusDate(day);
                          onPick(day);
                        }}
                        onPointerEnter={() => setHover(day)}
                        onFocus={() => setHover(day)}
                        className={[
                          "relative mx-auto flex size-11 items-center justify-center rounded-(--bk-r-day) text-sm tabular-nums transition-colors duration-(--vn-duration-fast)",
                          selected && committed ? "bg-ink font-semibold text-surface-raised" : "",
                          selected && !committed ? "bg-ink/70 font-semibold text-surface-raised" : "",
                          !selected && !disabled ? "text-ink hover:bg-capsule-field" : "",
                          role === "between" ? "hover:bg-surface-raised" : "",
                          disabled ? "text-ink-muted/40" : "",
                          day === today ? "after:absolute after:bottom-1.5 after:size-1 after:rounded-full after:bg-current" : "",
                        ].join(" ")}
                      >
                        {dateParts(day).day}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={onKeyDown}
      onPointerLeave={() => setHover(undefined)}
      className={layout === "paged" ? "flex gap-8" : "flex flex-col items-center gap-6"}
    >
      {visible.map(renderMonth)}
    </div>
  );
}
