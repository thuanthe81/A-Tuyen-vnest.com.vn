# VNest City Notes: standalone prototype (CS-7), implementation report

Date: 20/10/2026. Status: **built for the owner's visual review. Not integrated into Bare Chic, not approved for production, not frozen, not committed.**

Owner's decision the same day: CS-1 to CS-7 approved as design and implementation direction, with two refinements (mobile density; address handling). Spec: [`../../sections/city-notes-spec.md`](../../sections/city-notes-spec.md).

## Review

Run `npm run build`, then start the launch configuration `vnest-v2-client-preview` (`next start`, port 3400, `DEPLOY_ENV=development`).

| What | URL |
|---|---|
| TP. Hồ Chí Minh, private preview (review flags and "Chờ VNest" notes) | <http://localhost:3400/dev/city-notes> |
| Đà Nẵng (D30, D33 are here) | <http://localhost:3400/dev/city-notes?city=da-nang> |
| As a public build would show it (no flags, no notes) | add `&audience=public` |
| Refinement 1 comparison: three places on phones | add `&mobile=3` |

The bar at the top switches between these. The module sits where CS-2 places it, after Vị trí; the unchanged sections around it are drawn as ghosts.

## What was built

| File | What |
|---|---|
| `src/content/vnest-workbook/city-notes.ts` | The city-level reader. One `CityNote` per block of the destination sheet; every name, location and address `Sourced` with its cell, status, rule and question. `SOURCE_FLAGS` records each known defect with the exact text it was found in |
| `src/content/vnest-workbook/city-notes.test.ts` | 18 tests: all 30 places pinned to cell, category, name and location; raw text and cells; rules L1–L5; D30, D33, C13; stale-flag refusal; first-view selection; city derivation; three gates on synthetic sheets; nothing invented |
| `src/features/city-notes/view.ts` + `view.test.ts` | Display strings, audience gate (5 tests) |
| `src/features/city-notes/CityNotes.tsx` + `.module.css` | The module: tabs, panels, inline expand and collapse, no-script fallback |
| `src/app/dev/city-notes/` | The isolated route: `noindex`, 404 unless `DEPLOY_ENV=development` is declared (the Bare Chic rule, `review-access.ts`) |
| `docs/qa/city-notes/scripts/qa.mjs`, `regress.mjs` | The measurements below |

Nothing else changed. No existing source file was edited; every code addition is a new file. Existing documents edited: `docs/ROADMAP.md` and `docs/REVIEW_LOG.md` (one entry each), and the spec's status and rule table (L5).

## Refinement 2: address handling

Nothing is silently changed. Every value keeps its raw cell text (`raw`) and cell.

| Cell | Source text | Shown | Rule | Private preview |
|---|---|---|---|---|
| D33 (Tan coffee) | "!0 Nguyễn Thiện Thuật, Bình Hiên, Hải Châu, Đà Nẵng" | "Bình Hiên, Hải Châu" | L4: the street number is not a valid value, so only the area is shown | "Chờ VNest · D33: Số nhà “!0” không hợp lệ (có thể là “10”) (Q32)" |
| D30 (Chợ Hàn) | "119 Trần phú, Hải Châu, Đà Nẵng" | "119 Trần phú, Hải Châu", **exactly as written** | L5: kept, not corrected and not discarded; flagged | "Chờ VNest · D30: Viết hoa “Trần phú” (D28 viết “Trần Phú”) (Q32)" |
| C13 (name) | "Bánh mì Huynh Hoa" | as written | L5 | flagged for spelling (Q32) |

The review-safe presentation for D30: the street stays, as the source has it, and the private preview marks it with a dashed "Chờ VNest" tag under the location (`390-dn-explore-expanded-private.png`). A public build shows the same text with no tag (`…-public.png`). If you prefer the public build to hold D30 back until VNest confirms, that is a one-line change in `SOURCE_FLAGS`; I did not make it, because you asked not to discard the street.

Each flag is pinned to its source text: if VNest edits D30, D33 or C13, the reader stops with an error instead of applying an old treatment (tested).

## Refinement 1: mobile density

The vertical spacing was tightened against the 20/10 board, with type sizes and targets unchanged: the line under the heading is 14 px on phones, the tabs start closer to it, the rows have less padding, and the footer is closer.

| Public view, TP. Hồ Chí Minh, 390 px | Section height | Share of an 844 px screen |
|---|---|---|
| Board, 20/10 (four places) | 630 px | 75% |
| **Prototype, four places (default)** | **580 px** | **69%** |
| Prototype, three places (`?mobile=3`) | 490 px | 58% |

Three places save 90 px, about one row. **Recommendation: keep four.** The section now fits well inside one screen with the button visible; the fourth row costs one thumb movement; and keeping four matches desktop and the approved CS-3. Three is available for comparison (`390-hcm-first-mobile3.png`). Neither changes the 48 px tabs, the 44 px button or the 16 px names. 768 and 1440 always show four (the variant applies only under 768 px).

The private preview is taller (825 px at 390) because of the "Chờ VNest" notes box, which public builds never show.

## Measurements (`results.json`)

Against `next start` with the client-preview configuration, headless Chrome, 390 (2×, touch), 768 (2×, touch) and 1440 (1×, mouse).

| Check | 390 | 768 | 1440 |
|---|---|---|---|
| Horizontal overflow | none | none | none |
| Collapsed / expanded section, private, HCM | 825 / 1105 px | 617 / 801 px | 501 / 636 px |
| Collapsed, public, HCM | 580 px | 435 px | 319 px |
| Layout: places per row | 1 | 2 | 4 |
| Targets under 44 px | 0 | 0 | 0 |
| Hydrated (controls working) | yes | yes | yes |
| Console errors or warnings | 0 | 0 | 0 |
| CLS during load (no input) | 0 | 0 | 0 |
| CLS after expand, switch and collapse, excluding shifts after input | 0 | 0 | 0 |
| Tap / click on Khám phá switches the panel | yes | yes | yes |
| Expanded stays expanded across tabs (7 Ăn & uống after switching) | yes | yes | yes |
| After "Thu gọn", the button is still in view | yes | yes | yes |
| Public build: flags, notes, `data-source` | none | none | none |
| Without script: places shown, tabs, button, headings | 15, hidden, hidden, both | same | same |

Expanding and collapsing do move content (shift score 0.09 to 0.31 at the widths measured), but only directly after the guest's own tap or click. CLS excludes those by definition (`hadRecentInput`), and they are the intended result of the action.

**Hydration.** The server renders exactly the first state a guest with script sees (Ăn & uống, collapsed). Hydration therefore changes nothing on screen, which the load CLS of 0 confirms.

**Keyboard** (WAI-ARIA tabs, the same at all three widths). From the selected tab, the arrow keys, Home and End move between tabs, and the panel follows with focus on the tab: ArrowRight → Khám phá (Bán đảo Sơn Trà first); ArrowRight wraps → Ăn & uống; ArrowLeft → Khám phá; End → Khám phá; Home → Ăn & uống. Tab moves to the panel, then to "Xem tất cả 8 địa điểm tham quan". Enter expands to 8 places and Enter again collapses to 4. Focus ring: `1440-keyboard-focus.png`.

**No script.** Both lists show in full under their own headings, and the tabs and button are hidden (`390-no-script.png`). One finding: the global base layer hides `[hidden]` with `!important` inside a cascade layer, and no unlayered rule can override that. So inactive panels and collapsed places are hidden by data attributes, which keeps them out of the accessibility tree all the same.

## No existing page changed (`regression/`)

Full-page captures with images hidden (photographs decode differently between runs) and reduced motion, at 390, 768 and 1440. Routes: `/dev/stays/bare-chic`, the same page with `?price=public`, `/dev/stays/bare-chic-20-10`, `/dev/brand-collection/b-client` and `/dev/brand-collection/b`.

1. Two captures of the same build: 15 of 15 identical, so the method is deterministic.
2. A build **without** the City Notes files (moved out, rebuilt, captured, restored, rebuilt) against the build **with** them: **15 of 15 identical, 0 differing pixels** (`compare-without-city-notes-with-city-notes.json`). Without the files, `/dev/city-notes` answered 404, which confirms the "without" build really lacked them.

**Access.** On a plain `next start` with nothing declared (`vnest-v2-prod`, port 3300), `/dev/city-notes` and `/dev/stays/bare-chic` both answer 404.

**Checks.** `npm run check`: lint has 0 errors and 3 warnings, all in older QA scripts (`brand-collection/scripts/lib.mjs`, `living-frames/media-test/scripts/lib.mjs`, `interact.mjs`), not in this work. Typecheck is clean. **284 of 284 tests pass**, 23 of them new.

## Screenshots

| File | Shows |
|---|---|
| `390-hcm-first.png`, `768-hcm-first.png`, `1440-hcm-first.png` | First state, private preview |
| `390-hcm-first-public.png` / `390-hcm-first-mobile3.png` | Four vs three on phones, public |
| `*-hcm-explore-expanded.png` | Khám phá expanded (taller than one screen at 390) |
| `*-dn-explore-expanded-private.png` | Đà Nẵng with the D30 flag |
| `390-dn-explore-expanded-public.png`, `1440-dn-explore-expanded-public.png` | The same, public |
| `1440-keyboard-focus.png` | The focus ring on the expand button |
| `390-no-script.png` | Without script |

## Not done, on purpose

- No integration into Bare Chic or any property page, and no link to `/dev/city-notes`.
- Nothing changed in 02.1, booking, the PMS, `main` or production routes.
- No commit, push, merge, deployment or freeze.
- Not tested: real devices and a screen reader (VoiceOver, TalkBack). The ARIA roles, names and states are checked in the DOM only.
