/**
 * The booking search form as pure state: what the guest has entered and how each action
 * changes it. No React and no markup, so the same rules drive the floating bar, the compact
 * sticky bar and the mobile panel, and are tested without a browser.
 */

import type { IsoDate } from "@/domain/dates";
import { isBefore } from "@/domain/dates";
import type { CriteriaIssue, DatedCriteria, SearchCriteria, StayRules, StaySearchState } from "@/domain/search";
import { DEFAULT_ADULTS, MAX_PARSEABLE_ADULTS, hasDates, validateCriteria } from "@/domain/search";

/** One property a guest can narrow the search to. `id` is the stable identifier; `name` is only ever displayed. */
export interface PropertyOption {
  id: string;
  slug: string;
  name: string;
  /** Where the property is, shown beside its name to tell properties apart. */
  area: string;
}

export interface SearchFormState {
  /**
   * The property to search, by its stable id. `null` is an explicit choice, not a gap:
   * it means all VNest properties, and it is the default.
   */
  propertyId: string | null;
  checkIn?: IsoDate;
  checkOut?: IsoDate;
  adults: number;
}

export type DateField = "checkIn" | "checkOut";
export type SearchField = "property" | DateField | "guests";

export const emptySearchForm: SearchFormState = { propertyId: null, adults: DEFAULT_ADULTS };

/** The form for a search read from the URL. A property the site does not know becomes "all properties". */
export function formFromSearch(state: StaySearchState, properties: readonly PropertyOption[]): SearchFormState {
  const { criteria, filters } = state;
  return {
    propertyId: properties.find((property) => property.slug === filters.property)?.id ?? null,
    ...(criteria.checkIn ? { checkIn: criteria.checkIn } : {}),
    ...(criteria.checkOut ? { checkOut: criteria.checkOut } : {}),
    adults: criteria.adults,
  };
}

export function criteriaFromForm(form: SearchFormState): SearchCriteria {
  return {
    ...(form.checkIn ? { checkIn: form.checkIn } : {}),
    ...(form.checkOut ? { checkOut: form.checkOut } : {}),
    adults: form.adults,
  };
}

export function selectedProperty(form: SearchFormState, properties: readonly PropertyOption[]): PropertyOption | undefined {
  return form.propertyId === null ? undefined : properties.find((property) => property.id === form.propertyId);
}

/** The search as it travels in the URL: the property by its slug, or no property at all for every property. */
export function searchFromForm<Criteria extends SearchCriteria>(
  form: SearchFormState,
  criteria: Criteria,
  properties: readonly PropertyOption[],
): { criteria: Criteria; filters: { property?: string } } {
  const property = selectedProperty(form, properties);
  return { criteria, filters: property ? { property: property.slug } : {} };
}

/** Chooses one property, or all of them with `null`. An id the site does not know is read as all properties. */
export function setProperty(form: SearchFormState, propertyId: string | null, properties: readonly PropertyOption[]): SearchFormState {
  const known = propertyId !== null && properties.some((property) => property.id === propertyId);
  return { ...form, propertyId: known ? propertyId : null };
}

/**
 * Applies a calendar pick, and says which date the guest should choose next.
 *
 * Picking check-in keeps an existing check-out only while it is still after the new
 * check-in; otherwise the check-out is cleared, never silently moved. Picking a "check-out"
 * that is not after check-in is read as starting again from that day. An invalid range
 * therefore cannot be produced from the calendar.
 */
export function pickDate(form: SearchFormState, field: DateField, date: IsoDate): { form: SearchFormState; next: DateField | "done" } {
  if (field === "checkIn" || !form.checkIn || !isBefore(form.checkIn, date)) {
    const keepCheckOut = field === "checkIn" && form.checkOut !== undefined && isBefore(date, form.checkOut);
    const { checkOut: _checkOut, ...rest } = form;
    return {
      form: { ...rest, checkIn: date, ...(keepCheckOut && form.checkOut ? { checkOut: form.checkOut } : {}) },
      next: keepCheckOut ? "done" : "checkOut",
    };
  }
  return { form: { ...form, checkOut: date }, next: "done" };
}

export function clearDates(form: SearchFormState): SearchFormState {
  const { checkIn: _checkIn, checkOut: _checkOut, ...rest } = form;
  return rest;
}

/**
 * The most adults the form accepts. A verified provider rule when there is one; otherwise
 * only the parsing ceiling, because no occupancy limit is ever invented.
 */
export function adultsLimit(rules: StayRules): number {
  return Math.min(rules.maxAdults ?? MAX_PARSEABLE_ADULTS, MAX_PARSEABLE_ADULTS);
}

export function setAdults(form: SearchFormState, adults: number, rules: StayRules): SearchFormState {
  const clamped = Math.min(Math.max(Math.trunc(adults) || 1, 1), adultsLimit(rules));
  return { ...form, adults: clamped };
}

export type SubmitCheck =
  | { ok: true; criteria: DatedCriteria }
  /** `field` is where the guest should be taken to fix the first problem. */
  | { ok: false; issues: CriteriaIssue[]; field: SearchField };

export function fieldOfIssue(issue: CriteriaIssue): SearchField {
  switch (issue.code) {
    case "malformed-date":
    case "missing-date":
      return issue.field;
    case "check-in-in-past":
      return "checkIn";
    case "check-out-not-after-check-in":
    case "below-min-nights":
    case "above-max-nights":
      return "checkOut";
    case "malformed-adults":
    case "above-max-adults":
      return "guests";
  }
}

/**
 * Decides whether the form can be searched. Unlike browsing a list, a search from the
 * booking bar needs both dates, so missing dates are a prompt to choose them.
 * The property is never checked here: no property is a complete, valid choice.
 */
export function checkSubmit(form: SearchFormState, context: { today?: IsoDate; rules?: StayRules }): SubmitCheck {
  const criteria = criteriaFromForm(form);
  const issues: CriteriaIssue[] = [];

  if (!criteria.checkIn) issues.push({ code: "missing-date", field: "checkIn" });
  else if (!criteria.checkOut) issues.push({ code: "missing-date", field: "checkOut" });
  else issues.push(...validateCriteria(criteria, context));

  const [firstIssue] = issues;
  if (firstIssue) return { ok: false, issues, field: fieldOfIssue(firstIssue) };
  if (!hasDates(criteria)) return { ok: false, issues: [{ code: "missing-date", field: "checkIn" }], field: "checkIn" };
  return { ok: true, criteria };
}
