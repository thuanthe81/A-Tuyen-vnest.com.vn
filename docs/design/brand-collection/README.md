# Homepage Brand Collection: two concepts

15/10/2026. Design exploration for the owner's review.

**Current direction: Concept B, Connected Brand Index.** The owner first chose A with B's thread (§11), then, after reviewing both again, changed the selection to B ("cleaner, more cohesive and better suited to VNest's homepage"). B's first refinement is built (§12) and awaits review. A is preserved as a reference. **Nothing is approved, frozen or on the homepage.** The next step is real content: `VNest_Information.xlsx` and verified property imagery. Evidence: [`../../qa/brand-collection/RESULTS.md`](../../qa/brand-collection/RESULTS.md). Side-by-side board: [`board.html`](board.html) (open the file in a browser).

- Concept A, Curated Brand Gallery, with the thread: <http://localhost:3200/dev/brand-collection/a>
- Concept A as first reviewed (tick, no thread): <http://localhost:3200/dev/brand-collection/a-original>
- Concept B, Connected Brand Index, refinement 1 (current direction): <http://localhost:3200/dev/brand-collection/b>
- Concept B as first reviewed: <http://localhost:3200/dev/brand-collection/b-original>
- Either with sample areas: add `?areas=sample`

## 1. What the client's files say

**`AI_edited_2026.ai`** (Illustrator 25, one 1000×1000 artboard). The vector artwork for the vertical lockup: the interlaced symbol, the "vnest" wordmark and "HOSPITALITY MANAGEMENT". Read directly from the file:

| Element | Colour in the artwork |
|---|---|
| Symbol, tagline | `#AB7444` copper (0.671 / 0.455 / 0.267) |
| Wordmark | `#3C3C3C` dark grey (not olive) |

The prototypes use the artwork's own paths, copied out of the file without redrawing (`public/dev-fixtures/brand-collection/`, with `SOURCES.md`). Nothing about the VNest mark was traced or approximated.

**Concept presentation (6 slides).** Slide 1 is the lockup. Slide 2 is the palette: Copper `#A87444`, Dark Olive `#37412F`, Warm Taupe `#8A8173`, Beige `#F1ECE4`, and the intended feeling "Ấm áp, Tự nhiên, Mộc mạc, Gắn kết" (warm, natural, rustic, connected). Slides 3 to 6 explain the symbol: separate lines that create value only once connected (owners, properties, guests, operators, partners, design, construction, technology); an open circle with no beginning and no end; and **an empty centre, left as space for people and experiences**.

Two things to confirm with the client:

1. Copper is `#AB7444` in the artwork and `#A87444` on the slide. The prototypes use the artwork's value (it also matches your brief). The slide is probably a typing error.
2. Beige appears only on the slide, printed very faintly; the artwork contains no beige. `#F1ECE4` is the value read from the slide.

**Partner logos.** Not supplied. Bare Boutique Stays, The Nắng Suites and Pepper House appear as labelled placeholder slots (see §4); nothing was drawn, traced or recoloured.

## 2. Content, and what is not known

Shared by both concepts (`src/app/dev/brand-collection/data.ts`): three brands, six properties, brand of each property and its city, exactly as in the brief. Nothing else is asserted.

- **Areas are unverified for every property**, so the Area control is present, wired and honest: disabled, reading "Chờ xác minh", with a screen-reader description. Neither V1 nor V2 holds verified addresses; the only source is the old Alate site, which V1's audit marks "needs client confirmation". `?areas=sample` loads three placeholder areas named "Khu vực mẫu 1–3" so the interaction can be reviewed; they match no real place.
- **"District" may be the wrong word now.** My understanding is that Vietnam removed the district level of local government on 1 July 2025, so "Quận 1"-style labels are no longer administrative units. The prototypes say "Khu vực" (area). VNest should decide whether areas are the new wards or its own neighbourhood names (for example the street or quarter a guest would recognise). Please confirm before any area data is written.
- **Pictures** are the drawn stand-ins already in the project, each marked "ẢNH MẪU · KHÔNG PHẢI HÌNH ẢNH VNEST"; which drawing sits on which property is arbitrary. VNest has supplied property photographs as Google Drive links in `VNest_Information.xlsx`; they have not yet been imported into the repository (as of 15/10/2026).
- **Headlines are draft copy.** No brand description was available, so neither concept invents one. B has a dashed slot for one approved line per brand.

## 3. Shared behaviour (identical in both, so the comparison is about composition)

- **One filter model**, three dimensions: brand (the Brand Collection itself), city, area. There is no brand dropdown: the collection *is* the brand filter.
- **Counts everywhere**, always relative to the other filters: city chips count within the chosen brand; brands count within the chosen city.
- **No dead ends, nothing disabled.** The latest choice wins: choosing Pepper House while Đà Nẵng is selected drops the city and says so in the result line ("Pepper House chưa có nơi ở tại Đà Nẵng, nên bộ lọc địa điểm đã được bỏ."). Disabling a brand would have hidden a partner precisely where the brief asks for recognition.
- **The address keeps the filters** (`?brand=bare&city=da-nang`), so a filtered collection can be shared or reloaded; `replaceState`, so Back is not filled with filter steps.
- **The result line** (`aria-live`) states what is shown, explains any dropped filter, and offers "Bỏ lọc".
- **The property list** below is deliberately plain. It stands in for the six-property collection, which is designed later.
- **Hero** is a labelled stub above the section, so the section is reviewed in its homepage position without redesigning the hero.

## 4. Logo slot specification (both concepts)

Until the files arrive, each partner logo is a slot, so the layouts are already sized for the real thing:

- Fixed height per context (A: 28 to 48 px; B index: 32 px, desktop only; B stage: 32 to 40 px), maximum width 3.5 × height. Any logo from square to 3.5:1 fits by `contain` without changing the layout; a longer one will be height-reduced.
- Clear space is a quarter of the slot height on every side and belongs to the slot, so nothing can crowd it.
- Always on a light ground (white or paper). Logos are shown in their own colours: never recoloured, dimmed, desaturated or reversed. Where a concept quiets an unchosen brand, it quiets the photographs, never the logo.
- What we need from each brand: SVG (or high-resolution PNG), any minimum-size rule, any clear-space rule, and whether a reversed version exists.

## 5. Concept A, Curated Brand Gallery

**Idea.** VNest is the curator: the wall and the opening panel. The three brands hang side by side as works in one exhibition, each on its own white mount: logo, its own photographs, its count and cities. All three are visible at once; each mount *is* the filter.

**Composition.**
- Desktop: one row, ~280 px tall. VNest's panel (olive, the official symbol, "6, Tất cả nơi ở") then Bare at twice the width of the single-property brands, because it holds four places; the panel shows all four.
- Tablet and phone: VNest becomes a slim "All" bar; Bare runs full width with its four places in a block; The Nắng Suites and Pepper House sit side by side.
- Numbering (01, 02, 03), hairlines and generous mount space keep it editorial rather than tile-like.

**Interaction.** Toggle buttons. Choosing a brand frames its mount in olive with a heavier foot and a tick, and turns the other brands' photographs grey (their logos stay untouched). Choosing a city quiets, inside each mount, the photographs of places outside it (Bare's strip shows exactly which of its four are in Đà Nẵng). Choosing the brand again, or the VNest panel, returns to all.

**What it is good at.** Every brand is recognised at a useful logo size at all times and on every screen. The composition itself shows the collection's shape (one brand of four, two of one). It is the most direct reading of "VNest as curator, every brand respected". The layout never moves when filtering.

**Weak points.** Seven tab stops to cross brands and cities. The proportional row works for three brands and probably a fourth; at five or more it needs a second row or a different rule. The VNest symbol is used as an emblem, not as an idea.

## 6. Concept B, Connected Brand Index

**Idea.** Taken from the symbol's own story: separate lines that become one system once they are connected. A copper thread runs through every entry of a compact index. The chosen entry is tied with two interlaced rings (drawn, not traced from the logo) and the thread runs on into a single stage that shows only that brand: its logo, its count and cities, its places by name, and a slot for one approved line.

**Composition.**
- Desktop: index on the left (VNest "All", then the three brands with logo and count), with the thread down its right edge; the stage to the right (picture plus caption).
- Phone: the index becomes a four-part selector with the thread underneath it; the chosen node drops a line into the stage below.
- "All" shows one picture per brand side by side, labelled: the three threads before one is tied.

**Interaction.** A radio group: one tab stop; arrows, Home and End move and choose. Changing the choice ties the ring, draws the connector (240 ms) and fades the stage in; with reduced motion, nothing moves.

**What it is good at.** The most distinctive and most "VNest" of the two: it makes the masterbrand's idea (connection, an open centre) into the navigation itself. It is compact as a selector, and it scales: a fourth or fifth brand is one more row. There are fewer tab stops.

**Weak points.** Only one brand is shown at a time. On phones the selector has no room for logos (names only), so partner logos appear only on the stage, one at a time. The stage changes height with the chosen brand on phones (+109 px for Bare), so the list below moves. The picture adds height without adding choices. Radio-group arrow keys are correct but less familiar than buttons.

## 7. How they differ

| | A, Curated Gallery | B, Connected Index |
|---|---|---|
| Spatial composition | One row (desktop) or a two-up grid (phone) of mounts; every brand present at once | An index plus one stage; one brand present at a time |
| Hierarchy | Brands first, VNest as the frame | VNest's idea first (the thread), then the chosen brand |
| Interaction | Toggle buttons; in-place emphasis | Radio group; the stage changes and the thread re-ties |
| Partner logos on a phone | All three, 28 to 32 px tall | Only on the stage, one at a time |
| Phone, section to first card | 667 px, constant | 649 px (all) to 758 px (Bare) |
| Desktop, section to first card | 610 px | 631 px |
| Tab stops (brands + cities) | 7 | 4 |
| A sixth brand | Needs a layout rule change | One more row |

## 8. Recommendation (superseded: the owner chose B)

**Take Concept A forward.** The brief ends on the test that matters: VNest as the curator of a collection that respects every participating brand.

- **Identity.** A meets that test most directly: all three partner logos are visible, at a useful size, on every screen, with VNest as the frame around them. B expresses VNest more strongly, but it does so partly at the partners' expense, because on a phone their logos leave the selector.
- **Usability.** A is one tap per brand with everything in view. The section never changes height, and its counts and quieted photographs explain the city filter without extra text. B is equally functional, but it shifts the list on phones and asks guests to learn a selector before they see the brands.
- **Maintainability.** Both run on the same filter code. A has one weakness: past four brands its single row needs a new rule. With three brands today, that is a known limit rather than a risk, and the decision can be revisited when a fourth brand is real.

**Worth borrowing from B, if you agree:** the copper thread as A's chosen-state detail, a line from the chosen mount to the result line, which brings the symbol's idea into A without B's stage. (Chosen by the owner and built: see §11.)

**Choose B instead if** VNest expects several more brands soon, or wants the homepage to lead with VNest's own idea rather than with the partners.

## 9. Decisions needed from you

1. Which concept to refine (or the A + thread combination).
2. Partner logo files and rules (§4), and whether brand colours may ever be used as accents. The prototypes use none.
3. Copper `#AB7444` vs `#A87444`, and the beige value.
4. What "Area" means after the 2025 change, and the verified area for each property.
5. Brand names on the site: "Bare Boutique Stays" or "Bare"; "The Nắng Suites" or "The Nắng". V1 left this open, and the prototypes follow your brief.
6. Headline and per-brand copy (draft only).

## 10. Files

New and isolated; nothing existing was changed, nothing committed.

- `src/app/dev/brand-collection/`: `page.tsx` (index), `data.ts`, `filter.ts` and `filter.test.ts`, `useCollection.ts`, `shared.tsx` and `shared.module.css`, `a/`, `b/`
- `public/dev-fixtures/brand-collection/`: the VNest vectors and `SOURCES.md`
- `docs/qa/brand-collection/`: screenshots, recordings, measurements, scripts
- `docs/design/brand-collection/`: this file and `board.html`

Not touched: `main`, Section 02.1, availability/PMS contracts, production routes, the homepage, Living Frames and its media.

## 11. Refinement 1: A with the copper thread (15/10/2026)

**What changed.** In A, the chosen panel is now tied to the result line by one copper line, taken from B. The olive frame stays as the selection indicator; the thread replaces the tick and the heavier olive foot. Everything else in A is unchanged (`a/Thread.tsx`, and a `thread` option on `CuratedGallery`). The earlier version stays at `/a-original`, with its captures in `docs/qa/brand-collection/a-original/`.

**The route the thread takes.** A straight drop from the chosen panel would cross the city chips at almost every width, so the thread goes around them:
1. It starts with a dot at the chosen panel's lower right corner.
2. It runs left along that panel's foot, just outside its frame, and on across the gap to the page margin.
3. It turns down the margin, 8 px (phone) to 20 px (desktop) outside the content, past the filters.
4. It ties in with the two interlaced rings where it meets the result line.
5. It runs along the result line to its end.

So the line reads choice → filters → result as one gesture, and the knot under the rings echoes the symbol's open centre. The same applies when VNest's "All" panel is chosen: VNest is then tied to all six.

**Motion.** On each new choice the thread draws from the panel to the result line (480 ms), and the rings tie as it arrives (240 ms, starting 180 ms in). A resize only re-measures; it does not replay. With reduced motion the thread is simply there.

**What it is not.** It is decoration. It is hidden from assistive technology and never takes a pointer event, and the olive frame alone still carries the chosen state. Copper is 3.95:1 on white and 3.76:1 on paper, so it passes the 3:1 for graphics but stays out of text.

**Checked** (`docs/qa/brand-collection/thread.json`): at 360, 390, 768, 1024, 1440 and 1920 px, for All, each brand, and Bare + Đà Nẵng, the thread starts at the chosen panel's foot, ends on the result line, crosses 0 controls, and adds 0 px of horizontal overflow. It also follows a live resize from 1440 to 600 px, and with reduced motion it has no animation. Section height and the distance to the first card are unchanged from the original A.

**Open for your review.** On phones the vertical run sits 8 px from the screen edge. It is subtle by intent, but you may find it too close to the edge or too quiet. The alternatives would be a thicker line, or running it only from tablet width up.

## 12. Refinement 1 of Concept B, the owner's choice (15/10/2026)

The brief for this pass: give the partner logos more presence without distorting them, cut vertical space and repeated information, keep the stage responsive to the choice, keep all six cards easy to reach, design a compact phone layout, and keep City and Area clear. The idea is unchanged: the thread through the index, the rings on the chosen entry, one stage. The first version is kept at `/b-original`, with its captures in `docs/qa/brand-collection/b-original/`.

### What changed

| | Before (`/b-original`) | Now (`/b`) |
|---|---|---|
| Logos in the index | 32 px on desktop; none on phone or tablet (names only) | 40 px on desktop; 22 px on phone and 28 px on tablet, in every entry |
| Chosen logo on the stage | 40 px desktop, 32 px tablet and phone, in a caption column | 56 px desktop, 40 px tablet, 32 px phone, on its own light plate under the picture |
| Stage picture | one picture of the brand | one slice per place of the chosen brand (Bare shows four; places outside the chosen city or area turn grey); for "all", one labelled slice per brand |
| Repeated information | count shown in the index, again on the stage, again on the slices; the stage listed the places that the cards list below | each count appears once, in the index. The stage shows the logo, where the brand is and the story slot. The cards name the places |
| Filters and result, desktop | two rows | one row: city and area on the left, result and "Bỏ lọc" on the right |
| Phone heading | two lines | one line (22 px) |
| City and Area, phone | chips (one row) plus a select (another row) | two labelled native selects in one row: "Thành phố: Tất cả (6)", "Khu vực: Chờ xác minh" |
| Cards, phone | one column | two columns |
| Stage height | changed with the choice (phone +109 px for Bare) | fixed: nothing below moves |

### Measured (`docs/qa/brand-collection/measurements.json`)

| | Section top to first card | First card visible when the section reaches the top | Section top to the end of the sixth card |
|---|---|---|---|
| Phone 390, before | 649 px (all) to 758 px (Bare) | 195 to 86 px | 2,638 px (3.1 screens) |
| Phone 390, now | 533 px, any choice | 311 px | 1,113 px (1.3 screens) |
| Desktop 1440, before | 631 px | 269 px | 1,329 px |
| Desktop 1440, now | 571 px | 329 px | 1,269 px |

### Logos: what "more presence without distortion" means here

Every logo sits in the slot defined in §4: a fixed height, `contain`, at most 3.5 times as wide as it is tall, a quarter of the height as clear space, a light ground, and the logo's own colours. The phone index slot is the smallest at 22 px. A long horizontal wordmark will read there; a stacked or highly detailed logo may not. Please check that with the real files when they arrive, before this is approved. On a phone, the placeholders show the short names ("Bare", "The Nắng", "Pepper House"). That is placeholder text only: no logo was drawn.

### Unchanged

The same filter code and URL behaviour; the conflict note; the radio group with arrow keys, Home, End and one tab stop; reduced motion; contrast; the hero stub. A (with its thread) and A as first reviewed remain at `/a` and `/a-original`.

### Open questions

1. The headline "Ba thương hiệu, một sợi chỉ nối." is still draft copy.
2. The tablet range (768 px) is the tallest: 682 px to the first card, because the index logos sit above a stage that is wider than it is tall. It was not part of this pass (1440 and 390 only), but it should be looked at with real imagery.
3. Next, as you set out: real content from `VNest_Information.xlsx` and verified property imagery.
