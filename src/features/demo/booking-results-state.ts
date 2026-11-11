import { isBefore, nightsBetween, parseIsoDate, type IsoDate } from "@/domain/dates";
import {
  allocateGuests,
  guestRangeFor,
  MAX_GUESTS_PER_ROOM,
  MAX_ROOMS_PER_STAY,
  MIN_GUESTS_PER_ROOM,
  minRoomsFor,
  occupancyFit,
} from "@/domain/hybrid-booking/room-occupancy";
import { parseChildren } from "@/domain/hybrid-booking/guest-party";
import type { QueryInput } from "@/domain/search";
import type { CatalogProperty, CatalogRoom, RoomOptionKind } from "./booking-results-data";

/**
 * MULTI-ROOM BOOKING RESULTS STATE, SAME-TYPE QUANTITY & UNIQUE-UNIT PROTECTION (/dev/demo/tim-phong).
 *
 * Explicitly distinguishes (Task 4 & Task 6):
 * 1. Property (`propertySlug` / `propertyId`)
 * 2. Room type / category (`roomType`, `roomTypeGroupId`, `optionKind: "room-type" | "physical-unit"`)
 * 3. Physical room / unit (`CatalogRoom.id`, `physicalUnits`)
 * 4. Inventory quantity (`physicalUnits` / `sameTypeUnitIds.length`)
 * 5. Available quantity for a stay (`availableUnits` — `null` without a trusted PMS response)
 * 6. Rate plan (`ratePlan` — `null` without a trusted PMS response)
 * 7. Requested quantity (`roomGroups.length` and per-type `selectedPoolUnits`)
 * 8. Assigned guest group (`RoomGroupSlot.slotIndex`, `RoomGroupSlot.adults`)
 */

/** The occupancy rule (1–2 guests per room, up to 6 rooms): domain/hybrid-booking/room-occupancy.ts. */
export const MAX_ROOMS = MAX_ROOMS_PER_STAY;
export const MIN_ADULTS_PER_ROOM = MIN_GUESTS_PER_ROOM;
export const MAX_ADULTS_PER_ROOM = MAX_GUESTS_PER_ROOM;

export const DEFAULT_DEMO_SEARCH = {
  propertySlug: "bare-chic",
  checkIn: "2026-11-06" as IsoDate,
  checkOut: "2026-11-08" as IsoDate,
  roomAdults: [2, 2] as const,
} as const;

export type RoomGroupSlot = {
  /** Stable slot identifier ("room-1", "room-2", ...). */
  slotId?: string;
  /** 1-based room group index ("Phòng 1", "Phòng 2", ...). */
  slotIndex: number;
  adults: number;
  /** Requested room preference ID (`CatalogRoom.id`), or `null` when not yet chosen. */
  roomId?: string | null;
  /** Provisional room preference (`CatalogRoom.id`), or `null` when not yet chosen. */
  preferredRoomId: string | null;
};

export function createRoomSlot(
  slotIndex: number,
  adults: number,
  preferredRoomId: string | null = null,
): RoomGroupSlot {
  const clamped = clampAdults(adults);
  return {
    slotId: `room-${slotIndex}`,
    slotIndex,
    adults: clamped,
    roomId: preferredRoomId,
    preferredRoomId,
  };
}

export type MultiRoomSearchState = {
  /** Selected property slug, or `null` for all 6 properties. */
  propertySlug: string | null;
  checkIn?: IsoDate;
  checkOut?: IsoDate;
  roomGroups: readonly RoomGroupSlot[];
  /** Room slug that initiated `BOOK NOW` from a room viewer or drawer, when any. */
  focusedRoomId?: string | null;
  /**
   * The guest total an address asked for when it does not fit its rooms (e.g. `rooms=1&adults=3`). It is kept apart,
   * never dropped and never fixed by changing the rooms, until the guest corrects it; absent when the rooms fit.
   */
  guests?: number;
  /** Children in the party (`children=N`), apart from the adults and the room rule: no child policy is confirmed. */
  children?: number;
};

/** The guests asked for: the slots' total, or the address's own total while it does not fit the rooms. */
export function requestedGuests(state: Pick<MultiRoomSearchState, "roomGroups" | "guests">): number {
  return state.guests ?? totalRequestedAdults(state.roomGroups);
}

export type RoomCatalogMeta = {
  propertyId: string;
  optionKind: RoomOptionKind;
  physicalUnits: number;
  availableUnits: number | null;
  verifiedMaxAdults: number | null;
};

export type RoomSelectableInput = Pick<
  CatalogRoom,
  "id" | "name" | "verifiedMaxAdults" | "physicalUnits"
> & {
  optionKind?: RoomOptionKind;
  availableUnits?: number | null;
};

/**
 * Returns the maximum number of slots that may select `room`:
 * - When live PMS inventory is connected (`availableUnits !== null && availableUnits !== undefined`),
 *   enforces the provider-confirmed `availableUnits` (capped by `physicalUnits`).
 * - Until ezCloud PMS inventory is connected (`availableUnits === null` or `undefined`), this is a
 *   repeatable demo preference-selection flow: the same displayed room can be requested across
 *   multiple room slots (`MAX_ROOMS`).
 */
export function maxSelectableUnits(room: Pick<RoomSelectableInput, "physicalUnits" | "availableUnits">): number {
  const physical = Math.max(1, Math.round(room.physicalUnits));
  if (room.availableUnits !== undefined && room.availableUnits !== null) {
    return Math.max(0, Math.min(physical, Math.round(room.availableUnits)));
  }
  return MAX_ROOMS;
}

export function toRoomSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type CapacityAssessment =
  | {
      kind: "verified-fits";
      maxAdults: number;
      requestedAdults: number;
      label: string;
    }
  | {
      kind: "exceeds-verified-capacity";
      maxAdults: number;
      requestedAdults: number;
      label: string;
    }
  | {
      kind: "capacity-unverified";
      requestedAdults: number;
      label: string;
    };

export type RoomSlotEvaluation = {
  slotIndex: number;
  requestedAdults: number;
  isSelectedForSlot: boolean;
  /** Another slot number (`1..N`) that holds this room, or `null`. */
  assignedToOtherSlot: number | null;
  /** All slot numbers (`1..N`) currently assigned to this `room.id`. */
  assignedSlots: readonly number[];
  /** Maximum selectable units for this room option (`1` for unique physical rooms; `> 1` for multi-unit room types). */
  maxUnits: number;
  capacity: CapacityAssessment;
  /** Whether the guest can directly assign this room to `slotIndex` right now. */
  canSelect: boolean;
  disabledReason: string | null;
};

export type SameTypePoolEvaluation = {
  roomType: string | null;
  roomTypeGroupId: string | null;
  /** Total units in this verified room-type pool at the property (or `maxSelectableUnits(room)`). */
  totalPoolUnits: number;
  /** Number of units currently selected from this room-type pool across all room groups. */
  selectedPoolUnits: number;
  /** Remaining unselected units in this room-type pool. */
  remainingPoolUnits: number;
  /** Next eligible unit that can be assigned when requesting another room of the same type. */
  nextCandidateRoom: CatalogRoom | null;
  /** Whether the guest can add/select another unit of this same room type right now. */
  canAddAnotherOfSameType: boolean;
};

export type SelectedRoomTypeSummary = {
  groupKey: string;
  propertyId: string;
  propertyName: string;
  roomTypeLabel: string;
  quantity: number;
  unitNames: readonly string[];
  slotIndices: readonly number[];
  totalAdults: number;
};

function firstParam(value: string | readonly string[] | undefined): string | undefined {
  const raw = typeof value === "string" ? value : value?.[0];
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

function clampAdults(value: number): number {
  if (!Number.isFinite(value)) return 2;
  return Math.max(MIN_ADULTS_PER_ROOM, Math.min(MAX_ADULTS_PER_ROOM, Math.round(value)));
}

/**
 * Distributes `totalAdults` across exactly `roomCount` rooms, fuller rooms first (3 in 2 → [2, 1]). The room count is
 * never changed (owner correction, 5/11/2026); a total that does not fit is held at the rooms' limits and must be kept
 * apart by the caller (`MultiRoomSearchState.guests`).
 */
export function distributeAdultsAcrossRooms(roomCount: number, totalAdults: number): number[] {
  return allocateGuests(totalAdults, roomCount);
}

/**
 * Rooms and guests from an address. The room count is what the address says (`rooms=2,1` → 2, `rooms=3` → 3; with no
 * `rooms`, the fewest rooms that fit the guests). The guest total is `adults` (or the per-room list's sum). The per-room
 * list is kept when it fits and adds up; otherwise the guests are split again over the same rooms.
 */
export function occupancyFromQuery(rawRooms: string | undefined, rawAdults: string | undefined): { roomAdults: number[]; guests: number } {
  const adults = rawAdults && /^\d+$/.test(rawAdults) ? Math.max(1, Number(rawAdults)) : undefined;
  if (rawRooms && rawRooms.includes(",")) {
    const parts = rawRooms
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((n) => Number.isInteger(n) && n >= MIN_ADULTS_PER_ROOM)
      .slice(0, MAX_ROOMS);
    if (parts.length) {
      const sum = parts.reduce((a, b) => a + b, 0);
      const guests = adults ?? sum;
      const fits = parts.every((n) => n <= MAX_ADULTS_PER_ROOM) && sum === guests;
      return { roomAdults: fits ? parts : allocateGuests(guests, parts.length), guests };
    }
  }
  if (rawRooms && /^\d+$/.test(rawRooms)) {
    const count = Math.max(1, Math.min(MAX_ROOMS, Number(rawRooms)));
    const guests = adults ?? count * 2;
    return { roomAdults: allocateGuests(guests, count), guests };
  }
  const guests = adults ?? 2;
  return { roomAdults: allocateGuests(guests, minRoomsFor(guests)), guests };
}

/**
 * Slots for a new room count with the guest total split again; the kept slots keep their chosen rooms, in order (the
 * dropped slot, when given, loses its own). Used for the guest's explicit room changes and for correcting an address.
 */
export function resizeRoomGroups(
  groups: readonly RoomGroupSlot[],
  guests: number,
  roomCount: number,
  dropSlotIndex?: number,
): RoomGroupSlot[] {
  const kept = dropSlotIndex === undefined ? groups : groups.filter((g) => g.slotIndex !== dropSlotIndex);
  return allocateGuests(guests, roomCount).map((n, i) => createRoomSlot(i + 1, n, kept[i]?.preferredRoomId ?? null));
}

export function buildRoomMetaMap(catalog: readonly CatalogProperty[]): ReadonlyMap<string, RoomCatalogMeta> {
  const map = new Map<string, RoomCatalogMeta>();
  for (const property of catalog) {
    for (const room of property.rooms) {
      map.set(room.id, {
        propertyId: property.id,
        optionKind: room.optionKind,
        physicalUnits: room.physicalUnits,
        availableUnits: room.availableUnits,
        verifiedMaxAdults: room.verifiedMaxAdults,
      });
    }
  }
  return map;
}

/**
 * Parses URL query parameters into `MultiRoomSearchState`.
 * Enforces unique physical unit limits (`maxSelectableUnits === 1`), multi-unit room type caps,
 * and single-property reservation consistency across room groups.
 */
export function parseMultiRoomQuery(
  query: QueryInput,
  validPropertySlugs: readonly string[],
  validRoomIds: ReadonlySet<string> = new Set(),
  roomMetaById?: ReadonlyMap<string, RoomCatalogMeta>,
): MultiRoomSearchState {
  const hasAnyParam = ["property", "checkIn", "checkOut", "rooms", "adults", "children", "prefs", "room"].some(
    (key) => firstParam(query[key]) !== undefined,
  );

  if (!hasAnyParam) {
    return {
      propertySlug: validPropertySlugs.includes(DEFAULT_DEMO_SEARCH.propertySlug) ? DEFAULT_DEMO_SEARCH.propertySlug : null,
      checkIn: DEFAULT_DEMO_SEARCH.checkIn,
      checkOut: DEFAULT_DEMO_SEARCH.checkOut,
      roomGroups: DEFAULT_DEMO_SEARCH.roomAdults.map((adults, idx) => createRoomSlot(idx + 1, adults, null)),
    };
  }

  const rawProperty = firstParam(query.property);
  const propertySlug = rawProperty && rawProperty !== "all" && validPropertySlugs.includes(rawProperty) ? rawProperty : null;

  const checkIn = firstParam(query.checkIn) ? parseIsoDate(firstParam(query.checkIn)!) : undefined;
  const rawCheckOut = firstParam(query.checkOut) ? parseIsoDate(firstParam(query.checkOut)!) : undefined;
  const checkOut = checkIn && rawCheckOut && isBefore(checkIn, rawCheckOut) ? rawCheckOut : undefined;

  const { roomAdults: adultsPerRoom, guests } = occupancyFromQuery(firstParam(query.rooms), firstParam(query.adults));
  const children = parseChildren(firstParam(query.children));
  const fit = occupancyFit(guests, adultsPerRoom.length);

  const rawPrefs = firstParam(query.prefs)?.split(",").map((s) => s.trim()) ?? [];
  const rawRoom = firstParam(query.room);
  const candidateRoomSlug = rawRoom ? toRoomSlug(rawRoom) : null;
  const focusedRoomId =
    candidateRoomSlug && (validRoomIds.size === 0 || validRoomIds.has(candidateRoomSlug)) ? candidateRoomSlug : null;

  const usedRoomCounts = new Map<string, number>();
  let lockedPropertyId: string | null = propertySlug;

  const canUseRoomForSlot = (roomId: string, slotAdults: number): boolean => {
    if (validRoomIds.size > 0 && !validRoomIds.has(roomId)) return false;
    const meta = roomMetaById?.get(roomId);
    const maxUnits = meta ? maxSelectableUnits(meta) : MAX_ROOMS;
    const usedCount = usedRoomCounts.get(roomId) ?? 0;
    if (usedCount >= maxUnits) return false;
    if (meta) {
      if (lockedPropertyId && meta.propertyId !== lockedPropertyId) return false;
      if (meta.verifiedMaxAdults !== null && slotAdults > meta.verifiedMaxAdults) return false;
    }
    return true;
  };

  const roomGroups: RoomGroupSlot[] = adultsPerRoom.map((adults, idx) => {
    const rawCandidate = rawPrefs[idx] ? toRoomSlug(rawPrefs[idx]!) : null;
    const validChoice = rawCandidate && canUseRoomForSlot(rawCandidate, adults) ? rawCandidate : null;
    if (validChoice) {
      usedRoomCounts.set(validChoice, (usedRoomCounts.get(validChoice) ?? 0) + 1);
      const meta = roomMetaById?.get(validChoice);
      if (!lockedPropertyId && meta) lockedPropertyId = meta.propertyId;
    }
    return createRoomSlot(idx + 1, adults, validChoice);
  });

  // When BOOK NOW came from a specific room's viewer or drawer, pre-select that room in the first compatible open slot.
  if (focusedRoomId) {
    const openSlotIdx = roomGroups.findIndex(
      (g) => g.preferredRoomId === null && canUseRoomForSlot(focusedRoomId, g.adults),
    );
    if (openSlotIdx !== -1) {
      const target = roomGroups[openSlotIdx]!;
      roomGroups[openSlotIdx] = createRoomSlot(target.slotIndex, target.adults, focusedRoomId);
      usedRoomCounts.set(focusedRoomId, (usedRoomCounts.get(focusedRoomId) ?? 0) + 1);
    }
  }

  return {
    propertySlug,
    ...(checkIn ? { checkIn } : {}),
    ...(checkOut ? { checkOut } : {}),
    roomGroups,
    ...(focusedRoomId ? { focusedRoomId } : {}),
    ...(fit.kind === "fits" ? {} : { guests }),
    ...(children ? { children } : {}),
  };
}

export function serializeMultiRoomQuery(state: MultiRoomSearchState): string {
  const params = new URLSearchParams();
  params.set("property", state.propertySlug ?? "all");
  if (state.checkIn) params.set("checkIn", state.checkIn);
  if (state.checkOut) params.set("checkOut", state.checkOut);
  if (state.roomGroups.length === 1) {
    params.set("rooms", "1");
  } else {
    params.set("rooms", state.roomGroups.map((g) => g.adults).join(","));
  }
  params.set("adults", String(requestedGuests(state)));
  if (state.children) params.set("children", String(state.children));
  if (state.roomGroups.some((g) => g.preferredRoomId !== null)) {
    params.set("prefs", state.roomGroups.map((g) => g.preferredRoomId ?? "").join(","));
  }
  if (state.focusedRoomId && !state.roomGroups.some((g) => g.preferredRoomId === state.focusedRoomId)) {
    params.set("room", state.focusedRoomId);
  }
  return params.toString();
}

export function totalRequestedAdults(groups: readonly RoomGroupSlot[]): number {
  return groups.reduce((sum, group) => sum + group.adults, 0);
}

export function stayNights(state: Pick<MultiRoomSearchState, "checkIn" | "checkOut">): number | null {
  if (!state.checkIn || !state.checkOut) return null;
  const n = nightsBetween(state.checkIn, state.checkOut);
  return n > 0 ? n : null;
}

/**
 * ROOMS AND GUESTS ARE SEPARATE VALUES (owner brief, 4/11/2026): adding or removing a room never changes the guest
 * total. Every room holds one or two guests (owner rule and correction, 5/11/2026, room-occupancy.ts): N rooms take N to
 * 2N guests. A room cannot be added without a guest for it or removed while its guests have nowhere to go, and a guest
 * total never adds or removes rooms.
 */

/** True when another room can be added without adding a guest: some room has a guest to spare. */
export function canAddRoom(groups: readonly RoomGroupSlot[]): boolean {
  return groups.length < MAX_ROOMS && groups.some((group) => group.adults > MIN_ADULTS_PER_ROOM);
}

/** Adds a room with one adult taken from the fullest room (the last of equals). The guest total is unchanged. */
export function addRoomGroup(groups: readonly RoomGroupSlot[]): readonly RoomGroupSlot[] {
  if (!canAddRoom(groups)) return groups;
  let donor = 0;
  groups.forEach((group, index) => {
    if (group.adults >= groups[donor]!.adults) donor = index;
  });
  const next = groups.map((group, index) =>
    index === donor ? createRoomSlot(group.slotIndex, group.adults - 1, group.preferredRoomId) : group,
  );
  return [...next, createRoomSlot(groups.length + 1, 1, null)];
}

/**
 * Removes a room; its guests move to the room before it (the next one when it was the first), spilling over to the
 * others only past MAX_ADULTS_PER_ROOM. The guest total is unchanged; with nowhere to put them, nothing is removed.
 */
export function removeRoomGroup(groups: readonly RoomGroupSlot[], slotIndex: number): readonly RoomGroupSlot[] {
  if (groups.length <= 1) return groups;
  const index = groups.findIndex((group) => group.slotIndex === slotIndex);
  if (index < 0) return groups;
  const removed = groups[index]!;
  const kept = groups.filter((_, i) => i !== index);
  const adults = kept.map((group) => group.adults);
  const receiver = Math.max(0, index - 1);
  const order = [receiver, ...adults.map((_, i) => i).filter((i) => i !== receiver)];
  let left = removed.adults;
  for (const i of order) {
    const take = Math.min(left, MAX_ADULTS_PER_ROOM - adults[i]!);
    adults[i]! += take;
    left -= take;
  }
  if (left > 0) return groups;
  return kept.map((group, idx) => createRoomSlot(idx + 1, adults[idx]!, group.preferredRoomId));
}

/**
 * Sets the guest total while keeping the per-room allocation: a guest is added to the room with the fewest
 * (the first of equals) and removed from the room with the most (the last of equals). The rooms never change: the
 * total is held within what they take (N to 2N); callers stop the guest before that (the steppers' limits) or keep an
 * out-of-range total apart (`MultiRoomSearchState.guests`). Room preferences stay with their rooms.
 */
export function setTotalAdults(groups: readonly RoomGroupSlot[], total: number): readonly RoomGroupSlot[] {
  const { min, max } = guestRangeFor(groups.length);
  const target = Math.max(min, Math.min(max, Math.round(total)));
  const adults = groups.map((group) => group.adults);
  let sum = adults.reduce((a, b) => a + b, 0);
  if (sum === target) return groups;
  while (sum < target) {
    let room = -1;
    adults.forEach((value, i) => {
      if (value < MAX_ADULTS_PER_ROOM && (room < 0 || value < adults[room]!)) room = i;
    });
    if (room < 0) break;
    adults[room]! += 1;
    sum += 1;
  }
  while (sum > target) {
    let room = -1;
    adults.forEach((value, i) => {
      if (value > MIN_ADULTS_PER_ROOM && (room < 0 || value >= adults[room]!)) room = i;
    });
    if (room < 0) break;
    adults[room]! -= 1;
    sum -= 1;
  }
  return groups.map((group, i) => createRoomSlot(i + 1, adults[i]!, group.preferredRoomId));
}

/** The per-room allocation in an address (see occupancyFromQuery), for a known guest total: same rooms, split again. */
export function roomAdultsFromQuery(rawRooms: string | undefined, adults: number): number[] {
  return occupancyFromQuery(rawRooms, String(Math.max(1, Math.round(adults)))).roomAdults;
}

/**
 * A search with an explicit guest total and room count (the guest's own change): the slots are split again, chosen rooms
 * stay in order, and a total that still does not fit is kept apart (`guests`) rather than dropped.
 */
export function withOccupancy(state: MultiRoomSearchState, guests: number, rooms: number, dropSlotIndex?: number): MultiRoomSearchState {
  const roomGroups = resizeRoomGroups(state.roomGroups, guests, rooms, dropSlotIndex);
  const { guests: _previous, ...rest } = state;
  void _previous;
  return occupancyFit(guests, roomGroups.length).kind === "fits" ? { ...rest, roomGroups } : { ...rest, roomGroups, guests };
}

/** Sets the number of rooms one room at a time from the end, keeping the guest total (see addRoomGroup/removeRoomGroup). */
export function setRoomGroupCount(groups: readonly RoomGroupSlot[], targetCount: number): readonly RoomGroupSlot[] {
  const count = Math.max(1, Math.min(MAX_ROOMS, Math.round(targetCount)));
  let next = groups;
  while (next.length < count && canAddRoom(next)) next = addRoomGroup(next);
  while (next.length > count) {
    const shorter = removeRoomGroup(next, next.length);
    if (shorter === next) break;
    next = shorter;
  }
  return next;
}

export function setRoomGroupAdults(
  groups: readonly RoomGroupSlot[],
  slotIndex: number,
  nextAdults: number,
  roomMetaById?: ReadonlyMap<string, RoomCatalogMeta>,
): readonly RoomGroupSlot[] {
  const clamped = clampAdults(nextAdults);
  return groups.map((group) => {
    if (group.slotIndex !== slotIndex) return group;
    const meta = group.preferredRoomId ? roomMetaById?.get(group.preferredRoomId) : undefined;
    const exceeds = meta?.verifiedMaxAdults !== null && meta?.verifiedMaxAdults !== undefined && clamped > meta.verifiedMaxAdults;
    const nextRoomId = exceeds ? null : group.preferredRoomId;
    return createRoomSlot(group.slotIndex, clamped, nextRoomId);
  });
}

export function assessRoomCapacity(room: Pick<CatalogRoom, "verifiedMaxAdults">, requestedAdults: number): CapacityAssessment {
  if (room.verifiedMaxAdults !== null) {
    if (requestedAdults <= room.verifiedMaxAdults) {
      return {
        kind: "verified-fits",
        maxAdults: room.verifiedMaxAdults,
        requestedAdults,
        label: `Sức chứa đã xác minh: tối đa ${room.verifiedMaxAdults} người lớn (phù hợp quy mô ${requestedAdults} người lớn · chưa kiểm tra phòng trống)`,
      };
    }
    return {
      kind: "exceeds-verified-capacity",
      maxAdults: room.verifiedMaxAdults,
      requestedAdults,
      label: `Vượt sức chứa đã xác minh: phòng tối đa ${room.verifiedMaxAdults} người lớn (nhóm yêu cầu ${requestedAdults} người lớn)`,
    };
  }
  return {
    kind: "capacity-unverified",
    requestedAdults,
    label: `Sức chứa tối đa chưa được xác minh — không tự khẳng định phòng đáp ứng đủ ${requestedAdults} người lớn`,
  };
}

export function evaluateRoomForSlot(
  room: RoomSelectableInput,
  targetSlot: RoomGroupSlot,
  allGroups: readonly RoomGroupSlot[],
): RoomSlotEvaluation {
  const isSelectedForSlot = targetSlot.preferredRoomId === room.id;
  const assignedSlots = allGroups.filter((g) => g.preferredRoomId === room.id).map((g) => g.slotIndex);
  const assignedOtherSlots = assignedSlots.filter((idx) => idx !== targetSlot.slotIndex);
  const assignedToOtherSlot = assignedOtherSlots[0] ?? null;
  const maxUnits = maxSelectableUnits(room);
  const capacity = assessRoomCapacity(room, targetSlot.adults);

  if (maxUnits === 0) {
    return {
      slotIndex: targetSlot.slotIndex,
      requestedAdults: targetSlot.adults,
      isSelectedForSlot: false,
      assignedToOtherSlot,
      assignedSlots,
      maxUnits,
      capacity,
      canSelect: false,
      disabledReason: `${room.name} đã hết phòng trống trong giai đoạn lưu trú này.`,
    };
  }

  if (!isSelectedForSlot && assignedOtherSlots.length >= maxUnits) {
    const reason =
      maxUnits === 1
        ? `${room.name} là đơn vị phòng độc bản (1 căn) và đã được chọn cho Phòng ${assignedToOtherSlot}. Không thể chọn trùng một căn cho hai phòng.`
        : `Đã chọn tối đa ${maxUnits} căn của hạng phòng ${room.name} (Phòng ${assignedOtherSlots.join(", ")}).`;
    return {
      slotIndex: targetSlot.slotIndex,
      requestedAdults: targetSlot.adults,
      isSelectedForSlot: false,
      assignedToOtherSlot,
      assignedSlots,
      maxUnits,
      capacity,
      canSelect: false,
      disabledReason: reason,
    };
  }

  if (capacity.kind === "exceeds-verified-capacity") {
    return {
      slotIndex: targetSlot.slotIndex,
      requestedAdults: targetSlot.adults,
      isSelectedForSlot,
      assignedToOtherSlot: null,
      assignedSlots,
      maxUnits,
      capacity,
      canSelect: false,
      disabledReason: `Phòng ${targetSlot.slotIndex} có ${targetSlot.adults} người lớn, vượt mức tối đa ${capacity.maxAdults} người lớn đã xác minh của ${room.name}.`,
    };
  }

  return {
    slotIndex: targetSlot.slotIndex,
    requestedAdults: targetSlot.adults,
    isSelectedForSlot,
    assignedToOtherSlot,
    assignedSlots,
    maxUnits,
    capacity,
    canSelect: true,
    disabledReason: null,
  };
}

export function assignRoomPreference(
  groups: readonly RoomGroupSlot[],
  slotIndex: number,
  room: RoomSelectableInput,
): { groups: readonly RoomGroupSlot[]; assigned: boolean; nextActiveSlot: number } {
  const target = groups.find((g) => g.slotIndex === slotIndex);
  if (!target) return { groups, assigned: false, nextActiveSlot: slotIndex };

  const evaluation = evaluateRoomForSlot(room, target, groups);
  if (!evaluation.canSelect) {
    return { groups, assigned: false, nextActiveSlot: slotIndex };
  }

  const nextGroups = groups.map((group) =>
    group.slotIndex === slotIndex ? createRoomSlot(group.slotIndex, group.adults, room.id) : group,
  );
  const nextEmpty =
    nextGroups.find((g) => g.slotIndex > slotIndex && g.preferredRoomId === null) ??
    nextGroups.find((g) => g.preferredRoomId === null);
  return {
    groups: nextGroups,
    assigned: true,
    nextActiveSlot: nextEmpty ? nextEmpty.slotIndex : slotIndex,
  };
}

export function clearRoomPreference(groups: readonly RoomGroupSlot[], slotIndex: number): readonly RoomGroupSlot[] {
  return groups.map((group) =>
    group.slotIndex === slotIndex ? createRoomSlot(group.slotIndex, group.adults, null) : group,
  );
}

export function moveRoomPreference(
  groups: readonly RoomGroupSlot[],
  toSlotIndex: number,
  room: RoomSelectableInput,
): { groups: readonly RoomGroupSlot[]; moved: boolean } {
  const target = groups.find((g) => g.slotIndex === toSlotIndex);
  if (!target) return { groups, moved: false };
  const capacity = assessRoomCapacity(room, target.adults);
  if (capacity.kind === "exceeds-verified-capacity") {
    return { groups, moved: false };
  }
  const maxUnits = maxSelectableUnits(room);
  const otherAssigned = groups.filter((g) => g.slotIndex !== toSlotIndex && g.preferredRoomId === room.id);
  const shouldClearExisting = otherAssigned.length >= maxUnits;
  const firstOtherSlot = otherAssigned[0]?.slotIndex ?? null;

  const nextGroups = groups.map((group) => {
    if (group.slotIndex === toSlotIndex) return createRoomSlot(group.slotIndex, group.adults, room.id);
    if (shouldClearExisting && group.slotIndex === firstOtherSlot) {
      return createRoomSlot(group.slotIndex, group.adults, null);
    }
    return group;
  });
  return { groups: nextGroups, moved: true };
}

/**
 * Evaluates a room's same-type unit pool (`sameTypeUnitIds` for physical units sharing a verified
 * `roomType` at the same property, OR `maxSelectableUnits(room)` for a multi-unit room-type option).
 */
export function evaluateSameTypePool(
  room: CatalogRoom,
  propertyRooms: readonly CatalogRoom[],
  allGroups: readonly RoomGroupSlot[],
): SameTypePoolEvaluation {
  // Case A: The room option itself is a multi-unit room-type record (`optionKind === "room-type"` or `physicalUnits > 1`).
  if (room.optionKind === "room-type" || room.physicalUnits > 1) {
    const maxDirectUnits = maxSelectableUnits(room);
    const selectedCount = allGroups.filter((g) => g.preferredRoomId === room.id).length;
    const remaining = Math.max(0, maxDirectUnits - selectedCount);
    const hasOpenCompatibleSlot = allGroups.some((g) => {
      if (g.preferredRoomId !== null) return false;
      return assessRoomCapacity(room, g.adults).kind !== "exceeds-verified-capacity";
    });
    const canAddRoom = allGroups.length < MAX_ROOMS && assessRoomCapacity(room, 2).kind !== "exceeds-verified-capacity";
    const canAdd = remaining > 0 && (hasOpenCompatibleSlot || canAddRoom);
    return {
      roomType: room.roomType ?? room.name,
      roomTypeGroupId: room.roomTypeGroupId ?? room.id,
      totalPoolUnits: maxDirectUnits,
      selectedPoolUnits: selectedCount,
      remainingPoolUnits: remaining,
      nextCandidateRoom: canAdd ? room : null,
      canAddAnotherOfSameType: canAdd,
    };
  }

  // Case B: Physical unit belonging to a verified multi-unit room type at the same property (`sameTypeUnitIds.length > 1`).
  const poolIds = room.sameTypeUnitIds.length > 1 ? room.sameTypeUnitIds : [room.id];
  const poolRooms = poolIds
    .map((id) => propertyRooms.find((r) => r.id === id))
    .filter((r): r is CatalogRoom => r !== undefined && maxSelectableUnits(r) > 0);

  const selectedIds = new Set(allGroups.map((g) => g.preferredRoomId).filter((id): id is string => id !== null));
  const selectedPoolUnits = poolRooms.filter((r) => selectedIds.has(r.id)).length;
  const unselectedPoolRooms = poolRooms.filter((r) => !selectedIds.has(r.id));
  const remainingPoolUnits = unselectedPoolRooms.length;

  const openSlot = allGroups.find((g) => g.preferredRoomId === null);
  const targetAdults = openSlot ? openSlot.adults : 2;
  const nextCandidateRoom =
    unselectedPoolRooms.find((r) => assessRoomCapacity(r, targetAdults).kind !== "exceeds-verified-capacity") ?? null;

  const canAddAnotherOfSameType =
    poolRooms.length > 1 &&
    nextCandidateRoom !== null &&
    (openSlot !== undefined || allGroups.length < MAX_ROOMS);

  return {
    roomType: room.roomType,
    roomTypeGroupId: room.roomTypeGroupId,
    totalPoolUnits: poolRooms.length,
    selectedPoolUnits,
    remainingPoolUnits,
    nextCandidateRoom,
    canAddAnotherOfSameType,
  };
}

/**
 * Selects an additional unit of the same room type (`roomType`):
 * - If an existing unselected `RoomGroupSlot` is compatible, assigns the next unit to that slot.
 * - Otherwise, if `groups.length < MAX_ROOMS`, appends a new `RoomGroupSlot` (preserving existing
 *   rooms' adult counts) and assigns the next unit to the new slot.
 * - Never duplicates a unique physical unit (`physicalUnits === 1`) and never exceeds `maxSelectableUnits`.
 */
export function selectAdditionalSameTypeUnit(
  groups: readonly RoomGroupSlot[],
  room: CatalogRoom,
  propertyRooms: readonly CatalogRoom[],
): {
  groups: readonly RoomGroupSlot[];
  added: boolean;
  assignedSlotIndex: number | null;
  assignedRoomId: string | null;
} {
  const pool = evaluateSameTypePool(room, propertyRooms, groups);
  if (!pool.canAddAnotherOfSameType || !pool.nextCandidateRoom) {
    return { groups, added: false, assignedSlotIndex: null, assignedRoomId: null };
  }

  const candidate = pool.nextCandidateRoom;

  // Prefer filling an existing open room slot first:
  const openSlot = groups.find(
    (g) => g.preferredRoomId === null && evaluateRoomForSlot(candidate, g, groups).canSelect,
  );
  if (openSlot) {
    const res = assignRoomPreference(groups, openSlot.slotIndex, candidate);
    return {
      groups: res.groups,
      added: res.assigned,
      assignedSlotIndex: res.assigned ? openSlot.slotIndex : null,
      assignedRoomId: res.assigned ? candidate.id : null,
    };
  }

  // Otherwise add a new room group (one guest moves into it; the guest total is unchanged) and assign the candidate:
  const withNewSlot = addRoomGroup(groups);
  if (withNewSlot === groups) {
    return { groups, added: false, assignedSlotIndex: null, assignedRoomId: null };
  }
  const newSlot = withNewSlot[withNewSlot.length - 1]!;
  const res = assignRoomPreference(withNewSlot, newSlot.slotIndex, candidate);
  if (!res.assigned) {
    return { groups, added: false, assignedSlotIndex: null, assignedRoomId: null };
  }
  return {
    groups: res.groups,
    added: true,
    assignedSlotIndex: newSlot.slotIndex,
    assignedRoomId: candidate.id,
  };
}

/**
 * Summarizes selected rooms grouped by room type/category so the summary can show both
 * the room type & quantity (`2 × Hạng Studio`) and the individual assigned units/guest groups.
 */
export function summarizeSelectedRoomTypes(
  groups: readonly RoomGroupSlot[],
  roomsById: ReadonlyMap<string, { room: CatalogRoom; property: CatalogProperty }>,
): readonly SelectedRoomTypeSummary[] {
  const map = new Map<string, SelectedRoomTypeSummary>();

  for (const group of groups) {
    if (!group.preferredRoomId) continue;
    const entry = roomsById.get(group.preferredRoomId);
    if (!entry) continue;
    const { room, property } = entry;
    const groupKey = room.roomTypeGroupId ?? `${property.id}:${room.id}`;
    const roomTypeLabel = room.roomType ? `Hạng ${room.roomType}` : room.name;

    const existing = map.get(groupKey);
    if (existing) {
      map.set(groupKey, {
        ...existing,
        quantity: existing.quantity + 1,
        unitNames: existing.unitNames.includes(room.name)
          ? existing.unitNames
          : [...existing.unitNames, room.name],
        slotIndices: [...existing.slotIndices, group.slotIndex],
        totalAdults: existing.totalAdults + group.adults,
      });
    } else {
      map.set(groupKey, {
        groupKey,
        propertyId: property.id,
        propertyName: property.name,
        roomTypeLabel,
        quantity: 1,
        unitNames: [room.name],
        slotIndices: [group.slotIndex],
        totalAdults: group.adults,
      });
    }
  }

  return Array.from(map.values());
}

export function filterPropertiesForScope(
  catalog: readonly CatalogProperty[],
  propertySlug: string | null,
  cityFilter: string | null = null,
  brandFilter: string | null = null,
): readonly CatalogProperty[] {
  if (propertySlug) {
    const found = catalog.filter((property) => property.id === propertySlug);
    if (found.length > 0) return found;
  }
  return catalog.filter((property) => {
    if (cityFilter && property.cityId !== cityFilter) return false;
    if (brandFilter && property.brandId !== brandFilter) return false;
    return true;
  });
}
