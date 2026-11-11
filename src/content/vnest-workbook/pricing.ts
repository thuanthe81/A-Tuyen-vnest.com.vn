/**
 * PRICE PRESENTATION for the property cards (03.3-C1 pricing refinement, 17/10/2026).
 *
 * Separate from the workbook records (records.ts), which carry no price. A card's price is one of
 * four presentation states, chosen by precedence:
 *
 *   1. `quote`        a verified PMS price for the guest's selected dates. Future booking phase;
 *                     nothing supplies one yet. Always wins when present.
 *   2. `from`         an indicative price VNest has approved for public display ("Giá từ"), with
 *                     whatever attributes VNest confirmed (currency, unit, tax). None approved yet.
 *   3. `unverified`   the workbook's lowest weekday figure for the property, shown ONLY in the
 *                     private local preview, as "Giá tham khảo" and the figure as written; the
 *                     page's review line says it is unverified test content. No currency, unit,
 *                     tax treatment or validity is assumed.
 *   4. `unavailable`  nothing may be shown: the card says "Xem giá theo ngày" and no number.
 *
 * Nothing here touches the PMS or the booking contracts: `PmsQuote` is the shape a future quote
 * adapter would hand over, defined here for presentation only.
 */
import { readClientProperties, type ClientProperty } from "./records";
import { RATE_CELLS, RATE_MERGES, RATES_SHEET } from "./rates";
import type { CellRef, QuestionId } from "./sourced";

/** A verified quote for selected dates, from the PMS (future). Amount is the stay total in `currency`. */
export type PmsQuote = { amount: number; currency: string; nights: number; checkIn: string; checkOut: string; taxIncluded: boolean | null };

/** An indicative price VNest approved for public display. Attributes stay null until confirmed. */
export type ApprovedFromPrice = { amount: number; currency: string; unit: "night" | null; taxIncluded: boolean | null; approvedOn: string };

/** The workbook's provisional display candidate: the lowest weekday figure among a property's rooms. */
export type IndicativeCandidate = {
  /** The figure exactly as the workbook writes it, e.g. "1,000,000". */
  raw: string;
  amount: number;
  /** The cell the figure came from, and the cells of the rooms it was compared across. */
  source: readonly CellRef[];
  comparedRows: readonly number[];
  /** Rooms with no rate of their own in the workbook (blank, whether or not a merge is drawn over them). */
  missingRows: readonly number[];
  clarifications: readonly QuestionId[];
};

export type PricePresentation =
  | { kind: "quote"; quote: PmsQuote }
  | { kind: "from"; price: ApprovedFromPrice }
  | { kind: "unverified"; candidate: IndicativeCandidate }
  | { kind: "unavailable"; reason: "not-approved" | "no-data" };

/** Whether unverified workbook figures may be drawn. True only for the private local preview. */
export type PriceAudience = "private-preview" | "public";

export function resolvePrice(input: { quote?: PmsQuote | null; approved?: ApprovedFromPrice | null; candidate?: IndicativeCandidate | null; audience: PriceAudience }): PricePresentation {
  if (input.quote) return { kind: "quote", quote: input.quote };
  if (input.approved) return { kind: "from", price: input.approved };
  if (input.candidate && input.audience === "private-preview") return { kind: "unverified", candidate: input.candidate };
  return { kind: "unavailable", reason: input.candidate ? "not-approved" : "no-data" };
}

const at = (cell: string): CellRef => ({ sheet: RATES_SHEET, cell });
const rowOf = (cell: string) => Number(cell.slice(1));

/** "Ngày thường: 1,100,000 …" → "1,100,000". Null when the cell does not have that form. */
export function weekdayFigure(raw: string): string | null {
  return /Ngày thường:\s*([\d,]+)/.exec(raw)?.[1] ?? null;
}

/** "… Ngày cuối tuần: 1,200,000" → "1,200,000". Null when the cell does not have that form. */
export function weekendFigure(raw: string): string | null {
  return /Ngày cuối tuần:\s*([\d,]+)/.exec(raw)?.[1] ?? null;
}

/**
 * One room's rate as the workbook states it (section 05.2, v2 of 20/10/2026).
 *
 * - `stated`: the room's own L cell holds weekday and weekend text. The figures are kept exactly as
 *   written ("1,100,000"): no currency, unit, tax or validity is added. `drawnOver` lists the rows a
 *   merge stretches the cell across, because VNest may have meant the figure for them too (Q24);
 *   it is never given to them.
 * - `missing`: the room's own L cell is empty. `underMergeOf` names the merged cell drawn over it,
 *   when there is one: a price is not inferred from it, nor from any other room.
 */
export type RoomRate =
  | { kind: "stated"; row: number; raw: string; weekday: string; weekend: string; source: readonly CellRef[]; drawnOver: readonly number[]; clarifications: readonly QuestionId[] }
  | { kind: "missing"; row: number; source: readonly CellRef[]; underMergeOf: string | null; clarifications: readonly QuestionId[] };

function mergeRows(range: string): number[] {
  const [from, to] = range.split(":").map(rowOf) as [number, number];
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

export function roomRate(row: number): RoomRate {
  const own = RATE_CELLS.find((c) => rowOf(c.cell) === row);
  const merge = RATE_MERGES.find((range) => mergeRows(range).includes(row)) ?? null;
  if (own) {
    const weekday = weekdayFigure(own.raw);
    const weekend = weekendFigure(own.raw);
    const drawnOver = merge ? mergeRows(merge).filter((r) => r !== row) : [];
    // Q8: currency, unit, tax, validity and permission to publish. Q24: a merge drawn over other rooms.
    const clarifications: QuestionId[] = drawnOver.length ? ["Q8", "Q24"] : ["Q8"];
    if (weekday && weekend) return { kind: "stated", row, raw: own.raw, weekday, weekend, source: [at(own.cell)], drawnOver, clarifications };
    return { kind: "missing", row, source: [at(own.cell)], underMergeOf: null, clarifications: ["Q8"] };
  }
  const first = merge ? merge.split(":")[0]! : null;
  return { kind: "missing", row, source: [at(`L${row}`)], underMergeOf: first, clarifications: first ? ["Q7", "Q24"] : ["Q7"] };
}

/** The provisional display candidate for one property: the lowest weekday figure its rooms state. */
export function indicativeCandidate(rows: readonly number[]): IndicativeCandidate | null {
  const rates = rows.map(roomRate);
  const priced = rates.flatMap((rate) => (rate.kind === "stated" ? [{ cell: rate.source[0]!.cell, raw: rate.weekday, amount: Number(rate.weekday.replace(/,/g, "")) }] : []));
  if (!priced.length) return null;
  const lowest = priced.reduce((min, p) => (p.amount < min.amount ? p : min));
  const missingRows = rates.filter((rate) => rate.kind === "missing").map((rate) => rate.row);
  return {
    raw: lowest.raw,
    amount: lowest.amount,
    source: [at(lowest.cell)],
    comparedRows: rows,
    missingRows,
    // Q8: currency, unit, tax, validity and permission to publish. Q7: rooms with no rate.
    clarifications: missingRows.length ? ["Q7", "Q8"] : ["Q8"],
  };
}

/** One price presentation per property id. No quote and no approved price exist yet. */
export function cardPrices(audience: PriceAudience, records: readonly ClientProperty[] = readClientProperties()): Record<string, PricePresentation> {
  return Object.fromEntries(records.map((record) => [record.id, resolvePrice({ candidate: indicativeCandidate(record.rows), audience })]));
}

/** Display text for each state. The number is never formatted beyond what is known. */
export function priceText(price: PricePresentation): { label: string | null; amount: string | null; note: string | null } {
  switch (price.kind) {
    case "quote": {
      const amount = new Intl.NumberFormat("vi-VN", { style: "currency", currency: price.quote.currency, maximumFractionDigits: 0 }).format(price.quote.amount);
      return { label: "Giá cho ngày đã chọn", amount, note: `${price.quote.nights} đêm${price.quote.taxIncluded === true ? " · đã gồm thuế" : ""}` };
    }
    case "from": {
      const amount = new Intl.NumberFormat("vi-VN", { style: "currency", currency: price.price.currency, maximumFractionDigits: 0 }).format(price.price.amount);
      const note = [price.price.unit === "night" ? "mỗi đêm" : null, price.price.taxIncluded === true ? "đã gồm thuế" : null].filter(Boolean).join(" · ");
      return { label: "Giá từ", amount, note: note || null };
    }
    case "unverified":
      // Card text kept short at the owner's request (18/10/2026). What the figure is (the lowest
      // weekday rate), that it is unverified and which rooms lack a rate stay in `candidate`, and
      // the page's review line says the figures are unverified test content.
      return { label: "Giá tham khảo", amount: price.candidate.raw, note: null };
    case "unavailable":
      return { label: null, amount: null, note: "Xem giá theo ngày" };
  }
}
