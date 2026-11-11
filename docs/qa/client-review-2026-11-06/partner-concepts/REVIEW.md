# Hợp tác cùng VNest — redesign exploration (8/11/2026)

> **Decision, 9/11/2026:** the client chose Concept B. It is now the homepage section, and a dedicated partner page was
> built: see `docs/qa/partner-page-2026-11-09/REVIEW.md`. The previews below remain for reference; Concept A was not
> chosen.

Status (8/11): **two isolated previews built, awaiting the owner's visual acceptance.** The approved homepage section
(`OwnerJourney.tsx`) is unchanged; nothing is integrated, staged or committed.

| Preview | URL (local dev server) |
|---|---|
| Concept A · Editorial Service Showcase | http://localhost:3401/dev/partner-concepts/a |
| Concept B · Visual Accordion | http://localhost:3401/dev/partner-concepts/b |
| Approved section, for comparison | http://localhost:3401/dev/demo?intro=0#hop-tac |

Add `?lang=en` for English and `?dich-vu=tu-van-mo-hinh` / `nhuong-quyen` to open a service. A slim dark bar above each
preview switches between A, B, the approved section and the language (review chrome, not part of a concept). Both routes
are `noindex` and answer 404 outside local development (same `reviewAccess` rule as `/dev/demo`).

## Reference (M Village development site)

Principles taken, not layouts: a large image leads each idea; one consultation action repeated; a brand-family wall
of logos; a numbered structure. Not taken: its numbers and claims ("50+ hotels", payback figures), its icon cards, its
orange CTA, its wording.

## Content

All service text is read from `src/features/demo/owner-journey.ts` (client 05.11 Final): titles, sub-title, card lines,
expanded descriptions (unshortened), Key Highlights, CTA labels. No copy is duplicated. QA compares every description
and CTA, in both languages, with what the approved section shows: identical.

New words (build team DRAFT, in `partner-concepts.ts`):
- Photo note "Ảnh minh hoạ · Pepper House" / "Illustration · Pepper House": it marks the photograph as an illustration,
  not as proof of a result.
- English alt text for the photograph (the registry's alt is Vietnamese).
- Labels "Brand Franchising" and "VNest Management" on the brand composition: the two halves of the client's own phrase
  "Brand Franchising + VNest Management" (03's description, both languages). Not new copy.
- Review-bar labels (preview only).

Key Highlights: shown only in 02's planning sheet, as the three notes of its three layers, on wide frames. Elsewhere
they stay as data (they restate the descriptions). Card lines: shown in Concept B's rows; not in Concept A.

## Concept A — Editorial Service Showcase (preferred direction)

- **Desktop:** two columns. Left: the existing overline and heading, then three service rows at the foot of the column
  (index, name, 02's sub-line). The chosen row has a copper rule drawn across its top edge, its name in olive, and a
  copper arrow. The other rows are muted taupe. No cards, borders or shadows. Right: one story panel. The visual is on
  top; the client's description sits in a beige block cut into the visual's lower-left edge, so text and image read as
  one editorial composition. The CTA sits at the panel's foot, level with the last service row.
- **Phones/tablets:** heading, a compact three-part selector (index and name, copper underline on the chosen one), the
  visual (3:2 phone, 2:1 tablet), the description, the CTA (full width on phones).
- **Behaviour:** WAI-ARIA tabs with automatic activation; arrows, Home and End; one tab stop. The three panels share one
  grid cell, so the section keeps the height of the tallest. Changing service moves nothing on the page: 886 px at
  1440 and 1008 px at 390 for all three services. Hidden panels are `inert`. 220 ms cross-fade; none with reduced motion.
- **Height:** 886 px desktop (approved section: 782–881 px); 1008 px on a 390 px phone (approved: 1208–1321 px). It is
  the shortest of the three on phones.

## Concept B — Visual Accordion

- **Desktop:** three full-width rows between hairlines, like a contents page: a large light copper index, the name,
  the client's card line, and a round + toggle. The open row reveals the visual on the left and the description and CTA
  on the right, aligned under the name. With a row open, the other names step back to taupe. The toggle turns into an
  olive ×.
- **Phones:** index, name and card line, with the toggle on the right. Opening a row shows the visual, the description
  and a full-width CTA.
- **Behaviour:** disclosure buttons inside h3 headings (aria-expanded / aria-controls); closed content is `inert`. One
  row open at a time; choosing the open row closes it. The opening row grows over 300 ms (none with reduced motion).
  When a row above the chosen one closes, it closes at once and the page scrolls by the same amount, so the row under
  the pointer stays where it was.
- **Height:** 1167–1192 px on desktop and 1242–1324 px on a 390 px phone; it changes with the open service.

## Visuals (shared by both concepts, `ServiceVisual.tsx`)

- **01 Hospitality Management:** the owner's selection photograph n° 16, Pepper House 3rd floor living area, served
  from the local derived copies (avif, webp and jpg srcset). It has no watermark and no people. It is labelled as an
  illustration and carries its alt text. If a machine has no derived copy, the frame stays plain olive, with no
  stand-in image.
- **02 Project Development:** a planning sheet on dotted paper.
  - The layers: an irregular site with a survey point, a building with rooms of different sizes around a corridor
    (two rooms toned copper), and a dashed copper boundary for partner work.
  - On wide frames, copper leader lines link each layer to one of the client's three highlights.
  - On narrow frames, the drawing appears alone.
  - It has no dimensions, numbers or project names.
- **03 Brand Franchising:** on olive, the official Bare Boutique Stays and Pepper House logo files sit on paper tiles,
  bracketed as "Brand Franchising", then "+", then VNest, labelled "VNest Management".
  - The VNest logo is the approved symbol over the approved wordmark, in the proportions of VNest's stacked lockup.
  - The layout reads as a sum, not an organisation chart. The Nắng Suites is not included.
  - All logos are unaltered and decorative here; the description carries the meaning.

## CTA

Each CTA links to the approved homepage form: `/dev/demo?intro=0&dich-vu=<service>#tu-van` (plus `&lang=en`). The
homepage already reads `?dich-vu=`, so the form opens with that service chosen and in view. QA checks this for every
service, concept and language. The form remains non-operational (no backend). When a concept is integrated, the
components accept `onCta(service, event)`, so the section's own handler can scroll to the form without a page load,
as it does today.

## Quality review: what changed before delivery

- The Bare and Pepper House logos overflowed their tiles (percentage heights inside the grid). They are now sized from
  the tile.
- The brand tiles were too small on phones. They are now larger, and the "VNest Management" label wraps instead of
  running past the frame at 375 px.
- At 1024 px, A's description block covered the lower part of the planning drawing. The visuals now centre in the area
  above the block (a `--reserve` property on the frame).
- A's desktop frame shadow showed around the cut-out and was removed. The CTA alignment on tablet and desktop was
  corrected.
- In B, "Nhượng quyền thương hiệu" wrapped with a single word on the second line; the title wrap is now balanced. B's
  frame is 5:4 between 1024 and 1280 px, so it balances the longer text.

## QA

`scripts/qa-partner-concepts.mjs` ran at 375, 390, 430, 768, 1024 and 1440 px, in Vietnamese and English: **1082
passed, 0 failed** (`qa-results.txt`). It checks:
- Every service opens, with its own visual and its own description, CTA and title, identical to the approved section.
- Exactly one CTA is visible.
- The service is kept in the address.
- There is no horizontal overflow and no clipped text, and nothing is drawn outside its frame.
- A's section height is identical for all three services.
- B's chosen row stays put, measured with homepage-like content above. At the very top of a page nothing can scroll up,
  which is why the test adds that content.
- Keyboard: A's arrows, Home, End and wrap-around, a single tab stop, and Tab reaching the visible CTA; B's Enter and
  Space, Tab reaching the open row's CTA, and no CTA reachable with every row closed.
- Reduced motion: no transitions; with motion allowed, transitions are 300 ms or shorter.
- Only the Bare and Pepper House official logos appear, with no The Nắng Suites artwork, and the photograph has alt
  text.
- Both pages are noindex.
- Each CTA lands on the approved form with the right service chosen, the form in view and the right language.
- There are no console or hydration errors.

Also: lint 0 errors (the 3 old warnings remain), `tsc` passes, unit tests 438/438, homepage-content e2e 11/11. No file
outside the new preview files changed in this round.

## Files

New only:
- `src/features/partner-concepts/`:
  - `partner-concepts.ts`, `service-photo.ts`, `remember-service.ts`
  - `ServiceVisual.tsx` and `.module.css`
  - `PartnerShowcase.tsx` and `.module.css` (Concept A)
  - `PartnerAccordion.tsx` and `.module.css` (Concept B)
- `src/app/dev/partner-concepts/`: `preview.tsx`, `preview.module.css`, `a/page.tsx`, `b/page.tsx`
- `docs/qa/client-review-2026-11-06/scripts/`: `qa-partner-concepts.mjs`, `shots-partner-concepts.mjs`
- `docs/qa/client-review-2026-11-06/partner-concepts/`: this file, `qa-results.txt` and the screenshots

## Screenshots (this folder)

- `concept-a-desktop-0{1,2,3}-*.png`, `concept-b-desktop-0{1,2,3}-*.png`: 1440 px, each service.
- `concept-{a,b}-mobile-0{1,2,3}-*.png`: 390 px at 2x; `sheet-concept-{a,b}-mobile.png` shows the three side by side.
- `concept-{a,b}-{768,1024}-03.png`; English: `concept-{a,b}-desktop-en-02.png`, `concept-{a,b}-mobile-en-03.png`.
- `approved-{desktop,mobile}-{01,03}.png`; `compare-desktop-03.png` and `compare-mobile-03.png` (approved · A · B).

## Recommendation

**Concept A.**
- It changes the section from a list of services into one composed story: a picture, a sentence of context and one
  action, with the three services always in view as a quiet index.
- It is the only option whose height does not change with the service.
- It is the shortest on phones, about 200–300 px shorter than the approved section.
- It keeps one fixed CTA position, which is the conversion point.

B is the better fit if the owner wants the three services to read as equal headlines and the card lines visible. It is
taller and its height changes with the open row.

Open points for the owner:
- The photo-note wording and the English alt are drafts.
- The choice of photograph: n° 16 is a Pepper House room, used as a generic illustration of operations.
