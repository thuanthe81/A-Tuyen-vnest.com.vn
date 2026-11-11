import assert from "node:assert/strict";
import { test } from "node:test";
import { ROOM_SHEET } from "./legacy-room-sheet";
import { confirmedRoomFact, factRange, LEGACY_ROOM_CONFIRMATION, ROOM_FACT_INTERPRETATION, roomsOf } from "./property-details";

const facts = (row: number) => {
  const [room] = roomsOf([row]);
  return {
    legacy: room!.legacy,
    type: confirmedRoomFact(room!.legacy.type, row, "type"),
    size: confirmedRoomFact(room!.legacy.size, row, "size"),
    capacity: confirmedRoomFact(room!.legacy.capacity, row, "capacity"),
  };
};
const shown = (row: number) => {
  const f = facts(row);
  return [f.type.display, f.size.display, f.capacity.display];
};

test("R3 (owner, 25/10/2026): every row of the 15/10 room sheet, merged values applied to the rows they cover", () => {
  const A = "2 người lớn"; // F4:F25, workbook-wide
  const expected: Record<number, [string, string, string]> = {
    4: ["Studio", "28 m²", A], 5: ["Studio", "28 m²", A], 6: ["Studio", "28 m²", A], 7: ["Studio", "28 m²", A], // Bare Chic: D4:D7, E4:E7
    8: ["Studio", "18 m²", A], 9: ["Studio", "18 m²", A], 10: ["Studio", "18 m²", A], 11: ["Duplex studio", "30 m²", A], // Bare Hyphen: own rows
    12: ["Studio", "13 m²", A], 13: ["Studio", "19 m²", A], 14: ["Studio", "19 m²", A], 15: ["Studio", "17 m²", A], // Bare Đa Kao: own rows
    16: ["Studio", "30 m²", A], 17: ["Studio", "30 m²", A], 18: ["Studio", "30 m²", A], 19: ["Studio", "30 m²", A], // Bare Hàn: D16:D19, E16:E19
    20: ["Studio", "21 m²", A], 21: ["Studio", "23 m²", A], 22: ["Studio", "30 m²", A], 23: ["Studio", "36 m²", A], // The Nắng Suites: own rows
    24: ["Studio", "40 m²", A], 25: ["Studio", "40 m²", A], // Pepper House: D24:D25, E24:E25
  };
  for (const [row, values] of Object.entries(expected)) assert.deepEqual(shown(Number(row)), values, `row ${row} (${ROOM_SHEET.find((r) => r.row === Number(row))!.C})`);
});

test("explicit per-row values stay the source of truth; merged values keep their anchor cell and range", () => {
  const hyphenFour = facts(11);
  assert.deepEqual([hyphenFour.size.source[0]!.cell, factRange(hyphenFour.legacy.size)], ["E11", null]);
  assert.match(hyphenFour.size.rule!, /own row/);
  const chicThree = facts(6);
  assert.deepEqual([chicThree.size.raw, chicThree.size.display, chicThree.size.source[0]!.cell, factRange(chicThree.legacy.size)], ["28m2", "28 m²", "E4", "E4:E7"]);
  assert.match(chicThree.size.rule!, /E4:E7/);
  const pepperFour = facts(25);
  assert.deepEqual([pepperFour.capacity.source[0]!.cell, factRange(pepperFour.legacy.capacity)], ["F4", "F4:F25"]);
});

test("each shown value says how it was confirmed, that it is display-only, and that written confirmation is pending", () => {
  const f = facts(5);
  assert.equal(f.capacity.status, "confirmed");
  assert.equal(f.capacity.clarification, LEGACY_ROOM_CONFIRMATION.question);
  assert.match(f.capacity.rule!, /not provider-confirmed occupancy, eligibility or availability, and not a child policy/);
  assert.equal(ROOM_FACT_INTERPRETATION.status, "approved-demo-display");
  assert.match(f.capacity.rule!, /written per-room record pending/);
  assert.deepEqual([ROOM_FACT_INTERPRETATION.rule, ROOM_FACT_INTERPRETATION.displayOnly, ROOM_FACT_INTERPRETATION.writtenPerRoomConfirmation], ["R3", true, false]);
  assert.equal(LEGACY_ROOM_CONFIRMATION.written, false);
});

test("a row outside every merge with a blank cell shows nothing (no value invented)", () => {
  const blank = { raw: null, display: null, source: [{ sheet: "Cơ sở & danh sách phòng" as const, cell: "E99" }], status: "missing" as const, coversRows: [99], shared: false };
  assert.equal(confirmedRoomFact(blank, 99, "size").display, null);
  const elsewhere = facts(4).legacy.size; // E4:E7 does not cover row 8
  assert.equal(confirmedRoomFact(elsewhere, 8, "size").display, null);
});
