/**
 * PUBLIC STARTING RATES ("Chỉ từ … / đêm") for the property room cards (owner brief, 25/10/2026).
 *
 * A rate is listed here only when VNest has approved it for publication, with a confirmed currency
 * and pricing basis. The workbook's column-L figures are indicative and private (`pricing.ts`); they
 * are never copied here automatically and never treated as a quote. When ezCloud is connected,
 * stay-specific prices from the provider replace static starting rates for booking decisions.
 *
 * None is approved yet, so every room card shows the neutral "Xem giá theo ngày".
 */
export type PublicStartingRate = {
  /** Whole currency units, e.g. 1200000 for 1.200.000 ₫. */
  amount: number;
  currency: "VND";
  basis: "per-night";
  approvedBy: string;
  /** ISO date of VNest's publication approval. */
  approvedOn: string;
  /** Where the approval is recorded (message, document). */
  record: string;
};

/** Keyed by property slug, then room id (e.g. "bare-chic" → "bare-chic-one"). Empty until VNest approves. */
export const PUBLIC_STARTING_RATES: Readonly<Record<string, Readonly<Record<string, PublicStartingRate>>>> = {};

export function publicStartingRate(propertySlug: string, roomId: string): PublicStartingRate | null {
  return PUBLIC_STARTING_RATES[propertySlug]?.[roomId] ?? null;
}

/** "1.200.000 ₫": Vietnamese grouping, no decimals. */
export function formatStartingRate(rate: PublicStartingRate): string {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(rate.amount)} ₫`;
}
