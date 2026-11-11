import { providerForProperty, type LiveBookingProviderId } from "./provider-assignment.ts";

/**
 * HOW A PROPERTY'S BOOKING IS CARRIED OUT (client-safe).
 *
 * - `native`: VNest's own interface can show provider-verified availability and prices and, once the
 *   provider contract exists, start the booking (GoHost).
 * - `external-handoff`: VNest only presents the property. Price, availability and booking happen in the
 *   provider-controlled booking page the guest is handed to (ezCloud). The VNest team has confirmed that
 *   no availability or booking API is available for these properties.
 *
 * Components ask this module; they never test a provider name themselves.
 */
export type BookingMode = "native" | "external-handoff";

export const BOOKING_MODE_BY_PROVIDER: Readonly<Record<LiveBookingProviderId, BookingMode>> = {
  gohost: "native",
  ezcloud: "external-handoff",
};

export function bookingModeForProperty(propertyId: string | null | undefined): BookingMode | undefined {
  const provider = providerForProperty(propertyId);
  return provider ? BOOKING_MODE_BY_PROVIDER[provider] : undefined;
}

/** True when VNest's own room selection can lead into a booking for this property. */
export function usesNativeBooking(propertyId: string | null | undefined): boolean {
  return bookingModeForProperty(propertyId) === "native";
}

/** True when the booking itself happens on a provider-controlled page. */
export function usesExternalHandoff(propertyId: string | null | undefined): boolean {
  return bookingModeForProperty(propertyId) === "external-handoff";
}

/** The action name for properties that book on the provider's page. */
export const HANDOFF_CTA_LABEL = "Kiểm tra giá & đặt phòng";
