# Simplified room selection (5/11/2026)

Status: READY FOR OWNER VISUAL ACCEPTANCE, not frozen. Production build on `vnest-v3-qa`:
- GoHost demo: http://localhost:3402/dev/stays/bare-da-kao?view=demo&checkIn=2026-12-10&checkOut=2026-12-12&rooms=2,1&adults=3
- ezCloud hand-off: http://localhost:3402/dev/stays/bare-chic?view=demo&checkIn=2026-12-10&checkOut=2026-12-12&rooms=2,1&adults=3

## 1. Occupancy audit

| Source | What it says |
| --- | --- |
| VNest workbook v2 (20/10/2026, the current one) | No capacity column for any room. |
| 15/10 room sheet (`legacy-room-sheet.ts`, marked "not reconfirmed") | "2 người lớn" in one merged cell, F4:F25, covering all 22 rooms. Only Bare Chic One has it on its own row. |
| Room records / provider data | No per-room limit (`verifiedMaxAdults` is null for every room; GoHost and ezCloud supply none yet). |
| Earlier decision R3 (25/10/2026) | Capacity was display-only, "never an eligibility rule", until ezCloud supplies limits. |

**Result:** no room has a different capacity anywhere, and the only data that exists (2 adults) agrees with your rule.
It is not confirmed by the current workbook or by a provider. So the rule of **1–2 guests per room** is applied to every
bookable room from one place, `src/domain/hybrid-booking/room-occupancy.ts`, and **needs VNest confirmation before
publication**. It replaces R3's "display-only" reading. No child, infant or extra-bed policy was added; none is supplied.
A stricter per-room limit from a provider, once supplied, still applies on top.

## 2. What was removed

From the room-selection card on GoHost property pages (screens `before-*` → `after-*`):
- the "Số phòng" stepper (− 2 phòng +);
- "Đang chọn: Phòng 2/2" with its per-room guest stepper (− 1 khách +);
- the "1/2 phòng đã chọn" badge and the second BOOK NOW in the card (the sticky bar below the room cards keeps the only
  one);
- in the sticky bar: "· 3 khách · Đang chọn Phòng 2" and the repeated list of room names while a slot is still empty.

Also removed, as asked: the dashed draft-status notes under the Services and FAQ titles on the homepage. Their text is
kept in `docs/qa/homepage-content-2026-11-05/REVIEW.md` §2.

## 3. What the room step shows now

- **Stay dates:** the existing date button, which opens the page calendar.
- **"Phòng & khách: 3 khách · 2 phòng":** a compact summary. Pressing it opens the header bar's own "Phòng & khách" field
  (the desktop panel, or the phone sheet's section), so guest and room steppers exist in one place only. The approved bar is
  not changed: the summary presses its existing controls.
- **Room slots**, e.g. "Phòng 01 — Bare Đa Kao Two ×" and "Phòng 02 — Chưa chọn ×". The outlined slot is the one the
  next "Chọn phòng" fills; a tap on another slot moves it there. × clears a chosen room, or removes an empty slot.
  "+ Thêm phòng" adds a slot.
- **Rooms selected and one BOOK NOW:** in the sticky bar ("1/2 phòng đã chọn"), with the next step underneath
  ("Tiếp theo: chọn loại phòng cho Phòng 02").
- Room cards, galleries, drawers and "Chọn phòng" buttons are unchanged.
- ezCloud pages keep their single hand-off action and now show the same summary (it was "2 phòng · 3 khách" plain text).

## 4. Rules and behaviour

| Case | Result |
| --- | --- |
| 1 guest | 1 room |
| 2 guests | 1 room |
| 3 guests | 2 rooms, [2, 1] |
| 4 guests | 2 rooms, [2, 2] |
| 5 guests | 3 rooms, [2, 2, 1] |
| A guest added past two per room (header field) | A room is added and the note says why: "Mỗi phòng tối đa 2 khách: 5 khách cần ít nhất 3 phòng." |
| Fewer rooms than the guests need | "Bớt một phòng" is disabled in the header field. Removing a slot here explains: "3 khách cần ít nhất 2 phòng (mỗi phòng tối đa 2 khách). Giảm số khách ở mục Phòng & khách trước khi bớt phòng." Nothing changes. |
| More rooms than guests | "+ Thêm phòng" explains: "Mỗi phòng cần ít nhất 1 khách: 3 khách dùng được tối đa 3 phòng. Tăng số khách…" |
| Limit per request | 6 rooms, 12 guests (the existing 6-room limit × 2). |
| Older addresses (`rooms=1&adults=3`, `rooms=3,1`) | Respread over the rooms needed; no guest is dropped. |

Guests are never discarded: the total stays in the booking state, the address (`adults=`, `rooms=2,1`) and every provider
hand-off. Chosen rooms keep their slot when guests are respread or a room is added. Back, refresh and the address format are
unchanged. The server-side stay check (`validateStay`, run before any availability call) uses the same rule. No price or
availability was added.

## 5. BOOK NOW

| Pressed with | What happens |
| --- | --- |
| No stay dates | Alert under BOOK NOW: "Chọn ngày nhận và trả phòng để tiếp tục."; the date button is marked and the calendar opens. |
| A slot without a room type | "Chọn loại phòng cho Phòng 02 để tiếp tục."; the slot is marked and becomes the one to fill; the page scrolls to the rooms. |
| A disallowed occupancy (e.g. the search holds more guests than the slots seat) | "Mỗi phòng tối đa 2 khách: 5 khách cần ít nhất 3 phòng. Điều chỉnh ở mục Phòng & khách để tiếp tục."; the shared field opens. |
| A complete request | The existing review dialog. It says that online booking is not connected and that nothing is held or paid. "Tiếp tục" leads to the same honest booking step. |

The alert is `role="alert"`, tied to the button with `aria-describedby`, recomputed as the guest fixes it, and gone once
resolved. The header bar's BOOK NOW on a property page runs the same check.

## 6. QA (production build)

| Check | Result |
| --- | --- |
| Room selection e2e, 1440 and 390 (`test/e2e/room-selection.test.mjs`): 1/1, 2/1, 3/2, 4/2, 5/3 (slots, select, review, provider-step address keeps the guest total); no stepper or "Đang chọn"; one BOOK NOW; guidance for no dates and an incomplete selection; add, refuse with reason, remove; chosen rooms kept; refresh and Back; the summary opens the header field (desktop panel and phone sheet); 5 guests force 3 rooms; ezCloud hand-off carries the stay; no overflow; no console errors | 18/18 |
| Regressions: hybrid booking (GoHost and ezCloud flows, results page, header field) · mobile interactions (Chromium and WebKit) · About · homepage content | 79/79 · 16/16 · 16/16 · 11/11 |
| Unit: occupancy rule, owner cases, issues, server validation, guidance, header-field note, state helpers | 419 pass |
| `npm run check` (lint 0 errors; 3 old warnings in `docs/qa` scripts), typecheck, production build | PASS |

Tests that encoded the old "up to 8 per room" behaviour were rewritten to the rule, keeping their intent (guest totals
preserved, preferences kept, refresh round-trips). The changed expectations are visible in the diff of
`booking-results.test.ts`, `booking-flow.test.ts`, `v3-stage1.test.ts`, `mobile-interactions.test.ts` and
`test/e2e/hybrid-booking.test.mjs`.

Screenshots (`screens/`):
- `before-*` / `after-*`: `gohost-3g2r-one-selected`, `gohost-nodates`, `ezcloud-handoff`, at 1440 and 390, plus the sticky bar.
- `after-guidance-dates-*`, `after-guidance-rooms-*`, `after-remove-refused-*` (card and bar).
- `after-review-3g2r-*`: the review dialog.

Script: `scripts/capture.mjs`.

## 7. Open

1. **Confirm the 1–2 guest rule with VNest** (or obtain GoHost and ezCloud room limits) before publication.
2. **The results page (`/dev/demo/tim-phong`) still has its own per-room guest steppers.** It already follows the 2-per-room
   cap. Simplifying its UI the same way was outside this brief.
3. **The header field's panel now adds a room automatically** when a guest is added past two per room, and its note line
   states the rule. This is a behaviour change inside the approved bar's "Phòng & khách" panel; its look is unchanged.

Nothing staged, committed, pushed or deployed.
