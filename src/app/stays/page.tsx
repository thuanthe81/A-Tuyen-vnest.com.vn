import { redirect } from "next/navigation";
import { toPropertyCardModel } from "@/components/property-card/model";
import { env } from "@/config/env";
import { MOCK_AVAILABILITY_SCENARIOS, parseMockAvailabilityScenario } from "@/config/mock-scenarios";
import { routes } from "@/config/routes";
import { site } from "@/config/site";
import type { QueryInput } from "@/domain/search";
import { parseStaySearch, validateCriteria } from "@/domain/search";
import { DevScenarioPanel } from "@/features/availability/DevScenarioPanel";
import { legacyPropertyRedirect } from "@/features/availability/routing";
import { SampleBanner } from "@/features/availability/SampleBanner";
import { StaysExperience } from "@/features/availability/StaysExperience";
import { toRoomViews } from "@/features/availability/view-models";
import { todayInTimeZone } from "@/lib/today";
import { buildMetadata } from "@/seo/metadata";
import { getServices } from "@/server/services";

/**
 * Availability results across every property (section 02.2): where a search from the
 * booking bar lands when no property was chosen.
 *
 * It is a tool, not content. Whatever dates or guests the URL carries, the page is never
 * indexed and its canonical is the address without parameters, so no search can become a
 * page of its own in a search engine. Whether the bare address should one day be an
 * indexable directory is proposed in the section's decision record and left to Phase 04.
 *
 * A request that names a property (`?property=<slug>`, as the booking bar builds it) is sent
 * on to that property's own page, with the stay intact.
 *
 * The server renders what the site holds and asks no provider anything: availability is
 * fetched by the browser from /api/availability, so a slow or failing PMS can never delay
 * or break this response.
 */
export const metadata = buildMetadata({ title: "Chọn chỗ ở", path: (locale) => routes.stays(locale), noindex: true });

export default async function StaysPage({ searchParams }: { searchParams: Promise<QueryInput> }) {
  const query = await searchParams;
  const services = getServices();
  const properties = await services.properties.listProperties(site.defaultLocale);
  const usesMockBooking = env.bookingProvider === "mock";

  // Temporary (307), not permanent: the public URL words are still provisional.
  const propertyPage = legacyPropertyRedirect(query, properties.map((property) => property.slug), site.defaultLocale, { mockEnabled: usesMockBooking });
  if (propertyPage) redirect(propertyPage);

  // What is left names no property the site knows: the search covers all of them, without complaint.
  const { state, issues: parseIssues } = parseStaySearch(query);
  const search = { criteria: state.criteria, filters: {} };
  const rules = await services.booking.getStayRules();
  const today = todayInTimeZone(site.timeZone);
  const issues = [...parseIssues, ...validateCriteria(search.criteria, { rules, ...(today ? { today } : {}) })];

  const mockFromUrl = usesMockBooking ? parseMockAvailabilityScenario(query.mock) : undefined;
  const sample = usesMockBooking || properties.some((property) => property.source === "mock");

  return (
    <>
      {sample ? <SampleBanner /> : null}

      <StaysExperience
        cards={properties.map(toPropertyCardModel)}
        rooms={Object.fromEntries(properties.map((property) => [property.id, toRoomViews(property)]))}
        options={properties.map((property) => ({ id: property.id, slug: property.slug, name: property.identity.name, area: property.place.area.name }))}
        search={search}
        issues={issues}
        rules={rules}
        mock={usesMockBooking ? { fromUrl: mockFromUrl } : undefined}
      />

      {usesMockBooking ? (
        <DevScenarioPanel scenarios={MOCK_AVAILABILITY_SCENARIOS} fromUrl={mockFromUrl} configured={env.mockAvailabilityScenario} baseHref={routes.stays(site.defaultLocale, search)} />
      ) : null}
    </>
  );
}
