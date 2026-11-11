# Booking search bar — combined "Phòng & khách" field (Option B), 4/11/2026

Status: **APPROVED by the owner on 4/11/2026 — FROZEN** (decision record `docs/decisions/v3-booking-bar-occupancy-field.md`). Production build, `vnest-v3-qa` (3402) and `vnest-v3-qa-sim` (3404).
Evidence: `screens/compare-*.png` (approved 02.1 before / after, same pages, states and viewports), `screens/01–11-*.png` and
`video/mobile-homepage-journey-390.webm` (390 px journey), `journey-log.json`, `compare/` (raw captures), `capture-bar.mjs`, `mobile-journey.mjs`.

## What changed

- **One field, "Phòng & khách"**, reading "3 khách · 2 phòng" in the full bar, the compact header bar, the mobile pill and the sheet.
  Its panel holds two of the bar's own steppers (Người lớn, Phòng) and one line: the split when there is more than one room
  ("Phòng 1: 2 khách · Phòng 2: 1 khách") and the rule ("Thêm phòng không đổi số khách." / "Mỗi phòng cần ít nhất 1 khách.").
  No new input type, no new large control; 44 px touch targets.
- **Allocation logic preserved** (booking-results-state): adding or removing a room never changes the guest total; a new guest joins the
  room with the fewest, a guest leaves the room with the most; guests cannot go below the rooms; room preferences stay with their rooms.
  The per-room split is still edited on the results page.
- **Search state**: the rooms travel as `rooms=2,1` with `adults=3`; the bar reads them from the address, BOOK NOW carries them to the results,
  and on a property page the header field and the room slots follow each other both ways. Back and refresh keep them.
- **Frozen 02.1 surfaces unchanged**: the field is opt-in through the existing `BookingPresentationProvider` (as the BOOK NOW label was).
  `/dev/booking-search`, `/stays` and `/stays/[property]` still show "Khách / 2 khách" with the original proportions (checked).
- GoHost and ezCloud logic untouched; the ezCloud hand-off still carries the rooms.

## Layout (measured, not estimated)

| Surface | Change |
| --- | --- |
| Desktop full bar (≥1024) | field proportions 1.3 : 2.1 : 1.35 (was 1.4 : 2.2 : 1.0); padding unchanged |
| Tablet full bar (768–1023) | proportions 1.38 : 2.15 : 1.47; field padding 14 px instead of 16 px (only with the combined field) |
| Compact header bar | proportions 1 : 1.17 : 1.07; padding 12 px below 1024, 16 px above |
| Mobile hero pill | controlled two-line summary: dates and "3 khách · 2 phòng" each kept whole, never more than two lines (+≈20 px height) |
| Mobile compact (sticky) pill | unchanged single truncating line with the occupancy appended (see below) |
| Mobile sheet | section "Phòng & khách" with the two steppers and the allocation line |

Measured with the longest property name (The Nắng Suites), full dates and "3 khách · 2 phòng" at 768, 820, 900, 1024, 1280 and 1440:
every label on one line and every value whole, on the homepage bar and on the property-page compact bar. No horizontal overflow at
375, 390, 430, 768 or 1440.

## Compromises to accept or reject

1. **Mobile sticky pill (375–430).** It has about 140 px for text. A two-line summary there clipped mid-date, so it keeps the approved single
   truncating line ("10 thg 12 – 12 th…", as before); the full reading is in the hero pill, the sheet and one tap away.
2. **Worst case at exactly 768 px.** A two-digit guest total with six rooms ("18 khách · 6 phòng") is cut by 3 px; it fits from 820 px up.
3. **Tablet padding** is 2 px narrower per side (14 px) on the full bar only below 1024 px, to keep "Nhận phòng" on one line and the property
   name whole. Desktop spacing is unchanged.
4. **Desktop fields** each give up a little width to the combined field (visible in `compare-home-bar-1440.png`); nothing truncates.

## QA

| Check | Result |
| --- | --- |
| Desktop panel @768 and @1440: +guest, +room → "3 khách · 2 phòng"; split line; third room then limits (rooms +, guests − disabled, note); −room keeps 3 guests; dates; BOOK NOW → `rooms=1,2&adults=3` | PASS |
| Property page: page stepper → header summary; header panel → page slots (3 rooms, back to 2); a selected room survives a guest change; no price | PASS |
| Mobile pill @375/390/430: complete summary on ≤2 lines, nothing clipped, no overflow; sheet steppers ≥44 px with the split line | PASS |
| 390 px journey (real taps): sheet → dates → 3 guests → 2 rooms → all properties (`rooms=2,1&adults=3`) → property → Back → edit dates → refresh | PASS; 0 console errors, 0 hydration warnings, scroll lock released |
| Frozen surfaces show the original guests field | PASS |
| Hybrid e2e | 79/79 |
| Mobile interaction suite | 16/16 (two selectors updated: the sheet now has two steppers) |
| `npm run check`: lint 0 errors (3 old warnings in `docs/qa` scripts), typecheck, 400 unit tests | PASS |
| Production build | PASS |

## Files changed

- `src/features/booking-search/presentation.tsx` — opt-in `occupancy` presentation.
- `src/features/booking-search/BookingBar.tsx` — combined field, panel and rebalanced widths when opted in.
- `src/features/booking-search/MobileBookingSearch.tsx` — pill summary and sheet section when opted in.
- `src/features/booking-search/fields/GuestStepper.tsx` — optional wording and minimum; defaults unchanged.
- `src/features/demo/OccupancyPanel.tsx` (new) — the panel.
- `src/features/demo/BookingCta.tsx` — rooms context, presentation and submit wiring.
- `src/features/demo/booking-results-state.ts` — `setTotalAdults`, `roomAdultsFromQuery`.
- `src/features/demo/booking-flow.ts` — the chosen rooms reach the results address.
- `src/features/property-detail/PropertyRoomCollection.tsx` — two-way sync with the header field.
- Tests: `booking-results.test.ts` (2 new), `booking-flow.test.ts` (new, 2), `test/e2e/hybrid-booking.test.mjs` (6 new),
  `test/e2e/mobile-interactions.test.mjs` (2 selectors). This folder.

Nothing staged, committed, pushed or deployed; the 21 previously staged files are untouched.
