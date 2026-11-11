import { isBefore, type IsoDate } from "@/domain/dates";
import { MAX_GUESTS_PER_ROOM, MAX_GUESTS_PER_STAY, MAX_ROOMS_PER_STAY, minRoomsFor, occupancyFit, occupancyIssues } from "@/domain/hybrid-booking/room-occupancy";
import { totalRequestedAdults, type RoomGroupSlot } from "@/features/demo/booking-results-state";
import { OCCUPANCY_LABEL } from "@/features/demo/occupancy-copy";

/** "Phòng 01": the slot label used in the slots, the guidance and the summary. */
export const slotLabel = (slotIndex: number) => `Phòng ${String(slotIndex).padStart(2, "0")}`;

export type BookingGuidance = { step: "dates" | "occupancy" | "rooms"; message: string; slotIndex?: number };

/**
 * What still stands between the guest and a valid request, in the order they meet it: stay dates, then an allowed
 * occupancy (1–2 guests per room, room-occupancy.ts), then a room type for every slot. `null` means BOOK NOW may open the
 * request review, which still says that nothing is booked.
 */
export function bookingGuidance(input: {
  checkIn?: IsoDate;
  checkOut?: IsoDate;
  roomGroups: readonly RoomGroupSlot[];
  /** The guest total held by the search (header field), when there is one. */
  searchGuests?: number;
}): BookingGuidance | null {
  const { checkIn, checkOut, roomGroups } = input;
  if (!checkIn || !checkOut || !isBefore(checkIn, checkOut)) {
    return { step: "dates", message: "Chọn ngày nhận và trả phòng để tiếp tục." };
  }
  const guests = input.searchGuests ?? totalRequestedAdults(roomGroups);
  const fit = occupancyFit(guests, roomGroups.length);
  if (fit.kind !== "fits" || occupancyIssues(roomGroups.map((g) => g.adults)).length) {
    const message =
      fit.kind === "under"
        ? `Mỗi phòng cần ít nhất 1 khách: ${roomGroups.length} phòng cần ít nhất ${roomGroups.length} khách. Điều chỉnh ở mục ${OCCUPANCY_LABEL} để tiếp tục.`
        : guests > MAX_GUESTS_PER_STAY
          ? `Mỗi yêu cầu tối đa ${MAX_ROOMS_PER_STAY} phòng, ${MAX_GUESTS_PER_STAY} khách. Giảm số khách ở mục ${OCCUPANCY_LABEL} để tiếp tục.`
          : `Mỗi phòng tối đa ${MAX_GUESTS_PER_ROOM} khách: ${guests} khách cần ít nhất ${minRoomsFor(guests)} phòng. Điều chỉnh ở mục ${OCCUPANCY_LABEL} để tiếp tục.`;
    return { step: "occupancy", message };
  }
  const empty = roomGroups.find((g) => g.preferredRoomId === null);
  if (empty) {
    return { step: "rooms", slotIndex: empty.slotIndex, message: `Chọn loại phòng cho ${slotLabel(empty.slotIndex)} để tiếp tục.` };
  }
  return null;
}

