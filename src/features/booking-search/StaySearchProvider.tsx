"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useTransition } from "react";
import { routes } from "@/config/routes";
import { site } from "@/config/site";
import type { IsoDate } from "@/domain/dates";
import type { CriteriaIssue, StayRules, StaySearchState } from "@/domain/search";
import { todayInTimeZone } from "@/lib/today";
import type { DateField, PropertyOption, SearchFormState, SubmitCheck } from "./search-form";
import { adultsLimit, checkSubmit, clearDates, emptySearchForm, formFromSearch, pickDate, searchFromForm, selectedProperty, setAdults, setProperty } from "./search-form";

/** Where a valid search goes. */
export type SearchTarget =
  | { kind: "stays" }
  /** The development search handler, until the results page (section 02.2) exists. */
  | { kind: "dev-preview" };

function targetUrl(target: SearchTarget, search: StaySearchState): string {
  switch (target.kind) {
    case "stays":
      return routes.stays(site.defaultLocale, search);
    case "dev-preview":
      return routes.dev.bookingSearchResults(search);
  }
}

export interface StaySearch {
  form: SearchFormState;
  properties: readonly PropertyOption[];
  /** The chosen property, or undefined when the search covers all properties. */
  property: PropertyOption | undefined;
  /** Today at VNest's properties. Unknown until the guest first interacts, so it is never guessed on the server. */
  today: IsoDate | undefined;
  issues: readonly CriteriaIssue[];
  /** True while a submitted search is navigating. */
  pending: boolean;
  rules: StayRules;
  maxAdults: number;
  ensureToday: () => IsoDate | undefined;
  /** Chooses one property by id, or all properties with null. */
  setProperty: (propertyId: string | null) => void;
  pickDate: (field: DateField, date: IsoDate) => DateField | "done";
  clearDates: () => void;
  clearAll: () => void;
  setAdults: (adults: number) => void;
  /** Drops validation messages once the guest has left the place they were shown. */
  dismissIssues: () => void;
  /** Validates and, when valid, navigates. Returns the outcome so the caller can direct focus. */
  submit: () => SubmitCheck;
  /** Whether the guest has scrolled past the full bar, so the compact one takes over. */
  stickyActive: boolean;
  setStickyActive: (active: boolean) => void;
}

const StaySearchContext = createContext<StaySearch | null>(null);

export function useStaySearch(): StaySearch {
  const value = useContext(StaySearchContext);
  if (!value) throw new Error("useStaySearch must be used inside <StaySearchProvider>.");
  return value;
}

/**
 * One booking search, however many times it is shown. Every bar and panel inside this
 * provider reads and writes the same state, so the floating bar, the compact sticky bar and
 * the mobile panel can never disagree.
 */
export function StaySearchProvider({
  properties,
  initial,
  target = { kind: "stays" },
  rules = {},
  children,
}: {
  /** The properties a guest can narrow the search to, from the content repository. */
  properties: readonly PropertyOption[];
  /** The search from the URL, already parsed on the server. */
  initial?: StaySearchState;
  target?: SearchTarget;
  /** Verified stay rules from the booking provider. Empty when none are known; none are invented. */
  rules?: StayRules;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [form, setForm] = useState<SearchFormState>(() => (initial ? formFromSearch(initial, properties) : emptySearchForm));
  const [today, setToday] = useState<IsoDate>();
  const [issues, setIssues] = useState<readonly CriteriaIssue[]>([]);
  const [stickyActive, setStickyActive] = useState(false);
  const [pending, startTransition] = useTransition();

  const update = (next: SearchFormState) => {
    setForm(next);
    setIssues([]);
  };

  const ensureToday = () => {
    if (today) return today;
    const now = todayInTimeZone(site.timeZone);
    setToday(now);
    return now;
  };

  const value: StaySearch = {
    form,
    properties,
    property: selectedProperty(form, properties),
    today,
    issues,
    pending,
    rules,
    maxAdults: adultsLimit(rules),
    ensureToday,
    setProperty: (propertyId) => update(setProperty(form, propertyId, properties)),
    pickDate: (field, date) => {
      const picked = pickDate(form, field, date);
      update(picked.form);
      return picked.next;
    },
    clearDates: () => update(clearDates(form)),
    clearAll: () => update(emptySearchForm),
    setAdults: (adults) => update(setAdults(form, adults, rules)),
    dismissIssues: () => {
      if (issues.length > 0) setIssues([]);
    },
    submit: () => {
      const check = checkSubmit(form, { today: ensureToday(), rules });
      if (check.ok) {
        setIssues([]);
        const search = searchFromForm(form, check.criteria, properties);
        startTransition(() => router.push(targetUrl(target, search)));
      } else {
        setIssues(check.issues);
      }
      return check;
    },
    stickyActive,
    setStickyActive,
  };

  return <StaySearchContext value={value}>{children}</StaySearchContext>;
}
