/**
 * PROPERTY DETAIL VIEW (section 05.2): what the page says beyond the property record, taken from
 * the traced workbook values (workbook v2, 20/10/2026). Generic over properties: Bare Chic is the
 * first to use it.
 *
 * Every line here is the client's (workbook) or derived from it by a written rule; what is
 * pending is said as pending. Nothing is composed to fill a gap: no former district (v2 has no
 * area field), no room facts (v2 has no room sheet), no nearby places (no per-property mapping),
 * no policies (unconfirmed), no price a room's own cell does not state.
 */
import { roomRate, type PriceAudience } from "@/content/vnest-workbook/pricing";
import type { RoomDetails } from "@/content/vnest-workbook/property-details";
import type { ClientProperty } from "@/content/vnest-workbook/records";
import { slug } from "@/content/vnest-workbook/records";
import type { Sourced } from "@/content/vnest-workbook/sourced";

/**
 * A room's price on the page.
 * - `reference`: the room's own workbook cell states weekday and weekend figures, and the page is
 *   the private preview. Shown exactly as written, with the workbook's own labels: no currency,
 *   no "per night", no tax note, because the workbook establishes none of them (Q8).
 * - `pending`: anything else, including every room in public mode: "Giá đang cập nhật", no number.
 */
export type RoomPriceView = { kind: "reference"; weekday: string; weekend: string; cell: string } | { kind: "pending" };

export type RoomView = { id: string; anchor: string; name: string; price: RoomPriceView };

export type PropertyDetailView = {
  /** The partner brand, as the official name's suffix gives it ("Bare Boutique Stays"). */
  brand: string;
  location: {
    /** The address as supplied, split at its first comma for reading. */
    street: string | null;
    rest: string | null;
    /** Only a link that is free of conflict and resolves to this property. */
    mapUrl: string | null;
    /** What is still pending about the location, when anything is. */
    note: string | null;
  };
  story: readonly string[];
  amenities: { items: readonly string[]; incomplete: boolean };
  transport: string | null;
  rooms: readonly RoomView[];
  /** Whether any booking provider knows this property. False: the page says booking is not connected. */
  bookingConnected: boolean;
  audience: PriceAudience;
};

type Trace = {
  property: ClientProperty;
  story: Sourced<readonly string[]>;
  amenities: Sourced<readonly string[]> & { incomplete: boolean };
  transport: Sourced<string>;
  rooms: readonly RoomDetails[];
};

export function buildDetailView(trace: Trace, options: { audience: PriceAudience; bookingConnected: boolean }): PropertyDetailView {
  const { property } = trace;
  const loc = property.location;
  const brandName = property.brand.raw?.split(" - ")[1]?.trim() ?? property.name.display ?? "";
  return {
    brand: brandName,
    location: { street: loc.street.display, rest: loc.ward.display, mapUrl: loc.mapUrl.display, note: loc.note },
    story: trace.story.display ?? [],
    amenities: { items: trace.amenities.display ?? [], incomplete: trace.amenities.incomplete },
    transport: trace.transport.display,
    rooms: trace.rooms.flatMap((room) => {
      const name = room.name.display;
      if (!name) return [];
      const rate = roomRate(room.row);
      const price: RoomPriceView = rate.kind === "stated" && options.audience === "private-preview" ? { kind: "reference", weekday: rate.weekday, weekend: rate.weekend, cell: rate.source[0]!.cell } : { kind: "pending" };
      return [{ id: slug(name), anchor: `phong-${slug(name)}`, name, price }];
    }),
    bookingConnected: options.bookingConnected,
    audience: options.audience,
  };
}
