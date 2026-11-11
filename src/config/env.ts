/**
 * The only place environment variables are read. Server-side only: nothing here is exposed
 * to the browser. Invalid values fail loudly at start-up instead of producing a half-working site.
 *
 * Provider credentials, when a real provider exists, are added here as server-side variables
 * and never with a NEXT_PUBLIC_ prefix.
 */

import { isEmailAddress } from "../domain/consultation.ts";
import { CONSULTATION_RECIPIENT_DEFAULT } from "./consultation.ts";
import { MOCK_AVAILABILITY_SCENARIOS, MOCK_HANDOFF_SCENARIOS } from "./mock-scenarios.ts";

const DEPLOY_ENVS = ["development", "preview", "production"] as const;
/**
 * "client-draft" serves VNest's draft records (src/content/drafts) for a PRIVATE LOCAL review of
 * real content before approval (section 05.2). It refuses to start on a preview or production
 * deployment and can never be indexed.
 */
const CONTENT_SOURCES = ["mock", "files", "client-draft"] as const;
const BOOKING_PROVIDERS = ["mock", "none"] as const;
/**
 * Simulated per-property availability (`?sim=` on /dev/demo/tim-phong) for PRIVATE QA only. Off unless asked for
 * in so many words, and then honoured only on a declared, non-indexable development deployment (see `availabilitySimulation`).
 */
const AVAILABILITY_SIMULATION_SETTINGS = ["off", "private-review"] as const;

/**
 * Where consultation requests go (docs/handoff/BACKEND-HANDOFF.md §11).
 *   disabled  the default: the form says it is not active and sends nothing; the endpoint answers 503
 *   mock      development only: the server accepts and discards (or fails on request), nothing leaves the machine
 *   resend    real email through Resend's HTTP API; needs RESEND_API_KEY and a CONSULTATION_SENDER on a verified domain
 */
const CONSULTATION_DELIVERIES = ["disabled", "mock", "resend"] as const;
export type ConsultationDeliverySetting = (typeof CONSULTATION_DELIVERIES)[number];

export type ContentSource = (typeof CONTENT_SOURCES)[number];
export type BookingProviderSetting = (typeof BOOKING_PROVIDERS)[number];

export type DeployEnv = (typeof DEPLOY_ENVS)[number];

type Source = Readonly<Record<string, string | undefined>>;

function oneOf<T extends string>(source: Source, name: string, allowed: readonly T[], fallback: T): T {
  const value = source[name]?.trim();
  if (!value) return fallback;
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw new Error(`${name}="${value}" is not valid. Expected one of: ${allowed.join(", ")}.`);
}

function nonNegativeInt(source: Source, name: string, fallback: number): number {
  const value = source[name]?.trim();
  if (!value) return fallback;
  if (/^\d+$/.test(value)) return Number(value);
  throw new Error(`${name}="${value}" is not valid. Expected a whole number of milliseconds.`);
}

/** "Name <address>" or a bare address; the name may not contain quotes, angle brackets or line breaks. */
function mailbox(source: Source, name: string): string | undefined {
  const value = source[name]?.trim();
  if (!value) return undefined;
  const named = /^([^<>"\r\n]{1,64}?)\s*<([^<>\s]+)>$/.exec(value);
  const address = named?.[2] ?? value;
  if (/[\r\n]/.test(value) || !isEmailAddress(address)) {
    throw new Error(`${name}="${value}" is not valid. Expected an email address, optionally as "Name <address>".`);
  }
  return value;
}

/**
 * Consultation delivery, validated once. Real delivery is never switched on by accident: it needs the mode, a key and a
 * sender, all three, or the server refuses to start. The mock refuses anything but development, so a simulated
 * "sent" can never reach a real visitor.
 */
function consultationSettings(source: Source, deployEnv: DeployEnv) {
  const delivery = oneOf(source, "CONSULTATION_DELIVERY", CONSULTATION_DELIVERIES, "disabled");
  if (delivery === "mock" && deployEnv !== "development") {
    throw new Error(`CONSULTATION_DELIVERY="mock" is for local development only, not a ${deployEnv} deployment.`);
  }
  const recipient = mailbox(source, "CONSULTATION_RECIPIENT") ?? CONSULTATION_RECIPIENT_DEFAULT;
  if (/[<>]/.test(recipient)) throw new Error(`CONSULTATION_RECIPIENT="${recipient}" must be a bare address, without a name.`);
  const sender = mailbox(source, "CONSULTATION_SENDER");
  const resendApiKey = source.RESEND_API_KEY?.trim() || undefined;
  if (delivery === "resend") {
    const missing = [...(resendApiKey ? [] : ["RESEND_API_KEY"]), ...(sender ? [] : ["CONSULTATION_SENDER"])];
    if (missing.length > 0) {
      throw new Error(`CONSULTATION_DELIVERY="resend" needs ${missing.join(" and ")}. Leave CONSULTATION_DELIVERY unset (disabled) until the provider is set up.`);
    }
  }
  return { delivery, recipient, sender, resendApiKey };
}

const LOCAL_HOST = /^(localhost|0\.0\.0\.0|127(\.\d+){3}|\[::1\])$|\.(localhost|local|test|internal)$/;
const DEVELOPMENT_SITE_URL = "http://localhost:3000";

/**
 * The public origin behind canonical URLs, the sitemap and structured data.
 *
 * Development and previews may fall back to localhost: neither is ever indexed. Production
 * may not. A production deployment without a real public origin would publish localhost
 * canonicals, so it refuses to start instead of guessing.
 */
function siteUrl(source: Source, deployEnv: DeployEnv): URL {
  const value = source.SITE_URL?.trim();
  const production = deployEnv === "production";
  if (!value && production) {
    throw new Error("SITE_URL is required when the deployment is production. Set it to the public https origin of the site.");
  }
  let url: URL;
  try {
    url = new URL(value || DEVELOPMENT_SITE_URL);
  } catch {
    throw new Error(`SITE_URL="${value}" is not a valid URL.`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error(`SITE_URL="${value}" is not a valid URL. Expected http or https.`);
  if (production && (url.protocol !== "https:" || LOCAL_HOST.test(url.hostname))) {
    throw new Error(`SITE_URL="${value}" is not a public https origin, which a production deployment requires.`);
  }
  return url;
}

/**
 * What the hosting platform itself says about this deployment, when it says anything.
 *
 * Only Vercel's own variable can report production. Netlify's and Render's are read for one
 * purpose: to recognise a preview, so that a preview can never be declared into production
 * by a variable that was meant for the live site only. They can close a deployment and
 * never open one.
 *
 * A platform variable that is present but empty or unreadable closes the deployment too:
 * what cannot be read is never taken as "not a preview". One that is absent says nothing,
 * because a platform may not pass it to the running server.
 */
function platformEnv(source: Source): { env: DeployEnv; from: string } | undefined {
  const vercel = source.VERCEL_ENV;
  if (vercel !== undefined) {
    if (vercel.trim() === "") return { env: "preview", from: "VERCEL_ENV (present but empty)" };
    return { env: oneOf(source, "VERCEL_ENV", DEPLOY_ENVS, "development"), from: "VERCEL_ENV" };
  }
  if (source.NETLIFY?.trim() === "true" && source.CONTEXT !== undefined && source.CONTEXT.trim() !== "production") {
    return { env: "preview", from: `Netlify CONTEXT="${source.CONTEXT.trim()}"` };
  }
  if (source.RENDER?.trim() === "true" && source.IS_PULL_REQUEST !== undefined && source.IS_PULL_REQUEST.trim() !== "false") {
    return { env: "preview", from: `Render IS_PULL_REQUEST="${source.IS_PULL_REQUEST.trim()}"` };
  }
  return undefined;
}

/**
 * Which deployment this is, and how that is known.
 *
 *   declared   DEPLOY_ENV says so (an empty value counts as not set)
 *   platform   the hosting platform says so
 *   unknown    nothing says so: treated as development, so never indexable, and never as production
 *
 * When DEPLOY_ENV and the platform disagree, the one that is not production wins. Production
 * therefore needs every signal present to agree; a single preview signal is enough to refuse it.
 */
function deployment(source: Source): { deployEnv: DeployEnv; deployEnvSource: "declared" | "platform" | "unknown"; diagnostics: string[] } {
  const diagnostics: string[] = [];
  const raw = source.DEPLOY_ENV;
  if (raw !== undefined && raw.trim() === "") diagnostics.push("DEPLOY_ENV is set but empty, so it is ignored.");
  const declared = raw?.trim() ? oneOf(source, "DEPLOY_ENV", DEPLOY_ENVS, "development") : undefined;
  const platform = platformEnv(source);

  if (declared && platform && declared !== platform.env) {
    if (declared === "production") {
      diagnostics.push(`DEPLOY_ENV=production, but ${platform.from} says this is a ${platform.env} deployment. Treated as ${platform.env}: the site is not indexable.`);
      return { deployEnv: platform.env, deployEnvSource: "platform", diagnostics };
    }
    if (platform.env === "production") diagnostics.push(`${platform.from} says this is a production deployment, but DEPLOY_ENV=${declared}. Treated as ${declared}: the site is not indexable.`);
    return { deployEnv: declared, deployEnvSource: "declared", diagnostics };
  }
  if (declared) return { deployEnv: declared, deployEnvSource: "declared", diagnostics };
  if (platform) return { deployEnv: platform.env, deployEnvSource: "platform", diagnostics };

  // A production build or server that nobody has identified. Local development (`next dev`) is expected to be silent.
  if (source.NODE_ENV === "production") {
    diagnostics.push(
      "No deployment environment is declared (DEPLOY_ENV, or VERCEL_ENV on Vercel). Treated as development: the site is not indexable. " +
        "Set DEPLOY_ENV=production on the live site, or DEPLOY_ENV=preview or development to confirm this one.",
    );
  }
  return { deployEnv: "development", deployEnvSource: "unknown", diagnostics };
}

export function readEnv(source: Source) {
  const { deployEnv, deployEnvSource, diagnostics } = deployment(source);
  const contentSource = oneOf(source, "CONTENT_SOURCE", CONTENT_SOURCES, "mock");
  const bookingProvider = oneOf(source, "BOOKING_PROVIDER", BOOKING_PROVIDERS, "mock");
  const simulationRequested = oneOf(source, "AVAILABILITY_SIMULATION", AVAILABILITY_SIMULATION_SETTINGS, "off") === "private-review";
  if (simulationRequested && deployEnv !== "development") {
    throw new Error(`AVAILABILITY_SIMULATION="private-review" is for private local QA only, not a ${deployEnv} deployment.`);
  }
  const usesMockData = contentSource === "mock" || bookingProvider === "mock";
  if (contentSource === "client-draft" && deployEnv !== "development") {
    throw new Error(`CONTENT_SOURCE="client-draft" is for private local review only, not a ${deployEnv} deployment.`);
  }
  const origin = siteUrl(source, deployEnv);
  const consultation = consultationSettings(source, deployEnv);

  const requested = source.SITE_INDEXABLE?.trim();
  if (requested && requested !== "true" && requested !== "false") diagnostics.push(`SITE_INDEXABLE="${requested}" is not "true", so indexing stays off.`);
  const blockers = [
    ...(deployEnv === "production" ? [] : [`the deployment is ${deployEnvSource === "unknown" ? "not identified" : deployEnv}, not production`]),
    ...(usesMockData ? ["mock data is in use (CONTENT_SOURCE or BOOKING_PROVIDER)"] : []),
    ...(contentSource === "client-draft" ? ["draft client content is in use (CONTENT_SOURCE=client-draft)"] : []),
  ];
  if (requested === "true" && blockers.length > 0) diagnostics.push(`SITE_INDEXABLE=true has no effect: ${blockers.join("; ")}.`);

  // Production cannot reach this line with a local origin (siteUrl refuses it). Anything else that is
  // not plainly a local run would publish canonical and share addresses nobody can open, so it is said aloud.
  const localOrigin = LOCAL_HOST.test(origin.hostname);
  if (localOrigin && source.NODE_ENV === "production" && !(deployEnvSource === "declared" && deployEnv === "development")) {
    diagnostics.push(`SITE_URL is ${source.SITE_URL?.trim() ? "a local address" : "not set"}: canonical and share addresses use ${origin.origin}. Set SITE_URL to this deployment's public address.`);
  }

  return {
    siteUrl: origin,
    deployEnv,
    /** How `deployEnv` is known. "unknown" is never production. */
    deployEnvSource,
    contentSource,
    bookingProvider,
    usesMockData,
    /**
     * Search engines may index the site only when all of these hold: it is asked for in so
     * many words, this is confirmed to be the production deployment with a public https
     * origin (siteUrl refuses anything else in production), and nothing on it is simulated.
     * Previews, unidentified deployments and mock-backed builds can never be indexed,
     * whatever SITE_INDEXABLE says.
     */
    indexable: requested === "true" && deployEnv === "production" && !usesMockData && contentSource !== "client-draft",
    /**
     * Whether simulated availability may be shown at all. Fail-closed: true only when AVAILABILITY_SIMULATION=private-review
     * is set AND this is a DECLARED development deployment (an unidentified server is refused, it could be public). A route
     * name such as /dev/ grants nothing by itself; the composition root ignores any simulation unless this is true.
     */
    availabilitySimulation: simulationRequested && deployEnv === "development" && deployEnvSource === "declared",
    /** Configuration problems worth a line in the log. Printed once at start-up by next.config.ts; never fatal. */
    diagnostics: diagnostics as readonly string[],
    mockAvailabilityScenario: oneOf(source, "MOCK_AVAILABILITY_SCENARIO", MOCK_AVAILABILITY_SCENARIOS, "mixed"),
    mockHandoffScenario: oneOf(source, "MOCK_HANDOFF_SCENARIO", MOCK_HANDOFF_SCENARIOS, "not-integrated"),
    mockLatencyMs: nonNegativeInt(source, "MOCK_LATENCY_MS", 0),
    /**
     * Server credentials for the live booking providers (see integrations/booking/provider-config.ts).
     * Server-only: never serialised to a page. Absent values leave the provider "unconfigured".
     */
    /**
     * Consultation requests (§11 of the backend handoff). `delivery` is safe to tell a page ("is the form live?");
     * `credentials` is server-only and never serialised to a page.
     */
    consultation: {
      delivery: consultation.delivery,
      recipient: consultation.recipient,
      sender: consultation.sender,
      credentials: { RESEND_API_KEY: consultation.resendApiKey } as Readonly<Record<string, string | undefined>>,
    },
    providerCredentials: {
      GOHOST_API_BASE_URL: source.GOHOST_API_BASE_URL,
      GOHOST_API_KEY: source.GOHOST_API_KEY,
      GOHOST_RATE_PLAN_CONTRACT_CONFIRMED: source.GOHOST_RATE_PLAN_CONTRACT_CONFIRMED,
    } as Readonly<Record<string, string | undefined>>,
  } as const;
}

export type Env = ReturnType<typeof readEnv>;

export const env: Env = readEnv(process.env);
