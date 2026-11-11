"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { QueryInput } from "@/domain/search";
import type { PropertyOption } from "@/features/booking-search/search-form";
import { StaySearchProvider } from "@/features/booking-search/StaySearchProvider";
import { homeStayKey, stayFromQuery } from "./booking-flow";

/** The parameters that make a homepage address carry a stay. */
const STAY_PARAMS = ["property", "checkIn", "checkOut", "adults", "rooms", "prefs"];

/**
 * The homepage's 02.1 search, started from the address the browser shows (Phase D refinement, 10/11/2026).
 *
 * A submitted homepage search is written into the homepage's own address (`demoHomeSearchHref`, in place, no new history
 * entry). On a refresh the server renders that address. On Back, Next shows the homepage it had cached, rendered before
 * the search was written, so:
 * - the stay is read here, from the address, when the page mounts (read once: writing the address on submit must not
 *   restart the bar). Same parser as the server (stayFromQuery), so the first render matches the server's;
 * - when that cached render was made for another address (`renderedStay` ≠ the address), the page asks Next once for a
 *   fresh render of the current address (router.refresh: no navigation, no history entry, client state kept), so what
 *   the server builds from the address, the brand cards' links, follows the restored search (Phase D final fixes).
 * The address stays the only source of truth.
 */
export function HomepageStaySearch({
  properties,
  renderedStay,
  children,
}: {
  properties: readonly PropertyOption[];
  /** `homeStayKey` of the address the server rendered this page for. */
  renderedStay: string;
  children: ReactNode;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const [{ initial, addressStay }] = useState(() => {
    const query: Record<string, string | string[]> = {};
    for (const key of new Set(params?.keys() ?? [])) {
      const values = params!.getAll(key);
      query[key] = values.length === 1 ? values[0]! : values;
    }
    return {
      initial: STAY_PARAMS.some((key) => query[key] !== undefined) ? stayFromQuery(query as QueryInput) : undefined,
      addressStay: homeStayKey(query as QueryInput),
    };
  });
  const refreshed = useRef(false);
  useEffect(() => {
    if (refreshed.current || addressStay === renderedStay) return;
    refreshed.current = true;
    router.refresh();
  }, [addressStay, renderedStay, router]);
  return (
    <StaySearchProvider properties={properties} initial={initial}>
      {children}
    </StaySearchProvider>
  );
}
