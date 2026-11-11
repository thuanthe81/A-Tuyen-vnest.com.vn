import type { BookingProvider } from "@/domain/ports";

/**
 * The honest answer when no booking provider is connected: nothing is claimed about
 * availability and booking is reported as not integrated. Lets real content be published
 * before a PMS integration exists, without ever simulating availability in public.
 */
export const unconnectedBookingProvider: BookingProvider = {
  id: "none",
  capabilities: { availability: false, rates: false, stayRules: false, children: false, handoff: [] },
  async getStayRules() {
    return {};
  },
  async searchAvailability() {
    return { status: "error", reason: "not-configured", retryable: false };
  },
  async beginBooking() {
    return { kind: "not-integrated" };
  },
};
