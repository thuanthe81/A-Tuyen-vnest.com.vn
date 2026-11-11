import { notFound } from "next/navigation";
import { env } from "@/config/env";
import { site } from "@/config/site";
import type { IsoDate } from "@/domain/dates";
import type { QueryInput } from "@/domain/search";
import { applyProviderInventoryToCatalog, buildBookingResultsCatalog } from "@/features/demo/booking-results-data";
import { buildRoomMetaMap, parseMultiRoomQuery, serializeMultiRoomQuery } from "@/features/demo/booking-results-state";
import { BookingResults } from "@/features/demo/BookingResults";
import { overlaysFromStates, stayKey, stayRequestFromState, type HybridBookingContext } from "@/features/demo/hybrid-results";
import { reviewAccess } from "@/features/property-detail/review-access";
import { parseSimulation } from "@/domain/hybrid-booking/availability-simulation";
import { getServices } from "@/server/services";
import { todayInTimeZone } from "@/lib/today";
import { buildMetadata } from "@/seo/metadata";

/**
 * HYBRID BOOKING RESULTS (/dev/demo/tim-phong).
 *
 * Journey: Search → properties (each with its own truthful availability state) → either VNest's room
 * selection (GoHost properties) or the booking hand-off state (ezCloud properties).
 *
 * The server resolves one availability state per property for the stay in the address
 * (`resolveAllPropertyAvailability`): unconfigured, error, needs-provider-check, or a live answer. The
 * client only renders those states; it never decides availability. `?sim=` simulates states only when the
 * deployment enables it (AVAILABILITY_SIMULATION=private-review on a declared development server).
 *
 * Private, local, never indexed (so query-specific result URLs never reach search engines); governed by
 * the same `reviewAccess(env)` rule as all `/dev/*` review routes.
 */
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Tìm phòng & chọn phòng dự kiến · bản trình diễn",
  path: () => "/dev/demo/tim-phong",
  noindex: true,
});

const ACCESS = reviewAccess(env);

export default async function DemoBookingResultsPage({
  searchParams,
}: {
  searchParams: Promise<QueryInput & { sim?: string | string[] }>;
}) {
  if (!ACCESS.route) notFound();
  const query = await searchParams;
  const baseCatalog = buildBookingResultsCatalog();
  const validPropertySlugs = baseCatalog.map((property) => property.id);
  const validRoomIds = new Set(baseCatalog.flatMap((property) => property.rooms.map((room) => room.id)));
  const roomMetaById = buildRoomMetaMap(baseCatalog);
  const initialState = parseMultiRoomQuery(query, validPropertySlugs, validRoomIds, roomMetaById);
  const today = todayInTimeZone(site.timeZone) ?? ("2026-10-24" as IsoDate);

  const stay = stayRequestFromState(initialState);
  const hybrid = getServices().hybridAvailability;
  // `?sim=` is read only where the deployment allows simulation (fail-closed, env.availabilitySimulation).
  const simulation = hybrid.simulationAllowed ? parseSimulation(query.sim) : {};
  const states = await hybrid.resolveAll(stay, { today, simulation });
  const booking: HybridBookingContext = {
    states,
    stayKey: stayKey(stay),
    simulationActive: Object.keys(simulation).length > 0,
  };
  // Provider-confirmed units and rates reach the catalog only from a live response; with none it stays catalog-only.
  const catalog = applyProviderInventoryToCatalog(baseCatalog, overlaysFromStates(states));

  return (
    <BookingResults
      key={`${serializeMultiRoomQuery(initialState)}|${booking.stayKey}`}
      catalog={catalog}
      initialState={initialState}
      today={today}
      booking={booking}
    />
  );
}
