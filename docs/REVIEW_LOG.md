# Review log

Every round of owner feedback and the revision made in response, newest last. Decisions that are final live in `docs/decisions/`; this file is the history of how they were reached.

## Section 01: technical foundation

### 09/10/2026: initialization and architecture report submitted

Audit of V1, clean-scaffold recommendation, proposed structure, a seven-phase plan, and five open questions.

### 09/10/2026: owner feedback, "approved in principle with required corrections"

| Feedback | Revision |
|---|---|
| Keep V2 in the separate repository; V1 untouched; prepare for a remote but create, push and deploy nothing | Adopted. Ignore rules, lockfile, CI workflow and README prepared; no remote created |
| The roadmap put property pages ahead of booking. New order: foundation, booking, hero, discovery cards, property pilot, remaining pages, release | Roadmap replaced (see `ROADMAP.md`) |
| Typed contracts for criteria, availability, room and rate selection, hand-off, loading and failure; redirect, embedded and native without assuming any provider supports all three | Rate offers per room, `BookingCapabilities`, three hand-off modes, failure reasons with a retry flag, availability state reducer |
| Define PMS-owned versus VNest-owned data | Table in `BOOKING.md`, section 5 |
| Distinctiveness must not be reduced to colour tokens or reordered sections | Content model gained a per-property layout template and typed editorial sections; tokens documented as the lightest lever. The original proposal (section order plus tokens) was withdrawn |
| Provider mapping belongs in the property content model | Moved from "inside the adapter" to `booking.providers` on the record, stripped before a record reaches a page |
| Vietnamese provisional primary language, i18n-ready, no unapproved English | `LocalizedText`, per-record `approvedLocales`, validation of translation completeness |
| Phase 01 only; no UI, no CMS, no animation library, no monorepo | Scope held. Three runtime dependencies |

### 09/10/2026: Phase 01 delivered

Handoff: `docs/phases/PHASE-01-HANDOFF.md`. Checks: lint pass, typecheck pass, 87 of 87 tests pass, build pass. Not committed.

Status: **IN REVIEW**. Awaiting owner approval.

### 09/10/2026: owner feedback, quality protocol established

| Feedback | Revision |
|---|---|
| Mandatory eight-step, section-by-section protocol with direction approval, QA at three viewports, decision records, review log and freeze policy | `WORKFLOW.md`, `ROADMAP.md`, this log and `decisions/TEMPLATE.md` created. Later phases broken into proposed sections. No implementation work started |

Open with the owner: approval of section 01; permission to commit; authorisation of Phase 02.

### 10/10/2026: final technical verification requested

Report: `docs/phases/PHASE-01-VERIFICATION.md`. No code changed.

Outcome: acceptance criteria met; no blocker to approval. Seven findings, none blocking. Two should be fixed before any deployment: indexing safeguards are decided at build time (tested), and `SITE_URL` silently defaults to localhost. Recommendation: approve.

Status: **IN REVIEW**, unchanged. Approval is the owner's decision.

## Section 02.1: floating booking search bar

### 09/10/2026: section authorised by the owner

Brief: a premium floating capsule search bar with a compact sticky state and a dedicated mobile panel. The visual direction comes from a reference screenshot; fields, labels and order come from the approved VNest PDF. Phase 01 stays in review and is not approved or frozen by this.

### 09/10/2026: stopped before implementation, inputs missing

Neither the reference screenshot nor the PDF reached the working session, and neither file is in the V2 or V1 folders. The brief says to stop before fixing the field structure if the PDF is unavailable, so nothing was built.

Phase 01 contract check against the brief (no code changed):

| Need | Phase 01 state | Action when the section starts |
|---|---|---|
| Check-in, check-out, adults in the URL | Supported (`search.ts`) | None |
| Validation, stay rules, past dates | Supported (`validateCriteria`) | None |
| Promotional code | **Not modelled** | Add to criteria, URL codec, availability request and a provider capability; never shown as valid without provider verification |
| Children, number of rooms | Children reserved but not parsed; rooms not modelled | Only if the PDF requires them |
| Destination or property selector | Destination filter and property routes exist | Wire only if the PDF requires it |
| Calendar arithmetic (add days, month grids) | **Missing**: only parsing and night counts exist | Add pure string-based helpers with tests |
| Search destination | Route builders exist; the results page is section 02.2 | Use a clearly labelled development handler |

No architectural blocker. Phase 01 is not frozen, so these additions are extensions, not changes to approved behaviour.

Status: **blocked on inputs**.

### 09/10/2026: additional creative direction from the CEO

Design-led, contemporary, aimed at guests who value distinctive stays; no generic hotel patterns; assumptions about younger guests treated as hypotheses; conversion, performance, accessibility and SEO non-negotiable. Recorded as standing direction in `WORKFLOW.md`, section 9.

The reference screenshot and the approved PDF had still not been received, so section 02.1 remained **blocked on inputs** and nothing was built.

### 10/10/2026: owner asked for a working preview, not a placeholder

The owner opened the local server, saw the Phase 01 placeholder and asked for the actual component, with the condition that the PDF and screenshot be available. They were still not available. Decision taken by the implementer, for the owner to confirm or reverse: build a first working iteration from the owner's written description of the reference, with the field set marked provisional, instead of stopping a third time.

### 10/10/2026: first iteration delivered for review

Preview at `/dev/booking-search`. Draft record: `docs/decisions/02.1-floating-booking-search-bar.md`.

Defects found and fixed during QA, before review:

| Found at | Defect | Fix |
|---|---|---|
| 768px | Date values truncated in the full bar | Short date form below 1024px, weekday only where there is room |
| 390px | Reopening the dates with a complete stay continued from check-out | Reopening starts from check-in unless the stay is unfinished |
| 390px | Focus fell to the page when a step collapsed | Focus moves to the step that opened |
| 390px | "Mã ưu đãi" shown twice in the code step | Label kept for assistive technology only |
| All | A validation message persisted after closing and reopening | Messages are dismissed on close |

Phase 01 contracts extended (Phase 01 is still in review, not frozen): calendar arithmetic in `dates.ts`; promotional code in `SearchCriteria` and the URL codec; `promoCodes` in `BookingCapabilities`; a site timezone in `config/site.ts`; development routes in `config/routes.ts`.

Status: **IN REVIEW**. Awaiting owner feedback.

### 10/10/2026: owner feedback on the first iteration, requirements update

The owner confirmed the floating capsule direction and the component architecture, and fixed the search fields. This decision supersedes earlier documents, so the missing PDF no longer blocks the field structure.

| Feedback | Revision |
|---|---|
| Exactly these, in order: property (optional), check-in, check-out, guests, Search | Bar, sticky bar and mobile panel rebuilt to this order |
| Remove the promotional code from the search | Field, panel, copy and tests removed. Also removed from the domain (`SearchCriteria`, URL codec, provider capability), since it is no longer a search criterion |
| Property is optional; default "Tất cả cơ sở"; never a validation error | `propertyId: string | null` in the search state, `null` as an explicit "all properties". Submit validation never looks at the property. An unknown property in a URL falls back to all properties silently |
| Stable property id in state, not display names | State holds the property id; the URL carries the property slug; names are only labels. Tested: a display name is rejected as an identifier |
| Backend contract must distinguish one property from all | `SearchScope` added to `AvailabilityRequest`; `/api/availability` accepts a search with no property; adapter rules documented in `BOOKING.md` |
| Do not make the bar heavier | Same capsule, same height, same four visual groups as before: the property field takes the place the code field had |
| Mobile: keep property, prioritise dates and guests | Panel opens on the dates; property is a single collapsed row above them that already reads "Tất cả cơ sở" |

Found and fixed during QA of this iteration:

| Found at | Defect | Fix |
|---|---|---|
| 390px | Sticky pill truncated the dates when a property was selected | Sticky pill shows two small lines: property, then dates and guests |
| Tests | Feature modules with relative imports could not be loaded by the test runner | Test bootstrap resolves extensionless relative imports |

Correction to the previous entry: the "dropped taps" reported for the development server were a testing artefact. The browser tool sometimes returned a screenshot one frame stale; reading the page state directly showed every tap had been handled. No defect.

Status: **IN REVIEW**. Awaiting owner feedback.

### 10/10/2026: owner feedback, explore a rectangular alternative

The owner found the fully rounded capsule too close to common hospitality booking patterns and asked for a second visual variant to compare, keeping the capsule unchanged.

| Feedback | Revision |
|---|---|
| Keep the capsule as Variant A, unchanged | Shape, depth and Search colour moved into CSS variables whose defaults equal the previous values, so A renders as before |
| Variant B: soft rectangle, 12–16px corners, warm white, elegant dividers, restrained copper Search | `data-booking-skin="rect"`: 14px shell, 6px padding and 8px fields (concentric corners), taller dividers, slightly larger values, wider label tracking, one hairline plus one low shadow, copper Search |
| Same logic for both, no duplicated state or validation | One set of components. A variant is a set of variable values in `styles/tokens.css`; no component, state, validation or URL code differs |
| Preview both under identical conditions | `/dev/booking-search/compare` shows A and B over the same backdrop from the same URL; `?variant=a|b` on the main preview shows each with its sticky bar |
| Copper subject to contrast checks | `#b04f2a`: white text 5.25:1 (WCAG AA), 5.0:1 against the shell. V1's brighter `#c4552d` was rejected at 4.48:1 |

Not from the logo: VNest's logo has not been supplied, so the copper is provisional and not sampled from it. The original PDF screenshot was not available either; the rectangle follows the written direction.

Status: **IN REVIEW**. Awaiting the owner's choice between A and B. Neither is approved.

### 10/10/2026: owner chose Variant B

"Go with B variant." The soft rectangle with the copper Search button is the visual direction for the booking bar.

| Decision | Revision |
|---|---|
| Variant B is the direction | Its values are now the single definition in `styles/tokens.css` (`--bk-*`) |
| Variant A set aside | The capsule skin, the variant switch and the comparison page were removed, so only one design is maintained. A's values are kept in the decision record in case it is revisited |

Found and fixed while re-checking B at all three widths:

| Found at | Defect | Fix |
|---|---|---|
| 768px | A two-digit guest count truncated ("12 khá…") at B's larger value size | Values are 15px below 1024px and 16px from 1024px; the guests field is slightly wider on tablet |

Checks after the change: lint, typecheck and build pass; 122 of 122 tests pass; rendered at 1440, 768 and 390px with no truncation and no horizontal overflow.

Choosing the direction is not approval of the section. Status: **IN REVIEW**.

### 10/10/2026: owner approved the visual direction; final regression; commit step stopped

The owner approved the visual direction of section 02.1 and asked for a final regression, the final decision record, two local commits and the freeze.

**Final regression: passed.** Run on the production build at 1440, 768 and 390px, by keyboard and by pointer. Lint, typecheck and build pass; 122 of 122 tests pass. Details in the decision record, section 10. No defects found; no code changed.

A note on method: the browser pane was not visible during testing, which pauses rendering-driven behaviour (the sticky hand-over did not fire until a frame was forced). Checks were therefore made by reading page state after forcing a frame, not from screenshots alone. This also explains the earlier "stale screenshot" observations.

**Decision record: rewritten as the final text**, covering the nine points requested, with no commit reference yet.

**Commits: not made. Section not frozen.** The working tree has one commit (`b0cb00c`, a `.gitattributes` file) and everything else is untracked, including the whole Phase 01 foundation. Section 02.1 cannot be committed on its own:

- its files depend on the uncommitted Phase 01 foundation;
- ten Phase 01 files carry 02.1's changes (domain dates, search and availability; server availability; routes, site config; tokens, fonts, layout; test bootstrap), and unstaged hunks cannot be separated without reconstructing earlier versions by hand;
- unrelated 03.1 preparation files are also untracked.

The owner's instruction for this case was to stop and report before committing. Options were put to the owner.

Status: **visual direction APPROVED; awaiting the owner's decision on how to commit; NOT FROZEN.** Phase 01's status is unchanged (in review).

### 10/10/2026: owner approved three local commits; section committed and frozen

The owner chose three local commits, with the baseline to be a snapshot and not Phase 01 approval, and no reconstruction of earlier versions.

| Commit | Scope | Verified before committing |
|---|---|---|
| `a933cbb` chore: establish VNest V2 foundation baseline (in review) | 68 files: project configuration, CI, domain, integrations, server, SEO, config, tokens, foundation documents. Includes the shared changes section 02.1 required, listed in the commit message | Clean export with a fresh install: lint, typecheck, 96 tests and build pass without the 02.1 feature files |
| `1b75a6f` feat: implement approved VNest floating booking search | 21 files: `src/features/booking-search/` and `src/app/dev/booking-search/` | Clean export: lint, typecheck, 122 tests and build pass |
| Documentation commit (the one adding this entry) | Decision record, roadmap, review log | Documents only |

Each staged file list was inspected before committing; nothing was staged with a blanket add.

One working-tree change was made to keep the baseline free of section 03.1: the `/dev/header` entry was taken out of `config/routes.ts`, and the uncommitted header composition page now names its own path.

Left uncommitted on purpose: `src/app/dev/header/` and `docs/sections/03.1-header-navigation-spec.md` (section 03.1 preparation).

**Section 02.1: APPROVED / FROZEN.** Phase 01: unchanged, IN REVIEW. Nothing pushed, merged or deployed. V1 untouched. Section 02.2 not started.

## Phase 01: safeguard corrections

### 10/10/2026: conditional approval; F1 and F2 corrected

The owner accepted the foundation in principle and required two corrections before it is frozen: a promoted build must not become indexable in a preview or development environment, and production must not fall back to localhost.

| Change | Files |
|---|---|
| Request-time noindex header; build-time header kept | `src/proxy.ts`, `src/seo/robots.ts`, `next.config.ts` (comment only) |
| `robots.txt` and sitemap answered per request | `src/app/robots.ts`, `src/app/sitemap.ts` |
| Production requires a public https `SITE_URL` | `src/config/env.ts` |
| Regression tests | `src/config/config.test.ts`, `src/seo/seo.test.ts`, `test/e2e/build-promotion.test.mjs`, `npm run test:promotion`, one CI step |

Evidence: the promotion test passes 8 of 8; against the code before the fix it fails 5. No other foundation file was refactored. Section 02.1 regression: its 26 tests pass and none of its files or listed dependencies changed, except `domain/availability.ts`, `server/availability.ts` and `config/routes.ts`, extended additively for section 02.2.

Status: **pending the owner's final freeze confirmation**.

### 11/10/2026: final safeguards approved and implemented

The owner approved four corrections to how the deployment is identified, and added a requirement: invalid production metadata and localhost canonical addresses must not be published in silence, and an unidentified deployment must fail closed and be reported, never be treated as production.

| Change | Files |
|---|---|
| The non-production signal wins when `DEPLOY_ENV` and the platform disagree; empty `DEPLOY_ENV` is not set; unidentified is closed; preview signals from Netlify and Render recognised | `src/config/env.ts` |
| Configuration problems printed at start-up as `[vnest config]` lines | `src/config/env.ts`, `next.config.ts` |
| Regression tests: 8 unit tests replacing 1; 7 promotion cases added | `src/config/config.test.ts`, `test/e2e/build-promotion.test.mjs` |
| CI build declares its environment; comments | `.github/workflows/ci.yml`, `.env.example` |

Evidence: lint and typecheck pass; 182 unit tests; promotion test 15 of 15. No file of section 02.1, 02.2 or 05.1 was changed. The owner reviewed the change and approved committing it, keeping the Netlify and Render recognition on condition that it can only restrict.

Status: Phase 01 remains **conditionally approved, pending final freeze**. It is not frozen: GitHub CI has not yet run on this change, and no real host has been tried.

## Section 02.2: availability results and rate selection

### 10/10/2026: specification requested, no implementation

Delivered: `docs/sections/02.2-availability-results-spec.md`. Two journeys (all properties; one property), three approaches compared for the first and two for the second, wireframes, thirteen states, component architecture, backend contract with three proposed additions, SEO and performance rules, and a checkable acceptance list.

Raised for the owner: the Journey A result card and the Phase 04 discovery card are one object at two densities and should be designed once; the proposed contract additions touch a file frozen section 02.1 depends on.

Status: **SPECIFICATION**. Awaiting approval of the direction and the six decisions listed in the specification.

### 10/10/2026: direction approved; implemented; submitted for review

The owner approved the two-journey direction with decisions on the shared property card, the contract extension, sold-out and unknown states, temporary content and creative direction, and required the Phase 01 safeguards first.

Built: `/stays` with Journey A (all properties) and Journey B (one property); the shared card anatomy in `src/components/property-card/`; the contract extension in `src/domain/availability.ts`; six labelled development fixtures; four new mock scenarios. Details, evidence and limitations are in `docs/decisions/02.2-availability-results-DRAFT.md`.

Raised for the owner:

- **Layout shift when results reorder.** Showing sold-out properties after available ones moves cards when the answer arrives: measured 0.14 at 1440px and 0.19 at 768px in the scenario where three of six are sold out (0.02 or less everywhere else). The specification's budget is not met for that case.
- **Added JavaScript is 18.0 KB gzip**, against a 15 KB budget.
- **Section 02.1, found while regression-testing, not changed:** with six properties in the list, the property panel of the floating bar is 484px tall and runs 80px below a 900px-tall viewport on the preview page. It was 244px with three sample records. Any fix is a change to a frozen section and needs approval.
- "Change dates" opens the frozen bar by pressing its own control, because the bar exposes no way to open it from outside.

Status: **IN REVIEW**. Not approved, not frozen, not committed.

### 11/10/2026: refinement and regression pass requested; done; submitted for final review

The owner accepted the two-journey architecture, withheld approval, and asked for one focused pass.

| Request | Revision |
|---|---|
| Stop results reordering | Loading shows outlines the size of the final cards. Real cards appear once, already ordered (available, unchecked, sold out apart). The order is then fixed for that search: a retried property is updated where it stands. Only a new search or the guest's own sort reorders |
| Bounded wait | The server answers `timeout` after 12 seconds if the provider has not; per-property bounds are the adapter's duty (documented) |
| Three failed checks | Two were the reordering shift (product defect, fixed). One was the 02.1 property list overflowing (product defect in a frozen section, fixed under authorisation). None was a test fault |
| JavaScript budget | Measured and broken down; one unused string removed. A revised budget is requested (decision record, section 8) |
| 02.1 property list | Capped to the viewport, scrolls inside its panel; focus, arrows, Enter and Escape verified |
| Missing price | A price the provider did not verify is never a rate: no figure, no radio, "Chưa có giá", and the next action follows the provider's declared hand-off |
| Visual refinement | Journey A: taller pictures, larger names, price and action on one line, more air between rows. Journey B: larger room pictures and names, calmer rate rows |
| SEO | Proposal for an indexable `/stays` directory documented, not built |

Evidence: 160 unit tests, 8 promotion tests, 184 rendered checks and 10 hand-off checks, all passing on the production build. Layout shift 0.013 or less in every tested transition.

Status: **IN REVIEW**. Not approved, not frozen, not committed.

### 11/10/2026: UX redirection requested; design proposal only

The owner found the property-specific journey too text-heavy and dense, and set a new principle: Visual First. Details on Demand. Booking Without Friction. A proposal was requested before any implementation.

Delivered: `docs/sections/02.2-property-experience-proposal.md`. A property page at `/stays/[property]` (gallery, identity, amenities, nearby, compact room selection), with `/stays` kept for multi-property results; wireframes; component breakdown; the overlap with Phase 05 and a proposed split; SEO and booking-state implications; trade-offs; an eight-step sequence; seven decisions for the owner.

No code was changed for this entry. Status: **PROPOSAL, awaiting approval**. Section 02.2 remains in review, not approved, not frozen, not committed.

### 11/10/2026: property experience architecture approved; ownership split with section 05.1

The owner approved `/stays` for results and `/stays/[property]` for the property experience, with `/stays?property=` redirecting. Section 02.2 keeps availability results, booking logic and room and rate selection; section 05.1 owns the property page around them. Revision made here: `/stays` no longer renders a property; the room selection became a part without its own header; the availability answer moved into a layout shared by both routes.

Regression after the change, production build: 204 of 204 rendered checks and 10 of 10 hand-off checks pass; layout shift 0 to 0.013.

Status: **IN REVIEW**. Not approved, not frozen, not committed.

## Section 05.1: property page

### 11/10/2026: authorised early, first checkpoint only

Authorised: content fields, the route foundation, the legacy redirect with criteria preserved, a minimal shell, and tests. Not authorised yet: the gallery, amenities, nearby, compact room blocks.

Built: `docs/sections/05.1-property-page-spec.md`, section 4. Tests added: 8 for the redirect and links, 4 for property-page metadata, 3 for the content fields.

Raised for the owner: added JavaScript is 21.7 KB on `/stays` and 23.1 KB on the property page, over the provisional 20 KB; the reasons and where it can come down are in the specification, section 6.

Status: **IN PROGRESS, checkpoint 1 in review**. Nothing committed.

## Section 03.1: site header and navigation

### 10/10/2026: design direction requested, specification and composition only

The owner asked for a design specification and a visual composition preview, with no production implementation and no change to section 02.1.

Delivered: `docs/sections/03.1-header-navigation-spec.md` and a still-frame composition at `/dev/header` (desktop top of page, desktop scrolled, three phone states). The booking bar and pill in the frames are the section 02.1 components, placed unchanged.

Not received: the VNest logo and the direction PDF. The composition uses plain text "VNest" in the logo's place; no mark was drawn.

Status: **SPECIFICATION**. Awaiting approval of the direction and answers to the open questions in the specification.

## Repository stabilisation

### 11/10/2026: work preserved in local snapshot commits; cleanup of `main` prepared

The owner asked for the uncommitted work to be made safe before development continues. No approval status changed: a snapshot commit is not approval. Earlier entries in this log that say "not committed" were true when written and are left as they are.

| Commit | Branch | Contents |
|---|---|---|
| `278deaf` | `dev/v2-preservation` | Phase 01 safeguards F1 and F2, the promotion test and its CI step |
| `9b2febc` | `dev/v2-preservation` | The authorised post-freeze hotfix to section 02.1 (`BookingBar.tsx`) |
| `73f11f0` | `dev/v2-preservation` | Section 02.2 and section 05.1 checkpoint 1, together |
| `80640f9` | `chore/untrack-generated-files` | `node_modules/`, `.next/`, `tsconfig.tsbuildinfo` and `next-env.d.ts` removed from tracking on top of `origin/main`; 22,125 deletions and nothing else |

Sections 02.2 and 05.1 share one commit because they do not stand apart: `/stays` links and redirects to `/stays/[property]`, and the room and rate selection of 02.2 is rendered by the 05.1 page. A 02.2-only commit would have had links that lead nowhere.

Checked on the exact tree of each commit: lint, typecheck, unit tests (125, 125, 175), production build, promotion test 8 of 8. For `73f11f0`, on the production build: `/stays`, the six property pages, an unknown property (404), the legacy `/stays?property=` redirect with and without dates, and every link rendered on those pages. The source in `73f11f0` is the source the rendered checks of 11/10/2026 were run on. Section 02.1: its files are unchanged since the freeze except the hotfix.

Evidence kept in the repository: the results files and a representative set of screenshots (16 of 60 for 02.2, 3 of 7 for 05.1). The rest is in the working-tree backup made before the first commit.

Statuses, unchanged: Phase 01 conditionally approved, pending final freeze. Section 02.1 approved and frozen. Section 02.2 in review. Section 05.1 checkpoint 1 in review; the visual direction of the property experience is not approved. Section 03.1 not authorised for implementation.

Not done: nothing pushed, merged or deployed; `main` not modified; no history rewritten. The generated files remain in the history of `main` after the cleanup (see `REPOSITORY-AUDIT.md`).

### 11/10/2026: preservation branch pushed; QA captures archived; 05.1 results file identified as a copy

`dev/v2-preservation` was pushed to the private repository with a normal push. It is not merged and not on `main`.

The 48 screenshots left out of the snapshot commit were compared byte for byte with the backup and moved out of the working tree to an external archive. `docs/qa/README.md` now says which evidence is in the repository and which is archived.

Correction to the evidence record: `docs/qa/05.1/results.json` is a byte-for-byte copy of `docs/qa/02.2/results.json`, the combined 204-check run. Section 05.1 has no results file of its own; 14 checks in the combined run concern the property page. The file is left as committed and described in `docs/qa/README.md`. No result was added, removed or relabelled.

No approval status changed.

## Section 05.1 exploration: Living Frames

Recorded on 15/10/2026, after the work. The dates are those of the work itself; the details are in `docs/design/living-frames/` and `docs/qa/living-frames/`.

### 12/10/2026: brief replaced by "Living Frames"; direction 2 chosen; prototype delivered

The owner replaced the property-experience brief with "Living Frames": one primary showcase video, stills and short motion previews, with the property identity and one "Xem phòng trống" action. From two art directions, the owner chose direction 2, "Motion Contact Sheet", simplified: one dominant video frame, two supporting frames, identity and booking action kept apart, and a conventional CTA. An isolated prototype was built at `/dev/property-gallery/living-frames` on drawn stand-ins and a clip made from them, then refined the same day (`refine-01`). Not approved.

### 13/10/2026: media reality check, private local only

The owner accepted the refined layout for continued exploration (the visual direction is still not approved) and approved three Pexels assets **for private local exploration only**. Variants `/media-a` and `/media-b` were built. The media is kept out of Git (`public/dev-fixtures/stock-test/.gitignore`), and so are the captures that show it. Awaiting the owner's final visual review.

## Section 03.3 (proposed number): homepage Brand Collection

### 15/10/2026: two concepts on the same content

The owner paused Property Experience work to explore the homepage Brand Collection: three brands and six properties (Bare Boutique Stays ×4, The Nắng Suites ×1, Pepper House ×1), with brand selection filtering the properties together with City and Area. The client's VNest identity files were reviewed: the artwork measures copper `#AB7444` (the deck says `#A87444`), and the VNest vectors were extracted unchanged. Partner logos were not supplied and appear as labelled slots. Areas are unverified. Two isolated prototypes were delivered: A, Curated Brand Gallery; B, Connected Brand Index.

### 15/10/2026: A with B's thread chosen, then B selected instead

The owner first chose A with B's copper thread as its chosen-state detail, and that refinement was built. Before any decision record was written, the owner changed the selection to B, as "cleaner, more cohesive and better suited to VNest's homepage", asked for A to be kept as a reference, and asked for nothing to be frozen. B refinement 1 was built: logo-led index, fixed-height stage, single-row desktop toolbar, compact phone layout with two-column cards. On a phone, all six cards now end 1,113 px below the section top (previously 2,638 px).

### 15/10/2026: concept B approved as the selected design direction; not frozen

Owner's words: "Concept B is approved as the selected design direction. The final section is NOT frozen yet." The owner also asked to preserve the layout, interactions, responsive behaviour and visual language, and not to create new concepts.

Requirements for the final section:
- all six properties visible by default
- working brand and city filters
- an unverified Area filter must not be presented as operational
- official partner logos only when supplied
- a compact mobile experience, with the property cards immediately accessible
- indicative rates never shown as live availability prices

VNest has supplied property photographs as Google Drive links in `VNest_Information.xlsx`. They have not yet been imported into the repository, and the workbook is not yet in this workspace.

## Repository checkpoint, 15/10/2026

Following the owner-approved plan (`docs/REPOSITORY-CHECKPOINT-2026-10-15.md`), on the local branch `design/vnest-property-gallery-exploration`. No approval or freeze status changed.

| Commit | Contents |
|---|---|
| `b166f5b` | Property gallery explorations and Living Frames prototypes; drawn fixtures; design boards; stock-media fallback |
| `dc93ae4` | Living Frames and gallery QA evidence, representative set; QA script profile-path fix; `chrome-profile/` ignored |
| `06f9a6e` | Brand Collection prototypes (B selected, A and originals as references); VNest vectors; design notes |
| `1e7fbba` | Brand Collection QA evidence, representative set |

**Backup before anything moved.** `VNest-2-backups/vnest-2-untracked_2026-10-15.tar.gz`, SHA-256 `eee122bf…0e77b8`, holds all 396 untracked files. Its listing had 396 entries, and all 396 extracted files matched their originals byte for byte.

**Archive.** 184 QA files (94.4 MB) were copied to `VNest-2-backups/qa-archive_2026-10-15/`. All 184 passed against the archive's `SHA256SUMS` before they were removed from the working tree. They are the GIF copies of WebP recordings, superseded rounds, full-page captures, and the 54 captures showing Pexels media.

**Each commit's exact tree was checked in a clean worktree:** lint (warnings only, in the QA scripts), typecheck, unit tests (182, 182, 193, 193 of the same counts), and the production build. The clean tree had no stock media, so the build also confirmed that `/media-a` and `/media-b` render the drawn fallback with its notice.

Not committed: the Pexels media (ignored, untouched), the captures that show it, and any client photography (none imported). Untouched: `main`, section 02.1 (`src/features/booking-search/` is identical to `9b2febc`), and the PMS and booking domain code. Nothing pushed, merged or deployed.

Incident: the QA capture helper had written a 13 MB Chrome profile to `~/Documents/GitHub/VNest%202/`, outside the repository, because `URL.pathname` encodes the space in the folder name. Found during the audit, deleted (it held only that profile), and fixed in both helpers.

## 03.3-C1: client data audit and G1 preview, 15–16/10/2026

- 15/10: `VNest_Information.xlsx` audited (`docs/content/CLIENT-DATA-AUDIT-2026-10-15.md`). On 16/10 the owner accepted it as a working data inventory only, not approval of content or photography, and asked for evidence-level wording. The Bare Hàn / The Nắng Suites shared folder URLs are a confirmed conflict whose ownership is unverified. Name and size matches are probable duplicates, not hash-verified. Both corrected.
- 16/10: the owner approved **G1 only**. Built `/dev/brand-collection/b-client`: a traced adapter (`src/app/dev/brand-collection/client/`), six real properties with short names, three brands, City filter, Area hidden, labelled placeholders for every picture. Changes to the shared B files are optional props whose defaults keep `/a`, `/a-original`, `/b` and `/b-original` pixel-identical (24/24 captures).
- G2 (photography) deferred, not rejected. CEO clarification requested. Four-image mapping kept ready in `client/media.ts`.
- Evidence: `docs/qa/brand-collection/b-client/RESULTS.md`. Nothing committed, pushed, merged or deployed. Not frozen.
- 17/10: the owner reviewed G1 and asked for one refinement: a price area on the six cards only.
  - Built typed price states in `client/pricing.ts`: PMS quote, then approved "Giá từ", then the unverified workbook figure (private local preview only), then "Xem giá theo ngày".
  - The rate snapshot (`client/rates.ts`) is kept apart from the content adapter.
  - Also added `main` and a visually hidden `h1` to `b-client`, and fixed most of the filter-induced shift there: chip counts now get a fixed box, and CLS went from 0.0044 to 0.0007.
  - The existing prototypes are still pixel-identical (24/24).
  - Evidence: `docs/qa/brand-collection/b-client/RESULTS.md`, second part. Not committed, not frozen.
- 18/10: card simplification, at the owner's request, in `b-client` only.
  - Each card now shows name and city on the left, and "Giá tham khảo" with the figure on the right. The brand line, "chưa xác minh" and the "Thấp nhất ngày thường" caveat lines are gone from the card.
  - Provenance, missing-rate flags and the open questions stay in `client/pricing.ts`. The review line still says the figures are unverified.
  - `?price=public` still shows no figures. The existing prototypes are still pixel-identical (24/24). Not committed.
- 18/10: **G1.1 (card pricing) approved by the owner for the selected direction.** The card hierarchy is fixed as name, city and compact reference price. Workbook figures may appear only in the private dev preview; the public mode keeps hiding them. No further card changes unless real photography shows a layout problem. The stray `~/Documents/GitHub/VNest%202/` profile folder is to be left untouched.
- 18/10: G2 requested, with a condition: download only once an explicit authorisation for private local review is confirmed. None is recorded, so the pipeline was prepared and stopped before downloading.
  - Prepared: `docs/content/g2/` (gated fetch and derivative script, runbook), `client/photos.ts`, `<picture>` rendering, and two ignored storage paths.
  - Verified: nothing downloaded; `b-client` and the prototypes pixel-identical; 230/230 tests.
- 18/10: **G2 authorised by the owner** for private local review of the four primaries. The message's name, capacity and reference placeholders were left blank; they are recorded as such.
  - Fetched (sizes verified, sha256 recorded, originals read-only and ignored) and derived (AVIF, WebP, JPEG at 480–1600 px, ignored).
  - Integrated in `b-client` with crops per photo. Bare Hàn and The Nắng Suites keep placeholders.
  - The three Bare photos carry Bare's own watermark; not edited.
  - QA: every slot gets a large enough file at 390, 768, 1440 and 1440 retina; lazy loading proven; prototypes 24/24 unchanged; 230/230 tests.
  - Evidence: `docs/content/g2/README.md` and `docs/qa/brand-collection/b-client/RESULTS.md`. Not committed.
- 19/10: **G2.1 location label and panel** on `b-client`, at the owner's request.
  - The city line became a button: "TP.HCM · Quận 1", "Đà Nẵng · Hải Châu", or the city alone.
  - It opens a small panel with the street, the ward and city as supplied, a pending line, and "Xem bản đồ" where verified.
  - Former districts are taken only from public sources naming them for the property: Bare Chic and Pepper House (Quận 1), Bare Hàn (Hải Châu), The Nắng Suites (Sơn Trà). Bare Hyphen and Bare Đa Kao show the city alone.
  - Found: The Nắng Suites is published as **74/31** Võ Văn Kiệt, while the workbook has K174/31. The number is withheld (Q19).
  - Bare Hyphen's map link is withheld while Q4 is open.
  - Google's pages answered with a CAPTCHA, which was not bypassed.
  - Prototypes 24/24 unchanged; 238/238 tests. Not committed.
- 19/10: the owner opened the next phase: **Bare Chic property detail**, as the reference implementation for all six properties.
  - Plan only, awaiting approval: `docs/sections/05.2-bare-chic-property-detail-plan.md`. It covers the assessment of 05.1, 02.2 and Living Frames; the architecture; reuse versus new; the content and media matrix; phone and desktop experience; risks; acceptance criteria; and decisions D1–D5.
  - D1: local `client-draft` content source, so 02.2 runs "not connected". D2: a draft-only rights value. D3: indicative price near the CTA. D4: G3, five more Bare Chic photos. D5: approval.
  - No code changed.
- 19/10: **05.2 plan approved by the owner**: D1 (client-draft source, not-connected rooms), D2 (draft-only rights value), D3 (one private reference price near the CTA), D4 (G3: five Bare Chic files for private local review).
  - **Checkpoint 1 built:**
    - shared workbook modules moved to `src/content/vnest-workbook`;
    - rights value `client-supplied-pending`;
    - G3 fetched (sizes and sha256 verified);
    - the Bare Chic draft `PropertyRecord`, which passes the content gate;
    - the `client-draft` source (local-only, never indexable);
    - `/dev/stays/bare-chic` with 02.2 in its honest "not connected" state.
  - The content gate refused room photographs as the property gallery. They became a captioned media section instead.
  - Checks: 245/245 tests; CTA in the first screen at 390, 768 and 1440; booking code and `/stays` unchanged; Brand Collection layout unchanged.
  - Evidence: `docs/qa/05.2/cp1/RESULTS.md`. Not committed.

## Section 05.2: Bare Chic property detail, workbook v2 and G4 (20/10/2026)

### 20/10/2026: workbook v2 reconciled, prototype built, refined, G4 photographs added

- Source diff: `content/WORKBOOK-V2-SOURCE-DIFF-2026-10-20.md`.
- Builds: `qa/05.2/v2/`, `qa/05.2/v2-refine/`, `qa/05.2/v2-g4/`.
- The 20/10 first build is kept at `/dev/stays/bare-chic-20-10`.

### 20/10/2026: owner decision on G4, "APPROVED AS DESIGN DIRECTION, NOT FROZEN OR PRODUCTION-APPROVED"

| Feedback | Revision |
|---|---|
| Preserve the hero collage, the 19-photo gallery, room galleries, amenities, room-card hierarchy and "Khám phá các loại phòng"; no redesign or new refinement cycle | Preserved unchanged |
| Acceptance appendix: coverage matrix, people photographs, departures with recommendations, gallery acceptance, production safety | `qa/05.2/G4-ACCEPTANCE-APPENDIX.md`. People photographs are held from public release (`RELEASE_HOLDS`). The Bare Chic review routes now answer 404 unless `DEPLOY_ENV=development` is declared. The same risk on `/b-client` is reported, not changed |
| The four checkpoint-1 departures are not approved by this decision | A recommendation for each, awaiting the owner's decision |
| Next: VNest City Notes, a separate checkpoint | Boundary proposed in `sections/city-notes-boundary-proposal.md`. Nothing built |

Status: **DIRECTION APPROVED, not frozen.** Nothing committed.

## VNest City Notes (20/10/2026)

### 20/10/2026: specification and layouts (1440, 390)

- Spec: `sections/city-notes-spec.md`. Board: `design/city-notes/board.html`.

### 20/10/2026: owner decision, "APPROVE CS-1 through CS-7 as the design and implementation direction, with two refinements"

| Feedback | Revision |
|---|---|
| Mobile density: 630 px is a starting point; optimise spacing on the real 390 layout; keep four places; show a justified three-place alternative only if the section feels long; keep readability and targets | Spacing tightened, with type and targets unchanged: 580 px with four places (69% of a screen). Three places (490 px) is available at `?mobile=3` for comparison. Recommendation: keep four |
| Address handling: no fabricated corrections. D33 may fall back to its area. D30 keeps its street, flagged, with a review-safe presentation; neither changed silently | D33 → "Bình Hiên, Hải Châu" (L4). D30 → "119 Trần phú, Hải Châu" as written (new L5), with a "Chờ VNest" tag in the private preview. C13 is flagged the same way. Flags are pinned to their source text |
| Build CS-7: reader, tests, `/dev/city-notes`, tabs and expand, QA at 390, 768 and 1440, report | Built. 23 new tests (284/284 pass). Load CLS 0, no overflow, no target under 44 px, no-script fallback, keyboard pattern verified. Bare Chic and Brand Collection are pixel-identical with and without City Notes: `qa/city-notes/RESULTS.md` |

Status: **prototype awaiting visual review.** Not integrated into Bare Chic, not frozen, nothing committed.

## CEO demo readiness (20/10/2026, for Friday 23/10)

| Owner's brief | Done |
|---|---|
| One complete Bare Chic page; City Notes after Vị trí; no internal QA in the presentation | `/dev/stays/bare-chic?view=demo`: the public state, no review notes, City Notes (TP. Hồ Chí Minh) |
| "Bánh mì Huỳnh Hoa", source-traceable, snapshot unchanged | `OWNER_CORRECTIONS` (C13), pinned to the raw text; C13 part of Q32 resolved |
| Photographs with people excluded from what is shown externally | The three `RELEASE_HOLDS` photographs left out of the demo view; counts 16 (3/5/3/5) |
| One tab: homepage → Brand Collection → Bare Chic → back | `/dev/demo` (the root `/` is still the Phase 01 placeholder): Brand Collection with an opening, Bare Chic's card linked; the VNest mark and "Tất cả nơi ở" return |
| Preserve 02.1 | Unchanged. First left out of the demo view; the owner then decided (20/10) to **show it by default**. `&search=0` hides it. Its "VNest" and "Tất cả cơ sở" links leave the demo flow, so the handoff tells the presenter to avoid them |

Evidence: `qa/demo/HANDOFF.md`, `qa/demo/results.json`, two recordings. Nothing committed.

### 21/10/2026: room facts recovered, room drawer polished, demo navigation

| Owner's brief | Done |
|---|---|
| Recover the legacy room sheet's facts where supported; keep provenance; blanks stay blank | `confirmedRoomFact()` in `property-details.ts`. Values are shown only from a room's own row: merges D4:D7, E4:E7 and F4:F25 lend nothing. Status `confirmed` on the admin statement the owner relayed (`LEGACY_ROOM_CONFIRMATION`); written record pending (**Q37**). The snapshot and the `not-reconfirmed` trace are unchanged. Tests pin all 22 rows (`room-facts.test.ts`) |
| Bare Chic One: Studio, 28 m², 2 adults; the other rooms not copied, no repeated placeholders | Drawer spec row for One; Two, Three and Indochine show none; the "being updated" line is removed. Card specs use G4's existing slot |
| Demo links that leave the journey | `DemoLinkGuard` (demo view only) keeps 02.1's "VNest" → `/dev/demo` and "Tất cả cơ sở" → `/dev/demo#kham-pha`. A search still leaves the demo for `/stays/bare-chic` (05.1 shell): reported in `qa/demo/HANDOFF.md` |

Evidence: `qa/demo/room-facts/` (drawers at 1440/768/390, link inventory, `results.json`). 288/288 tests. Nothing committed.


## Codex takeover, 22/10/2026 — official logos and demo content corrections

Owner authorised completing the remaining integration for the 23/10 CEO demo, preserving the current tree and stopping for visual review. Existing About/Partner redesign, hero, menu, G4 drawer and City Notes were retained. Added the three exact supplied logos to selected `/dev/demo` brand stages via lossless derivatives, corrected The Nắng Suites' About city to Đà Nẵng, kept management-only positioning, and made VNest Facebook/Instagram/TikTok explicit noninteractive placeholders. No Section 02.1 changes, commit, deployment or freeze. Evidence and limitations: `docs/qa/demo/takeover-2026-10-22/REVIEW.md`. This round is IN REVIEW, not approved.

### Brand Index placement correction — 22/10/2026

Owner requested one visual correction after reviewing the takeover screenshots. Official artwork moved into the left navigation beside brand names on desktop, above short names in the horizontal mobile index. Counts, copper timeline and selected markers retained. Removed redundant selected-stage logos in favour of name/city captions; restored compact stage caption height. VNest masterbrand unchanged. Transparent derivatives prepared deterministically from supplied files; Bare uses an original-script crop alongside its full text name, with the full lockup retained separately. Source PNG hashes unchanged. No business data/search changes or edits to About, Partner, booking/property pages. Evidence: `docs/qa/demo/logo-placement-2026-10-22/REVIEW.md`. IN REVIEW; no freeze or commit.

## Final CEO demo polish — 22–23/10/2026

Owner explicitly approved the **desktop Brand Collection visual direction** after the logo placement review. Composition, official logos, timeline, names and counts preserved; this is direction approval, not freeze or production approval.

The owner confirmed Nắng photography approval and authorised retrieval from workbook v2 sources. All four source folders were accessible and matched Nắng room names. One original candidate per room was retrieved, source-mapped and hashed. Green River `3.png` was chosen for the demo collection's card and showcases; its Nắng watermark and room-folder provenance were verified. Blue Moon's candidate contains people and is not shown. Originals/derivatives remain ignored. All 22 older manifest entries are unchanged. Exact file-ID/hash gate added only to `/dev/demo`.

About retains the requested headline/lead and local imagery; removed the secondary philosophy paragraph for brevity. Partner retains its olive composition and heading/lead, with secondary copy focused on owner audience and scope requiring confirmation, rather than operational promises. Existing same-page contact CTA retained. No frozen booking, filter/search, Bare Chic, drawer or City Notes source changes. No new detail page or colour system.

Evidence: `docs/qa/demo/ceo-polish-2026-10-22/`. Final photography and About/Partner polish are IN REVIEW; no commit, push, deployment or freeze.

### 23/10/2026 — The Nắng Suites detail + homepage photography (Codex)

Owner requested a second demo property page, overriding the earlier hold on a Nắng detail page. Added `/dev/stays/the-nang-suites` using the existing property architecture, with scoped blue-grey/beige styling and seven room-folder-verified photographs. Homepage Nắng uses Blue Moon 17.png; Bare Hàn uses corrected workbook v2 D16 → Ground 26.jpg. Public price safeguards, people-photo exclusions, frozen 02.1, About/Partner and existing explorations preserved. Existing Nắng address conflict remains explicit, no guessed facts. Sources and review screenshots: `docs/qa/demo/nang-page-2026-10-23/REVIEW.md`. IN REVIEW, not approved/frozen. No commit or deployment.

### 23/10/2026 — P0 homepage booking calendar clipping

Reproduced at 1440×1400: inline calendar extended to y=1304 while the hero's `overflow: clip` cut it at y=897, making lower dates unclickable. Removed hero clipping and added a homepage-only measured viewport positioning boundary for inline search panels, preserving their original form/event/focus context. No frozen 02.1 files or booking logic changed. Application changes: demo page integration, Demo.module.css, new HomepageBookingOverlays.tsx. Review evidence: `docs/qa/demo/calendar-overlay-2026-10-23/REVIEW.md`. Browser-emulated mobile only; no physical Safari device. IN REVIEW, no commit/deployment/freeze.

### 23/10/2026 — P0 booking property selector inventory

Audited both data and rendering. Homepage options came from the client-draft detail repository, whose builder contains only Bare Chic, while Brand Collection already has all six workbook properties. Replaced only the homepage option projection with `demoBookingOptions(content)`, preserving canonical IDs/slugs and the exact collection location labels. No new availability/provider mappings, frozen 02.1 changes or search-contract changes. Existing viewport-aware overlay integration handles the larger list without an additional CSS/z-index patch. New mapping regression test and review evidence: `docs/qa/demo/property-selector-2026-10-23/REVIEW.md`. IN REVIEW; no commit, deployment or freeze.

## VNest V3 Stage 1 (P0 UX corrections) — 24/10/2026 (Claude Code)

After the 23/10 CEO meeting (spec `VNest_V3_CEO_Feedback_Spec.md`, R01–R14), the owner approved Stage 1: header, duplicate bar, BOOK NOW, gallery CTA and hero carousel. Root cause of the "two bars" on property pages: the demo `SiteHeader` was followed by the 02.2 `ResultsSearchBar`, which carried its own "VNest" mark; nothing in 02.1. The demo header now carries the single compact bar (`DemoPropertyShell`; on the homepage, after the hero bar is scrolled past). **Owner-approved 02.1 exception (24/10):** an opt-in `BookingPresentationProvider` lets the bar's action read "BOOK NOW". It is absent on every frozen surface, and 24/24 before/after captures of the non-demo routes are pixel-identical. A valid search in the demo opens `/dev/demo/dat-phong`, an honest no-provider step, through an integration-layer guard; validation remains 02.1's. Photo viewers and room drawers carry BOOK NOW. The hero is a hash-pinned 5-photo carousel. Stage 2/3 are static proposals only (`/dev/v3-proposals`). Evidence and content questions: `docs/qa/v3-stage1-2026-10-24/REVIEW.md`. IN REVIEW; no commit, deployment or freeze.

### 24/10/2026 — VNest V3 Stage 2 (Brand Index A) and Stage 3 (Services B, Contact, FAQ, Footer)

The owner approved the directions Brand Index A "Sổ thương hiệu" and Services/Contact B "Ba thẻ, một chi tiết" (direction only, not final acceptance). Both are built on `/dev/demo`; the footer also appears on the demo property pages and the booking step.

- **Brand Index A:** three brands with no "All" and no counts; optically balanced original logos; an in-row hover/focus preview that never covers the About panel; click, Enter or tap commits; an editorial About panel with DRAFT copy and one CTA that filters the separate six-property collection.
- **Services B:** three cards with one disclosure region and a service-specific CTA that pre-selects the service in a centred, clearly labelled mockup contact that never sends.
- **FAQ and footer:** DRAFT FAQ; the footer uses only working routes, and pending contacts, social and policy items are flagged.
- **Integration fix:** the header now takes the compact bar as soon as the hero bar passes under it.

`ConnectedIndex`, the shared Brand Collection modules and 02.1 (beyond the Stage 1 exception) are unchanged: 24/24 regression captures are identical. Stage 1 QA passes again. Evidence: `docs/qa/v3-stage1-2026-10-24/REVIEW.md` (second part). IN REVIEW; no commit, deployment or freeze.

### 24/10/2026 — Stage 2 refinement: floating brand preview, discovery filter toolbar

Owner review of Stage 2 raised two corrections.

1. **Brand preview:** the in-row preview was cramped. It is replaced by one large floating editorial card on desktop: approved photo, logo and city, name, DRAFT intro. The card is absolutely positioned and clamped to the viewport, pointer-transparent and uses hover intent. Keyboard focus gives the same preview, and Escape, click and Enter follow the owner's contract. There is no preview on touch, where a tap selects. Rows at rest show only logo, name, city and thread.
2. **Discovery filters:** the heading and crowded chips sat side by side. The section is now a full-width introduction, then a toolbar: two aligned segmented rows with the live result on desktop, evenly split rows on tablet, two selects on phones. Then the grid. All brands and all cities remain; filter logic is unchanged.

QA: `docs/qa/v3-stage1-2026-10-24/scripts/refine.mjs` at 1440, 1280, 768 and 390. IN REVIEW; no commit, deployment or freeze.

**Outcome.** Owner visual acceptance, 24/10/2026: "Accepted: the floating brand preview and the discovery filter toolbar are visually approved." This approves the two Stage 2 corrections visually. It is not a freeze, not production approval, and not acceptance of DRAFT content.

### 24/10/2026 — Dedicated Booking Results & Multi-Room Selection (`/dev/demo/tim-phong`, Antigravity takeover)

Owner requested a dedicated Booking Results page at `/dev/demo/tim-phong` implementing the long-term journey (`Search → Booking Results → Select Rooms → Review Selection → Booking Engine`) and multi-room provisional selection (multiple requested rooms with adults distributed per room, e.g., Bare Chic · Nov 6–8, 2026 · 2 rooms · 4 adults across two room groups) without modifying frozen Section 02.1 or global `BOOK NOW` routing yet.

- **Data & provenance:** Built `booking-results-data.ts` over the 6 workbook properties and 22 named rooms (`VNest_Informationv2.xlsx`), preserving `RELEASE_HOLDS` exclusions (`1.11`, `2.32`, `1.18`), approved room/property photo gates (`G2`, `G3`, `G4`), and own-row `confirmedRoomFact` provenance (only `Bare Chic One` has verified `Studio · 28 m² · 2 người lớn`; the remaining 21 rooms had merged cells `F4:F25` in the legacy sheet and explicitly report unverified capacity).
- **Multi-room & unique unit enforcement:** Built `booking-results-state.ts` and `BookingResults.tsx` supporting 1–6 room groups, adults per room, adding/removing room groups, provisional room assignment/reassignment/removal, unique physical unit enforcement (`physicalUnits: 1`, preventing the same named unit from being selected for two room groups), sticky selection summary (desktop sidebar + mobile bottom bar), and a Step 04 Review Selection modal dialog.
- **No fake availability or pricing:** Prominently displays `"Tính năng kiểm tra phòng trống và giá theo ngày đang được hoàn thiện."` and clearly distinguishes provisional room preferences from a confirmed booking.
- **QA:** `docs/qa/booking-results-2026-10-24/scripts/qa-booking-results.mjs` (all checks pass at 1440px, 768px, and 390px, 0 console errors, 0 broken images, 0 horizontal overflow) and 309/309 unit tests pass. Evidence: `docs/qa/booking-results-2026-10-24/REVIEW.md`. IN REVIEW; no commit, push, deployment or freeze.

### 24/10/2026 — End-to-End Multi-Room Booking Journey Integration & EzCloud Adapter Architecture (Antigravity)

Following approval of the dedicated Booking Results prototype (`/dev/demo/tim-phong`), integrated the full booking journey across the VNest V3 demo website (`Homepage BOOK NOW → Booking Results → Multi-room selection → Review selected rooms → Step 05 Booking Intent Summary`) with property detail `BOOK NOW` and photo viewer / room drawer `BOOK NOW` entering the same consistent flow.

- **Frozen Section 02.1 preserved via integration adapter:** Zero edits to `src/features/booking-search/` or `src/domain/search.ts`. All 24/24 non-demo captures (`docs/qa/v3-stage1-2026-10-24/scripts/regress.mjs`) have `0` changed pixels.
- **State & URL round-trip contract:** `booking-flow.ts`, `BookingCta.tsx`, and `booking-results-state.ts` bridge 02.1's `StaySearchState` and `MultiRoomSearchState` (`property`, `checkIn`, `checkOut`, `rooms`, `adults`, `prefs`, `room`), preserving dates, guest distribution, property scope, and provisional room preferences across navigation, page refresh, and browser back/forward navigation (`popstate`).
- **Room types vs. physical units vs. live inventory:** `CatalogRoom` (`booking-results-data.ts`) and room cards (`BookingResults.tsx`) explicitly distinguish `Loại phòng` (`roomType`), `Đơn vị vật lý` (`1 căn độc bản`, `physicalUnits: 1`), and `Tồn kho khả dụng` (`Chờ phản hồi ezCloud / PMS`, `inventoryQuantity: null`).
- **EzCloud adapter architecture:** Documented in `docs/decisions/ezcloud-multi-room-adapter-architecture.md` and `docs/BOOKING.md` without inventing API endpoints or auth mechanisms.
- **QA:** `npm run lint`, `npm run typecheck`, `npm test` (`312/312` pass), `npm run build`, and `docs/qa/booking-results-2026-10-24/scripts/qa-journey-integration.mjs` (`13/13` checks pass at `1440px`, `768px`, and `390px`, `0` console errors, `0` broken images, `0` horizontal overflow). IN REVIEW; no commit, push, deployment or freeze.

### 24/10/2026 — VNest V3 Booking Results UX Simplification (Antigravity)

Owner reviewed the multi-room Booking Results page (`/dev/demo/tim-phong`) and requested a focused UX simplification around **ONE SCREEN, ONE PRIMARY DECISION** so the interface feels like a refined hospitality website rather than an administrative dashboard.

- **Simplified page hierarchy:** Removed the 5-step progress indicator and verbose header; replaced with heading `"Chọn phòng"`, one concise summary (`"Location / Property · Dates · X phòng · Y khách"`), and one `"Chỉnh sửa"` action.
- **Reduced technical messaging:** Removed repeated PMS/ezCloud, unique physical unit, and unverified inventory badges from room cards and sidebars; retained one compact notice near the top (`"Giá và tình trạng phòng trống sẽ được xác nhận khi hệ thống đặt phòng được kết nối."`) while preserving all underlying validation.
- **Simplified All Properties view (`property=all`):** Displays 6 photo-led property cards (cover photo, name, city, concise intro, and one `"Xem phòng"` CTA) instead of 6 expanded room lists; clicking `"Xem phòng"` drills into that property's rooms while preserving dates and guest configuration and preventing cross-property multi-room combinations.
- **Redesigned room cards & sequential multi-room flow:** Each room card shows one verified photo, room name, verified room fact (or honest unverified room-preference status), `"Xem ảnh và chi tiết"`, and one primary CTA (`"Chọn phòng này"`). Top bar shows `"Đang chọn phòng 1/2 · 2 khách"` and auto-advances to `"Đang chọn phòng 2/2"` upon selection while enforcing unique physical unit protection.
- **Simplified summary & review sheet:** Compact sticky right-hand summary on desktop and compact bottom bar on mobile (`"X/Y phòng đã chọn"` + `"Xem lại lựa chọn"`), opening a concise `"Kiểm tra lựa chọn"` review sheet with property, dates, per-room selection (`"Đổi phòng"`), one short non-availability notice, and no disabled contact buttons.
- **QA:** `npm run lint`, `npm run typecheck`, `npm test` (`312/312` pass), `npm run build`, and `docs/qa/booking-results-2026-10-24/scripts/qa-ux-simplification.mjs` (Scenarios A–H pass across `1440px`, `768px`, and `390px`, `0` console errors, `0` broken images, `0` horizontal overflow). Evidence: `docs/qa/booking-results-2026-10-24/simplified/`. IN REVIEW; stopped for visual acceptance.

### 24/10/2026 — VNest V3 Room-First Booking Results & Frictionless Multi-Room Selection (Antigravity)

Owner tested `/dev/demo/tim-phong` and reported two remaining UX issues: (1) searching "All Properties" still showed a mandatory property-discovery grid requiring guests to click `"Xem phòng"` before seeing rooms, and (2) adding a second room required reopening the search editor (`"Chỉnh sửa"`), while the selection model did not distinguish selecting multiple units of a multi-unit room TYPE from selecting a unique physical unit twice.

- **Root causes fixed:**
  1. Removed the `!selectedProperty` property-overview grid in `BookingResults.tsx`; `All Properties` now renders the 22-room catalog directly with compact Property & City metadata on every room card and inline City/Property filter chips.
  2. Exposed direct **`+ Thêm phòng`** controls and inline per-room guest steppers (`− / +`) directly in the sticky desktop summary, active selection bar, and mobile sticky bar so rooms can be added/removed without reopening the search filter.
  3. Audited `VNest_Informationv2.xlsx` and the `15/10` room sheet: each of the 22 named rows is 1 physical unit (`physicalUnits: 1`), while several properties share own-row verified room categories (`Bare Hyphen`: 3 `Studio · 18 m²` units; `Bare Đa Kao`: 4 `Studio` units; `The Nắng Suites`: 4 `Studio` units). Added `optionKind` (`"physical-unit" | "room-type"`), `sameTypeUnitIds`, `evaluateSameTypePool`, `selectAdditionalSameTypeUnit`, `summarizeSelectedRoomTypes`, and `applyProviderInventoryToCatalog`, preserving unique physical unit protection (`Bare Chic One` cannot be selected twice) while enabling 1-click same-room-type multi-unit selection (`+ Chọn thêm 1 căn hạng Studio` → `2 × Hạng Studio`).
- **QA:** `npm run lint`, `npm run typecheck`, `npm test` (`315/315` pass), `npm run build`, and `docs/qa/booking-results-2026-10-24/scripts/qa-room-first.mjs` (Scenarios 1–10 pass across `1440px`, `768px`, and `390px`, `0` console errors, `0` broken images, `0` horizontal overflow). Evidence: `docs/qa/booking-results-2026-10-24/room-first/`. IN REVIEW; stopped for owner visual review.





## V3 takeover after Antigravity — 25/10/2026

| Owner's brief | Done |
|---|---|
| Verify Antigravity's claims; fix P0/P1 only | Footer count, scroll-to-top, map links and related properties verified. Fixed: fake "Đã ghi nhận" confirmation in the property BOOK NOW review (→ "Tiếp tục" to `/dev/demo/dat-phong`, also added to the Booking Results review); React #418 on refresh with rooms selected (`useSearchParams`); 925 px page width at 768 on both property pages (aside track `minmax(0, 1fr)`, container-query map card); `rooms` parsed differently on the two pages (property page now uses `parseMultiRoomQuery` and the same format); policy dialog promises removed (topics only, "Chờ VNest xác nhận") |
| Room metadata from the merged-cell workbook | Analysed from the sheet XML: within-property merges for Bare Chic, Bare Hàn and Pepper House; F4:F25 occupancy spans all 22 rooms across six properties. Display unchanged (owner's 21/10 brief); options R1 and R2 proposed for decision |
| Services B, Contact, FAQ, Footer | Refined the 24/10 build: white shared detail panel with a visible pointer; `?dich-vu=` keeps the service; Contact gets Loại tài sản, accessible validation, field focus, an honest "Chưa gửi" state (0 requests); six FAQ topics; footer with real routes, service deep links, pending items as text, social pills removed. Data and validation in `owner-journey.ts` (+4 tests) |
| Palette and accessible BOOKING/BOOK NOW | White on #A87444 measured 4.0:1; CTA fills now #9A683C (4.75:1) through demo tokens, 02.1 code untouched; darker taupe/copper for small text in the owner sections. Pending owner decision |

QA: `qa/v3-takeover-2026-10-25/scripts/qa.mjs` 129/129 at 1440/768/390 (emulated, not physical), 0 console errors, 0 non-GET requests; frozen and non-demo regression 18/18 pixel-identical; lint 0 errors, typecheck clean, 319/319 tests, build OK. Evidence: `qa/v3-takeover-2026-10-25/`. IN REVIEW; nothing committed.

### 25/10/2026 — Owner decision: CTA copper

The owner chose to keep the text-safe copper **#9A683C** for CTA fills under white text (BOOKING, BOOK NOW, room selection, service CTAs, the Booking Results actions). #A87444 stays the brand Copper Bronze for marks, borders and decoration. Reason: white on #A87444 is 4.0:1, below WCAG AA (4.5:1) at CTA sizes; #9A683C is 4.75:1. No code change; the takeover round stays IN REVIEW otherwise.

### 25/10/2026 — Owner decision: room facts R3 (supersedes the 21/10 own-row rule)

| Owner's brief | Done |
|---|---|
| R3: merged type/area to every row of each property-specific merge; workbook-wide "2 người lớn" to all 22 rooms; on the owner's confirmation that the sheet is accurate | `confirmedRoomFact` shows a value on every row its merge covers (D4:D7, E4:E7, D16:D19, E16:E19, D24:D25, E24:E25, F4:F25). `ROOM_FACT_INTERPRETATION` records the rule, who decided it and when |
| Explicit per-row values stay the source of truth | `legacyFact` uses a row's own value before any merge (the merge's first row stays part of its merge) |
| Concise metadata, not occupancy eligibility or availability | Icons with type · area · "2 người lớn" (as written; no longer rewritten to "khách"). `verifiedMaxAdults` is null for every room in both catalogs, so no limit or "Tối đa" message comes from workbook data. The earlier 2-adult block on Bare Chic One is gone; the capacity mechanism remains for ezCloud limits |
| Keep provenance; document the pending written confirmation | Each value keeps raw text and anchor cell; its rule names the range, the admin confirmation, "display metadata only" and the pending written per-room record (Q37) |
| Do not silently alter selections or frozen contracts | 02.1 untouched; address format unchanged; selections are kept on reload and on guest changes. Side effect: Bare Chic, Bare Hàn and Pepper House rooms now share the type "Studio", so the summary groups them and offers the same-type shortcut, as Bare Hyphen already did; unique-unit protection unchanged |

Tests: `room-facts.test.ts` rewritten for R3 (all 22 rows), `view.test.ts` and `booking-results.test.ts` updated from the superseded rule; 320/320. Evidence: `qa/v3-takeover-2026-10-25/REVIEW.md` §3. IN REVIEW; nothing committed.

### 25/10/2026 — R3 QA rerun (owner requested)

Final build: `qa/v3-takeover-2026-10-25/scripts/qa.mjs` 168/168 at 1440/768/390 (the 135 earlier checks plus 11 new ones per width: all 22 rooms' R3 metadata, display-only occupancy, the Studio pool limited to real rooms with no duplicate assignment, change/remove/refresh on both pages, direct URLs 200, click navigation and Back). 0 console errors, 0 non-GET requests, 0 server errors; frozen and non-demo regression 18/18 identical. Fixed one regression: the same-type shortcut's "(còn N phòng)" read as availability, so the count was removed on both pages. Emulated devices, not physical. R3 direction approved by the owner; final acceptance pending visual review.

## V3 final UX refinement — 25/10/2026

| Owner's brief | Done |
|---|---|
| R3 room metadata | Already implemented; `ROOM_FACT_INTERPRETATION.status = "approved-demo-display"`; rule text adds "not a child policy"; written per-room confirmation (Q37) still listed |
| Price on property room cards | `RoomPrice` + `public-rates.ts` (empty: no VNest-approved rate). "Xem giá theo ngày" fallback; private preview keeps the indicative figure. Desktop strip: price leads, CTA outlined at rest, filled on hover/focus (colour only, constant width); touch: full-width filled CTA, price on its own line |
| Footer redesign | "Lưu trú" removed; Dark Olive Contact area (~44% desktop) with hotline, email, address from VNest's official Facebook About (read 25/10), "Gửi yêu cầu tư vấn", active Facebook link; Instagram/TikTok omitted. Address equals Bare Chic's: flagged |
| B2B review | Services, Contact, FAQ, About unchanged; re-verified |
| Location module (second brief) | Full-width "Vị trí" section after rooms, before City Notes; stylised map base + OSM tiles overlay (live tiles blocked in this environment, unverified); Google Maps airport distance/time (9.5 km/29 min; 5.9 km/15 min, read 25/10); workbook transport (no "taxi" in source); Google Maps CTA; policy dialog. Nắng shows "Đường Võ Văn Kiệt" (house number conflict Q19); its internal note now private-preview only |

QA 183/183 at 1440/768/390 (emulated), 0 console errors, 0 non-GET requests; frozen regression 18/18; lint 0 errors, typecheck clean, 325/325 tests, build OK. Evidence `qa/v3-final-2026-10-25/`. IN REVIEW; nothing committed.

### 25/10/2026 — Owner decision: footer address

The owner chose to keep **12/18 Nguyễn Thị Minh Khai, Phường Sài Gòn, TP. Hồ Chí Minh** as VNest's footer address, because VNest publishes it as its own on its official Facebook page (it is also Bare Chic's address). No code change. The final UX round stays IN REVIEW for visual acceptance.

### 25/10/2026 — Location map: official Google Maps embed

Owner: replace the synthetic map with the actual Google Maps display. Done: Google's official embed (Share → Embed a map) for each verified place (Bare Chic `/g/11f6ywgqpw`, The Nắng Suites `/g/11fnr8n47n`), used unchanged; synthetic pattern and OSM tiles removed. Lazy mount near the section, a no-cors HEAD reachability check before mounting (a blocked frame still fires "load"), and a plain fallback (address and Google Maps link). Desktop ≈58/42, phones map on top at 16:10. Verified by real rendering in headless Chrome at 1440/768/390 (painted map, marker on the property, one-finger page scroll unaffected) and by a blocked-network simulation (clean fallback). Flag: Google's place card for The Nắng Suites shows Google's "74/31" (Q19). QA 183/183, 0 console errors, 0 data-carrying requests; frozen regression 18/18; lint, typecheck, 325 tests, build OK. IN REVIEW.
