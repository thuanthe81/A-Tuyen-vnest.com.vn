// Official copy slots prepared for the VNest Content team.
// Kept strictly separate from draft workbook cells (E4/E8/E12/E16/E18/E22) so draft copy
// and approved client copy never mix silently, and no placeholder text is exposed in public views.

export type ApprovedRoomCopy = {
  /** Short 1-line editorial summary shown on the room card and drawer header. */
  summary?: string;
  /** Full room description paragraphs shown inside the room detail drawer. */
  description?: readonly string[];
  /** Verified room-specific highlights or layout notes (never unverified amenities). */
  highlights?: readonly string[];
};

export type ApprovedFeatureItem = {
  id: string;
  title: string;
  description?: string;
};

export type ApprovedPolicyItem = {
  /** Matches a PolicySlotId ("check-in-out" | "cancellation" | "children-extra" | "pets-smoking" | "payment-deposit") or custom policy key. */
  id: string;
  label: string;
  value: string;
};

export type ApprovedFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type ApprovedLocalRecommendation = {
  id: string;
  name: string;
  category: string;
  address?: string;
  note?: string;
};

export type ApprovedPropertyCopy = {
  /** Property tagline shown beneath the property H1 title. */
  tagline?: string;
  /** Property introduction paragraphs shown in the #gioi-thieu story section. */
  introduction?: readonly string[];
  /** Per-room editorial descriptions keyed by room slug (e.g. "bare-da-kao-one"). */
  roomDescriptions?: Readonly<Record<string, ApprovedRoomCopy>>;
  /** Property-level distinctive architectural or stay features. */
  distinctiveFeatures?: readonly ApprovedFeatureItem[];
  /** Confirmed property booking & house policies replacing pending placeholders when supplied. */
  policies?: readonly ApprovedPolicyItem[];
  /** Optional property-specific FAQs once approved by VNest. */
  faqs?: readonly ApprovedFaqItem[];
  /** Optional property-specific neighbourhood recommendations once approved by VNest. */
  localRecommendations?: readonly ApprovedLocalRecommendation[];
};

// Populated per property slug ("bare-chic", "bare-da-kao", "the-nang-suites", etc.)
// as official VNest Content team copy is signed off.
export const APPROVED_PROPERTY_COPY: Readonly<Record<string, ApprovedPropertyCopy>> = {};

export const approvedPropertyCopy = (
  propertySlug: string,
  overrides?: Readonly<Record<string, ApprovedPropertyCopy>>,
): ApprovedPropertyCopy | undefined => overrides?.[propertySlug] ?? APPROVED_PROPERTY_COPY[propertySlug];
