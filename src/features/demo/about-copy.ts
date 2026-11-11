import type { LocalizedText } from "@/domain/locale";

/**
 * ABOUT VNEST V2 COPY, in both languages (owner brief, 4/11/2026). DRAFT pending VNest's content approval.
 *
 * Written as LocalizedText like every other translatable field and resolved to one language with `resolveLocalized`, so
 * the English page never shows Vietnamese copy. The display word is a language-specific composition ("Ở." / "Stay."),
 * sized per language in AboutVNest.module.css. The English description is the build team's DRAFT translation of the
 * Vietnamese (the brief supplied the display word, the supporting line and the CTA only); VNest must approve it.
 */
export const ABOUT_COPY = {
  eyebrow: { vi: "VNEST / OUR STORY", en: "VNEST / OUR STORY" },
  title: { vi: "ABOUT VNEST.", en: "ABOUT VNEST." },
  display: { vi: "Ở.", en: "Stay." },
  supporting: { vi: "Theo cách riêng.", en: "Your way." },
  description: {
    vi: "Từ Bare Boutique Stays đến The Nắng Suites và Pepper House, VNest kết nối những không gian lưu trú mang cá tính riêng, với sự chỉn chu trong trải nghiệm và sự gần gũi trong cách đón tiếp.",
    en: "From Bare Boutique Stays to The Nắng Suites and Pepper House, VNest brings together places to stay with a character of their own, carefully considered in every experience and warm in the way they welcome you.",
  },
  // Client review 6/11/2026: the CTA leads to the VNest contact section (was "Khám phá các không gian" → the stays).
  cta: { vi: "Liên hệ VNest", en: "Contact VNest" },
} as const satisfies Record<string, LocalizedText>;

/** The English words inside the Vietnamese page (eyebrow and title), so they are announced and hyphenated as English. */
export const ABOUT_ENGLISH_IN_VIETNAMESE = ["eyebrow", "title"] as const;
