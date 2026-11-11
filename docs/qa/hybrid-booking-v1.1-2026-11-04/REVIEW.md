# Hybrid Booking V1.1 — QA review (4/11/2026)

Status: IN REVIEW, not frozen. Private local preview. Builds on V1 (`docs/qa/hybrid-booking-2026-11-04/REVIEW.md`).
Evidence: `screens/` (10), `video/mobile-navigation-390.webm`, `capture.mjs`. Import provenance: `docs/content/pepper-house-2026-11-04/`.

## 1. Navigation

**Root cause.** In V1 the results card's primary action for GoHost properties switched the results page into its room-first
scope (`handleSelectProperty`), and the ezCloud card's primary action went to the hand-off state. The name and the photo were not
links, so the property detail page was reachable only through a secondary "Xem chi tiết". Homepage cards and related-property cards
already pointed at the six detail pages; the inconsistency was only in the hybrid results.

**Second defect found while testing Back.** The results page wrote `history.replaceState(null, …)` on mount (and `pushState(null, …)`
when switching property), which erased Next.js's own entry state. Back from a property page then changed the address to the results
but left the property page on screen. The header's in-page anchors (`SiteHeader`) had the same pattern. Both now keep
`window.history.state`.

| Journey | Before (V1) | After (V1.1) |
| --- | --- | --- |
| Results card → Bare Đa Kao / Pepper House | "Xem phòng" → room-first list inside the results | "Chọn phòng", name or photo → property detail page (stay kept) → rooms → GoHost selection |
| Results card → ezCloud property | "Kiểm tra giá & đặt phòng" → hand-off state | "Chọn phòng", name or photo → property detail page; "Kiểm tra giá & đặt phòng" is the secondary action |
| Explicit availability search (GoHost) | — | "Kiểm tra phòng trống" → room-first results for that property (kept on purpose) |
| Search bar with a property chosen | results scoped to it | unchanged: an explicit date search (GoHost room-first, ezCloud hand-off state) |
| Back from a property page to the results | address changed, page did not | returns to the result list |

CTA wording: discovery "Chọn phòng" / "Xem các phòng"; availability "Kiểm tra phòng trống"; ezCloud booking "Kiểm tra giá & đặt phòng";
the header keeps BOOK NOW.

## 2. Simulation guard

`AVAILABILITY_SIMULATION=private-review` (default `off`) is required, and it is honoured only on a DECLARED development deployment.
Asking for it on preview or production stops the server, an unidentified server is refused, and a typo is rejected. The composition root
(`getServices().hybridAvailability`) drops any simulation unless the guard passed, so a route name grants nothing. A separate launch
configuration `vnest-v3-qa-sim` (port 3404) is the only one with it; `vnest-v3-qa` (3402) ignores `?sim=` (tested).

## 3. Pepper House photography

Source: `/Users/noe/Documents/VNest Media/Pepper House/` — folders `3th-floor` (6 files) and `4th-floor` (6 files). The source folder
was only read: its hashes, names, sizes and timestamps are identical before and after.

| File | Floor | Decision | Reason |
| --- | --- | --- | --- |
| 3th-floor/02.jpg, 04.jpg, 09.jpg | 3rd | **Accepted** | new; pale-blue walls, wood floor, navy sofa: unambiguously 3rd floor |
| 3th-floor/01.jpg, 03.jpg, 08.jpg | 3rd | Already in use | 01 = sel-16, 03 = G2 `pepper-house` (sha256 match), 08 = sel-15 (room cover) |
| 4th-floor/pepperhouse-72, -76, -79, -81 | 4th | **Accepted** | new; concrete walls, tan leather sofa, cement tiles: unambiguously 4th floor |
| 4th-floor/pepperhouse-74.jpg | 4th | Already in use | sel-17 (room and property cover) |
| 4th-floor/pepperhouse-72 (1).jpg | — | **Excluded** | byte-identical duplicate of pepperhouse-72.jpg |

No image showed a person, a screenshot or damage; all are 2048×1365 JPEG. Nothing was ambiguous.

**Room galleries** (owner selections first, unchanged):
- Pepper House 3rd-floor (6): sel-15 (08), sel-16 (01), pepper-house (03), 02, 09, 04
- Pepper House 4th-floor (5): sel-17 (74), 81, 72, 79, 76

**Covers.** The owner-approved covers are unchanged (3rd-floor: 08.jpg, a shelf detail; 4th-floor and property: pepperhouse-74.jpg).
For a clearer 3rd-floor room cover, 03.jpg or 02.jpg (bedroom with the window) would read better than 08.jpg — owner decision.

**Derivatives and manifest.** `import-pepper-house.mjs` (check by default, `--apply` to import) copied 7 originals read-only to
`.local-media/client-photos/pepper-house-2026-11-04/`, derived 84 files (7 × 480/800/1200/1600 × AVIF/WebP/JPEG, the existing recipe) and
merged 7 entries into `public/dev-client-media/manifest.json` (310 → 317). Backup first:
`.local-media/backups/manifest.before-pepper-house-2026-11-04.json`. Verified: 0 of 310 existing entries changed, 0 of 3,962 existing
files missing, all 3,804 variant paths and 240 selection paths resolve. The legacy `fetch-photos.mjs --derive` was not run.
All of it stays git-ignored: a deployment that should show these photographs needs its own media upload step (not built).

## 4. QA (production build, ports 3402 and 3404)

| # | Check | Result |
| --- | --- | --- |
| 1–2 | Homepage → Bare Đa Kao / Pepper House card → detail page; Back → homepage (390, 1440) | PASS |
| 3–6 | Results → each of the six cards ("Chọn phòng") → detail page with dates/guests/rooms; Back → results (390, 1440); name and photo links | PASS |
| 7 | "Kiểm tra phòng trống" keeps the room-first search; Back one press | PASS |
| 8 | Preferences survive (dates, adults, rooms in the detail URL; homepage search keeps adults) | PASS |
| 9 | Back: results ↔ detail, home ↔ detail, Menu anchor → card → Back | PASS (after the history fix) |
| 10–11 | 3rd-floor shows 6 photographs, all 3rd-floor; 4th-floor 5, all 4th-floor; 11 distinct; none stretched — at 375/390/430/768/1440 | PASS |
| 12 | Mobile swipe, both room drawers, "Xem tất cả 11 ảnh", GoHost demo selection | PASS |
| 13 | No original or manifest entry lost (counts and hashes above) | PASS |
| 14 | No unverified availability or price on the closed server, even with `?sim=` | PASS |
| 15 | Nest Converge (runs and clears, 1440 and 390), menu, sticky controls, scroll lock — existing mobile suite | PASS 16/16 |
| — | Hybrid e2e suite | PASS 67/67 |
| — | `npm run check`: lint 0 errors (3 old warnings in `docs/qa` scripts), typecheck, 393 unit tests | PASS |
| — | Production build | PASS |

## Limitations

- Still no real GoHost or ezCloud response; GoHost selection remains a demo preference.
- The phone bottom-sheet search on the homepage is covered by the existing mobile suite, not driven end to end by the new one.
- "Before" journeys are described from the V1 code and evidence (`docs/qa/hybrid-booking-2026-11-04/`), not re-captured.
- The new photographs carry `rights: client-supplied-pending`, like the 29/10 import; no photographer or licence has been stated.
