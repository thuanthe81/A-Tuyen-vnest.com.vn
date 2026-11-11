import { FRAMES_LF, type Frame, type Shot } from "../content";

/**
 * MEDIA REALITY CHECK (13/10/2026). The same Living Frames page with three third-party
 * stock assets in the first screen, to see whether the composition holds with photographic
 * and filmed material. For private local review only.
 *
 * NONE OF THIS IS VNEST. The clip and the two photographs are from Pexels, shot in other
 * people's premises; their sources, creators, licence and restrictions are recorded in
 * public/dev-fixtures/stock-test/SOURCES.md. Every place they appear says they are
 * reference pictures. Only the three approved assets are used: the frames further down the
 * page, and the rest of the gallery, are still the drawings.
 */

/** "a" is the sheet as designed. "b" gives the two still frames more of it from 768px. */
export type Geometry = "a" | "b";

export interface StockPhoto {
  /** Path without the width and extension: files are `${base}-${width}.{avif,webp,jpg}`. */
  base: string;
  widths: readonly number[];
  /** The largest rendition, for the picture's own proportions. */
  width: number;
  height: number;
  /** Where the subject is, so a frame of another shape crops towards it. */
  focus: string;
  alt: string;
  credit: string;
}

const DIR = "/dev-fixtures/stock-test";
const REFERENCE = "Ảnh tham khảo, không phải cơ sở VNest";

/** Keyed by scene: a shot whose scene is here is drawn from these files, not from the drawings. */
export const STOCK_PHOTOS: Readonly<Record<string, StockPhoto>> = {
  "stock-room": { base: `${DIR}/v1-room-poster`, widths: [640, 960, 1280, 1920], width: 1920, height: 1080, focus: "50% 50%", alt: `${REFERENCE}: phòng ngủ có cửa mở ra ban công`, credit: "Cá Bảo, Pexels" },
  "stock-facade": { base: `${DIR}/p1-facade`, widths: [240, 360, 480, 720, 1200], width: 1200, height: 1800, focus: "50% 18%", alt: `${REFERENCE}: nhà phố hẹp nhiều tầng, ban công có giàn hoa giấy`, credit: "Theodore Nguyen, Pexels" },
  "stock-detail": { base: `${DIR}/p4-detail`, widths: [240, 360, 480, 720, 1200], width: 1200, height: 1800, focus: "50% 16%", alt: `${REFERENCE}: đèn tường đan mây phía trên đầu giường`, credit: "Marion Batteur, Pexels" },
};

/** 01 moves and shows the room; 02 is the building from outside; 03 is one close detail. */
export const SHOWCASE_STOCK: Frame = { scene: "stock-room", title: "Phòng (khung đầu của thước phim)", side: "Phòng", chapter: "stay", orientation: "l" };

export const FRAMES_STOCK: readonly Frame[] = [
  { scene: "stock-facade", title: "Kiến trúc", side: "Kiến trúc", chapter: "stay", orientation: "p" },
  { scene: "stock-detail", title: "Chi tiết", side: "Chi tiết", chapter: "stay", orientation: "p" },
  FRAMES_LF[2]!,
  FRAMES_LF[3]!,
];

/** The gallery keeps its seven places: three reference pictures, then four of the drawings. */
export const SHOTS_STOCK: readonly Shot[] = [SHOWCASE_STOCK, ...FRAMES_STOCK, { scene: "cafe", title: "Quán cà phê gần đây", chapter: "around" }, { scene: "rooftop", title: "Sân thượng", chapter: "stay" }];

/** Five seconds, one camera move, no sound. Played once; it rests on its last frame. */
export const STOCK_CLIP = { wide: `${DIR}/v1-room-1280.mp4`, small: `${DIR}/v1-room-960.mp4` } as const;

/** The clip's first frame at 32 by 18 pixels. */
export const STOCK_PREVIEW =
  "data:image/webp;base64,UklGRtoAAABXRUJQVlA4IM4AAADwBACdASogABIAPtFaqE4oJSQiKAqpABoJYwDA3Ax2MgFeAJnKsARI+TBzeUntUQAA/QNZFdhwL8FLz+3b9/fGvGNT9M9gQZVNOfZ9LKZs8m/iidmnTUQoQFRShUp35RQQXbP6+TiEaDDfdkMKI3ERXsIJDTfMTlrFAI/O+QgFCte4/BV4JYMXURpxBjvCuW7ehqRRuEIv/cN+EVTf+A/Yzo3rgFvyVtOyW46xzVjfxBa0s6IZn3QuuSoFCAVjdAK1eGxTnJgaSJbcAAAAAA==";

export const STOCK_COPY = {
  /** On the showcase, where there is room to say it whole. */
  chip: "Ảnh tham khảo · không phải VNest",
  /** On a small frame. */
  mark: "Tham khảo",
  notice: REFERENCE,
  noticeMore: " · nguồn Pexels, chỉ xem nội bộ",
  caption: (credit: string) => `Ảnh tham khảo, không phải VNest (${credit})`,
} as const;
