import type { LocalizedText } from "@/domain/locale";

/**
 * "HỢP TÁC CÙNG VNEST" REDESIGN EXPLORATION (owner brief, 8/11/2026), kept for reference after the decision:
 * - Concept A, Editorial Service Showcase (`/dev/partner-concepts/a`, PartnerShowcase.tsx): not chosen.
 * - Concept B, Visual Accordion (`/dev/partner-concepts/b`): approved by the client on 9/11/2026 and now on the homepage;
 *   its component, visuals and data moved to features/partner/.
 * Only the review chrome's labels remain here.
 */
export const PARTNER_CONCEPT_COPY = {
  previewTitle: { vi: "Hợp tác cùng VNest · bản xem trước", en: "Partner with VNest · preview" },
  conceptA: { vi: "Phương án A · Editorial", en: "Concept A · Editorial" },
  conceptB: { vi: "Phương án B · Accordion (đã duyệt)", en: "Concept B · Accordion (approved)" },
  current: { vi: "Trang chủ", en: "Homepage" },
} as const satisfies Record<string, LocalizedText>;
