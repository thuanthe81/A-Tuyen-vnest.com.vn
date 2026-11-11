/**
 * LEGACY REFERENCE, NOT RECONFIRMED. The room sheet "Cơ sở & danh sách phòng" of the 15/10/2026
 * workbook (VNest_Information.xlsx, sha256 b5081c75…a0af6f1): B property, C room, D type, E size,
 * F capacity, with its merges. VNest's 20/10/2026 workbook (v2) no longer has this sheet, so none
 * of these values is current: they are kept to show what was supplied before, every one with the
 * status "not-reconfirmed" (property-details.ts, `legacyRoomFactsOf`), and are never displayed as
 * facts. Verbatim, as generated from the 15/10 workbook's XML on 19/10/2026.
 */

export const LEGACY_ROOM_SHEET_SOURCE = { file: "VNest_Information.xlsx", sheet: "Cơ sở & danh sách phòng", received: "2026-10-15" } as const;

export type RoomSheetRow = { row: number; B?: string; C: string; D?: string; E?: string; F?: string };
export const ROOM_SHEET: readonly RoomSheetRow[] = [
  { row: 4, B: "Bare Chic - Bare Boutique Stays", C: "Bare Chic One", D: "Studio", E: "28m2", F: "2 người lớn" },
  { row: 5, C: "Bare Chic Two" },
  { row: 6, C: "Bare Chic Three" },
  { row: 7, C: "Bare Indochine" },
  { row: 8, B: "Bare Hyphen - Bare Boutique Stays", C: "Bare Hyphen One", D: "Studio", E: "18m2" },
  { row: 9, C: "Bare Hyphen Two", D: "Studio", E: "18m2" },
  { row: 10, C: "Bare Hyphen Three", D: "Studio", E: "18m2" },
  { row: 11, C: "Bare Hyphen Four", D: "Duplex studio", E: "30m2" },
  { row: 12, B: "Bare Đa Kao - Bare Boutique Stays", C: "Bare Đa Kao One", D: "Studio", E: "13m2" },
  { row: 13, C: "Bare Đa Kao Two", D: "Studio", E: "19m2" },
  { row: 14, C: "Bare Đa Kao Three", D: "Studio", E: "19m2" },
  { row: 15, C: "Bare Đa Kao Four", D: "Studio", E: "17m2" },
  { row: 16, B: "Bare Hàn - Bare Boutique Stays", C: "Bare Hàn Ground", D: "Studio", E: "30m2" },
  { row: 17, C: "Bare Hàn One" },
  { row: 18, C: "Bare Hàn Two" },
  { row: 19, C: "Bare Hàn Three" },
  { row: 20, B: "The Nắng Suites", C: "Yellow Submarine", D: "Studio", E: "21m2" },
  { row: 21, C: "Pale Blue Eyes", D: "Studio", E: "23m2" },
  { row: 22, C: "Green River", D: "Studio", E: "30m2" },
  { row: 23, C: "Blue Moon", D: "Studio", E: "36m2" },
  { row: 24, B: "Pepper House", C: "Pepper House 3rd-floor", D: "Studio", E: "40m2" },
  { row: 25, C: "Pepper House 4th-floor" },
];
export const ROOM_SHEET_MERGES: readonly string[] = ["A1:F1", "A2:F2", "A4:A7", "A8:A11", "A12:A15", "A16:A19", "A20:A23", "A24:A25", "B4:B7", "B8:B11", "B12:B15", "B16:B19", "B20:B23", "B24:B25", "D4:D7", "D16:D19", "D24:D25", "E4:E7", "E16:E19", "E24:E25", "F4:F25"];
