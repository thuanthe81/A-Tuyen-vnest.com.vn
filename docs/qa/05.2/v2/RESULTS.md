# 05.2 Bare Chic property detail on workbook v2: results

Date: 20/10/2026. Status: **built, awaiting the owner's review.** Exploration only: not approved, not frozen, nothing committed.

**Preview.** `http://localhost:3400/dev/stays/bare-chic` on the **`vnest-v2-client-preview`** launch configuration: a production build started with `DEPLOY_ENV=development CONTENT_SOURCE=client-draft BOOKING_PROVIDER=none`. Run `npm run build` first.

- Public price mode: `…/dev/stays/bare-chic?price=public`.
- Evidence: the screenshots and `results.json` in this folder, from [`../scripts/v2.mjs`](../scripts/v2.mjs).
- Source data: [`../../../content/WORKBOOK-V2-SOURCE-DIFF-2026-10-20.md`](../../../content/WORKBOOK-V2-SOURCE-DIFF-2026-10-20.md).

**Route.** The prototype stays at the route of checkpoint 1, `/dev/stays/bare-chic`, the convention the 05.2 plan set. No second route was created, and no production route was changed. Checkpoint 1's evidence (`../cp1/`) is untouched.

## The page

Sections, in order:

1. **Hero.**
   - The photograph comes first: Bare Chic One, edge to edge on phones.
   - Then "Bare Boutique Stays" as a small label, **H1 "Bare Chic"**, the address as supplied, and **"Xem phòng trống"**.
   - VNest, the masterbrand, is the wordmark of the frozen criteria bar above.
   - From 768 px, a four-room index ("4 phòng", 01–04) sits beside the photograph. Each name links straight to its room.
2. **Về Bare Chic.** E4 word for word, in two paragraphs. A Bare Indochine window-seat photograph sits beside it; the text ends on the window and the sofa.
3. **Hình ảnh.** Six photographs, each captioned with its room.
   - Phones: one row that scrolls sideways, with the next frame peeking in.
   - Wider screens: an editorial grid (one tall frame, two beside it, then three).
   - Each photograph opens a viewer: a native modal dialog with arrow keys, Escape, two buttons, and focus returned on close.
4. **Tiện nghi.** The five supplied items, without icons, and "VNest đang hoàn thiện danh sách tiện nghi" (F4 ends in ",..").
5. **Các phòng (`#rooms`).**
   - One line: "Đặt phòng trực tuyến chưa sẵn sàng. Chưa có hệ thống đặt phòng nào được kết nối."
   - Then the four rooms as a list, each with its own photograph.
   - Bare Chic One, private preview only: "Giá tham khảo · Ngày thường 1,100,000 · Ngày cuối tuần 1,200,000".
   - Every other room, and every room in public mode: "Giá đang cập nhật".
6. **Vị trí.** The address, "Xem bản đồ ↗" (J4, verified) and "Di chuyển: Grab, đi bộ, xe bus".
7. **Phone pill.** "Xem phòng trống" appears once the hero action has scrolled away and hides while the rooms are on screen.

**Left out on purpose:** policies, nearby places, room type, size and capacity, any former district, any currency or "per night", and availability. Each is explained in the source-diff report.

## Checks (390 × 844, 768 × 1024, 1440 × 900; reduced motion on)

| Check | 390 | 768 | 1440 |
|---|---|---|---|
| Horizontal overflow | 0 px | 0 px | 0 px |
| H1 "Bare Chic", only one | ✔ top 587 | ✔ top 499 | ✔ top 443 |
| "Xem phòng trống" in the first screen | ✔ 718–770 | ✔ 647–699 | ✔ 711–763 |
| CTA → `#rooms` (rooms top after the jump) | ✔ 96 px | ✔ 96 px | ✔ 96 px |
| Cumulative layout shift (page load, then a full scroll) | 0 | 0 | 0 |
| Controls under 44 px tall | none | none | none |
| Figures on the page, private | 1,100,000 · 1,200,000 | same | same |
| Figures on the page, `?price=public` | **none** | **none** | **none** |
| Never-stated strings (Quận 1, 28m2, 2 người lớn, nearby names, 14:00, 12:00, Chính sách, VND, ₫, /đêm, còn phòng…) | none found | none | none |
| Map links | J4 only | J4 only | J4 only |
| Viewer: opens, focus inside, → moves, Esc closes, focus returns | ✔ | ✔ | ✔ |
| Phone pill: hidden at the hero, shown mid-page, hidden over the rooms | ✔ | n/a (phones only) | n/a |
| Page errors, console errors | 0 | 0 | 0 |
| `robots` | noindex, nofollow | same | same |
| JSON-LD | 0 | 0 | 0 |

**Landmarks and headings.** There is one `main`. Two named `nav` elements: the criteria bar's "Tất cả cơ sở", and "Các phòng của Bare Chic" (the room index). The heading order is H1, then H2 Về Bare Chic, Hình ảnh, Tiện nghi, Các phòng (with H3 for each of the four rooms), then Vị trí.

**Keyboard (1440, from the top).** The order is: the review link, VNest, the criteria bar's four fields, Tất cả cơ sở, the four room links, Xem phòng trống, then the six photographs, then Xem bản đồ. Every stop shows a focus ring (2 px olive, or paper on the dark viewer).

**Images.**
- Only the hero is loaded eagerly, with priority; all others are `loading="lazy"`.
- Every image has a reserved aspect ratio (CLS 0).
- At 390, two photographs at the far end of the sideways row are, correctly, not loaded until scrolled to.
- Photographs inside viewer buttons have an empty `alt`; the button's accessible name carries the description ("Xem lớn: Bare Chic Two: giường, TV treo tường…"), so it is not read twice.
- Next serves AVIF or WebP at the requested width.

**Reduced motion.** The only motion is the pill's 160 ms fade, which drops to 0 ms. Smooth scrolling is not used.

## Regression and safety

| Check | Result |
|---|---|
| `/a`, `/a-original`, `/b`, `/b-original` at 390, 768, 1440 (all brands, and Bare chosen) | **24 of 24 identical** to the build before this change (`../../brand-collection/b-client/regression/v2-before` vs `v2-after`; `v2-before` was first checked against a repeat, 0 differences) |
| `/b-client` | Differs only where the source changed: the review line (v2 file name and date), and the Bare Hàn and The Nắng Suites placeholder reason. Page sizes are identical. Details in the source-diff report §8 |
| 02.1 booking bar, booking contracts, 02.2, `/stays` routes | `git diff HEAD` of `src/features/booking-search`, `src/features/availability`, `src/features/property-page`, `src/domain/{booking,ports,availability}.ts`, `src/integrations`, `src/app/stays`: **empty**. `src/config` and `src/server` still show only checkpoint 1's uncommitted D1 change, untouched this session |
| Client media | Nothing staged. No file under `public/dev-client-media/` or `.local-media/` is tracked (both git-ignored). Originals re-hashed: **9 of 9** match `docs/content/g2/media-record.json`. Nothing new downloaded |

## Departures from checkpoint 1 and the 05.2 plan, for your decision

1. **Rooms are not 02.2's room selection.** In checkpoint 1, 02.2's selection rendered its own room list. The brief needs per-room reference prices, which 02.2 cannot show without changing it, and two room lists would repeat each other. The prototype therefore has its own room list with an honest "not connected" line. The frozen criteria bar remains the way into the booking journey, and it is unchanged. When a PMS is connected, these blocks become 02.2's compact variant (05.1 checkpoint 5).
2. **No "Giá tham khảo" beside the hero CTA (D3).** v2's per-room rule gives a price to Bare Chic One only. A single figure in the hero would read as the property's price.
3. **No "Quận 1", no nearby list, no policy placeholder line.** These follow the new brief.
4. **No hero introduction.** The full description is the story section, so quoting sentences 2–3 above it would repeat it.

## Still needed from VNest

- **Content:** Q22 (Đa Kao map), Q23 (room facts), Q24 (merged rates), Q25 (policies), Q26 and Q27 (wording), Q28 (nearby), plus the open Q8, Q11–Q13, Q15–Q17 and Q21.
- **Photographs:**
  - None of the property itself: no exterior, entrance, staircase or shared space (Q16).
  - Unwatermarked originals (Q15); all six carry Bare's watermark.
  - Rights for any public use (Q15).
- **Logo:** Bare Boutique Stays (Q17). The page uses text.
- **Video:** none.

## Commands

| Command | Result |
|---|---|
| `npm run lint` | 0 errors. 3 warnings, all in earlier QA scripts under `docs/qa/` |
| `npm run typecheck` | Clean |
| `npm test` | **254 of 254** pass (245 before this milestone; tests were updated where the 15/10 data was encoded, and new ones added for v2, per-room rates, the draft record and the page view) |
| `npm run build` | Succeeds |
