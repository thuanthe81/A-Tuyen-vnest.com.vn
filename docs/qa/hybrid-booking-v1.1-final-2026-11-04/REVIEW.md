# Hybrid Booking V1.1 — final checks before freeze (4/11/2026)

Status: READY FOR OWNER ACCEPTANCE, not frozen. Production build, `vnest-v3-qa` (3402) and `vnest-v3-qa-sim` (3404).
Evidence in this folder: `screens/` (cover comparison + 12 journey steps), `video/mobile-homepage-journey-390.webm`,
`journey-log.json` (URL, scroll lock, open dialogs, router state per step), `mobile-journey.mjs` (re-runnable).

## 1. Pepper House 3rd-floor cover

Visual evidence: `screens/01-3rd-floor-cover-candidates.jpg` (each image at the card's 3:2 crop and at 4:3).

| Image | What it shows | As a room overview |
| --- | --- | --- |
| 08.jpg (sel-15, current approved cover) | wooden shelf with books and frames, corridor beyond | detail shot; the bed and room layout are not visible |
| 03.jpg (G2) | bed, armchair, full-height window with trees | good bedroom view; the bed is cut at the right edge |
| 02.jpg (new) | whole bed and headboard, window wall with trees, AC and the living zone behind | **clearest overview**: bed, light, window and the room's depth in one frame |

**Recommendation: 02.jpg** as the 3rd-floor room cover (03.jpg second). Not applied: 08.jpg was selected by the owner on
26/10 (`image-selection.ts`, sel-15) and stays until the owner decides. Changing it is one entry in the image selection.

## 2. Mobile homepage booking journey (390×844, touch)

| # | Step (real taps) | Verified |
| --- | --- | --- |
| 1 | Homepage | no scroll lock, no horizontal overflow |
| 2 | Open the search sheet | one dialog open, page scroll locked |
| 3 | Dates 10 → 12 Dec | sheet shows "10 thg 12 – 12 thg 12" |
| 4 | Guests 2 → 3 | "Người lớn 3" |
| 5 | BOOK NOW (all properties) | URL `property=all&checkIn=2026-12-10&checkOut=2026-12-12&rooms=1&adults=3`; sheet closed; scroll lock released; router state kept |
| 6–7 | Rooms: "+ Thêm phòng", Áp dụng (results editor) | URL `rooms=3,2&adults=5` |
| 8–9 | "Chọn phòng" on Pepper House | detail page, same dates and `rooms=3,2`; room control shows 2 rooms |
| 10 | Browser Back | same results URL (`rooms=3,2`), list restored at the Pepper House card |
| 11 | Edit the search: 15 → 17 Dec | URL and summary updated; rooms and guests kept |
| 12 | Refresh | edited search kept |

Console errors 0, hydration warnings 0, 404s on the site's own origin 0, no dialog left open, scroll lock empty after every overlay.

**Bug found and fixed.** Before the fix, step 10 reverted to the original search (`rooms=1&adults=3`): Back restored the results page from
the render made for its original address, and the page took its state from those props, then rewrote the address. The results page now
reads its state from the router's current search params (`useSearchParams`), which include edits made on the page. Regression test added
to `test/e2e/hybrid-booking.test.mjs`.

**Observed, unchanged (owner decision):**
- The approved 02.1 search sheet has no room-count field; rooms are set in the results editor.
- "+ Thêm phòng" adds a room with 2 adults, so the guest total rises (3 → 5 above). This is the existing results-editor default.

## 3. Simulation on public environments

Real `next start` processes with public settings (production build of this branch):

| Configuration | Result |
| --- | --- |
| `DEPLOY_ENV=production` + `AVAILABILITY_SIMULATION=private-review` | server refuses to start: "for private local QA only, not a production deployment" |
| `DEPLOY_ENV=preview` + flag | server refuses to start |
| `DEPLOY_ENV=production`, no flag, `?sim=` in the URL | `/dev/demo/tim-phong` → 404; no simulated text |
| no `DEPLOY_ENV` declared + flag | `/dev/demo/tim-phong` → 404; simulation off (`availabilitySimulation=false`) |
| `vnest-v3-qa` (declared development, no flag), `?sim=` | page renders real states only; no banner, no simulated price (e2e) |

Unit tests cover the same rules plus a mistyped value (`AVAILABILITY_SIMULATION=yes` is rejected). `getServices()` drops any simulation
unless the guard passed, so no route can turn it on.

## 4. Remaining dependencies (blockers for a public release, not for this preview)

**Client media deployment.** All client photography is local and git-ignored: originals in `.local-media/` (867 MB) and derivatives plus
manifests in `public/dev-client-media/` (281 MB: 317 manifest entries, 16 selection entries). A clone or a deployment has none of it and
falls back to placeholders. A public site needs a decided media host or upload step, built from the manifests without rewriting them
(never `fetch-photos.mjs --derive`). Note: GitHub Desktop stashed these folders once when switching to `main`, where they are not ignored.

**Image rights.** No photograph has a confirmed licence or credit:
- 22 (G2, G3, G4): `client-supplied-unconfirmed`; the G2 authorisation fields (name, capacity, reference) are still blank.
- 269 (29/10 VNest Media import, 262; Pepper House 4/11, 7): `client-supplied-pending`.
- 26 older demo entries carry no rights field.
- Held images with a visible person stay excluded (`RELEASE_HOLDS`); image 02 of the hero selection is still held.
VNest must confirm photographer, licence and credit (audit Q15) before any public use.

**Providers.** Unchanged: GoHost credentials, property and room ids and rate contract; ezCloud destinations and parameter names.

## 5. Final results

Hybrid e2e 68/68 · mobile interaction suite 16/16 · 390 px journey PASS · `npm run check` (lint 0 errors, 3 old warnings in `docs/qa`
scripts; typecheck; 393 unit tests) · production build PASS.

Files changed in this pass: `src/features/demo/BookingResults.tsx` (state from search params), `test/e2e/hybrid-booking.test.mjs`
(regression test), this folder. The 21 previously staged files are untouched; nothing staged, committed or pushed.
