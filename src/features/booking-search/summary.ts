/** One-line readings of the search, shared by every presentation of it. */

import { nightsBetween } from "@/domain/dates";
import type { CriteriaIssue } from "@/domain/search";
import type { Locale } from "@/domain/locale";
import { issueMessage, searchCopyFor } from "./copy";
import { formatDay } from "./format";
import type { DateField, SearchField, SearchFormState } from "./search-form";
import { fieldOfIssue } from "./search-form";

/** "10 thg 12 – 12 thg 12", or a prompt while the stay is incomplete. */
export function datesSummary(form: SearchFormState, locale: Locale = "vi"): string {
  if (form.checkIn && form.checkOut) return `${formatDay(form.checkIn, locale)} – ${formatDay(form.checkOut, locale)}`;
  if (form.checkIn) return `${formatDay(form.checkIn, locale)} – …`;
  return searchCopyFor(locale).chooseDate;
}

/** Dates and guests on one line, for the compact presentations. */
export function staySummary(form: SearchFormState, locale: Locale = "vi"): string {
  return `${datesSummary(form, locale)} · ${searchCopyFor(locale).guestCount(form.adults)}`;
}

/** The first problem that belongs to one of the given fields, as a message. */
export function issueFor(issues: readonly CriteriaIssue[], fields: readonly SearchField[], locale: Locale = "vi"): string | undefined {
  const issue = issues.find((candidate) => fields.includes(fieldOfIssue(candidate)));
  return issue ? issueMessage(issue, locale) : undefined;
}

/** What the calendar says under the months: the stay so far, or what to pick next. */
export function datesStatus(form: SearchFormState, activeField: DateField, locale: Locale = "vi"): string {
  const copy = searchCopyFor(locale);
  if (form.checkIn && form.checkOut) {
    return `${datesSummary(form, locale)} · ${copy.nights(nightsBetween(form.checkIn, form.checkOut))}`;
  }
  return activeField === "checkIn" || !form.checkIn ? copy.choosingCheckIn : copy.choosingCheckOut;
}
