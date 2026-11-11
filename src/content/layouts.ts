/**
 * Editorial layout templates a property page can use. Each id names a page composition of
 * its own, built from shared components. A property picks one in `presentation.layout`.
 *
 * Only the baseline exists so far. Layouts are added with the property pages (Phase 05/06),
 * one per distinct editorial treatment, and registered here so content validation knows them.
 */
// "living-frames": the property-detail composition of section 05.2 (Bare Chic first), in review.
export const EDITORIAL_LAYOUTS = ["baseline", "living-frames"] as const;
export type EditorialLayoutId = (typeof EDITORIAL_LAYOUTS)[number];
