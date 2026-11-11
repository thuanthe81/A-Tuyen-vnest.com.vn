"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * OPT-IN PRESENTATION FOR THE 02.1 BAR (owner-approved exception, 24/10/2026, VNest V3 Stage 1).
 *
 * The CEO asked for the search action to read "BOOK NOW" as text. Without this provider nothing
 * changes: every frozen surface (/dev/booking-search, /stays, /stays/[property]) renders exactly as
 * frozen. With it, the action shows `submitLabel` as visible text in every density, in place of the
 * icon. Only the wording and the button's width change: fields, dates, guests, validation, state
 * and where a search goes are untouched.
 */
export interface BookingPresentation {
  /** Visible label of the search action, in place of the icon and "Tìm kiếm". */
  submitLabel?: string;
  /** Language of that label when it is not the page's (e.g. "en" for "BOOK NOW"). */
  submitLang?: string;
  /**
   * Opt-in combined "Phòng & khách" field (owner decision, Option B, 4/11/2026). It replaces the guests field's label,
   * summary and panel in every density; the bar's fields, order and state are otherwise unchanged. Absent, the frozen
   * guests field renders exactly as before.
   */
  occupancy?: Occupancy;
}

export interface Occupancy {
  /** Field and section label, e.g. "Phòng & khách". */
  label: string;
  /** The complete reading, e.g. "3 khách · 2 phòng". */
  summary: string;
  /**
   * Shorter readings for the compact bars, longest first (Phase D refinement, 10/11/2026). Where `summary` does not fit,
   * the first of these that fits is shown; `summary` stays the accessible reading and the hover title. Absent, the
   * compact bars show `summary` as before.
   */
  compactSummaries?: readonly string[];
  /** The panel body: steppers and allocation, rendered inside the bar's own panel or sheet section. */
  panel: ReactNode;
  /** Clears what the panel holds outside the 02.1 form (e.g. children) when the guest clears the whole search. */
  reset?: () => void;
}

const BookingPresentationContext = createContext<BookingPresentation>({});

export function BookingPresentationProvider({ value, children }: { value: BookingPresentation; children: ReactNode }) {
  return <BookingPresentationContext value={value}>{children}</BookingPresentationContext>;
}

export function useBookingPresentation(): BookingPresentation {
  return useContext(BookingPresentationContext);
}
