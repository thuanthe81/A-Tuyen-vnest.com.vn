/**
 * Calendar dates for stays.
 *
 * A stay date is a calendar day at the property ("2026-10-12"), not an instant.
 * It is kept as a YYYY-MM-DD string everywhere and never converted to a
 * JavaScript Date, so no timezone or DST shift can move it by a day.
 */

declare const isoDateBrand: unique symbol;
export type IsoDate = string & { readonly [isoDateBrand]: true };

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Returns the value as an IsoDate only if it is a real calendar date. */
export function parseIsoDate(value: string): IsoDate | undefined {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return undefined;
  }
  return value as IsoDate;
}

/** Day count from a fixed epoch in the proleptic Gregorian calendar. Pure integer arithmetic. */
function toDayNumber(date: IsoDate): number {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yearOfEra = y - era * 400;
  const dayOfYear = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const dayOfEra = yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra;
}

/** Number of nights from check-in to check-out. Negative or zero when the range is not a stay. */
export function nightsBetween(checkIn: IsoDate, checkOut: IsoDate): number {
  return toDayNumber(checkOut) - toDayNumber(checkIn);
}

/** YYYY-MM-DD strings sort chronologically, so plain comparison is exact. */
export function isBefore(a: IsoDate, b: IsoDate): boolean {
  return a < b;
}

/** The date for a day number produced by toDayNumber. Pure integer arithmetic, the exact inverse. */
function fromDayNumber(dayNumber: number): IsoDate {
  const era = Math.floor(dayNumber / 146097);
  const dayOfEra = dayNumber - era * 146097;
  const yearOfEra = Math.floor(
    (dayOfEra - Math.floor(dayOfEra / 1460) + Math.floor(dayOfEra / 36524) - Math.floor(dayOfEra / 146096)) / 365,
  );
  const dayOfYear = dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const monthIndex = Math.floor((5 * dayOfYear + 2) / 153);
  const day = dayOfYear - Math.floor((153 * monthIndex + 2) / 5) + 1;
  const month = monthIndex < 10 ? monthIndex + 3 : monthIndex - 9;
  const year = yearOfEra + era * 400 + (month <= 2 ? 1 : 0);
  return toIsoDate(year, month, day);
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, "0");
}

function toIsoDate(year: number, month: number, day: number): IsoDate {
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}` as IsoDate;
}

export function dateParts(date: IsoDate): { year: number; month: number; day: number } {
  return { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)), day: Number(date.slice(8, 10)) };
}

/** The date a number of days later (or earlier, when negative). */
export function addDays(date: IsoDate, days: number): IsoDate {
  return fromDayNumber(toDayNumber(date) + days);
}

/** Day of the week, Monday = 0 … Sunday = 6. */
export function dayOfWeek(date: IsoDate): number {
  // Day number 719468 is 1 January 1970, a Thursday.
  return (((toDayNumber(date) - 719468 + 3) % 7) + 7) % 7;
}

export function firstOfMonth(date: IsoDate): IsoDate {
  const { year, month } = dateParts(date);
  return toIsoDate(year, month, 1);
}

export function lastOfMonth(date: IsoDate): IsoDate {
  const { year, month } = dateParts(date);
  return toIsoDate(year, month, daysInMonth(year, month));
}

/** The first day of the month a number of months later (or earlier). */
export function addMonths(date: IsoDate, months: number): IsoDate {
  const { year, month } = dateParts(date);
  const index = year * 12 + (month - 1) + months;
  return toIsoDate(Math.floor(index / 12), (((index % 12) + 12) % 12) + 1, 1);
}
