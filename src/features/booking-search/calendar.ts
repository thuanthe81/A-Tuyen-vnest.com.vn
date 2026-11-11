/** Month grids for the date picker. Pure: built from calendar-day strings, never from Date. */

import type { IsoDate } from "@/domain/dates";
import { addDays, addMonths, dateParts, dayOfWeek, firstOfMonth, isBefore, lastOfMonth } from "@/domain/dates";

export interface CalendarMonth {
  /** First day of the month; also its key. */
  first: IsoDate;
  year: number;
  month: number;
  /** Weeks from Monday to Sunday. `null` pads the days that belong to other months. */
  weeks: readonly (readonly (IsoDate | null)[])[];
}

export function buildMonth(anyDayInMonth: IsoDate): CalendarMonth {
  const first = firstOfMonth(anyDayInMonth);
  const last = lastOfMonth(first);
  const { year, month } = dateParts(first);
  const cells: (IsoDate | null)[] = Array.from({ length: dayOfWeek(first) }, () => null);
  for (let day = first; !isBefore(last, day); day = addDays(day, 1)) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (IsoDate | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7));
  return { first, year, month, weeks };
}

export function buildMonths(firstMonth: IsoDate, count: number): CalendarMonth[] {
  return Array.from({ length: count }, (_, index) => buildMonth(addMonths(firstMonth, index)));
}

/** How a day relates to the selected (or previewed) stay. */
export type DayRole = "start" | "end" | "single" | "between" | "none";

export function dayRole(day: IsoDate, start: IsoDate | undefined, end: IsoDate | undefined): DayRole {
  if (!start) return "none";
  if (!end || end === start) return day === start ? "single" : "none";
  if (day === start) return "start";
  if (day === end) return "end";
  return isBefore(start, day) && isBefore(day, end) ? "between" : "none";
}

/** Keeps a date inside the selectable window. */
export function clampDate(date: IsoDate, min: IsoDate, max: IsoDate): IsoDate {
  if (isBefore(date, min)) return min;
  if (isBefore(max, date)) return max;
  return date;
}
