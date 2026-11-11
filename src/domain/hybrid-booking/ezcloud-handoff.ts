import type { StayRequest } from "./property-availability.ts";

/**
 * EZCLOUD BOOKING HANDOFF (client-safe).
 *
 * The VNest team has confirmed that ezCloud supplies a booking integration framework and that, once a
 * booking starts, the guest is served the ezCloud-controlled booking page. The snippet, destinations,
 * parameter contract and navigation behaviour have NOT been supplied, so none is assumed here:
 * not an iframe, not a widget, not query parameter names, not deep links, not room-specific handoff,
 * not a payment callback, not a return URL.
 *
 * Every property is `unconfigured` until VNest supplies its official destination. A configured entry
 * carries only what VNest confirmed: the destination and the parameter NAMES the provider accepts.
 * A stay detail is transferred only when its parameter name is listed; otherwise the guest is told it
 * was not transferred.
 */
export type EzcloudHandoffParams = {
  checkIn?: string;
  checkOut?: string;
  adults?: string;
  rooms?: string;
  /** The provider's name for the number of children, if it accepts one (not supplied). */
  children?: string;
};

export type EzcloudHandoffConfig =
  | { status: "unconfigured" }
  | {
      status: "configured";
      /** Official booking destination for this property, https only. */
      destinationUrl: string;
      /** Parameter names the provider confirmed. Missing = that detail is not transferred. */
      params?: EzcloudHandoffParams;
    };

/** Official ezCloud destinations by property id. Empty until VNest supplies them. */
export const EZCLOUD_HANDOFF_BY_PROPERTY: Readonly<Record<string, EzcloudHandoffConfig>> = Object.freeze({
  "bare-chic": { status: "unconfigured" },
  "bare-hyphen": { status: "unconfigured" },
  "bare-han": { status: "unconfigured" },
  "the-nang-suites": { status: "unconfigured" },
});

export type HandoffAction =
  /** No official destination yet: the guest sees an honest state, never a link that looks functional. */
  | { kind: "unconfigured" }
  | {
      kind: "external";
      href: string;
      transfers: { dates: boolean; guests: boolean; rooms: boolean; children: boolean };
    };

export function handoffConfigFor(propertyId: string, registry: Readonly<Record<string, EzcloudHandoffConfig>> = EZCLOUD_HANDOFF_BY_PROPERTY): EzcloudHandoffConfig {
  return registry[propertyId] ?? { status: "unconfigured" };
}

function isHttps(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * The action for the "Kiểm tra giá & đặt phòng" control. Parameters are appended only under the names
 * the provider confirmed; the rest of the stay stays on VNest and `transfers` says so.
 */
export function resolveHandoffAction(
  propertyId: string,
  stay: StayRequest,
  registry: Readonly<Record<string, EzcloudHandoffConfig>> = EZCLOUD_HANDOFF_BY_PROPERTY,
): HandoffAction {
  const config = handoffConfigFor(propertyId, registry);
  if (config.status !== "configured" || !isHttps(config.destinationUrl)) return { kind: "unconfigured" };

  const url = new URL(config.destinationUrl);
  const names = config.params ?? {};
  const transfers = { dates: false, guests: false, rooms: false, children: false };
  if (names.checkIn && names.checkOut && stay.checkIn && stay.checkOut) {
    url.searchParams.set(names.checkIn, stay.checkIn);
    url.searchParams.set(names.checkOut, stay.checkOut);
    transfers.dates = true;
  }
  if (names.adults && stay.roomAdults.length > 0) {
    url.searchParams.set(names.adults, String(stay.roomAdults.reduce((sum, n) => sum + n, 0)));
    transfers.guests = true;
  }
  if (names.rooms && stay.roomAdults.length > 0) {
    url.searchParams.set(names.rooms, String(stay.roomAdults.length));
    transfers.rooms = true;
  }
  if (names.children && stay.children) {
    url.searchParams.set(names.children, String(stay.children));
    transfers.children = true;
  }
  return { kind: "external", href: url.toString(), transfers };
}
