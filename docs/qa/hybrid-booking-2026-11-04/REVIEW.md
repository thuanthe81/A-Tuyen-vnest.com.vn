# Hybrid Booking V1 — QA review (4/11/2026)

Status: IN REVIEW, not frozen. Private local preview only. Design and integration notes: `docs/booking/HYBRID-BOOKING-V1.md`.
Evidence: `screens/` (15 screenshots, 1440 and 390), `video/mobile-journey-390.webm`, `capture.mjs`.
Suites: `test/e2e/hybrid-booking.test.mjs` (40), `test/e2e/mobile-interactions.test.mjs` (16), `npm run check` (lint, typecheck, 390 unit tests).
Run on the production build (`vnest-v3-qa`, port 3402) and on dev (port 3401).

## Status by category

| Category | Items |
| --- | --- |
| Implemented and tested | property→provider mapping and booking modes; five typed availability states; unified provider-aware property card; all-properties results; GoHost room flow; ezCloud hand-off state and property-page variant; server-side stay and quantity validation; GoHost adapter boundary (fail-closed); search state in the address, Back, refresh, stale answers; homepage → results journeys |
| Mocked for development | `?sim=` availability states (private review routes only, labelled, amounts flagged "không phải giá thật") |
| Waiting for provider configuration | GoHost: base URL, credentials, property and room ids, rate contract. ezCloud: destinations and parameter names for the four properties |
| Not supported / not built | live availability for ezCloud; any booking creation, hold, payment or confirmation; booking status; one cart across providers; room-specific ezCloud hand-off; price sorting |

## QA matrix

| # | Journey | Result |
| --- | --- | --- |
| 1 | Homepage → search all properties → results (768, 1440) | PASS: six cards, dates/guests kept, `property=all` |
| 2 | Homepage → Bare Đa Kao → GoHost flow | PASS (768, 1440): its 4 rooms only |
| 3 | Homepage → Pepper House → GoHost flow | PASS (768, 1440): its 2 rooms only |
| 4 | Homepage → Bare Chic → ezCloud hand-off | PASS: hand-off state; also via results card, property page, header BOOK NOW, room drawer |
| 5 | Same for Bare Hyphen, Bare Hàn, The Nắng Suites | PASS: results card and property page for all four; Bare Hàn also from the homepage |
| 6 | Edit dates | PASS: stale answers hidden, "Cập nhật kết quả" re-checks, `sim` kept |
| 7 | Change guests and rooms | PASS: same stale/re-check path (+ Thêm phòng); rooms preserved into property pages |
| 8 | Back to results | PASS: one press (a StrictMode double history push was fixed) |
| 9 | Room drawer → booking CTA | PASS: GoHost opens the selection dialog; ezCloud goes to hand-off, scroll lock cleared |
| 10 | Unconfigured provider | PASS: GoHost "unconfigured", ezCloud "needs provider check"; nothing sold out |
| 11 | Provider error | PASS: "Đây không phải là hết phòng", Thử lại; unit test covers a throwing adapter |
| 12 | Six property photos, names, URLs | PASS: 6/6 pages, every hero and room photo loads, only `/dev-client-media/`, viewer opens, at 390 and 1440 |
| 13 | Mobile menu, galleries, sticky CTA, Nest Converge | PASS: 16/16 existing mobile interaction tests; Nest Converge runs and clears, no errors at 1440 and 390 |
| 14 | Console and hydration errors | PASS: none in any suite (third-party Google Maps embeds return 404 in headless Chrome and are excluded) |

Widths 375, 390, 430, 768, 1440: results (all properties) PASS no overflow at all five; hand-off at 390; ezCloud page at 390; mobile suite covers all five.

## Existing tests changed

`mobile-interactions.test.mjs` used Bare Chic for first-party slot selection and for the "BOOK NOW" drawer button. Bare Chic is now an
ezCloud hand-off property by design, so step 6d, the scroll-lock steps 2–4 and the continuation step now assert the hand-off on Bare Chic
and keep the slot-selection assertions on Bare Đa Kao (GoHost). Nothing else in that file changed.

## Limitations

- Nothing verified against a real provider; no GoHost or ezCloud response has ever been received.
- The homepage journeys were run at 768 and 1440. The phone bottom-sheet search (375–430) was not driven end to end from the homepage in this suite (the existing mobile suite covers the sheet); mobile results were driven by address.
- The 02.1 bar has no room-count field; the count comes from the address and the results editor.
- A production-server `_next/image` request for one Pepper House photo stalled once under load and did not recur after a restart or in two further full runs (40/40 each).
- Lint: 0 errors; 3 warnings in old `docs/qa` scripts.
- Pre-existing (not changed): the Google Maps embeds 404 in headless Chrome.

## Owner decisions

1. Hand-off CTA wording "Kiểm tra giá & đặt phòng" replaces BOOK NOW on ezCloud drawers, viewers and results. The header bar keeps BOOK NOW (frozen 02.1 styling). Approve or unify.
2. The all-properties results are now property cards (provider-aware), replacing the room-first list for "all". Room-first remains for a single GoHost property.
3. Add a room-count field to the approved 02.1 bar? (Currently preserved and editable on results only.)
4. Simulation (`?sim=`) stays only on private review routes; confirm it must never ship.
5. Wording for the unconfigured GoHost state and the "needs provider check" line for ezCloud.
6. What a guest sees for ezCloud once the real destination exists (new tab vs same tab; the return path is not assumed).
