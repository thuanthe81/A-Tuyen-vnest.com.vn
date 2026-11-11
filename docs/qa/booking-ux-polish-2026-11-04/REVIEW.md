# VNest V3 — Final booking UX polish (4/11/2026)

Status: READY FOR OWNER REVIEW, not frozen. Production build on `vnest-v3-qa` (3402) and `vnest-v3-qa-sim` (3404).
Evidence: `screens/` (12-step 390 px journey + Pepper House), `video/mobile-homepage-journey-390.webm`, `journey-log.json`,
`proposal/` (combined field sketch, current vs proposed).

## 1. Rooms and guests are separate values (applied)

**Cause.** In the shared search-state model (`booking-results-state.ts`), `addRoomGroup` and `setRoomGroupCount` gave every new room
2 adults, `removeRoomGroup` dropped the removed room's guests, and `distributeAdultsAcrossRooms` raised the guest total to the room count.
Every surface (results editor, results sticky bar and sidebar, property page room stepper, same-type "add another unit") used them.

**Now (one rule, same functions, so GoHost multi-room selection keeps working):**
- Adding a room moves one guest into it from the fullest room: 1 room / 3 guests → 2 + 1 → 1 + 1 + 1. The total never changes.
- A room always holds at least one adult, so when no room has a guest to spare, "+ Thêm phòng" is disabled and the editor says
  "Mỗi phòng cần ít nhất 1 khách. Thêm khách để thêm phòng." No occupancy maximum is invented (the existing 8-per-room stepper bound is unchanged).
- Removing a room gives its guests to the room before it (spilling only past that bound). The total never changes.
- Guests are distributed with the existing per-room − / + steppers (an explicit change to a room's guests). Room preferences stay with their rooms.
- Fewer guests than rooms (e.g. the header bar lowered to 2 guests with 3 rooms) reduces the rooms, never adds guests.
- Live validation of the allocation against provider occupancy rules remains a server-side step for when a provider supplies them
  (`stay-validation.ts`, unchanged).

## 2. Combined "Phòng & khách" field (proposal only, not applied)

`proposal/*-current.png` vs `*-proposed.png`, rendered on the live page with the bar's own field and stepper (labels and one cloned
stepper row), at 1440 and 390:
- Field label "PHÒNG & KHÁCH"; value "3 khách · 2 phòng"; panel/sheet: Người lớn stepper, Phòng stepper, one line with the
  allocation ("Phòng 1: 2 khách · Phòng 2: 1 khách") and the rule. No new inputs beyond the room stepper; 44 px touch targets kept.
- **Constraint found:** at the approved widths the value truncates ("3 khách · 2 ph…") in both the desktop field and the mobile pill.
  Options for the owner: (a) show the room count only when it is more than one and accept truncation on long date strings; (b) widen
  the guests field ~3rem at the expense of "Cơ sở" on desktop and use "3 khách · 2 phòng" on the pill's second line; (c) keep rooms in
  the results editor (current). The approved 02.1 bar is unchanged until one is chosen.

## 3. Pepper House 3rd-floor cover (applied)

`02.jpg` now leads the room's own photographs (room card, its viewer and drawer, and the results room card). `08.jpg` stays in the room's
six photographs. The property hero and gallery keep the owner selection order (hero tiles 08, 74, 01, 81, 03, unchanged), the property
cover stays `pepperhouse-74.jpg`, no other property changes, and rights flags are untouched. Implemented as a single owner override
(`ROOM_COVER_OVERRIDES` in `image-selection.ts`).

## 4. QA

| Check | Result |
| --- | --- |
| 1 room / 3 guests → add a room → still 3 (`rooms=2,1&adults=3`) | PASS (390, 1440) |
| Reassign: Phòng 1 −, Phòng 2 + → `rooms=1,2`, 3 guests | PASS |
| Third room → `1,1,1`; adding further disabled with the note | PASS |
| Remove a room → `rooms=1,2`, 3 guests | PASS |
| Property page → Back → refresh keep `rooms=1,2&adults=3` | PASS |
| Homepage search on mobile (390, real taps): sheet, dates, 3 guests, all properties, add room (2,1 / 3), property, Back, edit dates, refresh | PASS; 0 console errors, 0 hydration warnings, scroll lock released |
| GoHost demo (property page): room stepper 1→2→3 keeps 3 guests, decrease keeps 3, room selection works, no price | PASS |
| ezCloud page unchanged: no room selection; hand-off carries `rooms=2,1&adults=3` | PASS |
| Pepper House cover 02 first, 08 kept, hero unchanged | PASS |
| Hybrid e2e suite | 73/73 |
| Mobile interaction suite | 16/16 |
| `npm run check`: lint 0 errors (3 old warnings in `docs/qa` scripts), typecheck, 396 unit tests | PASS |
| Production build | PASS |

Tests changed to the new rule: `booking-results.test.ts` (old expectations replaced; 4 new tests), `mobile-interactions.test.ts`
(expected totals and two expected addresses), `pepper-house/record.test.ts` (room cover + gallery order), `hybrid-booking.test.mjs`
(5 new tests, 2 expectations updated).

## Files changed in this pass

`src/features/demo/booking-results-state.ts`, `src/features/demo/BookingResults.tsx`, `src/features/property-detail/PropertyRoomCollection.tsx`,
`src/content/vnest-workbook/image-selection.ts`, `src/content/drafts/pepper-house/record.ts`, `src/features/demo/selected-photos.ts`, the tests
above, and this folder. Nothing staged, committed, pushed or deployed; the 21 previously staged files are untouched.
