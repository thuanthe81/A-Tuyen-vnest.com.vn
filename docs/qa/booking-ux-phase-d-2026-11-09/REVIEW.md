# Phase D — Booking UX & backend readiness (9/11/2026)

Status: **provisionally accepted 10/11/2026; final refinement ([`REFINEMENT.md`](REFINEMENT.md)) and final fixes
([`FINAL-FIXES.md`](FINAL-FIXES.md)) built, awaiting final acceptance. Not frozen.** Branch `feat/vnest-v3-media-import`; nothing staged,
committed, pushed or deployed; the 21 staged files and `stash@{0}` are untouched. Partner concepts A/B and the homepage
Partner section are unchanged. Reviewed on the local dev server (`vnest-v2-client-preview-dev`, port 3401).

## 1. Architecture audit

### Where booking lives

| Piece | Files | Used on |
| --- | --- | --- |
| Shared search state (02.1, frozen) | `features/booking-search/StaySearchProvider.tsx`, `search-form.ts`, `domain/search.ts` | every bar |
| Homepage bar | `HeroBookingBar` → `BookingBar` (full, ≥768 px) / `MobileBookingSearch` (hero pill + sheet, phones) | `/dev/demo` |
| Header bar | `SiteHeader` → `BookingBar` (compact) / `MobileBookingSearch` (compact) | homepage (after the hero), property pages, booking step |
| Demo booking layer | `features/demo/BookingCta.tsx` (`DemoBookingScope`: BOOK NOW label, rooms, guard), `OccupancyPanel.tsx`, `occupancy-copy.ts` | homepage, property pages, booking step |
| Calendar | `fields/DateRangeCalendar.tsx` (+ `calendar.ts`) | homepage/header bars, phone sheet, results editor, property room section |
| Results | `app/dev/demo/tim-phong/page.tsx` (server states) → `BookingResults.tsx`, `HybridResults.tsx`, `booking-results-state.ts` | `/dev/demo/tim-phong` |
| Property room selection | `property-detail/PropertyRoomCollection.tsx` (slots, page calendar, review dialog) | `/dev/stays/*` |
| Review / booking step | review dialog in `PropertyRoomCollection` and `BookingResults`; `app/dev/demo/dat-phong/page.tsx` | |
| GoHost boundary (server) | `integrations/booking/gohost-adapter.ts`, `resolve-availability.ts`, `provider-config.ts`, `property-provider-routing.ts` | |
| ezCloud boundary | `domain/hybrid-booking/ezcloud-handoff.ts` (all four properties unconfigured) | |

### Occupancy assumptions and open policies (before this phase)

- 1–2 guests per room, ≤ 6 rooms, ≤ 12 guests (owner 5/11, **provisional**, `room-occupancy.ts`); rooms are the guest's
  explicit choice, never auto-added; an address that does not fit is flagged, never sent.
- Children: `SearchCriteria.children` reserved and never parsed; both providers report `children: false`; the workbook's
  "Trẻ em / vật nuôi / quy định đặc biệt" reads "Không áp dụng" (ambiguous, Q25). No age band, charge or per-room rule exists.

### Known warnings and failing browser tests (before)

| Item | Kind | Cause |
| --- | --- | --- |
| "Cannot update a component (StaySearchProvider) while rendering a different component (PropertyRoomCollection)" — 2 room-selection tests | **functional bug** (dev-only warning) | `PropertyRoomCollection` called the shared search's `ensureToday()` (a state setter) inside render, for the page calendar's `today`; it also fell back to a hard-coded `2026-10-25` |
| mobile-interactions scroll-lock tests fail since 7/11 | **stale fixture** | fixed stay 6–8/11/2026 is now in the past |
| 3 hybrid-booking "provider states" tests | environment | need the simulation server (`vnest-v3-qa-sim`, `AVAILABILITY_SIMULATION=private-review`) |
| occasional network-idle timeouts | environment | dev server compiling image-heavy pages |

### Risks noted

- `DateRangeCalendar` is shared with the frozen 02.1 pages (`/dev/booking-search`, `/stays`): the one-month change applies
  there too, as planned in the client-review map (D3).
- The frozen 4/11 "Phòng & khách" field is shared by the homepage and property pages. The room stepper is hidden on the
  homepage only (new `roomField` prop); property pages keep it, plus a children row (needed so children are never dropped).
- `DEFAULT_DEMO_SEARCH` (results with no parameters) uses fixed 6–8/11/2026 dates: left as is (demo default; the page
  asks for new dates). Listed for the backend team.

## 2. What changed

**Booking bar (homepage).** One field, "Khách": adults + children steppers, no room stepper. Summary "2 người lớn" /
"3 người lớn · 1 trẻ em". Adults go up to 12 (6 rooms × 2) with a reason at the limit; the note says rooms are chosen at
room selection. With children, the panel shows the child-policy note. Search sends no room count, so results start at the
fewest rooms that fit the adults (existing rule); a room count already in the address (an earlier explicit choice) is kept
as it is and, if it no longer fits, the results page's existing correction notice asks the guest — nothing is changed silently.

**Children (model).** `domain/hybrid-booking/guest-party.ts`: `GuestParty { adults, children }`, `CHILD_POLICY`
(unconfirmed: no bands, no charges, unknown room counting), `parseChildren` (1–6, interface bound only). URL `children=N`,
carried homepage → results → property → review → booking step and back. Children are never added to adults and never
allocated to rooms. Where VNest cannot honour them yet:
- GoHost: the server does not ask the provider about a stay with children (`needs-provider-check`, reason
  `children-policy`: "VNest sẽ xác nhận phòng cho kỳ lưu trú có trẻ em"), even under simulation.
- ezCloud: children are transferred only under a provider-confirmed parameter name; otherwise the guest is told to enter
  them on the provider's page.
- Results editor, review dialogs and the booking step list the children apart with the note "Chính sách trẻ em (độ tuổi,
  phụ thu, số trẻ mỗi phòng) đang chờ VNest xác nhận. VNest sẽ xác nhận với bạn trước khi giữ phòng."

**Property pages.** Header "Phòng & khách" unchanged apart from a children row; summary unchanged without children
("3 khách · 2 phòng"), "3 người lớn · 1 trẻ em · 2 phòng" with them. Adult stepper buttons are now named "Thêm/Bớt một
người lớn" (were "…một khách") so they are distinct from the children's.

**Calendar.** One month at a time on desktop and phones (the phone sheet was a scrolling list of 18 months; it is now
paged with the same arrows). Previous is disabled on the current month; next/previous move one month; a stay can start in
one month and end in the next (state is kept while paging). Validation, keyboard navigation and the address are unchanged.
Applies to the homepage and header bars, the phone sheet, the results editor and the property room section.

**Warning fix.** The page calendar reads today without setting state during render (`staySearch.today` or the clock in
Vietnam). The hard-coded fallback date is gone.

**Tablet width.** At 768 px the homepage bar's fields are rebalanced a little (field padding 12 px, action padding 16 px
below 1024 px) so "3 người lớn · 1 trẻ em" reads in full. Desktop proportions are unchanged.

## 3. Evidence

- Before / after (bar, guests panel, calendar at 1440, 768, 390): `screens/before/`, `screens/after/` (`scripts/shots.mjs`).
- Journey at 1440, 768, 390 (guests → calendar next month → results → review → booking step): `screens/journey/`.
- Journey QA: `scripts/qa-d.mjs` → **120/120** (`qa-d-output.txt`): no room stepper on the homepage; adults/children kept
  apart; missing dates open the calendar without navigating; one month on show, previous disabled, next = December;
  cross-month stay 28/11 → 2/12 reaches the results address with `adults=3&children=1&rooms=2,1`; GoHost cards say why they
  are not checked, ezCloud hand-off unchanged; no price anywhere; property page keeps the stay and child; page calendar one
  month; review lists the child with the note and claims no confirmation; booking step lists the child; Back and refresh keep
  children, rooms and room choices; header panel keeps the room stepper; removing the child keeps rooms and adults; ezCloud
  page honest; adults stop at 12 with a reason; no horizontal overflow; **no console errors and no setState-in-render
  warning** at any width.

### Finding not fixed in this phase (fixed in the 10/11 refinement: [`REFINEMENT.md`](REFINEMENT.md) §1)

Browser Back from the results to the **homepage** shows an empty bar (no dates, 2 adults, no children). This is
pre-existing: the homepage has never written its search into its address (adults and dates were lost the same way before
Phase D). Every later step keeps the stay through its address (results ⇄ property ⇄ booking step, Back and refresh: checked
above). Fix proposed separately: let the homepage bar keep its search in the address with `replaceState`.

## 4. Tests

| Check | Result |
| --- | --- |
| `npm run lint` | 0 errors (3 warnings in older QA scripts, unrelated) |
| `npm run typecheck` | clean |
| `npm test` (unit) | **448/448** (438 before + 10 new: `guest-party.test.ts`, `guest-party-flow.test.ts`) |
| Phase D journey (`qa-d.mjs`, dev) | **120/120** |
| e2e suites (dev server) | see §4.1 |

### 4.1 Browser suites (dev server, 3401)

Raw output: `e2e/*.txt`.

| Suite | Before Phase D (Phase C) | Now | Remaining failures |
| --- | --- | --- | --- |
| occupancy | 8/8 | **10/10** (+2 homepage tests) | — |
| room-selection | 20/22 | **22/22** | — (the 2 setState-in-render failures are fixed) |
| hybrid-booking | 75/79 | 75/79 | environment only: 3 need the simulation server (3404, not running: `ERR_CONNECTION_REFUSED`); 1 Pepper House @375 dev-server network-idle timeout (30 s) |
| mobile-interactions | 16/16 (stale-date failures from 7/11) | **16/16** | — |
| about-vnest | 16/16 | **16/16** | — |
| homepage-content | 11/11 | **11/11** | — |

No functional regression. A full run on a fresh production build plus the simulation server is still the Phase E step.

### Test expectations changed (owner-requested behaviour, with reason)

- `occupancy.test.mjs`: the combined field's rules (every 1/1 → 12/6 combination, cap message) are now checked on a property
  page's header bar, because the homepage no longer has the room stepper; steppers read adults, children, rooms. New test:
  homepage has no room stepper, adults to 12, child apart, results start at the fewest rooms.
- `hybrid-booking.test.mjs`: "Option B" desktop test moved to The Nắng Suites' header bar (its search still goes to the
  results); it pages month by month to December. The homepage pill test expects "3 người lớn" and the rooms-later note.
- `room-selection.test.mjs`, `occupancy.test.mjs`, `hybrid-booking.test.mjs`: adult buttons renamed "Thêm/Bớt một người lớn".
- `mobile-interactions.test.mjs`: stay dates are now 30–32 days from today (Vietnam), replacing 6–8/11/2026, which went
  into the past on 7/11 (date failures, not interaction failures); the homepage sheet no longer taps "Thêm một phòng".
- `hybrid-booking.test.ts` (unit): the hand-off `transfers` object gained `children: false`.

## 5. Files changed in this phase

Source: `src/domain/hybrid-booking/guest-party.ts` (new), `property-availability.ts`, `availability-view.ts`,
`ezcloud-handoff.ts`; `src/integrations/booking/resolve-availability.ts`; `src/features/booking-search/BookingBar.tsx`,
`MobileBookingSearch.tsx`, `presentation.tsx`; `src/features/demo/BookingCta.tsx`, `OccupancyPanel.tsx`,
`occupancy-copy.ts`, `booking-flow.ts`, `booking-results-state.ts`, `hybrid-results.ts`, `HybridResults.tsx`,
`BookingResults.tsx`; `src/features/property-detail/PropertyRoomCollection.tsx`; `src/app/dev/demo/page.tsx`,
`src/app/dev/demo/dat-phong/page.tsx`.
Tests: `src/domain/hybrid-booking/guest-party.test.ts` (new), `src/features/demo/guest-party-flow.test.ts` (new),
`src/integrations/booking/hybrid-booking.test.ts`, `test/e2e/occupancy.test.mjs`, `hybrid-booking.test.mjs`,
`room-selection.test.mjs`, `mobile-interactions.test.mjs`.
Docs: `docs/handoff/BACKEND-HANDOFF.md` (new), this folder.

## 6. Open decisions

Owner (visual acceptance):
1. Homepage guest field: wording "Khách", "Người lớn", "Trẻ em", the rooms-later note and the child-policy note
   (build-team drafts).
2. Property header (compact) bar with children: "3 người lớn · 1 trẻ em · 2 phòng" is cut with "…" at 1440 in the compact
   header (the room section's own summary shows it in full). Accept, or choose a shorter form. → Shorter readings built
   10/11 (`REFINEMENT.md` §2).
3. Children stepper bound of 6 (interface only) and adults to 12 on the homepage. → Audited 10/11 (`REFINEMENT.md` §3).

Client (VNest):
4. Child policy: age bands, charges, children per room, cots / extra beds, whether a child takes a room place.
5. Confirmation of 1–2 adults per room (or provider limits).
6. Everything in `docs/handoff/BACKEND-HANDOFF.md` §7 (GoHost credentials and ids, ezCloud URLs and parameter names, rate
   contract, form destination, brand websites, media hosting).

Not started (waits for acceptance): any larger backend-readiness refactor.
