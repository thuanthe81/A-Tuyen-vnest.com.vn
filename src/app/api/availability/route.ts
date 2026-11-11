import { parseMockAvailabilityScenario } from "@/config/mock-scenarios";
import { checkAvailability } from "@/server/availability";
import { getServices } from "@/server/services";

/**
 * GET /api/availability?property=<slug>&checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&adults=2
 * `property` is optional: without it the search covers every property.
 *
 * `mock=<scenario>` picks a simulated scenario for development previews; it is ignored unless
 * the mock provider is the one configured.
 *
 * The only way the browser learns about availability. Answers depend on the moment they
 * are asked, so they are never cached and never indexed.
 */
export async function GET(request: Request) {
  const query = Object.fromEntries(new URL(request.url).searchParams);
  const outcome = await checkAvailability(getServices({ mockAvailabilityScenario: parseMockAvailabilityScenario(query.mock) }), query);
  return Response.json(outcome.body, {
    status: outcome.status,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
}
