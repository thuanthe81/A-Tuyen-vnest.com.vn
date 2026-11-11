"use client";

import { useMemo } from "react";
import { routes } from "@/config/routes";
import { site } from "@/config/site";
import { resultsCopy } from "@/features/availability/copy";
import { DevScenarioPanel } from "@/features/availability/DevScenarioPanel";
import { Skeleton } from "@/features/availability/parts";
import { PropertyRooms } from "@/features/availability/PropertyRooms";
import { withMockScenario } from "@/features/availability/routing";
import { staySummaryText } from "@/features/availability/stay-summary";
import { useAvailability } from "@/features/availability/useAvailability";
import { useMockScenario } from "@/features/availability/useMockScenario";
import type { RoomView } from "@/features/availability/view-models";
import { useStayFromUrl } from "./useStayFromUrl";

/**
 * Where the property page (section 05.1) hands over to booking (section 02.2): it reads the
 * stay from the URL, asks for availability for this one property, and gives both to the
 * room and rate selection. Nothing about availability is decided here.
 */
export function PropertyRoomSelection({
  property,
  rooms,
  mock,
}: {
  property: { id: string; slug: string; timeZone: string | undefined };
  rooms: readonly RoomView[];
  /** Present only when the mock provider is configured. */
  mock: { scenarios: readonly string[]; configured: string } | undefined;
}) {
  const { search, issues, key, mockFromUrl } = useStayFromUrl(property.slug, property.timeZone);
  const mockScenario = useMockScenario(mockFromUrl, mock !== undefined);
  // The same objects for the same property, so a re-render never looks like a new search.
  const target = useMemo(() => ({ id: property.id, slug: property.slug }), [property.id, property.slug]);
  const allPropertyIds = useMemo(() => [property.id], [property.id]);
  const { view, reload, retryProperty, retrying } = useAvailability({ criteria: search.criteria, issues, property: target, allPropertyIds, mockScenario });
  const all = withMockScenario(routes.stays(site.defaultLocale, { criteria: search.criteria, filters: {} }), mock ? mockFromUrl : undefined);

  return (
    <>
      <PropertyRooms
        // A chosen rate belongs to one stay; it does not survive a change of dates or guests.
        key={key}
        property={target}
        rooms={rooms}
        criteria={search.criteria}
        staySummary={staySummaryText(search.criteria)}
        view={view}
        timeZone={site.timeZone}
        retrying={retrying}
        onReload={reload}
        onRetryProperty={retryProperty}
        allHref={all}
      />
      {mock ? (
        <div className="mt-(--vn-space-16)">
          <DevScenarioPanel scenarios={mock.scenarios} fromUrl={mockFromUrl} configured={mock.configured} baseHref={routes.property(property.slug, site.defaultLocale, search.criteria)} />
        </div>
      ) : null}
    </>
  );
}

/** The rooms' place while the URL is read. */
export function PropertyRoomSelectionFallback() {
  return (
    <div aria-hidden="true">
      <p className="text-(length:--vn-text-2xl) leading-(--vn-leading-tight) font-medium tracking-[-0.02em]">{resultsCopy.roomsTitle}</p>
      <Skeleton className="mt-3 h-4 w-56" />
      <Skeleton className="mt-(--vn-space-8) h-40 w-full rounded-(--bk-r-shell)" />
    </div>
  );
}
