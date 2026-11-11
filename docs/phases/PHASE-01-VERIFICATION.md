# Phase 01: final technical verification

Date: 10/10/2026. Reviewed at commit `cd2cce4`. Reviewer: the implementer; this is a self-review, not an independent audit.

**Recommendation: approve Phase 01, with two small fixes to be made before any deployment (findings F1 and F2).** No blocker to approval was found. Phase 01 is not marked approved or frozen by this report; that is the owner's decision.

No code was changed during this review.

## 0. Addendum, 10/10/2026: F1 and F2 corrected

The owner gave Phase 01 conditional approval and required F1 and F2 to be corrected before it is frozen. Both are corrected and preserved as snapshot `278deaf`, which is not approval; **Phase 01 remains pending the owner's final freeze confirmation.**

| Finding | Correction | Evidence |
|---|---|---|
| F1 | The noindex header is now also applied per request (`src/proxy.ts`), and `robots.txt` and the sitemap are answered per request. The build-time header in `next.config.ts` is kept, so both locks must agree | `npm run test:promotion`: 8 of 8 pass. Run against the code before the fix, the same file fails 5 cases (preview, development and mock starts of a production build; both F2 cases) |
| F2 | `readEnv` refuses a production deployment without a public https `SITE_URL`. Development and previews keep the localhost default | 2 new unit tests in `config.test.ts`; the build and `next start` both stop with the error in the promotion test |

Not changed: F3 to F7, and nothing else in the foundation. The rest of this report is as written at `cd2cce4`.

### Final safeguards, 11/10/2026

A review of what remained after F1 and F2 found three cases, all closed for indexing but silent or open to a mistake, and the owner approved correcting them:

| Case, before | Now |
|---|---|
| `DEPLOY_ENV=production` reaching a Vercel preview overrode `VERCEL_ENV=preview`: the preview became indexable | The signal that is not production wins; reported in the log |
| An empty `DEPLOY_ENV` hid `VERCEL_ENV=production`: a live site ran as development | Empty counts as not set; reported |
| A production host that declares nothing ran as development with localhost addresses, in silence | Still closed, never assumed to be production; reported, with the localhost address named |

Also: `SITE_INDEXABLE` values other than the exact word, and a request for indexing that cannot take effect, are now explained in the log. Details and the per-host table: `ARCHITECTURE.md`. Files: `src/config/env.ts`, `next.config.ts`, `src/config/config.test.ts`, `test/e2e/build-promotion.test.mjs`, `.github/workflows/ci.yml`, `.env.example`. Evidence: 182 unit tests; promotion test 15 of 15.

Phase 01 remains conditionally approved, pending the owner's final freeze confirmation.

#### Verification record for the final safeguards

| | |
|---|---|
| Commit | `442985b` on `dev/v2-preservation` (after `278deaf`, the F1 and F2 corrections). Nine files; no file of section 02.1, 02.2 or 05.1 |
| Approved for version control | By the owner, 11/10/2026. This is not the Phase 01 freeze |

Results, run on an exported copy of the exact committed tree, 11/10/2026:

| Check | Result |
|---|---|
| Lint | Pass |
| Typecheck | Pass |
| Unit tests | 182 of 182 (175 before this commit; 8 tests on deployment identity replace 1) |
| Production build | Pass |
| Promotion test (`npm run test:promotion`) | 15 of 15 (8 before this commit) |
| GitHub CI | **Not run on this commit.** See "CI validation" below |

Environment resolution. "Real settings" means a public https `SITE_URL`, `SITE_INDEXABLE=true`, and real content and booking.

| Situation | Resolved as | Indexable | Reported in the log |
|---|---|---|---|
| Local `npm run dev`, nothing set | development | No | Nothing |
| Production build or server, nothing set | development, unidentified | No | Not identified; localhost address in use |
| CI build, `DEPLOY_ENV=development` | development | No | Nothing |
| Real settings, nothing declared | development, unidentified | No | Not identified; indexing request has no effect |
| Vercel preview | preview | No | Indexing request has no effect |
| Vercel preview, `DEPLOY_ENV=production` | preview | No | Signals disagree |
| Vercel production | production | Yes | Nothing |
| Vercel production, empty `DEPLOY_ENV` | production | Yes | Empty value ignored |
| Vercel production, `DEPLOY_ENV=preview` | preview | No | Signals disagree |
| Production, `SITE_URL` missing, local or http | Build and server stop | | Error |
| Production, mock content or booking | production | No | Mock data in use |
| Other host, `DEPLOY_ENV=production` | production | Yes | Nothing |
| Netlify or Render preview, `DEPLOY_ENV=production` | preview | No | Signals disagree |
| Netlify or Render production, nothing declared | development, unidentified | No | Not identified |
| `VERCEL_ENV`, Netlify `CONTEXT` or Render `IS_PULL_REQUEST` present but empty or unreadable | preview | No | Signals disagree, when production was declared |
| `SITE_INDEXABLE` other than the exact word `true` | as declared | No | Value is not "true" |

Remaining deployment assumptions:

- No deployment to a real host has been made. The Vercel, Netlify and Render variable names are taken from those platforms' documentation.
- On any host except Vercel, production is recognised only when someone sets `DEPLOY_ENV=production`. Forgetting it leaves the live site closed to search, and reported, not open.
- A platform variable that is absent is not treated as a preview signal, because a platform may not pass it to the running server. Only a present but unreadable one closes the deployment.
- Whether a hosting integration is connected to the GitHub repository has not been inspected.

CI validation: the workflow runs on pull requests and on pushes to `main` and `feat/**`. `dev/v2-preservation` matches neither, so GitHub CI has not run on `442985b`. The cleanup pull request for `main` does not contain this commit and does not validate it. Finding F5 ("CI has never executed") therefore stays open.

Known limitations:

- The diagnostics are log lines. Nothing fails except production without a public https `SITE_URL`; someone has to read the build or server log. Each line appears twice per build, because the configuration is loaded twice.
- A preview without `SITE_URL` still emits localhost canonical and share addresses, with `noindex`. It is reported, not prevented.
- The promotion test covers Vercel, Netlify and Render previews by setting their variables, not by deploying to them.
- Findings F3, F4, F6 and F7 are unchanged.

Before a freeze: GitHub CI passing on this commit. Separately, as a release requirement and not a condition of the freeze: the first deployment to a real host, checked against the table above.

## 1. Acceptance criteria

The scope authorised for Phase 01 on 09/10/2026, against what exists:

| Authorised item | State | Evidence |
|---|---|---|
| Clean application scaffold | Met | Next.js 16, strict TypeScript, Tailwind 4; three runtime dependencies; production build passes |
| Reusable domain layer | Met | `src/domain/`, framework-free, enforced by an ESLint rule; 58 unit tests |
| TypeScript contracts | Met | `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`; typecheck passes |
| Provider-independent booking interfaces | Met | One `BookingProvider` port with declared capabilities; no vendor name in `src/domain` |
| Mock adapter, development only | Met | Scenario-driven; every answer marked `mock`, which the domain turns into `simulated`, never `bookable`; a mock-backed build cannot be indexed |
| Content schemas | Met | `PropertyRecord` covers the eight areas requested; validator runs over every record in the test suite |
| SEO infrastructure | Met, with finding F1 | Metadata, canonical, alternates, structured data, sitemap, robots; 8 tests |
| Design token foundation | Met | Two-layer tokens mapped into Tailwind; themeable set enforced by validation |
| Linting, typechecks, testing | Met | Lint clean; 96 tests in the foundation, 122 with section 02.1 |
| CI configuration | Present, **never executed** | `.github/workflows/ci.yml`; the repository has no remote |
| V1 domain ported only after review | Met | Recorded in `PHASE-01-HANDOFF.md`, section 3 |
| No V1 UI or CSS, no CMS, animation library or monorepo | Met | |

## 2. Review by area

### Domain architecture and reusable contracts

Sound. Dates are calendar-day strings with integer arithmetic and no `Date`, so no timezone can shift a stay. The search codec never throws. Booking readiness is one function with eight exhaustive states. The dependency direction (`app → server → domain ← integrations`) is enforced by lint, and the rule fired correctly during development when a test broke it.

Limitation: `SearchCriteria` models adults only. Children and number of rooms are reserved, not built.

### Booking-provider abstraction

Sound for what is known. One port, capabilities declared not assumed, three hand-off modes, failure as a value with a retry flag, and no "confirmed" outcome anywhere.

Limitations, all already recorded as open: the offer and rate shapes are a proposal until a real API is documented; a multi-property search fails or succeeds as a whole (no per-property failure); the native checkout branch carries only a session reference.

### Property content schema

Sound. Localisation, media rights, references by id, publication rules and translation completeness are all validated in CI.

Limitation: it has only ever held three neutral sample records. It is untested against real VNest content, and the `baseline` layout is the only layout registered.

### SEO infrastructure and indexing safeguards

Works as designed **when each environment is built separately**. See finding F1: the safeguards are decided at build time.

### Backend integration boundaries

Sound. The browser reaches a provider only through `/api/availability`; credentials are server-side variables read in one file; provider identifiers stay in the property record's mapping and are stripped before a record reaches a page.

Limitation: the endpoint has no rate limiting or caching. That is acceptable while it serves a mock; it must be addressed when it fronts a real PMS.

### Test evidence

| Area | Tests |
|---|---|
| Domain (dates, search, booking, availability state, locale, validation) | 58 |
| Content gate | 3 |
| Integrations (repository, mock provider, unconnected provider) | 12 |
| Config and routes | 5 |
| Server availability use case | 10 |
| SEO | 8 |
| **Foundation total** | **96** |
| Section 02.1 | 26 |

All pass. `npm audit --omit=dev` reports 0 vulnerabilities. No `TODO` or `FIXME` in the source. One lint suppression exists, in section 02.1, with its reason beside it.

Not covered: no test renders a page or a component; route handlers are tested through their use-case functions, not over HTTP; there are no end-to-end tests; CI has never run.

### Dependencies shared with frozen section 02.1

Listed in `docs/decisions/02.1-floating-booking-search-bar.md`, section 11: ten foundation files. Approving and freezing Phase 01 would bring them under the freeze policy too, which removes the current asymmetry of a frozen section resting on unfrozen files.

One consequence to accept knowingly: section 02.2 will need to extend `domain/availability.ts` (see its specification). After a Phase 01 freeze that becomes a documented, reviewed change rather than a free edit.

## 3. Findings

None blocks approval. F1 and F2 should be fixed before the first deployment of any kind.

| # | Finding | Severity | Proposed action |
|---|---|---|---|
| F1 | **Indexing is decided at build time, not at run time.** Tested: a build made with production, indexable settings and then started as a preview sends no `X-Robots-Tag` header and serves an allowing `robots.txt`. The opposite case is safe: a non-indexable build stays non-indexable whatever the runtime settings. | Medium. Harmless where every environment is built separately (as on Vercel); unsafe where one build is promoted between environments | Either record "one build per environment" as a hosting requirement, or make `robots.txt` and the header evaluate at request time. The second is a small change to two files and removes the condition |
| F2 | **`SITE_URL` silently defaults to `http://localhost:3000`.** In the same test the production sitemap URL was `http://localhost:3000/sitemap.xml`. | Medium for launch, none today | Fail at start-up when the deployment is production and `SITE_URL` is unset |
| F3 | **Development preview pages are served by production builds** (`/dev/booking-search` returns 200). They are `noindex` and excluded in `robots.txt`, but reachable. | Low | Return "not found" for `/dev/*` in production. This touches section 02.1's preview route, so it needs approval under the freeze policy |
| F4 | **`routes.mockEngine` points at a page that does not exist** (`/dev/mock-booking-engine`). Only the mock hand-off scenarios use it. | Low | Build the stand-in page in section 02.3, where hand-off is implemented, or remove the route until then |
| F5 | **CI has never executed.** | Low, but unverified | Runs on the first push once a remote exists |
| F6 | **`PHASE-01-HANDOFF.md` is a point-in-time document and is now partly out of date**: 87 tests (now 96 in the foundation), a file tree without later additions, and a Phase 02 plan superseded by the roadmap. | Low | Add a one-line note at its top pointing to this report and the roadmap. Do not rewrite history |
| F7 | **README's "Where things are" omits `src/features/`.** | Trivial | Add one line |

## 4. Dangling documentation links

Checked every Markdown link in `README.md` and `docs/`: **none is broken in the working tree.**

The two dangling links reported with the commits were resolved by the later commits: the placeholder home page's link to the booking preview (arrived in `1b75a6f`) and README's links to the roadmap and review log (arrived in `cd2cce4`).

What still dangles **at the committed state**, in a fresh clone:

| Reference | Where | Why | Minimal action |
|---|---|---|---|
| `sections/03.1-header-navigation-spec.md` and `/dev/header` | `ROADMAP.md`, `REVIEW_LOG.md` | The section 03.1 preparation files are intentionally uncommitted | Commit the specification document alone (it is a document, not an implementation), or leave as is until 03.1 is authorised. Recommended: commit the specification with this report and the 02.2 specification in one documentation commit |
| `/dev/mock-booking-engine` | `config/routes.ts` | Finding F4 | As F4 |

## 5. Known technical limitations carried forward

- Offer, rate and hand-off shapes are proposals until ezCloud or GoHost is documented.
- No real property content has passed through the schema.
- Colours, typeface and wording are provisional.
- Public URL words (`/stays/...`) and slug language are undecided and must be settled before launch.
- A second language requires moving public routes under a locale segment.
- One site timezone (`Asia/Ho_Chi_Minh`) is assumed for searches across properties.
- No security headers (content security policy and similar) are set yet; planned for Phase 07.
- Hosting is undecided.

## 6. Recommendation

Approve Phase 01. The acceptance criteria are met, the evidence above supports them, and none of the findings is a reason to withhold approval.

Suggested conditions, for the owner to accept or change:

1. Fix F1 and F2 before the first deployment. Both are small and neither affects section 02.1's behaviour.
2. Treat F3 and F4 as scheduled work (02.3 and release preparation), not as conditions.
3. If Phase 01 is frozen, the ten shared files come under the freeze policy; the availability contract changes proposed for section 02.2 are reviewed under it.
