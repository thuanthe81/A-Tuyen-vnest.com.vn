import assert from "node:assert/strict";
import { test } from "node:test";
import type { IsoDate } from "@/domain/dates";
import { createRoomSlot } from "@/features/demo/booking-results-state";
import { occupancyNote, occupancySteps, occupancySummary } from "@/features/demo/occupancy-copy";
import { bookingGuidance, slotLabel } from "./booking-guidance";

const dates = { checkIn: "2026-11-20" as IsoDate, checkOut: "2026-11-22" as IsoDate };
const slots = (...rooms: [number, string | null][]) => rooms.map(([adults, room], i) => createRoomSlot(i + 1, adults, room));

test("BOOK NOW without stay dates asks for them first", () => {
  const g = bookingGuidance({ roomGroups: slots([2, "bare-da-kao-one"]) });
  assert.equal(g?.step, "dates");
  assert.equal(g?.message, "Chọn ngày nhận và trả phòng để tiếp tục.");
  assert.equal(bookingGuidance({ checkIn: dates.checkIn, roomGroups: slots([2, "x"]) })?.step, "dates", "check-out missing");
});

test("BOOK NOW with an incomplete selection names the first empty slot", () => {
  const g = bookingGuidance({ ...dates, roomGroups: slots([2, "bare-da-kao-two"], [1, null]) });
  assert.deepEqual(g, { step: "rooms", slotIndex: 2, message: "Chọn loại phòng cho Phòng 02 để tiếp tục." });
});

test("BOOK NOW with a disallowed occupancy explains the rule and where to change it", () => {
  // The search holds 5 guests but the slots seat only 4 (two rooms): never a silent drop.
  const g = bookingGuidance({ ...dates, roomGroups: slots([2, "a"], [2, "b"]), searchGuests: 5 });
  assert.equal(g?.step, "occupancy");
  assert.equal(g?.message, "Mỗi phòng tối đa 2 khách: 5 khách cần ít nhất 3 phòng. Điều chỉnh ở mục Phòng & khách để tiếp tục.");
  const big = bookingGuidance({ ...dates, roomGroups: slots([2, "a"]), searchGuests: 14 });
  assert.match(big!.message, /tối đa 6 phòng, 12 khách/);
});

test("a complete, allowed request has no guidance (the review step still says nothing is booked)", () => {
  for (const [guests, rooms] of [
    [[1], 1],
    [[2], 1],
    [[2, 1], 2],
    [[2, 2], 2],
    [[2, 2, 1], 3],
  ] as const) {
    const groups = guests.map((n, i) => createRoomSlot(i + 1, n, `room-${i}`));
    assert.equal(groups.length, rooms);
    assert.equal(bookingGuidance({ ...dates, roomGroups: groups, searchGuests: guests.reduce((a, b) => a + b, 0) }), null);
  }
});

test("slot labels and the shared summary", () => {
  assert.equal(slotLabel(1), "Phòng 01");
  assert.equal(occupancySummary(3, 2), "3 khách · 2 phòng");
});

test("the shared field's note says the rule that limits the next step", () => {
  assert.equal(occupancyNote(2, 1), "Mỗi phòng tối đa 2 khách. Vui lòng thêm phòng nếu cần.", "the owner's wording at the guest cap");
  assert.equal(occupancyNote(4, 2), "Mỗi phòng tối đa 2 khách. Vui lòng thêm phòng nếu cần.");
  assert.equal(occupancyNote(3, 2), "3 khách cần ít nhất 2 phòng (mỗi phòng tối đa 2 khách).", "why the room cannot be removed");
  assert.equal(occupancyNote(1, 1), "Mỗi phòng cần ít nhất 1 khách: thêm khách trước khi thêm phòng.");
  assert.equal(occupancyNote(2, 2), "Mỗi phòng cần ít nhất 1 khách: thêm khách trước khi thêm phòng.");
  assert.equal(occupancyNote(3, 3), "Mỗi phòng cần ít nhất 1 khách: thêm khách trước khi thêm phòng.");
  assert.equal(occupancyNote(12, 6), "Tối đa 6 phòng, 12 khách cho mỗi yêu cầu.");
  assert.equal(occupancyNote(3, 1), "Mỗi phòng tối đa 2 khách: 3 khách cần ít nhất 2 phòng. Thêm phòng hoặc giảm số khách.");
  assert.equal(occupancyNote(2, 3), "Mỗi phòng cần ít nhất 1 khách: 3 phòng cần ít nhất 3 khách. Bớt phòng hoặc thêm khách.");
});

test("the steppers offer only steps that keep the rule; never a room for a guest", () => {
  assert.deepEqual(occupancySteps(2, 1), { guestsUp: false, guestsDown: true, roomsUp: true, roomsDown: false });
  assert.deepEqual(occupancySteps(3, 2), { guestsUp: true, guestsDown: true, roomsUp: true, roomsDown: false });
  assert.deepEqual(occupancySteps(2, 2), { guestsUp: true, guestsDown: false, roomsUp: false, roomsDown: true });
  assert.deepEqual(occupancySteps(12, 6), { guestsUp: false, guestsDown: true, roomsUp: false, roomsDown: false });
  // An outdated address: only the steps towards a fit.
  assert.deepEqual(occupancySteps(3, 1), { guestsUp: false, guestsDown: true, roomsUp: true, roomsDown: false });
  assert.deepEqual(occupancySteps(2, 3), { guestsUp: true, guestsDown: false, roomsUp: false, roomsDown: true });
});

test("BOOK NOW with fewer guests than rooms explains it", () => {
  const g = bookingGuidance({ ...dates, roomGroups: slots([1, "a"], [1, "b"], [1, "c"]), searchGuests: 2 });
  assert.equal(g?.message, "Mỗi phòng cần ít nhất 1 khách: 3 phòng cần ít nhất 3 khách. Điều chỉnh ở mục Phòng & khách để tiếp tục.");
});
