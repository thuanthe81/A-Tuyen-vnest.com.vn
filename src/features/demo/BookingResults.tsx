"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CityId } from "@/content/vnest-workbook/ids";
import { isBefore, type IsoDate } from "@/domain/dates";
import { DateRangeCalendar } from "@/features/booking-search/fields/DateRangeCalendar";
import { formatDay } from "@/features/booking-search/format";
import type { DateField } from "@/features/booking-search/search-form";
import { bookingModeForProperty } from "@/domain/hybrid-booking/booking-mode";
import { describeAvailability } from "@/domain/hybrid-booking/availability-view";
import { staleAvailability } from "@/domain/hybrid-booking/property-availability";
import { Pictogram } from "@/features/property-detail/Pictogram";
import { RoomCardCarousel, RoomCompactMeta } from "@/features/property-detail/RoomCardCarousel";
import { BOOKING_SLOT } from "./BookingCta";
import { demoBookingStepFromMultiRoomUrl, demoPropertyUrlFromMultiRoom } from "./booking-flow";
import type { CatalogProperty, CatalogRoom } from "./booking-results-data";
import {
  assignRoomPreference,
  buildRoomMetaMap,
  clearRoomPreference,
  createRoomSlot,
  evaluateRoomForSlot,
  filterPropertiesForScope,
  MAX_ROOMS,
  parseMultiRoomQuery,
  requestedGuests,
  serializeMultiRoomQuery,
  stayNights,
  summarizeSelectedRoomTypes,
  withOccupancy,
  type MultiRoomSearchState,
} from "./booking-results-state";
import { MAX_GUESTS_PER_ROOM, MAX_ROOMS_PER_STAY, minRoomsFor, occupancyFit, roomsCanGrow, roomsCanShrink } from "@/domain/hybrid-booking/room-occupancy";
import { occupancyNote, occupancySteps } from "./occupancy-copy";
import { CHILD_POLICY_NOTE, CHILDREN_FORM_LIMIT_NOTE, canAddChild, clampChildren } from "@/domain/hybrid-booking/guest-party";
import styles from "./BookingResults.module.css";
import { DemoFooter } from "./DemoFooter";
import { stayKey, stayRequestFromState, type HybridBookingContext } from "./hybrid-results";
import { AvailabilityNote, HandoffPanel, PropertyResultsList } from "./HybridResults";
import hybridStyles from "./HybridResults.module.css";
import { SiteHeader } from "./SiteHeader";

type EditorTab = "property" | "dates" | "rooms";

/** The private-review simulation (`?sim=`) is not part of the search; it rides along so refresh and Back keep it. */
function withReviewParams(query: string): string {
  const sim = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("sim");
  if (!sim) return query;
  const params = new URLSearchParams(query);
  params.set("sim", sim);
  return params.toString();
}

const CITY_FILTER_OPTIONS: readonly { id: CityId | "all"; label: string }[] = [
  { id: "all", label: "Tất cả thành phố" },
  { id: "ho-chi-minh", label: "TP. Hồ Chí Minh" },
  { id: "da-nang", label: "Đà Nẵng" },
];

/**
 * Room detail & gallery modal triggered by "Xem chi tiết" on any room card.
 */
function RoomDetailModal({
  room,
  property,
  canSelect,
  isSelectedForActiveSlot,
  disabledLabel,
  onSelect,
  onUnselect,
}: {
  room: CatalogRoom;
  property: CatalogProperty;
  canSelect: boolean;
  isSelectedForActiveSlot: boolean;
  disabledLabel: string | null;
  onSelect: () => void;
  onUnselect: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const openModal = () => {
    setPhotoIndex(0);
    dialogRef.current?.showModal();
  };

  const currentPhoto = room.photos[photoIndex] ?? room.photos[0];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.roomDetailLink}
        onClick={openModal}
        aria-haspopup="dialog"
      >
        Xem chi tiết phòng
      </button>

      <dialog
        ref={dialogRef}
        className={styles.detailDialog}
        aria-label={`Chi tiết phòng ${room.name}`}
        onClose={() => triggerRef.current?.focus()}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className={styles.detailDialogInner}>
          <div className={styles.detailDialogHead}>
            <div>
              <p className={styles.detailDialogKicker}>
                {property.name} · {property.locationLabel}
              </p>
              <h2 className={styles.detailDialogTitle}>{room.name}</h2>
            </div>
            <button
              type="button"
              className={styles.dialogCloseBtn}
              onClick={() => dialogRef.current?.close()}
            >
              Đóng
            </button>
          </div>

          <div className={styles.detailDialogBody}>
            {currentPhoto?.src ? (
              <div className={styles.detailGallery}>
                <div
                  className={styles.detailMainPhotoWrap}
                  onTouchStart={(e) => {
                    const t = e.touches[0];
                    if (t) swipeRef.current = { x: t.clientX, y: t.clientY };
                  }}
                  onTouchEnd={(e) => {
                    const start = swipeRef.current;
                    swipeRef.current = null;
                    const t = e.changedTouches[0];
                    if (!start || !t || room.photos.length <= 1) return;
                    const dx = t.clientX - start.x;
                    const dy = t.clientY - start.y;
                    if (Math.abs(dx) >= 32 && Math.abs(dx) > Math.abs(dy)) {
                      setPhotoIndex((i) => (dx < 0 ? Math.min(room.photos.length - 1, i + 1) : Math.max(0, i - 1)));
                    }
                  }}
                >
                  <Image
                    src={currentPhoto.src}
                    alt={currentPhoto.alt}
                    width={currentPhoto.width}
                    height={currentPhoto.height}
                    sizes="(min-width: 48rem) 640px, 100vw"
                    className={styles.detailMainPhoto}
                  />
                </div>
                {room.photos.length > 1 ? (
                  <div className={styles.detailGalleryControls}>
                    <button
                      type="button"
                      className={styles.galleryNavBtn}
                      disabled={photoIndex === 0}
                      onClick={() => setPhotoIndex((i) => Math.max(0, i - 1))}
                      aria-label="Ảnh trước"
                    >
                      ← Ảnh trước
                    </button>
                    <span className={styles.galleryCounter} aria-live="polite">
                      {photoIndex + 1} / {room.photos.length}
                    </span>
                    <button
                      type="button"
                      className={styles.galleryNavBtn}
                      disabled={photoIndex === room.photos.length - 1}
                      onClick={() => setPhotoIndex((i) => Math.min(room.photos.length - 1, i + 1))}
                      aria-label="Ảnh sau"
                    >
                      Ảnh sau →
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className={styles.detailFactsSection}>
              <RoomCompactMeta specs={room.specs} />

              {property.amenities.length > 0 ? (
                <div className={styles.detailAmenities}>
                  <p className={styles.detailSectionLabel}>Tiện nghi tại {property.name}</p>
                  <ul className={styles.amenitiesList}>
                    {property.amenities.map((amenity) => (
                      <li key={amenity.id}>
                        <Pictogram icon={amenity.icon} label={amenity.label} size={16} />
                        <span>{amenity.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.detailDialogFoot}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => dialogRef.current?.close()}
            >
              Đóng
            </button>
            {isSelectedForActiveSlot ? (
              <button
                type="button"
                className={styles.selectedActionBtn}
                onClick={() => {
                  onUnselect();
                  dialogRef.current?.close();
                }}
              >
                Đã chọn · Bỏ chọn
              </button>
            ) : canSelect ? (
              <button
                type="button"
                className={styles.primaryActionBtn}
                onClick={() => {
                  onSelect();
                  dialogRef.current?.close();
                }}
              >
                Chọn phòng này
              </button>
            ) : (
              <button type="button" disabled className={styles.disabledActionBtn}>
                {disabledLabel ?? "Không khả dụng"}
              </button>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}

export function BookingResults({
  catalog,
  initialState,
  today,
  booking,
}: {
  catalog: readonly CatalogProperty[];
  initialState: MultiRoomSearchState;
  today: IsoDate;
  booking: HybridBookingContext;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // The address is the search. Back/forward can restore this page from a render made for its ORIGINAL address,
  // before rooms or dates were edited here (replaceState, which Next syncs into useSearchParams), so the state is
  // read from the router's current search params. On a first load they are the server's query, so hydration matches.
  const searchParams = useSearchParams();
  const [searchState, setSearchState] = useState<MultiRoomSearchState>(() => {
    if (!searchParams) return initialState;
    const params = Object.fromEntries(searchParams.entries());
    return parseMultiRoomQuery(
      params,
      catalog.map((p) => p.id),
      new Set(catalog.flatMap((p) => p.rooms.map((r) => r.id))),
      buildRoomMetaMap(catalog),
    );
  });
  const [activeSlot, setActiveSlot] = useState<number>(
    () => searchState.roomGroups.find((g) => g.preferredRoomId === null)?.slotIndex ?? 1,
  );
  const [cityFilter, setCityFilter] = useState<CityId | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTab, setEditorTab] = useState<EditorTab>("dates");
  const [dateField, setDateField] = useState<DateField>("checkIn");
  /** Why a room could not be added or removed (never a silent change); cleared by the next change. */
  const [roomNotice, setRoomNotice] = useState<string | null>(null);

  const reviewDialogRef = useRef<HTMLDialogElement>(null);
  const reviewTriggerRef = useRef<HTMLButtonElement>(null);

  const roomMetaById = useMemo(() => buildRoomMetaMap(catalog), [catalog]);
  const validPropertySlugs = useMemo(() => catalog.map((p) => p.id), [catalog]);
  const validRoomIds = useMemo(
    () => new Set(catalog.flatMap((p) => p.rooms.map((r) => r.id))),
    [catalog],
  );

  // Keep URL query parameters synchronized with the current multi-room state without triggering a server reload.
  useEffect(() => {
    const query = withReviewParams(serializeMultiRoomQuery(searchState));
    const nextUrl = `${window.location.pathname}?${query}`;
    if (window.location.search !== `?${query}`) {
      // Keep the router's own entry state: replacing it with null leaves Next unable to restore this page on Back.
      window.history.replaceState(window.history.state, "", nextUrl);
    }
  }, [searchState]);

  // Synchronize state when navigating via browser Back / Forward (popstate).
  useEffect(() => {
    const onPopState = () => {
      const params = Object.fromEntries(new URLSearchParams(window.location.search));
      const parsed = parseMultiRoomQuery(params, validPropertySlugs, validRoomIds, roomMetaById);
      setSearchState(parsed);
      setActiveSlot(parsed.roomGroups.find((g) => g.preferredRoomId === null)?.slotIndex ?? 1);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [validPropertySlugs, validRoomIds, roomMetaById]);

  const allRoomsById = useMemo(() => {
    const map = new Map<string, { room: CatalogRoom; property: CatalogProperty }>();
    for (const property of catalog) {
      for (const room of property.rooms) {
        map.set(room.id, { room, property });
      }
    }
    return map;
  }, [catalog]);

  // If the guest searched "All Properties" and has selected at least one room at a property,
  // keep subsequent selections within that same property by default so a single reservation
  // never silently combines rooms from different properties.
  const lockedReservationProperty = useMemo(() => {
    if (searchState.propertySlug) {
      return catalog.find((p) => p.id === searchState.propertySlug) ?? null;
    }
    for (const group of searchState.roomGroups) {
      if (group.preferredRoomId) {
        const entry = allRoomsById.get(group.preferredRoomId);
        if (entry) return entry.property;
      }
    }
    return null;
  }, [catalog, searchState.propertySlug, searchState.roomGroups, allRoomsById]);

  const effectivePropertySlug = searchState.propertySlug ?? lockedReservationProperty?.id ?? null;

  const visibleProperties = useMemo(
    () => filterPropertiesForScope(catalog, effectivePropertySlug, cityFilter),
    [catalog, effectivePropertySlug, cityFilter],
  );

  const visibleRooms = useMemo(
    () =>
      visibleProperties.flatMap((property) =>
        property.rooms.map((room) => ({ room, property })),
      ),
    [visibleProperties],
  );

  const selectedProperty = useMemo(
    () => (searchState.propertySlug ? catalog.find((p) => p.id === searchState.propertySlug) ?? null : null),
    [catalog, searchState.propertySlug],
  );

  // Hybrid booking: what the page shows depends on the property's booking mode, never on a provider name.
  const selectedMode = bookingModeForProperty(searchState.propertySlug);
  const showPropertyList = searchState.propertySlug === null;
  const showHandoff = selectedMode === "external-handoff" && selectedProperty !== null;
  const nativeWorkspace = !showPropertyList && !showHandoff;
  const currentStay = stayRequestFromState(searchState);
  // Answers were checked for the stay in the address when the page loaded; a changed stay is not verified.
  const stale = stayKey(currentStay) !== booking.stayKey;
  const canRecheck =
    stale &&
    Object.values(booking.states).some(
      (state) =>
        state.status === "available" ||
        state.status === "unavailable" ||
        state.status === "error" ||
        (state.status === "needs-provider-check" &&
          (state.reason === "dates-required" || state.reason === "occupancy-correction" || state.reason === "children-policy")),
    );
  const nights = stayNights(searchState);
  // The guest total asked for (an outdated address that does not fit its rooms keeps its own until corrected).
  const totalAdults = requestedGuests(searchState);
  const roomCount = searchState.roomGroups.length;
  const fit = occupancyFit(totalAdults, roomCount);
  const steps = occupancySteps(totalAdults, roomCount);
  // Children travel apart from the adults and the room rule (guest-party.ts): shown, carried, never allocated to rooms.
  const children = searchState.children ?? 0;
  const guestsText = children ? `${totalAdults} người lớn · ${children} trẻ em` : `${totalAdults} khách`;
  const selectedRoomsCount = searchState.roomGroups.filter((g) => g.preferredRoomId !== null).length;

  const currentSlotObj =
    searchState.roomGroups.find((g) => g.slotIndex === activeSlot) ?? searchState.roomGroups[0]!;

  const selectedRoomTypeSummaries = useMemo(
    () => summarizeSelectedRoomTypes(searchState.roomGroups, allRoomsById),
    [searchState.roomGroups, allRoomsById],
  );

  // Count how many unselected rooms in the current scope are eligible for the active slot.
  const eligibleRemainingForActiveSlot = useMemo(() => {
    return visibleRooms.filter(({ room }) => {
      const ev = evaluateRoomForSlot(room, currentSlotObj, searchState.roomGroups);
      return ev.canSelect && !ev.isSelectedForSlot;
    }).length;
  }, [visibleRooms, currentSlotObj, searchState.roomGroups]);

  function handleSelectProperty(slug: string | null, pushHistory = false) {
    if (slug) {
      const targetProp = catalog.find((p) => p.id === slug);
      if (targetProp && cityFilter && targetProp.cityId !== cityFilter) {
        setCityFilter(null);
      }
    }
    // Computed from the current state, not inside an updater: an updater may run twice (StrictMode),
    // and a history entry must be pushed exactly once so browser Back returns to the previous view.
    // Safely reconcile incompatible selections when changing property:
    // keep only room preferences that belong to the newly selected property.
    const nextGroups = searchState.roomGroups.map((group) => {
      if (!group.preferredRoomId) return group;
      if (!slug) return createRoomSlot(group.slotIndex, group.adults, null);
      const entry = allRoomsById.get(group.preferredRoomId);
      return entry?.property.id === slug ? group : createRoomSlot(group.slotIndex, group.adults, null);
    });
    const nextState: MultiRoomSearchState = { ...searchState, propertySlug: slug, roomGroups: nextGroups };
    if (pushHistory && typeof window !== "undefined") {
      const query = withReviewParams(serializeMultiRoomQuery(nextState));
      window.history.pushState(window.history.state, "", `${window.location.pathname}?${query}`);
    }
    setActiveSlot(nextGroups.find((g) => g.preferredRoomId === null)?.slotIndex ?? 1);
    setSearchState(nextState);
    setEditorOpen(false);
  }

  function handleSelectCity(nextCity: CityId | "all") {
    const resolved = nextCity === "all" ? null : nextCity;
    setCityFilter(resolved);
    if (resolved && searchState.propertySlug) {
      const currentProp = catalog.find((p) => p.id === searchState.propertySlug);
      if (currentProp && currentProp.cityId !== resolved) {
        handleSelectProperty(null, true);
      }
    }
  }

  function handlePickDate(picked: IsoDate) {
    setSearchState((prev) => {
      if (dateField === "checkIn" || !prev.checkIn || !isBefore(prev.checkIn, picked)) {
        setDateField("checkOut");
        return {
          ...prev,
          checkIn: picked,
          checkOut: prev.checkOut && isBefore(picked, prev.checkOut) ? prev.checkOut : undefined,
        };
      }
      setEditorOpen(false);
      return {
        ...prev,
        checkOut: picked,
      };
    });
  }

  /** An explicit change of guests and rooms (the guest's own); chosen rooms stay in order. */
  function applyOccupancy(guests: number, rooms: number, dropSlotIndex?: number) {
    const nextState = withOccupancy(searchState, guests, rooms, dropSlotIndex);
    setSearchState(nextState);
    setActiveSlot(nextState.roomGroups.find((g) => g.preferredRoomId === null)?.slotIndex ?? 1);
    setRoomNotice(null);
  }

  /** An explicit change of children; adults, rooms and chosen rooms stay as they are. */
  function applyChildren(next: number) {
    const { children: _previous, ...rest } = searchState;
    void _previous;
    const count = clampChildren(next);
    setSearchState(count ? { ...rest, children: count } : rest);
  }

  /** Adds a room for the same guests; explains when there is no guest for it. */
  function handleAddRoom() {
    if (!roomsCanGrow(totalAdults, roomCount)) {
      setRoomNotice(
        roomCount >= MAX_ROOMS
          ? `Mỗi yêu cầu tối đa ${MAX_ROOMS} phòng.`
          : `Mỗi phòng cần ít nhất 1 khách: ${totalAdults} khách dùng được tối đa ${totalAdults} phòng. Tăng số khách để thêm phòng.`,
      );
      return;
    }
    applyOccupancy(totalAdults, roomCount + 1);
  }

  /** Removes a room when the other rooms hold every guest; otherwise explains and changes nothing. */
  function handleRemoveRoom(slotIndex: number) {
    if (roomCount <= 1) return;
    if (!roomsCanShrink(totalAdults, roomCount)) {
      setRoomNotice(
        `${totalAdults} khách cần ít nhất ${minRoomsFor(totalAdults)} phòng (mỗi phòng tối đa ${MAX_GUESTS_PER_ROOM} khách). Giảm số khách trước khi bớt phòng.`,
      );
      return;
    }
    applyOccupancy(totalAdults, roomCount - 1, slotIndex);
  }

  function handleAssignRoom(slotIndex: number, room: CatalogRoom) {
    setSearchState((prev) => {
      const { groups, assigned, nextActiveSlot } = assignRoomPreference(prev.roomGroups, slotIndex, room);
      if (assigned) setActiveSlot(nextActiveSlot);
      return { ...prev, roomGroups: groups };
    });
  }

  function handleUnassignRoom(slotIndex: number) {
    setSearchState((prev) => ({
      ...prev,
      roomGroups: clearRoomPreference(prev.roomGroups, slotIndex),
    }));
    setActiveSlot(slotIndex);
  }

  function recheckAvailability() {
    router.push(`${pathname}?${withReviewParams(serializeMultiRoomQuery(searchState))}`);
  }

  function detailHrefFor(propertyId: string, hash?: string): string | undefined {
    // The property page (its top, unless a section is asked for) keeps the stay; room preferences from other properties are not carried.
    const clean: MultiRoomSearchState = {
      ...searchState,
      roomGroups: searchState.roomGroups.map((g) => createRoomSlot(g.slotIndex, g.adults, null)),
    };
    return demoPropertyUrlFromMultiRoom(propertyId, clean, hash);
  }

  function openReviewDialog() {
    reviewDialogRef.current?.showModal();
  }

  function openEditorOn(tab: EditorTab) {
    setEditorTab(tab);
    if (tab === "dates") setDateField("checkIn");
    setEditorOpen(true);
  }

  const conciseDates =
    searchState.checkIn && searchState.checkOut
      ? `${formatDay(searchState.checkIn)} – ${formatDay(searchState.checkOut)}${nights ? ` (${nights} đêm)` : ""}`
      : searchState.checkIn
        ? `${formatDay(searchState.checkIn)} – Chọn ngày trả`
        : "Chọn ngày";

  const conciseProperty = selectedProperty
    ? selectedProperty.name
    : lockedReservationProperty
      ? `${lockedReservationProperty.name} (đang chọn)`
      : "Tất cả nơi lưu trú";
  const conciseSummary = `${conciseProperty} · ${conciseDates} · ${searchState.roomGroups.length} phòng · ${guestsText}`;

  const filterPropertiesList = useMemo(
    () => (cityFilter ? catalog.filter((p) => p.cityId === cityFilter) : catalog),
    [catalog, cityFilter],
  );

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <div className={styles.container}>
          {/* 1. Compact Header + One Provider Status Notice */}
          <header className={styles.pageHeader} id="dat-phong" {...{ [BOOKING_SLOT]: "results" }}>
            <div className={styles.headerTopRow}>
              <div>
                <h1 className={styles.pageTitle}>
                  {showPropertyList ? "Nơi lưu trú VNest" : showHandoff ? "Kiểm tra giá & đặt phòng" : "Chọn phòng"}
                </h1>
                <p className={styles.conciseSummary} data-testid="search-summary">
                  {conciseSummary}
                </p>
              </div>

              <button
                type="button"
                className={styles.editSearchBtn}
                data-field={!editorOpen ? "property checkIn checkOut guests" : undefined}
                aria-expanded={editorOpen}
                onClick={() => setEditorOpen((open) => !open)}
              >
                {editorOpen ? "Đóng" : "Chỉnh sửa ngày & tìm kiếm"}
              </button>
            </div>

            {/* Single compact provider-status notice at page level (never repeated on cards) */}
            <p className={styles.compactNotice} role="note">
              Giá và tình trạng phòng được xác nhận riêng cho từng nơi lưu trú.
            </p>

            {/* Collapsible Search Editor */}
            {editorOpen ? (
              <form
                role="search"
                aria-label="Chỉnh sửa tìm kiếm"
                className={styles.editorSheet}
                onSubmit={(e) => {
                  e.preventDefault();
                  setEditorOpen(false);
                }}
              >
                <div className={styles.editorTabs} role="tablist" aria-label="Mục chỉnh sửa">
                  <button
                    type="button"
                    role="tab"
                    data-field="property"
                    aria-selected={editorTab === "property"}
                    className={styles.editorTabBtn}
                    onClick={() => setEditorTab("property")}
                  >
                    <span className={styles.editorTabLabel}>Nơi lưu trú</span>
                    <span className={styles.editorTabValue}>{conciseProperty}</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    data-field="checkIn checkOut"
                    aria-selected={editorTab === "dates"}
                    className={styles.editorTabBtn}
                    onClick={() => {
                      setDateField("checkIn");
                      setEditorTab("dates");
                    }}
                  >
                    <span className={styles.editorTabLabel}>Ngày lưu trú</span>
                    <span className={styles.editorTabValue}>{conciseDates}</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    data-field="guests rooms"
                    aria-selected={editorTab === "rooms"}
                    className={styles.editorTabBtn}
                    onClick={() => setEditorTab("rooms")}
                  >
                    <span className={styles.editorTabLabel}>Phòng &amp; khách</span>
                    <span className={styles.editorTabValue}>
                      {searchState.roomGroups.length} phòng · {guestsText}
                    </span>
                  </button>
                </div>

                {editorTab === "property" ? (
                  <div className={styles.editorBody} role="tabpanel" aria-label="Chọn nơi lưu trú">
                    <ul className={styles.propertyOptionGrid}>
                      <li>
                        <button
                          type="button"
                          className={styles.propertyOptionBtn}
                          aria-pressed={searchState.propertySlug === null}
                          onClick={() => handleSelectProperty(null, true)}
                        >
                          <span className={styles.propertyOptionName}>Tất cả nơi lưu trú</span>
                          <span className={styles.propertyOptionMeta}>TP. Hồ Chí Minh &amp; Đà Nẵng</span>
                        </button>
                      </li>
                      {catalog.map((prop) => (
                        <li key={prop.id}>
                          <button
                            type="button"
                            className={styles.propertyOptionBtn}
                            aria-pressed={searchState.propertySlug === prop.id}
                            onClick={() => handleSelectProperty(prop.id, true)}
                          >
                            <span className={styles.propertyOptionName}>{prop.name}</span>
                            <span className={styles.propertyOptionMeta}>{prop.locationLabel}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {editorTab === "dates" ? (
                  <div className={styles.editorBody} role="tabpanel" aria-label="Chọn ngày nhận và trả phòng">
                    <div className={styles.calendarWrap}>
                      <DateRangeCalendar
                        today={today}
                        checkIn={searchState.checkIn}
                        checkOut={searchState.checkOut}
                        activeField={dateField}
                        onPick={handlePickDate}
                        layout="paged"
                        months={1}
                      />
                    </div>
                  </div>
                ) : null}

                {editorTab === "rooms" ? (
                  <div className={styles.editorBody} role="tabpanel" aria-label="Thiết lập số phòng và số khách">
                    {/* One guest-total stepper and one room-count stepper (owner correction, 5/11/2026); the per-room split is internal. */}
                    <ul className={styles.roomGroupList}>
                      {(
                        [
                          { key: "guests", label: "Người lớn", value: `${totalAdults} người lớn`, down: steps.guestsDown, up: steps.guestsUp, onDown: () => applyOccupancy(totalAdults - 1, roomCount), onUp: () => applyOccupancy(totalAdults + 1, roomCount), downLabel: "Bớt một người lớn", upLabel: "Thêm một người lớn" },
                          { key: "children", label: "Trẻ em", value: `${children} trẻ em`, down: children > 0, up: canAddChild(children), onDown: () => applyChildren(children - 1), onUp: () => applyChildren(children + 1), downLabel: "Bớt một trẻ em", upLabel: "Thêm một trẻ em" },
                          { key: "rooms", label: "Phòng", value: `${roomCount} phòng`, down: steps.roomsDown, up: steps.roomsUp, onDown: () => applyOccupancy(totalAdults, roomCount - 1), onUp: () => applyOccupancy(totalAdults, roomCount + 1), downLabel: "Bớt một phòng", upLabel: "Thêm một phòng" },
                        ] as const
                      ).map((row) => (
                        <li key={row.key} className={styles.roomGroupItem}>
                          <span className={styles.roomGroupTitle}>{row.label}</span>
                          <div className={styles.roomGroupControls}>
                            <div className={styles.stepperGroup} role="group" aria-label={row.label}>
                              <button type="button" className={styles.stepperBtn} disabled={!row.down} aria-label={row.downLabel} onClick={row.onDown}>
                                −
                              </button>
                              <span className={styles.stepperCount} aria-live="polite" data-testid={`editor-${row.key}-value`}>
                                {row.value}
                              </span>
                              <button type="button" className={styles.stepperBtn} disabled={!row.up} aria-label={row.upLabel} onClick={row.onUp}>
                                +
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className={styles.editorFooterRow}>
                      <button
                        type="button"
                        className={styles.primaryActionBtn}
                        onClick={() => setEditorOpen(false)}
                      >
                        Áp dụng
                      </button>
                    </div>
                    <p className={styles.compactNotice} data-testid="rooms-guests-note" aria-live="polite">
                      {occupancyNote(totalAdults, roomCount)}
                    </p>
                    {children ? (
                      <p className={styles.compactNotice} data-testid="child-policy-note">
                        {CHILD_POLICY_NOTE}
                      </p>
                    ) : null}
                    {!canAddChild(children) ? (
                      <p className={styles.compactNotice} data-testid="children-form-limit-note">
                        {CHILDREN_FORM_LIMIT_NOTE}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </form>
            ) : null}

            {/* TASK 1: Inline City & Property Filter Bar (allows filtering without navigating away) */}
            <nav aria-label="Lọc theo thành phố và cơ sở" className={styles.filterToolbar}>
              <div className={styles.filterRow}>
                <span className={styles.filterLabel}>Thành phố:</span>
                <div className={styles.filterChips} role="group" aria-label="Lọc thành phố">
                  {CITY_FILTER_OPTIONS.map((opt) => {
                    const active = (cityFilter ?? "all") === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={styles.filterChip}
                        aria-pressed={active}
                        onClick={() => handleSelectCity(opt.id)}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.filterRow}>
                <span className={styles.filterLabel}>Cơ sở:</span>
                <div className={styles.filterChips} role="group" aria-label="Lọc cơ sở lưu trú">
                  <button
                    type="button"
                    className={styles.filterChip}
                    aria-pressed={searchState.propertySlug === null}
                    onClick={() => handleSelectProperty(null, true)}
                  >
                    Tất cả cơ sở
                  </button>
                  {filterPropertiesList.map((prop) => (
                    <button
                      key={prop.id}
                      type="button"
                      className={styles.filterChip}
                      aria-pressed={searchState.propertySlug === prop.id}
                      onClick={() => handleSelectProperty(prop.id, true)}
                    >
                      {prop.name}
                    </button>
                  ))}
                </div>
              </div>
            </nav>
          </header>

          {booking.simulationActive ? (
            <p className={hybridStyles.simulationBanner} role="note" data-testid="simulation-banner">
              Đang xem trước với tình trạng phòng mô phỏng. Dữ liệu này không phải của nhà cung cấp và không phải giá thật.
            </p>
          ) : null}
          {stale && canRecheck ? (
            <div className={hybridStyles.staleBar} role="status" data-testid="stale-bar">
              <span>Ngày hoặc số khách đã thay đổi. Kết quả bên dưới chưa được kiểm tra lại.</span>
              <button type="button" className={hybridStyles.primary} onClick={recheckAvailability}>
                Cập nhật kết quả
              </button>
            </div>
          ) : null}

          {/* An outdated or edited address whose guests do not fit its rooms: shown as it is, with two explicit fixes. */}
          {fit.kind !== "fits" ? (
            <div className={hybridStyles.staleBar} role="status" data-testid="occupancy-correction">
              <span>
                {fit.kind === "over"
                  ? `Yêu cầu này có ${totalAdults} khách cho ${roomCount} phòng, nhưng mỗi phòng tối đa ${MAX_GUESTS_PER_ROOM} khách.`
                  : `Yêu cầu này có ${roomCount} phòng cho ${totalAdults} khách, nhưng mỗi phòng cần ít nhất 1 khách.`}{" "}
                Chọn một cách điều chỉnh:
              </span>
              {fit.kind === "over" ? (
                <>
                  {fit.minRooms <= MAX_ROOMS_PER_STAY ? (
                    <button type="button" className={hybridStyles.primary} data-testid="correct-add-rooms" onClick={() => applyOccupancy(totalAdults, fit.minRooms)}>
                      Dùng {fit.minRooms} phòng cho {totalAdults} khách
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={hybridStyles.primary}
                    data-testid="correct-fewer-guests"
                    onClick={() => applyOccupancy(roomCount * MAX_GUESTS_PER_ROOM, roomCount)}
                  >
                    Giữ {roomCount} phòng, {roomCount * MAX_GUESTS_PER_ROOM} khách
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className={hybridStyles.primary} data-testid="correct-fewer-rooms" onClick={() => applyOccupancy(totalAdults, totalAdults)}>
                    Dùng {totalAdults} phòng cho {totalAdults} khách
                  </button>
                  <button type="button" className={hybridStyles.primary} data-testid="correct-more-guests" onClick={() => applyOccupancy(roomCount, roomCount)}>
                    Giữ {roomCount} phòng, {roomCount} khách
                  </button>
                </>
              )}
            </div>
          ) : null}

          {showPropertyList ? (
            <PropertyResultsList
              properties={filterPropertiesList}
              states={booking.states}
              stale={stale}
              stay={currentStay}
              actions={{
                onOpen: (id) => handleSelectProperty(id, true),
                onEditDates: () => openEditorOn("dates"),
                onRetry: () => router.refresh(),
                detailHref: (id) => detailHrefFor(id),
              }}
            />
          ) : showHandoff && selectedProperty ? (
            <HandoffPanel
              property={selectedProperty}
              stay={currentStay}
              summary={conciseSummary}
              detailHref={detailHrefFor(selectedProperty.id, "rooms")}
              onEditDates={() => openEditorOn("dates")}
            />
          ) : null}

          {/* Native booking (GoHost): room-by-room selection inside VNest. */}
          {nativeWorkspace ? (
          <div className={styles.workspace}>
            <div className={styles.resultsColumn}>
              {selectedProperty ? (
                <AvailabilityNote
                  view={describeAvailability(stale ? staleAvailability(booking.states[selectedProperty.id]!) : booking.states[selectedProperty.id]!)}
                  onRetry={() => router.refresh()}
                />
              ) : null}
              {/* Active Room Group & Direct "+ Thêm phòng" Bar */}
              <section aria-label="Tiến trình chọn phòng" className={styles.sequentialBar}>
                <div className={styles.sequentialHeaderRow}>
                  <div className={styles.sequentialPrimary}>
                    <p className={styles.sequentialStepTitle} data-testid="active-room-indicator">
                      Đang chọn phòng {currentSlotObj.slotIndex}/{searchState.roomGroups.length}
                    </p>
                  </div>

                  {/* Direct "+ Thêm phòng" action without reopening search editor (Task 3) */}
                  <button
                    type="button"
                    className={styles.directAddRoomBtn}
                    data-testid="direct-add-room-top"
                    onClick={handleAddRoom}
                  >
                    + Thêm phòng
                  </button>
                </div>
                <p className={styles.compactNotice} role="status" aria-live="polite" data-testid="results-room-notice">
                  {roomNotice}
                </p>

                {/* Room group pills when multi-room is active */}
                {searchState.roomGroups.length > 1 ? (
                  <div className={styles.sequentialPills} role="list" aria-label="Các phòng trong yêu cầu">
                    {searchState.roomGroups.map((group) => {
                      const assigned = group.preferredRoomId ? allRoomsById.get(group.preferredRoomId)?.room : null;
                      const isActive = group.slotIndex === currentSlotObj.slotIndex;
                      return (
                        <div
                          key={group.slotIndex}
                          role="listitem"
                          className={styles.sequentialPill}
                          data-active={isActive}
                          data-filled={Boolean(assigned)}
                        >
                          <button
                            type="button"
                            className={styles.sequentialPillBtn}
                            aria-pressed={isActive}
                            onClick={() => setActiveSlot(group.slotIndex)}
                          >
                            <span className={styles.sequentialPillLabel}>
                              Phòng {group.slotIndex} ({group.adults} khách)
                            </span>
                            <span className={styles.sequentialPillValue}>
                              {assigned ? assigned.name : "Chưa chọn"}
                            </span>
                          </button>
                          {assigned ? (
                            <button
                              type="button"
                              className={styles.sequentialPillClear}
                              aria-label={`Bỏ chọn ${assigned.name} khỏi Phòng ${group.slotIndex}`}
                              onClick={() => handleUnassignRoom(group.slotIndex)}
                            >
                              ×
                            </button>
                          ) : searchState.roomGroups.length > 1 ? (
                            <button
                              type="button"
                              className={styles.sequentialPillClear}
                              aria-label={`Xoá Phòng ${group.slotIndex}`}
                              onClick={() => handleRemoveRoom(group.slotIndex)}
                            >
                              ×
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {/* Single-property reservation scope notice when user started from All Properties and picked a room */}
                {!searchState.propertySlug && lockedReservationProperty ? (
                  <div className={styles.propertyLockBanner} role="status">
                    <span>
                      Đang hiển thị phòng tại <strong>{lockedReservationProperty.name}</strong> để giữ cùng một cơ sở cho kỳ lưu trú.
                    </span>
                    <button
                      type="button"
                      className={styles.textLinkBtn}
                      onClick={() => handleSelectProperty(null, true)}
                    >
                      Xem tất cả cơ sở (đặt lại lựa chọn)
                    </button>
                  </div>
                ) : null}

                {/* Insufficient eligible unique physical rooms notice */}
                {currentSlotObj.preferredRoomId === null && eligibleRemainingForActiveSlot === 0 ? (
                  <div className={styles.insufficientRoomsNotice} role="status">
                    <p>
                      Không còn phòng phù hợp tại {lockedReservationProperty?.name ?? "cơ sở đã chọn"} cho Phòng{" "}
                      {currentSlotObj.slotIndex} ({currentSlotObj.adults} khách).
                    </p>
                    {searchState.roomGroups.length > 1 ? (
                      <button
                        type="button"
                        className={styles.textLinkBtn}
                        onClick={() => handleRemoveRoom(currentSlotObj.slotIndex)}
                      >
                        Xoá Phòng {currentSlotObj.slotIndex}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </section>

              {/* TASK 1, 2 & 4: Room Results List (Shown Immediately for All Properties or Single Property) */}
              <ul className={styles.roomCardList} aria-label="Danh sách phòng">
                {visibleRooms.map(({ room, property }) => {
                  const activeEval = evaluateRoomForSlot(room, currentSlotObj, searchState.roomGroups);
                  const isSelectedForActive = activeEval.isSelectedForSlot;
                  const isSelectedInAnySlot = activeEval.assignedSlots.length > 0;
                  const exceedsCapacity = activeEval.capacity.kind === "exceeds-verified-capacity";

                  const disabledReasonLabel =
                    activeEval.capacity.kind === "exceeds-verified-capacity"
                      ? `Tối đa ${activeEval.capacity.maxAdults} khách`
                      : !activeEval.canSelect
                        ? "Không khả dụng"
                        : null;

                  return (
                    <li
                      key={room.id}
                      id={`phong-${room.id}`}
                      className={styles.roomCard}
                      data-property={property.id}
                    >
                      <div className={styles.roomMediaCol}>
                        <RoomCardCarousel
                          roomName={room.name}
                          photos={room.photos}
                          sizes="(min-width: 64rem) 360px, (min-width: 44rem) 42vw, 100vw"
                          className={styles.roomCardCarousel}
                        />
                      </div>

                      <div className={styles.roomContentCol}>
                        <div className={styles.roomMainInfo}>
                          {/* Property and city compact metadata on every room card */}
                          <p className={styles.roomPropertyKicker}>
                            {property.name} · {property.locationLabel}
                            {isSelectedInAnySlot
                              ? ` · Đã chọn ở Phòng ${activeEval.assignedSlots.join(", ")}`
                              : ""}
                          </p>

                          <h2 className={styles.roomName}>{room.name}</h2>

                          {/* Verified room category, size, and capacity with compact icons */}
                          <RoomCompactMeta specs={room.specs} className={styles.roomMetaLines} />

                          {/* Provider-confirmed rate & availability when connected */}
                          {room.ratePlan ? (
                            <p className={styles.roomRateLine}>
                              {room.ratePlan.totalStayPrice.toLocaleString("vi-VN")} {room.ratePlan.currency}
                            </p>
                          ) : null}
                          {room.availableUnits !== null ? (
                            <p className={styles.roomAvailLine}>Còn {room.availableUnits} phòng trống</p>
                          ) : null}

                          {exceedsCapacity ? (
                            <p className={styles.roomCapacityLimit}>
                              Phòng {currentSlotObj.slotIndex} ({currentSlotObj.adults} khách) vượt mức tối đa{" "}
                              {room.verifiedMaxAdults} khách.
                            </p>
                          ) : null}

                          <RoomDetailModal
                            room={room}
                            property={property}
                            canSelect={activeEval.canSelect}
                            isSelectedForActiveSlot={isSelectedForActive}
                            disabledLabel={disabledReasonLabel}
                            onSelect={() => handleAssignRoom(currentSlotObj.slotIndex, room)}
                            onUnselect={() => handleUnassignRoom(currentSlotObj.slotIndex)}
                          />
                        </div>

                        {/* One primary "Chọn phòng" button that remains selectable for every active slot */}
                        <div className={styles.roomActionRow}>
                          {activeEval.capacity.kind === "exceeds-verified-capacity" ? (
                            <button
                              type="button"
                              disabled
                              className={styles.disabledActionBtn}
                            >
                              Tối đa {activeEval.capacity.maxAdults} khách
                            </button>
                          ) : !activeEval.canSelect ? (
                            <button
                              type="button"
                              disabled
                              className={styles.disabledActionBtn}
                            >
                              {disabledReasonLabel ?? "Không khả dụng"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={styles.primaryActionBtn}
                              onClick={() => handleAssignRoom(currentSlotObj.slotIndex, room)}
                            >
                              Chọn phòng
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* TASK 5: Simplified Desktop Sticky Booking Summary */}
            <aside className={styles.summarySidebar} aria-label="Tóm tắt lựa chọn phòng">
              <div className={styles.summaryCard}>
                <div className={styles.summaryHeaderRow}>
                  <h2 className={styles.summaryTitle}>
                    {selectedRoomsCount}/{searchState.roomGroups.length} phòng đã chọn
                  </h2>
                  <span className={styles.summaryGuestTotal}>{guestsText}</span>
                </div>

                {/* Selected Room Types & Quantities Summary (Task 4 & Task 5) */}
                {selectedRoomTypeSummaries.length > 0 ? (
                  <div className={styles.summaryTypeList} aria-label="Tổng hợp theo hạng phòng">
                    {selectedRoomTypeSummaries.map((item) => (
                      <div key={item.groupKey} className={styles.summaryTypeBadge}>
                        <span className={styles.summaryTypeQty}>
                          {item.quantity} × {item.roomTypeLabel}
                        </span>
                        <span className={styles.summaryTypeProp}>{item.propertyName}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                <ul className={styles.summarySlotsList}>
                  {searchState.roomGroups.map((slot) => {
                    const entry = slot.preferredRoomId ? allRoomsById.get(slot.preferredRoomId) : undefined;
                    const isActive = slot.slotIndex === currentSlotObj.slotIndex;

                    return (
                      <li
                        key={slot.slotIndex}
                        className={styles.summarySlotItem}
                        data-active={isActive}
                        data-filled={entry !== undefined}
                      >
                        <div className={styles.summarySlotHeader}>
                          <button
                            type="button"
                            className={styles.summarySlotSelectBtn}
                            onClick={() => setActiveSlot(slot.slotIndex)}
                          >
                            Phòng {slot.slotIndex}
                          </button>

                          <div className={styles.summarySlotActions}>
                            {entry ? (
                              <button
                                type="button"
                                className={styles.summarySlotClearBtn}
                                aria-label={`Bỏ chọn phòng cho Phòng ${slot.slotIndex}`}
                                onClick={() => handleUnassignRoom(slot.slotIndex)}
                              >
                                Đổi
                              </button>
                            ) : null}
                            {searchState.roomGroups.length > 1 ? (
                              <button
                                type="button"
                                className={styles.summarySlotRemoveBtn}
                                aria-label={`Xoá Phòng ${slot.slotIndex}`}
                                onClick={() => handleRemoveRoom(slot.slotIndex)}
                              >
                                Xoá
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {entry ? (
                          <div className={styles.summarySlotSelected}>
                            <p className={styles.summaryRoomName}>{entry.room.name}</p>
                            <p className={styles.summaryRoomSub}>
                              {entry.property.name}
                              {entry.room.roomType ? ` · Hạng ${entry.room.roomType}` : ""}
                            </p>
                          </div>
                        ) : (
                          <p className={styles.summarySlotPlaceholder}>
                            {isActive ? "Đang chọn phòng từ danh sách..." : "Chưa chọn phòng"}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {/* Prominent, minimal "+ Thêm phòng" action directly inside the summary (Task 3 & Task 5) */}
                <button
                  type="button"
                  className={styles.summaryAddRoomBtn}
                  data-testid="summary-add-room"
                  onClick={handleAddRoom}
                >
                  + Thêm phòng
                </button>

                <button
                  ref={reviewTriggerRef}
                  type="button"
                  className={styles.reviewCtaBtn}
                  onClick={openReviewDialog}
                >
                  Xem lại lựa chọn
                </button>
              </div>
            </aside>
          </div>
          ) : null}
        </div>

        {/* TASK 5: Mobile & Tablet Minimal Sticky Bottom Bar */}
        {nativeWorkspace ? (
        <div className={styles.mobileStickyBar} role="region" aria-label="Tóm tắt lựa chọn nhanh">
          <div className={styles.mobileStickyInner}>
            <div className={styles.mobileStickyInfo}>
              <p className={styles.mobileStickyProgress}>
                {selectedRoomsCount}/{searchState.roomGroups.length} phòng đã chọn
              </p>
              <p className={styles.mobileStickySub}>{guestsText}</p>
            </div>
            <div className={styles.mobileStickyActions}>
              <button
                type="button"
                className={styles.mobileAddRoomBtn}
                data-testid="mobile-add-room"
                onClick={handleAddRoom}
              >
                + Thêm phòng
              </button>
              <button
                type="button"
                className={styles.mobileStickyCta}
                onClick={openReviewDialog}
              >
                Xem lại lựa chọn
              </button>
            </div>
          </div>
        </div>
        ) : null}

        {/* Concise Review Sheet ("Kiểm tra lựa chọn"): only where rooms are chosen inside VNest */}
        {nativeWorkspace ? <dialog
          ref={reviewDialogRef}
          className={styles.reviewDialog}
          aria-labelledby="review-dialog-title"
          onClose={() => reviewTriggerRef.current?.focus()}
          onClick={(e) => {
            if (e.target === reviewDialogRef.current) reviewDialogRef.current?.close();
          }}
        >
          <div className={styles.reviewDialogInner}>
            <div className={styles.reviewDialogHead}>
              <h2 id="review-dialog-title" className={styles.reviewDialogTitle}>
                Kiểm tra lựa chọn
              </h2>
              <button
                type="button"
                className={styles.dialogCloseBtn}
                onClick={() => reviewDialogRef.current?.close()}
              >
                Đóng
              </button>
            </div>

            <div className={styles.reviewDialogBody}>
              <dl className={styles.reviewSummaryMeta}>
                <div>
                  <dt>Nơi lưu trú</dt>
                  <dd>
                    {selectedProperty
                      ? `${selectedProperty.name} · ${selectedProperty.locationLabel}`
                      : lockedReservationProperty
                        ? `${lockedReservationProperty.name} · ${lockedReservationProperty.locationLabel}`
                        : "Tất cả nơi lưu trú"}
                  </dd>
                </div>
                <div>
                  <dt>Ngày lưu trú</dt>
                  <dd>{conciseDates}</dd>
                </div>
              </dl>

              {selectedRoomTypeSummaries.length > 0 ? (
                <div className={styles.reviewTypeSummary}>
                  {selectedRoomTypeSummaries.map((item) => (
                    <p key={item.groupKey} className={styles.reviewTypeLine}>
                      <strong>
                        {item.quantity} × {item.roomTypeLabel}
                      </strong>{" "}
                      ({item.unitNames.join(", ")}) · {item.totalAdults} khách
                    </p>
                  ))}
                </div>
              ) : null}

              <ul className={styles.reviewRoomsList}>
                {searchState.roomGroups.map((slot) => {
                  const entry = slot.preferredRoomId ? allRoomsById.get(slot.preferredRoomId) : undefined;
                  return (
                    <li key={slot.slotIndex} className={styles.reviewRoomRow}>
                      <div>
                        <p className={styles.reviewRoomSlot}>
                          Phòng {slot.slotIndex} · {slot.adults} khách
                        </p>
                        {entry ? (
                          <>
                            <p className={styles.reviewRoomName}>{entry.room.name}</p>
                            <p className={styles.reviewRoomNote}>
                              {entry.property.name}
                              {entry.room.roomType ? ` · ${entry.room.roomType}` : ""}
                              {entry.room.roomSize ? ` · ${entry.room.roomSize}` : ""}
                            </p>
                          </>
                        ) : (
                          <p className={styles.reviewRoomEmpty}>Chưa chọn phòng</p>
                        )}
                      </div>
                      <div className={styles.reviewRowActions}>
                        <button
                          type="button"
                          className={styles.textLinkBtn}
                          onClick={() => {
                            setActiveSlot(slot.slotIndex);
                            reviewDialogRef.current?.close();
                          }}
                        >
                          {entry ? "Đổi phòng" : "Chọn phòng"}
                        </button>
                        {searchState.roomGroups.length > 1 ? (
                          <button
                            type="button"
                            className={styles.textLinkBtn}
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

              <button
                type="button"
                className={styles.summaryAddRoomBtn}
                onClick={() => {
                  handleAddRoom();
                  reviewDialogRef.current?.close();
                }}
              >
                + Thêm phòng vào yêu cầu
              </button>

              {children ? (
                <p className={styles.reviewHonestNotice} role="note" data-testid="review-children">
                  {children} trẻ em đi cùng (chưa phân vào phòng). {CHILD_POLICY_NOTE}
                </p>
              ) : null}
              <p className={styles.reviewHonestNotice} role="note">
                Giá và tình trạng phòng trống sẽ được xác nhận khi hệ thống đặt phòng được kết nối. Hiện chưa có phòng nào được giữ và chưa phát sinh thanh toán.
              </p>
            </div>

            <div className={styles.reviewDialogFoot}>
              {lockedReservationProperty?.demoPageHref ? (
                <Link
                  href={
                    demoPropertyUrlFromMultiRoom(lockedReservationProperty.id, searchState) ??
                    lockedReservationProperty.demoPageHref
                  }
                  className={styles.secondaryBtn}
                >
                  Xem trang cơ sở
                </Link>
              ) : (
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => {
                    reviewDialogRef.current?.close();
                    openEditorOn("dates");
                  }}
                >
                  Chỉnh sửa ngày
                </button>
              )}
              {searchState.checkIn && searchState.checkOut && fit.kind === "fits" && searchState.roomGroups.every((g) => g.preferredRoomId !== null) ? (
                // Same honest step as the property page's review (25/10/2026): it restates the stay and says nothing is booked.
                <Link href={demoBookingStepFromMultiRoomUrl(searchState)} className={styles.primaryActionBtn} data-testid="continue-booking-request">
                  Tiếp tục
                </Link>
              ) : (
                <button type="button" className={styles.primaryActionBtn} onClick={() => reviewDialogRef.current?.close()}>
                  Quay lại chọn phòng
                </button>
              )}
            </div>
          </div>
        </dialog> : null}
      </main>
      <DemoFooter />
    </>
  );
}
