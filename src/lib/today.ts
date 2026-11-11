import { parseIsoDate } from "@/domain/dates";
import type { IsoDate } from "@/domain/dates";

/**
 * Today's calendar date in a property's timezone. This reads the clock; it never converts
 * a stay date. Returns undefined when the timezone is unknown or invalid, in which case
 * the site makes no past-date judgement and leaves it to the provider.
 */
export function todayInTimeZone(timeZone: string | undefined, now: Date = new Date()): IsoDate | undefined {
  if (!timeZone) return undefined;
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const part = (type: string) => parts.find((candidate) => candidate.type === type)?.value ?? "";
    return parseIsoDate(`${part("year")}-${part("month")}-${part("day")}`);
  } catch {
    return undefined;
  }
}
