import { MAX_GUESTS_PER_ROOM, MAX_GUESTS_PER_STAY, MAX_ROOMS_PER_STAY, occupancyFit, roomsCanGrow, roomsCanShrink } from "@/domain/hybrid-booking/room-occupancy";

/** The combined field's words, shared by the header bar's panel and the room selection (plain module, testable). */
export const OCCUPANCY_LABEL = "Phòng & khách";

/** The owner's wording for the guest cap (5/11/2026). */
export const GUEST_CAP_NOTE = "Mỗi phòng tối đa 2 khách. Vui lòng thêm phòng nếu cần.";

/** The homepage field's label once its room stepper is hidden (Phase D, 9/11/2026). */
export const GUESTS_LABEL = "Khách";

/** "3 khách · 2 phòng" (frozen 4/11 wording); with children the adults are named as such: "3 người lớn · 1 trẻ em · 2 phòng". */
export function occupancySummary(adults: number, rooms: number, children = 0): string {
  return children > 0 ? `${adults} người lớn · ${children} trẻ em · ${rooms} phòng` : `${adults} khách · ${rooms} phòng`;
}

/**
 * Shorter readings of the guest field for the compact bars (Phase D refinement, 10/11/2026), longest first; the bar
 * shows the first that fits. Rooms are dropped before any word is cut; adults and children are always named apart
 * ("lớn" / "trẻ" only where nothing longer fits) and never added together. Build-team draft, owner review.
 * `rooms` null: the homepage field, which has no rooms.
 */
export function compactGuestSummaries(adults: number, rooms: number | null, children = 0): string[] {
  if (children > 0) {
    // Rooms kept with shorter words first; then the people alone.
    const withRooms =
      rooms === null
        ? []
        : [`${adults} người lớn · ${children} trẻ · ${rooms} phòng`, `${adults} lớn · ${children} trẻ · ${rooms} phòng`, `${adults} người lớn · ${children} trẻ em`];
    return [...withRooms, `${adults} người lớn · ${children} trẻ`, `${adults} lớn · ${children} trẻ`];
  }
  return rooms === null ? [] : [`${adults} khách`];
}

/** Under the steppers when the room stepper is hidden: rooms are chosen at the next step. Build-team draft, owner review. */
export const ROOMS_LATER_NOTE = "Bạn chọn số phòng ở bước chọn phòng.";

/**
 * The one line under the two steppers: why a step is not available, or what to correct. Rooms and guests are each the
 * guest's own choice (N rooms take N to 2N guests); nothing is changed for them.
 */
export function occupancyNote(guests: number, rooms: number): string {
  const fit = occupancyFit(guests, rooms);
  if (fit.kind === "over") {
    return fit.minRooms > MAX_ROOMS_PER_STAY
      ? `Mỗi yêu cầu tối đa ${MAX_ROOMS_PER_STAY} phòng, ${MAX_GUESTS_PER_STAY} khách. Vui lòng giảm số khách.`
      : `Mỗi phòng tối đa ${MAX_GUESTS_PER_ROOM} khách: ${guests} khách cần ít nhất ${fit.minRooms} phòng. Thêm phòng hoặc giảm số khách.`;
  }
  if (fit.kind === "under") return `Mỗi phòng cần ít nhất 1 khách: ${rooms} phòng cần ít nhất ${rooms} khách. Bớt phòng hoặc thêm khách.`;
  if (guests >= rooms * MAX_GUESTS_PER_ROOM) {
    return rooms >= MAX_ROOMS_PER_STAY ? `Tối đa ${MAX_ROOMS_PER_STAY} phòng, ${MAX_GUESTS_PER_STAY} khách cho mỗi yêu cầu.` : GUEST_CAP_NOTE;
  }
  if (rooms > 1 && !roomsCanShrink(guests, rooms)) return `${guests} khách cần ít nhất ${rooms} phòng (mỗi phòng tối đa ${MAX_GUESTS_PER_ROOM} khách).`;
  if (!roomsCanGrow(guests, rooms) && rooms < MAX_ROOMS_PER_STAY) return "Mỗi phòng cần ít nhất 1 khách: thêm khách trước khi thêm phòng.";
  return `Mỗi phòng 1–${MAX_GUESTS_PER_ROOM} khách.`;
}

/** The steppers' limits for the current guests and rooms: a step is offered only if the result keeps the rule. */
export function occupancySteps(guests: number, rooms: number, maxGuests = MAX_GUESTS_PER_STAY) {
  const cap = Math.min(rooms * MAX_GUESTS_PER_ROOM, maxGuests, MAX_GUESTS_PER_STAY);
  return {
    guestsUp: guests + 1 <= cap,
    // Down is offered while it stays at or above one per room, and always while there are more guests than the rooms take.
    guestsDown: guests - 1 >= rooms || guests > cap,
    roomsUp: roomsCanGrow(guests, rooms),
    roomsDown: roomsCanShrink(guests, rooms),
  };
}
