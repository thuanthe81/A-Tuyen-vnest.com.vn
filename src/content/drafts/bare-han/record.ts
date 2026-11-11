/**
 * BARE HÀN, DRAFT PROPERTY RECORD (VNest V3 Property Photography & Page Completion, 29/10/2026).
 *
 * Built from the 20/10/2026 workbook (`VNest_Informationv2.xlsx`, rows 16–19), the 15/10/2026
 * room sheet (confirmed by VNest's admin on 21/10/2026, R3 owner rule 25/10/2026), and all 22
 * authorised person-free local photographs from `/Users/noe/Documents/VNest Media/Bare/Bare Hàn`
 * plus the 26/10/2026 owner selection (`sel-10-bare-han-ground`, `sel-11-bare-han-two`,
 * `sel-12-bare-han-three`).
 *
 * Rooms (4 physical Studio units):
 *   1. Bare Hàn Ground — Studio · 30 m² · 2 người lớn (row 16: D16:D19, E16:E19, F4:F25) — 6 photos
 *   2. Bare Hàn One    — Studio · 30 m² · 2 người lớn (row 17: D16:D19, E16:E19, F4:F25) — 6 photos
 *   3. Bare Hàn Two    — Studio · 30 m² · 2 người lớn (row 18: D16:D19, E16:E19, F4:F25) — 5 photos
 *   4. Bare Hàn Three  — Studio · 30 m² · 2 người lớn (row 19: D16:D19, E16:E19, F4:F25) — 5 photos
 */
import type { MediaRights } from "@/domain/media";
import type { Amenity, PropertyRecord, RoomType } from "@/domain/property";
import { isShowable, SELECTION, selectionForProperty, withSelectedFirst } from "@/content/vnest-workbook/image-selection";
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

export const BARE_HAN_IMAGES: readonly ImageSpec[] = [
  // Bare Hàn Ground (after cover sel-10-bare-han-ground / 45.jpg)
  {
    id: "bare-han-ground-26",
    manifestKey: "bare-han-ground-26",
    room: "Bare Hàn Ground",
    alt: "Bare Hàn Ground: giường ngủ với vòm gỗ phía sau đầu giường và cây xanh bên khung cửa sổ",
  },
  {
    id: "bare-han-ground-30",
    manifestKey: "bare-han-ground-30",
    room: "Bare Hàn Ground",
    alt: "Bare Hàn Ground: góc nhìn từ giường ngủ qua bàn trà tròn ra băng ghế bên giếng trời cây xanh",
  },
  {
    id: "bare-han-ground-31",
    manifestKey: "bare-han-ground-31",
    room: "Bare Hàn Ground",
    alt: "Bare Hàn Ground: góc bếp nhỏ gọn gàng với kệ gỗ hắt sáng, bồn rửa và bàn làm việc",
  },
  {
    id: "bare-han-ground-36",
    manifestKey: "bare-han-ground-36",
    room: "Bare Hàn Ground",
    alt: "Bare Hàn Ground: hệ tủ quần áo xanh lá, quầy bếp gỗ và lối đi thoáng sáng tại tầng trệt",
  },
  {
    id: "bare-han-ground-42",
    manifestKey: "bare-han-ground-42",
    room: "Bare Hàn Ground",
    alt: "Bare Hàn Ground: phòng tắm riêng sáng thoáng với lavabo, gương vòm và khu tắm vòi sen",
  },
  // Bare Hàn One (all 6 photos from Bare/Bare Hàn/Bare Han One)
  {
    id: "bare-han-one-6",
    manifestKey: "bare-han-one-6",
    room: "Bare Hàn One",
    alt: "Bare Hàn One: toàn cảnh giường ngủ, vách gỗ cong và khung cửa kính lớn đón ánh nắng tự nhiên",
  },
  {
    id: "bare-han-one-7",
    manifestKey: "bare-han-one-7",
    room: "Bare Hàn One",
    alt: "Bare Hàn One: khu vực bếp nhỏ ốp gỗ ấm cúng với kệ đèn, bồn rửa và tủ lạnh",
  },
  {
    id: "bare-han-one-9",
    manifestKey: "bare-han-one-9",
    room: "Bare Hàn One",
    alt: "Bare Hàn One: góc ngồi thư giãn với ghế bành, bàn tròn bên cửa sổ nhìn ra mảng xanh",
  },
  {
    id: "bare-han-one-11",
    manifestKey: "bare-han-one-11",
    room: "Bare Hàn One",
    alt: "Bare Hàn One: nhìn từ góc bếp về phía giường ngủ, bàn làm việc và cửa kính ban công",
  },
  {
    id: "bare-han-one-13",
    manifestKey: "bare-han-one-13",
    room: "Bare Hàn One",
    alt: "Bare Hàn One: chi tiết đường cong kiến trúc, hệ tủ gỗ và ánh sáng dịu trong căn studio",
  },
  {
    id: "bare-han-one-15",
    manifestKey: "bare-han-one-15",
    room: "Bare Hàn One",
    alt: "Bare Hàn One: phòng tắm riêng với bồn rửa mặt, gương tròn và vách kính tắm đứng",
  },
  // Bare Hàn Two (after cover sel-11-bare-han-two / 67.jpg)
  {
    id: "bare-han-two-52",
    manifestKey: "bare-han-two-52",
    room: "Bare Hàn Two",
    alt: "Bare Hàn Two: giường ngủ với gối xanh, đầu giường vòm gỗ và ánh nắng chiếu qua rèm cửa",
  },
  {
    id: "bare-han-two-53",
    manifestKey: "bare-han-two-53",
    room: "Bare Hàn Two",
    alt: "Bare Hàn Two: góc ghế bành vàng, bàn trà tròn và cây xanh bên khung cửa kính thoáng rộng",
  },
  {
    id: "bare-han-two-58",
    manifestKey: "bare-han-two-58",
    room: "Bare Hàn Two",
    alt: "Bare Hàn Two: quầy bếp gỗ có đèn hắt sáng, bồn rửa và kệ tiện nghi gọn gàng",
  },
  {
    id: "bare-han-two-61",
    manifestKey: "bare-han-two-61",
    room: "Bare Hàn Two",
    alt: "Bare Hàn Two: phòng tắm riêng ốp gạch sáng với lavabo, gương và khu vực tắm vòi sen",
  },
  // Bare Hàn Three (after cover sel-12-bare-han-three / 83.jpg)
  {
    id: "bare-han-three-73",
    manifestKey: "bare-han-three-73",
    room: "Bare Hàn Three",
    alt: "Bare Hàn Three: góc nhìn từ đầu giường ra quầy bếp khung gỗ, bàn trà và cửa sổ ngập nắng",
  },
  {
    id: "bare-han-three-81",
    manifestKey: "bare-han-three-81",
    room: "Bare Hàn Three",
    alt: "Bare Hàn Three: toàn cảnh giường ngủ, vách gỗ cong và bàn làm việc cạnh khung cửa kính lớn",
  },
  {
    id: "bare-han-three-82",
    manifestKey: "bare-han-three-82",
    room: "Bare Hàn Three",
    alt: "Bare Hàn Three: chi tiết bàn làm việc gỗ, ghế ngồi và cây xanh bên khung cửa kính",
  },
  {
    id: "bare-han-three-84",
    manifestKey: "bare-han-three-84",
    room: "Bare Hàn Three",
    alt: "Bare Hàn Three: phòng tắm riêng hiện đại với lavabo, gương lớn và buồng tắm vách kính",
  },
];

const ROOM_PHOTOS: Readonly<Record<string, readonly string[]>> = {
  "Bare Hàn Ground": BARE_HAN_IMAGES.filter((i) => i.room === "Bare Hàn Ground").map((i) => i.id),
  "Bare Hàn One": BARE_HAN_IMAGES.filter((i) => i.room === "Bare Hàn One").map((i) => i.id),
  "Bare Hàn Two": BARE_HAN_IMAGES.filter((i) => i.room === "Bare Hàn Two").map((i) => i.id),
  "Bare Hàn Three": BARE_HAN_IMAGES.filter((i) => i.room === "Bare Hàn Three").map((i) => i.id),
};

const SELECTED_IMAGES: readonly ImageSpec[] = selectionForProperty("bare-han")
  .filter(isShowable)
  .map((image) => ({ id: image.key, manifestKey: image.key, room: image.room, alt: image.alt }));

export type BareHanTrace = {
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
  const excerpt = sentences[2] ?? sentences[0] ?? "";
  return {
    raw: description.raw,
    display: excerpt || null,
    source: description.source,
    status: "normalized",
    rule: "Sentence 3 of the description, verbatim",
    clarification: "Q21",
  };
}

function storyFrom(description: Sourced<string>): Sourced<readonly string[]> {
  const sentences = (description.display ?? "").split(/(?<=\.)\s+/).filter(Boolean);
  const paragraphs = [sentences.slice(0, 4).join(" "), sentences.slice(4).join(" ")].filter(Boolean);
  return {
    raw: description.raw,
    display: paragraphs.length ? paragraphs : null,
    source: description.source,
    status: "normalized",
    rule: "Split into two paragraphs at sentence ends; no word changed",
  };
}

export function buildBareHan(photo: PhotoLookup): { record: PropertyRecord; trace: BareHanTrace } {
  const property = readClientProperties().find((p) => p.id === "bare-han");
  if (!property) throw new Error("Bare Hàn is not in the workbook records");

  const first = property.rows[0]!;
  const intro = introFrom(property.description);
  const amenities = amenitiesOf(first);
  const transport = transportOf(first);
  const orderedRooms = orderedRoomsForProperty("bare-han");
  const rooms = orderedRooms.map((r) => r.details);
  const story = storyFrom(property.description);
  const nearby = nearbyFor(property.name.display!);
  if (!nearby) throw new Error("No nearby block names Bare Hàn");
  const city = property.city.display === "da-nang" ? "Đà Nẵng" : null;
  if (!city) throw new Error("Bare Hàn's address names no known city");

  const selected = SELECTED_IMAGES.filter((spec) => photo(spec.manifestKey) !== null);
  const replaced = new Set(
    SELECTION.filter((i) => i.replaces && selected.some((spec) => spec.id === i.key)).map((i) => i.replaces!),
  );
  const images = [...BARE_HAN_IMAGES.filter((spec) => !replaced.has(spec.id)), ...selected].map((spec) => {
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
    images.find((i) => i.id === "sel-11-bare-han-two")?.id ?? images[0]?.id ?? "bare-han-ground-26";

  const roomTypes: RoomType[] = rooms.map((room) => ({
    id: roomIdOf(room.name.display!),
    slug: roomIdOf(room.name.display!),
    name: { vi: room.name.display! },
    amenities: [],
    mediaIds: roomMedia(room.name.display!),
  }));

  const amenityList: Amenity[] = (amenities.display ?? []).map((label) => ({
    id: slug(label),
    label: { vi: label },
    ...(AMENITY_ICON_CHOICES[label] ? { icon: AMENITY_ICON_CHOICES[label] } : {}),
  }));

  const record: PropertyRecord = {
    id: "bare-han",
    slug: "bare-han",
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
      area: { id: "da-nang", slug: "da-nang", name: { vi: city } },
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
          caption: { vi: "Ảnh các phòng của Bare Hàn, theo từng phòng" },
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
