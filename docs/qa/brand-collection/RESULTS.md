# Brand Collection exploration: QA results

15/10/2026. Routes `/dev/brand-collection/a` and `/dev/brand-collection/b` on the local dev server (`npm run dev`, port 3200). Headless Chrome 155 driven over the DevTools protocol by the scripts in [`scripts/`](scripts/). Every number below comes from those scripts; raw output is in `measurements.json`, `interactions.json` and `contrast.json`.

Not tested: real phones, Safari, Firefox, screen readers (VoiceOver, TalkBack), a production build, slow networks. The pictures are small drawn SVGs, so nothing here says anything about load time with real photography.

## Re-run

```bash
node docs/qa/brand-collection/scripts/shots.mjs      # screenshots + measurements.json
node docs/qa/brand-collection/scripts/interact.mjs   # keyboard, combined filters, address, areas, reduced motion
node docs/qa/brand-collection/scripts/record.mjs     # recordings (.webp and .gif)
node docs/qa/brand-collection/scripts/contrast.mjs   # contrast.json
node docs/qa/brand-collection/scripts/thread.mjs     # thread.json (concept A's copper thread)
node --import ./test/register.mjs --test src/app/dev/brand-collection/filter.test.ts
```

## Files

| What | Concept A | Concept B |
|---|---|---|
| 390 px, all brands / Bare | `a-390-all.png`, `a-390-bare.png` | `b-390-all.png`, `b-390-bare.png` |
| 768 px, all brands / Bare | `a-768-all.png`, `a-768-bare.png` | `b-768-all.png`, `b-768-bare.png` |
| 1440 px, all brands / Bare | `a-1440-all.png`, `a-1440-bare.png` | `b-1440-all.png`, `b-1440-bare.png` |
| Full pages | `a-*-full.jpg` | `b-*-full.jpg` |
| Bare + Đà Nẵng (390) | `a-390-bare-da-nang.png` | `b-390-bare-da-nang.png` |
| Conflict note (Đà Nẵng, then Pepper House) | `a-390-conflict-note.png` | `b-390-conflict-note.png` |
| Sample areas (`?areas=sample`, Khu vực mẫu 2) | `a-390-sample-area.png` | `b-390-sample-area.png` |
| Keyboard focus (1440) | `a-1440-keyboard-focus.png` | `b-1440-keyboard-focus.png` |
| Recording, pointer (≈9 s) | `a-390-recording.webp`, `a-1440-recording.webp` | `b-390-recording.webp`, `b-1440-recording.webp` |
| Recording, keyboard only | (see interactions.json) | `b-1440-keyboard.webp` |

Every recording follows the same steps: choose Bare, then Đà Nẵng, then The Nắng Suites, then Pepper House (not in Đà Nẵng, so the city filter is dropped with a note), then "Bỏ lọc". GIF copies sit beside each WebP.

**Concept B, refinement 1 (owner's choice, same day):** all `b-*` captures and recordings now show the refined B. The first version's captures are in [`b-original/`](b-original/), and it runs at `/dev/brand-collection/b-original`. Results for the refinement are at the end of this file.

**Concept A, refinement 1 (same day, before the owner switched to B):** concept A now carries B's copper thread as its chosen-state detail. All `a-*` captures and recordings in this folder show the threaded version. The captures of A as first reviewed are in [`a-original/`](a-original/), and that version runs at `/dev/brand-collection/a-original`. The thread's own checks are at the end of this file.

## Content and filtering

| Check | A | B |
|---|---|---|
| Default shows all six properties | 6 ✔ | 6 ✔ |
| Bare shows exactly four (Bare Chic, Bare Hyphen, Bare Đa Kao, Bare Hàn) | 4 ✔ | 4 ✔ |
| Bare + Đà Nẵng | Bare Hàn ✔ | Bare Hàn ✔ |
| Đà Nẵng, then Pepper House | city dropped, note shown, Pepper House ✔ | same ✔ |
| "Bỏ lọc" returns to six | ✔ | ✔ |
| Address kept in sync (`?brand=bare&city=da-nang`), restored from a shared link | ✔ | ✔ |
| Contradictory link (`?brand=pepper-house&city=da-nang&area=nowhere`) | brand dropped, 2 places in Đà Nẵng ✔ | same ✔ |
| Area, default | select disabled, "Chờ xác minh", described as unverified ✔ | same ✔ |
| Area, `?areas=sample`, "Khu vực mẫu 2" | city set to TP.HCM; Bare Hyphen, Pepper House ✔ | same ✔ |
| Unit tests for the shared logic (`filter.test.ts`) | 11 of 11 pass | (same code) |

Both concepts use the same filter code, so these results cannot differ by construction; they are run against both to prove the wiring.

## Layout

"Section" is the heading, the brand composition and the city/area filters. "To first card" is the distance from the section's top to the top of the first property picture. "Visible" is how much of that picture shows when the section's top reaches the top of the screen.

| | Section A | To first card A | Visible A | Section B | To first card B | Visible B |
|---|---|---|---|---|---|---|
| 390×844, all | 586 | 667 | 177 | 568 | 649 | 195 |
| 390×844, Bare | 586 | 667 | 177 | 677 | 758 | 86 |
| 768×1024, all | 677 | 758 | 266 | 645 | 726 | 298 |
| 768×1024, Bare | 677 | 758 | 266 | 603 | 684 | 340 |
| 1440×900, all | 529 | 610 | 290 | 550 | 631 | 269 |
| 1440×900, Bare | 529 | 610 | 290 | 550 | 631 | 269 |

- Horizontal overflow: 0 px in all twelve views.
- A's height is identical whatever is chosen, so filtering never moves the list. B's stage changes height with the chosen brand on phones (+109 px for Bare) and on tablets (−42 px), so the list below moves when a brand is chosen. The shift follows the guest's own tap, so it does not count towards Cumulative Layout Shift, but it is visible.
- At every width, part of the first property picture is in view as soon as the section reaches the top of the screen.

## Accessibility

| Check | A | B |
|---|---|---|
| Controls under 44×44 px (section, filters, reset) | none | none |
| Brand control semantics | toggle buttons (`aria-pressed`); pressing the chosen one again returns to all | radio group (`role=radiogroup`, one tab stop, arrows/Home/End move and choose, wraps) |
| Tab stops to cross brands + cities | 7 | 4 |
| Keyboard choice works | Enter chooses Bare (4); Space again returns to 6 | → Bare (4), End → Pepper House, Home → all, ← from all wraps to Pepper House |
| Visible focus | 2 px olive outline, 3 px offset, on every control | same |
| Result announced | `aria-live="polite"` summary, including the conflict note | same |
| Accessible names carry the count | "Bare Boutique Stays, 4 nơi ở" | same |
| Logo placeholders | hidden from assistive technology; the name is in the control's label | same |
| Reduced motion | card entrance, transitions and photo zoom all 0 s | card entrance, rings, thread and stage all 0 s |
| Touch "sticky hover" | hover styles only under `(hover: hover)` | same |

Contrast (`contrast.json`): olive on beige 9.11, on paper 10.19, on white 10.72; beige on olive 9.11; the derived muted olive `#5B6152` 5.45 on beige, 6.41 on white, 6.10 on paper. Copper (3.36 on beige, 3.76 on paper) is used only for lines, rings, dots and the symbol, never for text. Taupe (3.27 on beige) is used only for the second half of A's headline, at display size (28 to 48 px, 500 weight), where 3:1 applies.

## Checks run on the code

- `npx eslint src/app/dev/brand-collection`: no problems. (`scripts/lib.mjs` keeps the one warning of the file it was copied from.)
- `npm run typecheck`: passes.
- `npm test`: 193 of 193 pass, including the 11 in the new `filter.test.ts`.
- Browser console: no exceptions in any scripted run.

## Concept A's copper thread (refinement 1)

`scripts/thread.mjs` samples the drawn path at 401 points and tests it against the page. Raw output: `thread.json`.

| Check | Result |
|---|---|
| Widths × states: 360, 390, 768, 1024, 1440, 1920 px × (All, Bare, The Nắng Suites, Pepper House, Bare + Đà Nẵng) | 30 of 30 pass |
| Starts at the chosen panel's foot (lower right, 3.5 px below its frame) | 30 of 30 |
| Ends on the result line, at its right end | 30 of 30 |
| Controls crossed (brand panels, city chips, area select, reset) | 0 everywhere |
| Horizontal overflow added | 0 px everywhere |
| Leftmost point (the margin run) | 8 px at 360/390, 12 at 768, 15 at 1024, 100 at 1440, 340 at 1920 |
| Live resize 1440 → 600 px with Pepper House chosen | re-measured, all checks pass |
| Reduced motion | drawn, animation 0 s |
| `/a-original` | no thread, tick kept |

The layout numbers for A are unchanged by the thread (same section heights and distances to the first card as in the table above). The keyboard, combined-filter, address, area and reduced-motion runs in `interactions.json` were repeated on the threaded A and give the same results.

## Concept B, refinement 1

Same scripts, re-run against the refined `/dev/brand-collection/b`. The dev server was restarted once between runs (the app had stopped it); every result below comes from a complete run after the restart.

| Check | Result |
|---|---|
| Default 6, Bare 4, Bare + Đà Nẵng → Bare Hàn, Đà Nẵng then Pepper House → note and Pepper House, "Bỏ lọc" → 6 | pass, on a phone through the City **select** (`cityControl: "select"` in `interactions.json`) |
| Shared and contradictory links | pass (same as before) |
| Area: disabled "Chờ xác minh" with a description; `?areas=sample` → Khu vực mẫu 2 → Bare Hyphen, Pepper House | pass, through the phone select |
| Keyboard: one tab stop in the radio group; →, End, Home, ← wraps | 4, 1, 6, 1 properties; pass |
| Focus visible | 2 px olive outline on every control |
| Reduced motion | no animation on the cards, the rings, the thread or the stage |
| Horizontal overflow | 0 px at 390, 768 and 1440 |
| Stage height when the choice changes | unchanged at every width (390: 533 px to the first card for both All and Bare) |
| Visible controls under 44×44 px | none. The script lists 0×0 entries: these are the chips hidden on phones and the selects hidden from 640 px, which are `display: none` and not reachable |
| Console | no exceptions |
| Lint, typecheck, tests | clean; 193 of 193 |

Distances (section top to first card / sixth card), before → now: phone 649–758 → 533 / 2,638 → 1,113 px; desktop 631 → 571 / 1,329 → 1,269 px; tablet 682 px (not changed by this pass in a meaningful way).

New files: `b-390-all.png`, `b-390-bare.png`, `b-1440-all.png`, `b-1440-bare.png` (and `-full.jpg`), `b-390-bare-da-nang.png`, `b-390-conflict-note.png`, `b-390-sample-area.png`, `b-1440-keyboard-focus.png`, recordings `b-390-recording`, `b-1440-recording` and `b-1440-keyboard` (`.webp` and `.gif`).
