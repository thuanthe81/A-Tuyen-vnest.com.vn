"use client";

import { useEffect, useMemo, useReducer } from "react";
import { collection, type AreaMode } from "./data";
import { counts, fromSearch, matches, NO_FILTERS, reduce, summary, toSearch, type Context, type FilterAction, type FilterState } from "./filter";

/**
 * Filter state for one page, kept in the address (?brand=bare&city=da-nang) so a filtered
 * collection can be shared and survives a reload. replaceState, not pushState: a filter
 * change is not a page the Back button should step through.
 *
 * `source`: an area mode for the mock content, or ready content (the client preview, 03.3-C1).
 */
export function useCollection(source: AreaMode | Context) {
  const context = useMemo<Context>(() => (typeof source === "string" ? collection(source) : source), [source]);
  // `loaded` stays false until the address has been read, so the default state never overwrites it.
  const [{ state, loaded }, dispatch] = useReducer(
    (current: { state: FilterState; loaded: boolean }, action: FilterAction) => ({ state: reduce(context, current.state, action), loaded: current.loaded || action.type === "load" }),
    { state: NO_FILTERS, loaded: false },
  );

  useEffect(() => {
    dispatch({ type: "load", filters: fromSearch(window.location.search) });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const search = toSearch(window.location.search, state);
    if (search !== window.location.search) window.history.replaceState(window.history.state, "", `${window.location.pathname}${search}`);
  }, [state, loaded]);

  const shown = matches(context.properties, state);
  return {
    context,
    state,
    dispatch,
    shown,
    counts: counts(context, state),
    summary: summary(context, state, shown.length),
    active: state.brand !== null || state.city !== null || state.area !== null,
  };
}

export type CollectionModel = ReturnType<typeof useCollection>;
