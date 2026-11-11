/**
 * Interface wording for availability results, in Vietnamese.
 *
 * DRAFT written by the build team, not VNest-approved copy. Nothing here states a policy,
 * a price or a fact about a property: those come from the provider or the property record.
 */

import type { AvailabilityFailure } from "@/domain/availability";
import type { StayDetail } from "./derive";

export const resultsCopy = {
  sampleBanner: "Dữ liệu mô phỏng",
  sampleBannerDetail: "Tên cơ sở, hình ảnh, tiện nghi, giá, điều khoản và tình trạng phòng trên trang này đều là dữ liệu mẫu để phát triển. Không phải thông tin thật của VNest.",
  sampleBannerShort: "không phải thông tin thật của VNest",
  simulated: "Mô phỏng",

  eyebrowAll: "Tất cả cơ sở",
  eyebrowProperty: "Chọn phòng",
  browseHeading: (count: number) => `${count} nơi lưu trú`,
  browseHint: "Chọn ngày để xem phòng trống và giá.",
  checkingHeading: "Đang kiểm tra",
  availableHeading: (count: number) => `${count} nơi còn phòng`,
  noneHeading: "Không còn phòng cho ngày này",
  uncheckedHeading: "Chưa xác nhận được phòng trống",
  failedHeading: "Chưa kiểm tra được phòng trống",
  notConnectedHeading: "Đặt phòng trực tuyến chưa sẵn sàng",
  invalidHeading: "Tìm kiếm cần chỉnh lại",
  soldOutCount: (count: number) => `${count} nơi hết phòng`,
  uncheckedCount: (count: number) => `${count} nơi chưa kiểm tra được`,
  nights: (count: number) => `${count} đêm`,
  guests: (count: number) => `${count} khách`,

  sortLabel: "Sắp xếp",
  sortEditorial: "Thứ tự VNest",
  sortPrice: "Giá thấp trước",

  statusAvailable: "Còn phòng",
  statusSoldOut: "Hết phòng",
  statusUnknown: "Chưa rõ phòng trống",
  statusError: "Chưa kiểm tra được",
  statusStale: "Kết quả cũ",
  statusChecking: "Đang kiểm tra",

  from: "từ",
  priceUnavailable: "Chưa có giá",
  priceUnavailableDetail: "Nhà cung cấp chưa trả về giá đã xác nhận cho kỳ lưu trú này.",
  unpricedCount: (count: number) => `${count} nơi chưa có giá`,
  unpricedOffers: (names: string) => `Chưa có giá đã xác nhận: ${names}`,
  selectRoom: "Chọn phòng này",
  roomSelected: "Đã chọn phòng",
  roomNotRate: "Bạn đang chọn một phòng, không phải một mức giá. Trang này chưa có giá đã xác nhận cho phòng.",
  noPriceNoHandoff: "Chưa thể tiếp tục trực tuyến: chưa có giá đã xác nhận và chưa có bước đặt phòng nào được kết nối.",
  continueWithRoom: "Tiếp tục với phòng này",
  boundaryRoom: "Bước đặt phòng thuộc Mục 02.3 và chưa được xây dựng. Chưa có đặt phòng nào được tạo và chưa có giá nào được xác nhận.",
  taxIncluded: "Đã gồm thuế và phí",
  taxExcluded: "Chưa gồm thuế và phí",
  taxUnknown: "Nhà cung cấp chưa nêu rõ thuế và phí",
  averagePerNight: (amount: string) => `Trung bình ${amount} mỗi đêm`,
  totalFor: (nights: number) => `tổng ${nights} đêm`,

  viewRooms: "Xem phòng",
  chooseDates: "Chọn ngày",
  changeDates: "Đổi ngày",
  changeGuests: "Đổi số khách",
  fixSearch: "Sửa tìm kiếm",
  retry: "Thử lại",
  retrying: "Đang thử lại",
  refresh: "Cập nhật giá",

  soldOutSection: "Hết phòng cho ngày này",
  soldOutRow: "Hết phòng cho kỳ lưu trú đã chọn",
  noRoomForParty: (guests: number) => `Không có phòng cho ${guests} khách`,
  largestRoom: (limit: number) => `Phòng lớn nhất nhận tối đa ${limit} khách.`,
  noAnswer: "Chưa có thông tin phòng trống cho cơ sở này.",
  notConnected: "Đặt phòng trực tuyến chưa sẵn sàng cho cơ sở này.",
  noOffer: "Nhà cung cấp chưa trả về lựa chọn đặt phòng nào.",
  allSoldOutBody: "Không cơ sở nào còn phòng cho kỳ lưu trú này. Hãy thử ngày khác.",
  notConnectedBody: "Chưa có hệ thống đặt phòng nào được kết nối, nên không có thông tin phòng trống hay giá.",

  staleTitle: "Giá có thể đã thay đổi",
  staleBody: (time: string | undefined) => (time ? `Kết quả được lấy lúc ${time} và không còn chắc chắn. Hãy cập nhật trước khi chọn.` : "Kết quả không còn chắc chắn. Hãy cập nhật trước khi chọn."),
  updatedAt: (time: string) => `Cập nhật lúc ${time}`,
  offerGone: "Gói giá bạn đã chọn không còn trong kết quả mới. Hãy chọn lại.",

  backToAll: "Tất cả cơ sở cho ngày này",
  backToAllBrowse: "Tất cả cơ sở",
  otherProperties: "Xem các cơ sở khác cho ngày này",
  propertySoldOut: "Cơ sở này không còn phòng cho kỳ lưu trú đã chọn.",
  roomsTitle: "Phòng",
  roomsHeading: "Phòng còn trống",
  viewAvailableRooms: "Xem phòng trống",
  galleryLabel: "Hình ảnh",
  roomsBrowseHeading: "Các loại phòng",
  roomsBrowseHint: "Chọn ngày để xem giá và tình trạng phòng.",
  unavailableRooms: "Không còn cho ngày này",
  roomSoldOut: "Hết phòng",
  roomTooSmall: (guests: number, limit: number) => `Không phù hợp cho ${guests} khách · tối đa ${limit}`,
  roomUnverified: "Chưa có thông tin",
  capacity: (count: number) => `Tối đa ${count} khách`,
  area: (sqm: number) => `${sqm} m²`,
  unitsLeft: (count: number) => `Còn ${count} phòng`,
  ratesOf: (room: string) => `Gói giá cho ${room}`,
  rateUnnamed: "Giá phòng",
  inclusions: "Bao gồm",
  cancellation: "Huỷ phòng",
  payment: "Thanh toán",
  termsLater: "Điều khoản hiển thị trước khi bạn xác nhận.",
  moreRates: (count: number) => `Xem thêm ${count} gói giá`,
  fewerRates: "Thu gọn",

  selectionHeading: "Lựa chọn của bạn",
  selectionEmpty: "Chọn một gói giá để tiếp tục.",
  selectionEmptyRoom: "Chọn một phòng để tiếp tục.",
  continue: "Tiếp tục đặt",
  continueStale: "Cập nhật giá để tiếp tục",
  boundarySimulated: "Đây là dữ liệu mô phỏng nên không thể đặt phòng. Bước đặt phòng thuộc Mục 02.3 và chưa được xây dựng.",
  boundaryNotBuilt: "Bước đặt phòng thuộc Mục 02.3 và chưa được xây dựng. Chưa có đặt phòng nào được tạo.",

  devPanelTitle: "Bảng điều khiển mô phỏng",
  devPanelHint: "Chỉ có khi dùng nhà cung cấp mô phỏng. Chọn một kịch bản để xem từng trạng thái; tìm kiếm trên URL được giữ nguyên.",
} as const;

export function failureMessage(reason: AvailabilityFailure): string {
  switch (reason) {
    case "timeout":
      return "Hệ thống đặt phòng phản hồi quá lâu.";
    case "network":
      return "Không kết nối được. Hãy kiểm tra mạng của bạn.";
    case "not-configured":
      return resultsCopy.notConnected;
    case "provider":
    case "unknown":
      return "Hệ thống đặt phòng chưa phản hồi.";
  }
}

export function detailMessage(detail: StayDetail | undefined, guests: number): string {
  switch (detail) {
    case "over-capacity":
      return resultsCopy.noRoomForParty(guests);
    case "not-connected":
      return resultsCopy.notConnected;
    case "no-offer":
      return resultsCopy.noOffer;
    case "no-answer":
    case undefined:
      return resultsCopy.noAnswer;
  }
}
