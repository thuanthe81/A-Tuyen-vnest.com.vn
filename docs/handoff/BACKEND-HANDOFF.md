> **11/11/2026:** the handoff entry point is now [START_HERE.md](../../START_HERE.md) and [BACKEND_HANDOFF.md](BACKEND_HANDOFF.md)
> (Vietnamese). This file stays as the detailed English reference. Correction to §6: ezCloud has **not** confirmed any
> parameter names; the code only has slots for them.

# VNest V3 — Booking backend handoff

Status: draft for the backend team, 9/11/2026 (Phase D), updated 10/11/2026 (final refinement and final fixes; §11 consultation requests). Describes the code on branch `feat/vnest-v3-media-import`
(uncommitted). Nothing here talks to a real provider: no request leaves the server, no reservation is created, no payment
is touched. Every route below is a private `/dev/*` review route (never indexed).

Related: `docs/booking/HYBRID-BOOKING-V1.md` (provider model, V1/V1.1), `docs/decisions/v3-booking-bar-occupancy-field.md`
(the frozen "Phòng & khách" field), `docs/qa/booking-ux-phase-d-2026-11-09/REVIEW.md` (this phase).

## 1. Booking flow

```
Homepage /dev/demo                 bar: Cơ sở · Nhận phòng · Trả phòng · Khách (adults + children) · BOOK NOW
  → Results /dev/demo/tim-phong      server resolves one availability state per property for the stay in the address
      GoHost (native)              → property page room selection → review dialog → /dev/demo/dat-phong (summary only)
      ezCloud (external-handoff)   → "Kiểm tra giá & đặt phòng" hand-off (unconfigured: honest state, no link)
  Property page /dev/stays/<slug>  header bar: … · Phòng & khách (adults + children + rooms) · BOOK NOW
```

| Property id | Provider | Mode |
| --- | --- | --- |
| `bare-da-kao`, `pepper-house` | GoHost | `native` (VNest room selection; availability from the server adapter) |
| `bare-chic`, `bare-hyphen`, `bare-han`, `the-nang-suites` | ezCloud | `external-handoff` (VNest shows no price or availability) |

Mode lookup: `src/domain/hybrid-booking/booking-mode.ts`. Components never test a provider name.

## 2. Shared state (client)

| Layer | Where | Holds |
| --- | --- | --- |
| Search form (02.1, frozen) | `features/booking-search/StaySearchProvider.tsx`, `search-form.ts` | property, check-in, check-out, `adults` |
| Demo booking scope | `features/demo/BookingCta.tsx` → `DemoBookingScope` | rooms (`roomAdults`), `children`, `roomField` ("hidden" on the homepage, "shown" on property pages) |
| Results page | `features/demo/BookingResults.tsx` + `booking-results-state.ts` (`MultiRoomSearchState`) | property, dates, room slots (adults per room, room preference), `guests` (out-of-range total kept for correction), `children` |
| Property room selection | `features/property-detail/PropertyRoomCollection.tsx` | room slots, synced two ways with the header field |

The address is the source of truth between pages: every page parses it on load and writes it back with
`history.replaceState(window.history.state, …)` (keep Next's history state, or Back breaks).

The homepage too (10/11/2026): a **submitted** search is written into the homepage's own address just before the results
open (`demoHomeSearchHref` in `booking-flow.ts`, called from `DemoBookingScope rememberSearch`), in place: no new
history entry, and nothing while the guest is still using the steppers. Refresh renders it on the server. On Back,
Next shows its cached homepage (rendered before the search was written), so `HomepageStaySearch` reads the stay from the
browser's address when the page mounts, with the same parser as the server (`stayFromQuery`), read once so the
submit's own address write never restarts the bar. Explicit `rooms` the homepage address already carried are kept;
none are added. When that cached render was made for another address (`homeStayKey` differs), the page calls
`router.refresh()` once (no navigation, no history entry, client state kept), so what the server builds from the
address follows: the brand cards link to each property with the dates, adults, `children` and explicit `rooms`.

Language on `/dev/*` (proxy, `src/proxy.ts`): a page opened without `lang` while English is remembered is redirected to
`lang=en`. Next's background prefetches (`next-router-prefetch` header) skip the proxy (`config.matcher`, `missing`):
redirecting them left unread requests open on English pages. Real navigations and full loads are unchanged.

## 3. URL parameter contract

| Param | Format | Notes |
| --- | --- | --- |
| `property` | slug or `all` | absent / unknown = all properties (never an error) |
| `checkIn`, `checkOut` | `YYYY-MM-DD` | check-out must be after check-in; past check-in is rejected (property time zone `Asia/Ho_Chi_Minh`) |
| `adults` | integer ≥ 1 | the guest total the room rule counts |
| `rooms` | `N` (room count) or `a,b,c` (adults per room) | `rooms=1` = one room; with no `rooms`, results start at the fewest rooms that fit `adults` |
| `children` | integer 1–99 | **new (Phase D)**; absent = 0. Never added to `adults`, never allocated to rooms. 99 is a parsing bound; a count above the stepper's 6 is kept, not cut (see §4.1) |
| `prefs` | room ids per slot, comma separated, empty = none | provisional room preferences (not holds) |
| `room` | room id or name | room the guest came from (viewer / drawer) |
| `sim` | `property:status,…` | development simulation, honoured only with `AVAILABILITY_SIMULATION=private-review` |

Parsers: `domain/search.ts` (02.1 criteria; `children` deliberately not parsed there), `booking-results-state.ts`
(`parseMultiRoomQuery` / `serializeMultiRoomQuery`), `domain/hybrid-booking/guest-party.ts` (`parseChildren`).
Builders: `features/demo/booking-flow.ts`.

## 4. Guest and room models

- `GuestParty { adults; children }` — `domain/hybrid-booking/guest-party.ts`. `CHILD_POLICY` = unconfirmed (no age bands,
  no charges, unknown whether a child takes a room place). Extend there; carry `childAges` beside `children` if a
  provider needs ages.
- Room rule (provisional, owner 5/11/2026): 1–2 **adults** per room, ≤ 6 rooms, ≤ 12 adults — `room-occupancy.ts`.
  Rooms and adults are each the guest's explicit choice; neither is changed to fit the other. An address that does not
  fit is kept and flagged (`occupancy-correction`), never sent to a provider.
- `StayRequest { checkIn?, checkOut?, roomAdults[], children? }` — what the server and adapters receive
  (`property-availability.ts`). `stayRequestFromState` builds it; `stayKey` includes children, so a change marks
  earlier answers stale.
- Bounds: see §4.1; none of the technical ones is a VNest rule.
- Results slots: `RoomGroupSlot { slotIndex, adults, preferredRoomId }` (`booking-results-state.ts`), unit/quantity
  semantics documented at the top of that file.

### 4.1 Bounds: technical, provisional and unconfirmed (audit 10/11/2026)

| Bound | Value | Kind | Where |
| --- | --- | --- | --- |
| Adults per room | 1–2 | **Provisional VNest rule** (owner 5/11/2026), awaits confirmation | `room-occupancy.ts` |
| Rooms / adults per request | ≤ 6 / ≤ 12 | **Provisional VNest rule** (same) | `room-occupancy.ts` |
| Children: age bands, charges, per-room limit, free stays, cots | none | **Unconfirmed**: nothing enforced or shown | `CHILD_POLICY` (`guest-party.ts`) |
| Children stepper | counts up to 6 | Technical (form), build team. At 6 the panel says only "Đi cùng hơn 6 trẻ em? Vui lòng liên hệ VNest để được hỗ trợ." | `CHILDREN_STEPPER_LIMIT` |
| `children` in an address | 1–99, else 0 | Technical (parsing sanity, like adults) | `MAX_PARSEABLE_CHILDREN` |
| `adults` in an address | 1–99 | Technical (parsing) | `MAX_PARSEABLE_ADULTS` (`domain/search.ts`) |
| Calendar reach | 18 months | Technical (interface) | `MONTHS_AHEAD` (`fields/DateRangeCalendar.tsx`) |

## 5. GoHost adapter boundary (server-only)

`src/integrations/booking/gohost-adapter.ts`, called by `resolve-availability.ts` through `getServices().hybridAvailability`.

- Operations: `searchAvailability`, `readRates`, `validateSelection` (server check of quantities against
  provider-confirmed units), `initiateBooking` and `readBookingStatus` (both **disabled**).
- Today every call returns `unconfigured` (missing endpoint, credentials, property / room ids, rate contract); once
  configured, `contract-not-implemented` until the real contract is coded. Errors are never shown as "sold out".
- Not asked, by design: dates missing → `dates-required`; adults not fitting rooms → `occupancy-correction`;
  **children present → `children-policy` (Phase D)**, so an adults-only answer is never shown for a party with children.
- ESLint keeps `@/integrations/*` out of app/features; `src/config/env.ts` is the only reader of `process.env`; a test
  forbids client imports of the provider modules.

## 6. ezCloud handoff boundary (client-safe)

`src/domain/hybrid-booking/ezcloud-handoff.ts`. VNest has no ezCloud availability or booking API. Each property is
`unconfigured` until VNest supplies its official destination; parameters are appended only under names the provider
confirmed (`checkIn`, `checkOut`, `adults`, `rooms`, and now `children`). What was not transferred is told to the guest
(e.g. "Số trẻ em (2) cần được nhập lại ở đó"). No iframe, widget, deep link, return URL or payment callback is assumed.

## 7. Still required from VNest / the providers

| Item | Needed for | Where it goes |
| --- | --- | --- |
| GoHost API base URL, server API key, scopes | any live availability | env `GOHOST_API_BASE_URL`, `GOHOST_API_KEY` |
| GoHost property ids and room-type ids for Bare Đa Kao and Pepper House | mapping rooms | `integrations/booking/property-provider-routing.ts` |
| GoHost rate-plan, tax and cancellation contract | prices | then `GOHOST_RATE_PLAN_CONTRACT_CONFIRMED=true` |
| GoHost child / occupancy support (ages? per-room limits?) | lifting `children-policy` | `guest-party.ts`, adapter request |
| GoHost booking creation and status contract, payment flow | `initiateBooking` | adapter (disabled today) |
| ezCloud official booking URL per property + accepted parameter names | hand-off links | `EZCLOUD_HANDOFF_BY_PROPERTY` |
| Child policy: age bands, charges, children per room, cots / extra beds | enforcing anything about children | `CHILD_POLICY` |
| Confirmation of the 1–2 adults per room rule (or provider limits) | publication | `room-occupancy.ts` |
| Public rates (if any are to be shown before a live quote) | room-card prices | `public-rates.ts` (empty) |
| Resend account (provider chosen by the owner 11/11/2026) + `vnest.com.vn` verified in Resend + sender mailbox name (recipient confirmed: hello@vnest.com.vn, 10/11/2026) | consultation form `#tu-van` | DNS + env, see §11.3 (delivery is OFF until then) |
| Privacy notice / consent wording for the consultation form | public release of the form | `contact-copy.ts`, see §11.7 |
| Official brand websites | "Visit us ↗" | `BRAND_WEBSITES` (all null) |

## 8. Known mock / simulation limits

- No live provider answers anywhere; `available` / `unavailable` appear only under `?sim=` on a server started with
  `AVAILABILITY_SIMULATION=private-review` (launch config `vnest-v3-qa-sim`, port 3404), always labelled, fixture prices.
- Room selection is a **preference**, not a hold; the review dialog and `/dev/demo/dat-phong` say nothing was sent,
  held or paid. Without provider inventory the same room may be chosen in several slots.
- `DEFAULT_DEMO_SEARCH` (results page with no parameters) still uses fixed 6–8/11/2026 dates, now in the past; the page
  then asks for new dates. Replace or remove before any non-demo use.
- Room facts (size, "2 người lớn") are display-only (`verifiedMaxAdults` stays null until a provider confirms).

## 9. Media hosting

Photos are served from `public/dev-client-media/` (~280 MB, git-ignored) derived from `.local-media/` (~870 MB, git-ignored)
by the scripts under `docs/content/`. Neither folder is in Git: a fresh checkout has no photos. Production needs a hosting
decision (object storage / CDN + `next.config.ts` `images` settings) and VNest's written approval for each image set.
Do not re-run the legacy `fetch-photos.mjs --derive` (it drops hand-added entries).

## 10. Local development and tests

```bash
npm install
npm run dev                        # or a launch config in .claude/launch.json
npm run check                      # lint + typecheck + unit tests (node --test, src/**/*.test.ts)
```

Client-draft review servers (see `.claude/launch.json`): `vnest-v2-client-preview-dev` (dev, 3401), `vnest-v3-qa`
(production `next start`, 3402, needs `npm run build`), `vnest-v3-qa-sim` (3404, simulation enabled). Their env:
`DEPLOY_ENV=development CONTENT_SOURCE=client-draft BOOKING_PROVIDER=none`.

Browser suites (Playwright, currently loaded from the sibling `Cigarettes-After-Sex` checkout — make it a dev dependency
before CI):

```bash
VNEST_TEST_URL=http://localhost:3402 node --test test/e2e/hybrid-booking.test.mjs
```

Same for `occupancy`, `room-selection`, `mobile-interactions`, `about-vnest`, `homepage-content`. Run them on a fresh
production build; the dev server gives timing failures (network-idle timeouts) that are not functional regressions.
Phase D journey script: `node docs/qa/booking-ux-phase-d-2026-11-09/scripts/qa-d.mjs http://localhost:3401`;
refinement (Back / refresh / compact bars / bounds, 390–1440): `scripts/qa-refine.mjs` in the same folder.

## 11. Consultation requests (form `#tu-van`) — added 10/11/2026

Status: **built, delivery OFF.** The owner confirmed the recipient, `hello@vnest.com.vn` (10/11/2026), and chose **Resend**
as the provider (11/11/2026). No Resend account, API key or verified sender exists yet, so real delivery stays disabled and the form keeps saying it is not active. The
whole path was tested with the development mock only; **no real email has been sent and receipt is not verified.**

### 11.1 Architecture

```
ConsultationForm (features/demo/Consultation.tsx, shared by /dev/demo and /dev/demo/hop-tac)
  │  browser check: validateContact → domain rules                         features/demo/owner-journey.ts
  │  submitConsultation(): POST JSON, maps the answer to sent|invalid|limited|failed   features/demo/consultation-submit.ts
  ▼
POST /api/consultation (app/api/consultation/route.ts)      reads the request only (body capped at 16 KB)
  ▼
createConsultationHandler (server/consultation.ts)          no Next.js inside, unit-tested
  │  delivery on? → JSON? size? → same origin? → rate limit → spam trap → validateConsultation → duplicate? → sink
  ▼
ConsultationSink port (domain/consultation.ts)              "ok" only when the destination ACCEPTED the request
  ▼
Email sink (integrations/consultation/email-sink.ts) → compose-email.ts → EmailTransport
                                                            ├─ resend.ts (HTTP API via fetch, no SDK)
                                                            └─ mock.ts (development only, nothing leaves the machine)
```

- **Validation schema**: `src/domain/consultation.ts` (pure TS). Run in the browser for feedback and again on the server.
  Errors are codes (`required` / `invalid` / `too-long`); the form owns the sentences (`contact-copy.ts`).
- **Recipient**: `src/config/consultation.ts` (`hello@vnest.com.vn`), overridable server-side with
  `CONSULTATION_RECIPIENT` (e.g. a staging test inbox). Never sent to the browser.
- **Composition root**: `src/server/services.ts` → `createConsultation()` picks the sink; `consultationMode()` is the only
  thing pages learn (`"off" | "mock" | "live"`), passed as `delivery` to `OwnerJourney` / `PartnerPage`.
- **Replacing the provider or adding a CRM**: implement `EmailTransport` (another provider, SMTP) or a new
  `ConsultationSink` (CRM; or a sink that calls two sinks) and select it in `createConsultation()`. The form, the route
  and the handler do not change. Return `ok: true` only after the destination confirmed.

### 11.2 Environment variables (server-only; never `NEXT_PUBLIC_`)

| Variable | Values | Notes |
| --- | --- | --- |
| `CONSULTATION_DELIVERY` | `disabled` (default) · `mock` · `resend` | `mock` is refused outside `DEPLOY_ENV=development`. `resend` without both variables below refuses to start. |
| `RESEND_API_KEY` | Resend API key (`re_…`) | Secret. Sending-only permission, restricted to the VNest domain. Set in the host's secret store, never in Git or `.env.example`. |
| `CONSULTATION_SENDER` | e.g. `VNest Website <website@vnest.com.vn>` | Must be on a domain verified in the provider. Not invented here: VNest chooses the mailbox name. |
| `CONSULTATION_RECIPIENT` | bare address | Optional. Default `hello@vnest.com.vn`. Use a test inbox on staging if the team prefers. |

All read and validated in `src/config/env.ts` (the only reader of `process.env`).

### 11.3 Sender domain: what must be set up first (DNS checked 10/11/2026)

`vnest.com.vn` today: MX at `mail9077.maychuemail.com` / `mx9077.maychuemail.net`; SPF `v=spf1 a mx include:spf.maychuemail.com ~all`;
DKIM selector `dkim` (maychuemail); **DMARC `p=reject; aspf=s; adkim=r`**. Consequence: mail claiming to be from
`@vnest.com.vn` that is not DKIM-signed for that domain (or SPF-aligned exactly) is rejected — including by VNest's own
mailbox. A provider cannot send as `@vnest.com.vn` until VNest's DNS is updated.

Option A — **Resend (implemented; chosen by the owner 11/11/2026)**. DNS re-checked 11/11/2026: `send.vnest.com.vn` and
`resend._domainkey.vnest.com.vn` have no records, so nothing conflicts. Full DMARC record:
`v=DMARC1; p=reject; adkim=r; aspf=s; sp=none` — leave it unchanged.

1. VNest (or BMP with VNest's consent) creates a Resend account; add domain `vnest.com.vn`; region nearest to Vietnam.
2. Add the DNS records Resend shows (DKIM TXT at `resend._domainkey.vnest.com.vn`; MX + SPF TXT on the `send.` subdomain
   for bounces). Do **not** replace the existing root SPF or MX: maychuemail keeps receiving mail.
3. Alignment: SPF passes on `send.vnest.com.vn`, which does not align with `aspf=s`; DMARC passes through DKIM
   (`adkim=r`). Wait until Resend shows the domain **Verified**.
4. Create an API key with *sending access* for that domain only → `RESEND_API_KEY`. Choose the sender mailbox name with
   VNest → `CONSULTATION_SENDER`.

Option B — **existing mailbox over SMTP** (not implemented): authenticate as a `@vnest.com.vn` mailbox at maychuemail
(already SPF/DKIM-aligned). Needs a mailbox password from VNest, an SMTP library (e.g. nodemailer) and an
`integrations/consultation/smtp.ts` transport; and a host that allows outbound SMTP (587/465). Choose B only if VNest
prefers not to add a provider. *Not chosen (11/11/2026).*

### 11.4 Behaviour per environment

| Environment | Setting | Form shows | Server |
| --- | --- | --- | --- |
| Local (default) | unset = `disabled` | "Biểu mẫu trực tuyến chưa hoạt động…"; valid submit → "Chưa gửi…"; no request | `/api/consultation` → 503 |
| Local QA | `CONSULTATION_DELIVERY=mock` (+ `DEPLOY_ENV=development`) | new intro; real states; success says "Môi trường thử nghiệm: … không có email nào được gửi đi" | mock accepts; `?mock=failed\|slow` on the API request picks an outcome |
| Staging | `resend` + key + sender (+ optional test `CONSULTATION_RECIPIENT`) | new intro; real delivery | sends; verify receipt (§11.8) before production |
| Production | `resend` + key + sender | same | sends to `hello@vnest.com.vn` |

Success is shown only after the provider answered 2xx. The form is reset only then; on any failure everything typed is
kept and the visitor gets "Chưa thể gửi yêu cầu… hello@vnest.com.vn". No copy promises a reply or a response time.
When delivery is on, the submit button becomes the filled Dark Olive CTA (`.submitLive`); while off it stays the muted
secondary style (owner may revert: one class in `OwnerJourney.module.css`).

### 11.5 Email format

Subject `[VNest Website] Yêu cầu tư vấn — {service}` (service label from server copy, never visitor input). Plain text +
HTML: time (`dd/mm/yyyy, HH:mm (GMT+7, giờ Việt Nam)`), service, name, email or phone (mailto / tel links), property type
and message only if given, source page (label + path), language (VI/EN), reference `VN-XXXXXXXX`. Reply-To is set only to
an email address that passed the strict pattern (letters, digits, `. _ + ' -`; no spaces, quotes, brackets, `% ? =` or
line breaks). All visitor text is HTML-escaped. Samples (fake data): `docs/qa/consultation-form-2026-11-10/email-sample/`.

### 11.6 Spam and abuse protection

- Same-origin check (Origin / Sec-Fetch-Site) and JSON-only (cross-site forms cannot post without a preflight we never approve).
- Body ≤ 16 KB, read with a hard cap; field limits: name 2–100, contact ≤ 254, property type ≤ 120, message ≤ 2,000.
- Honeypot field `vnx_hp` (off-screen, `aria-hidden`, `tabindex=-1`): filled → refused with the failure message (never a fake success).
- Rate limit per client address (5 / 10 min, 20 / day) and per server (100 / hour) → 429 with a polite message.
  Client addresses are salted SHA-256 hashes in memory, never stored or logged.
- Duplicates: the same request (service, name, contact, type, message) within 10 minutes is answered as the first one was
  and not re-sent; concurrent double submits share one delivery; a retry after a *failure* does send. The browser also
  blocks a second submit while one is in flight. Each delivery carries an `Idempotency-Key`.
- **Limits of the in-memory design**: each server instance counts on its own (serverless platforms run several), and the
  client address comes from `X-Forwarded-For`, which only the hosting proxy should set. Before public launch, confirm the
  host overwrites that header (Vercel does) and consider the platform's firewall/rate-limit rules or a shared store
  (Redis/Upstash). Add a CAPTCHA-free challenge (e.g. Cloudflare Turnstile) only if spam appears.
- Logs: `[consultation] sent ref=… provider=…` / `delivery failed ref=… reason=… status=… error=…` / `refused: …`.
  Never names, contacts, messages, addresses or keys.

### 11.7 Privacy (dependency — not resolved)

The form collects a name, a phone number or email address and free text from property owners. VNest has **not approved a
privacy notice**, and nothing in the site claims compliance. Before the form is public, VNest (with its legal adviser)
should confirm the requirements under Vietnam's personal-data rules (Decree 13/2023/NĐ-CP and the Personal Data
Protection Law effective 1/1/2026), then supply: the notice text (purpose, controller, retention, rights, contact), whether
explicit consent (e.g. a checkbox) is required, and where the notice is published. The build team will place the
approved wording under the submit button; no wording has been drafted as legal text. Also note the email provider
processes the data (Resend stores sent messages and logs for a period): include it in the notice if required.

### 11.8 Testing

```bash
npm run check                                   # includes src/**/consultation*.test.ts (rules, email, Resend via fake fetch, handler, env)
# Browser (production build; launch configs vnest-consult-mock 3407 and vnest-consult-off 3408):
node docs/qa/consultation-form-2026-11-10/scripts/qa-consultation.mjs http://localhost:3407 http://localhost:3408
node --import ./test/register.mjs docs/qa/consultation-form-2026-11-10/scripts/render-email-sample.mjs   # email preview, fake data
```

The mock server keeps its rate-limit counters in memory: repeated QA runs within an hour hit the server-wide 100/hour cap
(by design); restart the server between runs.

Live check on staging, once §11.3 is done: set the three variables, restart, send ONE request with a test name from the
form, and confirm (a) the form shows success, (b) the server log shows `sent ref=VN-…`, (c) the email arrives in
`hello@vnest.com.vn` (not in spam), with the same reference, and Reply works. Then repeat with a phone number. Only after
(c) may the form be called operational.
