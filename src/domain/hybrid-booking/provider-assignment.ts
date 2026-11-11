/**
 * PROPERTY → BOOKING PROVIDER ASSIGNMENT (client-safe, no data imports).
 *
 * The one place that says which system each VNest property books through. Kept free of workbook and
 * server imports so room cards, search bars and result lists can import it without enlarging a client
 * bundle. Provider-specific behaviour is derived from here (`booking-mode.ts`), never re-decided in a
 * component.
 *
 * Bare Tân Định is an alias of Bare Đa Kao, not a seventh property.
 */
export const LIVE_BOOKING_PROVIDER_IDS = ["gohost", "ezcloud"] as const;
export type LiveBookingProviderId = (typeof LIVE_BOOKING_PROVIDER_IDS)[number];

export const LIVE_BOOKING_PROVIDER_LABELS: Readonly<Record<LiveBookingProviderId, string>> = {
  gohost: "GoHost",
  ezcloud: "ezCloud",
};

/** Authoritative assignment of each VNest property (stable internal id) to its PMS / booking provider. */
export const PROPERTY_PROVIDER_ASSIGNMENT: Readonly<Record<string, LiveBookingProviderId>> = Object.freeze({
  "bare-da-kao": "gohost",
  "pepper-house": "gohost",
  "bare-chic": "ezcloud",
  "bare-hyphen": "ezcloud",
  "bare-han": "ezcloud",
  "the-nang-suites": "ezcloud",
});

/** The provider for `propertyId`, or `undefined` for an id VNest does not operate. */
export function providerForProperty(propertyId: string | null | undefined): LiveBookingProviderId | undefined {
  return propertyId ? PROPERTY_PROVIDER_ASSIGNMENT[propertyId] : undefined;
}
