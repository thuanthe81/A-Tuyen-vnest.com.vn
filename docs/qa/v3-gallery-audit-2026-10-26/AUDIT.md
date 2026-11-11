# Room gallery audit after the image selection (26/10/2026)

**Result: no gallery was shortened. No gallery code was changed in this round** (one consistency fix in the audit path, below). Every room exposes every
distinct photograph it exposed before 26/10, with the selected image first. The only items taken out
were two exact duplicates: `bare-chic-one-1-42` and `nang-blue-moon-18`, which are pixel-identical to
selected images 01 and 14. The galleries are short because most workbook-linked Drive files were
never authorised or fetched. That gap is upstream of this work and is listed below.

Sources: `scripts/audit.ts` → `audit.json` (code level; "before" = same code with the selection
switched off) and `scripts/ui.mjs` → `ui-counts.json` (rendered pages, 1440 / 768 / 390).

## Photo count per room

Drive = files in the room's workbook-linked folder. Approved before = shown before 26/10. Now = room carousel, room
drawer and full-screen viewer (all equal at all three widths).

| Property | Room | Drive | Approved before | Now in UI | Cover | Held (people) |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Bare Chic | Bare Chic One | 6 | 3 | 3 | 01 (= 1.42, older copy removed) | 1.11.png |
| Bare Chic | Bare Chic Two | 6 | 5 | 5 | 2.3.png kept (02 held) | 2.32.png = image 02 |
| Bare Chic | Bare Chic Three | 6 | 3 | 4 | 03 | 1.18.png |
| Bare Chic | Bare Indochine | 5 | 5 | 5 | none selected | — |
| Bare Hyphen | Bare Hyphen One | 6 | 1 | 2 | 04 | — |
| Bare Hyphen | Bare Hyphen Two | 4 | 0 | 1 | 05 | — |
| Bare Hyphen | Bare Hyphen Three | 6 | 0 | 0 | none selected | — |
| Bare Hyphen | Bare Hyphen Four | 5 | 0 | 0 | none selected | — |
| Bare Đa Kao | Bare Đa Kao One | 5 | 1 | 2 | 06 | — |
| Bare Đa Kao | Bare Đa Kao Two | 6 | 0 | 1 | 07 | — |
| Bare Đa Kao | Bare Đa Kao Three | 6 | 0 | 1 | 08 | — |
| Bare Đa Kao | Bare Đa Kao Four | 6 | 0 | 1 | 09 | — |
| Bare Hàn | Bare Hàn Ground | 6 | 1 | 2 | 10 | — |
| Bare Hàn | Bare Hàn One | 6 | 0 | 0 | none selected | — |
| Bare Hàn | Bare Hàn Two | 5 | 0 | 1 | 11 | — |
| Bare Hàn | Bare Hàn Three | 5 | 0 | 1 | 12 | — |
| The Nắng Suites | Yellow Submarine | 5 | 2 | 2 | none selected | — |
| The Nắng Suites | Pale Blue Eyes | 5 | 1 | 2 | 13 | — |
| The Nắng Suites | Green River | 5 | 1 | 1 | none selected | — |
| The Nắng Suites | Blue Moon | 7 | 3 | 3 | 14 (= 18.png, older copy removed) | 4 (1).png, 24.png |
| Pepper House | Pepper House 3rd Floor | 6 | 1 | 3 | 15, then 16 (one room) | — |
| Pepper House | Pepper House 4th Floor | 6 | 0 | 1 | 17 | — |

Totals: 123 Drive files listed; 27 shown before 26/10; 41 now; 5 held for people.
"Xem tất cả … ảnh": Bare Chic 17 (3 + 5 + 4 + 5), The Nắng Suites 8 (3 + 2 + 2 + 1). Both match the rooms.

## Not on this machine (gap, by source folder)

These files are listed in the workbook-linked folders but were never authorised or fetched. Nothing was
downloaded to fill them. Folder ids are in `audit.json`, and file names and Drive ids are in
`docs/content/vnest-client-data.draft.json` (15/10) and `nang-folder-listing-2026-10-26.json` (read 26/10,
metadata only).

- Bare Chic One: 1.56.png, 1.59.png. Both also sit in Bare Chic Three's folder (Q6); 1.59.png is shown in Three as image 03.
- Bare Chic Three: 1.56.png (Q6).
- Bare Hyphen One: a-10, a-17, a-21, a-25. Bare Hyphen Three's folder lists the same six files as One, so the room is uncertain (existing note).
- Bare Hyphen Two: a-59, a-64, a-70. Bare Hyphen Four: 6, 10, 14, 16, 25 (all five).
- Bare Đa Kao One: _23, _28 (4), _28 (8). Two: _30 (1), (10), (11), (12), (16). Three: _29 (6), (18), (20), (21), (22). Four: _31 (1), (12), (17), (20), (23).
- Bare Hàn Ground: 30, 31, 42, plus 36.jpg, which is on this machine and was inspected 23/10 but never approved for display. Bare Hàn One: all six (6, 7, 9, 11, 13, 15). Two: 52, 53, 58, 61. Three: 73, 81, 82, 84.
- Yellow Submarine: 6, 9, 11. Pale Blue Eyes: 3, 6 (1), 7 (1). Green River: 4, 5, 7, 9. Blue Moon: 10, 15.
- Pepper House 3rd Floor: 02, 04, 09. 4th Floor: pepperhouse-72 (1), -72, -76, -79, -81.

To fill these galleries, the owner would authorise named files for private local review. The existing
pipeline then fetches them, checks each one against its Drive size, and records its hash.

## QA (rendered, headless Chrome, dev server :3401)

All checks pass at 1440, 768 and 390 (`ui-counts.json`):

- **Count and order:** every room card on Booking Results (22 rooms) and on the Bare Chic and The Nắng Suites pages (8 rooms) shows the audit's count, in the audit's order.
- **Images:** every photograph was stepped through and loads; no duplicates in a room; every image is `object-fit: cover` (no stretching).
- **Navigation:** desktop and tablet arrows (real mouse clicks) advance one photograph each; phone swipe (touch events) advances one photograph each.
- **Pagination and viewer:** the dots, the room drawer counter and the full-screen viewer all match each room's total.
- **Errors:** no page errors and no failed image requests.
- **Hero:** still six slides; nothing in it changed since the previous QA (`docs/qa/v3-image-selection-2026-10-26`).
- **Booking:** selection and room details code untouched in this round.

## One small code fix

`buildBookingResultsCatalog(manifest, selection)` now also resolves Bare Chic's selected photographs from
the `selection` it is given (it read the default selection file before). With the files present, the
output is identical. The fix only makes the audit's "before" (selection off) accurate for Bare Chic.

## Found in passing, not changed

On the property pages, the full-screen viewer ("Xem tất cả … ảnh", room photo viewer) renders without
its styles. The dialog has no classes, because `PropertyDetail.module.css` is not applied to these client
components in dev. The photographs and counts are all there, but the viewer looks like plain text
around a large photo. The 24/10 Stage 1 evidence (`docs/qa/v3-stage1-2026-10-24/after/qa-1440-viewer.png`)
shows the same, so it predates the image work.
