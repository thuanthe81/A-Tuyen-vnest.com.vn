# Phase C — Discovery experience and Coming Soon (client review 6/11/2026)

Status: **built 7/11/2026, awaiting the owner's visual acceptance.** Phase D has not started. Nothing committed, staged,
stashed or deployed. Review on the local dev server: http://localhost:3401/dev/demo?intro=0 (English preview: `&lang=en`;
Discovery itself is Vietnamese-only, as before).

## What changed

| # | Request | Result |
|---|---------|--------|
| 1 | Brand Collection: remove "Xem tất cả nơi ở →" | Removed: the link, its styles, its label and its scroll handler. The heading block is now just the eyebrow and heading, with a measured gap to the brands (28–48 px). The brand interaction is unchanged (Phase B check re-run: 536/536). |
| 2 | Discovery: remove the "KHÁM PHÁ NƠI Ở" eyebrow | Removed. The heading opens the section, and the description follows unchanged in wording. The brand names in it now follow the approved order: "Bare Boutique Stays, Pepper House và The Nắng Suites". |
| 3 | Brand filters | "Tất cả" · Bare Boutique Stays · Pepper House · The Nắng Suites (one choice, radio group, arrow keys). The chips are compact, on a faint olive tint, and the chosen one is filled Dark Olive. There are no outer tracks and no visible labels; screen readers get "Thương hiệu" and "Thành phố". |
| 4 | City filters | **Behaviour:** only TP. Hồ Chí Minh and Đà Nẵng appear, as toggle buttons (`aria-pressed`). At first all six stays show and no city is selected. A city is never chosen automatically, including with "Tất cả" or Bare. **Active filter:** filled Dark Olive; tapping it again clears it. **Availability, not a filter:** for one-city brands, that city gets a Dark Olive ring and dot (Pepper House → TP. Hồ Chí Minh, The Nắng Suites → Đà Nẵng). Bare (both cities) and "Tất cả" mark neither. A city the brand is not in is dashed and muted; a tap explains ("Pepper House chưa có nơi ở tại Đà Nẵng.") and changes nothing. **Stale cities:** choosing a brand that has no stay in the active city drops the city and says so, so the list is never empty without explanation (the existing shared rule). **Reset:** "Bỏ lọc" resets everything. |
| 5 | Coming Soon | **Entry:** a single line under the description: "● SẮP RA MẮT  Ý tưởng nơi ở mới từ ba thương hiệu ↓". With a brand chosen, it reads "… của Pepper House". It is a real link to `#sap-ra-mat`; it scrolls there and moves focus to the teasers' heading. **Teasers after the real stays:** "Những nơi ở tiếp theo — Ý tưởng thương hiệu, chưa nhận đặt phòng." With "Tất cả" there are three cards: three columns on desktop, and a swipeable row with the next card peeking in on phones and tablets. With a brand chosen, only that brand's card appears. **Three compositions, each from the official logo (unaltered):** see the next table. **Never bookable:** no links, buttons, prices, dates, room counts, cities or availability, and not in the stays list or data. |
| 6 | Layout | Heading → description → Coming Soon entry → brand filters → city filters (one line on desktop, divided by a hairline) → result line → the real stays → the teasers. The result line sits in a reserved row under the filters, so choosing a filter never reflows the toolbar. The property cards, photographs and "Chọn phòng" buttons are unchanged. The real stays now follow the brand order: Bare ×4, Pepper House, The Nắng Suites. Their URLs are unchanged. |
| 7 | Interaction | **Desktop:** hover tints, 200 ms colour transitions. **Phones:** 44 px touch targets ("Bỏ lọc" included, without adding height), no hover-only information, no horizontal page scroll. **Keyboard:** arrows move through brands, Tab reaches cities, Space toggles, and focus outlines show everywhere. The teaser row on phones takes focus for keyboard scrolling. **Reduced motion:** no transitions. `#kham-pha` is marked `lang="vi"`. |

The three Coming Soon compositions:

| Brand | Composition |
|-------|-------------|
| Bare Boutique Stays | Warm paper; a dotted copper route wandering from the title to the hairline wordmark. Editorial, exploratory. |
| Pepper House | A drawing sheet: grid, construction lines crossing at the framed symbol, and an architect's title block (status / name / note). Architectural, structured. |
| The Nắng Suites | Pale cream; a soft sun rising on a gold horizon with two faint rings, the mark at its centre, text centred below. Warm, light, calm. |

## Code (backend handoff)

- `discovery.ts`: the city rules, as pure functions. `cityChips` (active / available / only / unavailable), `cityAfterTap` and `inBrandOrder`. Covered by `discovery.test.ts` (10 tests).
- The shared reducer in `@/app/dev/brand-collection/filter.ts` is unchanged. It keeps the brand/city conflict rule, its note and the address (`?brand=`, `?city=`).
- `coming-soon.ts` holds the teaser list (= `BRAND_ORDER`) and the copy, separate from inventory. `ComingSoon.tsx` and `ComingSoon.module.css` hold the entry, the teaser block and the three compositions (CSS and one small SVG; no images besides the official logos).
- Brand order and data are reused: `BRAND_ORDER`/`orderBrands` from `brand-showcase.ts`, logos and names from the client collection, and cities from `CITIES`. No duplicated arrays.
- Not touched: the property cards (`PropertyGrid`, mobile cards), data adapters, GoHost/ezCloud, booking, Hero, About, Services, FAQ and Contact. No new dependencies.

## Evidence

- `before/`: brand heading and Discovery at 1440, 768 and 390 (script `../scripts/shots-c-before.mjs`).
- `after/` (script `../scripts/shots-c-after.mjs`):
  - `1-brand-heading-*`: the brand heading.
  - `2-discovery-heading-*`: the Discovery heading.
  - `3-discovery-{all,bare,pepper-house,the-nang}-*`: the section per filter, desktop and mobile.
  - `4-city-pepper-{available,hint,active}-*`: the city states.
  - `5-coming-soon-*`: each card at 2×, and the teaser block at 1440 and 390 (also swiped).
  - `6-homepage-full-*`: the full homepage.

### QA

`../scripts/qa-c.mjs`: **468/468** (`qa-c-results.txt`). It runs at 1440, 1024, 768, 430, 390 and 375 px, with the Vietnamese and English pages, and checks:
- **Headings:** brand link gone and heading gap; Discovery eyebrow gone and its order (heading, description, entry); no "Mọi …" or status text; `lang="vi"`.
- **Filters:** brand filter order; initial state (6 stays in brand order with their original URLs, "Tất cả" on, no city); per brand, the count, city availability with nothing selected, only its teaser, the entry naming it, and the toolbar height unchanged.
- **City behaviour:** unavailable-city tap explained; active city filled and in the address; tapping again clears; active and hint look different; a stale city is dropped with an explanation, never empty; Bare + Đà Nẵng; "Bỏ lọc".
- **Coming Soon:** no links, buttons or booking words; not among the stays; three distinct compositions with the official logos; text inside each card, no overlaps; swipe row on phones, three columns on desktop; the entry scrolls to the teasers and focuses their heading.
- **Links:** all six stay links answer 200.
- **Page health:** no overflow, no clipped text, no layout shift (CLS without input < 0.02), no console or hydration errors.
- **Keyboard:** arrows, Tab and Space; reduced motion; a shared `?brand=the-nang` address.

| Suite | Result |
|-------|--------|
| lint | 0 errors (the 3 old warnings) |
| typecheck | pass |
| unit | 436/436 (10 new: `discovery.test.ts`) |
| Phase B brand check (`qa-b.mjs`) | 536/536 |
| e2e homepage-content / about-vnest / occupancy | 11/11 · 16/16 · 8/8 |
| e2e hybrid-booking (booking) | 75/79: the same 4 as before (3 need the simulation server, 1 Pepper House @375 dev-server network-idle timeout) |
| e2e room-selection | 20/22: the same 2 as in Phase A (React's development-only "Cannot update a component while rendering" warning from `PropertyRoomCollection`, planned for Phase D) |
| e2e mobile-interactions | 14/16: the same 2 fixed-date (6–8/11/2026) tests; the 20–22/11 scratch copy passes 16/16 |

Test change: `test/e2e/mobile-interactions.test.mjs`. The step that tapped the brand section's "Xem tất cả nơi ở" now taps
through Discovery: brand order, six stays, no city at first, Pepper House → 1 stay with TP. Hồ Chí Minh marked, Đà Nẵng
explained, toggle on/off, "Tất cả". `docs/.../scripts/qa-b2.mjs` (Phase B polish) checks the link that Phase C removed and
is kept as a record of that round.

## Files

- **New:** `src/features/demo/discovery.ts`, `discovery.test.ts`, `coming-soon.ts`, `ComingSoon.tsx` and `ComingSoon.module.css`.
- **Changed:**
  - `HomeCollection.tsx`: the Discovery section (eyebrow, filters, order, entry, teasers, `lang`).
  - `HomeCollection.module.css`: the toolbar styles replace the segmented controls and phone selects; section spacing.
  - `BrandShowcase.tsx` and `BrandShowcase.module.css`: the link was removed and the heading spacing adjusted.
  - `brand-copy.ts`: `allStays` removed.
  - `SectionLink.tsx`: the `sap-ra-mat` target.
  - `test/e2e/mobile-interactions.test.mjs`.
- **QA:** `qa-c.mjs`, `shots-c-before.mjs`, `shots-c-after.mjs`.

## Open points for the owner

1. **Coming Soon copy** is the build team's wording. VNest has to approve it, and confirm it is happy to announce that new stays are coming:
   - "Sắp ra mắt"
   - "Ý tưởng nơi ở mới từ ba thương hiệu / của {brand}"
   - "Những nơi ở tiếp theo"
   - "Ý tưởng thương hiệu, chưa nhận đặt phòng."
   - "Thông tin sẽ được công bố sau."

   No names, dates, places or counts are stated.
2. **Discovery description:** the brands were reordered to the approved order (the wording is otherwise unchanged). Keep it?
3. **Stay order:** the real stays now follow the brand order (Pepper House before The Nắng Suites). Keep it?
4. **Reset label:** "Bỏ lọc" replaces "Xem tất cả nơi ở" for clearing filters, to avoid repeating the removed link's wording.
5. **Still open from Phase B:** the official brand websites for "Visit us ↗".
6. **Discovery in English:** it stays Vietnamese-only on the English preview, as before. Translating it is a separate step if wanted.

---

# Phase C revision — Discovery and Coming Soon (owner, 8/11/2026)

Status: **built 8/11/2026, awaiting the owner's visual review.** A refinement of the build above, not a redesign. Phase D
has not started. Nothing committed, staged, stashed or deployed.

## What changed

| # | Request | Result |
|---|---------|--------|
| 1 | Remove the "● SẮP RA MẮT · Ý tưởng nơi ở mới …" line | Removed, with its link, styles and copy. The section opens with the heading and the description only. |
| 2 | The earlier filter layout, the new options | The pre-Phase C toolbar is back: between two hairlines, one labelled row per filter ("THƯƠNG HIỆU", "THÀNH PHỐ"), the options on one rounded white track, the chosen option filled Dark Olive with the copper hairline. Desktop: labels in one column, tracks beside them, the result line ("4 nơi ở · Bare Boutique Stays  Bỏ lọc") to the right. Tablet: label above each track, options sharing the width. **Options:** Tất cả · Bare Boutique Stays · Pepper House · The Nắng Suites; TP. Hồ Chí Minh · Đà Nẵng. No "Mọi thương hiệu" or "Mọi thành phố". The city rules are unchanged (nothing selected at first; ring and dot for a one-city brand; a muted city explains on tap; tapping the active city clears it). **Phones:** the earlier version used two dropdowns there. A city dropdown needs an "all cities" entry, which the brief rules out, and cannot show the availability mark, so phones use the same pill tracks: the four brands as a 2 × 2 track, the two cities on one line. |
| 3 | No separate Coming Soon section | Removed: the block, its heading "Những nơi ở tiếp theo", its lead and the three-card row. |
| 4 | Coming Soon belongs to each brand | **"Tất cả":** only the six real stays. **One brand:** its real stays, then that brand's Coming Soon card as the last item of the same grid (desktop: a tile the size of a property photo; phones and tablets: a strip the size of a mobile property card). Bare: Bare Chic, Bare Hyphen, Bare Đa Kao, Bare Hàn, then Bare. Pepper House: Pepper House, then Pepper. The Nắng Suites: The Nắng Suites, then The Nắng. The card stays when a city is also chosen (e.g. Bare + Đà Nẵng: Bare Hàn, then Bare); it names no city. |
| 5 | Simpler card | "Thông tin sẽ được công bố sau." is gone. Each card has only its artwork (unchanged art direction, now drawn to the photo's proportions), the small "SẮP RA MẮT" label and the brand name. |
| 6 | Card leads to the brand website | The whole card is the link, opening in a new tab, with a small "↗" after the name, a 2 px lift on hover and a visible focus ring. No booking button, price or availability. **No brand website is confirmed yet** (`BRAND_WEBSITES` in `brand-showcase.ts` is empty for all three), so today the cards are drawn without a link, the same as "Visit us ↗" in the brand section. Each becomes a link as soon as its URL is filled in there. The linked state was checked with a temporary placeholder, then reverted. |
| 7 | Real property cards | Unchanged: photos, typography, "Xem giá theo ngày", "Chọn phòng", spacing. |

## Code

- `coming-soon.ts`: the teaser rule `comingSoonFor(filters)` (the chosen brand, or none) and `comingSoonHref(brand)` (the confirmed website or `null`). Copy is reduced to `label` and a screen-reader `website` note. Still not inventory.
- `ComingSoon.tsx` / `.module.css`: one `ComingSoonCard` (`variant` "tile" or "strip"), the three compositions in container units so they hold from a 3:2 tile to the 718 × 220 tablet strip. `<a>` with a confirmed website, otherwise a `<div data-website="pending">`.
- `PropertyGrid` (`@/app/dev/brand-collection/shared.tsx`) and the homepage's `MobilePropertyCollection` take an optional `trailing` item, drawn as the last list item. The properties themselves are untouched.
- `HomeCollection.tsx` / `.module.css`: the intro without the entry line, the labelled toolbar rows, the card passed as `trailing`, the separate section removed.
- `SectionLink.tsx`: the `sap-ra-mat` target removed.
- `discovery.test.ts`: two new tests (the card belongs to the chosen brand only; it links only to a confirmed website).

## Evidence

- `qa-c-rev-results.txt` (script `../scripts/qa-c-rev.mjs`): 612/612. The owner's second round followed the same day before
  screenshots were taken, so this round's pictures are in `revision-2/` (the filters and placement are unchanged there).

---

# Phase C revision, round 2 — Coming Soon family, arrow CTAs, "Hợp tác cùng VNest" (owner, 8/11/2026)

Status: **built 8/11/2026, awaiting the owner's review.** Phase D has not started. Nothing committed, staged, stashed or
deployed. The filters, the placement rule ("Tất cả": none; one brand: its card last in its list) and the website rule
from round 1 are unchanged.

## What changed

| # | Request | Result |
|---|---------|--------|
| 1 | Coming Soon cards feel related to their brand's cards | Each card now uses the **listing card's own shell**. Desktop: the property photo box (3:2, 6 px radius), then the brand name and a copper "Sắp ra mắt" line below, set in the real cards' classes. Phones and tablets: the mobile property strip (same height, radius and shadow), name bottom-left, a quiet "SẮP RA MẮT" tag where a stay has its button. The picture is the **brand's own approved photograph** (the one the brand section uses: Bare Chic, Pepper House, The Nắng Suites), softly blurred under the brand's veil so it carries the brand's atmosphere without pretending to show the new stay. Over it, the official logo and one motif: Bare, warm paper and a dotted copper route arriving at the wordmark; Pepper House, a drawing grid with the symbol framed where the lines cross; The Nắng Suites, warm cream and a sun rising on the horizon behind the mark. No price, availability, booking button or body text. The whole card is the link to the brand website once one is confirmed (still none, see open points). |
| 2 | No underline under arrow CTAs | **About banner "Liên hệ VNest →"**: the permanent copper underline is gone; the arrow is copper, the text brightens and the arrow nudges on hover, and keyboard focus keeps its outline. **Stay names in Discovery ("Bare Chic →")**: the hover/focus underline is gone; the name turns copper and the arrow nudges; focus has an outline. **Property pages' "Xem tất cả nơi ở →"**: underline removed the same way. The homepage no longer has a "Xem tất cả nơi ở →" link. |
| 3A | Heading and hierarchy | The overline "HỢP TÁC CÙNG VNEST · DÀNH CHO CHỦ TÀI SẢN" is now copper, larger (13 px), semibold, led by a short copper rule on tablet and desktop. The heading is unchanged in size and stays on one line on desktop (Vietnamese). More space between the heading and the cards. |
| 3B | Service cards | Same three cards and interaction. More generous padding and radius, slightly larger titles and lines, even heights in one row from 768 px, and a soft lift under the chosen olive card. |
| 3C | No repetition in the panel | The panel no longer repeats the service title (screen readers still hear it as the panel's name). It opens straight into the description. |
| 3D | Panel layout; the three lines on the right | **The three highlight lines are removed** (owner's preferred option): they restated the description. They remain in `owner-journey.ts`, so they can come back if the client wants them. The description is now the panel: 17–20 px, line height 1.65, a measure of about 40 characters' width per line on desktop. |
| 3E | CTA | One larger CTA: 56 px tall, 16 px bold, copper, with a soft shadow and the arrow on the right. Desktop: in its own column to the right of the description, set off by a hairline, vertically centred. Tablet: under the description. Phones: full width under the description; a long label may wrap to a balanced second line, with the arrow staying on the right. It still scrolls to the form with the service chosen. |

## Code

- `ComingSoon.tsx` / `.module.css`: rebuilt on the listing shell; takes a `photo` (the brand's `BRAND_PHOTO` property). It reuses `PropertyPicture` and the shared `cardImage` / `cardName` / `cardCity` classes; the mobile strip mirrors `.mobilePropertyLink`.
- `HomeCollection.tsx`: passes the brand photo to the card.
- `OwnerJourney.tsx` / `.module.css`: the panel is now the description plus one CTA (no `h3`, no list); new overline style; card, panel and CTA styles refined; the unused `.h3` style was removed.
- `owner-journey.ts`: the unused "Điểm nổi bật" label is removed; the highlights stay as content (comment updated).
- `AboutVNest.module.css`, `@/app/dev/brand-collection/shared.module.css` (`.cardNameLink`), `property-detail/RelatedProperties.module.css` (`.allStaysLink`): arrow CTAs without underline.
- `test/e2e/homepage-content.test.mjs`: the services step now expects no repeated title or highlight list and one CTA (the owner's change). The client's highlight text is still checked against the client document by the unit tests.

## Evidence

- `revision-2/` (script `../scripts/shots-c-rev2.mjs`):
  - `discovery-{all,bare,pepper-house,the-nang}-{1440,1024,768,430,390,375}.png`: each brand with its card.
  - `card-{bare,pepper-house,the-nang}-{tile,strip}.png`: each card close up, at 2×.
  - `hop-tac-{1440,1024,768,430,390,375}.png` and `hop-tac-service-3-{1440,390}.png`: the cooperation section.
  - `cta-about-*.png`, `cta-stay-name-hover-1440.png` and `cta-related-all-stays-hover-1440.png`: the arrow CTAs.
- `qa-c-rev2-results.txt` (script `../scripts/qa-c-rev2.mjs`): **780/780**, at 1440, 1024, 768, 430, 390 and 375 px, with the Vietnamese and English pages.
  - **Filters:** the two rounds' filter and placement checks.
  - **Each card:** the listing shell (same size, radius and name size as a real card), the brand's own photograph, blurred, the motif and logo, only the name and "Sắp ra mắt", no booking words, website or no link, no overlaps.
  - **Arrow CTAs:** no underline at rest, on hover or on keyboard focus; the focus outline is visible; a space before the stay arrows; the property page link.
  - **Hợp tác:** overline style, a dominant heading, even cards, no repeated title or list, the description's size and measure, one CTA at least 56 px tall that fits, and the CTA reaching the form with each service.
  - **Page health:** no overflow, layout shift or console/hydration errors.

| Suite | Result |
|-------|--------|
| lint | 0 errors (the 3 old warnings) |
| typecheck | pass |
| unit | 438/438 |
| e2e homepage-content / about-vnest / occupancy | 11/11 · 16/16 · 8/8 |
| e2e mobile-interactions | 13/16: the parent suite plus the 2 tests with fixed 6–8/11/2026 dates; the 20–22/11 scratch copy passes 16/16 |
| e2e room-selection | 20/22: the same 2 as before (React's development-only warning in `PropertyRoomCollection`, Phase D) |
| e2e hybrid-booking | 75/79: the same 4 as before (3 need the simulation server, 1 Pepper House @375 dev-server timeout) |

## Open points for the owner

1. **Brand websites** for the Coming Soon cards and "Visit us ↗" (Bare Boutique Stays, Pepper House, The Nắng Suites). Until they are confirmed, the cards are not links.
2. **The brand photograph in the Coming Soon card** is an existing stay's photo, blurred as atmosphere. If VNest prefers no real photograph there, the veil and motif work alone.
3. **Highlights removed from the services panel:** they are the client's 05.11 copy. Confirm with the client, or bring them back as a compact row.
4. Still open from Phase C: the Coming Soon wording, the stay order, the "Bỏ lọc" label, and Discovery being Vietnamese-only.

---

# Phase C final artwork — Coming Soon cards (owner, 8/11/2026)

Status: **superseded the same day** by the artwork revision below (the owner preferred the first Bare direction and did not
approve this Pepper House composition). Kept as a record. The owner approved the placement, sizing and filter
behaviour; this round replaces only the artwork and the card text. Phase D has not started. Nothing committed, staged,
stashed or deployed. No other homepage section or approved copy was touched.

## What changed

- **No photographs.** The blurred stay photo (round 2) is gone from all three cards. Each card is now an original
  composition in SVG and CSS, built around the brand's **official logo file** (the same transparent files the brand
  section uses: never redrawn, recoloured or distorted).
- **One visible label.** The repeated brand name is gone. The only visible text is **"Sắp ra mắt"**, in copper #A87444,
  20 px bold, where a stay card shows its name (under the artwork). At this size and weight it counts as large text and
  passes AA, at 3.4:1 on the page. English: "Coming Soon" (Discovery itself is still Vietnamese-only). Screen readers
  hear "Bare Boutique Stays: Sắp ra mắt", so the brand is still named.
- **Same listing structure.** Desktop: the artwork fills the property photo box (same size, 6 px radius and row as the
  stay beside it) and the label takes the name's place. Phones and tablets: the artwork fills the mobile property strip
  (same height, radius and shadow), with the label under it, so nothing is laid over the art.
- Unchanged:
  - "Tất cả" shows no card; one brand shows its own card after its last stay.
  - The card links only to a confirmed brand website (still none, so it is not a link today; the linked state was
    re-checked with a temporary placeholder, then reverted).
  - No price, availability or booking control.

## The three compositions

One shared system:
- the same media box and a hairline edge;
- one measuring unit (1 % of the artwork's height), so every composition keeps its proportions from the 3:2 desktop
  tile to the wide 768 px strip, where only the grounds stretch;
- hairlines of the same weight;
- VNest copper as the single accent;
- the same label below.

| Brand | Composition | Why it belongs to the brand |
|---|---|---|
| Bare Boutique Stays: editorial exploration | Warm paper. The script wordmark sits left of centre. A fine baseline leads in from the card's edge to the "b". A copper pen line **continues exactly from the script's last stroke** (its tail, measured at 99.1 % × 76.9 % of the logo file), loops once and rises, with a fainter retrace for the hand, then turns into a dotted path ending at an open point. Big negative space top left. | The journey so far (solid) and the next stop (dotted, open): a boutique, personal, exploratory brand. Monoline, like the script itself. |
| Pepper House: architectural geometry | Light concrete ground, built on the **symbol's own grid**: its bars sit at 31.4 % and 68.5 %, i.e. two lines that every plane follows. A dark tower whose floors fall on that pitch, with a lit side face. A low stone block between the two lines. A plinth level with the lower bar, across the card, taking the tower's cast shadow. One copper window and a copper beam on the upper bar's line, leading straight into the symbol's arm. | The symbol is a grid with a roof; the artwork extends that grid into massing, light and shadow. Contemporary, urban, structured, without a drawn wireframe. |
| The Nắng Suites: light and warmth | Cream ground warming towards the bottom. A copper horizon across the card. A low warm-yellow sun on it, with an inner arc of light and an outer arc that sweeps up and fades. The mark **stands where the inner arc meets the horizon**. Three short lines of reflected light below. | "Nắng" is sunlight; the reflections echo the wave in the mark (the sea at Đà Nẵng). Calm, light, welcoming; cream, warm yellow and restrained copper. |

## Code

- `ComingSoon.tsx`: `ComingSoonCard`, the artwork box plus the label, as a link or a plain block. Inside: `BareArt`,
  `PepperArt` and `NangArt`, each with a comment giving its measurements, and `Logo`, which renders the official file.
- `ComingSoon.module.css`: the shell (tile and strip), the label, and one block per brand.
- `coming-soon.ts`: the English label is now "Coming Soon".
- `HomeCollection.tsx`: the photo wiring from round 2 is removed. No new assets or dependencies.

## Evidence

- `final/` (script `../scripts/shots-c-final.mjs`):
  - `grid-{bare,pepper-house,the-nang}-{1440,1024,768,390,375}.png`: each artwork in its filtered grid.
  - `grid-all-{1440,390}.png`: "Tất cả", with no card.
  - `discovery-*-{1440,390}.png`: the whole section.
  - `artwork-{brand}-{desktop,mobile}.png`: each artwork close up, at 2×.
- `qa-c-final-results.txt` (script `../scripts/qa-c-final.mjs`): **852/852**, at 1440, 1024, 768, 430, 390 and 375 px, with the Vietnamese and English pages.
  - **Each card:** the only visible text is "Sắp ra mắt"; the brand is named for screen readers; the label is ≥ 20 px, bold, #A87444 and under the art; no photograph or blur, only the brand's official logo file, loaded, undistorted and inside the art; its own composition; not bookable; the website rule; the art fills the stay's media box (size, radius, row).
  - **Unchanged behaviour and regressions:** the filters and placement, the arrow CTAs and "Hợp tác cùng VNest" checks from round 2, overflow, layout shift, console and hydration errors, keyboard and reduced motion.

---

# Phase C Coming Soon artwork, revision (owner, 8/11/2026)

Status: **built 8/11/2026, awaiting the owner's visual review.** Only the Coming Soon artwork and its label changed. The
placement, sizing and filters, the website rule, the Discovery section and all other copy are unchanged. Phase D has not
started. Nothing committed, staged, stashed or deployed.

## What changed

- **Bare Boutique Stays: back to the first direction.** Editorial warm paper and the dotted copper route that wanders
  across the page. It starts at a copper dot, passes two small stops, and arrives at an open point just above the
  wordmark, which sits bottom right. A lot of air top left. No text inside the art.
- **Pepper House: redone on the brand's own language.** The loading screen of pepperhouse.asia (observed 8/11/2026) is a
  field of broken grid lines: the symbol's dashes repeated like a city map, stopping short of every crossing, with soft
  diagonal streets where the field thins out, and the symbol in the middle. The artwork now uses that:
  - **The map:** warm-grey dashes on a light stone ground, about one cell per 7 % of the height. Three diagonal streets
    run through it, and it fades gently away from the symbol.
  - **The symbol:** the official file, sized so that its bars fall exactly on the map's own lines. It stands on a
    softly cleared block, as if it were one cell of the map drawn at full strength.
  - **The route:** one copper route walks the streets, with right-angle turns and a small square marking a point on the
    way, and ends at the symbol's upper-left arm.

  The result is urban, structured and a little mysterious, without blocks or a diagram. The previous towers and plinth
  are removed.
- **The Nắng Suites: refined.** A soft warm halo around the low sun and a deeper sun gradient. The horizon fades out at
  both ends, and the reflections fade at their ends. The arcs and the mark standing where the inner arc meets the
  horizon are kept.
- **Label.** Still the only visible text, now larger: "Sắp ra mắt" (English "Coming Soon"), copper #A87444, bold,
  22–26 px, under the artwork where a stay shows its name. No brand name and no "Thông tin sẽ được công bố sau". Screen
  readers hear the brand.

## Code

- `ComingSoon.tsx`:
  - `BareArt`: a 150 × 100 group with the route, its stops and the wordmark.
  - `PepperArt`: a 340 × 100 group with an SVG `pattern` for the map, a `mask` for the streets, the cleared block and the
    fade, the copper route, and the symbol.
  - `NangArt`: the halo and gradients are added.
  - Each function's comment gives its measurements.
- `ComingSoon.module.css`: one block per brand; the label is larger. No new assets or dependencies.

## Evidence

- `artwork-2/` (script `../scripts/shots-c-final.mjs`):
  - `grid-{bare,pepper-house,the-nang}-{1440,1024,768,390,375}.png`: each artwork in its filtered grid.
  - `grid-all-{1440,390}.png`: "Tất cả", with no card.
  - `discovery-*-{1440,390}.png`: the whole section.
  - `artwork-{brand}-{desktop,mobile}.png`: each artwork close up, at 2×.
- `qa-c-final-results.txt` (script `../scripts/qa-c-final.mjs`, updated for this revision): **852/852**, at 1440, 1024, 768, 430, 390 and 375 px, with the Vietnamese and English pages.
  - **Each card:** the only visible text is "Sắp ra mắt"; the brand is named for screen readers; the label is ≥ 20 px, bold, #A87444 and under the art; no photograph or blur, only the brand's official logo file, undistorted and inside the art; its own motif (Bare's dotted route, Pepper's map pattern and copper route, The Nắng's sun, arcs and reflection); not bookable; the website rule; the art fills the stay's media box.
  - **Placement:** the card comes after the brand's last stay, and there is none with "Tất cả".
  - **Regressions:** the filters, arrow CTAs and "Hợp tác cùng VNest" checks, and page health.

---

# Phase C Coming Soon artwork, refinement 2, and toolbar cleanup (owner, 8/11/2026)

Status: **built 8/11/2026, awaiting the owner's visual review.** Phase D has not started. Nothing committed, staged,
stashed or deployed. Bare's artwork, the placement rule, the label and the filter design are unchanged.

## Coming Soon artwork

- **Pepper House: no route line.** The copper route and its marker are removed. The symbol is now centred on its
  cleared block (still sized so its bars fall on the map's lines). The block is marked at its four corners by small
  copper angle marks, like a site plan or crop marks. That is the one accent. What remains is the brand's map of
  broken grid lines, three soft diagonal streets and the gentle fade away from the block: an abstract, architectural
  rhythm with no path across it.
- **The Nắng Suites: centred.** Mark, sun, halo, both arcs and the reflection now share one centre line. The mark rises
  inside the low sun with its base on the horizon. The inner arc is a full half circle. The outer arc is a full half
  circle that is strongest at its crown and fades towards the horizon on both sides. The three reflection lines sit
  centred below. Calm and symmetrical.

## Filter toolbar

- The right-hand group is gone: no "4 nơi ở · Bare Boutique Stays", "1 nơi ở · …" or "Bỏ lọc", and no reserved space.
  The toolbar is the two labelled rows between its hairlines, with the same pills, spacing and alignment. Its height no
  longer changes with the filters.
- **"Tất cả" resets both brand and city** to all six stays and a clean address. It also does so when it is already
  chosen and a city is on.
- Unchanged:
  - Tapping the active city clears it.
  - Brand and city availability marks.
  - The `?brand=` / `?city=` address.
  - A stale city is dropped when a brand without stays there is chosen.
- **Screen readers** still hear every result in a polite live region: the count, a dropped city's note, and the
  explanation for an unavailable city. Sighted users no longer see a text explanation for an unavailable city. Its
  muted look, with no change on tap, is the cue.
- The empty-list fallback ("Chưa có nơi lưu trú phù hợp.") lost its "Bỏ lọc" button. It cannot appear under the
  current rules.

## Files

- `ComingSoon.tsx` and `ComingSoon.module.css`: the `PepperArt` and `NangArt` changes.
- `HomeCollection.tsx` and `HomeCollection.module.css`: the toolbar and the "Tất cả" reset; unused result and reset
  styles removed.
- QA: `qa-c-final.mjs` and `shots-c-final.mjs` updated.

## Evidence

- `artwork-3/` (script `../scripts/shots-c-final.mjs`):
  - `grid-*`: each artwork in its grid at 1440, 1024, 768, 390 and 375.
  - `toolbar-{width}.png`: the toolbar.
  - `discovery-*`: the whole section.
  - `artwork-*`: each artwork close up.
- `qa-c-final-results.txt`: **948/948**, at 1440, 1024, 768, 430, 390 and 375 px, with the Vietnamese and English
  pages. On top of the earlier card and regression checks:
  - **Pepper House:** has its map and block marks, and no route line.
  - **Centring:** Pepper House and The Nắng Suites marks are centred. The Nắng is exact; Pepper House is within 1 %,
    the offset that keeps its bars on the map lines.
  - **Toolbar:** no visible result text or reset control; the result is announced to screen readers; the toolbar keeps
    its height through every filter state.
  - **"Tất cả":** resets both filters, including when it is chosen again with a city on.
