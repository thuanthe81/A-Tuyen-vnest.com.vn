/**
 * VERBATIM SNAPSHOT of the workbook's indicative rates, for the PRIVATE preview only (03.3-C1, 05.2).
 *
 * Source: VNest_Informationv2.xlsx (sha256 126e77dc…028241d9, 20/10/2026), sheet "Tổng quan 6 cơ
 * sở", column L "Phân khúc giá", rows 4–25. Generated from the workbook's XML by a script; every
 * string is the cell's exact value, including its run of spaces. The fourteen texts are the same
 * as in the 15/10 workbook; v2 adds one merge, L8:L10. Kept apart from workbook.ts on purpose: the
 * content records carry no price, and these figures are not prices. They are client-supplied
 * indicative rates with no stated currency, unit, tax treatment or validity, and no permission to
 * publish (audit Q8). Only pricing.ts reads this file.
 *
 * A rate belongs to the room on its own row. A merged range (L4:L7 …) is drawn across several
 * rooms in the sheet, but the value sits on the first row only; the rows it is drawn over are
 * reported as having no rate of their own (pricing.ts, `roomRate`), never given the first row's.
 */

export const RATES_SHEET = "Tổng quan 6 cơ sở" as const;

/** Non-empty L cells. Fourteen of the 22 room rows have one; eight have none. */
export const RATE_CELLS: readonly { cell: string; raw: string }[] = [
  { cell: "L4", raw: "Ngày thường: 1,100,000                Ngày cuối tuần: 1,200,000" },
  { cell: "L8", raw: "Ngày thường: 1,000,000                Ngày cuối tuần: 1,100,000" },
  { cell: "L11", raw: "Ngày thường: 1,080,000                Ngày cuối tuần: 1,180,000" },
  { cell: "L12", raw: "Ngày thường: 1,000,000                Ngày cuối tuần: 1,100,000" },
  { cell: "L13", raw: "Ngày thường: 1,050,000                Ngày cuối tuần: 1,150,000" },
  { cell: "L15", raw: "Ngày thường: 1,200,000                Ngày cuối tuần: 1,300,000" },
  { cell: "L16", raw: "Ngày thường: 1,160,000                Ngày cuối tuần: 1,260,000" },
  { cell: "L17", raw: "Ngày thường: 1,110,000                Ngày cuối tuần: 1,210,000" },
  { cell: "L18", raw: "Ngày thường: 1,200,000                Ngày cuối tuần: 1,300,000" },
  { cell: "L20", raw: "Ngày thường: 840,000                         Ngày cuối tuần: 940,000" },
  { cell: "L21", raw: "Ngày thường: 970,000                         Ngày cuối tuần: 1,070,000" },
  { cell: "L22", raw: "Ngày thường: 1,085,000                         Ngày cuối tuần: 1,185,000" },
  { cell: "L23", raw: "Ngày thường: 1,390,000                         Ngày cuối tuần: 1,500,000" },
  { cell: "L24", raw: "Ngày thường: 1,215,000                         Ngày cuối tuần: 1,315,000" },
];

/** Merged L ranges, as drawn in the sheet. */
export const RATE_MERGES: readonly string[] = ["L13:L14","L18:L19","L24:L25","L4:L7","L8:L10"];
