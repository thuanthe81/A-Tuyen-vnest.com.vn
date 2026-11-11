/**
 * BARE CHIC, DRAFT PROPERTY RECORD (section 05.2; checkpoint 1, 19/10/2026; workbook v2, 20/10/2026).
 *
 * The first real VNest property expressed as a PropertyRecord, built from the client workbook
 * (src/content/vnest-workbook) and the authorised photographs (G2, G3). It is a DRAFT:
 * - source "client-supplied", status "draft": never indexed, no structured data, not published;
 * - NOT registered in src/content/properties (what production serves). It is served only by the
 *   local "client-draft" content source (src/content/drafts/index.ts).
 *
 * `trace` keeps, for every value the record states, its workbook cells, status and open question.
 * What the workbook does not support is left out, not filled in: no room type, size or capacity
 * (v2 no longer has the room sheet; the 15/10 values are in `trace.rooms[].legacy`, status
 * "not-reconfirmed", Q23), no bedding, no room descriptions, no amenity icons (an icon is VNest's
 * choice, never guessed), no policies (the v2 policy sheet names no property and is unconfirmed,
 * Q25), no nearby places (the v2 list is shared by four properties with no per-property mapping,
 * Q28), no former district (v2 has no area field), no rate references (indicative figures are not
 * verified prices; pricing.ts reads them apart), no coordinates, no booking-provider mapping.
 */
import type { MediaRights } from "@/domain/media";
import type { Amenity, AmenityIcon, PropertyRecord, RoomType } from "@/domain/property";
import { isShowable, SELECTION, selectionForProperty, withSelectedFirst } from "@/content/vnest-workbook/image-selection";
import { amenitiesOf, nearbyFor, orderedRoomsForProperty, policyLines, transportOf, type NearbyPlace, type PolicyLine, type RoomDetails } from "@/content/vnest-workbook/property-details";
import { readClientProperties, slug, type ClientProperty } from "@/content/vnest-workbook/records";
import type { Sourced } from "@/content/vnest-workbook/sourced";

/** A local derivative of an authorised photograph, or null when it is not on this machine. */
export type PhotoLookup = (manifestKey: string) => { src: string; width: number; height: number } | null;

type ImageSpec = { id: string; manifestKey: string; room: string; alt: string };

/**
 * The photographs this page may use: G2's Bare Chic One (1.55.png) and the five G3 files. The alt
 * text describes what each photograph shows, written after looking at it at full size; each names
 * its room, because no room photograph stands for the whole property.
 */
const IMAGES: readonly ImageSpec[] = [
  { id: "bare-chic-one-1-55", manifestKey: "bare-chic", room: "Bare Chic One", alt: "Bare Chic One: bàn làm việc và ghế sofa dài bên khung cửa sổ lớn nhìn ra sân thể thao và phố" },
  { id: "bare-indochine-54", manifestKey: "bare-indochine-54", room: "Bare Indochine", alt: "Bare Indochine: ghế ngồi bên cửa sổ, tường xanh lá, nhìn ra sân thể thao và các toà nhà" },
  { id: "bare-chic-one-1-47", manifestKey: "bare-chic-one-1-47", room: "Bare Chic One", alt: "Bare Chic One: phòng tắm lát gạch trắng, nhìn qua cửa vào phòng ngủ" },
  { id: "bare-chic-two-2-3", manifestKey: "bare-chic-two-2-3", room: "Bare Chic Two", alt: "Bare Chic Two: giường, TV treo tường và ghế ngồi dài dọc khung cửa sổ lớn" },
  { id: "bare-chic-three-1-29", manifestKey: "bare-chic-three-1-29", room: "Bare Chic Three", alt: "Bare Chic Three: góc bếp nhỏ với bồn rửa và lò vi sóng, tủ quần áo mở và giường" },
  { id: "bare-indochine-53", manifestKey: "bare-indochine-53", room: "Bare Indochine", alt: "Bare Indochine: tường xanh lá, bàn làm việc và ghế ngồi dài dưới khung cửa sổ lớn" },
  // G4 (20/10/2026), each looked at full size. No alt text states a bed size, a capacity or an
  // area: the photographs do not establish them. Three show a person (1.11, 2.32, 1.18): described
  // only as "một người", never identified; a model release is part of Q15.
  { id: "bare-chic-one-1-11", manifestKey: "bare-chic-one-1-11", room: "Bare Chic One", alt: "Bare Chic One: giường và ghế ngồi dài bên cửa sổ, phản chiếu trong tấm gương lớn; một người ngồi uống cà phê bên cửa sổ" },
  { id: "bare-chic-one-1-42", manifestKey: "bare-chic-one-1-42", room: "Bare Chic One", alt: "Bare Chic One: góc bếp nhỏ với tủ xanh ngọc và lò vi sóng, tủ quần áo mở, giường và tranh treo tường" },
  { id: "bare-chic-two-2-4", manifestKey: "bare-chic-two-2-4", room: "Bare Chic Two", alt: "Bare Chic Two: từ bàn làm việc nhìn qua khung giường ra ghế ngồi dài và cửa sổ lớn" },
  { id: "bare-chic-two-2-5", manifestKey: "bare-chic-two-2-5", room: "Bare Chic Two", alt: "Bare Chic Two: bàn làm việc, tranh treo tường và góc bếp với bồn rửa" },
  { id: "bare-chic-two-2-9", manifestKey: "bare-chic-two-2-9", room: "Bare Chic Two", alt: "Bare Chic Two: góc bếp với kệ sắt, tủ quần áo mở và cửa vào phòng tắm lát gạch tối màu" },
  { id: "bare-chic-two-2-10", manifestKey: "bare-chic-two-2-10", room: "Bare Chic Two", alt: "Bare Chic Two: giường, TV treo tường và ghế ngồi dài bên cửa sổ" },
  { id: "bare-chic-two-2-32", manifestKey: "bare-chic-two-2-32", room: "Bare Chic Two", alt: "Bare Chic Two: một người ngồi bên cửa sổ trong ánh sáng dịu, tranh treo tường bên cạnh" },
  { id: "bare-chic-three-1-18", manifestKey: "bare-chic-three-1-18", room: "Bare Chic Three", alt: "Bare Chic Three: một người nằm đọc sách trên ghế ngồi dài bên cửa sổ lớn nhìn ra sân thể thao" },
  { id: "bare-chic-three-1-27", manifestKey: "bare-chic-three-1-27", room: "Bare Chic Three", alt: "Bare Chic Three: phòng tắm lát gạch trắng với bồn rửa, bồn cầu và khu tắm vòi sen sau vách kính" },
  { id: "bare-chic-three-1-57", manifestKey: "bare-chic-three-1-57", room: "Bare Chic Three", alt: "Bare Chic Three: giường, tranh treo tường và góc ngồi bên cửa sổ ở cuối phòng" },
  { id: "bare-indochine-50", manifestKey: "bare-indochine-50", room: "Bare Indochine", alt: "Bare Indochine: tường xanh lá, giường, TV và ghế ngồi dài dưới cửa sổ" },
  { id: "bare-indochine-51", manifestKey: "bare-indochine-51", room: "Bare Indochine", alt: "Bare Indochine: giường trước tấm ốp tường xám, bàn làm việc gỗ và bản đồ Sài Gòn treo tường" },
  { id: "bare-indochine-52", manifestKey: "bare-indochine-52", room: "Bare Indochine", alt: "Bare Indochine: giường gỗ, kệ treo đồ, bàn làm việc gỗ và tường xanh lá" },
  // VNest Media (30/10/2026, Priority 1): 1.1.png from Bare/Bare Chic/Bare Chic One - Three
  // visibly displays the brass door plaque "one" on the entry door, uniquely identifying Bare Chic One.
  { id: "bare-chic-one-1-1", manifestKey: "bare-chic-one-1-1", room: "Bare Chic One", alt: "Bare Chic One: chi tiết bảng tên phòng one bằng đồng trên cửa gỗ lối vào" },
  // VNest Media (29/10/2026): 25 additional person-free, non-duplicate photographs from Bare/Bare Chic/Bare Chic Two
  // (excluding 2.27..2.36 which show a model [Q15] and 2.40 which is a perceptual duplicate of 2.39).
  { id: "bare-chic-two-2-1", manifestKey: "bare-chic-two-2-1", room: "Bare Chic Two", alt: "Bare Chic Two: lối vào phòng, tủ quần áo mở và góc bếp nhỏ" },
  { id: "bare-chic-two-2-2", manifestKey: "bare-chic-two-2-2", room: "Bare Chic Two", alt: "Bare Chic Two: góc nhìn từ lối vào hướng về phía giường và khung cửa sổ lớn" },
  { id: "bare-chic-two-2-6", manifestKey: "bare-chic-two-2-6", room: "Bare Chic Two", alt: "Bare Chic Two: bàn làm việc gỗ, ghế ngồi và tranh treo tường" },
  { id: "bare-chic-two-2-7", manifestKey: "bare-chic-two-2-7", room: "Bare Chic Two", alt: "Bare Chic Two: chi tiết bàn làm việc, đèn bàn và kệ bếp liền kề" },
  { id: "bare-chic-two-2-8", manifestKey: "bare-chic-two-2-8", room: "Bare Chic Two", alt: "Bare Chic Two: góc bếp nhỏ với bồn rửa, ấm đun nước và kệ sắt" },
  { id: "bare-chic-two-2-11", manifestKey: "bare-chic-two-2-11", room: "Bare Chic Two", alt: "Bare Chic Two: giường, gối tựa và ghế ngồi dài chạy dọc khung cửa sổ" },
  { id: "bare-chic-two-2-12", manifestKey: "bare-chic-two-2-12", room: "Bare Chic Two", alt: "Bare Chic Two: góc nhìn từ đầu giường ra ghế ngồi dài bên cửa sổ" },
  { id: "bare-chic-two-2-13", manifestKey: "bare-chic-two-2-13", room: "Bare Chic Two", alt: "Bare Chic Two: ghế ngồi dài bên cửa sổ lớn đón ánh sáng tự nhiên" },
  { id: "bare-chic-two-2-14", manifestKey: "bare-chic-two-2-14", room: "Bare Chic Two", alt: "Bare Chic Two: góc nghỉ bên cửa sổ với gối tựa và bàn trà nhỏ" },
  { id: "bare-chic-two-2-15", manifestKey: "bare-chic-two-2-15", room: "Bare Chic Two", alt: "Bare Chic Two: từ ghế ngồi bên cửa sổ nhìn lại giường và góc bếp" },
  { id: "bare-chic-two-2-16", manifestKey: "bare-chic-two-2-16", room: "Bare Chic Two", alt: "Bare Chic Two: toàn cảnh không gian phòng nhìn từ phía cửa sổ" },
  { id: "bare-chic-two-2-17", manifestKey: "bare-chic-two-2-17", room: "Bare Chic Two", alt: "Bare Chic Two: giường, bàn làm việc và cửa vào phòng tắm" },
  { id: "bare-chic-two-2-18", manifestKey: "bare-chic-two-2-18", room: "Bare Chic Two", alt: "Bare Chic Two: chi tiết đầu giường, đèn đọc sách và tranh nghệ thuật" },
  { id: "bare-chic-two-2-19", manifestKey: "bare-chic-two-2-19", room: "Bare Chic Two", alt: "Bare Chic Two: góc nhìn chéo qua giường về phía bàn làm việc và kệ bếp" },
  { id: "bare-chic-two-2-20", manifestKey: "bare-chic-two-2-20", room: "Bare Chic Two", alt: "Bare Chic Two: hệ kệ sắt, tủ treo đồ và góc bếp gọn gàng" },
  { id: "bare-chic-two-2-21", manifestKey: "bare-chic-two-2-21", room: "Bare Chic Two", alt: "Bare Chic Two: phòng tắm riêng lát gạch tối màu với lavabo và gương" },
  { id: "bare-chic-two-2-22", manifestKey: "bare-chic-two-2-22", room: "Bare Chic Two", alt: "Bare Chic Two: khu vực tắm vòi sen và lavabo trong phòng tắm" },
  { id: "bare-chic-two-2-23", manifestKey: "bare-chic-two-2-23", room: "Bare Chic Two", alt: "Bare Chic Two: chi tiết bồn rửa mặt và phụ kiện phòng tắm" },
  { id: "bare-chic-two-2-24", manifestKey: "bare-chic-two-2-24", room: "Bare Chic Two", alt: "Bare Chic Two: nhìn từ phòng tắm qua khung cửa ra khu vực giường" },
  { id: "bare-chic-two-2-25", manifestKey: "bare-chic-two-2-25", room: "Bare Chic Two", alt: "Bare Chic Two: chi tiết trang trí nội thất và ánh sáng tự nhiên bên cửa sổ" },
  { id: "bare-chic-two-2-26", manifestKey: "bare-chic-two-2-26", room: "Bare Chic Two", alt: "Bare Chic Two: tách trà và sách trên bàn nhỏ cạnh khung cửa sổ" },
  { id: "bare-chic-two-2-37", manifestKey: "bare-chic-two-2-37", room: "Bare Chic Two", alt: "Bare Chic Two: góc cửa sổ nhìn ra mảng xanh và khu phố xung quanh" },
  { id: "bare-chic-two-2-38", manifestKey: "bare-chic-two-2-38", room: "Bare Chic Two", alt: "Bare Chic Two: ánh nắng chiếu qua rèm cửa lên ghế ngồi dài" },
  { id: "bare-chic-two-2-39", manifestKey: "bare-chic-two-2-39", room: "Bare Chic Two", alt: "Bare Chic Two: không gian phòng ấm áp dưới ánh đèn chiều" },
  { id: "bare-chic-two-2-41", manifestKey: "bare-chic-two-2-41", room: "Bare Chic Two", alt: "Bare Chic Two: chi tiết bảng tên phòng Two trên cửa gỗ" },
];

export const BARE_CHIC_TWO_EXTENDED_IDS: readonly string[] = [
  "bare-chic-two-2-1",
  "bare-chic-two-2-2",
  "bare-chic-two-2-6",
  "bare-chic-two-2-7",
  "bare-chic-two-2-8",
  "bare-chic-two-2-11",
  "bare-chic-two-2-12",
  "bare-chic-two-2-13",
  "bare-chic-two-2-14",
  "bare-chic-two-2-15",
  "bare-chic-two-2-16",
  "bare-chic-two-2-17",
  "bare-chic-two-2-18",
  "bare-chic-two-2-19",
  "bare-chic-two-2-20",
  "bare-chic-two-2-21",
  "bare-chic-two-2-22",
  "bare-chic-two-2-23",
  "bare-chic-two-2-24",
  "bare-chic-two-2-25",
  "bare-chic-two-2-26",
  "bare-chic-two-2-37",
  "bare-chic-two-2-38",
  "bare-chic-two-2-39",
  "bare-chic-two-2-41",
];

/**
 * Each room's photographs, the representative one first (the one that shows the whole room), then
 * living space, kitchen, bathroom, mood. A photograph belongs to the room whose Drive folder it came
 * from (folder titles, read 15/10; files sha256-verified, G2–G4; VNest Media 29/10). No photograph is listed under two
 * rooms, and none is repeated to fill a gallery. Left out: 1.56.png and 1.59.png, which are in both
 * Bare Chic One's and Three's folders (Q6).
 */
const ROOM_PHOTOS: Readonly<Record<string, readonly string[]>> = {
  "Bare Chic One": ["bare-chic-one-1-55", "bare-chic-one-1-11", "bare-chic-one-1-42", "bare-chic-one-1-47", "bare-chic-one-1-1"],
  "Bare Chic Two": [
    "bare-chic-two-2-3",
    "bare-chic-two-2-10",
    "bare-chic-two-2-4",
    "bare-chic-two-2-5",
    "bare-chic-two-2-9",
    "bare-chic-two-2-32",
    ...BARE_CHIC_TWO_EXTENDED_IDS,
  ],
  "Bare Chic Three": ["bare-chic-three-1-57", "bare-chic-three-1-18", "bare-chic-three-1-29", "bare-chic-three-1-27"],
  "Bare Indochine": ["bare-indochine-50", "bare-indochine-51", "bare-indochine-52", "bare-indochine-53", "bare-indochine-54"],
};

/**
 * The owner's image selection (26/10/2026, image-selection.ts): each room's selected photograph
 * leads that room (its cover), ahead of the gallery above; 1.42.png's older copy steps aside for
 * the selected one. Bare Chic Two's selected photograph is on hold (a person), so that room keeps
 * its cover. Only photographs present on this machine take part.
 */
const SELECTED_IMAGES: readonly ImageSpec[] = selectionForProperty("bare-chic")
  .filter(isShowable)
  .map((image) => ({ id: image.key, manifestKey: image.key, room: image.room, alt: image.alt }));

/**
 * Amenity pictograms, chosen by BMP on 20/10/2026 at the owner's request ("accessible icons and
 * concise labels"), one per supplied label and only from the content model's fixed list. Not yet
 * confirmed by VNest (Q31). "Smart TV" and "Phòng tắm riêng" have no key in the list, so they are
 * drawn with the neutral mark; the list is not extended here.
 */
export const AMENITY_ICON_CHOICES: Readonly<Record<string, AmenityIcon>> = { Wifi: "wifi", "Điều hoà nhiệt độ": "air-conditioning", "Bếp nhỏ": "kitchen" };

/**
 * The opening frame, the story's frame and the photographs section, in order. Every one is a room
 * photograph, so none is the property gallery (the content gate reserves `galleryMediaIds` for
 * pictures of the property as a whole, and VNest has supplied none: no exterior, entrance or
 * shared space). They are media sections whose captions name the rooms.
 */
const OPENING_FRAMES = ["bare-chic-one-1-55"] as const;
const STORY_FRAME = "bare-indochine-54";
// Kept for the 20/10 comparison route (/dev/stays/bare-chic-20-10), which draws "opening-frames",
// "story" and "photographs". The current layout draws "gallery".
const ROOM_PHOTOGRAPHS = ["bare-chic-two-2-3", "bare-chic-one-1-55", "bare-chic-three-1-29", "bare-indochine-53", "bare-indochine-54", "bare-chic-one-1-47"] as const;

export type BareChicTrace = {
  property: ClientProperty;
  intro: Sourced<string>;
  amenities: ReturnType<typeof amenitiesOf>;
  transport: Sourced<string>;
  /** Room names from the current workbook; each room's 15/10 facts under `legacy`, never shown. */
  rooms: readonly RoomDetails[];
  /** The description as the story's paragraphs: verbatim, split at sentence ends only. */
  story: Sourced<readonly string[]>;
  /** The area list whose header names Bare Chic among four properties. Not shown (Q28). */
  nearby: { header: Sourced<string>; places: readonly NearbyPlace[] };
  /** The v2 booking-policy sheet. Not shown: no line names a property, none is confirmed (Q25). */
  policies: readonly PolicyLine[];
  images: readonly (ImageSpec & { rights: MediaRights; available: boolean })[];
};

/**
 * The third sentence of the description, verbatim, as the short introduction under the name: "Đó
 * là một ngôi nhà gồm bốn tầng mà mỗi tầng là một căn studio riêng biệt, hiện đại và tiện nghi."
 * It says what Bare Chic is in one line. A tagline from VNest would replace it (Q21).
 */
function introFrom(description: Sourced<string>): Sourced<string> {
  const text = description.display ?? "";
  const sentences = text.split(/(?<=\.)\s+/);
  const excerpt = sentences[2] ?? "";
  return { raw: description.raw, display: excerpt || null, source: description.source, status: "normalized", rule: "Sentence 3 of the description, verbatim", clarification: "Q21" };
}

/**
 * The description in two paragraphs for reading: sentences 1–3 (the house), 4–5 (the room and its
 * window). Nothing is reworded; joined with a space, the paragraphs are the description.
 */
function storyFrom(description: Sourced<string>): Sourced<readonly string[]> {
  const sentences = (description.display ?? "").split(/(?<=\.)\s+/);
  const paragraphs = [sentences.slice(0, 3).join(" "), sentences.slice(3).join(" ")].filter(Boolean);
  return { raw: description.raw, display: paragraphs.length ? paragraphs : null, source: description.source, status: "normalized", rule: "Split into paragraphs at sentence ends; no word changed" };
}

export function buildBareChic(photo: PhotoLookup): { record: PropertyRecord; trace: BareChicTrace } {
  const property = readClientProperties().find((p) => p.id === "bare-chic");
  if (!property) throw new Error("Bare Chic is not in the workbook records");
  const first = property.rows[0]!;
  const intro = introFrom(property.description);
  const amenities = amenitiesOf(first);
  const transport = transportOf(first);
  const orderedRooms = orderedRoomsForProperty("bare-chic");
  const rooms = orderedRooms.map((r) => r.details);
  const story = storyFrom(property.description);
  const nearby = nearbyFor(property.name.display!);
  if (!nearby) throw new Error("No nearby block names Bare Chic");
  const city = property.city.display === "ho-chi-minh" ? "TP. Hồ Chí Minh" : null;
  if (!city) throw new Error("Bare Chic's address names no known city");

  const selected = SELECTED_IMAGES.filter((spec) => photo(spec.manifestKey) !== null);
  // An older copy of a selected photograph (1.42.png) is left out, so each photograph appears once.
  const replaced = new Set(SELECTION.filter((i) => i.replaces && selected.some((spec) => spec.id === i.key)).map((i) => i.replaces!));
  const images = [...IMAGES.filter((spec) => !replaced.has(spec.id)), ...selected].map((spec) => {
    const file = photo(spec.manifestKey);
    return { ...spec, file, rights: (file ? "client-supplied-pending" : "placeholder") as MediaRights, available: file !== null };
  });
  const roomMedia = (room: string) => withSelectedFirst(ROOM_PHOTOS[room] ?? [], room, (key) => selected.some((spec) => spec.id === key));
  /** The photographs gallery at the top of the page: every photograph once, grouped by room, in workbook room order. */
  const GALLERY = orderedRooms.flatMap((room) => roomMedia(room.name));
  const roomIdOf = (room: string) => slug(room);

  const roomTypes: RoomType[] = orderedRooms.map((room) => ({
    id: room.id,
    slug: room.id,
    name: { vi: room.name },
    amenities: [],
    mediaIds: roomMedia(room.name),
  }));

  const amenityList: Amenity[] = (amenities.display ?? []).map((label) => ({ id: slug(label), label: { vi: label }, ...(AMENITY_ICON_CHOICES[label] ? { icon: AMENITY_ICON_CHOICES[label] } : {}) }));

  const record: PropertyRecord = {
    id: "bare-chic",
    slug: "bare-chic",
    source: "client-supplied",
    status: "draft",
    approvedLocales: ["vi"],
    identity: {
      name: { vi: property.name.display! },
      // The photograph that introduces Bare Chic elsewhere (the Brand Collection card, G2). It is a
      // room: every presentation names that room beside it.
      signatureMediaId: OPENING_FRAMES[0],
      brandId: property.brand.display!,
    },
    narrative: {
      ...(intro.display ? { positioning: { vi: intro.display } } : {}),
      ...(property.description.display ? { summary: { vi: property.description.display } } : {}),
    },
    place: {
      // The city, read from the address (I4). v2 has no area or district field, so no former
      // district is stated here, even where an outside source names one (location-evidence.ts).
      area: { id: "tp-hcm", slug: "tp-hcm", name: { vi: city } },
      ...(property.address.display ? { address: { vi: property.address.display } } : {}),
      timeZone: "Asia/Ho_Chi_Minh",
    },
    media: {
      images: images.map((image) =>
        image.file
          ? { kind: "image" as const, id: image.id, src: image.file.src, alt: { vi: image.alt }, rights: image.rights, width: image.file.width, height: image.file.height, roomTypeId: roomIdOf(image.room) }
          : { kind: "image" as const, id: image.id, alt: { vi: `Ảnh chờ: ${image.room}` }, rights: image.rights, width: 3, height: 2, roomTypeId: roomIdOf(image.room) },
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
      // The page's order. The record says what and in which order; the layout draws it. No
      // policies and no nearby section: neither has content VNest has confirmed for Bare Chic.
      sections: [
        { kind: "media", id: "opening-frames", variant: "opening", mediaIds: OPENING_FRAMES, caption: { vi: "Ảnh: Bare Chic One" } },
        ...(story.display ? [{ kind: "narrative" as const, id: "story", heading: { vi: "Giới thiệu" }, body: story.display.map((vi) => ({ vi })), mediaIds: [STORY_FRAME] }] : []),
        { kind: "media", id: "photographs", variant: "room-photographs", mediaIds: ROOM_PHOTOGRAPHS, caption: { vi: "Ảnh các phòng của Bare Chic" } },
        { kind: "media", id: "gallery", variant: "grouped-by-room", mediaIds: GALLERY, caption: { vi: "Ảnh các phòng của Bare Chic, theo từng phòng" } },
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
