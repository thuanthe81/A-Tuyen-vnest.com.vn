/**
 * Interface wording for the booking search, in Vietnamese and English.
 *
 * DRAFT written by the build team, not VNest-approved copy. The fields and their order
 * (property, check-in, check-out, guests, search) are the owner's decision of 10/10/2026.
 */

import type { ByLocale, Locale } from "@/domain/locale";
import type { CriteriaIssue } from "@/domain/search";

const vi = {
  formLabel: "Tìm chỗ ở",
  property: "Cơ sở",
  allProperties: "Tất cả cơ sở",
  allPropertiesHint: "Tìm ở mọi cơ sở VNest",
  checkIn: "Nhận phòng",
  checkOut: "Trả phòng",
  dates: "Ngày lưu trú",
  chooseDate: "Chọn ngày",
  guests: "Khách",
  adults: "Người lớn",
  guestCount: (count: number) => `${count} khách`,
  decreaseGuests: "Bớt một khách",
  increaseGuests: "Thêm một khách",
  search: "Tìm kiếm",
  searching: "Đang tìm",
  nights: (count: number) => `${count} đêm`,
  clearDates: "Xoá ngày",
  clearAll: "Xoá tất cả",
  done: "Xong",
  close: "Đóng",
  previousMonth: "Tháng trước",
  nextMonth: "Tháng sau",
  today: "hôm nay",
  selectedCheckIn: "ngày nhận phòng đã chọn",
  selectedCheckOut: "ngày trả phòng đã chọn",
  inStay: "trong kỳ lưu trú",
  unavailableDay: "không chọn được",
  choosingCheckIn: "Chọn ngày nhận phòng",
  choosingCheckOut: "Chọn ngày trả phòng",
};

export type SearchCopy = typeof vi;

/**
 * English: build-team DRAFT for owner review (bilingual preview, 6/11/2026; docs/i18n/EN-TRANSLATION-SET.md). The 02.1 bar's
 * layout and fields are frozen; only its wording follows the page language.
 */
const en: SearchCopy = {
  formLabel: "Find a stay",
  property: "Property",
  allProperties: "All properties",
  allPropertiesHint: "Search every VNest property",
  checkIn: "Check-in",
  checkOut: "Check-out",
  dates: "Dates",
  chooseDate: "Add dates",
  guests: "Guests",
  adults: "Adults",
  guestCount: (count: number) => `${count} ${count === 1 ? "guest" : "guests"}`,
  decreaseGuests: "Remove a guest",
  increaseGuests: "Add a guest",
  search: "Search",
  searching: "Searching",
  nights: (count: number) => `${count} ${count === 1 ? "night" : "nights"}`,
  clearDates: "Clear dates",
  clearAll: "Clear all",
  done: "Done",
  close: "Close",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  today: "today",
  selectedCheckIn: "selected check-in date",
  selectedCheckOut: "selected check-out date",
  inStay: "within your stay",
  unavailableDay: "not available to select",
  choosingCheckIn: "Choose your check-in date",
  choosingCheckOut: "Choose your check-out date",
};

export const SEARCH_COPY: ByLocale<SearchCopy> = { vi, en };

/** The Vietnamese wording (public 02.1 pages, and any caller without a locale). */
export const searchCopy = SEARCH_COPY.vi;

export function searchCopyFor(locale: Locale): SearchCopy {
  return SEARCH_COPY[locale];
}

export function issueMessage(issue: CriteriaIssue, locale: Locale = "vi"): string {
  if (locale === "en") return issueMessageEn(issue);
  switch (issue.code) {
    case "missing-date":
      return issue.field === "checkIn" ? "Hãy chọn ngày nhận phòng." : "Hãy chọn ngày trả phòng.";
    case "malformed-date":
      return "Ngày không hợp lệ. Hãy chọn lại.";
    case "check-out-not-after-check-in":
      return "Ngày trả phòng phải sau ngày nhận phòng.";
    case "check-in-in-past":
      return "Ngày nhận phòng đã qua. Hãy chọn ngày khác.";
    case "below-min-nights":
      return `Kỳ lưu trú tối thiểu ${issue.minNights} đêm.`;
    case "above-max-nights":
      return `Kỳ lưu trú tối đa ${issue.maxNights} đêm.`;
    case "malformed-adults":
      return "Số khách không hợp lệ.";
    case "above-max-adults":
      return `Tối đa ${issue.maxAdults} khách.`;
  }
}

/** English: build-team DRAFT for owner review. */
function issueMessageEn(issue: CriteriaIssue): string {
  switch (issue.code) {
    case "missing-date":
      return issue.field === "checkIn" ? "Please choose a check-in date." : "Please choose a check-out date.";
    case "malformed-date":
      return "That date is not valid. Please choose again.";
    case "check-out-not-after-check-in":
      return "Check-out must be after check-in.";
    case "check-in-in-past":
      return "That check-in date has passed. Please choose another.";
    case "below-min-nights":
      return `The minimum stay is ${issue.minNights} ${issue.minNights === 1 ? "night" : "nights"}.`;
    case "above-max-nights":
      return `The maximum stay is ${issue.maxNights} nights.`;
    case "malformed-adults":
      return "The number of guests is not valid.";
    case "above-max-adults":
      return `Up to ${issue.maxAdults} guests.`;
  }
}
