import { contactErrors, type ConsultationErrorCode, type ConsultationErrors, type ConsultationField } from "@/domain/consultation";
import { resolveLocalized, type Locale, type LocalizedText } from "@/domain/locale";
import { CONTACT_FORM_COPY } from "./contact-copy";

/**
 * Owner journey data and rules (Services B → Contact), kept apart from the component so the footer can
 * link to a service and the validation can be tested. The three headings are the CEO's official ones
 * (24/10/2026). Card line, description and highlights are the client's copy, verbatim, from
 * "Vnest Website Content - 05.11.2026_Final.docx" (replaces the 04.11 draft), Part 2 (Vietnamese section A, English section B); the client marks
 * the document a draft handoff. Brand names are normalised to the owner's canonical spelling (decision 5/11/2026):
 * "Vnest" → "VNest", "The Nang Suites" → "The Nắng Suites"; no other wording changed. The CTA labels are the approved Vietnamese ones; their English is the build
 * team's DRAFT (the document supplies none).
 */
export type ServiceId = "van-hanh" | "tu-van-mo-hinh" | "nhuong-quyen";

export type Service = {
  id: ServiceId;
  no: string;
  title: LocalizedText;
  sub?: LocalizedText;
  /** "Service Card": the short line on the card. */
  line: LocalizedText;
  /** "Expanded Description": the paragraph in the shared detail region. */
  description: LocalizedText;
  /** "Key Highlights": the client's three summary lines. Kept as content; not shown on the homepage since 8/11/2026 (owner: they repeated the description). */
  highlights: readonly [LocalizedText, LocalizedText, LocalizedText];
  cta: LocalizedText;
};

export const SERVICES: readonly Service[] = [
  {
    id: "van-hanh",
    no: "01",
    title: { vi: "Quản lý vận hành", en: "Hospitality Management" },
    line: {
      vi: "Vận hành cơ sở, quản lý doanh thu và báo cáo cho chủ tài sản.",
      en: "Day-to-day operations, revenue management and regular reporting to the owner.",
    },
    description: {
      vi: "Dành cho chủ tài sản có cơ sở phù hợp để kinh doanh lưu trú và cần một đơn vị trực tiếp quản lý vận hành. VNest trực tiếp quản lý đặt phòng, kênh bán, giá, chăm sóc khách, buồng phòng và bảo trì; đồng thời theo dõi doanh thu và hiệu quả khai thác. Chủ tài sản nhận báo cáo định kỳ về doanh thu, chi phí và tình hình vận hành.",
      en: "For owners with properties suited to hospitality use who need a team to manage operations directly. VNest manages reservations, distribution channels, pricing, guest care, housekeeping and maintenance, while tracking revenue and operating performance. Owners receive regular reports on revenue, costs and day-to-day operations.",
    },
    highlights: [
      { vi: "Đặt phòng, phân phối và quản lý giá", en: "Reservations, distribution and pricing management" },
      { vi: "Chăm sóc khách, buồng phòng và bảo trì", en: "Guest care, housekeeping and maintenance" },
      { vi: "Báo cáo định kỳ về doanh thu và hiệu quả", en: "Regular reports on revenue and performance" },
    ],
    cta: { vi: "Tư vấn về quản lý vận hành", en: "Ask about hospitality management" },
  },
  {
    id: "tu-van-mo-hinh",
    no: "02",
    title: { vi: "Phát triển dự án", en: "Project Development" },
    sub: { vi: "Tư vấn mô hình", en: "Business Model Consulting" },
    line: {
      vi: "Tư vấn mô hình kinh doanh lưu trú cho tài sản chưa đưa vào khai thác.",
      en: "Hospitality business model consulting for properties not yet in operation.",
    },
    description: {
      vi: "Dành cho chủ tài sản có mặt bằng hoặc dự án chưa khai thác. VNest cùng chủ tài sản xác định mô hình kinh doanh phù hợp, từ tiềm năng khai thác, định hướng sản phẩm và cơ cấu phòng đến nhóm khách mục tiêu và phương án vận hành. Khi cần thiết kế hoặc xây dựng, VNest có thể giới thiệu đối tác và phối hợp theo phạm vi hai bên thống nhất.",
      en: "For owners with a site or project not yet in operation. VNest works with the owner to define the right hospitality model, from operating potential and product direction to room mix, target guests and the operating plan. Where design or construction is needed, VNest can introduce partners and coordinate within the scope agreed by both sides.",
    },
    highlights: [
      { vi: "Đánh giá tiềm năng khai thác tài sản", en: "Assessing a property's hospitality potential" },
      { vi: "Định hướng sản phẩm, cơ cấu phòng, khách mục tiêu", en: "Defining product, room mix and target guests" },
      { vi: "Giới thiệu đối tác thiết kế, xây dựng khi cần", en: "Introducing design and construction partners when needed" },
    ],
    cta: { vi: "Tư vấn về mô hình lưu trú", en: "Ask about business model consulting" },
  },
  {
    id: "nhuong-quyen",
    no: "03",
    title: { vi: "Nhượng quyền thương hiệu", en: "Brand Franchising" },
    line: {
      vi: "Mở cơ sở Bare hoặc Pepper House, với VNest trực tiếp quản lý vận hành.",
      en: "Open a Bare or Pepper House property, with VNest managing operations directly.",
    },
    description: {
      vi: "Dành cho chủ tài sản muốn mở cơ sở theo Bare Boutique Stays hoặc Pepper House. Hai thương hiệu có hai mô hình khai thác khác nhau. Hình thức hợp tác là Brand Franchising + VNest Management: VNest cung cấp quyền sử dụng thương hiệu, nhận diện và tiêu chuẩn, đồng thời trực tiếp quản lý vận hành. VNest không cấp quyền thương hiệu độc lập để chủ nhà tự vận hành hoặc thuê đơn vị khác. Phạm vi cụ thể tùy vào tài sản và thỏa thuận.",
      en: "For owners who want to open a property under Bare Boutique Stays or Pepper House. The two brands follow different operating models. The partnership combines Brand Franchising + VNest Management: VNest grants the right to use the brand, provides the identity and standards, and directly manages operations. The brand is not licensed separately for owners to self-operate or appoint another operator. Scope depends on the property and the agreement.",
    },
    highlights: [
      { vi: "Hai thương hiệu, hai mô hình khai thác khác nhau", en: "Two brands, two different operating models" },
      { vi: "Thương hiệu luôn đi cùng VNest quản lý vận hành", en: "The brand always comes with VNest management" },
      { vi: "Nhận diện, tiêu chuẩn và hướng dẫn thiết lập", en: "Identity, standards and set-up guidance" },
    ],
    cta: { vi: "Tìm hiểu về nhượng quyền", en: "Learn about brand franchising" },
  },
];

/** "Title (Sub)" in one language, e.g. "Phát triển dự án (Tư vấn mô hình)". */
export const serviceTitle = (s: Pick<Service, "title" | "sub">, locale: Locale = "vi") => {
  const title = resolveLocalized(s.title, locale);
  return s.sub ? `${title} (${resolveLocalized(s.sub, locale)})` : title;
};

/**
 * The six FAQs for property owners and B2B partners (not booking questions), in the client's order: client document,
 * Part 3, Vietnamese section A and English section B, verbatim apart from the brand-name normalisation above.
 */
export const OWNER_FAQ: readonly { q: LocalizedText; a: LocalizedText }[] = [
  {
    q: { vi: "VNest cung cấp những dịch vụ gì cho chủ tài sản lưu trú?", en: "What services does VNest offer property owners?" },
    a: {
      vi: "VNest có ba nhóm dịch vụ. Với cơ sở đang hoạt động, VNest nhận quản lý vận hành và báo cáo định kỳ cho chủ tài sản. Với tài sản chưa khai thác, VNest tư vấn mô hình kinh doanh và phương án vận hành. Nếu chủ tài sản muốn phát triển theo Bare Boutique Stays hoặc Pepper House, VNest có mô hình nhượng quyền đi cùng quản lý vận hành trực tiếp.",
      en: "VNest offers three service groups: management for operating properties, business model consulting for projects not yet in operation, and franchising under Bare Boutique Stays or Pepper House with direct VNest management.",
    },
  },
  {
    q: { vi: "VNest nhận quản lý những loại hình bất động sản nào?", en: "What types of property does VNest manage?" },
    a: {
      vi: "VNest nhận quản lý căn hộ dịch vụ, boutique stays, khách sạn quy mô nhỏ, homestay và những bất động sản phù hợp để phát triển kinh doanh lưu trú. Dù tài sản đang vận hành hay mới chuẩn bị khai thác, VNest đều có thể cùng chủ tài sản xem xét mô hình hợp tác phù hợp.",
      en: "VNest manages serviced apartments, boutique stays, small hotels, homestays and other properties suited to hospitality use. Whether the property is already operating or still being prepared, VNest can work with the owner to explore a suitable partnership model.",
    },
  },
  {
    q: {
      vi: "Hợp tác với VNest giúp chủ tài sản gia tăng hiệu quả kinh doanh như thế nào?",
      en: "How does working with VNest improve a property's business performance?",
    },
    a: {
      vi: "VNest theo dõi thị trường và mùa vụ để điều chỉnh giá, lựa chọn kênh phân phối phù hợp với từng cơ sở và cân bằng giữa công suất với giá bán. Song song đó, VNest kiểm soát chất lượng vận hành và gửi báo cáo định kỳ để chủ tài sản theo dõi doanh thu, chi phí và hiệu quả khai thác.",
      en: "VNest monitors market conditions and seasonality to adjust pricing, chooses distribution channels that suit each property, and balances occupancy with room rate. At the same time, VNest monitors operating quality and sends regular reports so owners can track revenue, costs and operating performance.",
    },
  },
  {
    q: { vi: "VNest có thể hỗ trợ gì khi tôi chưa bắt đầu kinh doanh lưu trú?", en: "How can VNest help if I haven't started a hospitality business yet?" },
    a: {
      vi: "VNest bắt đầu bằng việc đánh giá tài sản, nhu cầu thị trường và mục tiêu của chủ tài sản. Từ đó, VNest đề xuất mô hình kinh doanh, định hướng sản phẩm, cơ cấu phòng, nhóm khách mục tiêu và phương án vận hành. Khi cần thiết kế hoặc thi công, VNest có thể giới thiệu đối tác và phối hợp theo thỏa thuận; tiến độ và chất lượng thuộc trách nhiệm của đơn vị thực hiện.",
      en: "VNest starts by reviewing the property, local demand and the owner's goals. From there, VNest recommends the business model, product direction, room mix, target guests and operating plan. If design or construction is needed, VNest can introduce partners and coordinate with them as agreed; schedule and quality remain the responsibility of the firm carrying out the work.",
    },
  },
  {
    q: { vi: "Nhượng quyền Bare Boutique Stays và Pepper House hoạt động như thế nào?", en: "How does franchising Bare Boutique Stays and Pepper House work?" },
    a: {
      vi: "Bare Boutique Stays và Pepper House là hai thương hiệu với hai mô hình khai thác khác nhau. Bare hướng đến trải nghiệm lưu trú trẻ trung, linh hoạt, với diện tích phòng phổ biến từ 15–35 m². Pepper House theo mô hình mixed-use, phù hợp với khách công tác và nhu cầu lưu trú dài ngày, với không gian từ 35 m² trở lên và tiện nghi gần với căn hộ dịch vụ. Với cả hai thương hiệu, VNest trực tiếp quản lý vận hành; chủ tài sản không tự vận hành hoặc thuê một đơn vị khác.",
      en: "Bare Boutique Stays and Pepper House are two brands built around different operating models. Bare focuses on experience-led stays for younger travellers, with flexible room sizes from 15 m² to 35 m². Pepper House is a mixed-use model for business travellers, with serviced-apartment-style comfort for longer stays and units from 35 m². VNest directly manages operations for both brands. Owners do not receive a standalone brand licence to self-operate or appoint another operator.",
    },
  },
  {
    q: { vi: "Quy trình hợp tác với VNest diễn ra như thế nào?", en: "What does the process of working with VNest look like?" },
    a: {
      vi: "Quy trình bắt đầu khi bạn gửi thông tin cơ bản và nhu cầu của mình. VNest sẽ khảo sát tài sản, đánh giá thị trường xung quanh rồi đề xuất mô hình và phạm vi công việc phù hợp.",
      en: "You share basic information about the property and your needs. VNest reviews the property and the surrounding market, then proposes a suitable model and scope of work.",
    },
  },
];

/**
 * Labels of the Services and FAQ sections. Vietnamese is the approved UI; the English is the build team's DRAFT pending
 * VNest's approval. The Contact form between them is outside this content pass and stays Vietnamese.
 */
export const OWNER_JOURNEY_UI = {
  servicesKicker: { vi: "Hợp tác cùng VNest · Dành cho chủ tài sản", en: "Partner with VNest · For property owners" },
  servicesTitle: { vi: "Ba cách VNest đồng hành cùng chủ tài sản.", en: "Three ways VNest works with property owners." },
  faqKicker: { vi: "Hỏi đáp", en: "FAQ" },
  faqTitle: { vi: "Câu hỏi thường gặp", en: "Frequently asked questions" },
} as const satisfies Record<string, LocalizedText>;

export const isServiceId = (value: string | null | undefined): value is ServiceId => SERVICES.some((s) => s.id === value);

export type ContactErrors = Partial<Record<ConsultationField, string>>;

/** The form's sentence for each rule broken (the rules themselves are in src/domain/consultation.ts). */
const ERROR_COPY = {
  service: { required: "serviceRequired", invalid: "serviceRequired", "too-long": "serviceRequired" },
  name: { required: "nameRequired", invalid: "nameRequired", "too-long": "nameTooLong" },
  reach: { required: "reachRequired", invalid: "reachInvalid", "too-long": "reachTooLong" },
  asset: { required: "assetTooLong", invalid: "assetTooLong", "too-long": "assetTooLong" },
  message: { required: "messageTooLong", invalid: "messageTooLong", "too-long": "messageTooLong" },
} as const satisfies Record<ConsultationField, Record<ConsultationErrorCode, keyof typeof CONTACT_FORM_COPY>>;

/** Rule codes (from the browser check or the server's answer) as the form's own sentences in `locale`. */
export function consultationErrorText(errors: ConsultationErrors, locale: Locale = "vi"): ContactErrors {
  const text: ContactErrors = {};
  for (const [field, code] of Object.entries(errors) as [ConsultationField, ConsultationErrorCode][]) {
    text[field] = resolveLocalized(CONTACT_FORM_COPY[ERROR_COPY[field][code]], locale);
  }
  return text;
}

/**
 * The browser's check of the two required fields: a name, and a phone number or an email address. Same rules as the
 * server's (src/domain/consultation.ts), which checks everything again. Messages follow `locale`.
 */
export function validateContact(input: { name: string; reach: string }, locale: Locale = "vi"): ContactErrors {
  return consultationErrorText(contactErrors(input), locale);
}
