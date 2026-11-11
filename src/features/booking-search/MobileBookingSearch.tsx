"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale } from "@/features/locale/LocaleProvider";
import { searchCopyFor } from "./copy";
import { DateFieldTabs } from "./fields/DateFieldTabs";
import { FitText } from "./fields/FitText";
import { DateRangeCalendar } from "./fields/DateRangeCalendar";
import { GuestStepper } from "./fields/GuestStepper";
import { PropertyPicker } from "./fields/PropertyPicker";
import { CloseIcon, SearchIcon, SpinnerIcon } from "./icons";
import type { DateField } from "./search-form";
import { useBookingPresentation } from "./presentation";
import { useStaySearch } from "./StaySearchProvider";
import { datesStatus, datesSummary, issueFor, staySummary } from "./summary";

type Section = "property" | "dates" | "guests";

/**
 * The booking search on a phone: a single pill that opens a full-screen panel.
 *
 * A row of four fields cannot be made comfortable at 390px, so the phone gets a different
 * interaction, not a squeezed copy: one decision on screen at a time, each collapsing to a
 * one-line summary once made, with Search always in reach of the thumb. The panel opens on
 * the dates, because those are required; the property stays above them as a single quiet
 * row that already reads "all properties", there to change but never in the way. State is the same shared state the desktop bars use.
 *
 * The panel is a native modal <dialog>: the browser traps focus, makes the page behind
 * inert, closes on Escape and returns focus to the pill.
 */
export function MobileBookingSearch({
  variant,
  className = "",
}: {
  /** "hero" is the floating pill over the hero; "compact" is the slimmer one in the sticky bar. */
  variant: "hero" | "compact";
  className?: string;
}) {
  const locale = useLocale();
  const searchCopy = searchCopyFor(locale);
  const search = useStaySearch();
  const { form } = search;
  // Opt-in worded action (exception approved 24/10/2026); absent, the frozen presentation is unchanged.
  const { submitLabel, submitLang, occupancy } = useBookingPresentation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [section, setSection] = useState<Section>("dates");
  const [dateField, setDateField] = useState<DateField>("checkIn");
  const hero = variant === "hero";
  const focusSection = useRef(false);

  // When a finished step collapses, the control that had focus is gone. Hand focus to the
  // step that opened, so keyboard and screen-reader users are never dropped out of the panel.
  useEffect(() => {
    if (!focusSection.current) return;
    focusSection.current = false;
    dialogRef.current?.querySelector<HTMLElement>(`[data-section="${section}"]`)?.focus();
  }, [section]);

  const syncScrollLock = () => {
    document.documentElement.style.overflow = document.querySelector("dialog[open]") ? "hidden" : "";
  };

  useEffect(() => {
    const node = dialogRef.current;
    return () => {
      if (node?.open) node.close();
      syncScrollLock();
    };
  }, []);

  // Coming back to the dates continues an unfinished stay; a finished one starts again from check-in.
  const showDates = () => {
    setSection("dates");
    setDateField(form.checkIn && !form.checkOut ? "checkOut" : "checkIn");
  };

  const openPanel = () => {
    search.ensureToday();
    showDates();
    setIsOpen(true);
    dialogRef.current?.showModal();
    // The dialog makes the page inert; this also stops it scrolling behind the panel.
    syncScrollLock();
  };

  const closePanel = () => {
    dialogRef.current?.close();
    syncScrollLock();
  };

  const onClose = () => {
    setIsOpen(false);
    search.dismissIssues();
    syncScrollLock();
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (search.pending) return;
    const check = search.submit();
    if (check.ok) {
      closePanel();
    } else if (check.field === "checkIn" || check.field === "checkOut") {
      focusSection.current = section !== "dates";
      setSection("dates");
      setDateField(check.field);
    } else {
      focusSection.current = section !== check.field;
      setSection(check.field);
    }
  };

  const dateIssue = issueFor(search.issues, ["checkIn", "checkOut"], locale);
  const guestIssue = issueFor(search.issues, ["guests"], locale);

  const card = (id: Section, label: string, summary: string, filled: boolean, body: React.ReactNode, grows = false) => {
    const expanded = section === id;
    return (
      <section className={`rounded-(--bk-r-panel) bg-surface-raised shadow-field ${expanded && grows ? "flex min-h-0 flex-1 flex-col" : "shrink-0"}`}>
        <h3>
          <button
            type="button"
            data-section={id}
            aria-expanded={expanded}
            onClick={() => (id === "dates" ? showDates() : setSection(id))}
            className="flex h-16 w-full items-center justify-between gap-4 rounded-(--bk-r-panel) px-5 text-left"
          >
            <span className={expanded ? "text-lg font-semibold text-ink" : "text-[0.9375rem] text-ink-muted"}>{label}</span>
            {expanded ? null : <span className={`truncate text-[0.9375rem] ${filled ? "font-medium text-ink" : "text-ink-muted"}`}>{summary}</span>}
          </button>
        </h3>
        {expanded ? body : null}
      </section>
    );
  };

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={openPanel}
        className={`w-full items-center rounded-(--bk-r-shell) bg-capsule text-left text-ink transition-[scale] duration-(--vn-duration-fast) active:scale-[0.985] ${
          hero ? "gap-3 p-2 pl-6 shadow-(--bk-shadow)" : "gap-2 border border-line p-1 pl-4"
        } ${className}`}
      >
        <span className="min-w-0 flex-1">
          <span className="sr-only">{searchCopy.formLabel}: </span>
          {/* The pill reads as the search itself: where on the first line, when and who on the second.
              The compact pill keeps both lines, smaller, so a property name never pushes the dates out of view. */}
          <span className={`block truncate ${hero ? "text-[0.9375rem] font-semibold" : "text-xs leading-tight text-ink-muted"}`}>
            {search.property?.name ?? searchCopy.allProperties}
          </span>
          {occupancy && hero ? (
            // Opt-in combined field on the hero pill: the dates and the occupancy may take two lines (never more), each
            // part kept whole, so "3 khách · 2 phòng" is never cut. The compact sticky pill has room for one line only
            // (about 140px at 375px): it keeps the frozen single truncating line, with the occupancy appended.
            <span className="line-clamp-2 text-sm text-ink-muted">
              <span className="whitespace-nowrap">{datesSummary(form, locale)}</span>
              {" · "}
              <span className="whitespace-nowrap">{occupancy.summary}</span>
            </span>
          ) : occupancy ? (
            <FitText
              className="text-[0.8125rem] leading-tight font-medium text-ink"
              options={[occupancy.summary, ...(occupancy.compactSummaries ?? [])].map((s) => `${datesSummary(form, locale)} · ${s}`)}
            />
          ) : (
            <span className={`block truncate ${hero ? "text-sm text-ink-muted" : "text-[0.8125rem] leading-tight font-medium text-ink"}`}>
              {staySummary(form, locale)}
            </span>
          )}
        </span>
        {submitLabel ? (
          // Visible words are part of the pill's name (label in name); the pill still opens the panel.
          <span lang={submitLang} className={`flex shrink-0 items-center justify-center rounded-(--bk-r-field) bg-(--bk-cta) font-semibold tracking-[0.06em] whitespace-nowrap text-(--bk-on-cta) ${hero ? "h-12 px-4 text-sm" : "h-10 px-3 text-xs"}`}>
            {submitLabel}
          </span>
        ) : (
          <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-(--bk-r-field) bg-(--bk-cta) text-(--bk-on-cta) ${hero ? "size-12" : "size-10"}`}>
            <SearchIcon />
          </span>
        )}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={onClose}
        onClick={(event) => {
          if (event.target === dialogRef.current) closePanel();
        }}
        className="vn-sheet fixed inset-0 m-0 hidden h-dvh max-h-none w-full max-w-none flex-col bg-surface p-0 text-ink open:flex"
      >
        {isOpen ? (
          <form role="search" aria-labelledby={titleId} noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <header className="flex h-14 shrink-0 items-center justify-between px-2">
              <button
                type="button"
                aria-label={searchCopy.close}
                onClick={closePanel}
                className="flex size-11 items-center justify-center rounded-(--bk-r-control) text-ink"
              >
                <CloseIcon />
              </button>
              <h2 id={titleId} className="text-base font-semibold">
                {searchCopy.formLabel}
              </h2>
              <button
                type="button"
                onClick={() => {
                  search.clearAll();
                  occupancy?.reset?.();
                }}
                className="h-11 rounded-(--bk-r-control) px-3 text-sm font-medium text-ink underline underline-offset-4">
                {searchCopy.clearAll}
              </button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 pt-1 pb-4">
              {card(
                "property",
                searchCopy.property,
                search.property?.name ?? searchCopy.allProperties,
                true,
                <div className="px-2 pb-3">
                  <PropertyPicker
                    properties={search.properties}
                    value={form.propertyId}
                    onChange={search.setProperty}
                    onDone={() => {
                      focusSection.current = true;
                      showDates();
                    }}
                  />
                </div>,
              )}

              {card(
                "dates",
                searchCopy.dates,
                datesSummary(form, locale),
                Boolean(form.checkIn),
                <>
                  <div className="shrink-0 px-3">
                    <DateFieldTabs checkIn={form.checkIn} checkOut={form.checkOut} active={dateField} onSelect={setDateField} />
                    <p aria-live="polite" className={`px-2 pt-3 pb-2 text-sm ${dateIssue ? "font-medium text-critical" : "text-ink-muted"}`}>
                      {dateIssue ?? datesStatus(form, dateField, locale)}
                    </p>
                  </div>
                  {search.today ? (
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-line px-3 pt-2 pb-4">
                      <DateRangeCalendar
                        today={search.today}
                        checkIn={form.checkIn}
                        checkOut={form.checkOut}
                        activeField={dateField}
                        layout="paged"
                        months={1}
                        onPick={(date) => {
                          const next = search.pickDate(dateField, date);
                          if (next === "done") {
                            focusSection.current = true;
                            setSection("guests");
                          }
                          else setDateField(next);
                        }}
                      />
                    </div>
                  ) : null}
                </>,
                true,
              )}

              {card(
                "guests",
                occupancy?.label ?? searchCopy.guests,
                occupancy?.summary ?? searchCopy.guestCount(form.adults),
                true,
                <div className="px-5 pb-5">
                  {occupancy ? occupancy.panel : <GuestStepper adults={form.adults} max={search.maxAdults} onChange={search.setAdults} />}
                  {guestIssue ? (
                    <p role="alert" className="mt-3 text-sm font-medium text-critical">
                      {guestIssue}
                    </p>
                  ) : null}
                </div>,
              )}
            </div>

            <footer className="shrink-0 border-t border-line bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="submit"
                aria-disabled={search.pending}
                aria-busy={search.pending}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-(--bk-r-field) bg-(--bk-cta) text-base font-semibold text-(--bk-on-cta) transition-[background-color,scale] duration-(--vn-duration-fast) active:scale-[0.985] aria-disabled:bg-(--bk-cta)/80"
              >
                {submitLabel ? (
                  <>
                    {search.pending ? <SpinnerIcon /> : null}
                    <span lang={submitLang} className="tracking-[0.06em]">{submitLabel}</span>
                  </>
                ) : (
                  <>
                    {search.pending ? <SpinnerIcon /> : <SearchIcon />}
                    {search.pending ? searchCopy.searching : searchCopy.search}
                  </>
                )}
              </button>
            </footer>
          </form>
        ) : null}
      </dialog>
    </>
  );
}
