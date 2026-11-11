/**
 * READERS for the property-page details (section 05.2): amenities, transport, rooms, booking
 * policies, nearby places. Generic over the six properties; every value is a `Sourced` value with
 * its cells. A merged cell is reported as shared by the rows it covers, never as a per-room fact.
 *
 * Workbook v2 (20/10/2026): room names come from the overview sheet (C). The room sheet with type,
 * size and capacity is gone; its last values are read from legacy-room-sheet.ts with the status
 * "not-reconfirmed" and never displayed (Q23).
 */
import { NEARBY_SHEET, OVERVIEW_DETAIL_MERGES, OVERVIEW_DETAILS, POLICY_SHEET, POLICY_TIME_CELLS } from "./details";
import { ROOM_SHEET, ROOM_SHEET_MERGES } from "./legacy-room-sheet";
import { readClientProperties, slug } from "./records";
import type { CellRef, Sourced } from "./sourced";
import { ROWS } from "./workbook";

const OVERVIEW = "Tổng quan 6 cơ sở" as const;
const LEGACY_ROOMS = "Cơ sở & danh sách phòng" as const;
const NEARBY = "Thông tin các điểm tham quan" as const;
const POLICIES = "Booking & chính sách" as const;

export const DETAIL_RULES = {
  amenities: "Split at commas; a trailing \",..\" marks the list as incomplete",
  merged: "One merged cell covering several rooms: a shared value, not a per-room fact",
  legacy: "Supplied in the 15/10 workbook's room sheet, which the 20/10 workbook no longer has",
  nearbyBlock: "The block whose header (\"Khu vực các cơ sở: …\") names this property",
  policyTime: "Day fraction with format h:mm, written as hh:mm",
} as const;

const range = (merge: string) => {
  const [from, to] = merge.split(":") as [string, string];
  return { column: from.replace(/\d+/g, ""), first: Number(from.replace(/\D+/g, "")), last: Number(to.replace(/\D+/g, "")) };
};

/** The merge (if any) of `column` that covers `row`. */
function mergeAt(merges: readonly string[], column: string, row: number) {
  return merges.map(range).find((m) => m.column === column && row >= m.first && row <= m.last) ?? null;
}

/** Amenities as supplied (sheet 1, F of the property's first row). */
export function amenitiesOf(firstRow: number): Sourced<readonly string[]> & { incomplete: boolean } {
  const raw = OVERVIEW_DETAILS.find((r) => r.row === firstRow)?.F ?? null;
  const source: CellRef[] = [{ sheet: OVERVIEW, cell: `F${firstRow}` }];
  if (!raw) return { raw: null, display: null, source, status: "missing", incomplete: false };
  const incomplete = /,\s*\.\.\s*$/.test(raw.trim());
  const items = raw
    .trim()
    .replace(/,\s*\.\.\s*$/, "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return { raw, display: items, source, status: "normalized", rule: DETAIL_RULES.amenities, incomplete, ...(incomplete ? { clarification: "Q11" as const } : {}) };
}

/** Transport as supplied (sheet 1, K). */
export function transportOf(firstRow: number): Sourced<string> {
  const raw = OVERVIEW_DETAILS.find((r) => r.row === firstRow)?.K ?? null;
  const source: CellRef[] = [{ sheet: OVERVIEW, cell: `K${firstRow}` }];
  return raw ? { raw, display: raw.trim(), source, status: raw.trim() === raw ? "client-supplied" : "normalized" } : { raw: null, display: null, source, status: "missing" };
}

/**
 * A legacy room fact from the 15/10 room sheet, with the rows its cell covered. Never displayed:
 * `display` is always null and the status is "not-reconfirmed" (or "missing" when it was blank).
 */
export type LegacyRoomFact = Sourced<string> & { coversRows: readonly number[]; shared: boolean };

function legacyFact(column: "D" | "E" | "F", row: number): LegacyRoomFact {
  // An explicit value in the room's own row is the source of truth; a merge is consulted only when the
  // row has none (in the 15/10 sheet a covered row never holds its own value, but the order is explicit).
  // The merge's first row holds the merged value itself, so it stays part of the merge.
  const own = ROOM_SHEET.find((r) => r.row === row)?.[column] ?? null;
  const found = mergeAt(ROOM_SHEET_MERGES, column, row);
  const merge = found && (own === null || found.first === row) ? found : null;
  const origin = merge ? merge.first : row;
  const raw = ROOM_SHEET.find((r) => r.row === origin)?.[column] ?? null;
  const coversRows = merge ? Array.from({ length: merge.last - merge.first + 1 }, (_, i) => merge.first + i) : [row];
  const shared = coversRows.length > 1;
  const source: CellRef[] = [{ sheet: LEGACY_ROOMS, cell: `${column}${origin}` }];
  if (!raw) return { raw: null, display: null, source, status: "missing", coversRows, shared };
  return { raw, display: null, source, status: "not-reconfirmed", rule: DETAIL_RULES.legacy, coversRows, shared, clarification: "Q23" };
}

/**
 * VNest's admin told the project owner that the room information VNest supplied is accurate; the
 * owner relayed this on 21/10/2026. Reconciled scope: it covers what the 15/10 workbook's room
 * sheet supplied, cell by cell, and nothing that sheet left blank. The v2 workbook dropped the
 * sheet without replacing or contradicting it. No written record of the statement is in the
 * repository, so it is recorded here, and VNest is asked to restate it in writing (Q37) before any
 * public release.
 */
export const LEGACY_ROOM_CONFIRMATION = {
  by: "VNest admin, relayed by the project owner",
  relayed: "2026-10-21",
  scope: "Values the 15/10 room sheet supplied, own-row or merged (R3, 25/10/2026); blank cells stay blank",
  written: false,
  question: "Q37",
} as const;

/**
 * R3, the owner's interpretation of the room sheet (25/10/2026), superseding the own-row-only rule of
 * 21/10: a merged cell applies to every row it covers. The property-specific merges (D4:D7, E4:E7,
 * D16:D19, E16:E19, D24:D25, E24:E25) give type and size to each of their rooms; the workbook-wide
 * F4:F25 gives "2 người lớn" to all 22 rooms. Grounds: VNest's admin confirmed the sheet is accurate
 * (LEGACY_ROOM_CONFIRMATION). An explicit per-row value always wins.
 *
 * These are DISPLAY metadata. They are not provider-confirmed occupancy, eligibility or availability:
 * booking code must not enforce them (real restrictions come from ezCloud once connected). Written
 * per-room confirmation from VNest is still wanted before production publication (Q37).
 */
export const ROOM_FACT_INTERPRETATION = {
  rule: "R3",
  /** Approved by the owner as the demo display interpretation (25/10/2026); not a production approval. */
  status: "approved-demo-display",
  decidedBy: "project owner",
  decided: "2026-10-25",
  supersedes: "Own-row values only (21/10/2026)",
  displayOnly: true,
  writtenPerRoomConfirmation: false,
  question: "Q37",
} as const;

export const ROOM_FACT_RULES = {
  ownRow: "Value in the room's own row (source of truth)",
  merged: "Merged cell applied to every row it covers (owner's R3 interpretation, 25/10/2026)",
  displayOnly: "Display metadata only: not provider-confirmed occupancy, eligibility or availability, and not a child policy",
  size: "“28m2” written as “28 m²”",
} as const;

/** The merged range a fact came from, e.g. "E4:E7", or null for a single-row value. */
export function factRange(fact: LegacyRoomFact): string | null {
  if (!fact.shared) return null;
  const column = fact.source[0]!.cell.replace(/\d+/g, "");
  return `${column}${fact.coversRows[0]}:${column}${fact.coversRows[fact.coversRows.length - 1]}`;
}

export function confirmedRoomFact(fact: LegacyRoomFact, row: number, kind: "type" | "size" | "capacity"): Sourced<string> {
  const covered = fact.coversRows.includes(row);
  if (fact.raw === null || !covered) return { raw: null, display: null, source: fact.source, status: "missing", rule: ROOM_FACT_RULES.ownRow };
  const trimmed = fact.raw.trim();
  const display = kind === "size" ? trimmed.replace(/^(\d+(?:[.,]\d+)?)\s*m2$/i, "$1 m²") : trimmed;
  const range = factRange(fact);
  const scope = range ? `${ROOM_FACT_RULES.merged}: ${range}` : ROOM_FACT_RULES.ownRow;
  return {
    raw: fact.raw,
    display,
    source: fact.source,
    status: "confirmed",
    rule: `${DETAIL_RULES.legacy}. Confirmed accurate by ${LEGACY_ROOM_CONFIRMATION.by}, ${LEGACY_ROOM_CONFIRMATION.relayed}; written per-room record pending (${LEGACY_ROOM_CONFIRMATION.question}). ${scope}. ${ROOM_FACT_RULES.displayOnly}${kind === "size" ? `; ${ROOM_FACT_RULES.size}` : ""}`,
    clarification: LEGACY_ROOM_CONFIRMATION.question,
  };
}

export type RoomDetails = {
  row: number;
  /** From the current workbook (overview sheet, C). */
  name: Sourced<string>;
  /** The 15/10 room sheet's type, size and capacity: history only, never shown. */
  legacy: { type: LegacyRoomFact; size: LegacyRoomFact; capacity: LegacyRoomFact };
};

/** The rooms of a property's rows: names from the current workbook, legacy facts kept apart. */
export function roomsOf(rows: readonly number[]): RoomDetails[] {
  return rows.map((row) => {
    const raw = ROWS.find((r) => r.row === row)?.C ?? null;
    const source: CellRef[] = [{ sheet: OVERVIEW, cell: `C${row}` }];
    const name: Sourced<string> = raw ? { raw, display: raw.trim(), source, status: raw.trim() === raw ? "client-supplied" : "normalized" } : { raw: null, display: null, source, status: "missing" };
    return { row, name, legacy: { type: legacyFact("D", row), size: legacyFact("E", row), capacity: legacyFact("F", row) } };
  });
}

export type OrderedWorkbookRoom = {
  /** 1-based position within the property's official workbook room sequence (1..N). */
  position: number;
  /** Workbook row number in `VNest_Informationv2.xlsx` (rows 4–25). */
  row: number;
  /** Stable slugified room ID (`slug(name)`), kept separate from display name and position. */
  id: string;
  /** Official display name verbatim from Column C of `VNest_Informationv2.xlsx`. */
  name: string;
  /** Parent property ID (`bare-chic`, `bare-hyphen`, `bare-da-kao`, `bare-han`, `the-nang-suites`, `pepper-house`). */
  propertyId: string;
  /** Full traced `RoomDetails` (workbook Column C + 15/10 legacy facts for R3). */
  details: RoomDetails;
};

/**
 * Central, property-specific ordered room configuration derived strictly from `VNest_Informationv2.xlsx`
 * (20/10/2026) row sequences (`rows 4–25`).
 *
 * Official workbook sequences:
 * - `bare-chic` (rows 4–7): Bare Chic One, Bare Chic Two, Bare Chic Three, Bare Indochine
 * - `bare-hyphen` (rows 8–11): Bare Hyphen One, Bare Hyphen Two, Bare Hyphen Three, Bare Hyphen Four
 * - `bare-da-kao` (rows 12–15): Bare Đa Kao One, Bare Đa Kao Two, Bare Đa Kao Three, Bare Đa Kao Four
 * - `bare-han` (rows 16–19): Bare Hàn Ground, Bare Hàn One, Bare Hàn Two, Bare Hàn Three
 * - `the-nang-suites` (rows 20–23): Yellow Submarine, Pale Blue Eyes, Green River, Blue Moon
 * - `pepper-house` (rows 24–25): Pepper House 3rd-floor, Pepper House 4th-floor
 */
export const WORKBOOK_ROOM_ORDER_BY_PROPERTY: Readonly<Record<string, readonly OrderedWorkbookRoom[]>> = Object.freeze(
  Object.fromEntries(
    readClientProperties().map((property) => [
      property.id,
      Object.freeze(
        roomsOf(property.rows).flatMap((details, index) => {
          const name = details.name.display;
          if (!name) return [];
          return [
            Object.freeze({
              position: index + 1,
              row: details.row,
              id: slug(name),
              name,
              propertyId: property.id,
              details,
            }),
          ];
        }),
      ),
    ]),
  ),
);

/** Returns the official workbook-ordered rooms for `propertyId` (rows 4–25). */
export function orderedRoomsForProperty(propertyId: string): readonly OrderedWorkbookRoom[] {
  const ordered = WORKBOOK_ROOM_ORDER_BY_PROPERTY[propertyId];
  if (!ordered) throw new Error(`Unknown propertyId "${propertyId}" in WORKBOOK_ROOM_ORDER_BY_PROPERTY`);
  return ordered;
}

/**
 * One line of the booking-policy sheet (new in v2). `publishable` is always false for now: the
 * sheet does not say which properties a line applies to (C is empty on every line), and VNest has
 * not confirmed any of it (Q25). Blank values stay blank; "Không áp dụng" is kept as written and
 * not interpreted.
 */
export type PolicyLine = { row: number; item: string; value: Sourced<string>; appliesTo: Sourced<string>; publishable: false };

const hhmm = (fraction: number) => {
  const minutes = Math.round(fraction * 24 * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};

export function policyLines(): PolicyLine[] {
  return POLICY_SHEET.filter((r) => r.row >= 4 && r.A).map((r) => {
    const cell = `B${r.row}`;
    const source: CellRef[] = [{ sheet: POLICIES, cell }];
    const raw = r.B ?? null;
    const value: Sourced<string> =
      raw === null
        ? { raw: null, display: null, source, status: "missing", clarification: "Q25" }
        : POLICY_TIME_CELLS.includes(cell)
          ? { raw, display: hhmm(Number(raw)), source, status: "normalized", rule: DETAIL_RULES.policyTime, clarification: "Q25" }
          : { raw, display: raw.trim(), source, status: "client-supplied", clarification: "Q25" };
    const appliesTo: Sourced<string> = r.C ? { raw: r.C, display: r.C.trim(), source: [{ sheet: POLICIES, cell: `C${r.row}` }], status: "client-supplied" } : { raw: null, display: null, source: [{ sheet: POLICIES, cell: `C${r.row}` }], status: "missing", clarification: "Q25" };
    return { row: r.row, item: r.A!.trim(), value, appliesTo, publishable: false };
  });
}

export type NearbyPlace = { row: number; kind: "attraction" | "food-drink"; name: Sourced<string>; address: Sourced<string> };

/**
 * The nearby block whose header names the property (short name, e.g. "Bare Chic"). The block is
 * shared by every property its header names; it does not say any place is near this one (Q28).
 */
export function nearbyFor(propertyName: string): { header: Sourced<string>; places: NearbyPlace[] } | null {
  const headers = NEARBY_SHEET.filter((r) => r.A?.startsWith("Khu vực các cơ sở:"));
  const index = headers.findIndex((h) => h.A!.replace("Khu vực các cơ sở:", "").split(",").map((n) => n.trim()).includes(propertyName));
  if (index < 0) return null;
  const head = headers[index]!;
  const end = headers[index + 1]?.row ?? Infinity;
  const places = NEARBY_SHEET.filter((r) => r.row > head.row && r.row < end && (r.B || r.C) && r.A !== "STT").map((r): NearbyPlace => {
    const column = r.B ? "B" : "C";
    const rawName = (r.B ?? r.C)!;
    return {
      row: r.row,
      kind: r.B ? "attraction" : "food-drink",
      name: { raw: rawName, display: rawName.trim(), source: [{ sheet: NEARBY, cell: `${column}${r.row}` }], status: rawName.trim() === rawName ? "client-supplied" : "normalized" },
      address: r.D ? { raw: r.D, display: r.D.trim().replace(/\s{2,}/g, " "), source: [{ sheet: NEARBY, cell: `D${r.row}` }], status: r.D.trim().replace(/\s{2,}/g, " ") === r.D ? "client-supplied" : "normalized", rule: "Surrounding and doubled spaces removed" } : { raw: null, display: null, source: [{ sheet: NEARBY, cell: `D${r.row}` }], status: "missing" },
    };
  });
  return { header: { raw: head.A!, display: head.A!.trim(), source: [{ sheet: NEARBY, cell: `A${head.row}` }], status: "client-supplied", rule: DETAIL_RULES.nearbyBlock }, places };
}

// Sheet 1 merges are listed for completeness (the readers use each property's first row).
export const OVERVIEW_MERGES_FOR_REFERENCE = OVERVIEW_DETAIL_MERGES;
