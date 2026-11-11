# VNest V3 — Hybrid Booking V1 (private local preview)

Status: built for owner acceptance, **not frozen**. Private review routes only (`/dev/*`, never indexed).
Nothing here talks to a real provider. No reservation can be created, no payment is touched.

## What is true about the providers

| Property (stable id) | Provider | How booking works in V1 |
| --- | --- | --- |
| Bare Đa Kao (`bare-da-kao`) | GoHost | `native`: VNest room selection, availability from the server adapter (unconfigured today) |
| Pepper House (`pepper-house`) | GoHost | `native`, as above |
| Bare Chic (`bare-chic`) | ezCloud | `external-handoff`: "Kiểm tra giá & đặt phòng" (unconfigured today) |
| Bare Hyphen (`bare-hyphen`) | ezCloud | `external-handoff` |
| Bare Hàn (`bare-han`) | ezCloud | `external-handoff` |
| The Nắng Suites (`the-nang-suites`) | ezCloud | `external-handoff` |

Bare Tân Định is an alias of Bare Đa Kao, not a seventh property.

There is **no verified unified availability source** for the six properties. ezCloud availability and booking
APIs are not available to VNest (confirmed by the VNest team); GoHost's endpoints, scopes and identifiers are
unverified. The UI therefore never lists the six as "available", never counts rooms across providers, never
sorts by price and never offers one cart across two systems.

## Discovery vs. booking (V1.1, 4/11/2026)

All six properties share one discovery journey: a property card's "Chọn phòng", its name and its photo open the property's own
detail page, with dates, guests and rooms kept. Provider differences start only at an explicit action:
"Kiểm tra phòng trống" (GoHost, room-first results) or "Kiểm tra giá & đặt phòng" (ezCloud hand-off). The search bar with a property
chosen is an explicit date search and keeps its V1 behaviour. Native history writes keep `window.history.state` so Back works.

## Availability states (`src/domain/hybrid-booking/property-availability.ts`)

| State | Meaning | Shown as |
| --- | --- | --- |
| `available` | live provider response, rooms free | "Còn phòng cho ngày bạn chọn" + provider quote (if any) |
| `unavailable` | live provider response, none free | "Không còn phòng cho ngày đã chọn" |
| `needs-provider-check` | VNest cannot check (ezCloud, or no dates yet) | "Giá và tình trạng phòng hiển thị ở bước đặt phòng" / "Chọn ngày để…" |
| `unconfigured` | integration not set up | "Chưa kiểm tra được tình trạng phòng trực tuyến" |
| `error` | the check failed | "Chưa kiểm tra được… Đây không phải là hết phòng." + Thử lại |

An `error` or `unconfigured` state is never worded as sold out. A verified state does not survive a changed
stay: the page shows nothing verified and offers "Cập nhật kết quả".

## Code map

Client-safe (domain, pure): `src/domain/hybrid-booking/`
`provider-assignment` (property → provider) · `booking-mode` (native vs hand-off, the only place components ask)
· `property-availability` (state types) · `availability-view` (all guest wording) · `ezcloud-handoff` (registry +
parameter-name-driven href builder) · `stay-validation` (server-side date/quantity rules) · `availability-simulation`
(private review only).

Server-only: `src/integrations/booking/`
`provider-config` (reads GoHost credentials) · `gohost-adapter` (five separated operations: search availability,
read rates, validate selection, initiate booking, read booking status — the last two are disabled) ·
`resolve-availability` (one state per property, failures contained) · `property-provider-routing` (identifier and
room-mapping readiness, fails closed). Presentation reaches it only through `getServices().hybridAvailability`.

The four boundaries: discovery content (catalog, photos, SEO — independent of any provider) → availability
verification (`resolve-availability`) → booking initiation (adapter, disabled; hand-off, unconfigured) → booking
confirmation (not built; needs a real provider response).

## Search state

The address is the source of truth: `property`, `checkIn`, `checkOut`, `rooms` (count, or adults per room), `adults`.
No personal data is placed in a URL. Choosing a property pushes exactly one history entry so Back returns to the
result list. Refresh re-resolves availability on the server. `?sim=` rides along for private review only.
The 02.1 booking bar has no room-count field (frozen); the count is preserved from the address and edited on the
results page.

## Simulation (private review only, fail-closed)

Off unless `AVAILABILITY_SIMULATION=private-review` is set on a DECLARED development deployment (`vnest-v3-qa-sim`, port 3404);
preview/production refuse to start with it, and `getServices()` drops any simulation otherwise. Then
`/dev/demo/tim-phong?…&sim=bare-da-kao:available,pepper-house:error` simulates states
(`available`, `unavailable`, `unconfigured`, `error`, `needs-provider-check`). Simulated verified states are
flagged, the page shows a banner, and simulated amounts are labelled "Mô phỏng · không phải giá thật".

## Integration checklist — information still required from VNest

### GoHost (Bare Đa Kao, Pepper House)
- [ ] Confirmed API documentation and base URL (`GOHOST_API_BASE_URL`, https only)
- [ ] Test environment details
- [ ] Authorised credentials and scopes (`GOHOST_API_KEY`, server environment only; never committed)
- [ ] Provider property IDs → `providerPropertyRef` in `property-provider-routing.ts`
- [ ] Room-type IDs for every room (rows 24–25 Pepper House; Bare Đa Kao One–Four) → `roomRefs`
- [ ] Rate-plan mapping, tax and fee rules (then `GOHOST_RATE_PLAN_CONTRACT_CONFIRMED=true`)
- [ ] Booking confirmation rules
- [ ] Payment flow (who takes payment, when)
- [ ] Cancellation and refund policies
- [ ] Webhook specification, if used

### ezCloud (Bare Chic, Bare Hyphen, Bare Hàn, The Nắng Suites)
- [ ] Official integration framework or snippet
- [ ] Configuration for each of the four properties
- [ ] Official booking destinations → `EZCLOUD_HANDOFF_BY_PROPERTY` in `ezcloud-handoff.ts`
- [ ] Supported query / deep-link parameter names (only confirmed names are ever sent)
- [ ] Whether dates and guest counts can be handed off (otherwise the UI says they are not transferred)
- [ ] Whether a room type can be handed off (not assumed)
- [ ] Navigation and return behaviour (iframe, widget, new tab: none assumed)
- [ ] Branding limitations
- [ ] Confirmation and payment responsibility

Never commit secrets or client credentials. Do not implement vendor contracts from third-party examples.
