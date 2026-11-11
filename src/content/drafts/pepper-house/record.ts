/**
 * PEPPER HOUSE, DRAFT PROPERTY RECORD (VNest V3 Property Detail milestone, 30/10/2026).
 *
 * Built from the 20/10/2026 workbook (`VNest_Informationv2.xlsx`, rows 24–25), the 15/10/2026
 * room sheet (confirmed by VNest's admin on 21/10/2026, R3 owner rule 25/10/2026), and the
 * 4 authorised local photographs on disk (G2 primary `03.jpg` + owner selection 26/10/2026
 * images 15, 16, 17).
 *
 * Official workbook rooms (rows 24–25):
 *   1. Pepper House 3rd-floor — Studio · 40 m² · 2 người lớn (row 24: D24:D25, E24:E25, F4:F25)
 *   2. Pepper House 4th-floor — Studio · 40 m² · 2 người lớn (row 25: D24:D25, E24:E25, F4:F25)
 *
 * Photographs (11 locally available across both rooms; no invented assets):
 *   - Pepper House 3rd-floor (6): sel-15-pepper-house-3rd-floor-a (08.jpg, room cover),
 *                                 sel-16-pepper-house-3rd-floor-b (01.jpg),
 *                                 pepper-house-3rd-floor-03 (03.jpg, G2 primary under manifestKey "pepper-house"),
 *                                 pepper-house-3rd-floor-02 / -09 / -04 (02.jpg, 09.jpg, 04.jpg; imported 4/11/2026)
 *   - Pepper House 4th-floor (5): sel-17-pepper-house-4th-floor (pepperhouse-74.jpg, room cover & property cover),
 *                                 pepper-house-4th-floor-81 / -72 / -79 / -76 (imported 4/11/2026)
 *
 * Location:
 *   - Workbook cell I24:I25: "19 Hoàng Sa, Phường Sài Gòn, TP HCM"
 *   - Workbook cell J24:J25: "https://share.google/EtwVNoPbiCmG7Tvbj"
 *     (corroborated on Google Maps as "Pepper House", /g/11l6686012, free of hyperlink conflict).
 */
import type { MediaRights } from "@/domain/media";
import type { Amenity, PropertyRecord, RoomType } from "@/domain/property";
import { isShowable, SELECTION, selectionForProperty, withRoomCover, withSelectedFirst } from "@/content/vnest-workbook/image-selection";
import {
  amenitiesOf,
  nearbyFor,
  orderedRoomsForProperty,
  policyLines,
  transportOf,
  type NearbyPlace,
  type PolicyLine,
  type RoomDetails,
} from "@/content/vnest-workbook/property-details";
import { readClientProperties, slug, type ClientProperty } from "@/content/vnest-workbook/records";
import type { Sourced } from "@/content/vnest-workbook/sourced";
import { AMENITY_ICON_CHOICES, type PhotoLookup } from "../bare-chic/record";

export type { PhotoLookup };

type ImageSpec = { id: string; manifestKey: string; room: string; alt: string };

/**
 * G2 primary photograph for Pepper House 3rd-floor (`03.jpg`, stored under manifest key `"pepper-house"`).
 * Owner-selected images 15 & 16 (`sel-15-pepper-house-3rd-floor-a`, `sel-16-pepper-house-3rd-floor-b`)
 * lead `Pepper House 3rd-floor`, and image 17 (`sel-17-pepper-house-4th-floor`) leads `Pepper House 4th-floor`.
 */
export const PEPPER_HOUSE_IMAGES: readonly ImageSpec[] = [
  {
    id: "pepper-house-3rd-floor-03",
    manifestKey: "pepper-house",
    room: "Pepper House 3rd-floor",
    alt: "Pepper House 3rd-floor: phòng ngủ với ghế bành xanh đậm, giường trắng và khung cửa kính lớn nhìn ra cây xanh",
  },
  // Pepper House room photography imported 4/11/2026 from the owner's local "VNest Media/Pepper House" folders
  // ("3th-floor" → 3rd-floor, "4th-floor" → 4th-floor); provenance in docs/content/pepper-house-2026-11-04/.
  {
    id: "pepper-house-3rd-floor-02",
    manifestKey: "pepper-house-3rd-floor-02",
    room: "Pepper House 3rd-floor",
    alt: "Pepper House 3rd-floor: giường trắng với gối xanh đậm bên khung cửa kính lớn nhìn ra hàng cây",
  },
  {
    id: "pepper-house-3rd-floor-09",
    manifestKey: "pepper-house-3rd-floor-09",
    room: "Pepper House 3rd-floor",
    alt: "Pepper House 3rd-floor: sofa xanh đậm dưới mảng gương trang trí trên tường xanh nhạt, bàn ăn và bếp phía sau",
  },
  {
    id: "pepper-house-3rd-floor-04",
    manifestKey: "pepper-house-3rd-floor-04",
    room: "Pepper House 3rd-floor",
    alt: "Pepper House 3rd-floor: góc làm việc với bàn gỗ và kệ xanh nhạt, nhìn về phía bếp và bàn ăn",
  },
  {
    id: "pepper-house-4th-floor-81",
    manifestKey: "pepper-house-4th-floor-81",
    room: "Pepper House 4th-floor",
    alt: "Pepper House 4th-floor: giường, sofa da màu nâu cam và bàn ăn dưới đèn thả màu đồng, tường bê tông",
  },
  {
    id: "pepper-house-4th-floor-72",
    manifestKey: "pepper-house-4th-floor-72",
    room: "Pepper House 4th-floor",
    alt: "Pepper House 4th-floor: góc tiếp khách với sofa da màu nâu cam trên sàn gạch hoa văn hình học",
  },
  {
    id: "pepper-house-4th-floor-79",
    manifestKey: "pepper-house-4th-floor-79",
    room: "Pepper House 4th-floor",
    alt: "Pepper House 4th-floor: tủ quần áo kính, góc làm việc và giường bên khung cửa kính lớn",
  },
  {
    id: "pepper-house-4th-floor-76",
    manifestKey: "pepper-house-4th-floor-76",
    room: "Pepper House 4th-floor",
    alt: "Pepper House 4th-floor: bàn ăn gỗ dưới đèn thả màu đồng, cửa trượt gỗ và góc bếp",
  },
];

/** Room galleries: the owner-selected images lead each room (withSelectedFirst), then these, in this order. */
const ROOM_PHOTOS: Readonly<Record<string, readonly string[]>> = {
  "Pepper House 3rd-floor": ["pepper-house-3rd-floor-03", "pepper-house-3rd-floor-02", "pepper-house-3rd-floor-09", "pepper-house-3rd-floor-04"],
  "Pepper House 4th-floor": ["pepper-house-4th-floor-81", "pepper-house-4th-floor-72", "pepper-house-4th-floor-79", "pepper-house-4th-floor-76"],
};

const OFFICIAL_ROOM_NAME_BY_ID: Readonly<Record<string, string>> = {
  "pepper-house-3rd-floor": "Pepper House 3rd-floor",
  "pepper-house-4th-floor": "Pepper House 4th-floor",
};

const SELECTED_IMAGES: readonly ImageSpec[] = selectionForProperty("pepper-house")
  .filter(isShowable)
  .map((image) => ({
    id: image.key,
    manifestKey: image.key,
    room: OFFICIAL_ROOM_NAME_BY_ID[image.roomId] ?? image.room,
    alt: image.alt,
  }));

export type PepperHouseTrace = {
  property: ClientProperty;
  intro: Sourced<string>;
  amenities: ReturnType<typeof amenitiesOf>;
  transport: Sourced<string>;
  rooms: readonly RoomDetails[];
  story: Sourced<readonly string[]>;
  nearby: { header: Sourced<string>; places: readonly NearbyPlace[] };
  policies: readonly PolicyLine[];
  images: readonly (ImageSpec & { rights: MediaRights; available: boolean })[];
};

function introFrom(description: Sourced<string>): Sourced<string> {
  const text = description.display ?? "";
  const sentences = text.split(/(?<=\.)\s+/);
  const excerpt = sentences[0] ?? "";
  return {
    raw: description.raw,
    display: excerpt || null,
    source: description.source,
    status: "normalized",
    rule: "Sentence 1 of the description, verbatim",
    clarification: "Q21",
  };
}

function storyFrom(description: Sourced<string>): Sourced<readonly string[]> {
  const sentences = (description.display ?? "").split(/(?<=\.)\s+/).filter(Boolean);
  const paragraphs = [sentences.slice(0, 2).join(" "), sentences.slice(2).join(" ")].filter(Boolean);
  return {
    raw: description.raw,
    display: paragraphs.length ? paragraphs : null,
    source: description.source,
    status: "normalized",
    rule: "Split into two paragraphs at sentence ends; no word changed",
    clarification: "Q26",
  };
}

export function buildPepperHouse(photo: PhotoLookup): { record: PropertyRecord; trace: PepperHouseTrace } {
  const property = readClientProperties().find((p) => p.id === "pepper-house");
  if (!property) throw new Error("Pepper House is not in the workbook records");

  const first = property.rows[0]!;
  const intro = introFrom(property.description);
  const amenities = amenitiesOf(first);
  const transport = transportOf(first);
  const orderedRooms = orderedRoomsForProperty("pepper-house");
  const rooms = orderedRooms.map((r) => r.details);
  const story = storyFrom(property.description);
  const nearby = nearbyFor(property.name.display!);
  if (!nearby) throw new Error("No nearby block names Pepper House");
  const city = property.city.display === "ho-chi-minh" ? "TP. Hồ Chí Minh" : null;
  if (!city) throw new Error("Pepper House's address names no known city");

  const selected = SELECTED_IMAGES.filter((spec) => photo(spec.manifestKey) !== null);
  const replaced = new Set(
    SELECTION.filter((i) => i.replaces && selected.some((spec) => spec.id === i.key)).map((i) => i.replaces!),
  );
  const images = [...PEPPER_HOUSE_IMAGES.filter((spec) => !replaced.has(spec.id)), ...selected].map((spec) => {
    const file = photo(spec.manifestKey);
    return {
      ...spec,
      file,
      rights: (file ? "client-supplied-pending" : "placeholder") as MediaRights,
      available: file !== null,
    };
  });

  const roomMedia = (room: string) =>
    withSelectedFirst(ROOM_PHOTOS[room] ?? [], room, (key) => selected.some((spec) => spec.id === key));
  const GALLERY = rooms.flatMap((room) => roomMedia(room.name.display!));
  const roomIdOf = (room: string) => slug(room);
  const signatureMediaId =
    images.find((i) => i.id === "sel-17-pepper-house-4th-floor")?.id ??
    images[0]?.id ??
    "pepper-house-3rd-floor-03";

  const roomTypes: RoomType[] = rooms.map((room) => ({
    id: roomIdOf(room.name.display!),
    slug: roomIdOf(room.name.display!),
    name: { vi: room.name.display! },
    amenities: [],
    // The room's own photographs lead with its chosen cover; the property gallery (GALLERY) keeps the selection order.
    mediaIds: withRoomCover(roomMedia(room.name.display!), room.name.display!),
  }));

  const amenityList: Amenity[] = (amenities.display ?? []).map((label) => {
    const icon = label === "Bếp" ? "kitchen" : AMENITY_ICON_CHOICES[label];
    return {
      id: slug(label),
      label: { vi: label },
      ...(icon ? { icon } : {}),
    };
  });

  const record: PropertyRecord = {
    id: "pepper-house",
    slug: "pepper-house",
    source: "client-supplied",
    status: "draft",
    approvedLocales: ["vi"],
    identity: {
      name: { vi: property.name.display! },
      signatureMediaId,
      brandId: property.brand.display!,
    },
    narrative: {
      ...(intro.display ? { positioning: { vi: intro.display } } : {}),
      ...(property.description.display ? { summary: { vi: property.description.display } } : {}),
    },
    place: {
      area: { id: "tp-hcm", slug: "tp-hcm", name: { vi: city } },
      ...(property.address.display ? { address: { vi: property.address.display } } : {}),
      timeZone: "Asia/Ho_Chi_Minh",
    },
    media: {
      images: images.map((image) =>
        image.file
          ? {
              kind: "image" as const,
              id: image.id,
              src: image.file.src,
              alt: { vi: image.alt },
              rights: image.rights,
              width: image.file.width,
              height: image.file.height,
              roomTypeId: roomIdOf(image.room),
            }
          : {
              kind: "image" as const,
              id: image.id,
              alt: { vi: `Ảnh chờ: ${image.room}` },
              rights: image.rights,
              width: 3,
              height: 2,
              roomTypeId: roomIdOf(image.room),
            },
      ),
      videos: [],
    },
    amenities: amenityList,
    nearby: [],
    rooms: roomTypes,
    rateReferences: [],
    policies: [],
    faqs: [],
    seo: {},
    presentation: {
      layout: "living-frames",
      sections: [
        {
          kind: "media",
          id: "gallery",
          variant: "grouped-by-room",
          mediaIds: GALLERY,
          caption: { vi: "Ảnh các phòng của Pepper House, theo từng phòng" },
        },
        { kind: "collection", id: "amenities", collection: "amenities", heading: { vi: "Tiện nghi" } },
        { kind: "collection", id: "rooms", collection: "rooms", heading: { vi: "Các phòng" } },
        { kind: "collection", id: "location", collection: "location", heading: { vi: "Vị trí" } },
      ],
    },
    booking: { providers: {} },
  };

  return {
    record,
    trace: {
      property,
      intro,
      amenities,
      transport,
      rooms,
      story,
      nearby,
      policies: policyLines(),
      images: images.map(({ file: _file, ...rest }) => rest),
    },
  };
}
