import type { Locale, LocalizedText } from "@/domain/locale";
import { OWNER_FAQ } from "@/features/demo/owner-journey";

/**
 * PARTNER PAGE CONTENT (/dev/demo/hop-tac; owner brief of 9/11/2026). Kept apart from the components so that new
 * client-approved content can be added without touching the layout (docs/qa/partner-page-2026-11-09/HANDOFF.md).
 *
 * Every text on the page is one of three kinds, and each block below says which:
 * - CLIENT: the client's 05.11 Final, verbatim (services and FAQs live in owner-journey.ts and are READ here, never
 *   copied; brand copy in brand-copy.ts). Approved for content; publication still needs VNest's go-ahead.
 * - FROM CLIENT: a client sentence used on its own, cut from a longer client answer. The cut is the only change and it
 *   is named where it happens. Needs VNest to confirm the use.
 * - DRAFT: the build team's (or the owner brief's proposed) wording, for owner and VNest review. Labels and headings
 *   only: no business claim is written here.
 * Figures and names (how many brands, stays and cities) are counted from the workbook records at render time, never
 * typed.
 */

export type CopyStatus = "client" | "from-client" | "owner-brief" | "draft";

/** The client FAQs by subject, so the page names what it uses (owner-journey.ts keeps the client's order). */
export const FAQ = {
  services: 0,
  propertyTypes: 1,
  performance: 2,
  notStarted: 3,
  franchising: 4,
  process: 5,
} as const;

const faqAnswer = (key: keyof typeof FAQ) => OWNER_FAQ[FAQ[key]]!.a;

/** Sentence `index` of a client text, in each language. Splits after ". " only (no abbreviations in these answers). */
function clientSentence(text: LocalizedText, index: number, dropLead?: { vi: RegExp; en: RegExp }): LocalizedText {
  const pick = (value: string | undefined, lead?: RegExp) => {
    const sentence = (value ?? "").split(/(?<=\.)\s+/)[index] ?? "";
    if (!lead) return sentence;
    const cut = sentence.replace(lead, "");
    return cut.charAt(0).toUpperCase() + cut.slice(1);
  };
  return { vi: pick(text.vi, dropLead?.vi), en: pick(text.en, dropLead?.en) };
}

/** OWNER BRIEF (9/11/2026), both languages given by the brief: the homepage link after the accordion. */
export const PARTNER_PAGE_LINK: LocalizedText = { vi: "Tìm hiểu thêm về hợp tác", en: "Explore partnership opportunities" };

/** Page title and description. DRAFT (the description is the hero's supporting line). */
export const PARTNER_META = {
  title: { vi: "Hợp tác cùng VNest", en: "Partner with VNest" },
  description: {
    vi: "Giải pháp quản lý, phát triển và vận hành không gian lưu trú dành cho chủ tài sản.",
    en: "Management, development and operation of hospitality spaces, for property owners.",
  },
} as const satisfies Record<string, LocalizedText>;

/**
 * 01 · HERO. Vietnamese headline, supporting line and CTA: proposed in the owner brief (9/11/2026), not client copy.
 * Kicker and the English: DRAFT.
 */
export const PARTNER_HERO = {
  kicker: { vi: "Dành cho chủ tài sản", en: "For property owners" },
  title: { vi: "Hợp tác cùng VNest.", en: "Partner with VNest." },
  supporting: PARTNER_META.description,
  cta: { vi: "Trao đổi về tài sản của bạn", en: "Talk to us about your property" },
} as const satisfies Record<string, LocalizedText>;

/** Section headings. DRAFT, except where noted. */
export const PARTNER_SECTIONS = {
  // 02 · Services: the homepage's approved kicker and heading (owner-journey.ts, OWNER_JOURNEY_UI) are used as they are.
  highlights: { vi: "Trọng tâm", en: "Key highlights" },
  // 03 · Why VNest
  whyKicker: { vi: "Thế mạnh", en: "Strengths" },
  whyTitle: { vi: "Vì sao hợp tác cùng VNest?", en: "Why partner with VNest?" },
  // 04 · How it works
  processKicker: { vi: "Cách hợp tác", en: "How it works" },
  processTitle: { vi: "Hợp tác bắt đầu từ một cuộc trao đổi.", en: "A partnership starts with a conversation." },
  // 05 · Brand ecosystem: its kicker and headline are the homepage brand section's approved ones (brand-copy.ts,
  // BRAND_INDEX_UI: "Hệ sinh thái lưu trú VNest" / "Ba thương hiệu, một sợi chỉ nối."); no wording of its own.
  // 06 · FAQ: the homepage's approved kicker; a page-specific heading.
  faqTitle: { vi: "Câu hỏi của chủ tài sản", en: "Questions from property owners" },
} as const satisfies Record<string, LocalizedText>;

/**
 * 03 · WHY VNEST: verified strengths only. Each point is a DRAFT label over client text (or a figure counted from the
 * records). The section shows exactly the points listed here; the pending subjects below are NOT drawn on the page.
 */
export type Strength = {
  id: string;
  label: LocalizedText;
  /** The client text, or `records` for the brand/stay/city line counted at render time. */
  text: LocalizedText | "records";
  status: CopyStatus;
  source: string;
};

export const PARTNER_STRENGTHS: readonly Strength[] = [
  {
    id: "thi-truong",
    label: { vi: "Giá và kênh bán theo thị trường", en: "Pricing and channels that follow the market" },
    text: clientSentence(faqAnswer("performance"), 0),
    status: "from-client",
    source: "05.11 Final, Part 3, FAQ 3, first sentence (verbatim)",
  },
  {
    id: "bao-cao",
    label: { vi: "Chất lượng vận hành, báo cáo định kỳ", en: "Operating quality, regular reports" },
    // The second sentence opens with a link to the first ("Song song đó," / "At the same time,"); only that is cut.
    text: clientSentence(faqAnswer("performance"), 1, { vi: /^Song song đó,\s*/, en: /^At the same time,\s*/ }),
    status: "from-client",
    source: "05.11 Final, Part 3, FAQ 3, second sentence (its opening link words removed)",
  },
  {
    id: "he-sinh-thai",
    label: { vi: "Hệ sinh thái VNest", en: "The VNest family" },
    text: "records",
    status: "draft",
    source: "Brand, stay and city counts from the workbook records; sentence wording DRAFT",
  },
];

/**
 * The records line of the third strength: "Bare Boutique Stays, The Nắng Suites và Pepper House: 6 nơi ở tại TP. Hồ Chí
 * Minh và Đà Nẵng." Names and figures from the records; wording DRAFT (it names the brands, so it does not repeat the
 * contact block's "Ba thương hiệu lưu trú, sáu nơi ở…").
 */
export function familyLine(locale: Locale, family: { names: readonly string[]; stays: number; cities: readonly string[] }): string {
  const and = locale === "en" ? " and " : " và ";
  const list = (items: readonly string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")}${and}${items.at(-1)}` : (items[0] ?? ""));
  return locale === "en"
    ? `${list(family.names)}: ${family.stays} stays in ${list(family.cities)}.`
    : `${list(family.names)}: ${family.stays} nơi ở tại ${list(family.cities)}.`;
}

/**
 * Strengths VNest said it will supply later (owner brief, 9/11/2026). Listed for the content plan and the handoff;
 * never rendered. Add a point to PARTNER_STRENGTHS only with client-approved text.
 */
export const PENDING_STRENGTHS: readonly { subject: string; needs: string }[] = [
  { subject: "Team and experience", needs: "VNest's own description; no years of experience may be stated until VNest supplies them" },
  { subject: "Operating track record", needs: "Verified examples or case studies VNest confirms may be published" },
  { subject: "Performance figures", needs: "Occupancy, revenue or margin figures only with VNest's source and approval (none shown today)" },
  { subject: "Systems and channels", needs: "The tools and distribution channels VNest works with, if it wants them named" },
  { subject: "Owner relationship", needs: "Reporting cadence and what the owner sees, beyond 'regular reports'" },
];

/**
 * 04 · HOW IT WORKS: FAQ 6 (05.11 Final) split into its three steps, as the owner brief proposed. FROM CLIENT; titles
 * DRAFT. The English texts are FAQ 6's English, sentence by sentence; the Vietnamese ones restate FAQ 6's Vietnamese
 * clause by clause (needs VNest's confirmation).
 */
export const PROCESS_STEPS: readonly { id: string; title: LocalizedText; text: LocalizedText }[] = [
  {
    id: "trao-doi",
    title: { vi: "Trao đổi nhu cầu", en: "Your needs" },
    text: { vi: "Bạn gửi thông tin cơ bản và nhu cầu của mình.", en: "You share basic information about the property and your needs." },
  },
  {
    id: "khao-sat",
    title: { vi: "Khảo sát và đánh giá", en: "Property and market review" },
    text: { vi: "VNest khảo sát tài sản và đánh giá thị trường xung quanh.", en: "VNest reviews the property and the surrounding market." },
  },
  {
    id: "de-xuat",
    title: { vi: "Đề xuất mô hình", en: "A proposal" },
    text: { vi: "VNest đề xuất mô hình và phạm vi công việc phù hợp.", en: "VNest proposes a suitable model and scope of work." },
  },
];

/**
 * Details of the partnership VNest may supply later. Each group appears under the steps as soon as it has one item (an
 * empty group draws nothing). Group titles DRAFT. Never fill these with assumptions: no contract terms, revenue shares,
 * timelines or guarantees until VNest writes them.
 */
export const PROCESS_DETAILS: readonly { id: string; title: LocalizedText; items: readonly LocalizedText[] }[] = [
  { id: "chu-tai-san", title: { vi: "Chủ tài sản", en: "The owner" }, items: [] },
  { id: "vnest", title: { vi: "VNest", en: "VNest" }, items: [] },
  { id: "mo-hinh", title: { vi: "Mô hình hợp tác", en: "Partnership models" }, items: [] },
  { id: "van-hanh", title: { vi: "Trách nhiệm vận hành", en: "Operating responsibilities" }, items: [] },
  { id: "doanh-thu", title: { vi: "Doanh thu và lợi nhuận", en: "Revenue and profit" }, items: [] },
];

/** 06 · FAQ: the client questions this page shows (FAQ 3 and 6 are used above; FAQ 1 restates the services). */
export const PAGE_FAQ = [FAQ.propertyTypes, FAQ.notStarted, FAQ.franchising].map((i) => OWNER_FAQ[i]!);

/**
 * Photographs from the owner's image selection (image-selection.ts) and their English alt text (DRAFT; the Vietnamese
 * alt is the registry's). Every one is an existing VNest stay, never presented as a development project. No caption is
 * drawn over or under them (owner, 9/11/2026); what each shows is in its alt text, its source in the registry.
 */
export const PARTNER_PHOTOS = {
  // A tall frame on desktop: the focal point moves to the window, so the trees and the city stay in view. Anchored to
  // the right edge so Bare's own mark (bottom right of the delivered photograph) is shown whole, never cut by the frame.
  hero: { n: 3, altEn: "Bare Chic Three: a bed with yellow cushions and a desk by a large window onto trees and the city", position: "100% 50%" },
  why: { n: 15, altEn: "Pepper House 3rd Floor: a lit wooden shelf with art and books, a corridor leading to glass doors" },
} as const;
