/**
 * ROOM OCCUPANCY RULE: one guest minimum and two guests maximum per room, the same for every bookable room.
 *
 * Source: the owner's brief of 5/11/2026 ("rooms have a minimum of one guest and a maximum of two guests").
 * Data audit (docs/qa/room-selection-simplify-2026-11-05/REVIEW.md §1):
 * - VNest's current workbook (v2, 20/10/2026) has no capacity column.
 * - The 15/10 room sheet gives "2 người lớn" in one merged cell (F4:F25) covering all 22 rooms. Only Bare Chic One carries
 *   the value on its own row, and the sheet is not reconfirmed.
 * - No room anywhere is given a different capacity.
 * So the rule is applied to all rooms, with no exception, and must be confirmed by VNest (or by GoHost / ezCloud room
 * limits) before publication. Correction (5/11/2026): the room count is the guest's own choice; a guest total that does
 * not fit is refused or flagged, never fixed by adding or removing rooms. The rule has no child, infant or extra-bed policy; none is supplied. A provider-confirmed
 * per-room capacity (`verifiedMaxAdults`) still takes precedence where one exists.
 */
export const MIN_GUESTS_PER_ROOM = 1;
export const MAX_GUESTS_PER_ROOM = 2;
/** Rooms in one request (unchanged from the earlier demo limit). */
export const MAX_ROOMS_PER_STAY = 6;
/** The most guests one request can hold under the rule. */
export const MAX_GUESTS_PER_STAY = MAX_ROOMS_PER_STAY * MAX_GUESTS_PER_ROOM;

/** The fewest rooms that fit `guests` (5 guests → 3 rooms). */
export function minRoomsFor(guests: number): number {
  return Math.max(1, Math.ceil(Math.max(1, Math.round(guests)) / MAX_GUESTS_PER_ROOM));
}

/** The most rooms `guests` can fill with at least one guest each (capped by the request limit). */
export function maxRoomsFor(guests: number): number {
  return Math.max(1, Math.min(MAX_ROOMS_PER_STAY, Math.round(guests)));
}

/** The guests `rooms` can hold: N rooms take N to 2N guests (owner correction, 5/11/2026). */
export function guestRangeFor(rooms: number): { min: number; max: number } {
  const n = Math.max(1, Math.min(MAX_ROOMS_PER_STAY, Math.round(rooms)));
  return { min: n * MIN_GUESTS_PER_ROOM, max: n * MAX_GUESTS_PER_ROOM };
}

/**
 * Where a guest total stands against a room count. Rooms and guests are both the guest's own choice: neither is ever
 * changed to fit the other. `over`: more guests than the rooms hold; `under`: fewer guests than rooms.
 */
export type OccupancyFit = { kind: "fits" } | { kind: "over"; minRooms: number } | { kind: "under" };

export function occupancyFit(guests: number, rooms: number): OccupancyFit {
  const { min, max } = guestRangeFor(rooms);
  if (guests > max) return { kind: "over", minRooms: minRoomsFor(guests) };
  if (guests < min) return { kind: "under" };
  return { kind: "fits" };
}

/**
 * The per-room split behind a guest total, exactly `rooms` long, fuller rooms first: 3 guests in 2 rooms → [2, 1];
 * 5 in 3 → [2, 2, 1]. It is internal (never shown as per-room steppers). When the total does not fit the rooms (an
 * outdated or edited address), each room is held at its own limit instead, and the caller keeps the guest total apart and
 * asks the guest to correct it: nothing is added or dropped silently.
 */
export function allocateGuests(guests: number, rooms: number): number[] {
  const count = Math.max(1, Math.min(MAX_ROOMS_PER_STAY, Math.round(rooms)));
  const total = Math.max(count * MIN_GUESTS_PER_ROOM, Math.min(count * MAX_GUESTS_PER_ROOM, Math.round(guests)));
  const base = Math.floor(total / count);
  const remainder = total % count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

/** Another room keeps the guest total only if every room still has a guest (rooms + 1 ≤ guests). */
export function roomsCanGrow(guests: number, rooms: number): boolean {
  return rooms < MAX_ROOMS_PER_STAY && guests >= rooms + 1;
}

/** One room fewer keeps the guest total only if the others hold everyone (guests ≤ 2 × (rooms − 1)). */
export function roomsCanShrink(guests: number, rooms: number): boolean {
  return rooms > 1 && guests <= (rooms - 1) * MAX_GUESTS_PER_ROOM;
}

export type OccupancyIssue =
  | { kind: "room-over-capacity"; room: number; guests: number }
  | { kind: "room-empty"; room: number }
  | { kind: "too-many-rooms"; rooms: number }
  | { kind: "too-many-guests"; guests: number };

/** Every way a per-room allocation breaks the rule (an empty list means it is allowed). */
export function occupancyIssues(roomGuests: readonly number[]): OccupancyIssue[] {
  const issues: OccupancyIssue[] = [];
  if (roomGuests.length > MAX_ROOMS_PER_STAY) issues.push({ kind: "too-many-rooms", rooms: roomGuests.length });
  const total = roomGuests.reduce((a, b) => a + b, 0);
  if (total > MAX_GUESTS_PER_STAY) issues.push({ kind: "too-many-guests", guests: total });
  roomGuests.forEach((guests, i) => {
    if (guests < MIN_GUESTS_PER_ROOM) issues.push({ kind: "room-empty", room: i + 1 });
    else if (guests > MAX_GUESTS_PER_ROOM) issues.push({ kind: "room-over-capacity", room: i + 1, guests });
  });
  return issues;
}
