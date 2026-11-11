/**
 * VNEST IMAGE SELECTION (owner handoff, 26/10/2026): THE ONE PLACE that says which photograph is
 * the homepage hero, each property's cover and each room's cover. Change a choice here and every
 * surface follows (homepage hero and property cards, booking results room cards and drawers, the
 * Bare Chic and The Nắng Suites room collections).
 *
 * Source: 17 original files placed by the owner in
 * `.local-media/vnest-hero-selection/vnest-selected-images/` (git-ignored), with `mapping.csv` and
 * `README_HANDOFF.md`. Each file is pinned by the SHA-256 that mapping.csv records; the derive
 * script (docs/content/selection/derive-selection.mjs) refuses a file that does not match, and the
 * page shows a photograph only when the derived manifest carries that same hash.
 *
 * Rules carried over from the handoff:
 * - 02 (Bare Chic Two) shows a person. It stays out of every surface until image-use permission is
 *   confirmed (`hold`, Q15); it is not even derived. Bare Chic Two keeps its existing cover.
 * - 15 and 16 are two views of ONE room, Pepper House 3rd Floor: never a second room or unit.
 * - 01 is the same photograph as Bare Chic One's `bare-chic-one-1-42`, 14 the same as Blue Moon's
 *   `nang-blue-moon-18` (compared pixel by pixel, 26/10). `replaces` names the older copy, which is
 *   then left out of that room's gallery so no photograph appears twice.
 * - Existing room galleries are kept: a selected photograph is put first (the cover), the room's
 *   previous photographs follow.
 *
 * Crops: `crop.card` is the cards' object-position (3:2 cards show the whole frame; it matters for
 * narrow slices). The hero has one focal point per breakpoint, chosen by rendering each photograph
 * at the hero's real shapes: phone (<48rem, about 0.6:1), tablet (48–64rem, about 1.1:1) and
 * desktop (≥64rem, about 2.4:1).
 */
import { slug } from "./records";

export type SelectionImage = {
  /** The owner's number, 1–17 ("Image 1" … "Image 17"). */
  n: number;
  /** Manifest key and derivative folder name. */
  key: string;
  /** File in the handoff folder. */
  file: string;
  /** The file's name before packaging (mapping.csv `original_filename`). */
  originalFilename: string;
  sha256: string;
  bytes: number;
  propertyId: string;
  /** Room id (the workbook room name, slugged as records.ts does) and the room's name as the brief writes it. */
  roomId: string;
  room: string;
  /** What the photograph shows, in Vietnamese, naming its room. */
  alt: string;
  crop: { card: string; mobile: string; tablet: string; desktop: string };
  /** An older copy of the same photograph already in that room's gallery. */
  replaces?: string;
  hold?: { reason: "person-visible"; question: "Q15"; note: string };
};

/**
 * Recorded from the owner's message of 26/10/2026 (quoted in part): "use the uploaded approved
 * image set … Use these original files as the source for the homepage hero carousel, property
 * representative images and room-card covers … Review image-use permissions before displaying
 * images containing people." Scope as every other client photograph: private local review, never
 * committed, deployed or published (rights for public use are still Q15).
 */
export const SELECTION_AUTHORISATION = {
  grantedBy: "Project owner, in the V3 review session",
  date: "2026-10-26",
  scope: "private-local-review",
  reference: "Owner's message of 26/10/2026 with the 17-image handoff (mapping.csv, README_HANDOFF.md)",
} as const;

export const SELECTION_SOURCE_DIR = ".local-media/vnest-hero-selection/vnest-selected-images";

const CENTRE = "50% 50%";

export const SELECTION: readonly SelectionImage[] = [
  {
    n: 1, key: "sel-01-bare-chic-one", file: "01_bare-chic-one.png", originalFilename: "1.42.png", bytes: 4359621,
    sha256: "d1a7957a77b0dafd15371b22713fffbdfcd598ebd18ebda0a86a80f2c87ad50e",
    propertyId: "bare-chic", roomId: "bare-chic-one", room: "Bare Chic One",
    alt: "Bare Chic One: giường với gối vàng dưới tranh màu, góc bếp nhỏ tủ xanh ngọc và tủ quần áo mở",
    crop: { card: "68% 50%", mobile: "70% 50%", tablet: "62% 50%", desktop: "50% 55%" },
    replaces: "bare-chic-one-1-42",
  },
  {
    n: 2, key: "sel-02-bare-chic-two", file: "02_bare-chic-two.png", originalFilename: "2.32.png", bytes: 5148253,
    sha256: "e1030b3c037e0cfded066e70d5281d2b47c428598fc76977570bb8176c4142d5",
    propertyId: "bare-chic", roomId: "bare-chic-two", room: "Bare Chic Two",
    alt: "Bare Chic Two: một người ngồi bên cửa sổ trong ánh sáng dịu, tranh treo tường bên cạnh",
    crop: { card: CENTRE, mobile: CENTRE, tablet: CENTRE, desktop: CENTRE },
    hold: { reason: "person-visible", question: "Q15", note: "Same photograph as RELEASE_HOLDS bare-chic-two-2-32; shown nowhere until image-use permission is confirmed." },
  },
  {
    n: 3, key: "sel-03-bare-chic-three", file: "03_bare-chic-three.png", originalFilename: "1.59.png", bytes: 4367693,
    sha256: "8f3fc26edc4509aaffe652bfe12aca1b84eaaaa16192d4314411a5a9767e4d46",
    propertyId: "bare-chic", roomId: "bare-chic-three", room: "Bare Chic Three",
    alt: "Bare Chic Three: giường gối vàng và bàn làm việc bên khung cửa kính lớn nhìn ra cây xanh và thành phố",
    crop: { card: "60% 50%", mobile: "62% 50%", tablet: "58% 50%", desktop: "50% 50%" },
  },
  {
    n: 4, key: "sel-04-bare-hyphen-one", file: "04_bare-hyphen-one.jpg", originalFilename: "a-6.jpg", bytes: 411016,
    sha256: "0c1074c33f06342f3a04857408e245a725cccdef5fbcbd4d908c2bb21ff13aad",
    propertyId: "bare-hyphen", roomId: "bare-hyphen-one", room: "Bare Hyphen One",
    alt: "Bare Hyphen One: giường với gối hoạ tiết lá trước tường xanh đậm, tủ gỗ sáng và cây xanh bên cửa",
    crop: { card: "45% 50%", mobile: "45% 50%", tablet: "45% 50%", desktop: "50% 55%" },
  },
  {
    n: 5, key: "sel-05-bare-hyphen-two", file: "05_bare-hyphen-two.jpg", originalFilename: "a-74.jpg", bytes: 445088,
    sha256: "1ab9be610422fd4c0627c60467df4ba4641e907b159618863616446ae0698685",
    propertyId: "bare-hyphen", roomId: "bare-hyphen-two", room: "Bare Hyphen Two",
    alt: "Bare Hyphen Two: giường rộng trước tường xanh đậm, góc bếp có kệ đèn và TV treo tường",
    crop: { card: "42% 50%", mobile: "40% 50%", tablet: "45% 50%", desktop: "50% 60%" },
  },
  {
    n: 6, key: "sel-06-bare-da-kao-one", file: "06_bare-da-kao-one.jpg", originalFilename: "Bare ĐaKao_25.jpg", bytes: 456250,
    sha256: "29abd1381ae0be2520beee47405270b3a0455d9d7a2188a6915c3a7ac78024df",
    propertyId: "bare-da-kao", roomId: "bare-da-kao-one", room: "Bare Đa Kao One",
    alt: "Bare Đa Kao One: giường bên khung kính có hàng trúc, vách kính phòng tắm và bàn ăn nhỏ phía sau",
    crop: { card: "45% 50%", mobile: "40% 50%", tablet: "45% 50%", desktop: "50% 55%" },
  },
  {
    n: 7, key: "sel-07-bare-da-kao-two", file: "07_bare-da-kao-two.jpg", originalFilename: "Bare ĐaKao_30 (7).jpg", bytes: 422511,
    sha256: "02a67f8718164f9f5340ceaf83d3d8685395db07ac63f0677adc61f5cd80597d",
    propertyId: "bare-da-kao", roomId: "bare-da-kao-two", room: "Bare Đa Kao Two",
    alt: "Bare Đa Kao Two: giường và ghế ngồi dài bọc nệm xám, bàn tròn bên ô cửa kính khối",
    crop: { card: "50% 50%", mobile: "50% 50%", tablet: "50% 50%", desktop: "50% 60%" },
  },
  {
    n: 8, key: "sel-08-bare-da-kao-three", file: "08_bare-da-kao-three.jpg", originalFilename: "Bare ĐaKao_29 (8).jpg", bytes: 459934,
    sha256: "d4772a86d3fc8d96dfe141608bcaeec0f784b10c51e28284c205de033d3c1cf3",
    propertyId: "bare-da-kao", roomId: "bare-da-kao-three", room: "Bare Đa Kao Three",
    alt: "Bare Đa Kao Three: góc bếp tủ tối màu, bàn tròn và ghế ngồi dài dưới cửa sổ kính khối",
    crop: { card: "55% 50%", mobile: "55% 50%", tablet: "55% 50%", desktop: "50% 55%" },
  },
  {
    n: 9, key: "sel-09-bare-da-kao-four", file: "09_bare-da-kao-four.jpg", originalFilename: "Bare ĐaKao_30 (2).jpg", bytes: 480808,
    sha256: "b44c5c86d85837c7e0a4110e1f509736f786e2cc22728689a5a7c91096b8d671",
    propertyId: "bare-da-kao", roomId: "bare-da-kao-four", room: "Bare Đa Kao Four",
    alt: "Bare Đa Kao Four: ghế sofa và bàn trước cửa kính mở ra ban công cây xanh, tủ treo đồ khung đồng",
    crop: { card: "62% 50%", mobile: "64% 50%", tablet: "60% 50%", desktop: "50% 55%" },
  },
  {
    n: 10, key: "sel-10-bare-han-ground", file: "10_bare-han-ground.jpg", originalFilename: "45.jpg", bytes: 303379,
    sha256: "2e81655cc62c09f9fc51c34ea03a987ed410140ced985bb4775dcedcab28dc7f",
    propertyId: "bare-han", roomId: "bare-han-ground", room: "Bare Hàn Ground",
    alt: "Bare Hàn Ground: vòm gỗ, ghế ngồi dài bên giếng trời cây xanh và tủ quần áo xanh lá",
    crop: { card: "45% 50%", mobile: "45% 50%", tablet: "45% 50%", desktop: "50% 50%" },
  },
  {
    n: 11, key: "sel-11-bare-han-two", file: "11_bare-han-two.jpg", originalFilename: "67.jpg", bytes: 370286,
    sha256: "1fedac535e6c63c6879ddc2400b841535b28cb31e55e319e77a4de1e74672241",
    propertyId: "bare-han", roomId: "bare-han-two", room: "Bare Hàn Two",
    alt: "Bare Hàn Two: giường gối xanh, kệ bếp gỗ có đèn, ghế bành vàng và bàn tròn bên cửa kính",
    crop: { card: "62% 50%", mobile: "64% 50%", tablet: "58% 50%", desktop: "50% 55%" },
  },
  {
    n: 12, key: "sel-12-bare-han-three", file: "12_bare-han-three.jpg", originalFilename: "83.jpg", bytes: 387037,
    sha256: "ef01c6fa2a99d9e5d823f3b47b102515769958cce9501a8d3505c0d6e98d2556",
    propertyId: "bare-han", roomId: "bare-han-three", room: "Bare Hàn Three",
    alt: "Bare Hàn Three: quầy bếp khung gỗ với kệ đèn, bàn làm việc và cây xanh bên cửa kính",
    crop: { card: "50% 50%", mobile: "50% 50%", tablet: "50% 50%", desktop: "50% 50%" },
  },
  {
    n: 13, key: "sel-13-the-nang-pale-blue-eyes", file: "13_the-nang-pale-blue-eyes.png", originalFilename: "8.png", bytes: 4958181,
    sha256: "4e1c9a7d1fcd5e314c2703ddcc332b3c3103dae586280c21f56a693458aa9636",
    propertyId: "the-nang-suites", roomId: "pale-blue-eyes", room: "Pale Blue Eyes",
    alt: "Pale Blue Eyes: ghế bành và bàn tròn trước cửa kính ra ban công, góc bếp ốp gỗ và giường phía trước",
    crop: { card: "52% 50%", mobile: "52% 50%", tablet: "50% 50%", desktop: "50% 55%" },
  },
  {
    n: 14, key: "sel-14-the-nang-blue-moon", file: "14_the-nang-blue-moon.png", originalFilename: "18.png", bytes: 5512612,
    sha256: "4e3ebb678f832d82f898f0bd78a95253227897b30a3b7b615cc4797eaa88e175",
    propertyId: "the-nang-suites", roomId: "blue-moon", room: "Blue Moon",
    alt: "Blue Moon: bồn tắm, gương trang trí trên vách gỗ và cửa ra ban công",
    crop: { card: "50% 50%", mobile: "50% 50%", tablet: "50% 50%", desktop: "50% 55%" },
    replaces: "nang-blue-moon-18",
  },
  {
    n: 15, key: "sel-15-pepper-house-3rd-floor-a", file: "15_pepper-house-3rd-floor-a.jpg", originalFilename: "08.jpg", bytes: 718536,
    sha256: "c249216226fae31ac8951c288fe12f245e0c3d3e71e00710c32340867801a227",
    propertyId: "pepper-house", roomId: "pepper-house-3rd-floor", room: "Pepper House 3rd Floor",
    alt: "Pepper House 3rd Floor: kệ gỗ có đèn với tranh và sách, hành lang dẫn tới cửa kính cuối phòng",
    crop: { card: "50% 50%", mobile: "55% 50%", tablet: "50% 50%", desktop: "50% 50%" },
  },
  {
    n: 16, key: "sel-16-pepper-house-3rd-floor-b", file: "16_pepper-house-3rd-floor-b.jpg", originalFilename: "01.jpg", bytes: 641647,
    sha256: "bf72e80ecd0fce0cb3bc737e9d11ede69e29731c385d315002f70849fc13867d",
    propertyId: "pepper-house", roomId: "pepper-house-3rd-floor", room: "Pepper House 3rd Floor",
    alt: "Pepper House 3rd Floor: sofa xanh, bàn gỗ tròn và bàn làm việc trước cửa kính nhìn ra cây xanh",
    crop: { card: "50% 50%", mobile: "50% 50%", tablet: "50% 50%", desktop: "50% 55%" },
  },
  {
    n: 17, key: "sel-17-pepper-house-4th-floor", file: "17_pepper-house-4th-floor.jpg", originalFilename: "pepperhouse-74.jpg", bytes: 591707,
    sha256: "e704bdb4bacae8442d8b40f2771b748d1df88e6028d77b7cac37dc86de280940",
    propertyId: "pepper-house", roomId: "pepper-house-4th-floor", room: "Pepper House 4th Floor",
    alt: "Pepper House 4th Floor: giường trắng, sofa da cam, bàn làm việc và tủ quần áo khung kính",
    crop: { card: "40% 50%", mobile: "36% 50%", tablet: "45% 50%", desktop: "50% 60%" },
  },
];

/** Homepage hero: one photograph per property, in this order (owner brief, 26/10). */
export const HERO_SELECTION: readonly number[] = [1, 5, 9, 11, 13, 17];

/** Each property's representative photograph: card cover, thumbnail, preview. */
export const PROPERTY_COVER: Readonly<Record<string, number>> = {
  "bare-chic": 1,
  "bare-hyphen": 5,
  "bare-da-kao": 9,
  "bare-han": 11,
  "the-nang-suites": 13,
  "pepper-house": 17,
};

export const selectionImage = (n: number): SelectionImage | undefined => SELECTION.find((image) => image.n === n);

/**
 * Room-card covers chosen by the owner after the selection (4/11/2026): the photograph that leads the room's OWN
 * photographs (room card, its viewer and drawer). The property gallery and hero keep the selection order, and the
 * replaced cover stays in the room's photographs. Pepper House 3rd-floor: 02.jpg (whole bedroom, window and depth)
 * instead of 08.jpg (a shelf detail), after the 3-image visual audit in docs/qa/hybrid-booking-v1.1-final-2026-11-04.
 */
export const ROOM_COVER_OVERRIDES: Readonly<Record<string, string>> = {
  "pepper-house-3rd-floor": "pepper-house-3rd-floor-02",
};

/** `keys` with the room's chosen cover moved to the front, when that photograph is among them; otherwise unchanged. */
export function withRoomCover(keys: readonly string[], roomIdOrName: string): string[] {
  const cover = ROOM_COVER_OVERRIDES[slug(roomIdOrName)];
  if (!cover || !keys.includes(cover)) return [...keys];
  return [cover, ...keys.filter((key) => key !== cover)];
}

/** Whether a selected photograph may be shown at all (no hold). */
export const isShowable = (image: SelectionImage) => !image.hold;

/** The selected photographs of one room, cover first, holds included (callers drop what they cannot show). */
export const selectionForRoom = (roomIdOrName: string): readonly SelectionImage[] => {
  const id = slug(roomIdOrName);
  return SELECTION.filter((image) => image.roomId === id);
};

/** Property gallery grouping: the selected photographs of a property, in the owner's order. */
export const selectionForProperty = (propertyId: string): readonly SelectionImage[] => SELECTION.filter((image) => image.propertyId === propertyId);

/**
 * A room's photograph keys with its selected photographs first (the first is the room's cover),
 * then its existing gallery without older copies of those same photographs. Only selected
 * photographs that are showable and `available` on this machine take part, so without them the
 * room keeps exactly the gallery it had.
 */
export function withSelectedFirst(existing: readonly string[], roomIdOrName: string, available: (key: string) => boolean): string[] {
  const selected = selectionForRoom(roomIdOrName).filter((image) => isShowable(image) && available(image.key));
  const skip = new Set(selected.flatMap((image) => [image.key, ...(image.replaces ? [image.replaces] : [])]));
  return [...selected.map((image) => image.key), ...existing.filter((key) => !skip.has(key))];
}
