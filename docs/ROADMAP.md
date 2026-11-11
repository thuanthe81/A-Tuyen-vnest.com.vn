# Roadmap and section status

Principle: **Booking First. Experience Driven. SEO Built-in.** Process: [WORKFLOW.md](WORKFLOW.md). Updated 15/10/2026.

**Currently authorised: nothing new.** Section 02.1 is frozen. Phase 01 has conditional approval; its two safeguard corrections are made and it awaits final freeze confirmation. Section 02.2 is in review. Section 05.1 (property page) was authorised early on 11/10/2026, one checkpoint at a time; its first checkpoint is built and in review. Section 03.1 has a specification awaiting approval.

**Explorations (12 to 15/10/2026).** Two design explorations run as isolated `/dev` routes on the local branch `design/vnest-property-gallery-exploration`, which sits on top of `dev/v2-preservation`. They are preserved in local checkpoint commits `b166f5b`, `dc93ae4`, `06f9a6e` and `1e7fbba` (15/10/2026); see [REVIEW_LOG.md](REVIEW_LOG.md), "Repository checkpoint, 15/10/2026". A checkpoint commit is not approval. Nothing is pushed and nothing is on `main`.

**Where the work is (11/10/2026).** The in-review work is preserved in local snapshot commits on the branch `dev/v2-preservation` (`278deaf`, `9b2febc`, `73f11f0`, and the final Phase 01 safeguards `442985b`); see [REVIEW_LOG.md](REVIEW_LOG.md), "Repository stabilisation". A snapshot commit is not approval. None of it is on `main`, and nothing has been pushed.

| Phase | Content | Status |
|---|---|---|
| 01 | Technical foundation | **CONDITIONALLY APPROVED 10/10/2026, pending final freeze**: safeguards F1 and F2 corrected (`phases/PHASE-01-VERIFICATION.md`, section 0). Delivered 09/10/2026. Committed as a baseline snapshot (`a933cbb`) and a safeguards snapshot (`278deaf`); neither is approval. See [phases/PHASE-01-HANDOFF.md](phases/PHASE-01-HANDOFF.md) |
| 02 | Booking experience | Section 02.1 FROZEN; 02.2 IN REVIEW; 02.3 not authorised |
| 03 | Homepage hero and booking integration | Brand Collection (03.3): DIRECTION APPROVED 15/10/2026, not frozen. The rest NOT STARTED, not authorised |
| 04 | Six distinctive property discovery cards | NOT STARTED, not authorised |
| 05 | Property detail pilot | Section 05.1 IN PROGRESS (authorised early, checkpoint by checkpoint). The rest NOT STARTED, not authorised |
| 06 | Remaining property pages and supporting sections | NOT STARTED, not authorised |
| 07 | Final integration, optimisation and release preparation | NOT STARTED, not authorised |

Technical QA and documentation are part of every phase, not a final step.

## Sections

A section is the unit that goes through the eight-step protocol and receives its own Design Decision Record. Phase 01 is a single section. The breakdown of later phases below is a **proposal**, to be confirmed when each phase is authorised.

| No. | Section | Phase | Status |
|---|---|---|---|
| 01 | Technical foundation | 01 | CONDITIONALLY APPROVED, pending final freeze (baseline snapshot `a933cbb`; F1 and F2 corrected in snapshot `278deaf`; final safeguards in `442985b`; GitHub CI not yet run on them) |
| 02.1 | Floating booking search bar | 02 | **APPROVED / FROZEN** 10/10/2026. Implementation `1b75a6f`; authorised post-freeze hotfix `9b2febc`; record `decisions/02.1-floating-booking-search-bar.md` Fields: property (optional), check-in, check-out, guests, Search |
| 02.2 | Availability results (`/stays`), booking logic, room and rate selection | 02 | **IN REVIEW**. Direction approved 10/10/2026; refined 11/10/2026. Property-specific journey moved to `/stays/[property]` (section 05.1) on 11/10/2026; compact room blocks still to come. Draft record `decisions/02.2-availability-results-DRAFT.md`; evidence `qa/02.2/`. Not approved, not frozen. Preserved with 05.1 checkpoint 1 as snapshot `73f11f0`, which is not approval |
| 02.3 | Booking hand-off | 02 | Proposed |
| 03.1 | Site header and navigation | 03 | SPECIFICATION: direction proposed 10/10/2026 (`sections/03.1-header-navigation-spec.md`, preview `/dev/header`). Not authorised for implementation |
| 03.2 | Homepage hero with booking | 03 | Proposed |
| 03.3 | Homepage Brand Collection and discovery filters | 03 | **DIRECTION APPROVED** 15/10/2026: concept B, Connected Brand Index (refinement 1, `/dev/brand-collection/b`). **Not approved as final, not frozen.** Concepts A and B-original kept as references. Next: real content from `VNest_Information.xlsx`; VNest's property photographs (Google Drive links in that workbook) are not yet imported. Area filter stays non-operational until areas are verified. **03.3-C1 G1 (real client content, placeholders, Area hidden) built 16/10/2026 at `/dev/brand-collection/b-client`; G1.1 card pricing approved 18/10/2026** (name, city, compact reference price; workbook figures in the private preview only). **G2 (photography): authorised 18/10 for private local review; four photos integrated, Bare Hàn and The Nắng Suites still placeholders; photography and composition approved for continued refinement 19/10.** **G2.1 location label and panel built 19/10, awaiting review** (`qa/brand-collection/b-client/RESULTS.md`). Plan `content/03.3-C1-PROPOSAL.md`, evidence `qa/brand-collection/b-client/RESULTS.md`. Notes `design/brand-collection/README.md`; evidence `qa/brand-collection/`. Preserved in `06f9a6e` and `1e7fbba`, which is not approval |
| 04.1 | Property discovery cards | 04 | Proposed |
| 05.1 | Property page: shell, gallery, identity, amenities, nearby | 05 | **IN PROGRESS** 11/10/2026: checkpoint 1 (route, redirect, shell, content fields) in review. `sections/05.1-property-page-spec.md`; preview `/stays/[property]`. Places section 02.2's room selection; does not own it. Preserved with 02.2 as snapshot `73f11f0`, which is not approval. The visual direction of the property experience is **not approved**; further exploration is required. Living Frames exploration (12 to 13/10/2026, `/dev/property-gallery/living-frames`, with variants `media-a` and `media-b`): **not approved**, awaiting final visual review. Preserved in `b166f5b` and `dc93ae4`, which is not approval |
| 05.2 | Bare Chic property detail: the reference implementation on VNest's content (layout `living-frames`) | 05 | Plan approved 19/10/2026 (D1–D5). Checkpoint 1 built 19/10. Workbook v2 reconciled and the prototype rebuilt and refined 20/10; G4 photographs added. **G4: DIRECTION APPROVED 20/10/2026, not frozen, not production-approved**; the four checkpoint-1 departures await decision (`qa/05.2/G4-ACCEPTANCE-APPENDIX.md`). Preview `/dev/stays/bare-chic` on `vnest-v2-client-preview`; 20/10 first build at `/dev/stays/bare-chic-20-10`. `sections/05.2-bare-chic-property-detail-plan.md` |
| — | VNest City Notes (city-level destination notes, a module for property pages) | 05 | Boundary proposed, then specification and layouts (`sections/city-notes-spec.md`). **CS-1 to CS-7 APPROVED as direction 20/10/2026**, with two refinements. Standalone prototype `/dev/city-notes` built (`qa/city-notes/RESULTS.md`). **Integrated into Bare Chic after Vị trí 20/10/2026** for the CEO demo. Not frozen |
| — | CEO demo, Friday 23/10/2026: `/dev/demo` → Bare Chic (`?view=demo`), one tab | — | **Built 20/10/2026**, private and local. Handoff: `qa/demo/HANDOFF.md`. Not frozen, nothing committed |
| 05.x | Extending the property page: approved real content, maps, storytelling, layouts and themes, room detail pages | 05 | To be broken down |
| 06.x | Remaining properties and supporting sections | 06 | To be broken down |
| 07.x | Integration, optimisation, release preparation | 07 | To be broken down |

This breakdown replaces the step list in section 10 of the Phase 01 handoff: each section now begins with a specification and a direction approval, not with implementation.

## Note on Phase 01 and the protocol

Phase 01 was specified, corrected and authorised before the protocol was adopted (see [REVIEW_LOG.md](REVIEW_LOG.md)). It contains no visual section: its only page is a two-line placeholder. The 390, 768 and 1440 px visual QA therefore has nothing to assess yet and was not performed; it applies from section 02.1 onward. Its Design Decision Record will be written once the owner approves it.

### CEO demo takeover update — 22/10/2026

Official selected-brand logos and targeted About/Partner corrections are **IN REVIEW** for `/dev/demo`; existing implementation and explorations preserved. Evidence: `qa/demo/takeover-2026-10-22/REVIEW.md`. No freeze or production approval. This update supersedes older demo completion details only; it does not authorise another feature.

### CEO presentation polish — 23/10/2026

Owner confirmed **desktop Brand Collection visual direction APPROVED**, preserving the logo navigation and timeline. Nắng photography from the four v2 workbook source folders was approved for use and retrieved for the local demo; the selected Green River image and About/Partner copy polish are **IN REVIEW**. Evidence: `qa/demo/ceo-polish-2026-10-22/REVIEW.md`. No freeze, production release or other feature authorised.

### 23/10/2026 — Nắng CEO demo extension — IN REVIEW

New local `/dev/stays/the-nang-suites` page, grouped approved photos, scoped image-derived palette; homepage Blue Moon and corrected Bare Hàn imagery. Existing booking logic and approved homepage structure preserved. Review package: `docs/qa/demo/nang-page-2026-10-23/REVIEW.md`. Awaiting owner visual review; no freeze or deployment.

### 24/10/2026 — VNest V3 Stage 1 (UX & conversion) — IN REVIEW

Milestone **VNest V3 — UX & Conversion Refinement**, next CEO review 30/10/2026. Stage 1 (R01 header and BOOKING, R02 one booking bar and BOOK NOW, R03 BOOK NOW in viewers and drawers, R04 hero carousel) is built on `/dev/demo`, Bare Chic `?view=demo`, The Nắng Suites and the new demo step `/dev/demo/dat-phong`. One owner-approved, opt-in 02.1 presentation exception (BOOK NOW label); 02.1 otherwise frozen and pixel-identical. Stage 2 (Brand Index) and Stage 3 (Services/Contact/FAQ/Footer): two proposals each at `/dev/v3-proposals`, **awaiting the owner's choice; not authorised for implementation**. Review package: `qa/v3-stage1-2026-10-24/REVIEW.md`. No commit, deployment or freeze.

### 24/10/2026 — VNest V3 Stage 2/3 built — IN REVIEW

Owner approved the directions Brand Index **A** and Services/Contact **B**. Both are implemented on `/dev/demo` (Brand Index A, six-property collection, Services, Contact mockup, FAQ, footer); About VNest is kept. Awaiting the owner's **final visual acceptance**; content is DRAFT pending VNest. Review: `qa/v3-stage1-2026-10-24/REVIEW.md`. No commit, deployment or freeze.

### 24/10/2026 — Stage 2 corrections VISUALLY ACCEPTED

The owner visually accepted the floating brand preview and the discovery filter toolbar (Brand Index A, `/dev/demo`). Not frozen, not production-approved; brand copy remains DRAFT pending VNest. Stage 1 and Stage 3 remain IN REVIEW unless the owner states otherwise.

### 25/10/2026 — V3 takeover after Antigravity — IN REVIEW

Antigravity's 24–25/10 work verified against the code. P1 fixes: a fake booking confirmation on the property page (now "Tiếp tục" to the honest booking step), a hydration error on refresh with rooms selected, tablet-width horizontal overflow on both property pages, the `rooms` parameter read differently by the property page and Booking Results, and invented promises in the policy dialog. Services B, Contact, FAQ and Footer refined (asset-type field, accessible validation, service kept in the address, six FAQ topics, real-route footer). CTA fills moved to text-safe copper #9A683C (**owner approved 25/10/2026**). Room facts follow **R3 (owner decision 25/10/2026)**: merged type/area on every room of its property, the workbook-wide "2 người lớn" on all 22 rooms, own-row values first; display metadata only, never an eligibility limit; written per-room confirmation from VNest still wanted before production (Q37). 02.1 untouched (frozen routes pixel-identical). Review package: `qa/v3-takeover-2026-10-25/REVIEW.md`; demo `localhost:3402/dev/demo`. No commit, deployment or freeze.

### 25/10/2026 — V3 final UX refinement — IN REVIEW

R3 recorded as the approved demo display rule. Room cards gain a price region ("Chỉ từ … / đêm" only for VNest-approved public rates, none yet; otherwise "Xem giá theo ngày") with a desktop price-to-action hover and an always-filled mobile CTA. Footer redesigned: "Lưu trú" removed, a prominent Contact area with VNest's official Facebook details (hotline, email, address) and an active Facebook link. A new location module (map preview, airport distance and drive time from Google Maps, workbook transport, Google Maps CTA, policies) replaces the hero location panel. B2B unchanged. QA 183/183, frozen routes identical. Review: `qa/v3-final-2026-10-25/REVIEW.md`. No commit, deployment or freeze.

### 25/10/2026 — Location map uses the official Google Maps embed — IN REVIEW

The synthetic map is replaced by Google's official embed of each verified place (Bare Chic, The Nắng Suites), lazy-loaded with a reachability check and a plain fallback. Review: `qa/v3-final-2026-10-25/REVIEW.md` §4 and §6. No commit, deployment or freeze.

### 4/11/2026 — Hybrid Booking V1 / V1.1 and booking UX polish — PROVISIONALLY ACCEPTED

Per-property availability states, GoHost native and ezCloud hand-off (both unconfigured), one discovery journey (every card opens its property page), fail-closed simulation, Pepper House photography (7 new, 3rd-floor room cover 02.jpg), rooms and guests kept separate. Review packages: `qa/hybrid-booking-2026-11-04/`, `qa/hybrid-booking-v1.1-2026-11-04/`, `qa/hybrid-booking-v1.1-final-2026-11-04/`, `qa/booking-ux-polish-2026-11-04/`. No commit, deployment or freeze.

### 4/11/2026 — Combined "Phòng & khách" field (Option B) — APPROVED, FROZEN

Owner accepted the refined combined field on 4/11/2026. Decision record: `decisions/v3-booking-bar-occupancy-field.md`; review: `qa/booking-bar-occupancy-2026-11-04/REVIEW.md`. Opt-in on the V3 demo bar; frozen 02.1 surfaces unchanged. Not committed or deployed.

### 5/11/2026 — Homepage Brands, Partner with VNest and B2B FAQs (05.11 Final copy) — OWNER-ACCEPTED, FROZEN

The client's "Vnest Website Content - 05.11.2026_Final" is integrated, verbatim in Vietnamese and English (normalised to VNest / The Nắng Suites), into the three existing sections. Content and approved visual structure are frozen. Decision record: `decisions/v3-homepage-content-brands-services-faq.md`; review: `qa/homepage-content-final-2026-11-05/REVIEW.md`. Final client publication approval pending, with three client-review items open: English FAQ 1 shorter than the Vietnamese, the document header still reading draft, and the official spelling of The Nắng Suites. Not committed or deployed.
