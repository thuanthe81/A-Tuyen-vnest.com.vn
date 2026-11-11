# Phase 01 handoff: technical foundation

Date: 09/10/2026. Branch: `feat/vnest-v2-booking-first`. Scope: foundation only, as authorised.

**State:** complete and verified locally. Nothing is committed, pushed or deployed. V1 (`VNest-`, commit `fd129c3`) is unchanged.

Not built, by instruction: homepage, hero, booking search interface, property pages, any visual component. The only page is a two-line placeholder that confirms the app runs.

## 1. File and folder architecture

```
.github/workflows/ci.yml        lint, typecheck, test, build on every push and pull request
.env.example                    every setting, with safe defaults
eslint.config.mjs               Next rules plus three architecture boundary rules
next.config.ts                  noindex response header on every non-indexable build
test/register.mjs               lets Node's test runner resolve the "@/" alias
docs/
  ARCHITECTURE.md               structure, decisions, SEO
  BOOKING.md                    booking domain, provider interface, data ownership, backend requirements
  CONTENT_MODEL.md              property record, distinctiveness, validation
  phases/PHASE-01-HANDOFF.md    this file
src/
  app/
    layout.tsx  page.tsx  not-found.tsx  globals.css
    robots.ts  sitemap.ts
    api/availability/route.ts   the only way the browser learns about availability
  domain/                       pure TypeScript, no framework, no vendor names
    dates.ts                    calendar dates as strings                      (V1, unchanged)
    search.ts                   criteria, URL codec, validation               (V1, adapted)
    booking.ts                  readiness, intent, hand-off, capabilities     (V1, extended)
    availability.ts             rooms, rate offers, prices, failures          (V1, redesigned)
    availability-state.ts       loading and failure lifecycle                 (new)
    locale.ts                   languages and translatable text               (new)
    media.ts                    image and video assets                        (new)
    property.ts                 property content model                        (new, replaces V1 catalog)
    property-validation.ts      the content gate                              (new)
    ports.ts                    PropertyRepository, BookingProvider           (V1 pattern, redesigned)
  content/
    properties/index.ts         real property records: empty until supplied
    layouts.ts                  registry of editorial layout templates
  integrations/
    booking/mock/provider.ts    scenario-driven simulated provider, development only
    booking/none/provider.ts    "no provider connected"
    content/repository.ts       serves records in one language
    content/mock/records.ts     three neutral sample properties
  server/
    services.ts                 composition root: picks implementations from env
    availability.ts             availability use case behind the API route
  seo/
    metadata.ts  structured-data.ts  sitemap.ts  urls.ts  JsonLd.tsx
  config/
    env.ts  routes.ts  site.ts  mock-scenarios.ts
  styles/
    tokens.css  theme-contract.ts
  lib/today.ts
```

About 2,100 lines of source and 990 lines of tests. Runtime dependencies: `next`, `react`, `react-dom`. No CMS, animation library, monorepo tooling, test framework or validation library was added.

## 2. Summary of source changes

- Scaffolded a Next.js 16 App Router application with strict TypeScript, Tailwind 4 and ESLint.
- Ported V1's domain logic after review, and extended it for rate selection, three hand-off modes, provider capabilities and explicit failure states.
- Replaced V1's flat catalog with a structured property content model, including languages, media, presentation and provider mapping.
- Added a content validator that runs in CI over every record.
- Added a scenario-driven mock booking provider and a "not connected" provider.
- Added a server-side availability endpoint.
- Built the SEO layer: metadata, canonical URLs, language alternates, structured data, sitemap, robots, and three independent indexing locks.
- Added a neutral design-token foundation wired into Tailwind.
- Added CI, an environment template and documentation.

## 3. Reused V1 domain code and tests

V1's 33 domain tests were run first and passed. Each file was then reviewed for suitability:

| V1 file | Decision | Why |
|---|---|---|
| `domain/dates.ts` and its 5 tests | Copied byte for byte | String-based calendar arithmetic with no timezone exposure; nothing to improve |
| `domain/search.ts` and its 14 tests | Ported; `brand` filter removed, `sameCriteria` and slug helpers added | The brand filter belonged to V1's three-brand model, which V2 has not confirmed. 15 tests now |
| `domain/booking.ts` and its 14 tests | Ported and extended | Readiness logic and the over-capacity regression test kept. Added `select-rate`, expired-rate handling, hand-off modes, capabilities. 16 tests now |
| `domain/availability.ts` | Redesigned | V1 allowed one offer per room; V2 needs several rate plans per room and explicit tax status |
| `domain/catalog.ts` | Replaced by `property.ts` | Too thin for distinctive properties, video, nearby experiences and languages |
| `domain/ports.ts`, `data/container.ts`, `config/env.ts`, `config/routes.ts` | Pattern reused, contents rewritten | The composition-root and single-reader ideas were sound |
| `lib/dates.ts` (`todayInTimeZone`) | Ported to `lib/today.ts` with an injectable clock | Now testable |
| `domain/partner.ts`, lead submission | Not ported | Outside the approved V2 scope |
| All UI, CSS, fixtures, studies, images | Not ported | By instruction |

## 4. Booking domain and provider interface

Full detail in [BOOKING.md](../BOOKING.md). In short:

- **One port**, `BookingProvider`: `capabilities`, `getStayRules`, `searchAvailability`, `beginBooking`.
- **Capabilities are declared, not assumed.** A provider states whether it has availability, rates, stay rules, children, and which of `redirect`, `embedded`, `native` it supports. The UI offers only those.
- **Readiness is one function** returning one of eight states. "Continue booking" is possible only with a provider-issued offer reference.
- **Failure is a value** with a reason and a `retryable` flag.
- **Mock answers can never read as real**: they are marked `mock`, which the domain turns into `simulated`.
- **No ezCloud or GoHost code exists.** Neither API has been documented to this project.

## 5. Property content schema

Full detail in [CONTENT_MODEL.md](../CONTENT_MODEL.md). One `PropertyRecord` covers identity and signature visual, narrative and positioning, photography and video, amenities, place and nearby experiences, rooms and rate references, policies, SEO, presentation, and provider mapping.

Distinctiveness has three levers: a layout template per editorial treatment, typed editorial sections with variants, and theme tokens. Tokens are the lightest, not the main one.

No real property is in the repository. The registry is empty and the three sample records use neutral names.

## 6. SEO architecture decisions

Full detail in [ARCHITECTURE.md](../ARCHITECTURE.md), section 3.

| Decision | Reason | Benefit |
|---|---|---|
| Availability is fetched after load, never during page render | Reading dates in render made every V1 property page dynamic | Property pages can be static and cached; a PMS outage cannot break content |
| Canonical URL never includes query parameters | A page opened with dates is the same page | One indexable address per property |
| Structured data only from approved records and present fields; no price or rating markup | Unverified markup risks search penalties | Nothing false can reach a search engine |
| Indexing needs the flag, production, and no mock data | Previews and sample pages must never be listed | Three locks: robots.txt, meta tag, response header |
| Vietnamese required, other languages per-record approval | English must not be published without approved translations | Draft translations can be written safely |

## 7. Backend integration requirements

The full question list is in [BOOKING.md](../BOOKING.md), section 6. The blocking items:

1. ezCloud documentation and test credentials: API, embeddable engine, hosted page, or a combination.
2. Property and room-type identifiers for each of the six properties.
3. Whether a quote or token identifies one bookable selection, and how long it lives.
4. Who takes payment and who shows the confirmation.
5. Rate limits and permitted caching.

## 8. Tests executed and results

Run on 09/10/2026, Node 24.21, on the final tree.

| Check | Result |
|---|---|
| `npm run lint` | Pass, no warnings |
| `npm run typecheck` | Pass |
| `npm test` | **87 passed, 0 failed** |
| `npm run build` | Pass. `/`, `/robots.txt`, `/sitemap.xml` static; `/api/availability` dynamic |
| V1 `npm test`, before porting | 33 passed |

| Test file | Tests | Covers |
|---|---|---|
| `domain/dates.test.ts` | 5 | Real dates only, night counts, daylight-saving safety |
| `domain/search.test.ts` | 15 | URL parsing and round-trip, validation, stay rules |
| `domain/booking.test.ts` | 16 | All readiness states, capacity, rate selection, expired rates |
| `domain/availability-state.test.ts` | 5 | Loading, failure, late and mismatched responses |
| `domain/locale.test.ts` | 5 | Resolution, fallback, missing translations |
| `domain/property-validation.test.ts` | 7 | References, ids, languages, publication rules |
| `content/content.test.ts` | 3 | Every real and mock record passes the content gate |
| `integrations/integrations.test.ts` | 11 | Repository, every mock scenario, hand-off modes, unconnected provider |
| `config/config.test.ts` | 5 | Safe defaults, indexing rule, invalid values, routes |
| `server/availability.test.ts` | 7 | 400 and 404, browse mode, invalid criteria, provider failure |
| `seo/seo.test.ts` | 8 | Canonical, noindex, alternates, structured data, sitemap |

Checked against the running app: the placeholder page renders with `lang="vi"`, a `noindex` meta tag and an `X-Robots-Tag: noindex` header; `robots.txt` disallows everything; the sitemap is empty; `/api/availability` returns the mock answer with `Cache-Control: no-store`, 400 without a property and 404 for an unknown one; tokens resolve through Tailwind; no console errors.

Not tested: CI itself has not run, because the repository has no remote. No browser or accessibility tests exist yet, because there is no interface to test.

## 9. Technical risks and unresolved dependencies

| Risk | Effect | Mitigation in place |
|---|---|---|
| ezCloud's capabilities are unknown | If it offers only a hosted page, on-site booking stops at search plus redirect | Capabilities and three hand-off modes are modelled; the UI adapts to what is declared |
| The rate and offer shapes are a proposal | A real API may not issue an offer reference or may price differently | All provider shapes are confined to the adapter; the domain changes in one place |
| No real property content | The property model is untested against real content; Phase 04 and 05 cannot be judged on samples | Sample records exercise incomplete content; the content gate is ready |
| Identity not supplied | Tokens are neutral placeholders | One file to change |
| URL words and slug language undecided | Changing an indexed URL later costs ranking | All URLs built in one file; must be settled before launch |
| A second language changes route structure | Public routes move under a locale segment | All links come from `routes.ts`, so the move is mechanical |
| No remote | The work exists on one machine and CI has never run | Repository is ready: ignore rules, lockfile, CI workflow, README |
| Hosting undecided | Preview protection and environment variables are host-specific | Indexing lock is host-independent |
| Brand relationship unclear | Property pages may compete in search with existing brand sites | `brandId` is optional; canonical strategy to be decided with VNest |

## 10. Recommended Phase 02: booking experience

Goal: a reusable booking experience that works against the mock provider in every state, ready to place in the hero (Phase 03) and on property pages (Phase 05).

| Step | Content | Review point |
|---|---|---|
| 2.1 | Decisions: date-picker approach (native inputs or a custom calendar), guest model (adults only, or children), and the mobile pattern | Before any build |
| 2.2 | Interface copy in Vietnamese for every state, as a typed content file | Wording review |
| 2.3 | `useStaySearch` hook: URL as the source of truth, validation, submit target. No markup | Logic tests |
| 2.4 | `useAvailability` hook on `availabilityReducer` and `/api/availability`, with request cancellation | Logic tests |
| 2.5 | Search form components: dates, guests, submit. Mobile first, keyboard and screen-reader complete, 44 px targets | Design review, 390 px then 1440 px |
| 2.6 | Availability and rate selection: every readiness state, including loading, failure, sold out, over capacity, several rates, price with unknown tax status | State-by-state review using the mock scenarios |
| 2.7 | Hand-off: a server action for `beginBooking`, and the redirect, embedded and not-connected outcomes; a stand-in engine page under `/dev/` for the mock | Flow review |
| 2.8 | A `/dev/booking` workbench page (never indexed) showing every state side by side | Used for all Phase 02 reviews |
| 2.9 | QA: accessibility audit, mobile performance budget, documentation update, Phase 02 handoff | Sign-off |

Dependencies to add in Phase 02: none planned. A calendar would be built on native elements unless step 2.1 decides otherwise.

Inputs that would help before Phase 02 starts: ezCloud documentation (so the UI is designed for the hand-off mode that will really exist), whether children must be bookable, and VNest's identity if available.
