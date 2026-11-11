/** Scenario names for the mock booking provider. Described in src/integrations/booking/mock/provider.ts. */
export const MOCK_AVAILABILITY_SCENARIOS = [
  "mixed",
  "all-available",
  "with-rates",
  "partial-availability",
  "partial-failure",
  "stale-prices",
  "no-answer",
  "sold-out",
  "error",
  "timeout",
] as const;
export type MockAvailabilityScenario = (typeof MOCK_AVAILABILITY_SCENARIOS)[number];

export const MOCK_HANDOFF_SCENARIOS = ["not-integrated", "redirect", "embedded", "native", "offer-expired", "error"] as const;
export type MockHandoffScenario = (typeof MOCK_HANDOFF_SCENARIOS)[number];

/** A scenario named in a request, for development previews. Anything else is ignored, never an error. */
export function parseMockAvailabilityScenario(value: string | readonly string[] | undefined): MockAvailabilityScenario | undefined {
  const single = typeof value === "string" ? value : value?.[0];
  return (MOCK_AVAILABILITY_SCENARIOS as readonly string[]).includes(single ?? "") ? (single as MockAvailabilityScenario) : undefined;
}
