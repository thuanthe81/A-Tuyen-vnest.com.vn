import { nightsBetween } from "@/domain/dates";
import type { SearchCriteria } from "@/domain/search";
import { hasDates } from "@/domain/search";
import { formatDay } from "@/features/booking-search/format";
import { resultsCopy } from "./copy";

/** "12 thg 11 – 15 thg 11 · 3 đêm · 2 khách", or undefined when the stay has no dates yet. */
export function staySummaryText(criteria: SearchCriteria): string | undefined {
  return hasDates(criteria)
    ? `${formatDay(criteria.checkIn)} – ${formatDay(criteria.checkOut)} · ${resultsCopy.nights(nightsBetween(criteria.checkIn, criteria.checkOut))} · ${resultsCopy.guests(criteria.adults)}`
    : undefined;
}
