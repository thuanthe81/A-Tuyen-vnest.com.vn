import { isBefore, nightsBetween, type IsoDate } from "../dates.ts";
import type { RoomAvailability, StayRequest } from "./property-availability.ts";
import { MAX_GUESTS_PER_ROOM, MAX_ROOMS_PER_STAY, MIN_GUESTS_PER_ROOM } from "./room-occupancy.ts";

/**
 * SERVER-SIDE VALIDATION OF A STAY AND OF REQUESTED ROOM QUANTITIES.
 *
 * Runs on the server before any availability call or (later) reservation operation. The client's
 * selection is a preference: it is never trusted as inventory. A quantity is accepted against a
 * property only when provider-verified units are supplied; without them nothing is guaranteed and the
 * check says so instead of passing.
 */
export const MAX_STAY_NIGHTS = 30;
/** Room and per-room guest limits come from the one occupancy rule (room-occupancy.ts). */
export const MAX_STAY_ROOMS = MAX_ROOMS_PER_STAY;
export const MIN_ADULTS_PER_ROOM = MIN_GUESTS_PER_ROOM;
export const MAX_ADULTS_PER_ROOM = MAX_GUESTS_PER_ROOM;

export type StayIssue =
  | "dates-missing"
  | "check-in-in-past"
  | "check-out-not-after-check-in"
  | "stay-too-long"
  | "rooms-out-of-range"
  | "adults-out-of-range";

export type StayValidation = { ok: true } | { ok: false; issues: readonly StayIssue[] };

export function validateStay(stay: StayRequest, today?: IsoDate): StayValidation {
  const issues: StayIssue[] = [];
  if (!stay.checkIn || !stay.checkOut) {
    issues.push("dates-missing");
  } else {
    if (today && isBefore(stay.checkIn, today)) issues.push("check-in-in-past");
    if (!isBefore(stay.checkIn, stay.checkOut)) issues.push("check-out-not-after-check-in");
    else if (nightsBetween(stay.checkIn, stay.checkOut) > MAX_STAY_NIGHTS) issues.push("stay-too-long");
  }
  if (stay.roomAdults.length < 1 || stay.roomAdults.length > MAX_STAY_ROOMS) issues.push("rooms-out-of-range");
  if (stay.roomAdults.some((n) => !Number.isInteger(n) || n < MIN_ADULTS_PER_ROOM || n > MAX_ADULTS_PER_ROOM)) {
    issues.push("adults-out-of-range");
  }
  return issues.length ? { ok: false, issues } : { ok: true };
}

export type SelectionRequest = {
  /** Room ids chosen per slot, in slot order; `null` = no preference for that slot. */
  preferredRoomIds: readonly (string | null)[];
};

export type SelectionValidation =
  | { ok: true; verified: true }
  /** Nothing verified the quantities: the selection is a preference, not a held or guaranteed room. */
  | { ok: true; verified: false }
  | { ok: false; room: string; requested: number; available: number };

/**
 * Checks the requested quantity of each room against provider-confirmed units. Repeating the same room
 * across slots is only accepted up to the units the provider confirmed.
 */
export function validateSelectionQuantities(
  selection: SelectionRequest,
  verifiedRooms: readonly RoomAvailability[] | null,
): SelectionValidation {
  if (!verifiedRooms) return { ok: true, verified: false };
  const requested = new Map<string, number>();
  for (const id of selection.preferredRoomIds) {
    if (id) requested.set(id, (requested.get(id) ?? 0) + 1);
  }
  for (const [room, count] of requested) {
    const available = verifiedRooms.find((r) => r.roomId === room)?.availableUnits ?? 0;
    if (count > available) return { ok: false, room, requested: count, available };
  }
  return { ok: true, verified: true };
}
