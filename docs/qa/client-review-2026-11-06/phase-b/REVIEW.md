# Phase B — Brand Collection visual refinement (client review 6/11/2026)

Status: **built 7/11/2026; the owner prefers the new preview direction; final polish built 7/11, awaiting the owner's visual
review** (see "Final polish, 7/11/2026" at the end). Phase C has not started. Nothing committed, staged,
stashed or deployed. Review on the local dev server: http://localhost:3401/dev/demo?intro=0 (English: `&lang=en`).

Phase A was accepted for progression on 7/11; its remaining FAQ/Contact spacing refinements are deferred and untouched here.

## What changed

| # | Request | Result |
|---|---------|--------|
| 1 | Order Bare → Pepper House → The Nắng | Applied in the brand section through one list, `BRAND_ORDER` in `brand-showcase.ts`. Brand ids, property ids, room data, routes and provider mappings are unchanged; the shared brand data keeps workbook order, and the Discovery filters keep theirs until Phase C. |
| 2 | Left navigation | Each brand is a row: one small copper indicator, the official logo, the canonical name and its cities. The copper thread, its nodes' connector, the borders and the white selected block are gone. The row in front gets a faint olive tint (4.5%); the others step back (logos at 50%, names in the soft text colour, still WCAG AA). The column holds three rows of equal height. From 1024 to 1279 px the logo column narrows, so names stay on one line. |
| 3 | Hover and selection | **At first nothing is selected.** On desktop, the stage beside the rows shows the three brand photographs as bands, each aligned with its row. **Hover** (mouse, after 90 ms): the row is emphasised, the other two step back, and a preview fades in over the stage with a slight settle in scale (0.985 → 1, 240–320 ms). The preview shows the brand's photograph and a small card with its logo and the client's Brand Hover line. **Click** locks the brand and shows its full panel; switching is a 320 ms cross-fade. The stage keeps one height in every state (all three panels share one grid cell), so nothing on the page moves. **Keyboard:** focus previews like hover; Enter or Space locks; arrow keys, Home and End move between brands; Escape closes the preview; Tab continues into the selected panel. The hidden panels are `inert`. **Phones and tablets:** a strip of three brands; one tap opens the panel under it, with no hover and no double tap. When the panel would start low on the screen, the page scrolls so the strip sits just under the header with the panel beneath it, so changing brand is always one tap away. **Reduced motion:** no fades, scale or slide. |
| 4 | Detail panel | The large heading with the brand name is gone. The logo is now the panel's heading, drawn larger (desktop 3.75–4.5 rem; the name is its alt text), beside the client's Brand Positioning, then Brand About (darker text than before, AA). Cities and stays sit in two columns with a divider; on phones narrower than 480 px they stack. The panel aligns with the rows at the top and the bottom. The heading stands alone above the composition, with "Xem tất cả nơi ở →" on its baseline. If a brand's copy is shorter, its photograph takes the spare height, so no panel shows a gap. |
| 5 | CTA | "Khám phá nơi ở" and the Facebook button are removed. There is one "Visit us ↗" per brand, driven by `BRAND_WEBSITES` in `brand-showcase.ts`. **No official brand website is confirmed**, so for now it is drawn but is not a link: no `href`, `aria-disabled`, dimmed, and the tooltip and screen-reader text say the address is awaited. It never falls back to Facebook, VNest or a guessed domain. Entering a confirmed URL (with its source and date) turns it into a live link that opens in a new tab. The client's Facebook Pages stay recorded in the same file as brand data. |
| 6 | Content | Brand Hover, Positioning and About are the 05.11 Final text, verbatim, in Vietnamese and English (`brand-copy.ts` unchanged apart from the section's own UI labels). Canonical names: VNest, Bare Boutique Stays, Pepper House, The Nắng Suites. |
| 7 | Code | `BrandShowcase.tsx` (new, about 350 lines) holds the section. It has one state for every screen size: `selected` and `preview`. There is no position measuring and no layout-dependent markup, so hydration is safe. Its styles are in `BrandShowcase.module.css`, and its configuration is in `brand-showcase.ts`. `HomeCollection.tsx` keeps only the stay collection and lost about 300 lines; the old brand CSS left `HomeCollection.module.css`. There are no new dependencies. |

## Client dependency: official brand websites

| Brand | Website | Status |
|-------|---------|--------|
| Bare Boutique Stays | — | **missing**: needs VNest to confirm the official URL |
| Pepper House | — | **missing**: needs VNest to confirm the official URL |
| The Nắng Suites | — | **missing**: needs VNest to confirm the official URL |

Only the three Facebook Pages exist in the project and the client documents. Once the URLs arrive, they go in
`src/features/demo/brand-showcase.ts` → `BRAND_WEBSITES`, with source and date. No other change is needed.

## Evidence

- `before/`: the section as it was (1440, 1024, 768, 430, 390, 375; hover at 1440 and 1024). Script: `../scripts/shots-b-before.mjs`.
- `after/` (script: `../scripts/shots-b-after.mjs`):
  - `1-neutral-*`: the neutral state at all six widths.
  - `2-bare-*`, `3-pepper-house-*`, `4-the-nang-*`: hover and selected at 1440 and 1024.
  - `5-mobile-*`: tap selection at 375, 390, 430 and 768, plus `5-mobile-after-tap-viewport-*`, what the screen shows right after a tap.
  - `en-*`: English.
  - `6-homepage-full-*`: the full homepage at 1440 and 390.

### QA

`../scripts/qa-b.mjs`: **536/536** (`qa-b-results.txt`). It runs at 1440, 1024, 768, 430, 390 and 375 px in Vietnamese and English, and checks:
- **Order and names:** brand order and canonical names.
- **Neutral state:** nothing selected; on desktop, bands aligned with the rows; on phones, the strip and hint with no empty stage.
- **Navigation styling:** no lines, borders or white block; logo proportions.
- **Layout:** heading above the composition; rows and stage aligned top and bottom; equal row heights.
- **Hover (desktop):** preview with the right Brand Hover line, measured mid-fade (opacity between 0 and 1, scale not yet 1); emphasis and subdued rows; stage size unchanged.
- **Selection:** one panel at a time; the logo is the heading, no repeated name; Positioning and About present and readable; English copy on the English page; cities | stays layout; one "Visit us" that is not a link; selected-row tint (not white); stage size and page position unchanged on desktop; strip and panel on screen after a tap on phones; no overflow or clipped text.
- **Keyboard:** focus preview, ArrowDown, Enter, Space, Escape, Tab into the panel.
- **Reduced motion:** desktop and phone.
- **Errors:** no console or hydration errors.

| Suite | Result |
|-------|--------|
| lint | 0 errors (the 3 old warnings) |
| typecheck | pass |
| unit | 426/426 |
| e2e homepage-content | 11/11 |
| e2e about-vnest / occupancy | 16/16 · 8/8 |
| e2e hybrid-booking | 75/79: the same 4 as before Phase B (3 need the simulation server, 1 Pepper House @375 dev-server network-idle timeout) |
| e2e mobile-interactions | 14/16: the same 2 fixed-date (6–8/11/2026) scroll-lock tests as in Phase A; a scratch copy with 20–22/11 passes 16/16 (deleted after the run) |

### Test expectations changed (owner-requested behaviour)

- `src/features/demo/mobile-interactions.test.ts` (test 4):
  - Now reads `BrandShowcase.tsx` instead of `HomeCollection.tsx`.
  - Expects no Facebook button.
  - Expects "Visit us" to use `BRAND_WEBSITES`, with `target="_blank"` and `rel="noopener noreferrer"`.
  - Checks that any confirmed website has a source and date and is not Facebook or VNest.
  - Checks the display order.
  - Checks that the Facebook Pages remain recorded.
  - The mobile scroll check now names the new scroll (the strip and panel together); the condition is unchanged.
- `test/e2e/homepage-content.test.mjs`:
  - Brand rows are buttons with `aria-controls` instead of tabs.
  - Nothing is selected at first.
  - The client copy is matched by brand, since the display order differs from the document's.
  - The preview is `[data-preview][data-shown]`.
  - The copy assertions are unchanged.
- `test/e2e/mobile-interactions.test.mjs`:
  - The Facebook and "Khám phá nơi ở" assertions became "one Visit us, not a link without a website, no Facebook".
  - The scroll to `#kham-pha` goes through the section's "Xem tất cả nơi ở" link.

## Files

- **New:** `src/features/demo/BrandShowcase.tsx`, `BrandShowcase.module.css` and `brand-showcase.ts`.
- **Changed:**
  - `HomeCollection.tsx`: the brand index was removed; it renders `BrandShowcase`.
  - `HomeCollection.module.css`: the brand index styles were removed.
  - `brand-copy.ts`: the section's UI labels. Removed "Khám phá nơi ở" and Facebook; added the hint and the "Visit us" texts.
  - The three tests above.
- **QA scripts:** `qa-b.mjs`, `shots-b-before.mjs`, `shots-b-after.mjs`.
- **Not touched:** Hero, Booking, About VNest, Services, FAQ, Contact, and Discovery/Coming Soon (Phase C).

## For the owner

1. Accept Phase B visually, or give corrections.
2. **Needed:** the official website of Bare Boutique Stays, Pepper House and The Nắng Suites, for "Visit us ↗".
3. Optional: "Visit us" is the same English wording on the Vietnamese page, as written in the brief. Keep it, or use a Vietnamese label?

## Final polish, 7/11/2026 (owner)

The owner prefers the new interactive preview over the original and asked for three corrections plus a light polish. The
interaction is unchanged: neutral start, order, hover, subdued rows, preview, click lock, panel, logo, columns and "Visit us ↗".
Evidence is in `polish/` (same set as `after/`, plus `7-discovery-toolbar-{1440,390}.png`).

| # | Request | Result |
|---|---------|--------|
| 1 | Remove "Đang hiển thị tất cả nơi ở" | Gone. The Discovery section is not translated, so there is no English equivalent. The polite live region stays empty and still announces filter results (e.g. after choosing a brand). Filtering logic is unchanged (`HomeCollection.tsx`, one line). |
| 2 | "Xem tất cả nơi ở →" without underline | No underline under the text or the arrow; the same words, arrow and `#kham-pha` scroll. Hover turns it copper (#8F6036) and nudges the arrow 3 px; keyboard focus keeps its 2 px outline. |
| 3 | Property names without underline | Bare Chic, Bare Hyphen, Bare Đa Kao, Bare Hàn, Pepper House and The Nắng Suites read as plain names in their column. Hover turns them copper (#8F6036, AA on white); keyboard focus keeps its outline. Same links and destinations. |
| 5 | Preview polish | Small changes only: a soft, low shadow under the card (lifts it off bright photographs); a little more padding (1.5/1.75 rem) and inset (1.75 rem); more room under the logo, tighter line spacing. No new text, decoration or motion. |

QA:
- `qa-b2.mjs`: **136/136** (`polish/qa-b2-results.txt`), at 1440, 1024, 768, 390 and 375 px in Vietnamese and English. It checks:
  - **Status text:** gone; the live region is kept.
  - **"Xem tất cả nơi ở →":** no underline (text and arrow), the same words and target, copper on hover, focus outline, the scroll still works.
  - **Property names:** no underline in each brand panel, copper on hover, focus outline, and "Bare Hyphen" opens its page.
  - **Preview:** stays inside the stage, clear of the rows and heading, pointer-transparent, with its shadow.
  - **Layout shift:** CLS without input under 0.02.
  - **Overflow and errors:** no overflow; no console or hydration errors.
- `qa-b.mjs` re-run: **536/536** (`polish/qa-b-results.txt`).

| Suite | Result |
|-------|--------|
| lint | 0 errors (the 3 old warnings) |
| typecheck | pass |
| unit | 426/426 |
| e2e homepage-content / about-vnest / occupancy | 11/11 · 16/16 · 8/8 |
| e2e hybrid-booking | 75/79, the same 4 as before Phase B |
| e2e mobile-interactions | 14/16, the same 2 fixed-date tests; the 20–22/11 scratch copy passes 16/16 |

Files: `BrandShowcase.module.css` (link styles, preview card), `HomeCollection.tsx` (status line), `../scripts/qa-b2.mjs`.
No test expectations changed in this round.
