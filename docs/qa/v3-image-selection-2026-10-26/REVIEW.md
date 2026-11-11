# V3 image selection: hero, property covers, room covers (26/10/2026), IN REVIEW

Owner brief of 26/10 plus the 17-file handoff in `.local-media/vnest-hero-selection/vnest-selected-images/`
(`mapping.csv`, `README_HANDOFF.md`). Private local review only; nothing committed, pushed or deployed.

## Where the image data lives

| What | File |
| --- | --- |
| Registry: 17 images (file, SHA-256, room, alt, crops), hero order, property covers, room mapping, holds | `src/content/vnest-workbook/image-selection.ts` |
| Server reader for the derived files (fails closed on a hash mismatch or a hold) | `src/content/vnest-workbook/selection-photos.ts` |
| Derivatives script (checks registry against mapping.csv, skips held images) | `docs/content/selection/derive-selection.mjs` |
| Derived files and their own manifest (git-ignored) | `public/dev-client-media/selection/` |
| Provenance record (no image data) | `docs/content/selection/media-record.json` |

The older manifest (`public/dev-client-media/manifest.json`) is not read or rewritten by the new script.

## Mapping as built

- Hero (6 slides, in order): 1 Bare Chic One, 5 Bare Hyphen Two, 9 Bare Đa Kao Four, 11 Bare Hàn Two, 13 Pale Blue Eyes, 17 Pepper House 4th Floor.
- Property covers: Bare Chic 1, Bare Hyphen 5, Bare Đa Kao 9, Bare Hàn 11, The Nắng Suites 13, Pepper House 17
  (homepage cards and brand panel, booking results, "other stays" cards on property pages).
- Room covers: as the brief, except **Bare Chic Two**: image 2 shows a person and is held (Q15, same photograph as
  RELEASE_HOLDS `bare-chic-two-2-32`); it is not derived, so it cannot be served. The room keeps its earlier cover (2.3.png).
- Pepper House 3rd Floor is one room with images 15 then 16, then its earlier photograph. No new room or unit.
- Existing room galleries are kept; the selected photograph leads. Image 1 is the same photograph as `bare-chic-one-1-42`
  and image 14 the same as `nang-blue-moon-18` (pixel comparison); the older copies are dropped so nothing repeats.
- Surfaces: homepage, `/dev/demo/tim-phong` and `/dat-phong` (room cards and drawers), `/dev/stays/bare-chic` and
  `/dev/stays/the-nang-suites` (room collection, drawers, grouped gallery). Not changed: the property pages' opening frames,
  the About section's photographs, the archived `/dev/stays/bare-chic-20-10` and `/dev/brand-collection/*` prototypes.

## Hero

4.5 s per slide, 600 ms cross-fade, loops; pauses on mouse hover, keyboard focus or booking-bar focus; a dot, arrow or
swipe holds rotation for 3 s, then it carries on (next change about 7.5 s later); the pause button stays the guest's
lasting choice. One crop per breakpoint (phone < 48rem, tablet 48–64rem, desktop ≥ 64rem). Overlay slightly darker;
phones get a vertical shade because the headline spans the width there. Slide 1 loads with high priority; slide 2 after it;
the rest only when reached. Swipe fix: `touch-action: pan-y pinch-zoom` on the hero (touch browsers were cancelling the
drag before it ended).

## Evidence (`scripts/qa.mjs`, headless Chrome against the dev server on :3401; `results.json`)

All checks pass: six slides in order; measured gaps 4510/4512 ms; fade 0.6 s; hover pause; resume 7.24 s after "next"
(desktop), 7.52 s after a swipe and 7.27 s after a tapped dot (390 px); only slides 1–2 mounted at first; image 02 never
requested; no page errors; no horizontal overflow at 390. Typecheck, lint (0 errors) and 332/332 tests pass.

Screenshots: `hero-1440-all.jpg`, `hero-768-all.jpg`, `hero-390-all.jpg` (every slide), `shots/property-cards-*.jpg`,
`shots/room-cards-*.jpg`, `shots/bare-chic-rooms-1440.jpg`.

## Open for the owner

1. Image 2 (Bare Chic Two, a person): show it once image-use permission is confirmed? Lifting the hold is one line in the registry.
2. Image 3 is `1.59.png`, which Drive listed in both Bare Chic One's and Three's folders (Q6). The handoff assigns it to
   Bare Chic Three, and it is shown there. Please confirm this settles Q6 for that file.
3. Property pages' opening frames still use their earlier photographs (an approved layout). Should they switch to the covers too?

Unrelated, seen while testing: an unstyled "Điều hoà nhiệt độ" span at the very bottom of `/dev/stays/bare-chic`
(document y ≈ 19 000 px). Not touched.
