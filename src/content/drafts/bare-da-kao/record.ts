/**
 * BARE ĐA KAO, DRAFT PROPERTY RECORD (VNest V3 Property Detail milestone, 27/10/2026).
 *
 * Built from the 20/10/2026 workbook (`VNest_Informationv2.xlsx`, rows 12–15), the 15/10/2026
 * room sheet (confirmed by VNest's admin on 21/10/2026, R3 owner rule 25/10/2026), and the
 * authorised local photographs (G2 primary `Bare ĐaKao_28 (6).jpg` + owner selection 26/10/2026
 * images 06, 07, 08, 09).
 *
 * Rooms (4 physical Studio units):
 *   1. Bare Đa Kao One   — Studio · 13 m² · 2 người lớn (row 12: D12, E12, F4:F25)
 *   2. Bare Đa Kao Two   — Studio · 19 m² · 2 người lớn (row 13: D13, E13, F4:F25)
 *   3. Bare Đa Kao Three — Studio · 19 m² · 2 người lớn (row 14: D14, E14, F4:F25)
 *   4. Bare Đa Kao Four  — Studio · 17 m² · 2 người lớn (row 15: D15, E15, F4:F25)
 *
 * Photographs (23 approved & locally available across all 4 room folders):
 *   - Bare Đa Kao One (5):   sel-06-bare-da-kao-one (Bare ĐaKao_25.jpg), bare-da-kao-one-28-6 (Bare ĐaKao_28 (6).jpg),
 *                            bare-da-kao-one-23 (Bare ĐaKao_23.jpg), bare-da-kao-one-28-4 (Bare ĐaKao_28 (4).jpg),
 *                            bare-da-kao-one-28-8 (Bare ĐaKao_28 (8).jpg)
 *   - Bare Đa Kao Two (6):   sel-07-bare-da-kao-two (Bare ĐaKao_30 (7).jpg), bare-da-kao-two-30-1 (Bare ĐaKao_30 (1).jpg),
 *                            bare-da-kao-two-30-10 (Bare ĐaKao_30 (10).jpg), bare-da-kao-two-30-11 (Bare ĐaKao_30 (11).jpg),
 *                            bare-da-kao-two-30-12 (Bare ĐaKao_30 (12).jpg), bare-da-kao-two-30-16 (Bare ĐaKao_30 (16).jpg)
 *   - Bare Đa Kao Three (6): sel-08-bare-da-kao-three (Bare ĐaKao_29 (8).jpg), bare-da-kao-three-29-6 (Bare ĐaKao_29 (6).jpg),
 *                            bare-da-kao-three-29-18 (Bare ĐaKao_29 (18).jpg), bare-da-kao-three-29-20 (Bare ĐaKao_29 (20).jpg),
 *                            bare-da-kao-three-29-21 (Bare ĐaKao_29 (21).jpg), bare-da-kao-three-29-22 (Bare ĐaKao_29 (22).jpg)
 *   - Bare Đa Kao Four (6):  sel-09-bare-da-kao-four (Bare ĐaKao_30 (2).jpg, property cover & hero slide 3),
 *                            bare-da-kao-four-31-1 (Bare ĐaKao_31 (1).jpg), bare-da-kao-four-31-12 (Bare ĐaKao_31 (12).jpg),
 *                            bare-da-kao-four-31-17 (Bare ĐaKao_31 (17).jpg), bare-da-kao-four-31-20 (Bare ĐaKao_31 (20).jpg),
 *                            bare-da-kao-four-31-23 (Bare ĐaKao_31 (23).jpg)
 *
 * Location:
 *   - Workbook cell I12: "14/3 Nguyễn Đình Chiểu, phường Tân Định, TP HCM"
 *   - Workbook cell J12 text & cell hyperlink: "https://share.google/2GZVfHKLcCJLT8jU0"
 *     (verified on Google Maps as "Bare Da Kao - Bare Boutique Stays", /g/11z6464xjg,
 *     14/3 Đường Nguyễn Đình Chiểu, Tân Định, Hồ Chí Minh).
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

/**
 * Local photographs for Bare Đa Kao One–Four (G2 primary `Bare ĐaKao_28 (6).jpg` under manifest key `"bare-da-kao"`,
 * plus the 18 remaining person-free photographs from `/Users/noe/Documents/Bare Boutique Stays/Bare ĐaKao/`).
 * The 4 owner-selected room covers (`sel-06`..`sel-09`, matching `Bare ĐaKao_25.jpg`, `30 (7).jpg`, `29 (8).jpg`,
 * and `30 (2).jpg`) lead their respective room galleries via `withSelectedFirst` without duplication.
 */
export const BARE_DA_KAO_IMAGES: readonly ImageSpec[] = [
  // Bare Đa Kao One (after cover sel-06-bare-da-kao-one / Bare ĐaKao_25.jpg)
  {
    id: "bare-da-kao-one-28-6",
    manifestKey: "bare-da-kao",
    room: "Bare Đa Kao One",
    alt: "Bare Đa Kao One: khung cửa sổ nhìn ra hàng trúc xanh, gối tựa và tách trà trên bàn",
  },
  {
    id: "bare-da-kao-one-23",
    manifestKey: "bare-da-kao-one-23",
    room: "Bare Đa Kao One",
    alt: "Bare Đa Kao One: quầy bếp gỗ trầm, vách kính sọc khung đồng và bàn lavabo đá",
  },
  {
    id: "bare-da-kao-one-28-4",
    manifestKey: "bare-da-kao-one-28-4",
    room: "Bare Đa Kao One",
    alt: "Bare Đa Kao One: bàn ăn tròn bằng gỗ và ghế bành nhìn về phía giường ngủ cạnh cửa sổ trúc xanh",
  },
  {
    id: "bare-da-kao-one-28-8",
    manifestKey: "bare-da-kao-one-28-8",
    room: "Bare Đa Kao One",
    alt: "Bare Đa Kao One: lối vào phòng, tranh treo tường nghệ thuật, bồn rửa mặt và buồng tắm vách kính",
  },
  // Bare Đa Kao Two (after cover sel-07-bare-da-kao-two / Bare ĐaKao_30 (7).jpg)
  {
    id: "bare-da-kao-two-30-1",
    manifestKey: "bare-da-kao-two-30-1",
    room: "Bare Đa Kao Two",
    alt: "Bare Đa Kao Two: góc bếp gỗ xanh lục bảo, cửa sổ gạch kính lấy sáng và bàn tròn cạnh sofa dài",
  },
  {
    id: "bare-da-kao-two-30-10",
    manifestKey: "bare-da-kao-two-30-10",
    room: "Bare Đa Kao Two",
    alt: "Bare Đa Kao Two: hệ tủ bếp xanh lục bảo, đèn tường đá, tranh Sài Gòn và mặt bàn bếp đá đen",
  },
  {
    id: "bare-da-kao-two-30-11",
    manifestKey: "bare-da-kao-two-30-11",
    room: "Bare Đa Kao Two",
    alt: "Bare Đa Kao Two: giường đôi tông xám cùng mảng tường ốp gỗ xanh viền đồng và vách kính sọc",
  },
  {
    id: "bare-da-kao-two-30-12",
    manifestKey: "bare-da-kao-two-30-12",
    room: "Bare Đa Kao Two",
    alt: "Bare Đa Kao Two: góc nhìn từ giường ngủ hướng ra kệ tivi, quầy bếp và lối vào phòng tắm",
  },
  {
    id: "bare-da-kao-two-30-16",
    manifestKey: "bare-da-kao-two-30-16",
    room: "Bare Đa Kao Two",
    alt: "Bare Đa Kao Two: phòng tắm với lavabo sứ trên mặt đá, gương tròn hắt sáng và vách kính tắm đứng",
  },
  // Bare Đa Kao Three (after cover sel-08-bare-da-kao-three / Bare ĐaKao_29 (8).jpg)
  {
    id: "bare-da-kao-three-29-6",
    manifestKey: "bare-da-kao-three-29-6",
    room: "Bare Đa Kao Three",
    alt: "Bare Đa Kao Three: chi tiết hệ tủ bếp xanh lam trầm, đèn tường ấm và kệ ly thuỷ tinh",
  },
  {
    id: "bare-da-kao-three-29-18",
    manifestKey: "bare-da-kao-three-29-18",
    room: "Bare Đa Kao Three",
    alt: "Bare Đa Kao Three: toàn cảnh khu bếp xanh lam, bàn ăn tròn và sofa nghỉ dưới ô gạch kính",
  },
  {
    id: "bare-da-kao-three-29-20",
    manifestKey: "bare-da-kao-three-29-20",
    room: "Bare Đa Kao Three",
    alt: "Bare Đa Kao Three: góc nhìn rộng từ giường ngủ qua băng ghế dài, bàn tròn và khu bếp",
  },
  {
    id: "bare-da-kao-three-29-21",
    manifestKey: "bare-da-kao-three-29-21",
    room: "Bare Đa Kao Three",
    alt: "Bare Đa Kao Three: giường ngủ lớn bên vách gỗ xanh lam và vách ngăn kính sọc phòng tắm",
  },
  {
    id: "bare-da-kao-three-29-22",
    manifestKey: "bare-da-kao-three-29-22",
    room: "Bare Đa Kao Three",
    alt: "Bare Đa Kao Three: kệ tivi liền tủ gỗ xanh lam, quầy bếp và cửa mở vào khu vực lavabo",
  },
  // Bare Đa Kao Four (after cover sel-09-bare-da-kao-four / Bare ĐaKao_30 (2).jpg)
  {
    id: "bare-da-kao-four-31-1",
    manifestKey: "bare-da-kao-four-31-1",
    room: "Bare Đa Kao Four",
    alt: "Bare Đa Kao Four: ban công riêng nhiều mảng xanh với bàn trà đôi nhìn ra kiến trúc phố cổ",
  },
  {
    id: "bare-da-kao-four-31-12",
    manifestKey: "bare-da-kao-four-31-12",
    room: "Bare Đa Kao Four",
    alt: "Bare Đa Kao Four: góc nhìn từ sofa qua bàn trà gỗ về phía giường ngủ và phòng tắm",
  },
  {
    id: "bare-da-kao-four-31-17",
    manifestKey: "bare-da-kao-four-31-17",
    room: "Bare Đa Kao Four",
    alt: "Bare Đa Kao Four: đầu giường ốp gỗ ấm với bình gốm trang trí, nhìn ra cửa kính ban công ngập nắng",
  },
  {
    id: "bare-da-kao-four-31-20",
    manifestKey: "bare-da-kao-four-31-20",
    room: "Bare Đa Kao Four",
    alt: "Bare Đa Kao Four: giường ngủ chính diện, tranh minh hoạ Sài Gòn và tủ quần áo khung đồng",
  },
  {
    id: "bare-da-kao-four-31-23",
    manifestKey: "bare-da-kao-four-31-23",
    room: "Bare Đa Kao Four",
    alt: "Bare Đa Kao Four: từ giường ngủ nhìn ra góc sofa, bàn trà gỗ và ban công phủ cây xanh",
  },
  // VNest Media (29/10/2026): 71 additional non-duplicate, person-free photographs across One..Four
  // (after perceptual dHash deduplication against the 23 primary curated JPEGs above).
  // Bare Đa Kao One (+16 = 21 total)
  { id: "bare-da-kao-one-1-1", manifestKey: "bare-da-kao-one-1-1", room: "Bare Đa Kao One", alt: "Bare Đa Kao One: quầy bếp gỗ trầm với mặt đá đen và kệ ly thuỷ tinh" },
  { id: "bare-da-kao-one-1-2", manifestKey: "bare-da-kao-one-1-2", room: "Bare Đa Kao One", alt: "Bare Đa Kao One: chi tiết hệ tủ bếp gỗ, bồn rửa và ánh đèn tường ấm áp" },
  { id: "bare-da-kao-one-1-5", manifestKey: "bare-da-kao-one-1-5", room: "Bare Đa Kao One", alt: "Bare Đa Kao One: bàn tròn gỗ, ghế bành và góc nhìn hướng về giường ngủ" },
  { id: "bare-da-kao-one-1-6", manifestKey: "bare-da-kao-one-1-6", room: "Bare Đa Kao One", alt: "Bare Đa Kao One: giường ngủ cạnh khung cửa kính lớn nhìn ra hàng trúc xanh" },
  { id: "bare-da-kao-one-1-7", manifestKey: "bare-da-kao-one-1-7", room: "Bare Đa Kao One", alt: "Bare Đa Kao One: góc nhìn từ đầu giường qua bàn trà nhỏ ra vườn trúc bên cửa sổ" },
  { id: "bare-da-kao-one-1-8", manifestKey: "bare-da-kao-one-1-8", room: "Bare Đa Kao One", alt: "Bare Đa Kao One: chi tiết đầu giường ốp gỗ trầm và đèn ngủ ánh vàng" },
  { id: "bare-da-kao-one-1-9", manifestKey: "bare-da-kao-one-1-9", room: "Bare Đa Kao One", alt: "Bare Đa Kao One: góc ngồi thư giãn bên khung cửa sổ ngập ánh sáng tự nhiên" },
  { id: "bare-da-kao-one-1-10", manifestKey: "bare-da-kao-one-1-10", room: "Bare Đa Kao One", alt: "Bare Đa Kao One: từ cửa sổ nhìn lại toàn cảnh giường ngủ, bàn ăn và vách kính phòng tắm" },
  { id: "bare-da-kao-one-1-12", manifestKey: "bare-da-kao-one-1-12", room: "Bare Đa Kao One", alt: "Bare Đa Kao One: kệ tivi gỗ và lối đi dẫn ra khu vực bếp và phòng tắm" },
  { id: "bare-da-kao-one-1-14", manifestKey: "bare-da-kao-one-1-14", room: "Bare Đa Kao One", alt: "Bare Đa Kao One: bồn rửa mặt đặt trên bàn đá và gương tròn viền đồng" },
  { id: "bare-da-kao-one-1-15", manifestKey: "bare-da-kao-one-1-15", room: "Bare Đa Kao One", alt: "Bare Đa Kao One: chi tiết vách kính sọc khung đồng ngăn cách khu vực lavabo" },
  { id: "bare-da-kao-one-1-16", manifestKey: "bare-da-kao-one-1-16", room: "Bare Đa Kao One", alt: "Bare Đa Kao One: buồng tắm đứng vách kính và phụ kiện đồng cổ điển" },
  { id: "bare-da-kao-one-1-17", manifestKey: "bare-da-kao-one-1-17", room: "Bare Đa Kao One", alt: "Bare Đa Kao One: góc nhìn từ khu vực lavabo hướng ra bàn ăn và giường ngủ" },
  { id: "bare-da-kao-one-1-18", manifestKey: "bare-da-kao-one-1-18", room: "Bare Đa Kao One", alt: "Bare Đa Kao One: tranh nghệ thuật Sài Gòn treo tường bên cạnh bàn gỗ" },
  { id: "bare-da-kao-one-1-19", manifestKey: "bare-da-kao-one-1-19", room: "Bare Đa Kao One", alt: "Bare Đa Kao One: chi tiết nội thất gỗ trầm và chất liệu vải ấm cúng trong phòng" },
  { id: "bare-da-kao-one-1-20", manifestKey: "bare-da-kao-one-1-20", room: "Bare Đa Kao One", alt: "Bare Đa Kao One: cửa gỗ vào phòng với bảng tên phòng One" },
  // Bare Đa Kao Two (+15 = 21 total)
  { id: "bare-da-kao-two-2-1", manifestKey: "bare-da-kao-two-2-1", room: "Bare Đa Kao Two", alt: "Bare Đa Kao Two: toàn cảnh góc bếp xanh lục bảo, bàn tròn và sofa bên ô gạch kính" },
  { id: "bare-da-kao-two-2-2", manifestKey: "bare-da-kao-two-2-2", room: "Bare Đa Kao Two", alt: "Bare Đa Kao Two: chi tiết hệ tủ bếp xanh lục bảo và mặt bàn bếp đá đen" },
  { id: "bare-da-kao-two-2-3", manifestKey: "bare-da-kao-two-2-3", room: "Bare Đa Kao Two", alt: "Bare Đa Kao Two: góc bàn trà tròn và băng ghế sofa dưới ánh sáng từ ô gạch kính" },
  { id: "bare-da-kao-two-2-5", manifestKey: "bare-da-kao-two-2-5", room: "Bare Đa Kao Two", alt: "Bare Đa Kao Two: nhìn từ ghế sofa qua bàn tròn về phía giường ngủ và tủ quần áo" },
  { id: "bare-da-kao-two-2-6", manifestKey: "bare-da-kao-two-2-6", room: "Bare Đa Kao Two", alt: "Bare Đa Kao Two: giường ngủ với mảng tường ốp gỗ xanh lục bảo và đèn đọc sách" },
  { id: "bare-da-kao-two-2-7", manifestKey: "bare-da-kao-two-2-7", room: "Bare Đa Kao Two", alt: "Bare Đa Kao Two: chi tiết đầu giường, gối tựa và tranh nghệ thuật Sài Gòn" },
  { id: "bare-da-kao-two-2-8", manifestKey: "bare-da-kao-two-2-8", room: "Bare Đa Kao Two", alt: "Bare Đa Kao Two: góc nhìn chéo từ giường ngủ ra khu vực tiếp khách và bếp" },
  { id: "bare-da-kao-two-2-10", manifestKey: "bare-da-kao-two-2-10", room: "Bare Đa Kao Two", alt: "Bare Đa Kao Two: hệ tủ quần áo gỗ xanh lục bảo viền đồng và kệ tivi" },
  { id: "bare-da-kao-two-2-11", manifestKey: "bare-da-kao-two-2-11", room: "Bare Đa Kao Two", alt: "Bare Đa Kao Two: chi tiết đèn tường đá tự nhiên và tranh treo tường" },
  { id: "bare-da-kao-two-2-15", manifestKey: "bare-da-kao-two-2-15", room: "Bare Đa Kao Two", alt: "Bare Đa Kao Two: lối vào phòng tắm qua vách kính sọc khung đồng" },
  { id: "bare-da-kao-two-2-16", manifestKey: "bare-da-kao-two-2-16", room: "Bare Đa Kao Two", alt: "Bare Đa Kao Two: khu vực lavabo đá và gương tròn trong phòng tắm riêng" },
  { id: "bare-da-kao-two-2-17", manifestKey: "bare-da-kao-two-2-17", room: "Bare Đa Kao Two", alt: "Bare Đa Kao Two: buồng tắm vòi sen vách kính và gạch ốp tường sáng màu" },
  { id: "bare-da-kao-two-2-19", manifestKey: "bare-da-kao-two-2-19", room: "Bare Đa Kao Two", alt: "Bare Đa Kao Two: chi tiết vòi nước đồng và khay tiện nghi trên mặt đá lavabo" },
  { id: "bare-da-kao-two-2-20", manifestKey: "bare-da-kao-two-2-20", room: "Bare Đa Kao Two", alt: "Bare Đa Kao Two: góc nhìn từ lối vào phòng hướng ra toàn bộ không gian studio" },
  { id: "bare-da-kao-two-2-21", manifestKey: "bare-da-kao-two-2-21", room: "Bare Đa Kao Two", alt: "Bare Đa Kao Two: bảng tên phòng Two tại lối vào căn hộ" },
  // Bare Đa Kao Three (+21 = 27 total)
  { id: "bare-da-kao-three-3-1", manifestKey: "bare-da-kao-three-3-1", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: góc nhìn từ lối vào mở ra khu bếp xanh lam và bàn ăn tròn" },
  { id: "bare-da-kao-three-3-2", manifestKey: "bare-da-kao-three-3-2", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: hệ tủ bếp xanh lam trầm với mặt đá và kệ ly thuỷ tinh" },
  { id: "bare-da-kao-three-3-3", manifestKey: "bare-da-kao-three-3-3", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: chi tiết bồn rửa, ấm đun và phụ kiện bếp trên mặt bàn đá" },
  { id: "bare-da-kao-three-3-4", manifestKey: "bare-da-kao-three-3-4", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: bàn ăn tròn bằng gỗ và ghế ngồi dưới ánh đèn ấm" },
  { id: "bare-da-kao-three-3-5", manifestKey: "bare-da-kao-three-3-5", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: băng ghế sofa dài dưới ô cửa sổ gạch kính lấy sáng" },
  { id: "bare-da-kao-three-3-6", manifestKey: "bare-da-kao-three-3-6", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: góc nghỉ ngơi với sofa, bàn tròn và tranh treo tường Sài Gòn" },
  { id: "bare-da-kao-three-3-7", manifestKey: "bare-da-kao-three-3-7", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: nhìn từ góc sofa về phía giường ngủ và vách gỗ xanh lam" },
  { id: "bare-da-kao-three-3-8", manifestKey: "bare-da-kao-three-3-8", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: chi tiết tranh minh hoạ kiến trúc Sài Gòn và đèn tường đá" },
  { id: "bare-da-kao-three-3-11", manifestKey: "bare-da-kao-three-3-11", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: giường ngủ với đầu giường ốp gỗ xanh lam trầm và gối tựa" },
  { id: "bare-da-kao-three-3-12", manifestKey: "bare-da-kao-three-3-12", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: góc nhìn chính diện giường ngủ và mảng tường ốp gỗ" },
  { id: "bare-da-kao-three-3-13", manifestKey: "bare-da-kao-three-3-13", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: chi tiết đèn ngủ và tab đầu giường bằng gỗ" },
  { id: "bare-da-kao-three-3-14", manifestKey: "bare-da-kao-three-3-14", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: từ đầu giường nhìn ra kệ tivi, tủ quần áo và góc bếp" },
  { id: "bare-da-kao-three-3-15", manifestKey: "bare-da-kao-three-3-15", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: hệ tủ quần áo kết hợp kệ tivi tông xanh lam trầm" },
  { id: "bare-da-kao-three-3-16", manifestKey: "bare-da-kao-three-3-16", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: vách ngăn kính sọc khung đồng giữa phòng ngủ và phòng tắm" },
  { id: "bare-da-kao-three-3-17", manifestKey: "bare-da-kao-three-3-17", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: toàn cảnh không gian studio nhìn từ phía giường ngủ" },
  { id: "bare-da-kao-three-3-18", manifestKey: "bare-da-kao-three-3-18", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: sự kết nối hài hoà giữa khu vực ngủ, góc sofa và quầy bếp" },
  { id: "bare-da-kao-three-3-20", manifestKey: "bare-da-kao-three-3-20", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: chi tiết tay nắm đồng và bề mặt gỗ hoàn thiện thủ công" },
  { id: "bare-da-kao-three-3-24", manifestKey: "bare-da-kao-three-3-24", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: phòng tắm riêng với lavabo sứ, mặt bàn đá và gương tròn" },
  { id: "bare-da-kao-three-3-25", manifestKey: "bare-da-kao-three-3-25", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: khu vực tắm đứng vách kính và sen tắm đồng" },
  { id: "bare-da-kao-three-3-26", manifestKey: "bare-da-kao-three-3-26", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: chi tiết bồn rửa mặt và gương hắt sáng trong phòng tắm" },
  { id: "bare-da-kao-three-3-27", manifestKey: "bare-da-kao-three-3-27", room: "Bare Đa Kao Three", alt: "Bare Đa Kao Three: cửa gỗ và bảng tên phòng Three tại lối vào" },
  // Bare Đa Kao Four (+19 = 25 total)
  { id: "bare-da-kao-four-4-2", manifestKey: "bare-da-kao-four-4-2", room: "Bare Đa Kao Four", alt: "Bare Đa Kao Four: góc ban công ngập nắng với bàn trà đôi và cây xanh" },
  { id: "bare-da-kao-four-4-3", manifestKey: "bare-da-kao-four-4-3", room: "Bare Đa Kao Four", alt: "Bare Đa Kao Four: nhìn từ ban công qua cửa kính lớn vào khu vực sofa và giường ngủ" },
  { id: "bare-da-kao-four-4-4", manifestKey: "bare-da-kao-four-4-4", room: "Bare Đa Kao Four", alt: "Bare Đa Kao Four: ghế sofa dài và bàn trà gỗ cạnh khung cửa kính mở ra ban công" },
  { id: "bare-da-kao-four-4-5", manifestKey: "bare-da-kao-four-4-5", room: "Bare Đa Kao Four", alt: "Bare Đa Kao Four: góc tiếp khách ấm cúng với sofa, bàn trà và tủ treo đồ khung đồng" },
  { id: "bare-da-kao-four-4-6", manifestKey: "bare-da-kao-four-4-6", room: "Bare Đa Kao Four", alt: "Bare Đa Kao Four: chi tiết bàn trà gỗ, bình gốm và ánh sáng tự nhiên từ ban công" },
  { id: "bare-da-kao-four-4-7", manifestKey: "bare-da-kao-four-4-7", room: "Bare Đa Kao Four", alt: "Bare Đa Kao Four: quầy bếp nhỏ gọn gàng với mặt đá và kệ gỗ" },
  { id: "bare-da-kao-four-4-8", manifestKey: "bare-da-kao-four-4-8", room: "Bare Đa Kao Four", alt: "Bare Đa Kao Four: chi tiết khu vực bếp, bồn rửa và thiết bị tiện nghi" },
  { id: "bare-da-kao-four-4-9", manifestKey: "bare-da-kao-four-4-9", room: "Bare Đa Kao Four", alt: "Bare Đa Kao Four: góc nhìn từ quầy bếp hướng ra sofa và ban công cây xanh" },
  { id: "bare-da-kao-four-4-10", manifestKey: "bare-da-kao-four-4-10", room: "Bare Đa Kao Four", alt: "Bare Đa Kao Four: kệ tivi gỗ và lối đi dẫn vào khu vực phòng ngủ" },
  { id: "bare-da-kao-four-4-11", manifestKey: "bare-da-kao-four-4-11", room: "Bare Đa Kao Four", alt: "Bare Đa Kao Four: toàn cảnh không gian phòng từ góc sofa về phía giường ngủ" },
  { id: "bare-da-kao-four-4-12", manifestKey: "bare-da-kao-four-4-12", room: "Bare Đa Kao Four", alt: "Bare Đa Kao Four: giường ngủ với đầu giường ốp gỗ ấm và vách kính sọc phòng tắm" },
  { id: "bare-da-kao-four-4-15", manifestKey: "bare-da-kao-four-4-15", room: "Bare Đa Kao Four", alt: "Bare Đa Kao Four: chi tiết gối tựa, đầu giường gỗ và bình gốm trang trí" },
  { id: "bare-da-kao-four-4-16", manifestKey: "bare-da-kao-four-4-16", room: "Bare Đa Kao Four", alt: "Bare Đa Kao Four: góc nhìn từ đầu giường hướng ra cửa kính ban công tràn ngập ánh sáng" },
  { id: "bare-da-kao-four-4-17", manifestKey: "bare-da-kao-four-4-17", room: "Bare Đa Kao Four", alt: "Bare Đa Kao Four: tranh minh hoạ Sài Gòn và tủ quần áo kính khung đồng bên giường" },
  { id: "bare-da-kao-four-4-18", manifestKey: "bare-da-kao-four-4-18", room: "Bare Đa Kao Four", alt: "Bare Đa Kao Four: chi tiết tủ quần áo khung đồng và đèn tường ấm áp" },
  { id: "bare-da-kao-four-4-19", manifestKey: "bare-da-kao-four-4-19", room: "Bare Đa Kao Four", alt: "Bare Đa Kao Four: sự giao thoa giữa ánh sáng tự nhiên và chất liệu gỗ ấm trong phòng" },
  { id: "bare-da-kao-four-4-20", manifestKey: "bare-da-kao-four-4-20", room: "Bare Đa Kao Four", alt: "Bare Đa Kao Four: phòng tắm riêng với bàn lavabo đá và gương tròn" },
  { id: "bare-da-kao-four-4-24", manifestKey: "bare-da-kao-four-4-24", room: "Bare Đa Kao Four", alt: "Bare Đa Kao Four: buồng tắm vách kính và phụ kiện phòng tắm đồng thau" },
  { id: "bare-da-kao-four-4-25", manifestKey: "bare-da-kao-four-4-25", room: "Bare Đa Kao Four", alt: "Bare Đa Kao Four: chi tiết lavabo và ánh sáng dịu trong phòng tắm" },
];

export const BARE_DA_KAO_EXTENDED_BY_ROOM: Readonly<Record<string, readonly string[]>> = {
  "Bare Đa Kao One": [
    "bare-da-kao-one-1-1",
    "bare-da-kao-one-1-2",
    "bare-da-kao-one-1-5",
    "bare-da-kao-one-1-6",
    "bare-da-kao-one-1-7",
    "bare-da-kao-one-1-8",
    "bare-da-kao-one-1-9",
    "bare-da-kao-one-1-10",
    "bare-da-kao-one-1-12",
    "bare-da-kao-one-1-14",
    "bare-da-kao-one-1-15",
    "bare-da-kao-one-1-16",
    "bare-da-kao-one-1-17",
    "bare-da-kao-one-1-18",
    "bare-da-kao-one-1-19",
    "bare-da-kao-one-1-20",
  ],
  "Bare Đa Kao Two": [
    "bare-da-kao-two-2-1",
    "bare-da-kao-two-2-2",
    "bare-da-kao-two-2-3",
    "bare-da-kao-two-2-5",
    "bare-da-kao-two-2-6",
    "bare-da-kao-two-2-7",
    "bare-da-kao-two-2-8",
    "bare-da-kao-two-2-10",
    "bare-da-kao-two-2-11",
    "bare-da-kao-two-2-15",
    "bare-da-kao-two-2-16",
    "bare-da-kao-two-2-17",
    "bare-da-kao-two-2-19",
    "bare-da-kao-two-2-20",
    "bare-da-kao-two-2-21",
  ],
  "Bare Đa Kao Three": [
    "bare-da-kao-three-3-1",
    "bare-da-kao-three-3-2",
    "bare-da-kao-three-3-3",
    "bare-da-kao-three-3-4",
    "bare-da-kao-three-3-5",
    "bare-da-kao-three-3-6",
    "bare-da-kao-three-3-7",
    "bare-da-kao-three-3-8",
    "bare-da-kao-three-3-11",
    "bare-da-kao-three-3-12",
    "bare-da-kao-three-3-13",
    "bare-da-kao-three-3-14",
    "bare-da-kao-three-3-15",
    "bare-da-kao-three-3-16",
    "bare-da-kao-three-3-17",
    "bare-da-kao-three-3-18",
    "bare-da-kao-three-3-20",
    "bare-da-kao-three-3-24",
    "bare-da-kao-three-3-25",
    "bare-da-kao-three-3-26",
    "bare-da-kao-three-3-27",
  ],
  "Bare Đa Kao Four": [
    "bare-da-kao-four-4-2",
    "bare-da-kao-four-4-3",
    "bare-da-kao-four-4-4",
    "bare-da-kao-four-4-5",
    "bare-da-kao-four-4-6",
    "bare-da-kao-four-4-7",
    "bare-da-kao-four-4-8",
    "bare-da-kao-four-4-9",
    "bare-da-kao-four-4-10",
    "bare-da-kao-four-4-11",
    "bare-da-kao-four-4-12",
    "bare-da-kao-four-4-15",
    "bare-da-kao-four-4-16",
    "bare-da-kao-four-4-17",
    "bare-da-kao-four-4-18",
    "bare-da-kao-four-4-19",
    "bare-da-kao-four-4-20",
    "bare-da-kao-four-4-24",
    "bare-da-kao-four-4-25",
  ],
};

const ROOM_PHOTOS: Readonly<Record<string, readonly string[]>> = {
  "Bare Đa Kao One": [
    "bare-da-kao-one-28-6",
    "bare-da-kao-one-23",
    "bare-da-kao-one-28-4",
    "bare-da-kao-one-28-8",
    ...BARE_DA_KAO_EXTENDED_BY_ROOM["Bare Đa Kao One"]!,
  ],
  "Bare Đa Kao Two": [
    "bare-da-kao-two-30-1",
    "bare-da-kao-two-30-10",
    "bare-da-kao-two-30-11",
    "bare-da-kao-two-30-12",
    "bare-da-kao-two-30-16",
    ...BARE_DA_KAO_EXTENDED_BY_ROOM["Bare Đa Kao Two"]!,
  ],
  "Bare Đa Kao Three": [
    "bare-da-kao-three-29-6",
    "bare-da-kao-three-29-18",
    "bare-da-kao-three-29-20",
    "bare-da-kao-three-29-21",
    "bare-da-kao-three-29-22",
    ...BARE_DA_KAO_EXTENDED_BY_ROOM["Bare Đa Kao Three"]!,
  ],
  "Bare Đa Kao Four": [
    "bare-da-kao-four-31-1",
    "bare-da-kao-four-31-12",
    "bare-da-kao-four-31-17",
    "bare-da-kao-four-31-20",
    "bare-da-kao-four-31-23",
    ...BARE_DA_KAO_EXTENDED_BY_ROOM["Bare Đa Kao Four"]!,
  ],
};

/**
 * The owner's image selection (26/10/2026, image-selection.ts):
 * - Image 06 (`sel-06-bare-da-kao-one`) leads Bare Đa Kao One ahead of `bare-da-kao-one-28-6`
 * - Image 07 (`sel-07-bare-da-kao-two`) leads Bare Đa Kao Two
 * - Image 08 (`sel-08-bare-da-kao-three`) leads Bare Đa Kao Three
 * - Image 09 (`sel-09-bare-da-kao-four`) leads Bare Đa Kao Four and serves as the property cover
 */
const SELECTED_IMAGES: readonly ImageSpec[] = selectionForProperty("bare-da-kao")
  .filter(isShowable)
  .map((image) => ({ id: image.key, manifestKey: image.key, room: image.room, alt: image.alt }));

/**
 * Cell J12's visible text and cell-level hyperlink (`https://share.google/2GZVfHKLcCJLT8jU0`),
 * corroborated by Google Maps place `/g/11z6464xjg` ("Bare Da Kao - Bare Boutique Stays",
 * 14/3 Đường Nguyễn Đình Chiểu, Tân Định, Hồ Chí Minh). Reconciled here for Bare Đa Kao's
 * property detail view while leaving raw workbook conflict reporting in `records.ts` untouched.
 */
export const BARE_DA_KAO_VERIFIED_MAP_URL = "https://share.google/2GZVfHKLcCJLT8jU0";

export type BareDaKaoTrace = {
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

/**
 * First sentence of E12, verbatim, as the short introduction under the property name:
 * "Bare Đa Kao được lấy cảm hứng từ vẻ đẹp duyên dáng của kiến trúc hiện đại Saigon thời vàng son những năm 1950-1970."
 * A tagline from VNest would replace it once approved (Q21).
 */
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

/**
 * The description in two paragraphs as written in E12 (split at the workbook's paragraph break).
 * Nothing is reworded; `buildDetailView` removes Sentence 1 from Paragraph 1 so it is not read twice.
 */
function storyFrom(description: Sourced<string>): Sourced<readonly string[]> {
  const raw = description.raw ?? description.display ?? "";
  const paragraphs = raw
    .split(/\r?\n\r?\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return {
    raw: description.raw,
    display: paragraphs.length ? paragraphs : null,
    source: description.source,
    status: "normalized",
    rule: "Split into paragraphs at the workbook paragraph break; no word changed",
  };
}

export function buildBareDaKao(photo: PhotoLookup): { record: PropertyRecord; trace: BareDaKaoTrace } {
  const rawProperty = readClientProperties().find((p) => p.id === "bare-da-kao");
  if (!rawProperty) throw new Error("Bare Đa Kao is not in the workbook records");

  const property: ClientProperty = {
    ...rawProperty,
    location: {
      ...rawProperty.location,
      mapUrl: {
        status: "confirmed",
        raw: rawProperty.location.mapUrl.raw,
        display: BARE_DA_KAO_VERIFIED_MAP_URL,
        source: rawProperty.location.mapUrl.source,
        clarification: "Q22",
      },
      note: "Ô J12 có đường dẫn https://share.google/2GZVfHKLcCJLT8jU0 (đã đối chiếu Google Maps: Bare Da Kao - Bare Boutique Stays, 14/3 Nguyễn Đình Chiểu, phường Tân Định); dải gộp J12:J15 trong tệp v2 còn sót liên kết của Bare Hyphen (Q22).",
    },
  };

  const first = property.rows[0]!;
  const intro = introFrom(property.description);
  const amenities = amenitiesOf(first);
  const transport = transportOf(first);
  const orderedRooms = orderedRoomsForProperty("bare-da-kao");
  const rooms = orderedRooms.map((r) => r.details);
  const story = storyFrom(property.description);
  const nearby = nearbyFor(property.name.display!);
  if (!nearby) throw new Error("No nearby block names Bare Đa Kao");
  const city = property.city.display === "ho-chi-minh" ? "TP. Hồ Chí Minh" : null;
  if (!city) throw new Error("Bare Đa Kao's address names no known city");

  const selected = SELECTED_IMAGES.filter((spec) => photo(spec.manifestKey) !== null);
  const replaced = new Set(
    SELECTION.filter((i) => i.replaces && selected.some((spec) => spec.id === i.key)).map((i) => i.replaces!),
  );
  const images = [...BARE_DA_KAO_IMAGES.filter((spec) => !replaced.has(spec.id)), ...selected].map((spec) => {
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
    images.find((i) => i.id === "sel-09-bare-da-kao-four")?.id ?? images[0]?.id ?? "bare-da-kao-one-28-6";

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
    id: "bare-da-kao",
    slug: "bare-da-kao",
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
          caption: { vi: "Ảnh các phòng của Bare Đa Kao, theo từng phòng" },
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
