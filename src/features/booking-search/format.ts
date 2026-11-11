/**
 * How dates read in the booking search, in Vietnamese and English. Built from the date string itself,
 * with no Intl and no Date, so the server and every browser print exactly the same text
 * and hydration can never disagree.
 */

import type { IsoDate } from "@/domain/dates";
import { dateParts, dayOfWeek } from "@/domain/dates";
import type { Locale } from "@/domain/locale";

const WEEKDAY_SHORT = ["Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7", "CN"] as const;
const WEEKDAY_LONG = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"] as const;
/** Column headings, Monday first. */
export const WEEKDAY_HEADINGS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;
export const WEEKDAY_NAMES = WEEKDAY_LONG;

/** English (bilingual preview, 6/11/2026; build-team draft): day first, as in Vietnamese ("10 Dec"). */
const EN_WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const EN_WEEKDAY_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const EN_MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const EN_MONTH_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;

/** Full weekday names per language, Monday first (the calendar's abbr for screen readers). */
export const WEEKDAY_NAMES_BY_LOCALE: Readonly<Record<Locale, readonly string[]>> = { vi: WEEKDAY_LONG, en: EN_WEEKDAY_LONG };

/** Calendar column headings per language, Monday first. */
export const WEEKDAY_HEADINGS_BY_LOCALE: Readonly<Record<Locale, readonly string[]>> = {
  vi: WEEKDAY_HEADINGS,
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
};

/** "10 thg 12" / "10 Dec" */
export function formatDay(date: IsoDate, locale: Locale = "vi"): string {
  const { day, month } = dateParts(date);
  return locale === "en" ? `${day} ${EN_MONTH_SHORT[month - 1]}` : `${day} thg ${month}`;
}

/** "Th 5, 10 thg 12" / "Thu, 10 Dec" */
export function formatDayWithWeekday(date: IsoDate, locale: Locale = "vi"): string {
  return `${(locale === "en" ? EN_WEEKDAY_SHORT : WEEKDAY_SHORT)[dayOfWeek(date)]}, ${formatDay(date, locale)}`;
}

/** "Thứ Năm, 10 tháng 12, 2026" / "Thursday, 10 December 2026": for screen readers and long-form summaries. */
export function formatDayLong(date: IsoDate, locale: Locale = "vi"): string {
  const { day, month, year } = dateParts(date);
  return locale === "en"
    ? `${EN_WEEKDAY_LONG[dayOfWeek(date)]}, ${day} ${EN_MONTH_LONG[month - 1]} ${year}`
    : `${WEEKDAY_LONG[dayOfWeek(date)]}, ${day} tháng ${month}, ${year}`;
}

/** "Tháng 12, 2026" / "December 2026" */
export function formatMonth(year: number, month: number, locale: Locale = "vi"): string {
  return locale === "en" ? `${EN_MONTH_LONG[month - 1]} ${year}` : `Tháng ${month}, ${year}`;
}
