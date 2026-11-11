/**
 * Composition root: the one place that decides which implementation sits behind each port.
 * Routes and features call getServices() and never import an implementation directly.
 *
 * To connect a real provider: implement BookingProvider (src/domain/ports.ts) in
 * src/integrations/booking/<provider>/, mapping its responses into domain types inside that
 * folder, and return it here for a new BOOKING_PROVIDER value. Nothing else changes.
 */

import { consultation as consultationConfig } from "@/config/consultation";
import { env } from "@/config/env";
import type { Env } from "@/config/env";
import type { MockAvailabilityScenario } from "@/config/mock-scenarios";
import { routes } from "@/config/routes";
import { site } from "@/config/site";
import { draftPropertyRecords } from "@/content/drafts";
import { propertyRecords } from "@/content/properties";
import type { IsoDate } from "@/domain/dates";
import type { PropertyAvailabilityState, StayRequest } from "@/domain/hybrid-booking/property-availability";
import type { Simulation } from "@/domain/hybrid-booking/availability-simulation";
import type { BookingProvider, PropertyRepository } from "@/domain/ports";
import { resolveAllPropertyAvailability } from "@/integrations/booking/resolve-availability";
import { createMockBookingProvider } from "@/integrations/booking/mock/provider";
import { unconnectedBookingProvider } from "@/integrations/booking/none/provider";
import { mockPropertyRecords } from "@/integrations/content/mock/records";
import { createPropertyRepository } from "@/integrations/content/repository";
import { createEmailSink } from "@/integrations/consultation/email-sink";
import { createMockTransport, isMockConsultationOutcome } from "@/integrations/consultation/mock";
import { createResendTransport } from "@/integrations/consultation/resend";
import type { EmailTransport } from "@/integrations/consultation/transport";
import { createConsultationHandler, type ConsultationHandler, type ConsultationMode } from "./consultation";
import { consultationServiceLabel } from "./consultation-labels";

/**
 * The per-property availability states for one stay (hybrid booking). GoHost properties are asked through
 * the server-side adapter, ezCloud properties are never asked, and a failure is a state, never "sold out".
 */
export interface HybridAvailability {
  /** False unless env.availabilitySimulation (fail-closed): a simulation passed in is then ignored. */
  readonly simulationAllowed: boolean;
  resolveAll(stay: StayRequest, options?: { today?: IsoDate; simulation?: Simulation }): Promise<Record<string, PropertyAvailabilityState>>;
}

export interface Services {
  properties: PropertyRepository;
  booking: BookingProvider;
  hybridAvailability: HybridAvailability;
}

export function createServices(settings: Env): Services {
  const latency = () =>
    settings.mockLatencyMs > 0 ? new Promise<void>((resolve) => setTimeout(resolve, settings.mockLatencyMs)) : Promise.resolve();

  // "client-draft": VNest's draft records, for private local review only (refused elsewhere by env.ts).
  const records = settings.contentSource === "mock" ? mockPropertyRecords : settings.contentSource === "client-draft" ? draftPropertyRecords() : propertyRecords;
  const properties = createPropertyRepository(records, {
    enabledLocales: site.enabledLocales,
    ...(settings.contentSource === "mock" ? { latency } : {}),
  });

  const booking =
    settings.bookingProvider === "mock"
      ? createMockBookingProvider({
          properties,
          availabilityScenario: settings.mockAvailabilityScenario,
          handoffScenario: settings.mockHandoffScenario,
          engineUrl: new URL(routes.mockEngine, settings.siteUrl).toString(),
          latency,
        })
      : unconnectedBookingProvider;

  const simulationAllowed = settings.availabilitySimulation === true;
  const hybridAvailability: HybridAvailability = {
    simulationAllowed,
    resolveAll: (stay, options = {}) =>
      resolveAllPropertyAvailability(stay, {
        env: settings.providerCredentials,
        ...(options.today ? { today: options.today } : {}),
        // Enforced here, at the one place every caller goes through, not by the calling route.
        ...(simulationAllowed && options.simulation ? { simulation: options.simulation } : {}),
      }),
  };

  return { properties, booking, hybridAvailability };
}

const services = new Map<MockAvailabilityScenario | "configured", Services>();

/**
 * The services for this deployment. `mockAvailabilityScenario` lets a development preview
 * ask for one simulated scenario per request; it changes nothing unless the mock booking
 * provider is the one configured, so it can never alter what a real provider answers.
 */
export function getServices(options: { mockAvailabilityScenario?: MockAvailabilityScenario } = {}): Services {
  const scenario = env.bookingProvider === "mock" ? options.mockAvailabilityScenario : undefined;
  const key = scenario ?? "configured";
  let instance = services.get(key);
  if (!instance) {
    instance = createServices(scenario ? { ...env, mockAvailabilityScenario: scenario } : env);
    services.set(key, instance);
  }
  return instance;
}

/**
 * What the consultation form may tell visitors: "off" (not active, nothing is sent), "mock" (development simulation,
 * labelled) or "live" (a real provider is configured). Pages pass this string to the form; nothing else about delivery
 * reaches the browser.
 */
export function consultationMode(settings: Pick<Env, "consultation"> = env): ConsultationMode {
  return settings.consultation.delivery === "disabled" ? "off" : settings.consultation.delivery === "mock" ? "mock" : "live";
}

/** Nothing is ever sent from the mock, but composing still needs a syntactically valid sender. */
const MOCK_SENDER = "VNest Website (mock) <no-reply@example.invalid>";

/**
 * The consultation handler (src/server/consultation.ts) with the sink this deployment is configured for. To replace
 * email with a CRM, or add one, build another ConsultationSink here; the form and the endpoint do not change.
 */
export function createConsultation(settings: Env): ConsultationHandler {
  const { delivery, recipient, sender, credentials } = settings.consultation;
  const compose = {
    serviceLabel: consultationServiceLabel,
    sourceLabel: (path: string) => consultationConfig.sourcePages[path],
    timeZone: consultationConfig.timeZone,
    timeZoneLabel: consultationConfig.timeZoneLabel,
  };
  const sinkWith = (transport: EmailTransport, from: string) => createEmailSink({ transport, recipient, sender: from, ...compose });

  const live =
    delivery === "resend" && credentials.RESEND_API_KEY && sender
      ? sinkWith(createResendTransport({ apiKey: credentials.RESEND_API_KEY, timeoutMs: consultationConfig.providerTimeoutMs }), sender)
      : undefined;
  const mockSinks = new Map<string, ReturnType<typeof sinkWith>>();
  const mockSink = (outcome: string | null | undefined) => {
    const key = isMockConsultationOutcome(outcome) ? outcome : "sent";
    let sink = mockSinks.get(key);
    if (!sink) {
      sink = sinkWith(createMockTransport({ outcome: key, latencyMs: 600 }), MOCK_SENDER);
      mockSinks.set(key, sink);
    }
    return sink;
  };

  return createConsultationHandler({
    mode: consultationMode(settings),
    sink: (outcome) => (delivery === "mock" ? mockSink(outcome) : live),
    rateLimits: consultationConfig.rateLimits,
    duplicateWindowMs: consultationConfig.duplicateWindowMs,
  });
}

let consultationHandler: ConsultationHandler | undefined;

/** One handler per server process, so rate limits and duplicate detection see every request. */
export function getConsultation(): ConsultationHandler {
  consultationHandler ??= createConsultation(env);
  return consultationHandler;
}
