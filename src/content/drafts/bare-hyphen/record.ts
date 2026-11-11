/**
 * BARE HYPHEN, DRAFT PROPERTY RECORD (VNest V3 Property Photography & Page Completion, 30/10/2026).
 *
 * Built from the 20/10/2026 workbook (`VNest_Informationv2.xlsx`, rows 8–11), the 15/10/2026
 * room sheet (confirmed by VNest's admin on 21/10/2026, R3 owner rule 25/10/2026), and the
 * authorised local photographs from `/Users/noe/Documents/VNest Media/Bare/Bare Hyphen` plus the
 * 26/10/2026 owner selection (`sel-04-bare-hyphen-one`, `sel-05-bare-hyphen-two`).
 *
 * Rooms (4 separate physical units):
 *   1. Bare Hyphen One   — Studio · 18 m² · 2 người lớn (row 8: D8, E8, F4:F25)
 *   2. Bare Hyphen Two   — Studio · 18 m² · 2 người lớn (row 9: D9, E9, F4:F25)
 *   3. Bare Hyphen Three — Studio · 18 m² · 2 người lớn (row 10: D10, E10, F4:F25)
 *   4. Bare Hyphen Four  — Duplex studio · 30 m² · 2 người lớn (row 11: D11, E11, F4:F25)
 *
 * Owner Clarification (30/10/2026 — Shared `Bare/Bare Hyphen/one - three` Photography):
 * - The folder `Bare/Bare Hyphen/one - three` (36 eligible, person-free photographs) is intentionally
 *   a shared photography collection for `Bare Hyphen One` and `Bare Hyphen Three`.
 * - Both `Bare Hyphen One` and `Bare Hyphen Three` remain two separate room listings (with separate
 *   room IDs, cards, detail drawers, booking selection actions, metadata, and preference slots) and
 *   both reference all 36 shared physical image assets without duplicating binary files on disk.
 * - `Bare Hyphen One` preserves its approved selection cover `sel-04-bare-hyphen-one` (`a-6.jpg`)
 *   and curated ordering; `Bare Hyphen Three` uses `bare-hyphen` (`a-16.jpg`, workbook-listed wide
 *   bedroom & arched balcony doors view) as its cover with a distinct curatorial ordering.
 * - Gallery counting distinguishes:
 *   - Unique physical image assets on the property: 104 (36 shared One & Three + 20 Two + 26 Four + 7 Exterior + 15 Common Space)
 *   - Images referenced by each room gallery: One = 36, Two = 20, Three = 36, Four = 26.
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

export const BARE_HYPHEN_ONE_THREE_SOURCE_FOLDER = "Bare/Bare Hyphen/one - three" as const;

/**
 * The 36 unique physical image assets in `Bare/Bare Hyphen/one - three`, shared between
 * `Bare Hyphen One` and `Bare Hyphen Three` without duplicating binary files.
 */
export const BARE_HYPHEN_ONE_THREE_SHARED_ASSETS: readonly {
  file: string;
  manifestKey: string;
  description: string;
}[] = [
  { file: "a-6.jpg", manifestKey: "sel-04-bare-hyphen-one", description: "giường với gối hoạ tiết lá trước tường xanh đậm, tủ gỗ sáng và cây xanh bên cửa" },
  { file: "a-16.jpg", manifestKey: "bare-hyphen", description: "toàn cảnh giường ngủ nhìn ra hệ cửa gỗ vòm có ô kính tròn, bàn ăn và góc bếp ấm cúng" },
  { file: "a-21.jpg", manifestKey: "bare-hyphen-one-three-a-21", description: "góc nhìn chính diện giường ngủ trước mảng tường xanh trầm, đèn thả ấm và hệ tủ gỗ" },
  { file: "a-10.jpg", manifestKey: "bare-hyphen-one-three-a-10", description: "góc bếp tiện nghi và bàn ăn tròn bên khung cửa gỗ vòm có ô kính tròn đặc trưng" },
  { file: "a-26.jpg", manifestKey: "bare-hyphen-one-three-a-26", description: "không gian phòng nhìn từ giường ngủ về phía hệ tủ quần áo, khu vực lavabo và bàn ăn" },
  { file: "a-17.jpg", manifestKey: "bare-hyphen-one-three-a-17", description: "khu vực lavabo đá mài với gương tròn hắt sáng liền kề hệ tủ gỗ và giường ngủ" },
  { file: "a-25.jpg", manifestKey: "bare-hyphen-one-three-a-25", description: "không gian phòng ngủ ấm áp với rèm cửa lớn, đèn tường dịu nhẹ và kệ bếp gọn gàng" },
  { file: "a-14.jpg", manifestKey: "bare-hyphen-one-three-a-14", description: "bàn ăn tròn với ghế xanh đậm, kệ bếp và dãy cửa sổ gỗ đón ánh sáng tự nhiên" },
  { file: "a-28.jpg", manifestKey: "bare-hyphen-one-three-a-28", description: "góc nhìn rộng từ cuối giường qua mảng tường xanh, tủ quần áo gỗ và khu vực lavabo mở" },
  { file: "a-20.jpg", manifestKey: "bare-hyphen-one-three-a-20", description: "chi tiết khu vực lavabo đá mài, gương tròn hắt sáng và kệ gỗ trang trí" },
  { file: "a-11.jpg", manifestKey: "bare-hyphen-one-three-a-11", description: "ánh nắng tự nhiên chiếu qua hệ cửa gỗ vòm vào khu vực giường ngủ và góc bếp" },
  { file: "a-12.jpg", manifestKey: "bare-hyphen-one-three-a-12", description: "bàn trà tròn với ghế nệm xanh đậm bên cạnh tủ bếp gỗ và mặt bàn đá mài" },
  { file: "a-13.jpg", manifestKey: "bare-hyphen-one-three-a-13", description: "góc bàn ăn và khu vực bếp nhỏ với lò vi sóng, ấm đun và phụ kiện đồng bộ" },
  { file: "a-15.jpg", manifestKey: "bare-hyphen-one-three-a-15", description: "khung cửa sổ gỗ mở ra mảng xanh bên cạnh bàn ăn và khu vực bếp của căn Studio" },
  { file: "a-27.jpg", manifestKey: "bare-hyphen-one-three-a-27", description: "sự kết nối liền mạch giữa khu vực giường ngủ, hệ tủ gỗ và bàn ăn bên cửa sổ" },
  { file: "a-29.jpg", manifestKey: "bare-hyphen-one-three-a-29", description: "góc nhìn từ đầu giường hướng về phía cửa ra vào, lavabo mở và hệ tủ quần áo" },
  { file: "a-30.jpg", manifestKey: "bare-hyphen-one-three-a-30", description: "toàn cảnh hệ tủ gỗ sáng màu kết hợp kệ mở và gương tròn hắt sáng" },
  { file: "a-31.jpg", manifestKey: "bare-hyphen-one-three-a-31", description: "bố cục hài hoà giữa mảng tường xanh đậm, nội thất gỗ ấm và sàn gạch sáng" },
  { file: "a-22.jpg", manifestKey: "bare-hyphen-one-three-a-22", description: "giường ngủ đôi êm ái với gối hoạ tiết lá và tranh nghệ thuật trên nền tường xanh" },
  { file: "a-5.jpg", manifestKey: "bare-hyphen-one-three-a-5", description: "góc giường ngủ với ánh đèn vàng ấm áp, kệ đầu giường và tủ quần áo gỗ" },
  { file: "a-3.jpg", manifestKey: "bare-hyphen-one-three-a-3", description: "chi tiết đèn ngủ tròn trên bàn đầu giường dưới bức tranh hoạ tiết thực vật" },
  { file: "a-9.jpg", manifestKey: "bare-hyphen-one-three-a-9", description: "đèn thả đầu giường ánh vàng dịu bên cạnh gối tựa hoạ tiết lá nhiệt đới" },
  { file: "a-33.jpg", manifestKey: "bare-hyphen-one-three-a-33", description: "góc nhìn cận cảnh đầu giường, vách ngăn ốp gạch và kệ tiện ích" },
  { file: "a-7.jpg", manifestKey: "bare-hyphen-one-three-a-7", description: "hệ tủ quần áo gỗ hai cánh phối màu xanh - gỗ tự nhiên và kệ trang trí mở" },
  { file: "a-8.jpg", manifestKey: "bare-hyphen-one-three-a-8", description: "tủ gỗ lưu trữ tích hợp bàn phụ và lối đi dẫn ra cửa phòng" },
  { file: "a-23.jpg", manifestKey: "bare-hyphen-one-three-a-23", description: "chi tiết kệ gỗ trang trí với bình gốm, sách và đồ dùng tiếp khách" },
  { file: "a-24.jpg", manifestKey: "bare-hyphen-one-three-a-24", description: "góc kệ mở có đèn hắt sáng, sách đọc và khay trà đạo" },
  { file: "a-32.jpg", manifestKey: "bare-hyphen-one-three-a-32", description: "chi tiết mặt bếp và tường ốp đá terrazzo cùng bộ dụng cụ bếp gỗ" },
  { file: "a-18.jpg", manifestKey: "bare-hyphen-one-three-a-18", description: "khu vực lavabo đá mài nhìn từ góc nghiêng với gương tròn lớn và hệ tủ" },
  { file: "a-19.jpg", manifestKey: "bare-hyphen-one-three-a-19", description: "bồn rửa mặt đá terrazzo, gương tròn đôi và phụ kiện phòng tắm tinh tế" },
  { file: "a-34.jpg", manifestKey: "bare-hyphen-one-three-a-34", description: "chi tiết bồn rửa mặt đá mài và ánh sáng dịu từ gương tròn treo tường" },
  { file: "a-35.jpg", manifestKey: "bare-hyphen-one-three-a-35", description: "mặt bàn lavabo terrazzo, vòi nước hiện đại và gương tròn phản chiếu ánh sáng" },
  { file: "a-36.jpg", manifestKey: "bare-hyphen-one-three-a-36", description: "góc cận cảnh lavabo đá mài và tường ốp gạch sáng màu" },
  { file: "a-4.jpg", manifestKey: "bare-hyphen-one-three-a-4", description: "hoàn thiện đá terrazzo và gương tròn hắt sáng tại khu vực vệ sinh cá nhân" },
  { file: "a-2.jpg", manifestKey: "bare-hyphen-one-three-a-2", description: "buồng tắm đứng vách kính với vòi sen và tường ốp gạch xám nhạt" },
  { file: "a.jpg", manifestKey: "bare-hyphen-one-three-a", description: "khu vực tắm vòi sen riêng biệt ốp gạch sạch sẽ sau vách kính" },
];

const SHARED_ASSET_BY_FILE = new Map(BARE_HYPHEN_ONE_THREE_SHARED_ASSETS.map((a) => [a.file, a]));

/**
 * Curated ordering of the 36 shared photographs for `Bare Hyphen One`:
 * Starts with approved cover `a-6.jpg` (`sel-04-bare-hyphen-one`, placed first by `withSelectedFirst`),
 * followed by `a-21.jpg`, `a-10.jpg`, `a-26.jpg`, `a-17.jpg`, `a-16.jpg` (`bare-hyphen`), and the remaining 30 photos.
 */
const BARE_HYPHEN_ONE_FILE_ORDER: readonly string[] = [
  "a-21.jpg",
  "a-10.jpg",
  "a-26.jpg",
  "a-17.jpg",
  "a-16.jpg",
  "a-25.jpg",
  "a-11.jpg",
  "a-14.jpg",
  "a-12.jpg",
  "a-13.jpg",
  "a-15.jpg",
  "a-27.jpg",
  "a-28.jpg",
  "a-29.jpg",
  "a-30.jpg",
  "a-31.jpg",
  "a-22.jpg",
  "a-5.jpg",
  "a-3.jpg",
  "a-9.jpg",
  "a-33.jpg",
  "a-7.jpg",
  "a-8.jpg",
  "a-23.jpg",
  "a-24.jpg",
  "a-32.jpg",
  "a-18.jpg",
  "a-19.jpg",
  "a-20.jpg",
  "a-34.jpg",
  "a-35.jpg",
  "a-36.jpg",
  "a-4.jpg",
  "a-2.jpg",
  "a.jpg",
];

/**
 * Curated ordering of the 36 shared photographs for `Bare Hyphen Three`:
 * Uses `a-16.jpg` (`bare-hyphen` — wide view across the bed toward the arched wooden balcony doors)
 * as its distinct room cover, followed by `a-25.jpg`, `a-14.jpg`, `a-28.jpg`, `a-20.jpg`, `a-6.jpg`,
 * and the remaining 30 shared photographs.
 */
const BARE_HYPHEN_THREE_FILE_ORDER: readonly string[] = [
  "a-16.jpg",
  "a-25.jpg",
  "a-14.jpg",
  "a-28.jpg",
  "a-20.jpg",
  "a-6.jpg",
  "a-11.jpg",
  "a-21.jpg",
  "a-10.jpg",
  "a-17.jpg",
  "a-26.jpg",
  "a-27.jpg",
  "a-29.jpg",
  "a-30.jpg",
  "a-31.jpg",
  "a-12.jpg",
  "a-13.jpg",
  "a-15.jpg",
  "a-22.jpg",
  "a-5.jpg",
  "a-3.jpg",
  "a-9.jpg",
  "a-33.jpg",
  "a-7.jpg",
  "a-8.jpg",
  "a-23.jpg",
  "a-24.jpg",
  "a-32.jpg",
  "a-18.jpg",
  "a-19.jpg",
  "a-34.jpg",
  "a-35.jpg",
  "a-36.jpg",
  "a-4.jpg",
  "a-2.jpg",
  "a.jpg",
];

function buildSharedRoomSpecs(
  roomName: "Bare Hyphen One" | "Bare Hyphen Three",
  prefix: "bare-hyphen-one" | "bare-hyphen-three",
  files: readonly string[],
): ImageSpec[] {
  return files.map((file) => {
    const asset = SHARED_ASSET_BY_FILE.get(file);
    if (!asset) throw new Error(`Unknown Bare Hyphen shared file: ${file}`);
    const stem = file.replace(".jpg", "");
    return {
      id: `${prefix}-${stem}`,
      manifestKey: asset.manifestKey,
      room: roomName,
      alt: `${roomName}: ${asset.description}`,
    };
  });
}

const BARE_HYPHEN_ONE_SPECS = buildSharedRoomSpecs("Bare Hyphen One", "bare-hyphen-one", BARE_HYPHEN_ONE_FILE_ORDER);
const BARE_HYPHEN_THREE_SPECS = buildSharedRoomSpecs("Bare Hyphen Three", "bare-hyphen-three", BARE_HYPHEN_THREE_FILE_ORDER);

export const BARE_HYPHEN_IMAGES: readonly ImageSpec[] = [
  // Bare Hyphen One (35 photos after cover sel-04-bare-hyphen-one / a-6.jpg = 36 total)
  ...BARE_HYPHEN_ONE_SPECS,
  // Bare Hyphen Two (19 photos after cover sel-05-bare-hyphen-two / a-74.jpg = 20 total)
  { id: "bare-hyphen-two-a-60", manifestKey: "bare-hyphen-two-a-60", room: "Bare Hyphen Two", alt: "Bare Hyphen Two: toàn cảnh giường ngủ, mảng tường xanh đậm và bàn trà bên cửa sổ" },
  { id: "bare-hyphen-two-a-64", manifestKey: "bare-hyphen-two-a-64", room: "Bare Hyphen Two", alt: "Bare Hyphen Two: góc bếp tiện nghi với kệ gỗ hắt sáng, bồn rửa và mặt bàn đá mài" },
  { id: "bare-hyphen-two-a-71", manifestKey: "bare-hyphen-two-a-71", room: "Bare Hyphen Two", alt: "Bare Hyphen Two: từ góc bếp nhìn ra giường ngủ, tủ gỗ và khung cửa sổ thoáng đãng" },
  { id: "bare-hyphen-two-a-55", manifestKey: "bare-hyphen-two-a-55", room: "Bare Hyphen Two", alt: "Bare Hyphen Two: lối vào phòng qua cửa gỗ tròn và góc nhìn vào khu vực nghỉ ngơi" },
  { id: "bare-hyphen-two-a-68", manifestKey: "bare-hyphen-two-a-68", room: "Bare Hyphen Two", alt: "Bare Hyphen Two: phòng tắm riêng ốp đá mài với lavabo, gương tròn và vách kính" },
  { id: "bare-hyphen-two-a-56", manifestKey: "bare-hyphen-two-a-56", room: "Bare Hyphen Two", alt: "Bare Hyphen Two: chi tiết cửa gỗ có ô kính tròn và tay nắm đồng đặc trưng" },
  { id: "bare-hyphen-two-a-57", manifestKey: "bare-hyphen-two-a-57", room: "Bare Hyphen Two", alt: "Bare Hyphen Two: góc ngồi thư giãn với ghế gỗ, bàn tròn và ánh sáng tự nhiên" },
  { id: "bare-hyphen-two-a-58", manifestKey: "bare-hyphen-two-a-58", room: "Bare Hyphen Two", alt: "Bare Hyphen Two: chi tiết bàn trà, bình gốm và rèm cửa đón nắng" },
  { id: "bare-hyphen-two-a-75", manifestKey: "bare-hyphen-two-a-75", room: "Bare Hyphen Two", alt: "Bare Hyphen Two: giường ngủ với gối hoạ tiết lá và đèn ngủ ấm áp" },
  { id: "bare-hyphen-two-a-61", manifestKey: "bare-hyphen-two-a-61", room: "Bare Hyphen Two", alt: "Bare Hyphen Two: góc nhìn chính diện giường ngủ trước mảng tường xanh trầm" },
  { id: "bare-hyphen-two-a-62", manifestKey: "bare-hyphen-two-a-62", room: "Bare Hyphen Two", alt: "Bare Hyphen Two: chi tiết đầu giường gỗ, đèn tường và tranh trang trí" },
  { id: "bare-hyphen-two-a-63", manifestKey: "bare-hyphen-two-a-63", room: "Bare Hyphen Two", alt: "Bare Hyphen Two: hệ tủ quần áo gỗ kết hợp kệ tivi và bàn làm việc" },
  { id: "bare-hyphen-two-a-65", manifestKey: "bare-hyphen-two-a-65", room: "Bare Hyphen Two", alt: "Bare Hyphen Two: chi tiết kệ bếp gỗ, ấm đun nước và bộ ly tách gốm" },
  { id: "bare-hyphen-two-a-66", manifestKey: "bare-hyphen-two-a-66", room: "Bare Hyphen Two", alt: "Bare Hyphen Two: khu vực bếp nhỏ gọn gàng liền kề lối vào phòng tắm" },
  { id: "bare-hyphen-two-a-67", manifestKey: "bare-hyphen-two-a-67", room: "Bare Hyphen Two", alt: "Bare Hyphen Two: cửa vòm dẫn vào khu vực lavabo và phòng tắm riêng" },
  { id: "bare-hyphen-two-a-69", manifestKey: "bare-hyphen-two-a-69", room: "Bare Hyphen Two", alt: "Bare Hyphen Two: khu vực tắm vòi sen và hoàn thiện đá mài kết hợp inox màu champagne" },
  { id: "bare-hyphen-two-a-70", manifestKey: "bare-hyphen-two-a-70", room: "Bare Hyphen Two", alt: "Bare Hyphen Two: chi tiết bồn rửa mặt và gương trang trí trong phòng tắm" },
  { id: "bare-hyphen-two-a-72", manifestKey: "bare-hyphen-two-a-72", room: "Bare Hyphen Two", alt: "Bare Hyphen Two: góc nhìn từ đầu giường hướng ra tivi treo tường và kệ bếp" },
  { id: "bare-hyphen-two-a-73", manifestKey: "bare-hyphen-two-a-73", room: "Bare Hyphen Two", alt: "Bare Hyphen Two: sự kết nối mềm mại giữa nội thất gỗ, đá mài và ánh sáng ấm" },
  // Bare Hyphen Three (all 36 shared photos from Bare/Bare Hyphen/one - three, led by distinct cover a-16.jpg)
  ...BARE_HYPHEN_THREE_SPECS,
  // Bare Hyphen Four (all 26 photos from Bare/Bare Hyphen/four, led by primary curated shots)
  { id: "bare-hyphen-four-10", manifestKey: "bare-hyphen-four-10", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: toàn cảnh căn Duplex studio thông tầng với sofa, bàn trà và cầu thang lên tầng lửng" },
  { id: "bare-hyphen-four-14", manifestKey: "bare-hyphen-four-14", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: khu vực giường ngủ ấm cúng trên tầng lửng nhìn xuống không gian sinh hoạt" },
  { id: "bare-hyphen-four-16", manifestKey: "bare-hyphen-four-16", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: góc bếp hiện đại với hệ tủ gỗ, mặt đá mài và bàn ăn dưới trần cao" },
  { id: "bare-hyphen-four-6", manifestKey: "bare-hyphen-four-6", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: khu vực tiếp khách tầng dưới với ghế sofa, bàn tròn và cửa sổ lớn đón sáng" },
  { id: "bare-hyphen-four-1", manifestKey: "bare-hyphen-four-1", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: góc nhìn từ lối vào mở ra không gian thông tầng thoáng rộng của căn Duplex" },
  { id: "bare-hyphen-four-28", manifestKey: "bare-hyphen-four-28", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: phòng tắm riêng ốp đá mài với lavabo, gương lớn và buồng tắm vách kính" },
  { id: "bare-hyphen-four-2", manifestKey: "bare-hyphen-four-2", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: cầu thang uốn cong mềm mại kết nối tầng sinh hoạt và tầng lửng" },
  { id: "bare-hyphen-four-3", manifestKey: "bare-hyphen-four-3", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: chi tiết lan can cầu thang và hệ tủ gỗ dưới gầm cầu thang" },
  { id: "bare-hyphen-four-4", manifestKey: "bare-hyphen-four-4", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: góc sofa thư giãn bên khung cửa sổ ngập ánh sáng tự nhiên" },
  { id: "bare-hyphen-four-5", manifestKey: "bare-hyphen-four-5", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: bàn trà gỗ, ghế bành và kệ trang trí tại phòng khách tầng dưới" },
  { id: "bare-hyphen-four-7", manifestKey: "bare-hyphen-four-7", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: nhìn từ góc sofa về phía cầu thang và khu vực bếp" },
  { id: "bare-hyphen-four-8", manifestKey: "bare-hyphen-four-8", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: khung cửa sổ lớn với rèm sáng và cây xanh trang trí" },
  { id: "bare-hyphen-four-9", manifestKey: "bare-hyphen-four-9", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: hệ tủ bếp gỗ, bồn rửa và thiết bị bếp đầy đủ tiện nghi" },
  { id: "bare-hyphen-four-11", manifestKey: "bare-hyphen-four-11", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: góc nhìn từ tầng lửng xuống khu vực tiếp khách và cửa sổ lớn" },
  { id: "bare-hyphen-four-12", manifestKey: "bare-hyphen-four-12", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: lối lên cầu thang dẫn tới không gian phòng ngủ tầng lửng" },
  { id: "bare-hyphen-four-13", manifestKey: "bare-hyphen-four-13", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: giường ngủ trên tầng lửng với đầu giường gỗ và ánh đèn dịu" },
  { id: "bare-hyphen-four-15", manifestKey: "bare-hyphen-four-15", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: chi tiết đầu giường, đèn đọc sách và kệ đầu giường trên tầng lửng" },
  { id: "bare-hyphen-four-17", manifestKey: "bare-hyphen-four-17", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: chi tiết mặt bàn bếp đá mài và phụ kiện inox màu champagne" },
  { id: "bare-hyphen-four-27", manifestKey: "bare-hyphen-four-27", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: lối vào phòng tắm với cửa gỗ vòm và mảng tường đá mài" },
  { id: "bare-hyphen-four-29", manifestKey: "bare-hyphen-four-29", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: chi tiết bồn rửa mặt đá mài và vòi nước màu champagne" },
  { id: "bare-hyphen-four-30", manifestKey: "bare-hyphen-four-30", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: khu vực tắm đứng vách kính trong phòng tắm riêng" },
  { id: "bare-hyphen-four-31", manifestKey: "bare-hyphen-four-31", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: chi tiết vật liệu gỗ, đá mài và đường nét bo cong trong căn Duplex" },
  { id: "bare-hyphen-four-32", manifestKey: "bare-hyphen-four-32", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: góc nhìn tổng thể từ bàn ăn qua phòng khách lên tầng lửng" },
  { id: "bare-hyphen-four-33", manifestKey: "bare-hyphen-four-33", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: cửa gỗ và bảng tên phòng Four tại lối vào căn hộ" },
  { id: "bare-hyphen-four-34", manifestKey: "bare-hyphen-four-34", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: bàn ăn và kệ trang trí liền kề khu vực bếp" },
  { id: "bare-hyphen-four-35", manifestKey: "bare-hyphen-four-35", room: "Bare Hyphen Four", alt: "Bare Hyphen Four: hệ tủ quần áo gỗ lớn và gương soi toàn thân" },
];

const ROOM_PHOTOS: Readonly<Record<string, readonly string[]>> = {
  "Bare Hyphen One": BARE_HYPHEN_ONE_SPECS.map((i) => i.id),
  "Bare Hyphen Two": BARE_HYPHEN_IMAGES.filter((i) => i.room === "Bare Hyphen Two").map((i) => i.id),
  "Bare Hyphen Three": BARE_HYPHEN_THREE_SPECS.map((i) => i.id),
  "Bare Hyphen Four": BARE_HYPHEN_IMAGES.filter((i) => i.room === "Bare Hyphen Four").map((i) => i.id),
};

/**
 * Gallery counting summary for Bare Hyphen:
 * Distinguishes unique physical image assets from per-room gallery references so shared
 * `one - three` photographs never inflate the unique property photo count.
 */
export const BARE_HYPHEN_GALLERY_COUNTS = {
  uniqueSharedOneThreeAssets: 36,
  uniqueTwoAssets: 20,
  uniqueFourAssets: 26,
  uniqueRoomAssets: 82,
  uniqueExteriorAssets: 7,
  uniqueCommonSpaceAssets: 15,
  uniquePropertySpaceAssets: 22,
  totalUniquePropertyGalleryAssets: 104,
  roomGalleryReferences: {
    "Bare Hyphen One": 36,
    "Bare Hyphen Two": 20,
    "Bare Hyphen Three": 36,
    "Bare Hyphen Four": 26,
  },
} as const;

/**
 * Descriptive labeling & source provenance contract for the shared `Bare/Bare Hyphen/one - three`
 * photography collection across `Bare Hyphen One` and `Bare Hyphen Three` (both 18 m² Studio units).
 */
export function buildBareHyphenSharedRepresentativeMetadata(
  roomName: "Bare Hyphen One" | "Bare Hyphen Three",
  filename: string,
): {
  room: string;
  notice: string;
  sourceProvenance: string;
  altPrefix: string;
} {
  return {
    room: roomName,
    notice: "Ảnh đại diện minh hoạ thiết kế chung của hạng phòng Studio (18 m² · Bare Hyphen One & Bare Hyphen Three)",
    sourceProvenance: `${BARE_HYPHEN_ONE_THREE_SOURCE_FOLDER}/${filename}`,
    altPrefix: `${roomName} (ảnh đại diện thiết kế chung hạng phòng Studio One & Three)`,
  };
}

const SELECTED_IMAGES: readonly ImageSpec[] = selectionForProperty("bare-hyphen")
  .filter(isShowable)
  .map((image) => ({ id: image.key, manifestKey: image.key, room: image.room, alt: image.alt }));

/**
 * Cell J8's visible text and merged range J8:J11 target (`https://share.google/YV37L6mKA2VrWBO2S`),
 * corroborated by Google Maps place `/g/11h1rbknrd` ("Bare Hyphen - Bare Boutique Stays",
 * 29A/18 Nguyễn Đình Chiểu, Phường Sài Gòn, Hồ Chí Minh).
 */
export const BARE_HYPHEN_VERIFIED_MAP_URL = "https://share.google/YV37L6mKA2VrWBO2S";

export type BareHyphenTrace = {
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
  const paragraphs = [sentences.slice(0, 3).join(" "), sentences.slice(3).join(" ")].filter(Boolean);
  return {
    raw: description.raw,
    display: paragraphs.length ? paragraphs : null,
    source: description.source,
    status: "normalized",
    rule: "Split into two paragraphs at sentence ends; no word changed",
  };
}

export function buildBareHyphen(photo: PhotoLookup): { record: PropertyRecord; trace: BareHyphenTrace } {
  const rawProperty = readClientProperties().find((p) => p.id === "bare-hyphen");
  if (!rawProperty) throw new Error("Bare Hyphen is not in the workbook records");

  const property: ClientProperty = {
    ...rawProperty,
    location: {
      ...rawProperty.location,
      mapUrl: {
        status: "confirmed",
        raw: rawProperty.location.mapUrl.raw,
        display: BARE_HYPHEN_VERIFIED_MAP_URL,
        source: rawProperty.location.mapUrl.source,
        clarification: "Q4",
      },
      note: "Ô J8 và dải gộp J8:J11 có đường dẫn https://share.google/YV37L6mKA2VrWBO2S (đã đối chiếu Google Maps: Bare Hyphen - Bare Boutique Stays, 29A/18 Nguyễn Đình Chiểu, Phường Sài Gòn); bản ghi liên kết đơn lẻ J8 trong tệp v2 còn sót liên kết của Bare Chic (Q4).",
    },
  };

  const first = property.rows[0]!;
  const intro = introFrom(property.description);
  const amenities = amenitiesOf(first);
  const transport = transportOf(first);
  const orderedRooms = orderedRoomsForProperty("bare-hyphen");
  const rooms = orderedRooms.map((r) => r.details);
  const story = storyFrom(property.description);
  const nearby = nearbyFor(property.name.display!);
  if (!nearby) throw new Error("No nearby block names Bare Hyphen");
  const city = property.city.display === "ho-chi-minh" ? "TP. Hồ Chí Minh" : null;
  if (!city) throw new Error("Bare Hyphen's address names no known city");

  const selected = SELECTED_IMAGES.filter((spec) => photo(spec.manifestKey) !== null);
  const replaced = new Set(
    SELECTION.filter((i) => i.replaces && selected.some((spec) => spec.id === i.key)).map((i) => i.replaces!),
  );
  const images = [...BARE_HYPHEN_IMAGES.filter((spec) => !replaced.has(spec.id)), ...selected].map((spec) => {
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
    images.find((i) => i.id === "sel-05-bare-hyphen-two")?.id ?? images[0]?.id ?? "bare-hyphen-one-a-21";

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
    id: "bare-hyphen",
    slug: "bare-hyphen",
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
          caption: { vi: "Ảnh các phòng của Bare Hyphen, theo từng phòng" },
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
