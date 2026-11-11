import assert from "node:assert/strict";
import { test } from "node:test";
import type { IsoDate } from "../dates.ts";
import {
  allocateGuests,
  guestRangeFor,
  MAX_GUESTS_PER_ROOM,
  MAX_GUESTS_PER_STAY,
  MIN_GUESTS_PER_ROOM,
  minRoomsFor,
  occupancyFit,
  occupancyIssues,
  roomsCanGrow,
  roomsCanShrink,
} from "./room-occupancy.ts";
import { validateStay } from "./stay-validation.ts";

test("the rule: one to two guests per room, six rooms, twelve guests", () => {
  assert.equal(MIN_GUESTS_PER_ROOM, 1);
  assert.equal(MAX_GUESTS_PER_ROOM, 2);
  assert.equal(MAX_GUESTS_PER_STAY, 12);
});

test("N rooms take N to 2N guests: every valid combination, and only those", () => {
  for (let rooms = 1; rooms <= 6; rooms++) {
    assert.deepEqual(guestRangeFor(rooms), { min: rooms, max: rooms * 2 });
    for (let guests = 1; guests <= 13; guests++) {
      const valid = guests >= rooms && guests <= rooms * 2;
      assert.equal(occupancyFit(guests, rooms).kind === "fits", valid, `${guests} guests / ${rooms} rooms`);
      if (valid) {
        const split = allocateGuests(guests, rooms);
        assert.equal(split.length, rooms, "exactly the rooms asked for");
        assert.equal(split.reduce((a, b) => a + b, 0), guests, "exactly the guests asked for");
        assert.ok(split.every((n) => n >= 1 && n <= 2));
        assert.deepEqual(occupancyIssues(split), []);
      }
    }
  }
});

test("the owner's cases and the internal split", () => {
  assert.deepEqual(allocateGuests(1, 1), [1]);
  assert.deepEqual(allocateGuests(2, 1), [2]);
  assert.deepEqual(allocateGuests(3, 2), [2, 1]);
  assert.deepEqual(allocateGuests(4, 2), [2, 2]);
  assert.deepEqual(allocateGuests(5, 3), [2, 2, 1]);
  assert.equal(minRoomsFor(5), 3);
  assert.deepEqual(occupancyFit(3, 1), { kind: "over", minRooms: 2 });
  assert.deepEqual(occupancyFit(2, 3), { kind: "under" });
});

test("rooms change only while the guest total still fits", () => {
  assert.equal(roomsCanGrow(3, 2), true, "3 guests → a third room of one each");
  assert.equal(roomsCanGrow(2, 2), false, "a room would be empty");
  assert.equal(roomsCanGrow(12, 6), false, "six rooms at most");
  assert.equal(roomsCanShrink(3, 2), false, "3 guests need 2 rooms");
  assert.equal(roomsCanShrink(4, 3), true);
  assert.equal(roomsCanShrink(2, 1), false, "never below one room");
});

test("server-side stay validation applies the same rule before any provider call", () => {
  const stay = { checkIn: "2026-12-10" as IsoDate, checkOut: "2026-12-12" as IsoDate };
  assert.deepEqual(validateStay({ ...stay, roomAdults: [2, 1] }), { ok: true });
  assert.deepEqual(validateStay({ ...stay, roomAdults: [3] }), { ok: false, issues: ["adults-out-of-range"] });
  assert.deepEqual(validateStay({ ...stay, roomAdults: [1, 0] }), { ok: false, issues: ["adults-out-of-range"] });
});
