import type { LocalizedText } from "@/domain/locale";
import type { ServiceId } from "@/features/demo/owner-journey";

/**
 * THE THREE SERVICE VISUALS (Hợp tác cùng VNest; Concept B approved by the client, 9/11/2026). Used by the homepage
 * accordion (ServiceAccordion.tsx) and the dedicated partner page (/dev/demo/hop-tac).
 *
 * Service copy is NOT here: it is the client's 05.11 Final, in owner-journey.ts, read by both places. These are the
 * visuals and the few words drawn inside them; new words are the build team's DRAFT and marked as such.
 */

/** A service's visual: an approved photograph (01), a planning composition (02), the brand composition (03). */
export type ServiceVisualKind = "photo" | "plan" | "brands";

export const SERVICE_VISUAL: Readonly<Record<ServiceId, ServiceVisualKind>> = {
  "van-hanh": "photo",
  "tu-van-mo-hinh": "plan",
  "nhuong-quyen": "brands",
};

/** A photograph from the owner's image selection, resolved on the server (selection-picture.ts). */
export type SelectionPicture = {
  src: string;
  srcSet: string;
  sources: { type: string; srcSet: string }[];
  width: number;
  height: number;
  alt: LocalizedText;
  position: string;
  /** The stay it shows, for a visible credit: the registry's room name and property id. */
  room: string;
  propertyId: string;
};

/** The Hospitality Management photograph. */
export type ServicePhoto = SelectionPicture;

/** The owner's image selection, n° 16 (Pepper House, 3rd floor, living area): no watermark, no people. */
export const SERVICE_PHOTO_NUMBER = 16;

/** English alt for photo 16; the registry's alt (image-selection.ts) is the Vietnamese one. DRAFT. */
export const SERVICE_PHOTO_ALT_EN = "Pepper House 3rd Floor: a blue sofa, a round wooden table and a desk in front of glass doors onto greenery";

export const SERVICE_VISUAL_COPY = {
  /**
   * The two halves of the client's own phrase "Brand Franchising + VNest Management" (03's expanded description, both
   * languages), used as the labels of the brand composition. Not new copy.
   */
  franchiseLabel: { vi: "Brand Franchising", en: "Brand Franchising" },
  managementLabel: { vi: "VNest Management", en: "VNest Management" },
} as const satisfies Record<string, LocalizedText>;

/** The two brands that are franchised (never The Nắng Suites): official logo files, unaltered. */
export const FRANCHISE_BRANDS = [
  { id: "bare", name: "Bare Boutique Stays", logo: { src: "/dev-fixtures/brand-collection/official-logos/bare-boutique-stays-transparent.webp", width: 767, height: 1047 } },
  { id: "pepper-house", name: "Pepper House", logo: { src: "/dev-fixtures/brand-collection/official-logos/pepper-house-transparent.webp", width: 1406, height: 1406 } },
] as const;

export const VNEST_LOGO = {
  symbol: { src: "/dev-fixtures/brand-collection/vnest-symbol-approved.svg", width: 456, height: 449 },
  wordmark: { src: "/dev-fixtures/brand-collection/vnest-wordmark-approved.svg", width: 704, height: 168 },
} as const;
