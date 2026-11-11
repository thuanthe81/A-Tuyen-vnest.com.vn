# Phase D — final fixes (10/11/2026): loading intro, English prefetch, search in brand-card links

Status: **built, awaiting Phase D final acceptance. Not frozen.**
- No redesign and no backend refactor.
- Nothing staged, committed, pushed or deployed. The 21 staged files and `stash@{0}` are untouched.
- Unchanged: Brand Collection, Discovery / Coming Soon, both Partner concepts, FAQ, Contact, the 05.11 client content,
  the GoHost / ezCloud boundaries, and the provisional child and occupancy rules.

All browser checks ran on a **production build** (`next build`, then `next start` on 3403) with the private simulation
server on 3404.

## 1. Loading intro replays on every full load

**Root cause.** `NestReveal` stored a "seen" flag in `sessionStorage` (`vnest:v3:nest-reveal-seen`). After the first play
in a browser tab, every refresh skipped the intro. Also, the server rendered no overlay on a normal visit, so the homepage
could show for a moment before the intro appeared.

**Fix** (`nest-reveal-state.ts`, `NestReveal.tsx`):
- **Once per document.** The flag now lives in module memory, so it lasts for one page load. Any full load (first visit,
  refresh, hard reload) starts a new document and plays the intro. Inside one document it never plays twice, so
  re-renders, client-side navigation, Back / Forward and the VI / EN switch don't replay it.
- **Only on a real load.** It plays only when the homepage is the page the document was loaded on (the browser's
  navigation-timing entry). Reaching the homepage by a link from another page doesn't start it.
- **No flash.** The server renders the overlay on every load except `?intro=0`. Its existing CSS ends it at about
  1.2 s, even before JavaScript runs. When the browser decides to skip (a client-side arrival), it does so before paint.
- **Overrides unchanged.** `?intro=0` skips, `?intro=draw` / `converge` force a play, and reduced motion gets the short
  static version.
- **Animation unchanged.** No new script tag, spinner or progress bar. Logo, colours, geometry and timing are the
  approved ones.

| Case | Before | After (production, measured) |
| --- | --- | --- |
| First visit | plays | plays: overlay on screen from about 20–45 ms to about 1.1 s, every width |
| Refresh (Cmd+R) | skipped for the rest of the tab session | **replays** |
| Hard reload (cache disabled) | skipped | **replays** |
| Link to the homepage, Back / Forward, VI → EN | skipped | skipped, same document, 0 overlay frames |
| Homepage reached by a link from another page | played if not yet seen | skipped (not a load) |
| `?intro=0` | skipped | skipped, no overlay in the server HTML |
| `?intro=converge` | plays | plays |
| Reduced motion | short static | short static (≤ 0.6 s), also on refresh |

Evidence in `screens/final/`:
- `intro-1440-first-visit-{150,450,850,1500}ms.png`
- `intro-1440-after-reload-450ms.png`, the intro replaying after a reload

## 2. English production preview: prefetch redirects

**Root cause.** On `/dev/*`, the proxy redirects a page opened without `lang` to `lang=en` when English is remembered in
a cookie. By design, most links carry no `lang`. On a production build, Next prefetches every visible link in the
background, and each prefetch went through:
1. the proxy's 307 (which drops Next's `_rsc` marker);
2. Next's own 307 to restore that marker;
3. a data response that Next drops unread for a redirected prefetch.

That last request never ends, so the English page never reached network idle and 8 English tests timed out. Real
navigation was not affected: a click is redirected and stays a soft navigation.

**Fix** (`src/proxy.ts`): Next's documented `config.matcher` with `missing: next-router-prefetch`, so background
prefetches skip the proxy.
- Real navigations and full loads still run it unchanged (language redirect, cookie, locale header, noindex header).
- A prefetch isn't a page view, so it needs neither the redirect nor the noindex header. The build-time noindex in
  `next.config.ts` still applies.
- The proxy can't test this header itself, because Next strips the prefetch headers from `request.headers` (proxy docs,
  "RSC requests and rewrites"). That's why the check is in the matcher.
- Prefetch, caching and timeouts are otherwise unchanged.

| | Before | After |
| --- | --- | --- |
| `/dev/demo?intro=0&lang=en` network idle | never (one request left open) | ~0.7 s |
| Prefetch of `/dev/demo` from an English page | 307 → 307 → open stream | 200, completes |
| English card → property, logo → homepage | `lang=en`, soft | `lang=en`, soft, English copy |
| Vietnamese navigation | no `lang` | no `lang` |
| Requests 6 s after idle | — | ≤ 2 (no runaway prefetch) |

## 3. Brand-card links after Back

**Root cause.** The cards' links are built by the server from the homepage address. After Back, Next shows its cached
homepage, rendered before the search was written into the address, so the links carried no dates until a refresh. Even
after a refresh they carried only dates and adults, never `children` or chosen `rooms`.

**Fix:**
- `page.tsx` builds every card link with the whole search: dates, adults, `children`, and `rooms` only when the guest
  chose them (`demoPropertyUrl(…, party)`).
- `HomepageStaySearch` compares the address with the one the server rendered (`homeStayKey`). If they differ (only
  after Back), it calls `router.refresh()` once: no navigation, no history entry, the bar keeps its state.
- The address stays the only source of truth.
- Removed the provider's `key`, which would otherwise restart the page on that refresh.

## 4. Compact header

Unchanged from the refinement: "3 lớn · 1 trẻ" where space is short, and the full reading in the panel, the accessible
name and the hover title.

**Measured on phone sizes:**

| Phone width | 360 | 390 | 412 | 430 |
| --- | --- | --- | --- | --- |
| Second line of the compact pill | 101 px | 130 px | 151 px | 168 px |

The frozen date wording alone ("28 thg 11 – 2 thg 12") needs 120 px, so the guest part never shows in the compact phone
pill: it ends in "…" after the dates. At 360 the dates are cut too. This is unchanged from before. The hero pill and the
search sheet show everything.

Showing guests there would need one of these, both outside this brief:
- a shorter date format in that pill ("28/11–2/12 · 3 lớn, 1 trẻ" is 147 px, fits from 412 px wide);
- the guests on the first line in place of the property name.

That's an owner decision.

## 5. Results

| Check | Result |
| --- | --- |
| Lint | 0 errors (3 old warnings in earlier QA scripts) |
| Typecheck | clean |
| Unit tests | **454/454** |
| Production build (`next build`) | passes |
| Final fixes `qa-final.mjs` (production, 390 / 768 / 1024 / 1440) | **141/141**: intro 59, English and Vietnamese 22, booking 60 |

Browser suites on the production build. Output: `e2e-final/`.

| Suite | Result |
| --- | --- |
| occupancy | 10/10 |
| room-selection | 22/22 |
| hybrid-booking (simulation server 3404) | 79/79 |
| mobile-interactions | 16/16 |
| about-vnest (English included) | **16/16** (was 12/16) |
| homepage-content (English included) | **11/11** (was 7/11) |
| Refinement `qa-refine.mjs` | 121/121 |
| Phase D journey `qa-d.mjs` | 120/120 |

**Booking state:**
- Search → Results → Back → card → property keeps the dates, adults, children and chosen rooms; refresh keeps them too.
- The search adds one history entry; the refresh after Back adds none.
- GoHost is still not asked with children, and all four ezCloud hand-offs are unchanged.
- No console or hydration errors at any width.

No test timeout was raised. "Network idle" stays a valid condition now that no request is left open.

## 6. Files modified in these fixes

- `src/features/demo/nest-reveal-state.ts`: per-document play, document-entry check, server phase.
- `src/features/demo/NestReveal.tsx`: uses them; no browser storage.
- `src/features/demo/nest-reveal.test.ts`: rules rewritten for per-document play.
- `src/proxy.ts`: `config.matcher` that skips Next's prefetch requests.
- `src/app/dev/demo/page.tsx`: card links with the whole search; `renderedStay`; no provider `key`.
- `src/features/demo/HomepageStaySearch.tsx`: one `router.refresh()` when the cached render is for another address.
- `src/features/demo/booking-flow.ts`: `homeStayKey`, `demoPropertyUrl(…, party)`.
- `src/features/demo/guest-party-flow.test.ts`: card-link and stay-key tests.
- Docs: `docs/handoff/BACKEND-HANDOFF.md` §2 (homepage refresh after Back, proxy and prefetch). Status lines in
  `REVIEW.md` and `REFINEMENT.md`.
- QA: `scripts/qa-final.mjs`, `qa-final-output.txt`, `screens/final/`, `e2e-final/`.
