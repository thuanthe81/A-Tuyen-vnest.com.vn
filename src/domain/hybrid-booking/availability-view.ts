import type { PropertyAvailabilityState, VerifiedQuote } from "./property-availability.ts";

/**
 * THE GUEST-FACING WORDING OF AN AVAILABILITY STATE (client-safe, pure).
 *
 * All copy for the states lives here so property cards, the property page and the booking step say the
 * same thing and no component decides what a provider state means. Wording stays free of provider names
 * and technical terms. An `error` or `unconfigured` state is never worded as "sold out".
 */
export type AvailabilityTone = "positive" | "neutral" | "caution";

export type AvailabilityView = {
  status: PropertyAvailabilityState["status"];
  tone: AvailabilityTone;
  headline: string;
  detail?: string;
  /** Present only for a provider-confirmed quote (or a labelled simulation). */
  price?: { amount: string; context: string; conditions: readonly string[]; simulated: boolean };
  /** A failed check the guest may try again. */
  retryable: boolean;
  /** The stay was verified as having rooms: continuing in VNest's own booking interface is meaningful. */
  verifiedAvailable: boolean;
  simulated: boolean;
};

export function formatMoney(amount: number, currency: string): string {
  const grouped = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(amount);
  return currency === "VND" ? `${grouped} ₫` : `${grouped} ${currency}`;
}

function priceOf(quote: VerifiedQuote | null) {
  if (!quote) return undefined;
  return {
    amount: formatMoney(quote.totalAmount, quote.currency),
    context: `Tổng ${quote.nights} đêm · ${quote.rateContext}`,
    conditions: quote.conditions,
    simulated: quote.source === "simulation",
  };
}

export function describeAvailability(state: PropertyAvailabilityState): AvailabilityView {
  const base = { status: state.status, retryable: false, verifiedAvailable: false, simulated: false } as const;
  switch (state.status) {
    case "available": {
      const price = priceOf(state.startingQuote);
      return {
        ...base,
        tone: "positive",
        headline: "Còn phòng cho ngày bạn chọn",
        verifiedAvailable: true,
        simulated: state.simulated,
        ...(price ? { price } : {}),
      };
    }
    case "unavailable":
      return {
        ...base,
        tone: "caution",
        headline: "Không còn phòng cho ngày đã chọn",
        detail: "Thử đổi ngày hoặc xem nơi lưu trú khác.",
        simulated: state.simulated,
      };
    case "needs-provider-check":
      return {
        ...base,
        tone: "neutral",
        headline:
          state.reason === "dates-required"
            ? "Chọn ngày để kiểm tra tình trạng phòng"
            : state.reason === "occupancy-correction"
              ? "Điều chỉnh số phòng và số khách để kiểm tra tình trạng phòng"
              : state.reason === "children-policy"
                ? "VNest sẽ xác nhận phòng cho kỳ lưu trú có trẻ em"
                : "Giá và tình trạng phòng hiển thị ở bước đặt phòng",
        ...(state.reason === "children-policy" ? { detail: "Chính sách trẻ em đang chờ VNest xác nhận." } : {}),
      };
    case "unconfigured":
      return {
        ...base,
        tone: "neutral",
        headline: "Chưa kiểm tra được tình trạng phòng trực tuyến",
        detail: "Bản xem trước chưa kết nối hệ thống đặt phòng.",
      };
    case "error":
      return {
        ...base,
        tone: "caution",
        headline: "Chưa kiểm tra được tình trạng phòng lúc này",
        detail: "Đây không phải là hết phòng. Vui lòng thử lại.",
        retryable: state.retryable,
      };
  }
}
