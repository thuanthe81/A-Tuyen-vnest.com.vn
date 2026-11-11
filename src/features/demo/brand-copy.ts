import type { LocalizedText } from "@/domain/locale";
import type { BrandId, CityId } from "@/app/dev/brand-collection/data";

/**
 * BRAND COLLECTION COPY: client document "Vnest Website Content - 05.11.2026_Final.docx" (replaces the 04.11 draft), Part 1 (Vietnamese section A, English
 * section B), copied verbatim apart from the brand-name normalisation below. The client marks it a draft handoff ("Nội dung nháp bàn giao").
 *
 * - `hover`: the desktop preview card shown on hover or keyboard focus (BrandShowcase.tsx).
 * - `positioning`: the lead line of the selected brand's detail panel.
 * - `about`: the paragraph of the same panel. Phones and tablets have no hover, so the panel is where every reader gets the
 *   brand description, after one tap on the brand.
 *
 * Brand names follow the owner's canonical spelling (decision 5/11/2026): the document's "Vnest" is written "VNest" and
 * "The Nang Suites" is written "The Nắng Suites". Everything else is the client's wording. The official spelling of
 * "The Nắng Suites" still needs client confirmation before publication (docs/qa/homepage-content-2026-11-05/REVIEW.md).
 */
/**
 * The only two exceptions to verbatim source matching: brand-name corrections approved by the owner (5/11/2026). Content
 * tests apply exactly these to the client document before comparing.
 */
export const BRAND_NAME_NORMALISATION: readonly (readonly [RegExp, string])[] = [
  [/\bVnest\b/g, "VNest"],
  [/\bThe Nang Suites\b/g, "The Nắng Suites"],
];

export const normaliseBrandNames = (text: string) => BRAND_NAME_NORMALISATION.reduce((out, [from, to]) => out.replace(from, to), text);

export type BrandCopy = { hover: LocalizedText; positioning: LocalizedText; about: LocalizedText };

export const BRAND_COPY: Readonly<Record<BrandId, BrandCopy>> = {
  bare: {
    hover: {
      vi: "Một nơi ở thân thuộc, nhưng luôn có điều mới để khám phá.",
      en: "A place that feels familiar, with something new to discover.",
    },
    positioning: {
      vi: "Không gian lưu trú cho những người thích khám phá: đủ thân thuộc để thấy thoải mái, đủ khác biệt để cảm nhận điều mới mẻ.",
      en: "For travellers who like to explore: familiar enough to feel comfortable, different enough that every stay brings something new.",
    },
    about: {
      vi: "Bare Boutique Stays dành cho những người thích khám phá và muốn một trải nghiệm lưu trú khác với những lựa chọn quen thuộc. Mỗi cơ sở có cá tính riêng, thể hiện qua thiết kế, cách bố trí và cảm giác khi ở. Bare để khách thoải mái theo cách của mình, nhưng vẫn giữ được cảm giác gần gũi như ở nhà.",
      en: "Bare Boutique Stays is for people who like to explore and want a stay that feels different from the usual. Each property has its own character, shaped by its design, layout and the way it feels to stay there. Guests can stay in their own way and still feel at home.",
    },
  },
  "the-nang": {
    hover: {
      vi: "Một chỗ ở nhẹ nhàng theo tinh thần co-living, phù hợp với những chuyến đi vài ngày hoặc vài tuần.",
      en: "Easygoing co-living for stays of a few days or a few weeks.",
    },
    positioning: {
      vi: "Không gian co-living thoải mái, gần gũi cho kỳ nghỉ ngắn hoặc lưu trú trung hạn.",
      en: "Comfortable co-living for short trips and medium-term stays.",
    },
    about: {
      vi: "The Nắng Suites là mô hình co-living tại các điểm đến du lịch, dành cho khách ở từ vài ngày đến vài tuần. Không gian đơn giản, gần gũi và linh hoạt; cách vận hành gọn như một khách sạn nhỏ. Phù hợp với khách du lịch, người đi công tác ngắn ngày hoặc cần ở lại vài tuần.",
      en: "The Nắng Suites is a co-living concept in travel destinations, designed for stays of a few days to a few weeks. Spaces are simple, friendly and flexible, with the straightforward operation of a small hotel. It suits leisure travellers, short business trips and medium-term stays.",
    },
  },
  "pepper-house": {
    hover: {
      vi: "Những ngôi nhà đô thị có phong cách riêng, đầy đủ tiện nghi cho nhịp sống thành phố.",
      en: "Urban homes with character and the comforts needed for city life.",
    },
    positioning: {
      vi: "Ngôi nhà đô thị có cá tính riêng, kết hợp chỗ ở, làm việc và lưu trú trong cùng một không gian.",
      en: "Urban homes with a distinct identity, bringing living, working and staying together.",
    },
    about: {
      vi: "Pepper House gồm những ngôi nhà đô thị theo mô hình mixed-use hospitality. Mỗi ngôi nhà có cách tổ chức và phong cách riêng, tùy vào đặc điểm của ngôi nhà. Không gian được thiết kế để có thể vừa sống, vừa làm việc, vừa lưu trú. Phù hợp với người đi công tác, doanh nhân và những người cần ở lại thành phố từ vài ngày đến vài tuần hoặc lâu hơn.",
      en: "Pepper House is a collection of urban homes built around a mixed-use hospitality model. Each house is organised to suit the property, combining space for living, working and staying. It is made for business travellers, entrepreneurs and guests staying in the city for a few days, a few weeks or longer.",
    },
  },
};

/**
 * The section's own labels. Vietnamese is the approved UI; the English is the build team's DRAFT (the client document
 * supplies brand copy only), pending VNest's approval.
 */
export const BRAND_INDEX_UI = {
  kicker: { vi: "Hệ sinh thái lưu trú VNest", en: "The VNest hospitality family" },
  titleStart: { vi: "Ba thương hiệu,", en: "Three brands," },
  titleEnd: { vi: "một sợi chỉ nối.", en: "one connecting thread." },
  tablist: { vi: "Thương hiệu", en: "Brands" },
  choose: { vi: "Chọn một thương hiệu để xem giới thiệu.", en: "Choose a brand to read its introduction." },
  city: { vi: "Thành phố", en: "City" },
  stays: { vi: "Nơi ở", en: "Stays" },
  // The owner's CTA wording (7/11/2026), the same in both languages.
  visit: { vi: "Visit us", en: "Visit us" },
  visitOf: { vi: "Website của {brand} (mở trong tab mới)", en: "{brand} website (opens in a new tab)" },
  websitePending: { vi: "Website của {brand}: đang chờ đường dẫn chính thức", en: "{brand} website: awaiting the official address" },
  photoAlt: { vi: "Không gian tiêu biểu của {brand}", en: "A signature space at {brand}" },
  previewHint: { vi: "Nhấn để xem giới thiệu đầy đủ", en: "Click to read the full introduction" },
} as const satisfies Record<string, LocalizedText>;

/** City names in the brand index, per language (the property grid below is not translated). */
export const CITY_NAME: Readonly<Record<CityId, LocalizedText>> = {
  "ho-chi-minh": { vi: "TP. Hồ Chí Minh", en: "Ho Chi Minh City" },
  "da-nang": { vi: "Đà Nẵng", en: "Da Nang" },
};
