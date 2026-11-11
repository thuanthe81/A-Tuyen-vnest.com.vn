/**
 * VERBATIM SNAPSHOT of the workbook cells the property pages need beyond workbook.ts (section 05.2).
 * Same workbook (VNest_Informationv2.xlsx, sha256 126e77dc…028241d9, 20/10/2026); generated from
 * its XML by a script, every string exactly the cell's value. Nothing is corrected here.
 *
 * - OVERVIEW_DETAILS, sheet "Tổng quan 6 cơ sở": F amenities (Tiện ích nội khu), K transport
 *   (Di chuyển / giao thông), M guest groups (Nhóm khách chính). Values sit on each property's
 *   first row; F, K and M are merged over the property's rows (OVERVIEW_DETAIL_MERGES).
 * - NEARBY_SHEET, sheet "Thông tin các điểm tham quan": the two area blocks (TP.HCM rows 2–18,
 *   Đà Nẵng rows 20–36); B attraction, C food and drink, D address. No distances or times exist,
 *   and nothing maps a place to one property: each block names the properties of its area.
 *   Unchanged from the 15/10 workbook apart from the numbers in A ("1" instead of "1.0").
 * - POLICY_SHEET, sheet "Booking & chính sách", new in v2: A item, B value, C "Áp dụng cho cơ
 *   sở" (which properties), D link. B4 and B5 are times stored as day fractions with the format
 *   h:mm (0.5833… = 14:00, 0.5 = 12:00). Every C and D cell is empty.
 *
 * The room sheet of the 15/10 workbook ("Cơ sở & danh sách phòng": type, size, capacity) is not
 * in v2. Its last values are kept only as a legacy reference in legacy-room-sheet.ts.
 */

export type OverviewDetailRow = { row: number; F?: string; K?: string; M?: string };
export const OVERVIEW_DETAILS: readonly OverviewDetailRow[] = [
  { row: 4, F: "Bếp nhỏ, Phòng tắm riêng, Smart TV, Wifi, Điều hoà nhiệt độ,..", K: "Grab, đi bộ, xe bus", M: "Khách đi du lịch, công tác, staycation, cặp đôi." },
  { row: 5 },
  { row: 6 },
  { row: 7 },
  { row: 8, F: "Bếp nhỏ, Phòng tắm riêng, Smart TV, Wifi, Điều hoà nhiệt độ,..", K: "Grab, đi bộ, xe bus", M: "Khách đi du lịch, công tác, staycation, cặp đôi." },
  { row: 9 },
  { row: 10 },
  { row: 11 },
  { row: 12, F: "Bếp nhỏ, Phòng tắm riêng, Smart TV, Wifi, Điều hoà nhiệt độ,..", K: "Grab, đi bộ, xe bus", M: "Khách đi du lịch, công tác, staycation, cặp đôi." },
  { row: 13 },
  { row: 14 },
  { row: 15 },
  { row: 16, F: "Bếp nhỏ, Phòng tắm riêng, Smart TV, Wifi, Điều hoà nhiệt độ,..", K: "Grab, đi bộ, xe bus", M: "Khách đi du lịch, công tác, staycation, cặp đôi." },
  { row: 17 },
  { row: 18 },
  { row: 19 },
  { row: 20, F: "Bếp nhỏ, Phòng tắm riêng, Smart TV, Wifi, Điều hoà nhiệt độ,..", K: "Grab, đi bộ, xe bus", M: "Khách đi du lịch, công tác, staycation, cặp đôi." },
  { row: 21 },
  { row: 22 },
  { row: 23 },
  { row: 24, F: "Bếp, Phòng tắm riêng, Smart TV, Wifi, Điều hoà nhiệt độ,..", K: "Grab, đi bộ, xe bus", M: "Khách đi du lịch, công tác, staycation, cặp đôi." },
  { row: 25 },
];
export const OVERVIEW_DETAIL_MERGES: readonly string[] = ["F12:F15","F16:F19","F20:F23","F24:F25","F4:F7","F8:F11","G12:H15","G16:H19","G20:H23","G24:H25","G4:H7","G8:H11","K12:K15","K16:K19","K20:K23","K24:K25","K4:K7","K8:K11","M12:M15","M16:M19","M20:M23","M24:M25","M4:M7","M8:M11"];

export type NearbySheetRow = { row: number; A?: string; B?: string; C?: string; D?: string };
export const NEARBY_SHEET: readonly NearbySheetRow[] = [
  { row: 1, A: "VNEST | THÔNG TIN CÁC ĐIỂM ĂN UỐNG & THAM QUAN " },
  { row: 2, A: "Khu vực các cơ sở: Bare Chic, Bare Đa Kao, Bare Hyphen, Pepper House" },
  { row: 3, A: "STT", B: "Tên địa điểm tham quan ", C: "Tên địa điểm ăn uống", D: "Địa chỉ " },
  { row: 4, A: "1", B: "Dinh Độc Lập", D: "135 Nam Kỳ Khởi Nghĩa, Phường  Sài Gòn, Hồ Chí Minh" },
  { row: 5, A: "2", C: "ThaiYen Cafe", D: "32 Nguyễn Đình Chiểu, Phường Tân Định, Hồ Chí Minh" },
  { row: 6, A: "3", B: "Phố đi bộ Nguyễn Huệ", D: "Đường  Nguyễn Huệ, Phường  Sài Gòn, Hồ Chí Minh" },
  { row: 7, A: "4", C: "Cơm niêu Thiên Lý", D: "16 Nguyễn Đình Chiểu, Phường Tân Định, Hồ Chí Minh" },
  { row: 8, A: "5", B: "Nhà thờ Đức Bà Sài Gòn & Bưu điện Trung tâm Thành phố", D: " 2 Công trường Công xã Paris, Phường  Sài Gòn, Hồ Chí Minh" },
  { row: 9, A: "6", C: "Phở Phượng", D: "25 Hoàng Sa, Phường Sài Gòn, Hồ Chí Minh" },
  { row: 10, A: "7", B: "Chợ Bến Thành", D: "Đường Lê Lợi, Phường  Sài Gòn, Hồ Chí Minh" },
  { row: 11, A: "8", C: "Lunch Lady", D: "Lô C1 Chung Cư 1A1B Nguyễn Đình Chiểu,Phường Sài Gòn, Hồ Chí Minh" },
  { row: 12, A: "9", B: "Thảo Cầm Viên Sài Gòn", D: " 2 Nguyễn Bỉnh Khiêm, Phường  Sài Gòn, Hồ Chí Minh" },
  { row: 13, A: "10", C: "Bánh mì Huynh Hoa", D: "26 Lê Thị Riêng, Phường Bến Thành, Hồ Chí Minh" },
  { row: 14, A: "11", B: "Bảo tàng Chứng tích chiến tranh", D: "28 Võ Văn Tần, Phường  Xuân Hòa, Hồ Chí Minh" },
  { row: 15, A: "12", C: "Hủ tiếu nam vang Thành Đạt", D: "34 Cô Bắc, Phường Cầu Ông Lãnh, Hồ Chí Minh" },
  { row: 16, A: "13", B: "Bảo tàng Mỹ Thuật Thành phố Hồ Chí Minh", D: "97 Phó Đức Chính, Phường Bến Thành, Hồ Chí Minh" },
  { row: 17, A: "14", C: "Bánh mì chim chạy", D: "11/4 Nguyễn Thị Minh Khai, Phường Sài Gòn, Hồ Chí Minh" },
  { row: 18, A: "15", B: "Nhà thờ Tân Định", D: "289 Hai Bà Trưng, Phường  Xuân Hòa, Hồ Chí Minh" },
  { row: 20, A: "Khu vực các cơ sở: Bare Hàn, The Nắng Suites" },
  { row: 21, A: "STT", B: "Tên địa điểm tham quan ", C: "Tên địa điểm ăn uống", D: "Địa chỉ " },
  { row: 22, A: "1", B: "Bán đảo Sơn Trà", D: "Sơn Trà, Đà Nẵng" },
  { row: 23, A: "2", C: "Hải sản Năm Đảnh", D: "139/59/38 Trần Quang Khải, Sơn Trà, Đà Nẵng" },
  { row: 24, A: "3", B: "Ngũ Hành Sơn", D: " 81 Huyền Trân Công Chúa, Hoà Hải, Ngũ Hành Sơn, Đà Nẵng" },
  { row: 25, A: "4", C: "Bún chả cá 109", D: "109 Nguyễn Chí Thanh, Hải Châu, Đà Nẵng" },
  { row: 26, A: "5", B: "Cầu Rồng", D: "An Hải, Đà Nẵng" },
  { row: 27, A: "6", C: "Bún mắm Vân", D: "23/14 Trần Kế Xương, Hải Châu, Đà Nẵng" },
  { row: 28, A: "7", B: "Nhà thờ chính toà Đà Nẵng (Nhà thờ Con Gà)", D: "156 Trần Phú, Hải Châu, Đà Nẵng" },
  { row: 29, A: "8", C: "Bánh xèo Bà Dưỡng", D: "280/23 Hoàng Diệu, Hải Châu, Đà Nẵng" },
  { row: 30, A: "9", B: "Chợ Hàn", D: "119 Trần phú, Hải Châu, Đà Nẵng" },
  { row: 31, A: "10", C: "Tiệm kiết (cà phê)", D: "K332/22a Hoàng Diệu, Hải Châu, Đà Nẵng" },
  { row: 32, A: "11", B: "Chợ Cồn", D: "90 Hùng Vương, Hải Châu, Đà Nẵng" },
  { row: 33, A: "12", C: "Tan coffee", D: "!0 Nguyễn Thiện Thuật, Bình Hiên, Hải Châu, Đà Nẵng" },
  { row: 34, A: "13", B: "Biển Mỹ Khê", D: "Sơn Trà, Đà Nẵng" },
  { row: 35, A: "14", C: "Bếp của ngoại", D: "136b Yên Bái, Hải Châu, Đà Nẵng" },
  { row: 36, A: "15", B: "Bảo tàng Điêu khắc Chăm", D: "Số 2 đường 2/9, Hải Châu, Đà Nẵng" },
];

export type PolicySheetRow = { row: number; A?: string; B?: string; C?: string; D?: string };
export const POLICY_SHEET: readonly PolicySheetRow[] = [
  { row: 1, A: "VNEST | BOOKING REQUIREMENTS & CHÍNH SÁCH" },
  { row: 2, A: "Điền một hạng mục trên mỗi dòng; ghi rõ nếu chính sách áp dụng chung hoặc khác nhau theo cơ sở." },
  { row: 3, A: "Hạng mục", B: "Thông tin / quy định", C: "Áp dụng cho cơ sở", D: "Link chính sách chi tiết" },
  { row: 4, A: "Giờ nhận phòng", B: "0.58333333333333337" },
  { row: 5, A: "Giờ trả phòng", B: "0.5" },
  { row: 6, A: "Nhận phòng sớm / trả phòng muộn", B: "Không áp dụng" },
  { row: 7, A: "Chính sách hủy / hoàn tiền" },
  { row: 8, A: "Chính sách đổi ngày" },
  { row: 9, A: "Phương thức và thời điểm thanh toán" },
  { row: 10, A: "Tiền cọc / phí phát sinh" },
  { row: 11, A: "Trẻ em / vật nuôi / quy định đặc biệt", B: "Không áp dụng" },
  { row: 12, A: "Quy trình xác nhận booking" },
  { row: 13, A: "Email / tin nhắn xác nhận" },
  { row: 14, A: "Kênh hỗ trợ khách hàng" },
];
/** B4 and B5 carry number format 20 (h:mm). */
export const POLICY_TIME_CELLS: readonly string[] = ["B4", "B5"];
