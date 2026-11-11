"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { isBefore, type IsoDate } from "@/domain/dates";
import { site } from "@/config/site";
import { todayInTimeZone } from "@/lib/today";
import { DateRangeCalendar } from "@/features/booking-search/fields/DateRangeCalendar";
import { formatDay } from "@/features/booking-search/format";
import type { DateField } from "@/features/booking-search/search-form";
import {
  BOOKING_LABEL,
  BOOKING_LABEL_LANG,
  PROPERTY_BOOK_NOW_EVENT,
  useDemoRooms,
  useOptionalStaySearch,
  type PropertyBookNowDetail,
} from "@/features/demo/BookingCta";
import type { CatalogRoom } from "@/features/demo/booking-results-data";
import { DEMO_BOOKING_RESULTS } from "@/features/demo/booking-flow";
import { HANDOFF_CTA_LABEL, usesExternalHandoff } from "@/domain/hybrid-booking/booking-mode";
import { resolveHandoffAction } from "@/domain/hybrid-booking/ezcloud-handoff";
import { demoBookingStepFromMultiRoomUrl } from "@/features/demo/booking-flow";
import {
  assignRoomPreference,
  clearRoomPreference,
  createRoomSlot,
  evaluateRoomForSlot,
  MAX_ROOMS,
  parseMultiRoomQuery,
  resizeRoomGroups,
  serializeMultiRoomQuery,
  stayNights,
  totalRequestedAdults,
  type RoomCatalogMeta,
  type RoomGroupSlot,
} from "@/features/demo/booking-results-state";
import { allocateGuests, MAX_GUESTS_PER_ROOM, MAX_ROOMS_PER_STAY, minRoomsFor, occupancyFit, roomsCanGrow, roomsCanShrink } from "@/domain/hybrid-booking/room-occupancy";
import { OCCUPANCY_LABEL, occupancySummary } from "@/features/demo/occupancy-copy";
import { CHILD_POLICY_NOTE } from "@/domain/hybrid-booking/guest-party";
import { openSharedOccupancyField } from "@/features/demo/open-shared-occupancy";
import type { Property } from "@/domain/property";
import type { Photo } from "./Lightbox";
import { bookingGuidance, slotLabel, type BookingGuidance } from "./booking-guidance";
import { Pictogram } from "./Pictogram";
import pdStyles from "./PropertyDetail.module.css";
import styles from "./PropertyRoomCollection.module.css";
import { RoomCardCarousel, RoomCompactMeta } from "./RoomCardCarousel";
import { RoomDrawer } from "./RoomDrawer";
import type { PropertyDetailView, RoomView } from "./view";

type Props = {
  id: string;
  property: Property;
  view: PropertyDetailView;
  roomPhotosById: Readonly<Record<string, readonly Photo[]>>;
  viewerActionsByRoomId?: Readonly<Record<string, ReactNode>>;
  drawerActionsByRoomId?: Readonly<Record<string, ReactNode>>;
  pendingSection?: ReactNode;
};

/**
 * Room slots from the query string, read with the SAME parser as Booking Results and the booking step
 * (`rooms` = a room count, or adults per room as "2,3"; `prefs`; `room`), so a stay keeps its meaning
 * whichever page it travels through. Each slot is represented independently by its `slotId` ("room-1",
 * "room-2", ...) and `slotIndex`, allowing the same displayed room to be requested across multiple slots.
 */
function parseInitialSlotsFromUrl(
  search: string,
  propertySlug: string,
  validRoomIds: ReadonlySet<string>,
  roomMetaById: ReadonlyMap<string, RoomCatalogMeta>,
  fallbackAdults: number,
): RoomGroupSlot[] {
  const params = new URLSearchParams(search);
  if (!["rooms", "adults", "prefs", "room"].some((key) => params.has(key))) {
    return resizeRoomGroups([], fallbackAdults, minRoomsFor(fallbackAdults));
  }
  const query = Object.fromEntries(params.entries());
  return [...parseMultiRoomQuery({ ...query, property: propertySlug }, [propertySlug], validRoomIds, roomMetaById).roomGroups];
}

function buildCatalogRoomsForProperty(
  property: Property,
  rooms: readonly RoomView[],
  roomPhotosById: Readonly<Record<string, readonly Photo[]>>,
): CatalogRoom[] {
  const propertyId = property.slug;
  const draft = rooms.map((r, idx): CatalogRoom => {
    const typeSpec = r.specs.find((s) => s.label === "Loại phòng")?.value ?? null;
    const sizeSpec = r.specs.find((s) => s.label === "Diện tích")?.value ?? null;
    // R3 (25/10/2026): "Sức chứa" is display metadata, never an eligibility rule; ezCloud will supply real limits.
    const verifiedMaxAdults: number | null = null;
    const normalizedType = typeSpec ? typeSpec.trim().toLowerCase() : null;
    const roomTypeGroupId = normalizedType ? `${propertyId}:${normalizedType}` : null;

    return {
      id: r.id,
      propertyId,
      propertyName: property.identity.name,
      cityId: "ho-chi-minh",
      cityLabel: property.place.area.name,
      locationLabel: property.place.area.name,
      row: idx + 1,
      name: r.name,
      optionKind: "physical-unit",
      roomType: typeSpec,
      roomSize: sizeSpec,
      roomTypeGroupId,
      sameTypeUnitIds: [],
      physicalUnits: 1,
      availableUnits: null,
      inventoryQuantity: null,
      ratePlan: null,
      specs: r.specs.map((s) => ({
        kind: (s.label === "Loại phòng" ? "type" : s.label === "Diện tích" ? "size" : "capacity") as "type" | "size" | "capacity",
        label: s.label,
        value: s.value,
        cell: "",
      })),
      verifiedMaxAdults,
      photos: roomPhotosById[r.id] ?? [],
    };
  });

  return draft.map((room) => ({
    ...room,
    sameTypeUnitIds: room.roomTypeGroupId
      ? draft.filter((peer) => peer.roomTypeGroupId === room.roomTypeGroupId).map((peer) => peer.id)
      : [room.id],
  }));
}

function ReferencePrice({ room }: { room: RoomView }) {
  if (room.price.kind !== "reference") return null;
  return (
    <div className={styles.referencePriceBox}>
      <p className={styles.referencePriceLabel}>Giá tham khảo</p>
      <dl className={styles.referencePriceRows}>
        <dt>Ngày thường</dt>
        <dd>{room.price.weekday}</dd>
        <dt>Ngày cuối tuần</dt>
        <dd>{room.price.weekend}</dd>
      </dl>
    </div>
  );
}

/**
 * The room card's price region (owner brief, 25/10/2026): an approved public starting rate
 * ("Chỉ từ … / đêm"), the indicative workbook figures in the private preview only, or the neutral
 * "Xem giá theo ngày". It stays visible in every state of the CTA beside it (hover, focus, selected).
 */
function RoomPrice({ room, id }: { room: RoomView; id: string }) {
  if (room.price.kind === "from") {
    return (
      <p id={id} className={styles.priceBlock} data-price="from">
        <span className={styles.priceLead}>Chỉ từ</span>
        <span className={styles.priceValue}>{room.price.amount}</span>
        <span className={styles.priceUnit}>/ đêm</span>
      </p>
    );
  }
  if (room.price.kind === "reference") {
    return (
      <p id={id} className={styles.priceBlock} data-price="reference">
        <span className={styles.priceLead}>Giá tham khảo · ngày thường</span>
        <span className={styles.priceValue}>{room.price.weekday}</span>
      </p>
    );
  }
  return (
    <p id={id} className={styles.priceBlock} data-price="pending">
      <svg className={styles.priceIcon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
        <path d="M3 8.5h14M7 3v3M13 3v3" />
      </svg>
      <span className={styles.priceValue}>Xem giá theo ngày</span>
    </p>
  );
}

export function PropertyRoomCollection({
  id,
  property,
  view,
  roomPhotosById,
  viewerActionsByRoomId,
  drawerActionsByRoomId,
  pendingSection,
}: Props) {
  const staySearch = useOptionalStaySearch();
  const catalogRooms = useMemo(
    () => buildCatalogRoomsForProperty(property, view.rooms, roomPhotosById),
    [property, view.rooms, roomPhotosById],
  );
  const validRoomIds = useMemo(() => new Set(catalogRooms.map((r) => r.id)), [catalogRooms]);
  const catalogRoomById = useMemo(() => new Map(catalogRooms.map((r) => [r.id, r])), [catalogRooms]);
  const roomMetaById = useMemo(
    () =>
      new Map(
        catalogRooms.map((r) => [
          r.id,
          {
            propertyId: r.propertyId,
            optionKind: r.optionKind,
            physicalUnits: r.physicalUnits,
            availableUnits: r.availableUnits,
            verifiedMaxAdults: r.verifiedMaxAdults,
          },
        ]),
      ),
    [catalogRooms],
  );

  const initialAdults = staySearch?.form.adults ?? 2;
  const searchParams = useSearchParams();
  const [initialSlots] = useState(() => parseInitialSlotsFromUrl(searchParams?.toString() ?? "", property.slug, validRoomIds, roomMetaById, initialAdults));
  const [roomGroups, setRoomGroups] = useState<readonly RoomGroupSlot[]>(initialSlots);
  const [activeSlot, setActiveSlot] = useState<number>(() => initialSlots.find((g) => g.preferredRoomId === null)?.slotIndex ?? 1);
  const [localCheckIn, setLocalCheckIn] = useState<IsoDate | undefined>(staySearch?.form.checkIn);
  const [localCheckOut, setLocalCheckOut] = useState<IsoDate | undefined>(staySearch?.form.checkOut);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dateField, setDateField] = useState<DateField>("checkIn");
  /** A short explanation after a room could not be added or removed (never a silent change). */
  const [slotNotice, setSlotNotice] = useState<string | null>(null);
  /** Set once BOOK NOW was pressed; the guidance shown is then recomputed live and disappears when resolved. */
  const [bookAttempted, setBookAttempted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLUListElement>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogTitleId = useId();

  // The header bar's combined "Phòng & khách" field and these room slots are one search: each follows the other.
  // On mount the slots (read from the address) lead; afterwards whichever side changed leads, and equal values stop.
  const demoRooms = useDemoRooms();
  const barAllocation = demoRooms?.roomAdults.join(",");
  const slotAllocation = roomGroups.map((g) => g.adults).join(",");
  // Bar → slots, adjusted during render when the bar's allocation changes (not on mount).
  const [seenBarAllocation, setSeenBarAllocation] = useState(barAllocation);
  if (barAllocation !== seenBarAllocation) {
    setSeenBarAllocation(barAllocation);
    if (demoRooms && barAllocation !== slotAllocation) {
      const adults = demoRooms.roomAdults;
      setRoomGroups((prev) => adults.map((n, i) => createRoomSlot(i + 1, n, prev[i]?.preferredRoomId ?? null)));
      setActiveSlot((slot) => (slot > adults.length ? 1 : slot));
    }
  }
  // A notice about adding or removing a room is about the allocation it was shown for.
  const [noticeAllocation, setNoticeAllocation] = useState(slotAllocation);
  if (noticeAllocation !== slotAllocation) {
    setNoticeAllocation(slotAllocation);
    if (slotNotice) setSlotNotice(null);
  }
  // The guest total is the search's (the header field's), which an outdated address may hold above or below what the slots
  // take; the slots never change it. Without a search it is the slots' own total.
  const guests = demoRooms?.guests ?? staySearch?.form.adults ?? totalRequestedAdults(roomGroups);
  // Children (header field, `children=N`): carried and shown, never allocated to the room slots (guest-party.ts).
  const children = demoRooms?.children ?? 0;
  // Slots → bar, after the slots change (Back to another address). Handlers push their own change directly.
  useEffect(() => {
    if (!demoRooms || slotAllocation === barAllocation) return;
    // The slots hold the search's total when they are its split; otherwise (another address) their own total.
    const held = allocateGuests(demoRooms.guests, roomGroups.length).join(",") === slotAllocation;
    demoRooms.setOccupancy(held ? demoRooms.guests : totalRequestedAdults(roomGroups), roomGroups.length);
    // Only the slots' change pushes to the bar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotAllocation]);

  // Sync browser Back/Forward navigation from URL query
  useEffect(() => {
    function onPopState() {
      const parsed = parseInitialSlotsFromUrl(window.location.search, property.slug, validRoomIds, roomMetaById, staySearch?.form.adults ?? 2);
      setRoomGroups(parsed);
      const firstEmpty = parsed.find((g) => g.preferredRoomId === null)?.slotIndex ?? 1;
      setActiveSlot(firstEmpty);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [property.slug, validRoomIds, roomMetaById, staySearch?.form.adults]);

  const checkIn = staySearch?.form.checkIn ?? localCheckIn;
  const checkOut = staySearch?.form.checkOut ?? localCheckOut;
  // Read, never set, during render: calling the shared search's ensureToday() here updated StaySearchProvider while this
  // component rendered (React's "Cannot update a component while rendering a different component"). The calendar only
  // renders after the guest opens it, so reading the clock here cannot differ between server and client.
  const calendarToday: IsoDate = staySearch?.today ?? todayInTimeZone(site.timeZone) ?? (new Date().toISOString().slice(0, 10) as IsoDate);
  const nights = stayNights({ checkIn, checkOut });

  // A property that books on the provider's page has no room selection here: one hand-off action instead.
  const handoffMode = usesExternalHandoff(property.slug);
  const handoffAction = handoffMode
    ? resolveHandoffAction(property.slug, {
        ...(checkIn ? { checkIn } : {}),
        ...(checkOut ? { checkOut } : {}),
        roomAdults: roomGroups.map((g) => g.adults),
        ...(children ? { children } : {}),
      })
    : null;
  const fit = occupancyFit(guests, roomGroups.length);
  const handoffStateHref = `${DEMO_BOOKING_RESULTS}?${serializeMultiRoomQuery({
    propertySlug: property.slug,
    ...(checkIn ? { checkIn } : {}),
    ...(checkOut ? { checkOut } : {}),
    roomGroups: roomGroups.map((g) => createRoomSlot(g.slotIndex, g.adults, null)),
    ...(fit.kind === "fits" ? {} : { guests }),
    ...(children ? { children } : {}),
  })}`;

  // Sync URL query params non-destructively when room selections or dates change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    // Same address format as serializeMultiRoomQuery: one room is "rooms=1", several are adults per room.
    params.set("rooms", roomGroups.length === 1 ? "1" : roomGroups.map((g) => g.adults).join(","));
    // The search's guest total, never the slots' split: an address that does not fit keeps its total until corrected.
    params.set("adults", String(guests));
    if (children) params.set("children", String(children));
    else params.delete("children");
    const anyPrefs = roomGroups.some((g) => g.preferredRoomId !== null);
    if (anyPrefs) {
      params.set("prefs", roomGroups.map((g) => g.preferredRoomId ?? "").join(","));
    } else {
      params.delete("prefs");
    }
    const qs = params.toString();
    const nextUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [roomGroups, checkIn, checkOut, guests, children]);

  const syncScrollLock = () => {
    document.documentElement.style.overflow = document.querySelector("dialog[open]") ? "hidden" : "";
  };

  const closeBookingDialog = () => {
    dialogRef.current?.close();
    syncScrollLock();
  };

  // The header bar's BOOK NOW listener (registered once) reaches the latest state and handler through these.
  const latestStay = useRef({ roomGroups, checkIn, checkOut, searchGuests: staySearch?.form.adults });
  const runBookNow = useRef<(guidance: BookingGuidance | null) => void>(() => {});
  useEffect(() => {
    latestStay.current = { roomGroups, checkIn, checkOut, searchGuests: staySearch?.form.adults };
  });

  // Listen for BOOK NOW events from the header booking bar, RoomDrawer, or Lightbox on this property page
  useEffect(() => {
    const node = dialogRef.current;
    function onPropertyBookNow(event: Event) {
      const custom = event as CustomEvent<PropertyBookNowDetail>;
      const detail = custom.detail;
      if (detail?.stay?.criteria.checkIn) setLocalCheckIn(detail.stay.criteria.checkIn);
      if (detail?.stay?.criteria.checkOut) setLocalCheckOut(detail.stay.criteria.checkOut);

      const latest = latestStay.current;
      let groups = latest.roomGroups;
      if (detail?.room) {
        const matched = catalogRooms.find(
          (r) => r.id === detail.room || r.name.toLowerCase() === detail.room!.toLowerCase(),
        );
        if (matched) {
          const targetSlot = groups.find((g) => g.preferredRoomId === null)?.slotIndex ?? groups[0]?.slotIndex ?? 1;
          const res = assignRoomPreference(groups, targetSlot, matched);
          groups = res.groups;
          setRoomGroups(groups);
          if (res.assigned) setActiveSlot(res.nextActiveSlot);
        }
      }

      const sectionEl = document.getElementById(id);
      if (sectionEl) {
        const rect = sectionEl.getBoundingClientRect();
        if (rect.top > window.innerHeight * 0.7 || rect.bottom < 0) {
          sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }

      // Same check as this section's BOOK NOW, with the dates and room above applied.
      runBookNow.current(
        bookingGuidance({
          checkIn: detail?.stay?.criteria.checkIn ?? latest.checkIn,
          checkOut: detail?.stay?.criteria.checkOut ?? latest.checkOut,
          roomGroups: groups,
          searchGuests: latest.searchGuests,
        }),
      );
    }

    window.addEventListener(PROPERTY_BOOK_NOW_EVENT, onPropertyBookNow);
    return () => {
      window.removeEventListener(PROPERTY_BOOK_NOW_EVENT, onPropertyBookNow);
      if (node?.open) node.close();
      syncScrollLock();
    };
  }, [catalogRooms, id]);

  const currentSlotObj = useMemo(
    () => roomGroups.find((g) => g.slotIndex === activeSlot) ?? roomGroups[0]!,
    [roomGroups, activeSlot],
  );

  const selectedCount = useMemo(
    () => roomGroups.filter((g) => g.preferredRoomId !== null).length,
    [roomGroups],
  );

  const liveGuidance = bookingGuidance({ checkIn, checkOut, roomGroups, searchGuests: staySearch?.form.adults });
  const shownGuidance = bookAttempted ? liveGuidance : null;

  function handlePickDate(picked: IsoDate) {
    if (dateField === "checkIn" || !checkIn || !isBefore(checkIn, picked)) {
      setLocalCheckIn(picked);
      if (checkOut && !isBefore(picked, checkOut)) {
        setLocalCheckOut(undefined);
      }
      staySearch?.pickDate("checkIn", picked);
      setDateField("checkOut");
    } else {
      setLocalCheckOut(picked);
      staySearch?.pickDate("checkOut", picked);
      setCalendarOpen(false);
    }
  }

  /** Applies an explicit change of guests and rooms (the guest's own): slots split again, chosen rooms kept in order. */
  function applyOccupancy(nextGuests: number, nextRooms: number, dropSlotIndex?: number) {
    const next = resizeRoomGroups(roomGroups, nextGuests, nextRooms, dropSlotIndex);
    setRoomGroups(next);
    setActiveSlot(next.find((g) => g.preferredRoomId === null)?.slotIndex ?? next[next.length - 1]!.slotIndex);
    setSlotNotice(null);
    if (demoRooms) demoRooms.setOccupancy(nextGuests, nextRooms);
    else if (staySearch && staySearch.form.adults !== nextGuests) staySearch.setAdults(nextGuests);
  }

  /** Adds an empty room slot; the guest total never changes. Explains when the guests cannot fill another room. */
  function handleAddRoom() {
    if (!roomsCanGrow(guests, roomGroups.length)) {
      setSlotNotice(
        roomGroups.length >= MAX_ROOMS
          ? `Mỗi yêu cầu tối đa ${MAX_ROOMS} phòng.`
          : `Mỗi phòng cần ít nhất 1 khách: ${guests} khách dùng được tối đa ${guests} phòng. Tăng số khách ở mục ${OCCUPANCY_LABEL} để thêm phòng.`,
      );
      return;
    }
    applyOccupancy(guests, roomGroups.length + 1);
  }

  /** Removes a room slot when the other rooms hold every guest; otherwise explains and changes nothing. */
  function handleRemoveRoom(slotIndex: number) {
    if (roomGroups.length <= 1) {
      setRoomGroups(clearRoomPreference(roomGroups, slotIndex));
      setActiveSlot(1);
      return;
    }
    if (!roomsCanShrink(guests, roomGroups.length)) {
      setSlotNotice(
        `${guests} khách cần ít nhất ${minRoomsFor(guests)} phòng (mỗi phòng tối đa ${MAX_GUESTS_PER_ROOM} khách). Giảm số khách ở mục ${OCCUPANCY_LABEL} trước khi bớt phòng.`,
      );
      return;
    }
    applyOccupancy(guests, roomGroups.length - 1, slotIndex);
  }

  /** The shared "Phòng & khách" field lives in the header bar; this opens it instead of repeating its steppers here. */
  function handleOpenOccupancy() {
    if (!openSharedOccupancyField()) {
      setSlotNotice(`Đổi số khách và số phòng ở mục ${OCCUPANCY_LABEL} trên thanh đặt phòng.`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleSelectRoom(slotIndex: number, room: CatalogRoom) {
    const { groups, assigned, nextActiveSlot } = assignRoomPreference(roomGroups, slotIndex, room);
    setRoomGroups(groups);
    if (assigned) {
      setActiveSlot(nextActiveSlot);
    }
  }

  function handleUnselectRoom(slotIndex: number) {
    setRoomGroups(clearRoomPreference(roomGroups, slotIndex));
    setActiveSlot(slotIndex);
  }

  /**
   * BOOK NOW: opens the request review only when the stay is complete. Otherwise it says what is missing (an
   * accessible alert beside the button) and takes the guest to it: the calendar, the shared field, or the first empty
   * room slot. Nothing here implies a booking was made.
   */
  function handleBookNowClick() {
    bookNow(liveGuidance);
  }

  function bookNow(guidance: BookingGuidance | null) {
    setBookAttempted(true);
    if (!guidance) {
      dialogRef.current?.showModal();
      syncScrollLock();
      return;
    }
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (guidance.step === "dates") {
      setDateField(checkIn && !checkOut ? "checkOut" : "checkIn");
      setCalendarOpen(true);
      cardRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    } else if (guidance.step === "occupancy") {
      handleOpenOccupancy();
    } else if (guidance.slotIndex !== undefined) {
      setActiveSlot(guidance.slotIndex);
      gridRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }


  useEffect(() => {
    runBookNow.current = bookNow;
  });

  const conciseDates =
    checkIn && checkOut
      ? `${formatDay(checkIn)} – ${formatDay(checkOut)}${nights ? ` (${nights} đêm)` : ""}`
      : checkIn
        ? `${formatDay(checkIn)} – Chọn ngày trả`
        : "Chọn ngày nhận – trả phòng";

  const amenities = property.amenities;

  return (
    <section id={id} aria-labelledby="rooms-title" className={styles.focalSection}>
      <div className={styles.container}>
        {/* 1. Prominent Room Collection Header */}
        <header className={styles.sectionHeader}>
          <div className={styles.headerTitles}>
            <p className={styles.kicker}>Bộ sưu tập phòng · {property.identity.name}</p>
            <h2 id="rooms-title" className={styles.title}>
              Các loại phòng
            </h2>
            <p className={styles.subtitle}>
              {handoffMode
                ? `Khám phá từng loại phòng tại ${property.identity.name}. Giá và tình trạng phòng được kiểm tra ở bước đặt phòng.`
                : `Chọn một hoặc nhiều phòng phù hợp với kỳ lưu trú của bạn tại ${property.identity.name}.`}
            </p>
          </div>
        </header>

        {/* 2. The stay at this step: dates, the shared "Phòng & khách" summary, the room slots. Guest numbers are changed
            in the header bar's own field only (owner brief, 5/11/2026); no stepper is repeated here. */}
        <div ref={cardRef} className={styles.bookingControlCard} role="region" aria-label={`Tuỳ chọn lưu trú tại ${property.identity.name}`}>
          <div className={styles.controlTopRow}>
            <div className={styles.controlLeftGroup}>
              <button
                type="button"
                className={styles.dateTriggerBtn}
                aria-expanded={calendarOpen}
                data-testid="property-dates-trigger"
                data-missing={shownGuidance?.step === "dates" || undefined}
                onClick={() => {
                  setDateField("checkIn");
                  setCalendarOpen((open) => !open);
                }}
              >
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={styles.dateTriggerIcon} aria-hidden="true">
                  <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
                  <path d="M6.5 3v3M13.5 3v3M3 8.5h14" />
                </svg>
                <span>{conciseDates}</span>
              </button>

              <button
                type="button"
                className={styles.occupancySummaryBtn}
                data-testid="property-occupancy-summary"
                aria-label={`${OCCUPANCY_LABEL}: ${occupancySummary(guests, roomGroups.length, children)}. Thay đổi`}
                onClick={handleOpenOccupancy}
              >
                <span className={styles.occupancySummaryLabel} aria-hidden="true">
                  {OCCUPANCY_LABEL}
                </span>
                <span className={styles.occupancySummaryValue} aria-hidden="true">
                  {occupancySummary(guests, roomGroups.length, children)}
                </span>
              </button>
            </div>

            {handoffMode && handoffAction ? (
              <div className={styles.controlRightGroup}>
                {handoffAction.kind === "external" ? (
                  <a href={handoffAction.href} className={styles.bookNowActionBtn} rel="noopener noreferrer" data-testid="property-handoff-cta">
                    {HANDOFF_CTA_LABEL}
                  </a>
                ) : (
                  <a href={handoffStateHref} className={styles.bookNowActionBtn} data-testid="property-handoff-cta">
                    {HANDOFF_CTA_LABEL}
                  </a>
                )}
              </div>
            ) : null}
          </div>

          {/* An outdated or edited address whose guests do not fit its rooms: shown as it is, with two explicit fixes. */}
          {fit.kind !== "fits" ? (
            <div className={styles.occupancyCorrection} role="status" data-testid="occupancy-correction">
              <p className={styles.occupancyCorrectionText}>
                {fit.kind === "over"
                  ? `Yêu cầu này có ${guests} khách cho ${roomGroups.length} phòng, nhưng mỗi phòng tối đa ${MAX_GUESTS_PER_ROOM} khách.`
                  : `Yêu cầu này có ${roomGroups.length} phòng cho ${guests} khách, nhưng mỗi phòng cần ít nhất 1 khách.`}{" "}
                Chọn một cách điều chỉnh:
              </p>
              <div className={styles.occupancyCorrectionActions}>
                {fit.kind === "over" ? (
                  <>
                    {fit.minRooms <= MAX_ROOMS_PER_STAY ? (
                      <button type="button" className={styles.correctionBtn} data-testid="correct-add-rooms" onClick={() => applyOccupancy(guests, fit.minRooms)}>
                        Dùng {fit.minRooms} phòng cho {guests} khách
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={styles.correctionBtn}
                      data-testid="correct-fewer-guests"
                      onClick={() => applyOccupancy(roomGroups.length * MAX_GUESTS_PER_ROOM, roomGroups.length)}
                    >
                      Giữ {roomGroups.length} phòng, {roomGroups.length * MAX_GUESTS_PER_ROOM} khách
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className={styles.correctionBtn} data-testid="correct-fewer-rooms" onClick={() => applyOccupancy(guests, guests)}>
                      Dùng {guests} phòng cho {guests} khách
                    </button>
                    <button
                      type="button"
                      className={styles.correctionBtn}
                      data-testid="correct-more-guests"
                      onClick={() => applyOccupancy(roomGroups.length, roomGroups.length)}
                    >
                      Giữ {roomGroups.length} phòng, {roomGroups.length} khách
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {/* Inline Date Range Calendar Sheet */}
          {calendarOpen ? (
            <div className={styles.calendarSheet} role="region" aria-label="Chọn ngày nhận và trả phòng">
              <div className={styles.calendarSheetHeader}>
                <p className={styles.calendarSheetTitle}>
                  {dateField === "checkIn" ? "Chọn ngày nhận phòng" : "Chọn ngày trả phòng"}
                </p>
                <button
                  type="button"
                  className={styles.calendarCloseBtn}
                  onClick={() => setCalendarOpen(false)}
                >
                  Đóng lịch
                </button>
              </div>
              <div className={styles.calendarWrap}>
                <DateRangeCalendar
                  checkIn={checkIn}
                  checkOut={checkOut}
                  activeField={dateField}
                  today={calendarToday}
                  layout="paged"
                  months={1}
                  onPick={handlePickDate}
                />
              </div>
            </div>
          ) : null}

          {/* Room slots: one per room in the request. The highlighted slot is the one "Chọn phòng" fills next. */}
          {!handoffMode ? (
            <div className={styles.slotsBlock}>
              <ul className={styles.slotList} aria-label="Các phòng trong yêu cầu" data-testid="property-slot-summary-list">
                {roomGroups.map((slot) => {
                  const slotId = slot.slotId ?? `room-${slot.slotIndex}`;
                  const assignedRoom = slot.preferredRoomId ? catalogRoomById.get(slot.preferredRoomId) : undefined;
                  const isActive = slot.slotIndex === currentSlotObj.slotIndex;
                  return (
                    <li
                      key={slotId}
                      className={styles.slot}
                      data-slot-id={slotId}
                      data-slot-room={slot.preferredRoomId ?? ""}
                      data-active={isActive}
                      data-filled={Boolean(assignedRoom)}
                      data-missing={shownGuidance?.step === "rooms" && !assignedRoom ? true : undefined}
                      data-testid={`slot-pill-item-${slot.slotIndex}`}
                    >
                      <button
                        type="button"
                        className={styles.slotSelectBtn}
                        data-testid={`slot-pill-${slot.slotIndex}`}
                        aria-pressed={isActive}
                        onClick={() => setActiveSlot(slot.slotIndex)}
                      >
                        <span className={styles.slotIndex}>{slotLabel(slot.slotIndex)}</span>
                        <span className={styles.slotDash} aria-hidden="true">
                          —
                        </span>
                        <span className={styles.slotRoomName}>{assignedRoom ? assignedRoom.name : "Chưa chọn"}</span>
                      </button>
                      {assignedRoom ? (
                        <button
                          type="button"
                          className={styles.slotRemoveBtn}
                          data-testid={`clear-slot-${slot.slotIndex}`}
                          aria-label={`Bỏ chọn ${assignedRoom.name} khỏi ${slotLabel(slot.slotIndex)}`}
                          onClick={() => handleUnselectRoom(slot.slotIndex)}
                        >
                          ×
                        </button>
                      ) : roomGroups.length > 1 ? (
                        <button
                          type="button"
                          className={styles.slotRemoveBtn}
                          data-testid={`remove-slot-${slot.slotIndex}`}
                          aria-label={`Bớt ${slotLabel(slot.slotIndex)}`}
                          onClick={() => handleRemoveRoom(slot.slotIndex)}
                        >
                          ×
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              <button type="button" className={styles.addRoomLink} data-testid="add-room" onClick={handleAddRoom}>
                + Thêm phòng
              </button>
            </div>
          ) : null}
          <p className={styles.slotNotice} role="status" aria-live="polite" data-testid="property-slot-notice">
            {slotNotice}
          </p>
        </div>

        {/* 3. Large Editorial Horizontal Room Cards */}
        <ul ref={gridRef} className={styles.roomGrid} aria-label={`Danh sách phòng tại ${property.identity.name}`}>
          {view.rooms.map((roomView, index) => {
            const catalogRoom = catalogRoomById.get(roomView.id)!;
            const photos = roomPhotosById[roomView.id] ?? [];
            const activeEval = evaluateRoomForSlot(catalogRoom, currentSlotObj, roomGroups);
            const isSelectedInAnySlot = activeEval.assignedSlots.length > 0;
            const exceedsCapacity = activeEval.capacity.kind === "exceeds-verified-capacity";

            return (
              <li
                key={roomView.id}
                id={roomView.anchor}
                className={styles.roomCard}
                data-room-id={roomView.id}
                data-selected={isSelectedInAnySlot ? "true" : undefined}
              >
                <div className={styles.roomMediaCol}>
                  <RoomCardCarousel
                    roomName={roomView.name}
                    photos={photos}
                    sizes="(min-width: 52rem) 56vw, 100vw"
                    action={viewerActionsByRoomId?.[roomView.id]}
                    className={styles.roomCarousel}
                  />
                </div>

                <div className={styles.roomDetailsCol}>
                  <div className={styles.roomInfoTop}>
                    <div className={styles.roomCardHeaderRow}>
                      <span className={styles.roomIndexLabel}>
                        Phòng {String(index + 1).padStart(2, "0")}
                      </span>
                      {isSelectedInAnySlot ? (
                        <span
                          className={styles.selectedRoomBadge}
                          data-testid={`room-selected-slots-${roomView.id}`}
                        >
                          Đã chọn ở Phòng {activeEval.assignedSlots.join(", ")}
                        </span>
                      ) : null}
                    </div>

                    <h3 className={styles.roomName}>{roomView.name}</h3>

                    <RoomCompactMeta specs={roomView.specs} className={styles.roomCompactMeta} />

                    <div
                      className={styles.roomDescriptionSlot}
                      data-has-copy={Boolean(roomView.summary || roomView.description?.length)}
                    >
                      {roomView.summary ? <p className={styles.subtitle}>{roomView.summary}</p> : null}
                    </div>

                    {exceedsCapacity ? (
                      <p className={styles.capacityWarning}>
                        Phòng {currentSlotObj.slotIndex} ({currentSlotObj.adults} khách) vượt sức chứa tối đa{" "}
                        {catalogRoom.verifiedMaxAdults} khách.
                      </p>
                    ) : null}
                  </div>

                  <div className={styles.roomActionsFooter}>
                    {/* Price → action: one clean strip with one primary "Chọn phòng" button that remains selectable for every active slot. */}
                    <div className={styles.bookingStrip}>
                      <RoomPrice room={roomView} id={`${roomView.anchor}-price`} />
                      {handoffMode ? null : exceedsCapacity ? (
                        <button
                          type="button"
                          disabled
                          className={styles.disabledRoomBtn}
                          data-testid={`select-room-${roomView.id}`}
                        >
                          Tối đa {catalogRoom.verifiedMaxAdults} khách
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={activeEval.isSelectedForSlot ? styles.selectedRoomBtn : styles.selectRoomPrimaryBtn}
                          data-testid={`select-room-${roomView.id}`}
                          data-selected={activeEval.isSelectedForSlot ? "true" : undefined}
                          aria-pressed={activeEval.isSelectedForSlot}
                          aria-describedby={`${roomView.anchor}-price`}
                          onClick={() => handleSelectRoom(currentSlotObj.slotIndex, catalogRoom)}
                        >
                          {activeEval.isSelectedForSlot ? "Đã chọn phòng" : "Chọn phòng"}
                        </button>
                      )}
                    </div>

                    <div className={styles.primaryAndSecondaryRow}>
                      <RoomDrawer
                        room={roomView.name}
                        photos={photos}
                        bookingNote={
                          handoffMode
                            ? `Giá và tình trạng phòng của ${property.identity.name} được kiểm tra ở bước đặt phòng.`
                            : view.bookingConnected
                            ? null
                            : `Đặt phòng trực tuyến cho ${property.identity.name} sẽ được kích hoạt khi hệ thống đặt phòng được kết nối.`
                        }
                        action={drawerActionsByRoomId?.[roomView.id]}
                      >
                        {roomView.specs.length ? (
                          <dl className={pdStyles.drawerSpecs}>
                            {roomView.specs.map((spec) => (
                              <div key={spec.label}>
                                <dt>{spec.label}</dt>
                                <dd>{spec.value}</dd>
                              </div>
                            ))}
                          </dl>
                        ) : null}
                        {roomView.summary || roomView.description?.length || roomView.highlights?.length ? (
                          <div className={pdStyles.drawerSection}>
                            <h3 className={pdStyles.h3}>Giới thiệu phòng</h3>
                            {roomView.summary ? <p className={pdStyles.storyBody}>{roomView.summary}</p> : null}
                            {roomView.description?.map((paragraph) => (
                              <p key={paragraph} className={pdStyles.storyBody}>
                                {paragraph}
                              </p>
                            ))}
                            {roomView.highlights?.length ? (
                              <ul className={pdStyles.amenityList}>
                                {roomView.highlights.map((item) => (
                                  <li key={item}>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        ) : null}
                        {amenities.length ? (
                          <div className={pdStyles.drawerSection}>
                            <h3 className={pdStyles.h3}>
                              Tiện nghi chung tại {property.identity.name}
                            </h3>
                            <ul className={pdStyles.amenityList}>
                              {amenities.map((amenity) => (
                                <li key={amenity.id}>
                                  <Pictogram icon={amenity.icon} label={amenity.label} size={20} />
                                  <span>{amenity.label}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        <div className={pdStyles.drawerSection}>
                          {roomView.price.kind === "reference" ? (
                            <ReferencePrice room={roomView} />
                          ) : (
                            <RoomPrice room={roomView} id={`${roomView.anchor}-drawer-price`} />
                          )}
                        </div>
                      </RoomDrawer>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* 4. The one booking action of this step: sticky while the rooms are browsed. It states the selection, the next
            step, and, after a press, what is missing (an alert tied to the button). It never says a booking was made. */}
        {!handoffMode ? (
          <div
            className={styles.selectionSummaryBar}
            role="region"
            aria-label="Đặt phòng"
            data-testid="property-selection-summary-bar"
          >
            <div className={styles.summaryBarLeft}>
              <p className={styles.summaryBarCount} data-testid="summary-bar-status">
                {selectedCount}/{roomGroups.length} phòng đã chọn
              </p>
              {shownGuidance ? (
                <p id={`${id}-book-guidance`} className={styles.summaryBarGuidance} role="alert" data-testid="book-now-guidance" data-step={shownGuidance.step}>
                  {shownGuidance.message}
                </p>
              ) : (
                <p className={styles.summaryBarRooms} data-testid="summary-bar-rooms">
                  {liveGuidance?.step === "rooms"
                    ? `Tiếp theo: chọn loại phòng cho ${slotLabel(liveGuidance.slotIndex ?? 1)}`
                    : roomGroups
                        .map((g) => (g.preferredRoomId ? catalogRoomById.get(g.preferredRoomId)?.name ?? g.preferredRoomId : "Chưa chọn"))
                        .join(" · ")}
                </p>
              )}
            </div>
            <div className={styles.summaryBarRight}>
              <button
                type="button"
                className={styles.summaryBookNowBtn}
                data-testid="summary-bar-book-now"
                aria-describedby={shownGuidance ? `${id}-book-guidance` : undefined}
                onClick={handleBookNowClick}
              >
                <span lang={BOOKING_LABEL_LANG}>{BOOKING_LABEL}</span>
              </button>
            </div>
          </div>
        ) : null}

        {pendingSection}
      </div>

      {/* 5. On-Property Provisional Booking Request & Selection Review Dialog (only where booking happens in VNest) */}
      {handoffMode ? null : <dialog
        ref={dialogRef}
        className={styles.bookingDialog}
        aria-labelledby={dialogTitleId}
        data-testid="property-booking-dialog"
        onClose={() => {
          syncScrollLock();
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            closeBookingDialog();
          }
        }}
      >
        <div className={styles.dialogInner}>
          <div className={styles.dialogHead}>
            <h2 id={dialogTitleId} className={styles.dialogTitle}>
              Yêu cầu đặt phòng · {property.identity.name}
            </h2>
            <button
              type="button"
              className={styles.dialogCloseBtn}
              data-testid="close-property-booking-dialog"
              onClick={closeBookingDialog}
            >
              Đóng
            </button>
          </div>

          <div className={styles.dialogBody}>
            <dl className={styles.dialogStayMeta}>
              <div>
                <dt>Nơi ở</dt>
                <dd>{property.identity.name}</dd>
              </div>
              <div>
                <dt>Ngày lưu trú</dt>
                <dd>{conciseDates}</dd>
              </div>
              <div>
                <dt>Số lượng</dt>
                <dd>
                  {selectedCount}/{roomGroups.length} phòng ·{" "}
                  {children ? `${totalRequestedAdults(roomGroups)} người lớn · ${children} trẻ em` : `${totalRequestedAdults(roomGroups)} khách`}
                </dd>
              </div>
            </dl>

            <ul className={styles.dialogRoomList} aria-label="Các phòng đã chọn">
              {roomGroups.map((slot) => {
                const slotId = slot.slotId ?? `room-${slot.slotIndex}`;
                const room = slot.preferredRoomId ? catalogRoomById.get(slot.preferredRoomId) : undefined;
                return (
                  <li key={slotId} className={styles.dialogRoomItem} data-slot-id={slotId}>
                    <div>
                      <p className={styles.dialogRoomSlot}>
                        {slotLabel(slot.slotIndex)} · {slot.adults} khách
                      </p>
                      {room ? (
                        <p className={styles.dialogRoomName}>
                          {room.name}
                          {room.roomType ? ` · ${room.roomType}` : ""}
                          {room.roomSize ? ` · ${room.roomSize}` : ""}
                        </p>
                      ) : (
                        <p className={styles.dialogRoomEmpty}>Chưa chọn phòng</p>
                      )}
                    </div>
                    <div className={styles.dialogRoomActions}>
                      <button
                        type="button"
                        className={styles.dialogTextBtn}
                        onClick={() => {
                          setActiveSlot(slot.slotIndex);
                          closeBookingDialog();
                        }}
                      >
                        {room ? "Đổi phòng" : "Chọn phòng"}
                      </button>
                      {roomGroups.length > 1 ? (
                        <button
                          type="button"
                          className={styles.dialogTextBtn}
                          onClick={() => handleRemoveRoom(slot.slotIndex)}
                        >
                          Xoá
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>

            {children ? (
              <p className={styles.dialogProviderNote} role="note" data-testid="review-children">
                {children} trẻ em đi cùng (chưa phân vào phòng). {CHILD_POLICY_NOTE}
              </p>
            ) : null}
            <p className={styles.dialogProviderNote} role="note">
              Đặt phòng trực tuyến chưa được kết nối. Đây là yêu cầu chọn phòng ưu tiên trong bản trình diễn: tình trạng phòng trống và việc phân bổ phòng thực tế chưa được xác nhận, chưa có phòng nào được giữ và chưa phát sinh thanh toán.
            </p>
          </div>

          <div className={styles.dialogFoot}>
            <button
              type="button"
              className={styles.dialogSecondaryBtn}
              onClick={() => {
                closeBookingDialog();
                if (!checkIn || !checkOut) {
                  setDateField("checkIn");
                  setCalendarOpen(true);
                }
              }}
            >
              {!checkIn || !checkOut ? "Chọn ngày lưu trú" : "Quay lại chỉnh sửa"}
            </button>

            {checkIn && checkOut && !liveGuidance ? (
              // The same honest step Booking Results leads to: it restates the stay and says nothing is booked.
              <a
                className={styles.selectRoomPrimaryBtn}
                data-testid="continue-property-booking-request"
                href={demoBookingStepFromMultiRoomUrl({ propertySlug: property.slug, checkIn, checkOut, roomGroups, ...(children ? { children } : {}) })}
                onClick={closeBookingDialog}
              >
                Tiếp tục
              </a>
            ) : null}
          </div>
        </div>
      </dialog>}
    </section>
  );
}
