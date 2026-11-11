/**
 * MOCK CONTENT for the property-gallery design exploration. Nothing here describes a real
 * VNest property: the name and area are the neutral sample record's, the statement and the
 * captions are placeholder wording, and every picture is a drawn stand-in from
 * public/dev-fixtures/exploration with "ẢNH MẪU · KHÔNG PHẢI HÌNH ẢNH VNEST" inside it.
 *
 * A caption names what the stand-in drawing shows. It does not claim a real property has
 * that space, and the places "around" are not real places.
 */

/** "c" is the daylight set again, with a small disclosure line inside each picture where "a" has a large one. */
export type Concept = "a" | "b" | "c";
export type Orientation = "p" | "l";

export interface Shot {
  /** The drawing: one file per concept palette and orientation. */
  scene: string;
  title: string;
  /** "stay" is the property itself; "around" is the neighbourhood. */
  chapter: "stay" | "around";
}

export const PROPERTY = {
  area: "Địa điểm mẫu 1",
  name: "Cơ sở mẫu A",
  statement: "Dòng tuyên ngôn mẫu: một câu ngắn nói lên tính cách riêng của nơi này.",
  summary: "Đoạn dẫn mẫu, dùng để xem nhịp chữ bên cạnh hình ảnh. Không mô tả cơ sở thật nào.",
} as const;

/** Concept A: an ordered set of plates. The first five are composed on the page; the rest are in the viewer. */
export const SHOTS_A: readonly Shot[] = [
  { scene: "facade", title: "Mặt đứng", chapter: "stay" },
  { scene: "lobby", title: "Sảnh chung", chapter: "stay" },
  { scene: "room", title: "Phòng ngủ", chapter: "stay" },
  { scene: "stair", title: "Cầu thang", chapter: "stay" },
  { scene: "detail", title: "Chi tiết vật liệu", chapter: "stay" },
  { scene: "rooftop", title: "Sân thượng", chapter: "stay" },
  { scene: "street", title: "Con phố phía trước", chapter: "around" },
  { scene: "cafe", title: "Quán cà phê gần đây", chapter: "around" },
];

/**
 * B+: one hero, four pictures that each show a different side of the property, and three
 * more that are only in the full gallery. `aspect` and `note` exist for the four on the page.
 */
export interface Story extends Shot {
  /** What this picture is there to show. */
  aspect: string;
  note: string;
  orientation: Orientation;
}

export const HERO_BPLUS: Shot = { scene: "facade", title: "Mặt tiền", chapter: "stay" };

export const STORIES_BPLUS: readonly Story[] = [
  { scene: "lobby", title: "Không gian chung", aspect: "Không gian chung", note: "Chú thích mẫu: nơi khách gặp nhau.", chapter: "stay", orientation: "l" },
  { scene: "room", title: "Phòng ngủ", aspect: "Phòng ngủ", note: "Chú thích mẫu: nơi khách nghỉ.", chapter: "stay", orientation: "p" },
  { scene: "rooftop", title: "Tầng thượng", aspect: "Tầng thượng", note: "Chú thích mẫu: nơi ngắm chiều.", chapter: "stay", orientation: "p" },
  { scene: "street", title: "Con phố bên ngoài", aspect: "Con phố bên ngoài", note: "Chú thích mẫu: bước ra là tới.", chapter: "around", orientation: "l" },
];

const MORE_BPLUS: readonly Shot[] = [
  { scene: "stair", title: "Cầu thang", chapter: "stay" },
  { scene: "cafe", title: "Quán cà phê gần đây", chapter: "around" },
  { scene: "river", title: "Bờ sông", chapter: "around" },
];

/** The complete gallery, in the order the viewer shows it: the hero, the four stories, then the rest. */
export const SHOTS_BPLUS: readonly Shot[] = [HERO_BPLUS, ...STORIES_BPLUS, ...MORE_BPLUS];

/**
 * The way into amenities and nearby, for the transition sketch only. The icon keys are from
 * the content model's fixed list (AMENITY_ICONS) and the categories from NearbyCategory;
 * the labels are placeholders, as in the sample records. No amenity or place is claimed.
 */
export const AMENITY_PREVIEW = [
  { icon: "wifi", label: "Tiện nghi mẫu 1" },
  { icon: "air-conditioning", label: "Tiện nghi mẫu 2" },
  { icon: "kitchen", label: "Tiện nghi mẫu 3" },
  { icon: "laundry", label: "Tiện nghi mẫu 4" },
  { icon: "workspace", label: "Tiện nghi mẫu 5" },
  { icon: "garden", label: "Tiện nghi mẫu 6" },
] as const;

export const NEARBY_PREVIEW = [
  { icon: "food-drink", label: "Ăn uống" },
  { icon: "culture", label: "Văn hoá" },
  { icon: "nature", label: "Thiên nhiên" },
  { icon: "transport", label: "Di chuyển" },
] as const;

/**
 * LIVING FRAMES prototype, as refined on 12/10/2026: five frames, one for each side of a
 * property a guest weighs up. `side` is an editorial label for the frame's job in the page,
 * not a fact about a property; a real record would need to say which picture plays which
 * part. No hour is printed on any frame.
 */
export interface Frame extends Shot {
  side: string;
  orientation: Orientation;
}

/** 01, the one frame that moves. The poster is the clip's first frame. */
export const SHOWCASE_LF: Frame = { scene: "rooftop", title: "Không khí (khung đầu của thước phim)", side: "Không khí", chapter: "stay", orientation: "l" };

/** 02 and 03 stand beside the showcase; 04 and 05 open the two sections that follow. */
export const FRAMES_LF: readonly Frame[] = [
  { scene: "facade", title: "Kiến trúc", side: "Kiến trúc", chapter: "stay", orientation: "p" },
  { scene: "room", title: "Phòng", side: "Phòng", chapter: "stay", orientation: "p" },
  { scene: "lobby", title: "Sinh hoạt chung", side: "Sinh hoạt chung", chapter: "stay", orientation: "l" },
  { scene: "street", title: "Khu phố", side: "Khu phố", chapter: "around", orientation: "l" },
];

/** The complete gallery, in the order the viewer shows it. */
export const SHOTS_LF: readonly Shot[] = [SHOWCASE_LF, ...FRAMES_LF, { scene: "cafe", title: "Quán cà phê gần đây", chapter: "around" }, { scene: "detail", title: "Chi tiết", chapter: "stay" }];

/**
 * The placeholder clip: made from three of the drawings, not footage. One cut, in two sizes:
 * a phone is given the small file.
 */
export const SHOWCASE_CLIP = { wide: "/dev-fixtures/exploration/lf-showcase-l.mp4", small: "/dev-fixtures/exploration/lf-showcase-s.mp4" } as const;

/** The poster at 32 by 18 pixels, in the page itself: what the frame shows until the poster arrives. */
export const SHOWCASE_PREVIEW =
  "data:image/webp;base64,UklGRnICAABXRUJQVlA4WAoAAAAgAAAAHwAAEQAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDgghAAAAHAEAJ0BKiAAEgA+rUabSaYjoqEwDADAFYlnAMzUdpC/0m4XAo7GCQdrRt9AAP7vto7L2KnlQB80eZ4hgd1udUzeSIb2qZZ0E5xVxbnYxRLofiN4ycdDkAhDmrKFFPWGIey8KLGUb203U09/b6lG9qha3MDWQVBV9GOtYeSnbcGLPcAAAA==";

/** The first Concept B, kept at /dev/property-gallery/b-original: one continuous reel that leaves the building half way through. */
export const SHOTS_B: readonly Shot[] = [
  { scene: "facade", title: "Về tới nơi", chapter: "stay" },
  { scene: "lobby", title: "Sảnh chung", chapter: "stay" },
  { scene: "room", title: "Phòng ngủ", chapter: "stay" },
  { scene: "rooftop", title: "Sân thượng lúc chiều", chapter: "stay" },
  { scene: "street", title: "Bước ra phố", chapter: "around" },
  { scene: "cafe", title: "Cà phê buổi sáng", chapter: "around" },
  { scene: "market", title: "Bữa trưa ở chợ", chapter: "around" },
  { scene: "river", title: "Đi bộ ven sông", chapter: "around" },
];

export const AMENITIES = Array.from({ length: 6 }, (_, index) => `Tiện nghi mẫu ${index + 1}`);

export const COPY = {
  cta: "Xem phòng trống",
  gallery: "Thư viện ảnh",
  standIn: "Ảnh mẫu",
  allPhotos: (count: number) => `Tất cả ${count} ảnh`,
  viewPhotos: (count: number) => `Xem ${count} ảnh`,
  viewAllPhotos: (count: number) => `Xem tất cả ${count} ảnh`,
  tour: "Một vòng quanh nơi này",
  showcase: "Thước phim giới thiệu",
  pauseVideo: "Tạm dừng thước phim",
  playVideo: "Phát thước phim",
  replayVideo: "Phát lại thước phim",
  illustration: "Minh hoạ",
  photos: (count: number) => `${count} ảnh`,
  yourStay: "Kỳ nghỉ của bạn",
  noDates: "Chưa chọn ngày",
  chooseRoom: "Chọn phòng",
  seeRooms: "Xem phòng và giá",
  nearby: "Quanh đây",
  openPhoto: (index: number, title: string) => `Mở ảnh ${index + 1}: ${title}`,
  goToPhoto: (index: number, title: string) => `Ảnh ${index + 1}: ${title}`,
  close: "Đóng",
  previous: "Ảnh trước",
  next: "Ảnh sau",
  amenities: "Tiện nghi",
  stay: "Chỗ ở",
  around: "Quanh đây",
} as const;

export const SIZE: Record<Orientation, { width: number; height: number }> = { p: { width: 1200, height: 1500 }, l: { width: 2000, height: 1125 } };

export function shotSrc(concept: Concept, scene: string, orientation: Orientation): string {
  return `/dev-fixtures/exploration/${concept}-${scene}-${orientation}.svg`;
}

export function shotAlt(shot: Shot): string {
  return `Ảnh minh hoạ mẫu: ${shot.title.toLowerCase()}`;
}

export const pad = (value: number) => String(value).padStart(2, "0");
