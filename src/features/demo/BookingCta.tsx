"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { HANDOFF_CTA_LABEL, usesNativeBooking, usesExternalHandoff } from "@/domain/hybrid-booking/booking-mode";
import { BookingPresentationProvider } from "@/features/booking-search/presentation";
import { checkSubmit, searchFromForm, type SearchField } from "@/features/booking-search/search-form";
import { useStaySearch, type StaySearch } from "@/features/booking-search/StaySearchProvider";
import { demoBookingResultsUrl, demoHomeSearchHref } from "./booking-flow";
import { allocateGuests } from "@/domain/hybrid-booking/room-occupancy";
import { clampChildren, parseChildren, partySummary } from "@/domain/hybrid-booking/guest-party";
import { createRoomSlot, roomAdultsFromQuery, setTotalAdults } from "./booking-results-state";
import { GUESTS_LABEL, OccupancyPanel, occupancySummary, OCCUPANCY_LABEL } from "./OccupancyPanel";
import { compactGuestSummaries } from "./occupancy-copy";
import styles from "./BookingCta.module.css";

/**
 * BOOK NOW in the CEO demo (VNest V3). One action, one name, everywhere:
 * the booking bar's own button, the photo viewers and the room drawer. Integration layer only:
 * 02.1's state, validation and fields are used as they are.
 *
 * - With a valid stay (dates chosen), it opens the Booking Results & Multi-Room Selection page
 *   (/dev/demo/tim-phong) with the property, dates, guests and, from a room, that room preference.
 * - Without one, it opens the booking bar's own date picker, so the guest finishes the stay first.
 */

/** Marks a container that holds a 02.1 bar, so the demo can find the bar a guest can see. */
export const BOOKING_SLOT = "data-booking-slot";
export const BOOKING_LABEL = "BOOK NOW";
export const BOOKING_LABEL_LANG = "en";

const LANG = { lang: BOOKING_LABEL_LANG } as const;

function onScreen(element: Element): boolean {
  if (element.closest("[inert]") || !element.getClientRects().length) return false;
  if (getComputedStyle(element).visibility === "hidden") return false;
  const rect = element.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < innerHeight;
}

/** The control that opens `field` in the booking bar on screen: a field (tablet, desktop) or the pill (phones). */
function findBookingControl(field: SearchField): HTMLElement | null {
  const slots = [...document.querySelectorAll<HTMLElement>(`[${BOOKING_SLOT}]`)];
  for (const slot of slots) {
    const target = slot.querySelector<HTMLElement>(`[data-field~="${field}"]`);
    if (target && onScreen(target)) return target;
    const pill = [...slot.querySelectorAll<HTMLElement>('button[aria-haspopup="dialog"]')].find((b) => !b.hasAttribute("data-field") && onScreen(b));
    if (pill) return pill;
  }
  return null;
}

/** Opens the booking bar's own picker for `field`, bringing the homepage bar into view first if needed. */
export function openBookingField(field: SearchField = "checkIn") {
  const control = findBookingControl(field);
  if (control) {
    requestAnimationFrame(() => control.click());
    return;
  }
  const anchor = document.getElementById("dat-phong");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (anchor) anchor.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  else window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  // Smooth scrolling has no completion event everywhere; wait for the bar to come on screen.
  let tries = 0;
  const wait = () => {
    const found = findBookingControl(field);
    if (found) found.click();
    else if (++tries < 40) setTimeout(wait, 50);
  };
  setTimeout(wait, reduce ? 0 : 120);
}

export const PROPERTY_BOOK_NOW_EVENT = "vnest:property-book-now";

export type PropertyBookNowDetail = {
  stay: ReturnType<typeof searchFromForm>;
  room?: string;
  /** Adults per room from the combined "Phòng & khách" field. */
  roomAdults?: readonly number[];
};

/**
 * THE ROOMS OF THE SEARCH (combined "Phòng & khách" field, Option B, 4/11/2026). The 02.1 form holds the guest total;
 * this holds the room count and how those guests are split over the rooms (internal, 1–2 per room), with the same rules
 * as the results page. Rooms and guests are each the guest's own choice (owner correction, 5/11/2026): neither is
 * changed to fit the other, so a total from an outdated address that does not fit is kept and shown for correction.
 * It travels as `rooms=2,1` and `adults=3` in the address.
 */
export type DemoRooms = {
  /**
   * Whether the bar shows the room stepper. The homepage hides it (owner brief, Phase D, 9/11/2026): rooms are then
   * chosen at room selection, starting from the fewest that fit the adults. Property pages keep it (frozen 4/11 field).
   */
  roomField: RoomField;
  roomAdults: readonly number[];
  /** The guest total (the 02.1 form's), which may not fit `roomAdults` while an address awaits correction. */
  guests: number;
  setRoomAdults: (next: readonly number[]) => void;
  /** Sets the guest total and the room count together; the per-room split follows (allocateGuests). */
  setOccupancy: (guests: number, rooms: number) => void;
  /** Children in the party, apart from the adults and the room rule (guest-party.ts). */
  children: number;
  setChildren: (children: number) => void;
  /**
   * The rooms a search from this bar sends: the field's own when it shows the stepper; with it hidden, only rooms the
   * address already carried (an earlier explicit choice, kept as it is), else none (the fewest that fit).
   */
  submittedRoomAdults: readonly number[] | undefined;
};

export type RoomField = "shown" | "hidden";

const DemoRoomsContext = createContext<DemoRooms | null>(null);

/** The search's rooms on demo pages, or null outside them. */
export function useDemoRooms(): DemoRooms | null {
  return useContext(DemoRoomsContext);
}

const asGroups = (adults: readonly number[]) => adults.map((n, i) => createRoomSlot(i + 1, n, null));
const sameAllocation = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((n, i) => n === b[i]);

type PendingRoomContextValue = {
  propertyId?: string;
  /** The homepage: a submitted search is written into this page's own address first, so Back and refresh keep it. */
  rememberSearch?: boolean;
  staySearch: StaySearch | null;
  getPendingRoom: () => string | undefined;
  setPendingRoom: (room: string | undefined) => void;
};

const PendingRoomContext = createContext<PendingRoomContextValue>({
  propertyId: undefined,
  staySearch: null,
  getPendingRoom: () => undefined,
  setPendingRoom: () => {},
});

/**
 * Writes the submitted search into the current (homepage) address, in place: no new history entry, nothing on each
 * stepper change, only what the guest submitted (Phase D refinement, 10/11/2026). Next's history state is kept.
 */
function rememberSubmittedSearch(stay: ReturnType<typeof searchFromForm>, rooms: DemoRooms | null) {
  const href = demoHomeSearchHref(window.location, stay, { roomAdults: rooms?.submittedRoomAdults, children: rooms?.children });
  if (href !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, "", href);
}

export function useOptionalStaySearch(): StaySearch | null {
  return useContext(PendingRoomContext).staySearch;
}

/** The shared BOOK NOW behaviour: continue with a complete stay to Booking Results (or inline on Property Detail), or finish choosing dates first. */
export function useBookNow() {
  const search = useStaySearch();
  const router = useRouter();
  const pendingRoom = useContext(PendingRoomContext);
  const rooms = useDemoRooms();
  return (options: { room?: string; from?: HTMLElement | null } = {}) => {
    const check = checkSubmit(search.form, { today: search.ensureToday(), rules: search.rules });
    // Leave the viewer or drawer first: the next step is on the page behind it.
    const parentDialog = options.from?.closest("dialog");
    if (parentDialog) {
      parentDialog.close();
      document.documentElement.style.overflow = document.querySelector("dialog[open]") ? "hidden" : "";
    }
    if (check.ok) {
      const stay = searchFromForm(search.form, check.criteria, search.properties);
      const selectedSlug = stay.filters.property && stay.filters.property !== "all" ? stay.filters.property : undefined;
      pendingRoom.setPendingRoom(undefined);
      // Only a property that books inside VNest opens its own room selection; a property that books on the
      // provider's page goes to the hand-off state in the results, with the stay in the address.
      if (pendingRoom.propertyId && usesNativeBooking(pendingRoom.propertyId) && (!selectedSlug || selectedSlug === pendingRoom.propertyId)) {
        window.dispatchEvent(
          new CustomEvent<PropertyBookNowDetail>(PROPERTY_BOOK_NOW_EVENT, {
            detail: { stay, room: options.room, ...(rooms?.submittedRoomAdults ? { roomAdults: rooms.submittedRoomAdults } : {}) },
          }),
        );
        return;
      }
      document.querySelectorAll<HTMLDialogElement>("dialog[open]").forEach((d) => d.close());
      document.documentElement.style.overflow = "";
      window.scrollTo({ top: 0, behavior: "auto" });
      const contextQuery = Object.fromEntries(new URLSearchParams(window.location.search));
      if (pendingRoom.rememberSearch) rememberSubmittedSearch(stay, rooms);
      router.push(
        demoBookingResultsUrl(stay, {
          room: options.room,
          contextQuery,
          ...(rooms?.submittedRoomAdults ? { roomAdults: rooms.submittedRoomAdults } : {}),
          ...(rooms?.children ? { children: rooms.children } : {}),
        }),
      );
    } else {
      pendingRoom.setPendingRoom(options.room);
      openBookingField(check.field);
    }
  };
}

/**
 * Sends a valid search from any 02.1 bar on the page to the Booking Results page (/dev/demo/tim-phong)
 * or handles it inline when on the selected property's own detail page.
 * An incomplete search is not touched: 02.1 shows its own message and opens the field to fix, exactly as frozen.
 * Listens before React, on the window, while capturing.
 */
export function DemoBookingGuard() {
  const search = useStaySearch();
  const router = useRouter();
  const pendingRoom = useContext(PendingRoomContext);
  const rooms = useDemoRooms();
  const latestRooms = useRef(rooms);
  const latest = useRef(search);
  const lastPropertyId = useRef(search.form.propertyId);
  useEffect(() => {
    if (search.form.propertyId !== lastPropertyId.current) {
      lastPropertyId.current = search.form.propertyId;
      pendingRoom.setPendingRoom(undefined);
    }
    latest.current = search;
    latestRooms.current = rooms;
  });
  useEffect(() => {
    function onSubmit(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.getAttribute("role") !== "search") return;
      const current = latest.current;
      if (current.pending) return;
      const check = checkSubmit(current.form, { today: current.ensureToday(), rules: current.rules });
      if (!check.ok) return;
      event.preventDefault();
      event.stopPropagation();
      const parentDialog = form.closest("dialog");
      if (parentDialog) {
        parentDialog.close();
        document.documentElement.style.overflow = document.querySelector("dialog[open]") ? "hidden" : "";
      }
      const stay = searchFromForm(current.form, check.criteria, current.properties);
      const selectedSlug = stay.filters.property && stay.filters.property !== "all" ? stay.filters.property : undefined;
      const contextQuery = Object.fromEntries(new URLSearchParams(window.location.search));
      const room = pendingRoom.getPendingRoom() ?? contextQuery.room;
      pendingRoom.setPendingRoom(undefined);
      if (pendingRoom.propertyId && usesNativeBooking(pendingRoom.propertyId) && (!selectedSlug || selectedSlug === pendingRoom.propertyId)) {
        window.dispatchEvent(
          new CustomEvent<PropertyBookNowDetail>(PROPERTY_BOOK_NOW_EVENT, {
            detail: { stay, room, ...(latestRooms.current?.submittedRoomAdults ? { roomAdults: latestRooms.current.submittedRoomAdults } : {}) },
          }),
        );
        return;
      }
      // The next page starts at its top, never under the sticky header.
      document.querySelectorAll<HTMLDialogElement>("dialog[open]").forEach((d) => d.close());
      document.documentElement.style.overflow = "";
      window.scrollTo({ top: 0, behavior: "auto" });
      if (pendingRoom.rememberSearch) rememberSubmittedSearch(stay, latestRooms.current);
      router.push(
        demoBookingResultsUrl(stay, {
          room,
          contextQuery,
          ...(latestRooms.current?.submittedRoomAdults ? { roomAdults: latestRooms.current.submittedRoomAdults } : {}),
          ...(latestRooms.current?.children ? { children: latestRooms.current.children } : {}),
        }),
      );
    }
    window.addEventListener("submit", onSubmit, true);
    return () => window.removeEventListener("submit", onSubmit, true);
  }, [router, pendingRoom]);
  return null;
}

/** BOOK NOW for photo viewers and the room drawer. `tone="dark"` sits on the viewer's dark ground. */
export function BookNowButton({ room, tone = "light", block = false, note }: { room?: string; tone?: "light" | "dark"; block?: boolean; note?: string }) {
  const bookNow = useBookNow();
  // On a property that books on the provider's page the action is the hand-off, and is named for it.
  const { propertyId } = useContext(PendingRoomContext);
  const handoff = usesExternalHandoff(propertyId);
  return (
    <button
      type="button"
      className={`${styles.bookNow} ${tone === "dark" ? styles.onDark : ""} ${block ? styles.block : ""}`}
      onClick={(event: MouseEvent<HTMLButtonElement>) => bookNow({ room, from: event.currentTarget })}
    >
      {handoff ? <span>{HANDOFF_CTA_LABEL}</span> : <span {...LANG}>{BOOKING_LABEL}</span>}
      {note ? <span className="sr-only">, {note}</span> : null}
    </button>
  );
}

/**
 * The header's BOOKING: a real link to the homepage booking bar (#dat-phong), so it works before any
 * script; with script it opens that bar's dates in place.
 */
export function HeaderBookingLink({ href, className }: { href: string; className?: string }) {
  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        if (!document.getElementById("dat-phong")) return;
        event.preventDefault();
        openBookingField("checkIn");
      }}
    >
      <span {...{ lang: BOOKING_LABEL_LANG }}>BOOKING</span>
    </a>
  );
}

/** Everything a demo page's booking needs, inside its StaySearchProvider: the worded action, the guest field (with or
 * without its room stepper) and the guard. */
export function DemoBookingScope({
  propertyId,
  roomField = "shown",
  rememberSearch = false,
  children,
}: {
  propertyId?: string;
  roomField?: RoomField;
  /** The homepage: keep a submitted search in this page's address (Back, refresh). */
  rememberSearch?: boolean;
  children: ReactNode;
}) {
  const staySearch = useStaySearch();
  const params = useSearchParams();
  const adults = staySearch.form.adults;
  const addressRooms = params?.get("rooms") ?? undefined;
  const [storedRooms, setStoredRooms] = useState<readonly number[]>(() => roomAdultsFromQuery(addressRooms, adults));
  const [childCount, setChildCount] = useState(() => parseChildren(params?.get("children")));
  // The allocation follows the bar's guest total within what the rooms take (N to 2N); the rooms never change here.
  const roomAdults = useMemo(() => {
    const reconciled = setTotalAdults(asGroups(storedRooms), adults).map((group) => group.adults);
    return sameAllocation(reconciled, storedRooms) ? storedRooms : reconciled;
  }, [storedRooms, adults]);
  const rooms = useMemo<DemoRooms>(
    () => ({
      roomField,
      roomAdults,
      guests: adults,
      setRoomAdults: (next) => {
        if (!next.length) return;
        setStoredRooms(next);
        const total = next.reduce((a, b) => a + b, 0);
        if (total !== staySearch.form.adults) staySearch.setAdults(total);
      },
      setOccupancy: (guests, roomCount) => {
        setStoredRooms(allocateGuests(guests, roomCount));
        if (guests !== staySearch.form.adults) staySearch.setAdults(guests);
      },
      children: childCount,
      setChildren: (next) => setChildCount(clampChildren(next)),
      // Hidden stepper: the address's rooms only (an earlier explicit choice), so nothing invisible is invented.
      submittedRoomAdults: roomField === "shown" ? roomAdults : addressRooms ? roomAdultsFromQuery(addressRooms, adults) : undefined,
    }),
    [roomField, roomAdults, adults, staySearch, childCount, addressRooms],
  );
  const presentation = useMemo(
    () => ({
      submitLabel: BOOKING_LABEL,
      submitLang: BOOKING_LABEL_LANG,
      occupancy:
        roomField === "shown"
          ? {
              label: OCCUPANCY_LABEL,
              summary: occupancySummary(adults, roomAdults.length, childCount),
              compactSummaries: compactGuestSummaries(adults, roomAdults.length, childCount),
              panel: <OccupancyPanel />,
              reset: () => setChildCount(0),
            }
          : {
              label: GUESTS_LABEL,
              summary: partySummary({ adults, children: childCount }),
              compactSummaries: compactGuestSummaries(adults, null, childCount),
              panel: <OccupancyPanel />,
              reset: () => setChildCount(0),
            },
    }),
    [roomField, adults, roomAdults.length, childCount],
  );
  const pendingRoomRef = useRef<string | undefined>(undefined);
  const contextValue = useMemo<PendingRoomContextValue>(
    () => ({
      propertyId,
      rememberSearch,
      staySearch,
      getPendingRoom: () => pendingRoomRef.current,
      setPendingRoom: (room) => {
        pendingRoomRef.current = room;
      },
    }),
    [propertyId, rememberSearch, staySearch],
  );
  return (
    <PendingRoomContext value={contextValue}>
      <DemoRoomsContext value={rooms}>
        <BookingPresentationProvider value={presentation}>
          <DemoBookingGuard />
          {children}
        </BookingPresentationProvider>
      </DemoRoomsContext>
    </PendingRoomContext>
  );
}
