/**
 * Source-traceable values for client content (03.3-C1). Every value the preview may show keeps
 * the workbook text it came from, the cells it came from, how sure we are of it, and the open
 * question that would settle it. Nothing here is a price or availability: those come from the
 * PMS through the booking contract, never from static content.
 */

/** Sheets of the current workbook (v2, 20/10/2026), and the room sheet of the 15/10 workbook, which v2 dropped. */
export type SheetName = "Tổng quan 6 cơ sở" | "Thông tin các điểm tham quan" | "Booking & chính sách" | "Cơ sở & danh sách phòng";

export type CellRef = { sheet: SheetName; cell: string };

/**
 * - `client-supplied`: shown exactly as written in the workbook.
 * - `normalized`: the workbook text, changed by a written rule (`rule`).
 * - `derived`: not written in the workbook, worked out from it by a written rule.
 * - `conflict`: the workbook contradicts itself or another source; nothing is shown.
 * - `missing`: the workbook has no value; nothing is shown.
 * - `corroborated`: matched by independent public sources (see `evidence`), not yet by VNest.
 * - `not-reconfirmed`: supplied in an earlier workbook and absent from the current one. Kept as a
 *   legacy reference only; nothing is shown.
 * - `confirmed`: VNest has confirmed it. Since 21/10/2026 only the legacy room facts, on the
 *   admin statement the project owner relayed (`LEGACY_ROOM_CONFIRMATION`; written record: Q37).
 */
export type Verification = "client-supplied" | "normalized" | "derived" | "corroborated" | "conflict" | "missing" | "not-reconfirmed" | "confirmed";

/** An independent public source, as read on `checked`: what it says, quoted or closely paraphrased. */
export type Evidence = { url: string; says: string; checked: string; note?: string };

/**
 * Open questions, numbered as in the audit (docs/content/CLIENT-DATA-AUDIT-2026-10-15.md §7); Q22–Q30
 * were added by the v2 source diff (docs/content/WORKBOOK-V2-SOURCE-DIFF-2026-10-20.md).
 */
export type QuestionId = `Q${number}`;

export type Sourced<T> = {
  /** Exactly as in the workbook, never edited. Null when the workbook has nothing. */
  raw: string | null;
  /** What the UI may show. Null when nothing may be shown. */
  display: T | null;
  source: readonly CellRef[];
  status: Verification;
  /** The written rule, when the status is `normalized` or `derived`. */
  rule?: string;
  /** The question for VNest that would settle this value, if one is open. */
  clarification?: QuestionId;
  /** Independent sources consulted for this value, when the workbook alone does not settle it. */
  evidence?: readonly Evidence[];
};
