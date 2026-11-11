import type { BookingIntegrationBlockerCode } from "@/domain/hybrid-booking/property-availability";
import { evaluatePropertyBookingReadiness, propertiesForBookingProvider } from "./property-provider-routing";

/**
 * SERVER-ONLY PROVIDER CONFIGURATION.
 *
 * Reads credentials from the deployment environment. Nothing here may be imported by a client
 * component (a test enforces this) and no value ever leaves the server: the UI receives only the
 * resulting availability states. No credential is committed; the variable names below are VNest's own
 * and are filled from the provider's real documentation when it is supplied.
 *
 *   GOHOST_API_BASE_URL   official API base URL supplied by GoHost
 *   GOHOST_API_KEY        server credential
 *   GOHOST_RATE_PLAN_CONTRACT_CONFIRMED=true   only after VNest confirms rate-plan and tax rules
 *
 * Property and room-type identifiers are NOT environment values: they come from the mapping in
 * `property-provider-routing.ts` (`providerPropertyRef`, `roomRefs`), which VNest has to supply. Those
 * are empty, so GoHost stays `unconfigured` until they are filled.
 */
export type ProviderEnvSource = Readonly<Record<string, string | undefined>>;
type Source = ProviderEnvSource;

export type GoHostRuntimeConfig = {
  readonly baseUrl: string | null;
  readonly apiKey: string | null;
  readonly ratePlanContractConfirmed: boolean;
};

export type ProviderBlockers = Readonly<Record<string, readonly BookingIntegrationBlockerCode[]>>;

function clean(value: string | undefined): string | null {
  const text = value?.trim();
  return text ? text : null;
}

export function readGoHostConfig(source: Source): GoHostRuntimeConfig {
  const baseUrl = clean(source.GOHOST_API_BASE_URL);
  let safeBase: string | null = null;
  if (baseUrl) {
    try {
      safeBase = new URL(baseUrl).protocol === "https:" ? baseUrl : null;
    } catch {
      safeBase = null;
    }
  }
  return {
    baseUrl: safeBase,
    apiKey: clean(source.GOHOST_API_KEY),
    ratePlanContractConfirmed: clean(source.GOHOST_RATE_PLAN_CONTRACT_CONFIRMED) === "true",
  };
}

/**
 * Per-property readiness blockers for GoHost. Uses the routing module's readiness check, so a property
 * counts as configured only when endpoint, credentials, property id, every room mapping and the rate
 * contract are all present.
 */
export function goHostBlockers(config: GoHostRuntimeConfig): ProviderBlockers {
  const result: Record<string, readonly BookingIntegrationBlockerCode[]> = {};
  for (const propertyId of propertiesForBookingProvider("gohost")) {
    const report = evaluatePropertyBookingReadiness(propertyId, {
      providerId: "gohost",
      endpointUrl: config.baseUrl,
      hasServerCredentials: config.apiKey !== null,
      ratePlanContractConfirmed: config.ratePlanContractConfirmed,
    });
    result[propertyId] = report.blockers;
  }
  return result;
}
