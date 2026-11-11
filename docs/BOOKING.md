# Booking: domain, provider interface and backend requirements

Updated 24/10/2026 (VNest V3 multi-room booking journey integration). No real provider is connected. Nothing here describes an ezCloud or GoHost API: neither has been documented to this project, and none is implemented. For the V3 multi-room state adapter contract (`MultiRoomSearchState`), the distinction between room types, physical units, and live inventory quantity, and the EzCloud adapter checklist, see [`docs/decisions/ezcloud-multi-room-adapter-architecture.md`](file:///Users/noe/Documents/GitHub/VNest%202/docs/decisions/ezcloud-multi-room-adapter-architecture.md).

## 1. Principle

The application speaks one language, defined in `src/domain`. Each provider gets an adapter in `src/integrations/booking/<provider>/` that translates to and from it. Provider field names, identifiers and credentials never leave that folder.

Reason: VNest uses ezCloud today and is considering GoHost. Benefit: switching, or running a trial of the second provider, is one adapter and one environment value. No page, component or content record changes.

## 2. Domain contracts

| Concept | Type (file) | Notes |
|---|---|---|
| Stay date | `IsoDate` (`dates.ts`) | A calendar day at the property, kept as `YYYY-MM-DD`. Never a `Date`, so no timezone can shift it |
| Search criteria | `SearchCriteria`, `DatedCriteria` (`search.ts`) | `checkIn`, `checkOut`, `adults`. `children` is reserved until a provider supports it |
| Search scope | `BrowseFilters.property`, `SearchScope` (`search.ts`, `availability.ts`) | One property, or all of them. No property is the default and is never an error |
| URL state | `parseStaySearch`, `serializeCriteria` (`search.ts`) | The URL is the single source of truth. Parsing never throws; bad values become `CriteriaIssue`s |
| Stay rules | `StayRules` (`search.ts`) | Min/max nights, max adults. Provider-supplied; the site's validation is a courtesy |
| Availability | `RoomAvailability`, `AvailabilityResult` (`availability.ts`) | Per room: `available`, `sold-out` or `unknown`. An answer echoes the criteria it is for |
| Rate selection | `RateOffer`, `Price` (`availability.ts`) | A room has zero or more offers (rate plans). A price is `not-provided` or a `dated` total with an explicit taxes-and-fees status |
| Offer reference | `OfferRef` (`availability.ts`) | Opaque string issued by the provider for one room-and-rate selection. The site returns it untouched |
| Readiness | `getBookingReadiness` (`booking.ts`) | Exactly one of eight states per room (below) |
| Loading and failure | `availabilityReducer` (`availability-state.ts`) | `idle`, `loading`, `ready`, `failed`. Late responses for changed criteria are discarded |
| Hand-off | `BookingHandoff` (`booking.ts`) | `redirect`, `embedded`, `native`, `unavailable`, `not-integrated`, `error` |
| Capabilities | `BookingCapabilities` (`booking.ts`) | What a provider can actually do |

### Per-property outcomes, freshness and stale prices (added in section 02.2)

Additive: an answer written before these fields existed reads exactly as it did.

| Field or function | Meaning |
|---|---|
| `AvailabilityAnswer.failures` | Properties that were asked about and failed while others answered: `propertyId`, `reason`, `retryable`. A property is in `items` or in `failures`, never both |
| `getPropertyOutcome(result, propertyId)` | The single reading for one property: `answered` (with rooms), `failed`, or `no-answer`. A failure always wins, so a failed request can never be read as sold out. `findRoomAvailability` and `getBookingReadiness` go through it |
| `AvailabilityAnswer.fetchedAt` | When the provider produced the answer (ISO 8601 instant). Optional |
| `AvailabilityAnswer.validUntil` | Until when its prices and offers hold, only when the provider states it |
| `getPriceFreshness(answer, { now, maxAgeMs, obtainedAt })` | `fresh` (with the instant it ends), `stale` (`expired` or `aged`), or `undated`. Stale at the provider's validity or at the site's own age limit, whichever is first |
| `mergeAnswers(held, later, propertyIds)` | Folds a retry for some properties into the answer held. Keeps the older timestamps; refuses answers for another stay or source |
| `AvailabilityResponse.servedAt` | This site's clock when it answered. The browser measures age from it, not from its own clock |

What the page shows, and never confuses:

| State | Comes from |
|---|---|
| Available | Answered, with at least one room the party can book |
| Sold out | Answered, and the provider said sold out for every room |
| Availability unknown | No answer for the property, no provider connected, no usable offer, or no room takes the party |
| Provider error | The property is in `failures`, or the whole search failed |
| Stale | The answer's validity or the site's age limit has passed |

**A missing price is never a rate.** An offer whose price is `not-provided` is not selectable as a rate and no figure is shown for it. The room is presented as available with "Chưa có giá". What the guest can do next follows `capabilities.handoff`: with a hand-off mode declared, the room itself can be selected (a room, not a rate, with no price claimed); with none, nothing is offered to continue to. The page never says a later step will show a price, because no contract guarantees it. How a room without an offer price is handed over is a question for section 02.3 and the provider.

**The site bounds the wait.** `checkAvailability` answers `timeout` after `booking.providerTimeoutMs` (12 seconds, provisional) if the provider has not. An adapter that asks per property must bound each property's request below that and report the slow ones in `failures`, so one slow property never holds the others back.

The site's age limit is `booking.priceMaxAgeMs` in `src/config/booking.ts`: 15 minutes, **provisional**, the build team's assumption until a provider documents how long a quote holds.

### Booking readiness

| State | Meaning | Continue booking |
|---|---|---|
| `no-dates` | Browse mode | No |
| `invalid-criteria` | Dates or guests need correcting | No |
| `over-capacity` | More guests than the room takes (lower of content and provider limits). Judged first, so an offer cannot override it | No |
| `unverified` | Not loaded, failed, answered for other criteria, no offer, or the selected rate has expired | No |
| `unavailable` | Provider says sold out | No |
| `select-rate` | Available at several rates; the guest must choose | After choosing |
| `simulated` | Mock data says available | Development only, labelled |
| `bookable` | A real provider confirmed the selection | Yes |

Reason for a single function: "can this be booked?" is the highest-risk question on the site. Benefit: one tested answer, used by every screen, instead of conditions scattered through components.

### Failure states

`AvailabilityError.reason` is `network`, `timeout`, `provider`, `not-configured` or `unknown`, with a `retryable` flag. The UI can therefore distinguish "try again" from "booking is not available online" without knowing the provider.

There is no "confirmed" outcome anywhere. A completed reservation is only ever reported by the provider.

## 3. Provider interface

`BookingProvider` in `src/domain/ports.ts`:

```ts
interface BookingProvider {
  readonly id: string;                      // also the key of a property's provider mapping
  readonly capabilities: BookingCapabilities;
  getStayRules(propertyId?: string): Promise<StayRules>;
  searchAvailability(request: AvailabilityRequest): Promise<AvailabilityResult>;
  beginBooking(intent: BookingIntent, context: HandoffContext): Promise<BookingHandoff>;
}
```

`capabilities` declares `availability`, `rates`, `stayRules`, `children` and the supported `handoff` modes in order of preference. The UI offers only what is declared.

### Searching one property or all of them

The booking bar's property field is optional. The two searches reach a provider as one request shape:

```ts
interface AvailabilityRequest {
  criteria: DatedCriteria;
  scope: "single-property" | "all-properties";
  propertyIds: readonly string[];   // always explicit: one id, or every eligible property's id
}
```

| | Single property | All properties (default) |
|---|---|---|
| Search state | `propertyId` set | `propertyId = null` |
| URL | `?property=<slug>&checkIn=…` | no `property` parameter |
| `scope` | `single-property` | `all-properties` |
| `propertyIds` | one id | every property the site serves |

Rules for an adapter, to be honoured in Phase 02.2 and by any real provider:

- The site resolves "all" to an explicit list (`resolveSearchScope` in `src/server/availability.ts`). An adapter never decides which properties exist.
- **If the PMS has no multi-property search, the adapter asks once per property and merges the answers.** Whether ezCloud or GoHost offer a multi-property call is unknown; neither is assumed to.
- A property with no mapping to the provider gets no answer. Nothing is claimed about it.
- One property failing must not hide the others. An adapter reports it in `failures` and still returns the properties that answered. Only when nothing could be asked at all does the search fail as a whole.
- An adapter stamps `fetchedAt` when the provider gives a time, and `validUntil` only when the provider states one. Neither is ever made up.
- Identifiers are VNest property ids on the way in and out. Display names are never identifiers.

Promotional codes are not part of the search. They may belong to a later booking stage and are not modelled.

### Hand-off modes

| Mode | What it means | What the site needs from the provider |
|---|---|---|
| `redirect` | The guest continues on the provider's hosted pages | A URL that carries the selection; ideally a return URL |
| `embedded` | The provider's engine is shown inside a VNest page | An embeddable URL that accepts the selection |
| `native` | Checkout on the VNest site | A documented booking and payment API. Only a session reference (`CheckoutRef`) is modelled; guest details, payment and confirmation are added when such an API is documented |

No provider is assumed to support any of the three. A provider that supports none declares `handoff: []`, and the site falls back to stating that online booking is not connected.

### Implementations today

| Adapter | Use | Behaviour |
|---|---|---|
| `mock` | Development only | Scenario-driven (`MOCK_AVAILABILITY_SCENARIO`, `MOCK_HANDOFF_SCENARIO`; ten availability scenarios, listed in the adapter, selectable per request on `/stays` with `?mock=`). Every answer is `source: "mock"`, which the domain turns into `simulated`, never `bookable`. Simulated totals are obviously artificial whole figures from 1,000,000 VND per night, and simulated terms say they are simulated |
| `none` | Publishing content before a provider is connected | Claims nothing; booking is `not-integrated` |

A mock-backed build can never be indexed (see `ARCHITECTURE.md`).

### Adding a provider

1. Obtain its documentation and test credentials. Do not write an adapter from guesswork.
2. Create `src/integrations/booking/<provider>/`, implement `BookingProvider`, and map responses to domain types inside it.
3. Add credentials to `src/config/env.ts` as server-side variables (never `NEXT_PUBLIC_`), and the provider name to `BOOKING_PROVIDERS`.
4. Return the adapter from `createServices` in `src/server/services.ts`.
5. Add each property's identifiers under `booking.providers.<provider>` in its record.
6. Write adapter tests against recorded responses.

## 4. Server boundary

The browser never talks to a provider. It calls `GET /api/availability?property=<slug>&checkIn=&checkOut=&adults=` on this site (`property` is optional: without it every property is searched), which validates the criteria and calls the adapter. Responses are `Cache-Control: no-store` and `noindex`.

Reason: credentials and privileged operations must stay server-side. Benefit: keys cannot leak into the browser bundle, provider identifiers are not exposed, and rate limiting or caching can be added in one place.

`beginBooking` will be exposed the same way in Phase 02 (a server action or `POST` route), never called from the browser directly.

## 5. Who owns which data

| Data | Owner | Where it lives |
|---|---|---|
| Property identity, story, positioning | VNest | Property record |
| Photography, video, alt text | VNest | Property record |
| Amenity descriptions, nearby experiences | VNest | Property record |
| Room type names, descriptions, editorial capacity | VNest | Property record |
| SEO titles, descriptions, structured-data facts | VNest | Property record |
| Indicative "from" prices, if VNest chooses to state them | VNest (verified, dated) | `rateReferences`. Never bookable, never in structured data |
| Mapping of VNest ids to provider ids | VNest | `booking.providers` in the record. Identifiers only |
| Availability for given dates | PMS | `searchAvailability` |
| Bookable prices, rate plans, taxes and fees | PMS | `RateOffer` |
| Cancellation and payment terms per rate | PMS | `RateOffer` |
| Stay restrictions (min/max nights, closed dates) | PMS | `getStayRules` |
| Operational occupancy limit | PMS | `RoomAvailability.maxOccupancy`; the lower of this and the content limit applies |
| Reservation, payment, confirmation | PMS | Hand-off |

General policies (house rules, check-in times) are editorial content unless the provider is their source of truth. To be confirmed with VNest.

## 6. Backend integration requirements

What is needed from ezCloud, GoHost or VNest's backend team before an adapter can be written:

| Topic | Question |
|---|---|
| Access | Is there a documented API, an embeddable engine, a hosted booking page, or a combination? Test credentials? |
| Authentication | Method, key rotation, IP restrictions, whether calls must come from a fixed server |
| Identifiers | Property and room-type ids for each of the six properties |
| Availability | Request and response shape; can several properties be queried at once? |
| Rates | Rate plans, currency, taxes and fees, inclusions; is the price a total or per night? |
| Offer reference | Is there a quote or token identifying one bookable selection, and how long does it live? |
| Stay rules | Are minimum nights, closed dates and cut-off times returned, or only enforced by rejection? |
| Guests | Children, extra beds, per-room occupancy limits |
| Hand-off | Do dates, guests and the selected rate survive the move? Is there a return URL? What happens when a room sells out mid-flow? |
| Payment and confirmation | Who takes payment and who shows and sends the confirmation? |
| Limits | Rate limits, expected response time, permitted caching |
| Languages | Is provider text (rate plan names, policies) available in more than one language? |
| Timezone | Does the provider return the property's timezone or current local date? |

Requests that would make integration cleaner: return stay dates as `YYYY-MM-DD` not timestamps; echo the criteria an answer is for; issue one opaque reference per bookable selection; return restrictions explicitly.
