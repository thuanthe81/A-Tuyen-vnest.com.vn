# 03.3-C1 G1: client-content preview, QA results

Date: 16/10/2026. Route: `/dev/brand-collection/b-client`. Status: **built, awaiting the owner's visual review.** Not approved, not frozen, nothing committed.

**Method.** Headless Chrome 155, driven over the DevTools protocol by [`../scripts/client.mjs`](../scripts/client.mjs) and [`../scripts/regress.mjs`](../scripts/regress.mjs).

- Functional, accessibility, SEO and performance checks ran on a **production build** (`next build`, `next start` on port 3300).
- The pixel regression ran on the dev server (port 3200).
- Raw output is in `results.json` and `regression/compare-baseline-vs-after.json`.

```bash
node docs/qa/brand-collection/scripts/regress.mjs capture baseline   # before any code change
node docs/qa/brand-collection/scripts/regress.mjs capture after
node docs/qa/brand-collection/scripts/regress.mjs compare baseline after
BASE=http://localhost:3300 node docs/qa/brand-collection/scripts/client.mjs
npm run check
```

**Not tested:** real phones, Safari, Firefox, and screen readers (VoiceOver, TalkBack). Nothing here measures load time with real photography, because no photograph is shown.

## Screenshots

At 390, 768 and 1440 px: `*-all.png`, `*-bare.png`, `*-bare-da-nang.png`, `*-conflict-note.png`, plus a full page for each width (`*-all-full.jpg`). Keyboard focus: `1440-keyboard-focus.png`.

## Regression of the existing prototypes

`/a`, `/a-original`, `/b` and `/b-original` were captured at 390, 768 and 1440 px, with all brands and with Bare chosen, full page and with reduced motion.

- Before any edit, two baseline runs were compared with each other: **0 of 24 captures differ**. This shows the captures are deterministic.
- After the final code, compared with the baseline: **0 of 24 captures differ**, pixel for pixel.

## Content

- **Six properties**, in workbook order: Bare Chic, Bare Hyphen, Bare Đa Kao, Bare Hàn, The Nắng Suites, Pepper House. Each card shows the brand name, then the short property name, then the city. The full official names stay in the source data.
- **Index**: All 6 · Bare Boutique Stays 4 · The Nắng Suites 1 · Pepper House 1.
- **Cities**: TP. Hồ Chí Minh 4, Đà Nẵng 2.
- **Area**: no control in the page at any width.
- **Pictures**: every picture is a labelled placeholder ("Ảnh giữ chỗ" plus a reason):
  - "Chờ VNest xác nhận thư mục ảnh" on Bare Hàn and The Nắng Suites;
  - "Ảnh chờ cấp quyền sử dụng" on the other four.
- **Stage slices** also name their property. In the narrowest slices (88 px wide, phone with Bare chosen) the reason line is dropped, and the tag and name remain.

## Filters

All checks below used real clicks and taps.

| Check | Result |
|---|---|
| 12 brand × city combinations through the chips | All match the expected sets (`matrixBrandThenCity`) |
| The Nắng Suites, then TP.HCM | Brand cleared. Note: "The Nắng Suites chưa có nơi ở tại TP. Hồ Chí Minh, nên bộ lọc thương hiệu đã được bỏ." |
| Pepper House, then Đà Nẵng | Brand cleared; Bare Hàn and The Nắng Suites shown |
| TP.HCM, then The Nắng Suites; Đà Nẵng, then Pepper House | City cleared, with the matching note |
| Bare + Đà Nẵng at each width | Bare Hàn only. The phone used the City select, 768 and 1440 used the chips |
| Reset ("Bỏ lọc") | All six, address cleared |
| Shared link `?brand=bare&city=da-nang`, and after reload | Bare Hàn only, both times |
| Contradictory link `?brand=pepper-house&city=da-nang&area=mau-3` | Normalised to `?city=da-nang`, two properties |

Unit tests: `client/adapter.test.ts` has 19 tests covering traceability, normalization, detected conflicts, placeholders, static-only data, the full brand × city matrix, conflicts, reset and the address. `npm run check` passes: lint with 0 errors (3 earlier warnings in QA scripts), typecheck clean, **214/214 tests**.

## Accessibility

| Check | Result |
|---|---|
| Brand index | One `radiogroup` named "Thương hiệu" with a single tab stop. Arrow keys, Home and End select and wrap. Names include counts ("Bare Boutique Stays, 4 nơi ở") |
| Focus order | Review link → index → city chips. Then focus leaves the page: the cards are not focusable, and "Bỏ lọc" appears only once a filter is active. Visible outline: 2 px olive |
| Live region | `aria-live="polite"` announces the result and any conflict note. The card list is labelled by it |
| Placeholders | Hidden from assistive technology, like the images they replace (`alt=""` in Concept B). The review line says in text that every picture is a placeholder |
| Contrast | Placeholder tag 9.11:1 (olive on beige). Reason 5.45:1. Card brand and city 6.10:1. Card name 10.19:1 |
| Targets | No visible control under 44×44 px at any width |
| Reduced motion | Card and placeholder animations are `none` |
| Overflow | 0 px horizontal overflow at 390, 768 and 1440 |
| Errors | No exceptions and no console errors in any run |
| Already true of `/b`, not introduced here | No `main` landmark and no `h1` on these exploration pages. The homepage's hero will carry the `h1` |

## SEO

- `<meta name="robots" content="noindex, nofollow">`, and the `X-Robots-Tag: noindex, nofollow` header.
- The route is not in `sitemap.xml`, and `robots.txt` disallows everything (non-indexable build).
- Title "Khảo sát: bộ sưu tập thương hiệu B · dữ liệu VNest | VNest". No client address or other client data in `<head>`.
- The canonical reads `http://localhost:3000/…`, the site's default base URL, as on every dev route.

## Performance (production build)

| | CLS on load | CLS after filtering | LCP | Transferred |
|---|---|---|---|---|
| Desktop 1440 | 0 | 0.0044 (same on `/b`: the result line moves when "Bỏ lọc" appears) | 72 ms (review line) | 241 KB: 142 KB JS, 16 KB CSS, 0 KB images |
| Phone 390, slow 4G, CPU ×4 | 0 | 0 | 824 ms (review line) | 241 KB |

The stage keeps a fixed height for every brand choice: 422 px on desktop, 208 px on a phone. These numbers say nothing about photography. G2 must re-measure LCP and image bytes with real images.

## Remaining for G2 (photography)

1. Authorization of the intended use: local, private review; never committed or deployed (audit Q15).
2. VNest's answer on the Bare Hàn / The Nắng Suites folder conflict (Q1). Until then both keep placeholders.
3. VNest's approval of the four proposed images (Q18). Mapping and provenance: `src/app/dev/brand-collection/client/media.ts`, and `docs/content/03.3-C1-PROPOSAL.md` §2.
4. At G2: download the four primaries only; record sha256, pixel size and the authorization; serve them through `next/image` from a git-ignored folder, with the placeholder as fallback; repeat these checks with LCP and image bytes.

---

# Pricing refinement and G1 quality fixes, 17/10/2026

Status: **built, awaiting the owner's visual review.** Same method as above, re-run on the final code: a fresh production build for function and performance, the dev server for the pixel regression. `results.json` now holds this run. Where this section and the sections above disagree, this section is current.

## Price on each card

The price is shown on the six cards only; the brand index and the stage carry none.

| Width | Layout |
|---|---|
| 1440 and 768 | Right of the card text, at its foot, after a vertical hairline |
| 390 | Under the city, after a horizontal hairline. Nothing is cut off: the script found no clipped text in any card |

Screenshots: `1440-cards.png`, `768-all-full.jpg`, `390-cards.png` (private preview); `1440-cards-public.png`, `390-cards-public.png` (no-number fallback).

Each card's price is one of four presentation states (`src/app/dev/brand-collection/client/pricing.ts`), chosen in this order:

1. **`quote`**: a verified PMS price for selected dates, labelled "Giá cho ngày đã chọn". Nothing provides one yet; when one exists it takes precedence.
2. **`from`**: an indicative price VNest has approved for public display, labelled "Giá từ". The currency, "mỗi đêm" and "đã gồm thuế" appear only once confirmed. None is approved yet.
3. **`unverified`**: the workbook's lowest weekday figure, **private local preview only**:
   - the label reads "Tham khảo · chưa xác minh", followed by the figure exactly as written ("1,000,000") and "Thấp nhất ngày thường";
   - no currency, unit, tax or validity is added;
   - the review line says these are test figures, not booking prices, and not cleared for publication.
4. **`unavailable`**: "Xem giá theo ngày" and no number. It is plain text, not a link: the cards have no navigation or CTA yet.

**Where the figures come from.** They are read from `client/rates.ts`, a generated verbatim snapshot of column L, kept apart from the content adapter.

| Property | Figure | Cell | Note |
|---|---|---|---|
| Bare Chic | 1,100,000 | L4 | Merged L4:L7 |
| Bare Hyphen | 1,000,000 | L8 | **Flagged:** rows 9 and 10 have no rate (Q7); the card says "thiếu giá 2 phòng" |
| Bare Đa Kao | 1,000,000 | L12 | |
| Bare Hàn | 1,110,000 | L17 | |
| The Nắng Suites | 840,000 | L20 | |
| Pepper House | 1,215,000 | L24 | Merged L24:L25 |

**Public-display guard.** Workbook figures are drawn only when the build is a development, non-indexable one (`DEPLOY_ENV` undeclared or `development`). Any preview or production deployment gets the fallback. `?price=public` shows the public view locally. In that view, at 390 and 1440 px, all six cards read "Xem giá theo ngày" and no price area contains a digit.

## G1 quality fixes

**Landmark and heading.** `b-client` now has one `main` and one visually hidden `h1`: "Bộ sưu tập thương hiệu VNest · bản xem trước với dữ liệu VNest". Before any other change, `b-client` was captured with and without them: **0 of 6 captures differ.**

**Filter-induced layout shift: traced and mostly fixed.**

- *Cause.* The city chips' counts change on every filter change. Be Vietnam Pro, as loaded, has no tabular figures, so `tabular-nums` (already set) had no effect: "1" is 4.8 px wide and "4" is 8.6 px. The chips and the result line after them moved by 3–7 px.
- *Fix, `b-client` only.* The count gets a fixed box that fits any single digit (`min-width: 1.25ch`). The rule is scoped with `.page[data-content="client"]`.
- *Result.* Desktop CLS after filtering fell from **0.0044 to 0.0007**; on the phone it stays 0.
- *What remains.* The residual comes from the result sentence itself. It is right-aligned, so its left edge moves when it gets longer. Removing that would change the toolbar's alignment, which is a design change, so it is left as it is. `/b` keeps its 0.0044: it may not be altered.

## Results

| Check | Result |
|---|---|
| `npm run check` | Lint 0 errors (3 earlier warnings in QA scripts); typecheck clean; **224/224 tests**, including 10 new pricing tests: candidates and cells, merges, the Bare Hyphen flag, precedence, no digit in public, "Giá từ" and quote forms, separation from booking |
| Existing prototypes `/a`, `/a-original`, `/b`, `/b-original` | **0 of 24 captures differ** from the 16/10 baseline |
| Filters | 12 brand × city combinations, both conflict orders, reset, shared link, reload and contradictory link: as before |
| Index and stage | Unchanged; no price in either |
| Accessibility | Headings: h1 (hidden) → h2 → h3. One tab stop in the radio group. No control under 44 px. No overflow. No errors |
| SEO | `noindex, nofollow` (meta and header); not in the sitemap; one `h1`; no client data in `<head>` |
| Performance (production) | CLS 0 on load; after filtering 0.0007 (desktop) and 0 (phone). LCP 60 ms desktop, 768 ms on a phone with slow 4G and CPU ×4. 241 KB transferred, no images |

## Not done (by instruction)

No photography (G2). No change to the PMS or booking contracts, Section 02.1, `main`, or production. Nothing committed, pushed, merged, deployed or frozen.

---

# Card simplification, 18/10/2026

Status: **built, awaiting the owner's review.** It applies to `b-client` only. `results.json` now holds this run.

**What the card shows now.**

| Side | Content |
|---|---|
| Left | Property name (primary), then city (secondary) |
| Right | "Giá tham khảo" (small label), then the workbook figure exactly as written (prominent) |

**Removed from the card.** The brand line, "chưa xác minh", and the line "Thấp nhất ngày thường" with Bare Hyphen's "thiếu giá 2 phòng". This is visible text only:

- the pricing candidates still carry their source cell, `missingRows` (Bare Hyphen: rows 9 and 10) and the open questions (Q7, Q8);
- the review line at the top still says the figures are unverified test content: no currency, tax, unit or validity, not booking prices, not cleared for publication.

**Unchanged.** The calculations, the adapter, the brand filters and relationships, the index, the stage, and `?price=public`.

**Divider.** The vertical hairline is kept on wide cards. With the price block down to two lines, it anchors the price to the lower right; without it, the figure floated. On phones the price sits under the city, after a horizontal hairline.

## Checks (production build; regression on the dev server)

| Check | Result |
|---|---|
| Price alignment at 1440 | The figure's foot sits exactly on the city's foot (same bottom edge, to the pixel) |
| Long name, 1440 | "The Nắng Suites Riverside Garden Residence", far longer than any real name, wraps to 2 lines in its column; no overlap with the price, nothing clipped (`1440-cards-long-name.png`) |
| Long name, 390 | The same name wraps to 3 lines; the price follows below, nothing clipped (`390-cards-long-name.png`) |
| All widths | No text clipped in any card; 0 px overflow; no control under 44 px; no errors |
| `?price=public` at 390 and 1440 | All six read "Xem giá theo ngày"; no digit in any price area |
| Filters | 12 combinations, conflicts, reset and links unchanged |
| Tests | `npm run check`: 224/224; lint 0 errors |
| Existing prototypes | `/a`, `/a-original`, `/b`, `/b-original`: **0 of 24 captures differ** from the 16/10 baseline |
| Performance | CLS 0 on load; 0.0007 after filtering (desktop) and 0 (phone); LCP 48 ms desktop, 784 ms phone with slow 4G and CPU ×4 |

Screenshots: `1440-cards.png`, `390-cards.png`, `1440-cards-public.png`, `390-cards-public.png`, `*-cards-long-name.png`.

---

# G2: real photography, 18/10/2026

Status: **integrated for private local review, awaiting the owner's review.** Authorisation, provenance, hashes and crops: [`docs/content/g2/README.md`](../../../content/g2/README.md). Production build; `results.json` holds this run.

**What changed on screen.**

- **Photographs:** Bare Chic, Bare Hyphen, Bare Đa Kao and Pepper House show their authorised photographs, in the cards and in the stage.
- **Placeholders kept:** Bare Hàn and The Nắng Suites keep the labelled placeholder ("Chờ VNest xác nhận thư mục ảnh").
- **Unchanged:** the card hierarchy (name, city, "Giá tham khảo" and the figure) and Concept B's composition. Real photographs revealed no layout problem.

Screenshots:

| What | Files |
|---|---|
| Collection | `*-all.png` |
| Cards with photos | `1440-cards-photos.png`, `768-cards-photos.png`, `390-cards-photos.png` |
| Stage, Bare (three photos and the Bare Hàn placeholder) | `*-stage-bare-photos.png` |
| Stage, Pepper House (one wide slice) | `*-stage-pepper-photo.png` |

## Responsive images

| Width | Card file (slot) | Stage file, narrow slices | Stage, single slice |
|---|---|---|---|
| 390, DPR 2 | 480 AVIF (173 px; needs 346) | 480 (needs 428) | 800 (needs 714) |
| 768, DPR 2 | 800 (354 px; needs 708) | 1200 (needs 716) | 1600 (needs 1436) |
| 1440, DPR 1 | 480 (384 px) | 800 (needs 483) | 800 (needs 743) |
| 1440, DPR 2 | 800 (needs 768) | 1200 (needs 966) | 1600 (needs 1486) |

Every slot gets a file at least as wide as it needs. "Needs" means the slot's width, or 1.5 × its height for a cover crop, times DPR.

Two fixes during QA, both in the `sizes` of stage photos only, so placeholders and the prototypes are unaffected:

1. The first version sized slices by width and over-fetched on tablets: 1600 px for a 238 px slice.
2. A width-only sizing would have under-fetched on a retina desktop. Slices now size by the stage's height.

AVIF is served everywhere: Chrome supports it. WebP and JPEG are the fallbacks.

## Lazy loading

Cards use `loading="lazy"` and `decoding="async"`; the stage loads at once.

On this short page every card lies within Chrome's lazy-load distance, so all four load at start. That is expected.

**Proof.** A test-only stylesheet pushed the card grid to 4841 px down:

- before scrolling, only the two stage photos loaded;
- the Bare Hyphen and Bare Đa Kao card photos loaded only after scrolling;
- Bare Chic and Pepper House reuse the stage's file.

(A first attempt injected the stylesheet too early and did not move the grid. Corrected and re-run.)

## Other checks

| Check | Result |
|---|---|
| Performance, desktop | CLS 0 on load; 0.0007 after filtering (the right-aligned result sentence, as before). LCP is now the stage photo, 68 ms. 342 KB transferred, of which 99 KB are images |
| Performance, phone (slow 4G, CPU ×4) | CLS 0; LCP 808 ms (the review line). 289 KB, of which 46 KB are images |
| Accessibility | Every image has `alt=""`: decorative, with the name in text. No image lacks `alt`. Reduced motion: no animation. Keyboard and radio group unchanged. No control under 44 px. 0 px overflow. No errors at any width |
| Public price mode | `?price=public` at 390 and 1440: "Xem giá theo ngày" on all six; no digit in any price area |
| Filters | 12 combinations, conflicts and reset unchanged |
| SEO | `noindex, nofollow`; not in the sitemap |
| `npm run check` | 230/230 tests (photo gate and responsive sources included); lint 0 errors |
| Existing prototypes | `/a`, `/a-original`, `/b`, `/b-original`: **0 of 24 captures differ** from the 16/10 baseline |
| Repository | Originals (`.local-media/`) and derivatives (`public/dev-client-media/`) are ignored: `git status --ignored` lists them as `!!`. Nothing committed |

---

# G2.1: location label and panel, 19/10/2026

Status: **built, awaiting the owner's review.** Production build; `results.json` holds this run.

## Labels on the cards

| Property | Label | Basis |
|---|---|---|
| Bare Chic | TP.HCM · Quận 1 | toplist.vn and mytour.vn (updated 1/10/2026) both give "12/18 Nguyễn Thị Minh Khai, Quận 1 / District 1" |
| Bare Hyphen | TP.HCM | HRS gives "29a/18 Nguyễn Đình Chiểu" with no district. No source names one (Q20) |
| Bare Đa Kao | TP.HCM | No public source found for 14/3 Nguyễn Đình Chiểu (Q20) |
| Bare Hàn | Đà Nẵng · Hải Châu | Airbnb listing by the same host: "Quận Hải Châu", on Trần Phú. House number not public |
| The Nắng Suites | Đà Nẵng · Sơn Trà | mia.vn (26/09/2023): "74/31 Võ Văn Kiệt, Sơn Trà". **Conflicts with the workbook's K174/31 (Q19)** |
| Pepper House | TP.HCM · Quận 1 | The architect's project page says "District 1"; travel listings give "19 Hoang Sa Street, Da Kao Ward" |

**Rules.**

- **Labels.** A label is a former district, shown only when a source names it for this property or its exact address. It is never taken from the current ward (Phường Sài Gòn, Phường Tân Định), from the street, or from neighbouring numbers.
- **Visible text.** The label replaces the city line, in the same type. The city now uses its short form ("TP.HCM"), as in the owner's example.
- **Filters.** No filter reads the label: `Property.area` stays null, and Area stays off.

## The panel

The label is a button (`aria-expanded`, `aria-controls`). Its accessible name starts with the visible text: "TP.HCM · Quận 1, xem địa chỉ Bare Chic".

The panel is a labelled region ("Địa chỉ Bare Chic") and shows:

- the street;
- the current ward and city, as supplied;
- one line on anything pending;
- "Xem bản đồ" only where the link is verified.

The panel overlays the space below the card, within the card's width, so nothing on the page moves.

| Property | Street | Ward and city | Pending | Map |
|---|---|---|---|---|
| Bare Chic | 12/18 Nguyễn Thị Minh Khai | Phường Sài Gòn, Hồ Chí Minh | — | Yes |
| Bare Hyphen | 29A/18 Nguyễn Đình Chiểu | Phường Sài Gòn, Hồ Chí Minh | Map link awaiting VNest | **No**: cell text and hyperlink point to different places (Q4) |
| Bare Đa Kao | 14/3 Nguyễn Đình Chiểu | phường Tân Định, TP HCM | Address not matched to any source | Yes |
| Bare Hàn | K169/14 Trần Phú | Hải Châu, Đà Nẵng | Address not matched; current ward awaiting VNest | Yes |
| The Nắng Suites | *(withheld: house number in conflict)* | Sơn Trà, Đà Nẵng | House number awaiting VNest; current ward awaiting VNest | Yes |
| Pepper House | 19 Hoàng Sa | Phường Sài Gòn, TP HCM | — | Yes |

**How the map links were verified.** Each workbook link was followed by its redirects only. Each resolves to the Google place named for its property (for example `/g/11f6ywgqpw` "Bare Chic - Bare Boutique Stays"). Opening Google's own page produced a bot check (CAPTCHA). It was not bypassed, so the places' addresses on Google were not read.

**Card navigation.** Cards have no link or CTA today, so nothing is nested. Any future card link must sit beside the location button, never around it.

## Checks

| Check | Result |
|---|---|
| Labels | All six as above at 390 and 1440 (`*-cards-location.png`) |
| Open by tap (390) and click (1440) | Panel opens (`*-location-open-chic.png`, `*-location-open-nang.png`). Opening a second panel closes the first: only one is ever open |
| Close | A tap or click outside closes it; so does any filter change (the list re-renders) |
| Keyboard | Enter opens with focus kept on the button. Tab reaches "Xem bản đồ". Escape closes and returns focus to the button. Space toggles. The focus ring hugs the label (`1440-location-keyboard-hyphen.png`) |
| Long address | A synthetic 80-character street wraps inside the panel: 0 clipped lines at 173 px (phone) and 384 px (desktop); no page overflow (`*-location-long-address.png`) |
| Targets | Every label is 44 px tall (67–144 px wide); the map link is 44 px tall. No control under 44 px |
| Map link | Opens in a new tab with `noopener noreferrer`. Its accessible name says "trên Google Maps (mở thẻ mới)" |
| Filters | 12 brand × city combinations, conflicts and reset unchanged; one tab stop in the brand index |
| Public price mode | No digit in any price area at 390 or 1440 |
| Performance | CLS 0 on load; 0.0007 after filtering (unchanged); LCP 60 ms desktop, 808 ms on a phone with slow 4G and CPU ×4 |
| Tests | `npm run check`: 238/238, including 8 location tests (labels only with evidence, none inferred, the raw cell kept, the conflict hidden, the Hyphen map withheld); lint 0 errors |
| Existing prototypes | `/a`, `/a-original`, `/b`, `/b-original`: **0 of 24 captures differ** |

**One tooling change.** `eslint.config.mjs` now ignores `**/chrome-profile/**`, the headless-browser profiles the QA scripts write. They are already git-ignored. Chrome had placed its own bundled scripts there, which lint was reporting as 130 errors.
