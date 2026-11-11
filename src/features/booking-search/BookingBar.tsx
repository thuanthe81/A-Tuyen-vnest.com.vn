"use client";

import { useEffect, useRef, useState } from "react";
import type { IsoDate } from "@/domain/dates";
import { useLocale } from "@/features/locale/LocaleProvider";
import { searchCopyFor } from "./copy";
import { DateFieldTabs } from "./fields/DateFieldTabs";
import { FitText } from "./fields/FitText";
import { DateRangeCalendar } from "./fields/DateRangeCalendar";
import { GuestStepper } from "./fields/GuestStepper";
import { PropertyPicker } from "./fields/PropertyPicker";
import { formatDay, formatDayWithWeekday } from "./format";
import { SearchIcon, SpinnerIcon } from "./icons";
import type { SearchField } from "./search-form";
import { useBookingPresentation } from "./presentation";
import { useStaySearch } from "./StaySearchProvider";
import { datesStatus, datesSummary, issueFor } from "./summary";

/** Roughly how tall each panel is, to decide whether it fits below the bar or must open above it. */
const PANEL_HEIGHT: Record<SearchField, number> = { property: 420, checkIn: 470, checkOut: 470, guests: 190 };
/** A list that must scroll still shows at least three rows. */
const MIN_PANEL_HEIGHT = 208;

/**
 * The booking search as a floating bar, in two densities of one design:
 *
 *   full     the floating bar over the hero: labelled fields, a worded Search button
 *   compact  the sticky bar: the same fields as one-line values, an icon Search button
 *
 * Both read the same state from <StaySearchProvider>; this component only presents it.
 * Fields, in order: property (optional), check-in, check-out, guests, Search.
 * For tablet and desktop. Phones use <MobileBookingSearch>.
 */
export function BookingBar({
  variant,
  hidden = false,
  className = "",
}: {
  variant: "full" | "compact";
  /** True while this bar is not the one on show, so it closes whatever it had open. */
  hidden?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const searchCopy = searchCopyFor(locale);
  const search = useStaySearch();
  const { form, dismissIssues } = search;
  // Opt-in worded action (exception approved 24/10/2026); absent, the frozen presentation is unchanged.
  const { submitLabel, submitLang, occupancy } = useBookingPresentation();
  const [active, setActive] = useState<SearchField | null>(null);
  const [placement, setPlacement] = useState<"below" | "above">("below");
  // How tall a panel may be before it would leave the viewport. Only the property list needs it: its length follows the number of properties.
  const [panelRoom, setPanelRoom] = useState<number>();
  const rootRef = useRef<HTMLFormElement>(null);
  const full = variant === "full";

  if (hidden && active !== null) setActive(null);
  const open = hidden ? null : active;
  const openDate = open === "checkIn" || open === "checkOut" ? open : null;

  const focusTrigger = (field: SearchField) => rootRef.current?.querySelector<HTMLElement>(`[data-field~="${field}"]`)?.focus();

  const openField = (field: SearchField) => {
    if (field === "checkIn" || field === "checkOut") search.ensureToday();
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      // The bar sits low on the hero, so a calendar often has no room beneath it.
      const below = window.innerHeight - rect.bottom;
      // The opt-in guest panel is taller than the guests stepper: up to three steppers and two notes.
      const needed = field === "guests" && occupancy ? 380 : PANEL_HEIGHT[field];
      const above = below < needed && rect.top > below;
      setPlacement(above ? "above" : "below");
      // The panel sits 16px from the bar; keep another 16px clear of the viewport edge.
      setPanelRoom(Math.max((above ? rect.top : below) - 32, MIN_PANEL_HEIGHT));
    }
    setActive(field);
  };

  const close = (returnFocusTo?: SearchField) => {
    setActive(null);
    search.dismissIssues();
    if (returnFocusTo) focusTrigger(returnFocusTo);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setActive(null);
      dismissIssues();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, dismissIssues]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (search.pending) return;
    const check = search.submit();
    if (check.ok) setActive(null);
    else openField(check.field);
  };

  const panel = `absolute z-50 rounded-(--bk-r-panel) bg-surface-raised p-5 shadow-pop transition-[opacity,translate] duration-(--vn-duration-fast) starting:opacity-0 ${
    placement === "above" ? "bottom-[calc(100%+1rem)] starting:translate-y-1" : "top-[calc(100%+1rem)] starting:-translate-y-1"
  }`;

  const fieldButton = (field: SearchField, label: string, value: React.ReactNode, filled: boolean, extra = "") => (
    <button
      type="button"
      data-field={!full && field === "checkIn" ? "checkIn checkOut" : field}
      aria-haspopup="dialog"
      aria-expanded={full ? open === field : field === "checkIn" ? openDate !== null : open === field}
      onClick={() => {
        const isOpen = full ? open === field : field === "checkIn" ? openDate !== null : open === field;
        if (isOpen) close();
        else openField(field);
      }}
      className={`flex w-full min-w-0 rounded-(--bk-r-field) text-left transition-[background-color,box-shadow] duration-(--vn-duration-fast) hover:bg-capsule-field aria-expanded:bg-surface-raised aria-expanded:shadow-field ${
        full
          ? occupancy
            ? "h-(--bk-field-h) flex-col justify-center px-3 lg:px-5"
            : "h-(--bk-field-h) flex-col justify-center px-4 lg:px-5"
          : occupancy
            ? "h-10 items-center px-3 lg:px-4"
            : "h-10 items-center px-4"
      } ${extra}`}
    >
      <span className={full ? "text-[0.6875rem] font-medium tracking-(--bk-label-tracking) text-ink-muted uppercase" : "sr-only"}>{label}</span>
      <span className={`truncate ${full ? "text-(length:--bk-value-size)" : "text-sm"} ${filled ? "font-medium text-ink" : "text-ink-muted"}`}>{value}</span>
    </button>
  );

  // The weekday is a help, not a need: it is shown where there is room and dropped on narrower bars before anything truncates.
  const dateValue = (date: IsoDate | undefined) =>
    date ? (
      <>
        <span className="lg:hidden">{formatDay(date, locale)}</span>
        <span className="hidden lg:inline">{formatDayWithWeekday(date, locale)}</span>
      </>
    ) : (
      searchCopy.chooseDate
    );

  const divider = <span aria-hidden="true" className={`my-auto w-px shrink-0 bg-line ${full ? "h-(--bk-divider-h)" : "h-5"}`} />;
  const dateIssue = issueFor(search.issues, ["checkIn", "checkOut"], locale);

  return (
    <form
      ref={rootRef}
      role="search"
      aria-label={searchCopy.formLabel}
      noValidate
      onSubmit={onSubmit}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !open) return;
        event.stopPropagation();
        close(open);
      }}
      className={`relative items-stretch rounded-(--bk-r-shell) bg-capsule text-ink ${
        full ? "w-full max-w-[60rem] gap-1 p-(--bk-shell-pad) shadow-(--bk-shadow)" : "w-full max-w-[40rem] gap-0.5 border border-line p-1"
      } ${className}`}
    >
      {/* Property comes first because it frames the rest, and it is optional: it always shows a complete answer. */}
      {/* With the opt-in guest field the widths are rebalanced so its summary reads in full ("3 khách · 2 phòng", or on the
          homepage "3 người lớn · 1 trẻ em", which at tablet width needs a little from the other fields and the action);
          without it, the frozen proportions. */}
      <div className={`relative flex min-w-0 ${full ? (occupancy ? "flex-[1.36] lg:flex-[1.3]" : "flex-[1.5] lg:flex-[1.4]") : occupancy ? "flex-[1]" : "flex-[1.2]"}`}>
        {fieldButton("property", searchCopy.property, search.property?.name ?? searchCopy.allProperties, true)}
        {open === "property" ? (
          // With many properties the list scrolls inside the panel instead of running past the viewport.
          <div role="dialog" aria-label={searchCopy.property} style={{ maxHeight: panelRoom }} className={`${panel} left-0 w-[22rem] overflow-y-auto overscroll-contain p-3`}>
            <PropertyPicker
              properties={search.properties}
              value={form.propertyId}
              onChange={search.setProperty}
              onDone={() => close("checkIn")}
            />
          </div>
        ) : null}
      </div>

      {divider}

      {/* Dates: check-in and check-out sit in one group because they are one decision, the stay. */}
      <div className={`relative flex min-w-0 ${full ? (occupancy ? "flex-[2.07] lg:flex-[2.1]" : "flex-[2.4] lg:flex-[2.2]") : occupancy ? "flex-[1.17]" : "flex-[1.5]"}`}>
        {full ? (
          <>
            {fieldButton("checkIn", searchCopy.checkIn, dateValue(form.checkIn), Boolean(form.checkIn))}
            {divider}
            {fieldButton("checkOut", searchCopy.checkOut, dateValue(form.checkOut), Boolean(form.checkOut))}
          </>
        ) : (
          fieldButton("checkIn", searchCopy.dates, datesSummary(form, locale), Boolean(form.checkIn))
        )}
        {openDate && search.today ? (
          <div role="dialog" aria-label={searchCopy.dates} className={`${panel} left-0`}>
            {full ? null : (
              <div className="mb-3">
                <DateFieldTabs checkIn={form.checkIn} checkOut={form.checkOut} active={openDate} onSelect={setActive} />
              </div>
            )}
            <DateRangeCalendar
              today={search.today}
              checkIn={form.checkIn}
              checkOut={form.checkOut}
              activeField={openDate}
              layout="paged"
              months={1}
              onPick={(date) => {
                const next = search.pickDate(openDate, date);
                // A complete stay closes the calendar and hands focus to the next decision.
                if (next === "done") close("guests");
                else setActive(next);
              }}
            />
            <div className="mt-3 flex min-h-11 items-center justify-between gap-4 border-t border-line pt-3">
              <p aria-live="polite" className={`text-sm ${dateIssue ? "font-medium text-critical" : "text-ink-muted"}`}>
                {dateIssue ?? datesStatus(form, openDate, locale)}
              </p>
              <button
                type="button"
                disabled={!form.checkIn}
                onClick={() => {
                  search.clearDates();
                  setActive("checkIn");
                }}
                className="h-11 shrink-0 rounded-(--bk-r-control) px-4 text-sm font-medium text-ink underline underline-offset-4 transition-colors duration-(--vn-duration-fast) hover:bg-capsule-field disabled:text-ink-muted/50 disabled:no-underline disabled:hover:bg-transparent"
              >
                {searchCopy.clearDates}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {divider}

      <div className={`relative flex min-w-0 ${full ? (occupancy ? "flex-[1.57] lg:flex-[1.35]" : "flex-[1.05] lg:flex-1") : occupancy ? "flex-[1.07]" : "flex-[0.8]"}`}>
        {fieldButton(
          "guests",
          occupancy?.label ?? searchCopy.guests,
          // Compact bar: the longest reading that fits, never a cut word (the full one stays for screen readers).
          !full && occupancy?.compactSummaries ? <FitText options={[occupancy.summary, ...occupancy.compactSummaries]} /> : (occupancy?.summary ?? searchCopy.guestCount(form.adults)),
          true,
        )}
        {open === "guests" ? (
          <div role="dialog" aria-label={occupancy?.label ?? searchCopy.guests} className={`${panel} ${occupancy ? "right-0 w-[21rem] max-w-[calc(100vw-2rem)]" : "left-0 w-[19rem]"}`}>
            {occupancy ? occupancy.panel : <GuestStepper adults={form.adults} max={search.maxAdults} onChange={search.setAdults} />}
            {issueFor(search.issues, ["guests"], locale) ? (
              <p role="alert" className="mt-3 text-sm font-medium text-critical">
                {issueFor(search.issues, ["guests"], locale)}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end border-t border-line pt-3">
              <button
                type="button"
                onClick={() => close("guests")}
                className="h-11 rounded-(--bk-r-control) px-5 text-sm font-semibold text-ink transition-colors duration-(--vn-duration-fast) hover:bg-capsule-field"
              >
                {searchCopy.done}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* The one coloured shape in the bar: the eye lands on it last, after the fields it follows. */}
      <button
        type="submit"
        aria-disabled={search.pending}
        aria-busy={search.pending}
        className={`flex shrink-0 items-center justify-center gap-2 rounded-(--bk-r-field) bg-(--bk-cta) font-semibold text-(--bk-on-cta) transition-[background-color,scale] duration-(--vn-duration-fast) hover:bg-(--bk-cta-hover) active:scale-[0.97] aria-disabled:cursor-progress aria-disabled:bg-(--bk-cta)/80 ${
          full ? `h-(--bk-field-h) ${occupancy ? "px-4" : "px-5"} text-[0.9375rem] lg:min-w-[8.75rem] lg:px-7` : submitLabel ? "h-10 px-4 text-[0.8125rem]" : "size-10"
        } ${submitLabel ? "tracking-[0.06em] whitespace-nowrap" : ""}`}
      >
        {submitLabel ? (
          <>
            {search.pending ? <SpinnerIcon /> : null}
            <span lang={submitLang}>{submitLabel}</span>
          </>
        ) : (
          <>
            {search.pending ? <SpinnerIcon /> : <SearchIcon />}
            <span className={full ? "" : "sr-only"}>{search.pending ? searchCopy.searching : searchCopy.search}</span>
          </>
        )}
      </button>
    </form>
  );
}
