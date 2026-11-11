/**
 * VNEST CITY NOTES, the city-level content reader (spec docs/sections/city-notes-spec.md, CS-7,
 * approved as direction 20/10/2026). It reads the destination sheet "Thông tin các điểm tham
 * quan" (NEARBY_SHEET, verbatim) into one note per city: where VNest suggests eating (column C)
 * and looking around (column B), with the address (column D).
 *
 * City level, on purpose: each block serves several properties ("Khu vực các cơ sở: …") and no
 * row ties a place to one property, so nothing here may be read as "near" a property (Q28, Q33).
 * It is not PropertyRecord.nearby, whose entries are defined as near the property. The sheet has
 * no description, photograph, hours, price, rating, coordinates, map link, distance or travel
 * time, and this reader adds none.
 *
 * Every value is Sourced: its raw cell text, its cell, its status and the rule that produced what
 * may be shown. Names are never edited beyond trimming. Known source defects are listed in
 * SOURCE_FLAGS with the exact text they were found in; if VNest changes that cell, the flag no
 * longer matches and the reader refuses to run, so a stale correction can never be applied.
 */
import { NEARBY_SHEET, type NearbySheetRow } from "./details";
import type { CityId } from "./ids";
import type { CellRef, QuestionId, Sourced } from "./sourced";

const SHEET = "Thông tin các điểm tham quan" as const;
const HEADER_PREFIX = "Khu vực các cơ sở:";

/** The two categories, named by what the sheet's columns hold. */
export type CityNoteCategory = "eat" | "explore";
const COLUMN: Record<CityNoteCategory, "B" | "C"> = { explore: "B", eat: "C" };

/** BMP's display names for the cities (the site's convention, as in the Bare Chic draft record). */
export const CITY_LABELS: Readonly<Record<CityId, string>> = { "ho-chi-minh": "TP. Hồ Chí Minh", "da-nang": "Đà Nẵng" };

/** The last part of an address, as the sheet writes it, to a city. */
const CITIES_BY_ADDRESS: Readonly<Record<string, CityId>> = { "Hồ Chí Minh": "ho-chi-minh", "Đà Nẵng": "da-nang" };

/** How many places of each category the first view shows, in the sheet's order, until VNest chooses (Q36). */
export const FEATURED_PER_CATEGORY = 4;

export const CITY_NOTE_RULES = {
  name: "N1: surrounding spaces removed; never respelt",
  L1: "L1: surrounding and doubled spaces removed; a space added after a comma that has none",
  L2: "L2: the final city part removed (the note's heading names the city)",
  L3: "L3: spelling, casing, numbers and the ward or district convention kept as written (Q35)",
  L4: "L4: the street part holds an invalid value, so only the area parts after it are shown until VNest corrects it",
  L5: "L5: shown as written and flagged for VNest to confirm; nothing is corrected",
  N2: "N2: owner-approved display correction (OWNER_CORRECTIONS); the raw cell text is kept",
  city: "The city read from the last part of every address in the block; all must agree",
  featured: `The first ${FEATURED_PER_CATEGORY} of each category in the sheet's order (Q36)`,
} as const;

/**
 * A known defect in a source cell, and what the reader does about it.
 * - `area-only` (rule L4): the street part is not a valid value; show the area parts only.
 * - `as-written` (rule L5): show exactly what VNest wrote, and flag it for confirmation.
 */
export type SourceFlag = { cell: string; raw: string; issue: string; treatment: "area-only" | "as-written"; question: QuestionId };

export const SOURCE_FLAGS: readonly SourceFlag[] = [
  { cell: "D33", raw: "!0 Nguyễn Thiện Thuật, Bình Hiên, Hải Châu, Đà Nẵng", issue: "Số nhà “!0” không hợp lệ (có thể là “10”)", treatment: "area-only", question: "Q32" },
  { cell: "D30", raw: "119 Trần phú, Hải Châu, Đà Nẵng", issue: "Viết hoa “Trần phú” (D28 viết “Trần Phú”)", treatment: "as-written", question: "Q32" },
];

/**
 * Display corrections the project owner approved in writing. The workbook snapshot is never
 * edited: `raw` keeps the cell's text, and the correction is pinned to it like a flag, so a later
 * change to the cell stops the reader instead of being overwritten.
 */
export type OwnerCorrection = { cell: string; raw: string; display: string; approved: string; note: string; resolves: QuestionId };

export const OWNER_CORRECTIONS: readonly OwnerCorrection[] = [
  { cell: "C13", raw: "Bánh mì Huynh Hoa", display: "Bánh mì Huỳnh Hoa", approved: "Project owner, 20/10/2026 (Bare Chic demo brief)", note: "Spelling of the venue's name; resolves the C13 part of Q32", resolves: "Q32" },
];

/** A flag as the place carries it: what is wrong, where, and the question that settles it. */
export type PlaceFlag = { cell: string; issue: string; question: QuestionId };

export type CityNotePlace = {
  /** Stable: the city and the sheet row, e.g. "ho-chi-minh-r5". */
  id: string;
  row: number;
  category: CityNoteCategory;
  name: Sourced<string>;
  /** The concise location line: rules L1–L5. */
  location: Sourced<string>;
  /** The whole address with L1 only, kept for later features (CS-5); not shown now. */
  address: Sourced<string>;
  flags: readonly PlaceFlag[];
};

export type CityNote = {
  city: Sourced<CityId>;
  /** The header's property names. Traced, never shown (CN-D4): naming them invites a "near" reading. */
  serves: Sourced<readonly string[]>;
  /** Every place of the block, in the sheet's order. */
  places: readonly CityNotePlace[];
  /** Place ids for the first view, per category. */
  featured: Readonly<Record<CityNoteCategory, readonly string[]>>;
};

const ref = (cell: string): CellRef[] => [{ sheet: SHEET, cell }];

/** Rule L1. */
export function tidyAddress(text: string): string {
  return text.trim().replace(/,(?=\S)/g, ", ").replace(/\s{2,}/g, " ");
}

function flagFor(cell: string, raw: string): SourceFlag | undefined {
  const flag = SOURCE_FLAGS.find((f) => f.cell === cell);
  if (flag && flag.raw !== raw) {
    throw new Error(`City Notes: the flag for ${cell} was recorded for “${flag.raw}”, but the cell now reads “${raw}”. Review SOURCE_FLAGS before showing it.`);
  }
  return flag;
}

const asPlaceFlag = (f: SourceFlag): PlaceFlag => ({ cell: f.cell, issue: f.issue, question: f.question });

function correctionFor(cell: string, raw: string): OwnerCorrection | undefined {
  const correction = OWNER_CORRECTIONS.find((c) => c.cell === cell);
  if (correction && correction.raw !== raw) {
    throw new Error(`City Notes: the correction for ${cell} was approved for “${correction.raw}”, but the cell now reads “${raw}”. Review OWNER_CORRECTIONS.`);
  }
  return correction;
}

function readName(row: NearbySheetRow, category: CityNoteCategory): { value: Sourced<string>; flag?: SourceFlag } {
  const cell = `${COLUMN[category]}${row.row}`;
  const raw = row[COLUMN[category]]!;
  const flag = flagFor(cell, raw);
  const correction = correctionFor(cell, raw);
  if (correction) {
    return { value: { raw, display: correction.display, source: ref(cell), status: "normalized", rule: `${CITY_NOTE_RULES.N2}: ${correction.approved}` } };
  }
  const display = raw.trim();
  return {
    value: { raw, display, source: ref(cell), status: display === raw ? "client-supplied" : "normalized", rule: flag ? `${CITY_NOTE_RULES.name}; ${CITY_NOTE_RULES.L5}` : CITY_NOTE_RULES.name, ...(flag ? { clarification: flag.question } : {}) },
    ...(flag ? { flag } : {}),
  };
}

function readAddress(row: NearbySheetRow): { location: Sourced<string>; address: Sourced<string>; city: string | null; flag?: SourceFlag } {
  const cell = `D${row.row}`;
  const raw = row.D;
  if (raw === undefined || raw.trim() === "") {
    const missing: Sourced<string> = { raw: null, display: null, source: ref(cell), status: "missing" };
    return { location: missing, address: missing, city: null };
  }
  const flag = flagFor(cell, raw);
  const tidy = tidyAddress(raw);
  const parts = tidy.split(", ");
  const city = parts.length > 1 ? parts.at(-1)! : null;
  let shown = parts.slice(0, -1);
  const rules: string[] = [CITY_NOTE_RULES.L1, CITY_NOTE_RULES.L2, CITY_NOTE_RULES.L3];
  if (flag?.treatment === "area-only") {
    shown = shown.slice(1);
    rules.push(CITY_NOTE_RULES.L4);
  } else if (flag?.treatment === "as-written") {
    rules.push(CITY_NOTE_RULES.L5);
  }
  const clarification = flag ? { clarification: flag.question } : {};
  const location: Sourced<string> = shown.length
    ? { raw, display: shown.join(", "), source: ref(cell), status: "derived", rule: rules.join("; "), ...clarification }
    : { raw, display: null, source: ref(cell), status: "missing", rule: rules.join("; "), ...clarification };
  const address: Sourced<string> = { raw, display: tidy, source: ref(cell), status: tidy === raw ? "client-supplied" : "normalized", rule: CITY_NOTE_RULES.L1, ...clarification };
  return { location, address, city, ...(flag ? { flag } : {}) };
}

/** Every block of the sheet, read into a note. A block whose city cannot be settled has `city.display` null. */
export function readCityNotes(sheet: readonly NearbySheetRow[] = NEARBY_SHEET): CityNote[] {
  const headers = sheet.filter((r) => r.A?.startsWith(HEADER_PREFIX));
  return headers.map((head, i) => {
    const end = headers[i + 1]?.row ?? Infinity;
    const rows = sheet.filter((r) => r.row > head.row && r.row < end && r.A !== "STT" && (r.B?.trim() || r.C?.trim()));
    const read = rows.map((r) => {
      const category: CityNoteCategory = r.C?.trim() ? "eat" : "explore";
      if (r.B?.trim() && r.C?.trim()) throw new Error(`City Notes: row ${r.row} names both a place to visit and a place to eat`);
      return { r, category, name: readName(r, category), address: readAddress(r) };
    });

    const cityNames = [...new Set(read.map((p) => p.address.city).filter((c): c is string => c !== null))];
    const cityId = cityNames.length === 1 ? (CITIES_BY_ADDRESS[cityNames[0]!] ?? null) : null;
    const citySource = read.map((p) => p.address.location.source[0]!);
    const city: Sourced<CityId> = cityId
      ? { raw: cityNames[0]!, display: cityId, source: citySource, status: "derived", rule: CITY_NOTE_RULES.city }
      : { raw: cityNames.join(" | ") || null, display: null, source: citySource, status: cityNames.length > 1 ? "conflict" : "missing", rule: CITY_NOTE_RULES.city };

    const prefix = cityId ?? `block-a${head.row}`;
    const places: CityNotePlace[] = read.map(({ r, category, name, address }) => ({
      id: `${prefix}-r${r.row}`,
      row: r.row,
      category,
      name: name.value,
      location: address.location,
      address: address.address,
      flags: [name.flag, address.flag].filter((f): f is SourceFlag => f !== undefined).map(asPlaceFlag),
    }));

    const headerCell = `A${head.row}`;
    const names = head.A!.slice(HEADER_PREFIX.length).split(",").map((n) => n.trim()).filter(Boolean);
    const featured = (category: CityNoteCategory) => places.filter((p) => p.category === category && isShowable(p)).slice(0, FEATURED_PER_CATEGORY).map((p) => p.id);
    return {
      city,
      serves: { raw: head.A!, display: names, source: ref(headerCell), status: "derived", rule: "The names after “Khu vực các cơ sở:”, split at commas" },
      places,
      featured: { eat: featured("eat"), explore: featured("explore") },
    };
  });
}

/** The gate: a place is shown only with a name. A location that is missing or in conflict is left out, never guessed. */
export function isShowable(place: CityNotePlace): boolean {
  return place.name.display !== null && place.name.display !== "" && place.name.status !== "conflict" && place.name.status !== "missing";
}

const NOTES = readCityNotes();

/** The note for a city, or null when the sheet has none (or its city is not settled): the page then shows no section. */
export function cityNote(city: CityId): CityNote | null {
  return NOTES.find((n) => n.city.display === city) ?? null;
}
