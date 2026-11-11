# Phase D — final UX refinement (10/11/2026)

Status: **built; followed by the final fixes in [`FINAL-FIXES.md`](FINAL-FIXES.md) (brand-card links after Back, English
prefetch). Awaiting Phase D final acceptance. Not frozen.** Phase D was provisionally accepted on 10/11 with three
points to fix; this is that work only. No backend refactor was started. Nothing staged, committed, pushed or deployed;
the 21 staged files and `stash@{0}` are untouched. Frozen homepage sections, Discovery, Coming Soon and both Partner
concepts are unchanged.

## 1. Homepage keeps a submitted search on Back and refresh

**Cause (measured):**
- Refresh already worked once the homepage address carried the search.
- On Back, Next shows the homepage from its client cache, rendered before the search existed, so the bar started empty.
  Only `children` came back, because it was read in the browser.

**Fix:**
- *Save on submit.* When BOOK NOW opens the results from the homepage, the submitted search is first written into the
  homepage's own address with `replaceState`. This adds no history entry. It happens only on submit, never on a stepper
  change.
- *Same parameter contract.* `property` (only when one is chosen), `checkIn`, `checkOut`, `adults` and `children`. `rooms`
  is written only when the address already carried an explicit choice, so no rooms are invented. Other parameters
  (`intro`, `lang`, `sim`) are kept. Room preferences (`prefs`, `room`) belong to the results and are dropped.
  Builder: `demoHomeSearchHref`.
- *Reading it back.* `HomepageStaySearch` starts the existing `StaySearchProvider` from the browser's address when the page
  mounts, using the server's own parser (`stayFromQuery`). It reads the address once, so writing the address on submit
  never restarts the bar. The first render matches the server's, and no hydration warnings appeared.
- *Unchanged.* `StaySearchProvider` itself, and every other page's address handling.

**Known limit:** after Back, the brand cards' links come from the cached page, so they carry no dates. They behave as they
did before any search. After a refresh they carry the dates.

## 2. Compact header guest summary

**Measured (9/11 build):**
- The compact header gives the guest value 100 px at 768, 99 px at 1024, and 134 px at 1280 and 1440.
- At 768 and 1024 the property name and the dates are already clipped too, so no space could be rebalanced.
- Full readings:

| Reading | Width | Result |
| --- | --- | --- |
| "3 người lớn · 1 trẻ em · 2 phòng" | 205 px | cut at every width |
| "3 người lớn · 1 trẻ em" (homepage) | 139 px | cut at every width |
| "3 khách · 2 phòng" (frozen, no children) | 121 px | cut at 768 and 1024 |

**Fix:** the compact bars show the longest reading that fits, measured in the field's own font (`FitText`, opt-in through
`Occupancy.compactSummaries`). Rules:
- Rooms are dropped before any word is cut.
- Adults and children are always named apart and never added together.
- "lớn / trẻ" is used only where nothing longer fits.
- The full reading stays as the accessible name (checked: read once) and as a hover title.
- The panel is unchanged.

| Width | Property page, with children | Homepage, with children | Property page, no children |
| --- | --- | --- | --- |
| 1280–1440 | 3 người lớn · 1 trẻ | 3 người lớn · 1 trẻ | 3 khách · 2 phòng (unchanged) |
| 768–1024 | 3 lớn · 1 trẻ | 3 lớn · 1 trẻ | 3 khách |
| 390 (phone pill) | dates · 3 lớn · 1 trẻ, still cut | same | dates · 3 khách, still cut |

**At 390:** the compact pill's second line (about 130 px) is filled by the dates alone ("28 thg 11 – 2 thg 12"), so the
guest part still ends in "…". This was already the case before this phase. The hero pill and the sheet show everything.

**Owner decisions:**
- the "lớn / trẻ" wording (alternative: "2 lớn 1 nhỏ")
- dropping rooms from the frozen no-children reading at 768–1024

## 3. Guest limits audit

| Bound | Before | Now | Kind |
| --- | --- | --- | --- |
| Children stepper | stopped at 6, with no explanation | counts to 6; at 6 the panel says "Đi cùng hơn 6 trẻ em? Vui lòng liên hệ VNest để được hỗ trợ." | Form bound (build team), not a VNest rule; the note states no limit and no rule |
| `children` in an address | 7 or more was **silently read as 0** | 1–99 kept as given; above 6 the stepper only counts down | Parsing sanity bound |
| Adults 1–2 per room, ≤ 6 rooms, ≤ 12 adults | — | unchanged | Provisional VNest rule (owner 5/11), awaits confirmation |
| Child age bands, charges, free stays, per-room limits, cots | none | none | Unconfirmed: nothing invented or enforced |

The bounds are documented separately in `docs/handoff/BACKEND-HANDOFF.md` §4.1 and at the top of `guest-party.ts`.

## 4. Evidence

`node docs/qa/booking-ux-phase-d-2026-11-09/scripts/qa-refine.mjs http://localhost:3401` → **121/121** at 1440, 1024,
768 and 390. Output: `qa-refine-output.txt`. The checks:

1. Homepage → Results → Back.
2. Homepage → Results → Property → Back → Back.
3. Refresh after submitting.
4. Adults and children correct.
5. Dates correct, including a cross-month stay.
6. Explicit `rooms=2,2` kept through submit and Back.
7. Compact header readings, on the homepage and a property page.
8. The phone sheet restores the dates and guests.
9. GoHost is not asked with children, all four ezCloud hand-offs are unchanged, and there are no prices.

Also checked:
- one history entry per search, and none for stepper changes
- the search can be edited after Back without starting over
- the children bound and an address with 8 children
- no console or hydration errors

Screenshots in `screens/refine/`:
- `before-back-home-*` / `after-back-home-*`: the homepage bar after Back.
- `before-compact-property-*` / `after-compact-property-*`: the property compact header. The "before" images are
  rebuilt in the browser by putting the full reading back in the field.
- `refine-*`: journey steps from the script.

## 5. Tests

| Check | Result |
| --- | --- |
| Lint | 0 errors (3 old warnings in earlier QA scripts) |
| Typecheck | clean |
| Unit tests | **452/452** (4 new) |
| Production build | passes |
| Phase D journey `qa-d.mjs` (dev 3401) | 120/120 |
| Refinement `qa-refine.mjs` (dev 3401) | 121/121 |

Browser suites, on a fresh production build (`next start`, 3403) with the private simulation server
(`AVAILABILITY_SIMULATION=private-review`, 3404). Output: `e2e-refine/`.

| Suite | Result | Notes |
| --- | --- | --- |
| occupancy | 10/10 | |
| room-selection | 22/22 | |
| hybrid-booking | **79/79** | Includes the 3 simulated-state tests that needed the simulation server, plus the Pepper House @375 dev timeout, which does not happen on the production build |
| mobile-interactions | 16/16 | |
| about-vnest | 12/16 | 4 failures are test-environment timeouts (see below) |
| homepage-content | 7/11 | 4 failures are test-environment timeouts (see below) |

**About the 8 failures.** All 8 are the English preview (`?lang=en`) at 375, 390, 768 and 1440, timing out in the
suites' wait for "network idle". The cause:
- The English page prefetches its plain `/dev/demo` links (logo, footer logo). Next prefetches only on a production build.
- The bilingual proxy (`src/proxy.ts`) answers that prefetch with a 307 to `?lang=en`, because English is remembered in
  a cookie.
- The redirected prefetch returns a full page that Next never reads to the end, so the browser never reaches network
  idle.

Checked on the production build: the English page renders its English copy, has no console errors, and the logo still
opens `?lang=en`. This involves neither the booking code nor this refinement. The proxy and the header were not changed
here. On the dev server (no prefetch) both suites pass 16/16 and 11/11.

Possible fix, not made here (outside this brief): carry `lang` in those links, or skip the redirect for prefetch
requests.

## 6. Files changed in this refinement

- `src/features/demo/HomepageStaySearch.tsx` (new): starts the homepage search from the browser's address.
- `src/app/dev/demo/page.tsx`: uses it; `DemoBookingScope rememberSearch`.
- `src/features/demo/BookingCta.tsx`: saves the submitted search; passes the compact readings.
- `src/features/demo/booking-flow.ts`: `demoHomeSearchHref`.
- `src/features/booking-search/fields/FitText.tsx` (new): the longest reading that fits.
- `src/features/booking-search/presentation.tsx`: `Occupancy.compactSummaries`.
- `src/features/booking-search/BookingBar.tsx`, `MobileBookingSearch.tsx`: compact bars use them.
- `src/features/demo/occupancy-copy.ts`: `compactGuestSummaries`.
- `src/domain/hybrid-booking/guest-party.ts`: the bounds, `canAddChild` and `childrenStepperMax`, the form-limit note.
- `src/features/demo/OccupancyPanel.tsx`, `BookingResults.tsx`: use them.
- Tests: `guest-party.test.ts`, `guest-party-flow.test.ts`.
- Docs: `REVIEW.md`, `BACKEND-HANDOFF.md`.
- QA: `scripts/qa-refine.mjs`, `scripts/shots-refine.mjs`, `screens/refine/`, `e2e-refine/`.
