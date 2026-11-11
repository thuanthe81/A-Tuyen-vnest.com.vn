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
import {
  approvedPropertyCopy,
  type ApprovedFaqItem,
  type ApprovedFeatureItem,
  type ApprovedLocalRecommendation,
  type ApprovedPolicyItem,
  type ApprovedPropertyCopy,
} from "@/content/vnest-workbook/approved-copy";
import { roomRate, type PriceAudience } from "@/content/vnest-workbook/pricing";
import { formatStartingRate, publicStartingRate } from "@/content/vnest-workbook/public-rates";
import { confirmedRoomFact, type RoomDetails } from "@/content/vnest-workbook/property-details";
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
/**
 * A room card's price: an approved public starting rate ("from", any audience), the workbook's
 * indicative figures (private preview only), or "pending" ("Xem giá theo ngày"). Never a quote.
 */
export type RoomPriceView = { kind: "from"; amount: string; basis: "per-night" } | { kind: "reference"; weekday: string; weekend: string; cell: string } | { kind: "pending" };

/** A verified room specification (area, occupancy, bed, room amenity). None is verified yet (Q23, Q11). */
export type RoomSpec = { label: string; value: string };

export type RoomView = {
  id: string;
  anchor: string;
  name: string;
  price: RoomPriceView;
  specs: readonly RoomSpec[];
  summary?: string;
  description?: readonly string[];
  highlights?: readonly string[];
};

/** What the page still waits for from VNest, said only in the private preview's review notes. */
export type ContentDependency = { what: string; questions: readonly string[] };

export type PropertyDetailView = {
  /** The partner brand, as the official name's suffix gives it ("Bare Boutique Stays"). */
  brand: string;
  /** One verbatim sentence under the name (Q21: a tagline from VNest would replace it). */
  intro: string | null;
  /** The rest of the description, verbatim, in reading order, without the introduction's sentence. */
  story: readonly string[];
  /** Optional approved distinctive features once supplied by the VNest Content team. */
  distinctiveFeatures?: readonly ApprovedFeatureItem[];
  /** Optional approved booking/house policies once supplied by the VNest Content team. */
  policies?: readonly ApprovedPolicyItem[];
  /** Optional approved property FAQs once supplied by the VNest Content team. */
  faqs?: readonly ApprovedFaqItem[];
  /** Optional approved property local recommendations once supplied by the VNest Content team. */
  localRecommendations?: readonly ApprovedLocalRecommendation[];
  location: {
    /** The address as supplied, split at its first comma for reading. */
    street: string | null;
    rest: string | null;
    /** Only a link that is free of conflict and resolves to this property. */
    mapUrl: string | null;
    /** What is still pending about the location, when anything is (shown in the private preview only). */
    note: string | null;
    /**
     * The street name without the house number, for when the number conflicts between sources (The Nắng
     * Suites: workbook K174/31, Google 74/31, Q19). Both sources agree on the street, so it can be shown.
     */
    streetName: string | null;
  };
  /** The property's amenities as supplied (F4), not room by room. */
  amenities: { items: readonly string[]; incomplete: boolean; roomLevel: "not-supplied" };
  transport: string | null;
  rooms: readonly RoomView[];
  /** Whether any booking provider knows this property. False: the page says booking is not connected. */
  bookingConnected: boolean;
  /** The primary action: it checks availability only when a provider can answer. */
  cta: string;
  audience: PriceAudience;
  dependencies: { rooms: readonly ContentDependency[]; amenities: readonly ContentDependency[]; photos: readonly ContentDependency[] };
};

type Trace = {
  property: ClientProperty;
  intro: Sourced<string>;
  story: Sourced<readonly string[]>;
  amenities: Sourced<readonly string[]> & { incomplete: boolean };
  transport: Sourced<string>;
  rooms: readonly RoomDetails[];
};

/** Removes the introduction's sentence from the story, so it is not read twice. Nothing else changes. */
function storyWithout(paragraphs: readonly string[], sentence: string | null): string[] {
  if (!sentence) return [...paragraphs];
  return paragraphs.map((p) => p.replace(sentence, "").replace(/\s{2,}/g, " ").trim()).filter(Boolean);
}

export const CTA_EXPLORE = "Khám phá các loại phòng";
export const CTA_AVAILABILITY = "Xem phòng trống";

/** "K174/31 Võ Văn Kiệt, Sơn Trà, Đà Nẵng" → "Võ Văn Kiệt": the first part without its number token. */
export function streetNameOnly(raw: string | null): string | null {
  const first = raw?.split(",")[0]?.trim();
  if (!first) return null;
  const name = first.replace(/^\S*\d\S*\s+/, "").trim();
  return name && !/\d/.test(name) ? name : null;
}

export function buildDetailView(
  trace: Trace,
  options: { audience: PriceAudience; bookingConnected: boolean; approvedCopy?: ApprovedPropertyCopy },
): PropertyDetailView {
  const { property } = trace;
  const loc = property.location;
  const brandName = property.brand.raw?.split(" - ")[1]?.trim() ?? property.name.display ?? "";
  const copy = options.approvedCopy ?? approvedPropertyCopy(property.id);
  const intro = copy?.tagline ?? trace.intro.display;
  const story = copy?.introduction?.length
    ? copy.introduction
    : storyWithout(trace.story.display ?? [], trace.intro.display);
  return {
    brand: brandName,
    intro,
    story,
    ...(copy?.distinctiveFeatures?.length ? { distinctiveFeatures: copy.distinctiveFeatures } : {}),
    ...(copy?.policies?.length ? { policies: copy.policies } : {}),
    ...(copy?.faqs?.length ? { faqs: copy.faqs } : {}),
    ...(copy?.localRecommendations?.length ? { localRecommendations: copy.localRecommendations } : {}),
    location: { street: loc.street.display, rest: loc.ward.display, mapUrl: loc.mapUrl.display, note: loc.note, streetName: streetNameOnly(loc.street.raw) },
    amenities: { items: trace.amenities.display ?? [], incomplete: trace.amenities.incomplete, roomLevel: "not-supplied" },
    transport: trace.transport.display,
    rooms: trace.rooms.flatMap((room) => {
      const name = room.name.display;
      if (!name) return [];
      const roomSlug = slug(name);
      const roomCopy = copy?.roomDescriptions?.[roomSlug];
      const rate = roomRate(room.row);
      const approved = publicStartingRate(property.id, roomSlug);
      const price: RoomPriceView = approved
        ? { kind: "from", amount: formatStartingRate(approved), basis: approved.basis }
        : rate.kind === "stated" && options.audience === "private-preview"
          ? { kind: "reference", weekday: rate.weekday, weekend: rate.weekend, cell: rate.source[0]!.cell }
          : { kind: "pending" };
      // Room facts: the 15/10 room sheet's own-row values, confirmed by VNest's admin (relayed
      // 21/10/2026, LEGACY_ROOM_CONFIRMATION). A blank or merge-lent value is left out, never filled.
      const specs = (
        [
          ["Loại phòng", confirmedRoomFact(room.legacy.type, room.row, "type")],
          ["Diện tích", confirmedRoomFact(room.legacy.size, room.row, "size")],
          ["Sức chứa", confirmedRoomFact(room.legacy.capacity, room.row, "capacity")],
        ] as const
      ).flatMap(([label, fact]) => (fact.display ? [{ label, value: fact.display }] : []));
      return [
        {
          id: roomSlug,
          anchor: `phong-${roomSlug}`,
          name,
          price,
          specs,
          ...(roomCopy?.summary ? { summary: roomCopy.summary } : {}),
          ...(roomCopy?.description?.length ? { description: roomCopy.description } : {}),
          ...(roomCopy?.highlights?.length ? { highlights: roomCopy.highlights } : {}),
        },
      ];
    }),
    bookingConnected: options.bookingConnected,
    cta: options.bookingConnected ? CTA_AVAILABILITY : CTA_EXPLORE,
    audience: options.audience,
    dependencies: {
      rooms: [
        { what: "Diện tích, số khách tối đa và loại giường của từng phòng", questions: ["Q23"] },
        { what: "Tiện nghi riêng của từng phòng", questions: ["Q11"] },
        { what: "Giá của Bare Chic Two, Three và Bare Indochine; tiền tệ, đơn vị, thuế", questions: ["Q8", "Q24"] },
      ],
      amenities: [
        { what: "Danh sách tiện nghi đầy đủ (bảng VNest kết thúc bằng “,..”)", questions: ["Q11"] },
        { what: "Biểu tượng tiện nghi do BMP chọn, chờ VNest xác nhận", questions: ["Q31"] },
      ],
      photos: [
        { what: "Ảnh toàn cảnh: mặt tiền, lối vào, cầu thang, không gian chung", questions: ["Q16"] },
        { what: "Ảnh không watermark, quyền sử dụng, đồng ý của người xuất hiện trong ảnh (1.11, 1.18, 2.32)", questions: ["Q15"] },
        { what: "1.56.png và 1.59.png có trong thư mục của cả Bare Chic One và Three: thuộc phòng nào", questions: ["Q6"] },
      ],
    },
  };
}
