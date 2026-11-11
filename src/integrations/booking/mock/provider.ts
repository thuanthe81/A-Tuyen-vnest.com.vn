import type { AvailabilityAnswer, OfferRef, Price, PropertyAvailability, PropertyFailure, RateOffer, RoomAvailability } from "@/domain/availability";
import type { MockAvailabilityScenario, MockHandoffScenario } from "@/config/mock-scenarios";
import type { BookingHandoff, CheckoutRef, HandoffMode } from "@/domain/booking";
import { nightsBetween } from "@/domain/dates";
import { DEFAULT_LOCALE } from "@/domain/locale";
import type { BookingProvider, PropertyRepository } from "@/domain/ports";

const OFFER_PREFIX = "mock-offer:";
/** Obviously artificial, so a simulated total can never be mistaken for a real rate. */
const SIMULATED_NIGHTLY_VND = 1_000_000;
/** How long the "stale-prices" scenario says its prices hold. Short, so the stale state can be watched arriving. */
const SIMULATED_VALIDITY_MS = 20_000;

/**
 * Simulated rate plans. Names and terms are placeholders that say so: no real plan, inclusion
 * or policy is described. The first two exist for every priced room; the last two only for the
 * fourth property, to exercise a room with more plans than the page shows at once.
 */
const SIMULATED_PLANS = [
  { id: "standard", name: "Gói giá mẫu 1", step: 0, taxesAndFees: "unknown" },
  { id: "flexible", name: "Gói giá mẫu 2", step: 1, taxesAndFees: "included", inclusions: ["Quyền lợi mẫu 1"], terms: true },
  { id: "plan-3", name: "Gói giá mẫu 3", step: 2, taxesAndFees: "excluded", inclusions: ["Quyền lợi mẫu 1", "Quyền lợi mẫu 2"], terms: true },
  { id: "plan-4", name: "Gói giá mẫu 4", step: 3, taxesAndFees: "included", terms: true },
] as const;

const PRICED: readonly MockAvailabilityScenario[] = ["with-rates", "partial-availability", "partial-failure", "stale-prices"];

/**
 * SIMULATED booking provider, for development only. It stands in for a PMS so every state
 * of the booking UI can be built and reviewed before a real provider is connected.
 *
 * Availability follows the scenario, not the dates asked for. "Property 1" is the first
 * property in the content repository, and so on, whichever properties a search asks about:
 *
 *   mixed                 first room type of each property available, the rest sold out; no prices
 *   all-available         every room type available at two rate plans; no prices
 *   with-rates            as all-available, with simulated totals, terms and inclusions
 *   partial-availability  priced; every second property (2, 4, 6) is sold out
 *   partial-failure       priced; in a search across properties, property 3 fails, property 5
 *                         gets no answer and property 6 is sold out. Asked for alone, each answers,
 *                         so retrying one failed property can be seen to succeed
 *   stale-prices          priced; the answer says its prices hold for 20 seconds
 *   no-answer             the search succeeds and says nothing about any property
 *   sold-out              every room type sold out
 *   error                 the search fails, retryable
 *   timeout               the search fails as a timeout, retryable
 *
 * Simulated totals are whole millions of đồng per night, raised by 200,000 per property and
 * per room and by 150,000 per rate plan, so "from" prices and sorting have something to compare.
 *
 * Two rules are never simulated away: a property that is not mapped to this provider gets
 * no answer, and a room is never offered to more guests than its maxOccupancy.
 *
 * Every answer is marked source: "mock", which the domain turns into "simulated", never
 * "bookable". The hand-off scenario lets each of the three hand-off modes be exercised.
 */
export function createMockBookingProvider(options: {
  properties: PropertyRepository;
  availabilityScenario: MockAvailabilityScenario;
  handoffScenario: MockHandoffScenario;
  /** Where the redirect and embedded scenarios point: a stand-in engine page on this site. */
  engineUrl: string;
  latency?: () => Promise<void>;
  /** The clock that stamps answers. Injected so tests are exact. */
  now?: () => Date;
}): BookingProvider {
  const { properties, availabilityScenario: scenario, handoffScenario, engineUrl, latency = () => Promise.resolve(), now = () => new Date() } = options;
  const handoffModes: readonly HandoffMode[] =
    handoffScenario === "redirect" || handoffScenario === "embedded" || handoffScenario === "native" ? [handoffScenario] : [];
  const priced = PRICED.includes(scenario);

  return {
    id: "mock",
    capabilities: {
      availability: true,
      rates: priced,
      stayRules: false,
      children: false,
      handoff: handoffModes,
    },

    async getStayRules() {
      // No stay restrictions are invented. A real provider supplies them.
      return {};
    },

    async searchAvailability({ criteria, propertyIds }) {
      await latency();
      if (scenario === "error") return { status: "error", reason: "provider", retryable: true };
      if (scenario === "timeout") return { status: "error", reason: "timeout", retryable: true };

      const fetchedAt = now();
      const stamp: Pick<AvailabilityAnswer, "fetchedAt" | "validUntil"> = {
        fetchedAt: fetchedAt.toISOString(),
        ...(scenario === "stale-prices" ? { validUntil: new Date(fetchedAt.getTime() + SIMULATED_VALIDITY_MS).toISOString() } : {}),
      };
      if (scenario === "no-answer") return { status: "ok", criteria, items: [], source: "mock", ...stamp };

      const nights = nightsBetween(criteria.checkIn, criteria.checkOut);
      const offersFor = (roomTypeId: string, propertyIndex: number, roomIndex: number): RateOffer[] => {
        const plans = scenario === "mixed" ? SIMULATED_PLANS.slice(0, 1) : SIMULATED_PLANS.slice(0, priced && propertyIndex === 3 ? 4 : 2);
        return plans.map((plan): RateOffer => {
          const nightly = SIMULATED_NIGHTLY_VND + 200_000 * (propertyIndex + roomIndex) + 150_000 * plan.step;
          const price: Price = priced
            ? { kind: "dated", total: { amount: nightly * nights, currency: "VND" }, nights, taxesAndFees: plan.taxesAndFees }
            : { kind: "not-provided" };
          return {
            offerRef: `${OFFER_PREFIX}${roomTypeId}:${plan.id}` as OfferRef,
            // The mixed scenario stands for a provider that distinguishes no rate plans.
            ...(scenario === "mixed" ? {} : { ratePlan: { id: plan.id, name: plan.name, ...(priced && "inclusions" in plan ? { inclusions: plan.inclusions } : {}) } }),
            price,
            ...(priced && "terms" in plan
              ? { cancellationPolicy: "Điều kiện huỷ mẫu. Dữ liệu mô phỏng, không phải chính sách thật.", paymentTerms: "Điều kiện thanh toán mẫu. Dữ liệu mô phỏng." }
              : {}),
          };
        });
      };

      const acrossProperties = propertyIds.length > 1;
      const targets = await Promise.all(propertyIds.map((id) => properties.getBookingTarget(id, "mock")));
      // A property's place in the repository, so it behaves the same asked for alone or with the others.
      const order = (await properties.listProperties(DEFAULT_LOCALE)).map((property) => property.id);
      const items: PropertyAvailability[] = [];
      const failures: PropertyFailure[] = [];

      targets.forEach((target) => {
        if (!target?.mapping) return;
        const propertyIndex = order.indexOf(target.propertyId);
        if (scenario === "partial-failure" && acrossProperties) {
          if (propertyIndex === 2) return void failures.push({ propertyId: target.propertyId, reason: "provider", retryable: true });
          if (propertyIndex === 4) return;
        }
        const propertySoldOut =
          scenario === "sold-out" ||
          (scenario === "partial-availability" && propertyIndex % 2 === 1) ||
          (scenario === "partial-failure" && acrossProperties && propertyIndex === 5);

        const rooms = target.rooms.map((room, roomIndex): RoomAvailability => {
          if (room.maxOccupancy !== undefined && criteria.adults > room.maxOccupancy) {
            return { roomTypeId: room.roomTypeId, status: "unknown", offers: [], maxOccupancy: room.maxOccupancy };
          }
          const available = !propertySoldOut && (scenario !== "mixed" || roomIndex === 0);
          return {
            roomTypeId: room.roomTypeId,
            status: available ? "available" : "sold-out",
            offers: available ? offersFor(room.roomTypeId, propertyIndex, roomIndex) : [],
            ...(room.maxOccupancy !== undefined ? { maxOccupancy: room.maxOccupancy } : {}),
          };
        });
        items.push({ propertyId: target.propertyId, rooms });
      });

      return { status: "ok", criteria, items, source: "mock", ...(failures.length > 0 ? { failures } : {}), ...stamp };
    },

    async beginBooking(intent, context): Promise<BookingHandoff> {
      await latency();
      // Only a reference this provider issued for this room is accepted.
      if (!intent.offerRef.startsWith(`${OFFER_PREFIX}${intent.roomTypeId}:`)) return { kind: "unavailable", reason: "offer-expired" };

      switch (handoffScenario) {
        case "not-integrated":
          return { kind: "not-integrated" };
        case "offer-expired":
          return { kind: "unavailable", reason: "offer-expired" };
        case "error":
          return { kind: "error", reason: "provider", retryable: true };
        case "native":
          return { kind: "native", checkoutRef: `mock-checkout:${intent.offerRef}` as CheckoutRef };
        case "redirect":
        case "embedded": {
          const url = new URL(engineUrl);
          url.searchParams.set("offer", intent.offerRef);
          url.searchParams.set("return", context.returnUrl);
          return handoffScenario === "redirect" ? { kind: "redirect", url: url.toString() } : { kind: "embedded", frameUrl: url.toString() };
        }
      }
    },
  };
}
