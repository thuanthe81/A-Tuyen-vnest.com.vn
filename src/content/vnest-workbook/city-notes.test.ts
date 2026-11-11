import assert from "node:assert/strict";
import { test } from "node:test";
import { cityNote, CITY_NOTE_RULES, FEATURED_PER_CATEGORY, isShowable, OWNER_CORRECTIONS, readCityNotes, SOURCE_FLAGS, tidyAddress } from "./city-notes";
import { NEARBY_SHEET, type NearbySheetRow } from "./details";

/**
 * All 30 places, as the reader must give them: name cell, category, name shown, location shown.
 * Written out by hand from the sheet (rows 4–18 and 22–36), so any change to the source, the rules
 * or the reader shows up here.
 */
const EXPECTED = {
  "ho-chi-minh": [
    ["B4", "explore", "Dinh Độc Lập", "135 Nam Kỳ Khởi Nghĩa, Phường Sài Gòn"],
    ["C5", "eat", "ThaiYen Cafe", "32 Nguyễn Đình Chiểu, Phường Tân Định"],
    ["B6", "explore", "Phố đi bộ Nguyễn Huệ", "Đường Nguyễn Huệ, Phường Sài Gòn"],
    ["C7", "eat", "Cơm niêu Thiên Lý", "16 Nguyễn Đình Chiểu, Phường Tân Định"],
    ["B8", "explore", "Nhà thờ Đức Bà Sài Gòn & Bưu điện Trung tâm Thành phố", "2 Công trường Công xã Paris, Phường Sài Gòn"],
    ["C9", "eat", "Phở Phượng", "25 Hoàng Sa, Phường Sài Gòn"],
    ["B10", "explore", "Chợ Bến Thành", "Đường Lê Lợi, Phường Sài Gòn"],
    ["C11", "eat", "Lunch Lady", "Lô C1 Chung Cư 1A1B Nguyễn Đình Chiểu, Phường Sài Gòn"],
    ["B12", "explore", "Thảo Cầm Viên Sài Gòn", "2 Nguyễn Bỉnh Khiêm, Phường Sài Gòn"],
    ["C13", "eat", "Bánh mì Huỳnh Hoa", "26 Lê Thị Riêng, Phường Bến Thành"],
    ["B14", "explore", "Bảo tàng Chứng tích chiến tranh", "28 Võ Văn Tần, Phường Xuân Hòa"],
    ["C15", "eat", "Hủ tiếu nam vang Thành Đạt", "34 Cô Bắc, Phường Cầu Ông Lãnh"],
    ["B16", "explore", "Bảo tàng Mỹ Thuật Thành phố Hồ Chí Minh", "97 Phó Đức Chính, Phường Bến Thành"],
    ["C17", "eat", "Bánh mì chim chạy", "11/4 Nguyễn Thị Minh Khai, Phường Sài Gòn"],
    ["B18", "explore", "Nhà thờ Tân Định", "289 Hai Bà Trưng, Phường Xuân Hòa"],
  ],
  "da-nang": [
    ["B22", "explore", "Bán đảo Sơn Trà", "Sơn Trà"],
    ["C23", "eat", "Hải sản Năm Đảnh", "139/59/38 Trần Quang Khải, Sơn Trà"],
    ["B24", "explore", "Ngũ Hành Sơn", "81 Huyền Trân Công Chúa, Hoà Hải, Ngũ Hành Sơn"],
    ["C25", "eat", "Bún chả cá 109", "109 Nguyễn Chí Thanh, Hải Châu"],
    ["B26", "explore", "Cầu Rồng", "An Hải"],
    ["C27", "eat", "Bún mắm Vân", "23/14 Trần Kế Xương, Hải Châu"],
    ["B28", "explore", "Nhà thờ chính toà Đà Nẵng (Nhà thờ Con Gà)", "156 Trần Phú, Hải Châu"],
    ["C29", "eat", "Bánh xèo Bà Dưỡng", "280/23 Hoàng Diệu, Hải Châu"],
    ["B30", "explore", "Chợ Hàn", "119 Trần phú, Hải Châu"],
    ["C31", "eat", "Tiệm kiết (cà phê)", "K332/22a Hoàng Diệu, Hải Châu"],
    ["B32", "explore", "Chợ Cồn", "90 Hùng Vương, Hải Châu"],
    ["C33", "eat", "Tan coffee", "Bình Hiên, Hải Châu"],
    ["B34", "explore", "Biển Mỹ Khê", "Sơn Trà"],
    ["C35", "eat", "Bếp của ngoại", "136b Yên Bái, Hải Châu"],
    ["B36", "explore", "Bảo tàng Điêu khắc Chăm", "Số 2 đường 2/9, Hải Châu"],
  ],
} as const;

test("two notes, one per city, 15 places each: 7 to eat and 8 to explore", () => {
  const notes = readCityNotes();
  assert.deepEqual(
    notes.map((n) => n.city.display),
    ["ho-chi-minh", "da-nang"],
  );
  for (const note of notes) {
    assert.equal(note.places.length, 15);
    assert.equal(note.places.filter((p) => p.category === "eat").length, 7);
    assert.equal(note.places.filter((p) => p.category === "explore").length, 8);
  }
});

for (const [city, rows] of Object.entries(EXPECTED) as [keyof typeof EXPECTED, (typeof EXPECTED)[keyof typeof EXPECTED]][]) {
  test(`${city}: every place, its cell, category, name and location`, () => {
    const note = cityNote(city);
    assert.ok(note);
    assert.deepEqual(
      note.places.map((p) => [p.name.source[0]!.cell, p.category, p.name.display, p.location.display]),
      rows.map((r) => [...r]),
    );
  });
}

test("every value keeps its raw cell text and its cell on the destination sheet", () => {
  const byRow = new Map(NEARBY_SHEET.map((r) => [r.row, r]));
  for (const note of readCityNotes()) {
    for (const place of note.places) {
      const row = byRow.get(place.row)!;
      const column = place.category === "eat" ? "C" : "B";
      assert.equal(place.name.raw, row[column]);
      assert.deepEqual(place.name.source, [{ sheet: "Thông tin các điểm tham quan", cell: `${column}${place.row}` }]);
      assert.equal(place.location.raw, row.D);
      assert.equal(place.address.raw, row.D);
      assert.deepEqual(place.location.source, [{ sheet: "Thông tin các điểm tham quan", cell: `D${place.row}` }]);
      assert.equal(place.location.status, "derived");
      assert.match(place.location.rule!, /L1.*L2/);
      assert.ok(place.id.endsWith(`-r${place.row}`));
    }
  }
});

test("names are never edited except by an owner-approved correction: otherwise the shown name is the cell text, trimmed", () => {
  for (const note of readCityNotes()) {
    for (const p of note.places) {
      const correction = OWNER_CORRECTIONS.find((c) => c.cell === p.name.source[0]!.cell);
      assert.equal(p.name.display, correction ? correction.display : p.name.raw!.trim());
    }
  }
});

test("no location keeps its city part, and none is longer than its raw address", () => {
  for (const note of readCityNotes()) {
    for (const p of note.places) {
      assert.ok(!/(Hồ Chí Minh|Đà Nẵng)$/.test(p.location.display!), `${p.id}: ${p.location.display}`);
      assert.ok(p.location.display!.length < p.location.raw!.length);
    }
  }
});

test("L1 tidies spaces only; it never respells", () => {
  assert.equal(tidyAddress(" 2 Công trường Công xã Paris, Phường  Sài Gòn, Hồ Chí Minh"), "2 Công trường Công xã Paris, Phường Sài Gòn, Hồ Chí Minh");
  assert.equal(tidyAddress("Lô C1 Chung Cư 1A1B Nguyễn Đình Chiểu,Phường Sài Gòn, Hồ Chí Minh"), "Lô C1 Chung Cư 1A1B Nguyễn Đình Chiểu, Phường Sài Gòn, Hồ Chí Minh");
  assert.equal(tidyAddress("119 Trần phú, Hải Châu, Đà Nẵng"), "119 Trần phú, Hải Châu, Đà Nẵng");
  const lunchLady = cityNote("ho-chi-minh")!.places.find((p) => p.row === 11)!;
  assert.equal(lunchLady.address.status, "normalized");
  assert.equal(lunchLady.address.display, "Lô C1 Chung Cư 1A1B Nguyễn Đình Chiểu, Phường Sài Gòn, Hồ Chí Minh");
});

test("D33: the invalid street number falls back to the area (L4), flagged, with the raw text kept", () => {
  const tan = cityNote("da-nang")!.places.find((p) => p.row === 33)!;
  assert.equal(tan.location.raw, "!0 Nguyễn Thiện Thuật, Bình Hiên, Hải Châu, Đà Nẵng");
  assert.equal(tan.location.display, "Bình Hiên, Hải Châu");
  assert.ok(tan.location.rule!.includes(CITY_NOTE_RULES.L4));
  assert.equal(tan.location.clarification, "Q32");
  assert.deepEqual(
    tan.flags.map((f) => f.cell),
    ["D33"],
  );
  assert.ok(!JSON.stringify(tan.location.display).includes("!0"));
});

test("D30: the street is kept exactly as written (L5), not corrected and not discarded, and flagged", () => {
  const han = cityNote("da-nang")!.places.find((p) => p.row === 30)!;
  assert.equal(han.location.display, "119 Trần phú, Hải Châu");
  assert.ok(han.location.rule!.includes(CITY_NOTE_RULES.L5));
  assert.ok(!han.location.rule!.includes(CITY_NOTE_RULES.L4));
  assert.equal(han.location.clarification, "Q32");
  assert.deepEqual(
    han.flags.map((f) => [f.cell, f.question]),
    [["D30", "Q32"]],
  );
});

test("C13: the owner-approved correction shows “Bánh mì Huỳnh Hoa”; the snapshot keeps “Huynh Hoa”", () => {
  const hoa = cityNote("ho-chi-minh")!.places.find((p) => p.row === 13)!;
  assert.equal(hoa.name.display, "Bánh mì Huỳnh Hoa");
  assert.equal(hoa.name.raw, "Bánh mì Huynh Hoa");
  assert.equal(NEARBY_SHEET.find((r) => r.row === 13)!.C, "Bánh mì Huynh Hoa");
  assert.equal(hoa.name.status, "normalized");
  assert.ok(hoa.name.rule!.startsWith(CITY_NOTE_RULES.N2));
  assert.deepEqual(hoa.flags, []);
});

test("a correction approved for different text stops the reader", () => {
  const sheet = NEARBY_SHEET.map((r) => (r.row === 13 ? { ...r, C: "Bánh mì Huỳnh Hoa" } : r));
  assert.throws(() => readCityNotes(sheet), /C13/);
});

test("exactly two places carry flags, and every flag matches its cell's current text", () => {
  const flagged = readCityNotes().flatMap((n) => n.places.filter((p) => p.flags.length).map((p) => p.flags.map((f) => f.cell).join()));
  assert.deepEqual(flagged.sort(), ["D30", "D33"]);
  for (const flag of SOURCE_FLAGS) {
    const row = NEARBY_SHEET.find((r) => r.row === Number(flag.cell.slice(1)))!;
    assert.equal(row[flag.cell[0] as "C" | "D"], flag.raw, `${flag.cell} changed: review the flag`);
  }
});

test("a flag recorded for different text stops the reader instead of applying a stale fix", () => {
  const sheet = NEARBY_SHEET.map((r) => (r.row === 33 ? { ...r, D: "10 Nguyễn Thiện Thuật, Bình Hiên, Hải Châu, Đà Nẵng" } : r));
  assert.throws(() => readCityNotes(sheet), /D33/);
});

test("the first view: the first four of each category, in the sheet's order", () => {
  assert.equal(FEATURED_PER_CATEGORY, 4);
  const hcm = cityNote("ho-chi-minh")!;
  const names = (ids: readonly string[]) => ids.map((id) => hcm.places.find((p) => p.id === id)!.name.display);
  assert.deepEqual(names(hcm.featured.eat), ["ThaiYen Cafe", "Cơm niêu Thiên Lý", "Phở Phượng", "Lunch Lady"]);
  assert.deepEqual(names(hcm.featured.explore), ["Dinh Độc Lập", "Phố đi bộ Nguyễn Huệ", "Nhà thờ Đức Bà Sài Gòn & Bưu điện Trung tâm Thành phố", "Chợ Bến Thành"]);
});

test("the header's properties are traced but the city is the note's identity", () => {
  assert.deepEqual(cityNote("ho-chi-minh")!.serves.display, ["Bare Chic", "Bare Đa Kao", "Bare Hyphen", "Pepper House"]);
  assert.deepEqual(cityNote("da-nang")!.serves.display, ["Bare Hàn", "The Nắng Suites"]);
  assert.equal(cityNote("ho-chi-minh")!.serves.source[0]!.cell, "A2");
});

test("nothing the sheet lacks is invented: no distance, time, rating, hours, price or map", () => {
  const text = JSON.stringify(readCityNotes());
  for (const absent of ["km", "phút", "gần", "★", "giờ mở", "VND", "maps.", "http"]) assert.ok(!text.includes(absent), `found "${absent}"`);
});

// Gates, on synthetic sheets.
const block = (rows: NearbySheetRow[]): NearbySheetRow[] => [{ row: 1, A: "Khu vực các cơ sở: Một, Hai" }, { row: 2, A: "STT", B: "x", C: "y", D: "z" }, ...rows];

test("gate: addresses that disagree on the city leave the note without a city, so no page shows it", () => {
  const [note] = readCityNotes(
    block([
      { row: 3, A: "1", B: "Nơi A", D: "1 Đường A, Hồ Chí Minh" },
      { row: 4, A: "2", C: "Quán B", D: "2 Đường B, Đà Nẵng" },
    ]),
  );
  assert.equal(note!.city.display, null);
  assert.equal(note!.city.status, "conflict");
});

test("gate: a place without an address keeps its name and shows no location", () => {
  const [note] = readCityNotes(
    block([
      { row: 3, A: "1", B: "Nơi A", D: "1 Đường A, Hồ Chí Minh" },
      { row: 4, A: "2", C: "Quán B" },
    ]),
  );
  const quan = note!.places.find((p) => p.row === 4)!;
  assert.equal(quan.location.status, "missing");
  assert.equal(quan.location.display, null);
  assert.ok(isShowable(quan));
  assert.equal(note!.city.display, "ho-chi-minh");
});

test("gate: a row naming both a place to visit and a place to eat is refused", () => {
  assert.throws(() => readCityNotes(block([{ row: 3, A: "1", B: "Nơi A", C: "Quán B", D: "1 Đường A, Hồ Chí Minh" }])), /row 3/);
});
