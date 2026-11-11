# VNest V3 · Phase E: website audit and production readiness

Audit of the working tree on `feat/vnest-v3-media-import`, 10/11/2026. Audit only: no feature, design or content was changed.
Status: **delivered for owner approval**. Nothing is staged, committed, pushed or deployed; the 21 staged files and
`stash@{0}` are untouched.

## 1. Verdict

- **As a private demo, the site works.** On a fresh production build every automated check passes, nothing overflows
  horizontally at any width, layout shift stays at or below 0.01, and the booking journey never claims an availability
  or price it cannot verify.
- **The site cannot be released publicly yet.** Two reasons:
  1. **Route promotion (BMP).** Everything approved lives under private `/dev/*` routes, and a production deployment
     answers 404 on all of them. The public `/` is still the Phase 01 placeholder.
  2. **Inputs only VNest or the providers can give.** Image rights, provider credentials and booking URLs, policies,
     the privacy notice and the form destination, and final content approval.
- **Biggest risk today is not in the code.** About 1,170 files of work (80 modified, 21 staged, 1,072 untracked,
  including 86 source files) exist only on this machine, on a branch that has never been pushed.

## 2. Test evidence (production build)

The build ran in a copy-on-write clone (`next build` with `DEPLOY_ENV=development CONTENT_SOURCE=client-draft
BOOKING_PROVIDER=none`), served on port 3405, with port 3406 for the simulation server. I used a clone because the
safety check would not let me stop the stale QA server on 3402.

| Check | Result | Log |
| --- | --- | --- |
| `npm run typecheck` | pass | `e2e/typecheck.log` |
| `npm run lint` | 0 errors, 3 warnings (all in `docs/qa/**` scripts) | `e2e/lint.log` |
| Unit tests `npm test` | **464 / 464** | `e2e/unit-tests.log` |
| `next build` | pass; 22 static pages, all `/dev/*` dynamic | `e2e/build.log` |
| e2e `about-vnest` | 16 / 16 | `e2e/about-vnest.log` |
| e2e `homepage-content` | 11 / 11 | |
| e2e `hybrid-booking` (with sim server) | 79 / 79 | |
| e2e `occupancy` | 10 / 10 | |
| e2e `room-selection` | 22 / 22 | |
| e2e `mobile-interactions` (incl. WebKit over LAN) | 16 / 16 | |
| `test:promotion` (indexing lock, 5 real builds) | **15 / 15** | `e2e/build-promotion.log` |
| Page audit: 10 pages × VI/EN × 1440/768/390 = 60 views (metadata, headings, overflow, console, CLS/LCP, language leftovers, axe WCAG 2.1 A/AA) | see §4 | `pages.json`, `scripts/audit-pages.mjs` |
| Journey screenshots (intro, menu, guest panel, results, room selection, review, booking step, form, language switch) | 15 / 16 steps; one phone finding (F-B3) | `journey.log`, `scripts/journey-shots.mjs` |

**Test-environment artefacts, not application bugs:**
- **Google Maps 404.** The embeds on Bare Chic, Bare Đa Kao and The Nắng Suites return 404 in headless Chromium only.
  The same URLs return 200 to a normal browser user agent.
- **Hidden duplicate elements.** The first run of my journey script tapped hidden desktop duplicates on phones. Fixed in
  the script; the app was fine.
- **Full-page screenshots.** These can catch a button mid-transition, so the select-room button can look faded. It was
  measured at rest and is a solid copper outline.

**Screenshots:** `shots/` (62 files).
- Full pages at 1440 and 390: `home`, `hop-tac`, `results`, `bare-chic`, `bare-da-kao` (`*-vi-1440-full.jpg`,
  `*-vi-390-full.jpg`).
- First screen of every page at 1440 and 390: `<page>-vi-<width>.jpg`; English versions for home, hop-tac and
  bare-chic.
- Journey: `journey-1440-*.jpg`, `journey-390-*.jpg`.

## 3. Status at a glance

| Area | Implemented & working | Visually approved, still to verify / accept | Incomplete or mocked |
| --- | --- | --- | --- |
| Homepage | Hero carousel, intro once per load, booking bar (adults + children), Brand Collection, Discovery filters, Coming Soon card, About, Services accordion, FAQ, Contact, menu, footer | Phase C artwork, CTA correction, About copper contrast decision | Consultation form (validates, never sends); "Visit us ↗" (no URLs) |
| Partner page `/dev/demo/hop-tac` | Hero, 3 service chapters, Why VNest, 3-step process, brand row, FAQ, contact + form; private + noindex verified | 10/11 polish awaiting visual review | Draft labels and English awaiting VNest; `PROCESS_DETAILS` / `PENDING_STRENGTHS` intentionally empty |
| Property pages (6) | Gallery + lightbox, identity, amenities, room collection, location, City Notes, related stays, header bar | Bare Chic G4 direction (not frozen) | Policies "Chờ VNest xác nhận" on all 6; maps on 3 of 6; prices: none approved |
| Booking | Dates, adults, children, explicit rooms, occupancy correction, Back / refresh, review dialog, honest booking step | Phase D final refinement, occupancy correction | GoHost and ezCloud both unconfigured; nothing can be booked |
| Localization | Switch "VI / EN" keeps parameters and replaces history; `<html lang>` follows | — | English covers about half the homepage and the partner page only |
| SEO | Three-way indexing lock (proven), noindex on every `/dev` route, robots and sitemap closed | — | No public routes for the new pages, no descriptions, no OG images, no JSON-LD, no favicon |

## 4. Findings

Severity: **Blocker** stops public release · **High** must be fixed before release · **Medium** should be fixed ·
**Low** optional. Responsible: **BMP**, **VNest**, **Backend** (the separate backend developer), **Owner**
(decision only).

### A. Homepage and navigation

| ID | Finding | Evidence | Severity | Resolution | Who |
| --- | --- | --- | --- | --- | --- |
| A1 | On phones the three brand rows in "Ba thương hiệu" are logo-only buttons with **no accessible name**; screen readers announce "button" | axe `button-name` (critical) on `home-*-390`; `BrandShowcase.tsx` rows | High | Give each row an `aria-label` with the brand name (no visual change) | BMP |
| A2 | Header tagline "HOSPITALITY MANAGEMENT" is copper #A87444 on white at 9 px: 4.0:1 (needs 4.5:1) | axe `color-contrast`, every page | Medium | Darken to #9A683C (the approved text-safe copper), or accept as a logo lockup (logos are exempt) | Owner → BMP |
| A3 | About "Ở." is 2.67:1 copper on olive (open since 4/11) | axe; `AboutVNest.module.css` | Medium | Owner decision already pending: keep (decorative) or switch to #C08A57 (3.58:1) | Owner |
| A4 | Booking-bar field labels and eyebrows use #8A8173: 3.84:1 on white, 3.26:1 on sand; accordion numbers 3.4:1; inactive "EN" link 3.59:1 | axe, every page | Medium | Darken those tokens one step. Visual change to a frozen surface (02.1), so it needs owner approval | Owner → BMP |
| A5 | Logo link and VI/EN links: visible text is not part of the accessible name ("EN" vs "English") | axe `label-content-name-mismatch` | Low | Start each aria-label with the visible text ("EN, English") | BMP |
| A6 | Homepage loads all six hero slides at once (five not visible, ~210 KB); brand logos are 767–1406 px wide for 40–140 px display | performance entries | Low | Lazy-load slides 2–6 after the first; export logos at 2× display size | BMP |
| A7 | Hidden keyboard-only "pause slideshow" button is 1×1 px | target scan | Low | Fine while hidden; make sure it is ≥ 24 px when focused | BMP |
| A8 | Homepage title is "VNest · bản trình diễn" with no description | `pages.json` | (see F) | Set at route promotion | BMP |

Working: every internal link returns 200; one h1 per page; no heading skips; no images without alt; no horizontal
overflow at 390/768/1440; CLS 0.004–0.010; the intro plays once per full load and `?intro=0` skips it.

### B. Property pages

| ID | Finding | Evidence | Severity | Resolution | Who |
| --- | --- | --- | --- | --- | --- |
| B1 | Cancellation, house rules and payment policies read "Chờ VNest xác nhận" on all six properties | HTML scan of `/dev/stays/*` | Blocker | VNest supplies the policies (the "Booking & chính sách" sheet is still missing) | VNest |
| B2 | Room facts ("2 người lớn", sizes) are display-only, still awaiting written confirmation (Q37). The 1–2 adults per room rule is provisional | `ROOM_FACT_INTERPRETATION`, `room-occupancy.ts` | Blocker | VNest confirms in writing | VNest |
| B3 | On phones, an ezCloud property's own "Kiểm tra giá & đặt phòng" button in the room step exists but is never displayed (height 0). The header BOOK NOW still leads to the hand-off state | `journey.log` (Bare Chic at 390) | Medium | Check whether that is intended for phones; if not, show it below the room list | BMP |
| B4 | Map embed on 3 of 6 properties only (Bare Hyphen, Bare Hàn and Pepper House have none). The Nắng address conflict (74/31 vs K174/31, Q19) and the Hyphen / Đa Kao districts (Q20) are open | `pages.json` failed-requests list, memory audit | High | VNest confirms addresses; BMP adds verified embeds | VNest → BMP |
| B5 | Room-photo dot buttons are 14×14 px (WCAG 2.2 target size wants 24 px or spacing) | axe `target-size` | Low | Enlarge the hit area, keep the dot drawing | BMP |
| B6 | Naming drift in alt text: "3rd Floor" / "3rd-floor" / "4th-floor"; workbook text writes "Bare Han" without the accent | page text | Low | Normalise when English property copy is drafted | BMP / VNest |
| B7 | Six near-identical page files (`src/app/dev/stays/*/page.tsx`, about 80 lines each) | `diff` | Low | At promotion, one dynamic `[slug]` route with per-property options | BMP |

Working: 4 / 4 / 4 / 4 / 2 / 4 rooms render with their own photos (galleries of 63, 104, 108, 22, 11 and 20 distinct
images). Room selection, the review dialog and the booking step behave as specified (`journey-*-05` to `-07`).
Related-stays and "Xem tất cả nơi ở" links resolve. The "Chờ VNest (chỉ hiện trong bản xem trước)" notes appear only
because the review flag is on locally. Confirm they disappear once a public build exists (it cannot be checked today,
because production 404s these routes).

### C. Partner page `/dev/demo/hop-tac`

| ID | Finding | Evidence | Severity | Resolution | Who |
| --- | --- | --- | --- | --- | --- |
| C1 | Private and noindex confirmed three ways: meta `noindex, nofollow`, `X-Robots-Tag` header, robots `Disallow: /`. 404 in production | `pages.json`, curl | OK | Keep until VNest approves; planned public path `/hop-tac` | — |
| C2 | Visual Accordion integration and approved CTA scoping are in place: solid copper on the homepage, wipe only on this page | screenshots `hop-tac-*` | Awaiting acceptance | Owner visual acceptance of the 10/11 polish | Owner |
| C3 | Section labels, kicker, "Why VNest" wording and English alt text are DRAFT (`partner-page-content.ts` statuses) | source | High | VNest approves or edits the draft wording | VNest |
| C4 | Shared consultation form has no destination and no privacy notice (see H) | `Consultation.tsx` | Blocker (form only) | See H5 | Backend + VNest |

Working: English is complete apart from proper names and the address; no console errors; CLS 0; form validation
announces errors and moves focus; a valid submit clearly says "Chưa gửi" (not sent).

### D. Localization

| ID | Finding | Evidence | Severity | Resolution | Who |
| --- | --- | --- | --- | --- | --- |
| D1 | Under `?lang=en` these stay Vietnamese: the booking bar (homepage and header), Discovery (heading, filters, cities, card meta, "Xem giá theo ngày"), results page (29 strings), booking step (25), and **all six property pages (59–77 strings each, plus ~55 Vietnamese aria-labels and alts)** | `pages.json` `otherLanguageText` / `otherLanguageAttrs` | High (Blocker for an English launch) | Owner chooses: (a) launch Vietnamese-only and hide the switch, or (b) finish phases B+ of `docs/i18n/BILINGUAL-PLAN.md` (≈540 UI strings + ≈300 property strings, English for VNest approval) | Owner → BMP, VNest |
| D2 | The VI/EN switch shows on every page, including ones with no English | screenshots | Medium (demo) | Until D1 is decided, show it only where English exists, or accept for the demo | Owner |
| D3 | On the Vietnamese pages, English appears only by design: "BOOK NOW", "Menu", "ABOUT VNEST.", "VNEST / OUR STORY", brand names | `pages.json` | OK | Already approved | — |
| D4 | Client flags on the frozen 05.11 copy are still open: English FAQ 1 shorter, document header says draft, official spelling of "The Nắng Suites" | memory, decision record | Blocker (publication) | VNest closes the three flags | VNest |

Working: switching keeps every parameter and replaces the history entry, and `<html lang>` follows the language
(checked both ways at 1440 and 390).

### E. Booking

| ID | Finding | Evidence | Severity | Resolution | Who |
| --- | --- | --- | --- | --- | --- |
| E1 | **No guest can book.** GoHost (Bare Đa Kao, Pepper House) is unconfigured: no API base, key, property/room ids or rate contract. `initiateBooking` is disabled | `gohost-adapter.ts`, `property-provider-routing.ts` | Blocker | VNest supplies the GoHost contract; backend implements against it | VNest → Backend |
| E2 | ezCloud hand-off unconfigured for Bare Chic, Bare Hyphen, Bare Hàn and The Nắng Suites; guests see an honest "chưa được kết nối" state | `EZCLOUD_HANDOFF_BY_PROPERTY` | Blocker | VNest supplies the official booking URL per property and the accepted parameter names | VNest → BMP (config only) |
| E3 | Child policy unconfirmed: any party with children is held at `children-policy` before a provider call | `CHILD_POLICY`, `guest-party.ts` | Blocker | VNest confirms age bands, charges, per-room limits, cots | VNest |
| E4 | No approved public rates; every card says "Xem giá theo ngày" | `public-rates.ts` empty | OK (by design) | Only if VNest wants "from" prices | VNest |
| E5 | `DEFAULT_DEMO_SEARCH` uses 6–8/11/2026, already past | `booking-results-state.ts:34` | Low | Remove the default, or make it relative to today | BMP |
| E6 | Room choice is a preference, not a hold; the same room can be picked in two slots without inventory | handoff §8 | OK until E1 | Server-side `validateSelection` against provider units | Backend |
| E7 | Direct booking channel on the booking step: "đang được VNest cập nhật" | `dat-phong` page text | High | VNest confirms the hotline and email for bookings (the footer already shows them) | VNest |

Real vs simulated:
- **Real (client-side):** dates (Asia/Ho_Chi_Minh, past dates rejected), adults, children, explicit rooms,
  correction notices, Back/refresh restoration, and the URL contract.
- **Simulated:** `available` / `unavailable` and prices, only under `?sim=` on a server with
  `AVAILABILITY_SIMULATION=private-review`, always labelled. The 3405 server ignored `?sim=`; the simulation suite ran
  against 3406.
- **Invented:** nothing. No availability or price is invented anywhere.

### F. SEO, performance, accessibility

| ID | Finding | Evidence | Severity | Resolution | Who |
| --- | --- | --- | --- | --- | --- |
| F1 | **No public routes for the approved site.** `/` is the Phase 01 placeholder; `/stays` and `/stays/bare-chic` are the older 02.2 pages; `/hop-tac` and `/en` are 404. In production every `/dev/*` route is 404 by design (`reviewAccess`) | curl of public routes; `review-access.ts` | Blocker | Owner fixes the public URL scheme (open question in `ARCHITECTURE.md` §5); BMP promotes pages behind the existing indexing lock and retires legacy routes | Owner → BMP |
| F2 | No meta description on the homepage, results or property pages (the partner page has one); no `og:image`; no JSON-LD on the new pages; `/favicon.ico` 404 | `pages.json`, curl | High | Add at promotion: per-page description from approved copy, OG image, `Organization` / `LodgingBusiness` / `BreadcrumbList` (`seo/structured-data.ts` exists), app icons | BMP |
| F3 | Sitemap is built from the legacy property records, not the six new pages | `app/sitemap.ts` | High | Rewire to the promoted routes | BMP |
| F4 | Canonical and OG URLs use `SITE_URL` (`http://localhost:3000` locally) | page metadata | OK | Production refuses to start without a public https `SITE_URL` (proven by `test:promotion`) | — |
| F5 | Indexing lock | robots `Disallow: /`, empty sitemap, `noindex` meta + header on all 60 views | OK | Keep it; do not remove | — |
| F6 | Images: pre-derived AVIF/WebP with `srcset` and `sizes`, `fetchpriority=high` on the first hero image, lazy below the fold. Homepage ~364 KB of images, 680 KB JS (decoded), 198 KB CSS (decoded); property HTML 157–240 KB (21–31 KB gzipped) | performance entries | OK / Low | CSS is high for one page: after the exploration routes are removed, check what is still bundled | BMP |
| F7 | Core Web Vitals on localhost: LCP 40–430 ms, CLS ≤ 0.01. Not field data | `pages.json` | Verify | Measure again on the real host and CDN (throttled 4G, mid-range Android) | BMP |
| F8 | Accessibility summary: A1 (critical), A2–A5, B5. No missing alts, labels or duplicate ids; dialogs and live regions behave in the e2e suites | axe | see rows | — | BMP |

### G. Code and backend handoff

| ID | Finding | Evidence | Severity | Resolution | Who |
| --- | --- | --- | --- | --- | --- |
| G1 | **Unprotected work.** 80 modified + 21 staged + 1,072 untracked files (86 untracked under `src/`: partner page, Consultation, BrandShowcase, AboutVNest, `domain/hybrid-booking`). Branch `feat/vnest-v3-media-import` has no upstream; last commit `c04f0a6a` | `git status` | High (risk) | Owner authorises a checkpoint commit and, if wanted, a push to a private remote. I did not do this | Owner |
| G2 | **Inverted dependency.** The approved homepage, property pages and `features/*` import data adapters from the exploration route folder `src/app/dev/brand-collection/client/` (`adapter.ts`, `photos.ts`) | grep | High (before promotion) | Move those modules to `src/content/` or `src/features/`, then retire the exploration routes | BMP |
| G3 | Legacy and exploration code in the build: `/stays` + `features/availability` (02.2), `/api/availability` mock, `/dev/brand-collection/*`, `/dev/property-gallery/*`, `/dev/partner-concepts/*`, `/dev/partner-cta`, `/dev/v3-proposals`, `/dev/stays/bare-chic-20-10`, `/dev/header`, `/dev/city-notes` | build route list | Medium | Archive in Git history and delete at promotion; keep only what the public site uses | BMP (owner OK) |
| G4 | Browser tests load Playwright from the sibling `Cigarettes-After-Sex` checkout; CI runs lint, types, unit tests, build and promotion, but no e2e | `test/e2e/*.mjs`, `.github/workflows/ci.yml` | Medium | Add `playwright` as a devDependency, add an e2e job against `next start` | BMP |
| G5 | Handoff doc says the form submit lives in `OwnerJourney.tsx`; it is now `Consultation.tsx` (`ConsultationForm.onSubmit`) | `BACKEND-HANDOFF.md` §7 | Low | Correct the pointer | BMP |
| G6 | Large components: `BookingResults.tsx` 1,416 lines, `PropertyRoomCollection.tsx` 1,089, `booking-results-state.ts` 853 | `wc -l` | Low | Split only when the backend work touches them; no cosmetic refactor | BMP |
| G7 | Architecture boundaries hold: `domain/` is pure, `integrations/` server-only (ESLint + test), `process.env` read only in `config/env.ts`; dependencies are just `next`, `react`, `react-dom` | eslint config, `package.json` | OK | Keep | — |
| G8 | The backend handoff (`docs/handoff/BACKEND-HANDOFF.md`) is accurate on the URL contract, state, bounds and the provider boundaries | read against code | OK | Hand over with G5 corrected and the H list | — |

### H. Production blockers (explicit list)

| ID | Blocker | State today | Needed | Who |
| --- | --- | --- | --- | --- |
| H1 | **Client image rights** | `SELECTION_AUTHORISATION.scope = "private-local-review"`; the G2 grantor's name was left blank; public-use rights open (Q15); image 02 (person visible) held; three Bare photos carry watermarks | Written licence for public web use per image set, named grantor, decision on watermarks and people | VNest |
| H2 | **Media deployment / hosting** | `public/dev-client-media/` (281 MB) is git-ignored, derived from `.local-media/` (867 MB, also ignored): a fresh checkout or a CI build has no photos | Choose hosting (object storage + CDN, or a committed optimised subset). Move derivation into a repeatable script and set `images` in `next.config.ts` if remote | BMP (+ owner hosting choice) |
| H3 | **GoHost integration** | Unconfigured; adapter boundary ready | E1 | VNest → Backend |
| H4 | **ezCloud handoff** | Unconfigured for 4 properties | E2 | VNest → BMP |
| H5 | **Consultation form backend + privacy / consent** | Validates, never sends, says so; no privacy notice, no consent text | Destination (CRM / email service / API), spam protection, retention, a privacy notice and consent wording that meet Vietnam's personal-data rules (Decree 13/2023/NĐ-CP and the Personal Data Protection Law in force since 2026; VNest's counsel to confirm) | Backend + VNest |
| H6 | **Child / occupancy policy** | Both unconfirmed (E3, B2) | Written policy | VNest |
| H7 | **Brand website URLs** | `BRAND_WEBSITES` all null; "Visit us ↗" drawn non-operational | Confirmed URLs, or the owner decides to hide the CTA for launch | VNest / Owner |
| H8 | **Final content approval** | 05.11 copy: client publication approval + 3 flags; policies; partner drafts; English drafts; Coming Soon copy; addresses (Q19/Q20) | Signed-off content set | VNest |
| H9 | **Public routes + SEO wiring** | F1–F3 | URL decision, promotion, metadata | Owner → BMP |
| H10 | **Cookie / analytics consent** | No analytics or tracking cookies today; only the `lang` preference cookie, set on private routes only | If analytics are added: consent banner and privacy notice first | Owner / VNest |

## 5. Separated lists

### 5.1 Demo acceptance blockers

The demo works. What remains is decisions and two small fixes:

1. Owner visual acceptance of the items still IN REVIEW:
   - Phase C Coming Soon artwork (8/11)
   - Partner page polish (10/11) and the CTA correction (9/11)
   - Phase D final refinement (10/11)
   - Occupancy correction
2. A1: accessible names for the phone brand rows (no visual change).
3. B3: confirm whether the ezCloud room-step action is meant to be hidden on phones.
4. D2: decide whether the VI/EN switch shows on pages without English during the demo.
5. A3: the About copper decision (pending since 4/11).

### 5.2 Production release blockers

- H1 Image rights
- H2 Media hosting
- H3 GoHost
- H4 ezCloud URLs
- H5 Form backend + privacy notice + consent
- H6 Child and occupancy policy
- H8 Final content, including B1 policies and the B4 addresses
- H9 / F1 Public routes
- D1 English, only if launching bilingual
- H7 Brand URLs: either supply them or hide the CTA

Also required before release (High): F2–F3 SEO wiring, G2 adapter relocation, E7 booking contact, C3 partner copy
approval. G1 (checkpoint the work) is a prerequisite for all of it.

### 5.3 Optional improvements

- A2 / A4 contrast tokens (owner approval: frozen surfaces)
- A5 label-in-name
- A6 lazy hero slides and logo sizes
- B5 dot target size
- B6 naming normalisation
- B7 one dynamic property route
- E5 demo default dates
- F6 CSS audit after cleanup
- G4 Playwright in CI (strongly recommended)
- G5 doc pointer
- G6 component splits only when touched

## 6. Recommended sequence

| Step | What | Who | Depends on |
| --- | --- | --- | --- |
| 0 | Checkpoint the working tree (commit; optionally push to the private remote) | Owner authorises, BMP does it | — |
| 1 | Close the open visual reviews (§5.1) and decide A3, D2, B3 | Owner | — |
| 2 | Send VNest one consolidated request: H1, H6, H7, H8, B1, B2, B4, E7, the privacy-notice owner, GoHost contract, ezCloud URLs | Owner → VNest | — (start now, longest lead time) |
| 3 | No-dependency fixes: A1, A5, B5, E5, G5; G2 adapter relocation; G4 Playwright + e2e in CI | BMP | Step 0 |
| 4 | Owner decisions: public URL scheme (Vietnamese/English slugs, `/hop-tac`), launch language (VI-only or bilingual), hosting platform and media storage | Owner | — |
| 5 | Route promotion behind the indexing lock: public homepage, six property pages (one dynamic route), results, booking step, partner page; metadata, OG, JSON-LD, icons, sitemap; retire legacy and exploration routes (G3); media pipeline to the chosen storage (H2) | BMP | Steps 3–4 |
| 6 | Backend: GoHost adapter against the real contract; ezCloud URLs into config; form endpoint, storage, spam protection, consent record | Backend (+ BMP for config) | Step 2 answers |
| 7 | If bilingual: English UI strings and property drafts for VNest approval (BILINGUAL-PLAN phases B+) | BMP → VNest | Step 4 |
| 8 | Staging deployment (noindex), full QA: e2e, axe, field CWV on throttled mobile, real Google Maps, provider sandbox | BMP + Backend | Steps 5–6 |
| 9 | Content sign-off, then `SITE_INDEXABLE=true` on production | VNest, Owner | Step 8 |

**Interim option, if VNest wants a site live sooner.** A Vietnamese-only "brochure" release:
- Booking runs only through the hotline and email, plus any ezCloud URLs VNest supplies.
- The form stays hidden until H5 is done.
- GoHost properties show the honest unconfigured state.

This still needs H1, H2, H8, H9 and B1.

### What BMP can finalize alone

A1, A5, A6, B3 (once the intent is confirmed), B5, B6 (UI side), B7, E5, F2–F3 (once URLs are decided), G2–G6, the H2
pipeline (once hosting is chosen), and the route promotion itself.

## 7. Changes made during this audit

- `.claude/launch.json`: added `vnest-v3-audit` (3405) and `vnest-v3-audit-sim` (3406). Both serve a build in the
  session scratchpad. Remove them whenever you like.
- New folder `docs/qa/phase-e-audit-2026-11-10/`: this report, `pages.json`, `journey.log`, `shots/`, `e2e/` logs,
  `scripts/audit-pages.mjs`, `scripts/journey-shots.mjs`.
- Builds ran only in scratchpad clones; the repository's `.next` was not touched.
- Left as found:
  - The old QA server on 3402, running since 6/11 and serving an older build. Restart it before using it for review.
  - The dev server on 3401.
  - Staged files, `stash@{0}`, `.local-media/`, `public/dev-client-media/`.
