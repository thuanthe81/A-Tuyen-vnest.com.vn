# VNest City Notes: section specification

Date: 20/10/2026. Status: **CS-1 to CS-7 APPROVED by the owner 20/10/2026 as design and implementation direction, with two refinements (mobile density; address handling). Standalone prototype built, awaiting visual review: [`../qa/city-notes/RESULTS.md`](../qa/city-notes/RESULTS.md). Not integrated, not frozen.**

Refinement 2 changed rule L4 below: D30 is no longer reduced to its area. It is shown as written and flagged (new rule L5); only D33 falls back to its area.

*(Original status: specification and layout proposal for the owner's design review.)* The Bare Chic page, booking components, PMS contracts, `main` and every approved section are unchanged.

Working name: **VNest City Notes, Khám phá quanh nơi bạn ở** (owner's brief, 20/10/2026).

Layout proposal: [`../design/city-notes/board.html`](../design/city-notes/board.html) (open the file in a browser). Frames at 1440 and 390 px: `../design/city-notes/boards/`. The working frame is `../design/city-notes/frames/city-notes.html`; its tabs and its expand button work.

This supersedes two recommendations of the boundary proposal ([`city-notes-boundary-proposal.md`](city-notes-boundary-proposal.md)) because the owner's brief decided them: CN-D5 (placement: a reusable module for property pages, not a standalone page) and CN-D6 (one composition, drawn at two widths). CN-D1 to CN-D4 are answered or restated in §11.

## 1. Purpose

Show what staying with VNest feels like in its city: where VNest would send you to eat and to look around. It is a guest's note, not a tourist directory.

It must never compete with booking. Rooms and the primary action stay the most prominent things on a property page.

## 2. Source data (verified against the workbook)

Sheet "Thông tin các điểm tham quan" of `VNest_Informationv2.xlsx`, already held verbatim in `src/content/vnest-workbook/details.ts` (`NEARBY_SHEET`).

| | TP. Hồ Chí Minh | Đà Nẵng |
|---|---|---|
| Block header | A2 "Khu vực các cơ sở: Bare Chic, Bare Đa Kao, Bare Hyphen, Pepper House" | A20 "Khu vực các cơ sở: Bare Hàn, The Nắng Suites" |
| Ăn & uống (column C) | 7, rows 5–17 (odd) | 7, rows 23–35 (odd) |
| Khám phá (column B) | 8, rows 4–18 (even) | 8, rows 22–36 (even) |
| Address (column D) | one per row | one per row |

30 places in total. The sheet gives **name, category and address only**. It has no description, reason, photograph, opening hours, price, rating, coordinates, map link, distance or travel time, and no row ties a place to one property. City Notes adds none of these.

The city is not written in the header. It is read from the last part of every address in the block ("Hồ Chí Minh", "Đà Nẵng"); the generator refuses a block whose addresses disagree.

## 3. Content rules

**Names** are shown exactly as written, trimmed only. "Bánh mì Huynh Hoa" stays as written until VNest answers (Q32).

**Location line** ("concise location"), each step a written rule kept with the value (`Sourced`, status `derived` or `normalized`):

| Rule | What it does | Example |
|---|---|---|
| L1 | Trim, collapse doubled spaces, add the missing space after a comma | D11 "…Nguyễn Đình Chiểu,Phường…" → "…Nguyễn Đình Chiểu, Phường…" |
| L2 | Drop the final city part: the section heading already names the city | "135 Nam Kỳ Khởi Nghĩa, Phường Sài Gòn" |
| L3 | Never change spelling, casing, numbers or the ward/district convention | Đà Nẵng keeps "Hải Châu", "Sơn Trà" as written (Q35) |
| L4 | When the street part holds an invalid value, show only the area parts after it, until VNest corrects it | D33 "!0 Nguyễn Thiện Thuật, Bình Hiên, Hải Châu" → "Bình Hiên, Hải Châu" |
| L5 | (Refinement 2.) A value that only looks wrong is shown exactly as written and flagged for VNest; the private preview marks it | D30 "119 Trần phú, Hải Châu" stays; C13 "Bánh mì Huynh Hoa" stays |

Every one of the 30 results is listed by the generator (`node docs/design/city-notes/scripts/build-data.mjs`).

**Selection for the first view.** The first four of each category in the workbook's own order. That is VNest's order, so the selection is traceable and claims no editorial ranking of ours. The product model keeps `featured` as a field so VNest can choose later (Q36). Places are not numbered, so the order does not read as a ranking.

**Copy.** All visible copy is draft for review:

| Element | Draft |
|---|---|
| Label | VNest City Notes |
| Heading (h2) | Ăn gì, đi đâu ở TP. Hồ Chí Minh / Ăn gì, đi đâu ở Đà Nẵng |
| Line under the heading | Những địa điểm VNest gợi ý trong thành phố. Mỗi nơi kèm địa chỉ, để bạn tự sắp xếp lịch trình. |
| Tabs | Ăn & uống · Khám phá, each with its count |
| Expand / collapse | Xem tất cả 7 địa điểm ăn uống · Xem tất cả 8 địa điểm tham quan / Thu gọn |
| Source line | Danh sách do VNest gợi ý. Giờ mở cửa có thể thay đổi, bạn nên kiểm tra trước khi đến. |

**Why the heading is not "Khám phá quanh nơi bạn ở" (decision CS-1).** "Quanh nơi bạn ở" says the places are around the guest's property. The sheet does not support that: one list serves four properties, its places sit in five different wards, and nothing in it says any place is around any one property. "Ăn gì, đi đâu ở [city]" keeps the youthful, conversational tone, maps one-to-one to the two tabs, and is true. "VNest City Notes" stays as the feature's label. If VNest later curates lists per property with verified distances (Q33), the owner's subtitle becomes accurate and can return.

## 4. UX

**First state** (what loads):
1. The label, the heading with the city, and one line of context.
2. Two category tabs, Ăn & uống (selected) and Khám phá, with counts.
3. Four places: name, and the location line under it.
4. "Xem tất cả n …" and the source line.

**Expanded state:** the same panel shows the whole category (7 or 8). The expansion stays when the guest switches tab, so "complete city collection" is two tabs of full lists. "Thu gọn" collapses and, if the section's top has scrolled away, brings it back into view without moving focus.

Why Ăn & uống is selected first: the owner names it first, and food is a hypothesis for the most engaging entry point for younger guests (a hypothesis, not evidence).

**Not included, on purpose:** maps or map links per place (the boundary's CN-D3: a built search link is an unverified target), photographs (none supplied; Q34), ratings, hours, prices, distances, "gần đây", any "near this property" wording, and filters beyond the two categories.

**Possible later addition (not drawn), CS-5:** a "Sao chép địa chỉ" button per place in the expanded state. The workbook names Grab as the main way to get around (column K), and copying VNest's own address text needs no unverified data. It would be hidden for L4 and L5 places until Q32 is answered.

## 5. Visual direction

Built only from the property page's existing system (`PropertyDetail.module.css`): olive text, muted olive, copper for hairlines only, paper ground, Be Vietnam Pro at the page's h2, body and label sizes. No new colours, no cards, no shadows, no photographs.

- **Hierarchy.** The heading uses the same h2 size as Tiện nghi, Các loại phòng and Vị trí, never the display size, so City Notes cannot outrank the rooms. Its only button is an outline; the filled olive pill stays reserved for booking.
- **Editorial device.** The tabs sit on the copper hairline that every section head uses; the selected tab is a 2 px olive underline. Places are set as an index of names over hairlines, like a magazine's listings column, not as travel-blog cards.
- **Icons.** Two, both meaningful: a bowl with chopsticks for Ăn & uống, a compass for Khám phá, drawn on the amenity pictograms' 24 px grid at the same 1.4 stroke. Decorative (`aria-hidden`); the tab text carries the meaning. No icon per place.
- **1440 px.** Heading left (7/12), context line right (5/12), as in Vị trí. Tabs left on the hairline. Four places in a row of four columns; expanded, a second row. Footer: the button left, the source line right. Measured section height: 320 px collapsed, 455 px expanded (HCM, Khám phá).
- **390 px.** One column. Tabs split the width in halves, 48 px tall. Places are rows with hairlines between. The button is full width. Measured: 630 px collapsed (about three quarters of an 844 px screen), 941 px expanded. The phone booking pill (05.2) stays above it, unchanged, because the rooms are not on screen.

## 6. Placement on the property page (decision CS-2)

Recommended order, with City Notes as a new **section 6**:

| # | Section | Change |
|---|---|---|
| 1 | Hero: room-grouped gallery, identity, primary action | none |
| 2 | Introduction | none |
| 3 | Tiện nghi (amenities) | none |
| 4 | Các loại phòng (#rooms, booking) | none |
| 5 | Vị trí (location) | none |
| 6 | **VNest City Notes** | new |

Reasons:
- **Booking stays first.** Everything a guest needs to choose and book comes before City Notes. On phones the booking pill stays visible over City Notes, because its rule ("shown when the hero action has scrolled away and the rooms are not on screen") already covers it, so no booking code changes.
- **It continues "Where is it?"** Vị trí answers where the property is; City Notes widens to the city.
- **Its own section, with its own head.** If it sat inside Vị trí, under the property's address, the list would read as "near this address", which the data does not support (Q28, Q33). Section 6 keeps it at city level.

Alternatives considered:
- **Between amenities and rooms.** Rejected: it delays the rooms and competes with booking.
- **Inside the hero or straight after the gallery.** Rejected: the first screen belongs to the property and the primary action.
- **Inside Vị trí.** Rejected for the proximity reason above. It becomes right only if VNest supplies per-property lists with verified distances.
- **After the page content, as a link to a standalone City Notes page.** Possible later (a homepage or city page could reuse the same module); not needed now.

On phones, section 6 is near the end of a long page. That is intended: City Notes rewards guests who are already deciding, and does not need to be found first.

## 7. Architecture

Reuses the content adapter pattern; nothing in `property-details.ts`, `nearbyFor()`, the Bare Chic record or the domain changes in this checkpoint.

```
details.ts (NEARBY_SHEET, verbatim)                     unchanged
  └─ vnest-workbook/city-notes.ts      NEW reader: CityNote[] keyed by CityId, every value Sourced
       └─ features/city-notes/view.ts  NEW view: audience gate, featured slice, display strings only
            └─ features/city-notes/CityNotes.tsx       NEW server component (markup, both lists)
                 └─ CityNotesTabs.tsx                  NEW small client island (tabs, expand)
```

**City-level, not property-level.** The domain's `PropertyRecord.nearby` is defined as "something near the property", and its categories (nature, culture, food-drink…) would force a classification the sheet does not make. City Notes is therefore a separate city-level content type, resolved through the property's own verified city (`records.ts` `city`). The property record gains nothing; a layout simply asks for the note of its city.

Proposed reader shape:

```ts
type CityNotePlace = {
  id: string;                       // stable: city + sheet row, e.g. "ho-chi-minh-r5"
  category: "eat" | "explore";      // from the column (C or B), never inferred
  name: Sourced<string>;            // B/C cell, trimmed only
  location: Sourced<string>;        // D cell, rules L1–L4
  address: Sourced<string>;         // D cell, L1 only, kept for later features (CS-5)
};
type CityNote = {
  city: Sourced<CityId>;            // derived from the addresses' last part
  serves: Sourced<readonly string[]>; // the header's property names, traced, not shown (CN-D4)
  places: readonly CityNotePlace[]; // workbook order
  featured: { eat: readonly string[]; explore: readonly string[] }; // first four by default (Q36)
};
export function cityNote(city: CityId): CityNote | null;
```

**Gate.** As elsewhere: values with status `conflict` or `missing` are never shown; a property whose city has no note renders no section at all (no empty state). In the private preview only, the existing `Pending` aside lists what is still waiting (Q32, Q34) and each place carries its cells in a `data-source` attribute.

**Progressive enhancement.** The server renders both categories as full lists under their own h3 headings, so the content works without script. The client island turns them into tabs and collapses to four. The section is far below the first screen, so the swap happens before it is seen; CLS is measured in QA to confirm.

**Route for the prototype (next checkpoint).** An isolated `/dev/city-notes` route, `noindex`, 404 unless `DEPLOY_ENV=development` (as `review-access.ts` does), rendering the module for both cities inside a ghosted page context. No link from, and no change to, `/dev/stays/*`.

## 8. Accessibility

- Tabs follow the WAI-ARIA tabs pattern: `role="tablist"` with a label ("Loại địa điểm"), `role="tab"` with `aria-selected` and `aria-controls`, one `role="tabpanel"` labelled by the selected tab, roving `tabindex`, Left/Right/Home/End with automatic activation. The frame implements this; the keyboard check passed (Right on Ăn & uống selects and focuses Khám phá and shows "Dinh Độc Lập" first).
- Counts read as "7 địa điểm" to screen readers (visually "7").
- The expand button has `aria-expanded` and `aria-controls`; its label names the count and category.
- Targets: tabs 48 px tall, button 44 px; no target under 44 px at either width (measured).
- Contrast: text uses olive and muted olive only (5.4:1 or better on paper); copper is used only for the hairline.
- Places are a `ul` (not `ol`): the order is not a ranking.
- Reduced motion: the only transitions (colour, chevron) drop to 0 ms.
- `lang="vi"` covers every string; English place names ("Lunch Lady", "Tan coffee") are proper names and need no language switch.

## 9. QA plan (for the prototype checkpoint)

At 390, 768 and 1440 on the rendered route: no horizontal overflow, tabs and expand by keyboard and touch, screen-reader names, CLS from hydration, contrast, both cities, every one of the 30 places traced to its cell, the Bare Chic routes pixel-identical before and after (`regress.mjs`), lint, typecheck and tests (reader: rules L1–L4, city derivation, featured slice, the gate).

## 10. Evidence for this proposal

- `docs/design/city-notes/boards/*.png`: 6 frames (3 states × 2 widths) at 2× density.
- `docs/design/city-notes/boards/shots.json`: no horizontal overflow at either width, no target under 44 px, the font loaded, tab state, the keyboard check, measured section heights.
- The frames are static design evidence only. The 768 px width is not drawn; it will be covered in prototype QA.

## 11. Decisions for the owner

| # | Decision | Recommendation |
|---|---|---|
| CS-1 | Heading copy | "Ăn gì, đi đâu ở [city]" with "VNest City Notes" as the label, instead of "Khám phá quanh nơi bạn ở" (§3) |
| CS-2 | Placement | Section 6, after Vị trí, on every property page (§6) |
| CS-3 | First view | Four places per category, workbook order, Ăn & uống selected |
| CS-4 | Expanded state | Inline expansion of the same panel; no bottom sheet or modal |
| CS-5 | Copy-address action | Not now; reconsider after the prototype |
| CS-6 | Imagery | None (restates the boundary's CN-D2 (a)) |
| CS-7 | Next checkpoint | Build the reader with tests and the isolated `/dev/city-notes` prototype, then stop for review. Bare Chic integration only after that, as its own approved step |

Answers to the boundary's decisions: CN-D1 answered by CS-1 (Vietnamese heading, English feature label). CN-D2 kept as CS-6. CN-D3 kept: no map links. CN-D4 kept: the city only; the header's property names stay in the data. CN-D5 and CN-D6 decided by the owner's brief.

## 12. Questions for VNest

Q32 to Q35 from the boundary proposal still stand (data corrections, per-property curation, a line and photographs per place, the Đà Nẵng address convention). One new question:

| # | Question |
|---|---|
| **Q36** | Which places should appear first for each city (four per category)? Until VNest chooses, the site shows the first four in the workbook's order. |
