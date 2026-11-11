# 05.2 Bare Chic: refinement of 20/10/2026, results

Status: **built, awaiting the owner's review.** Not approved, not frozen, nothing committed. **Updated the same day with G4 (§ G4 below): 19 photographs instead of 6.**

## Where to look

| What | URL (on the `vnest-v2-client-preview` configuration, port 3400) |
|---|---|
| Refined prototype | `http://localhost:3400/dev/stays/bare-chic` |
| Refined prototype, public price mode | `…/dev/stays/bare-chic?price=public` |
| The 20/10 first build, kept for comparison | `http://localhost:3400/dev/stays/bare-chic-20-10` |
| Checkpoint 1 | Evidence only: [`../cp1/`](../cp1/RESULTS.md). The route has since moved on, so it is not served |

**Evidence.** The screenshots and `results.json` in this folder, from [`../scripts/v2-refine.mjs`](../scripts/v2-refine.mjs). The script also runs the galleries.

**Comparison captures.** The preserved route was captured into `preserved-20-10/` by [`../scripts/v2.mjs`](../scripts/v2.mjs), which now accepts `ROUTE`. Its first-screen layout matches the 20/10 evidence: the CTA sits at the same position at every width, and the heading list is the same apart from one record-level change, "Về Bare Chic" → "Giới thiệu". Pixel differences come only from three sources:
- the notice line, which now names the page as the 20/10 copy;
- that heading;
- photograph rasterisation, which has varied between runs since G2.

## What changed

| Area | Before (20/10) | Now |
|---|---|---|
| **Top of the page** | One large photograph (Bare Chic One) | **A gallery.** All six photographs, each labelled with its room. Phones: a full-width row that swipes, with a counter ("1/6"). From 768 px: a mosaic of one large tile and four small ones. "Xem tất cả 6 ảnh" opens the viewer |
| **Viewer** | One flat sequence; captions named the room | **Two views.** A grid grouped under room headings ("Bare Chic One · 2 ảnh" …), and single photographs with "Bare Chic Two 3/6". Arrow keys, two buttons, horizontal swipe, Escape. "Tất cả ảnh" returns to the grid with focus on the photograph you came from. The page cannot scroll behind it. Focus returns to the opener |
| **Room galleries** | None | **Each room card has "Xem ảnh phòng (n)"**, which shows that room's photographs only: One (2), Two (1), Three (1), Bare Indochine (2). The card picture opens the same viewer for pointer users. Counts come from the data, and none is padded |
| **Photographs section lower down** | "Hình ảnh" grid | Removed: the gallery is at the top, and no photograph appears twice in a gallery |
| **Introduction** | No hero introduction; "Về Bare Chic" section with the full description and a photograph | **One verbatim sentence under the name**: "Đó là một ngôi nhà gồm bốn tầng mà mỗi tầng là một căn studio riêng biệt, hiện đại và tiện nghi." (E4, sentence 3; Q21). Below it, the rest of E4 verbatim with **no visible label** (`aria-label="Giới thiệu"`). Every sentence of E4 appears exactly once (tested) |
| **Primary action** | "Xem phòng trống" beside "Đặt phòng trực tuyến chưa sẵn sàng" | **"Khám phá các loại phòng"** in the hero and the phone pill, jumping to `#rooms`. "Xem phòng trống" is used only when a provider is connected (`view.cta`, tested). The rooms heading is now "Các loại phòng" |
| **Amenities** | Five text chips | **Three highlights with pictograms**: Bếp nhỏ, Wifi, Điều hoà nhiệt độ. Then "Xem tất cả 5 tiện nghi", a native `<details>` that works without script, with two groups: "Tại Bare Chic" (the five, as supplied) and "Riêng từng phòng" ("VNest chưa cung cấp tiện nghi riêng cho từng phòng"). "VNest đang hoàn thiện danh sách tiện nghi" stays |
| **Room cards** | A list of rows: photograph, name, price | **Comparable cards.** Four across from 1024 px, two at 768, compact rows on phones. Each has a photograph with a photo count, the name, specifications (none verified, so none drawn), the price state, and "Xem ảnh phòng (n)" at the foot of every card |
| **Review notes** | One notice line at the top | Shorter notice line. Dashed "Chờ VNest" notes under the amenities and the rooms list what is missing, with question numbers. **Private preview only.** They are absent from `?price=public` |

## Checks (390 × 844, 768 × 1024, 1440 × 900; reduced motion on)

| Check | 390 | 768 | 1440 |
|---|---|---|---|
| Horizontal overflow | 0 | 0 | 0 |
| One H1 "Bare Chic" | ✔ | ✔ | ✔ |
| "Khám phá các loại phòng" in the first screen (top–bottom px) | ✔ 715–767 | ✔ 680–732 | ✔ 764–816 |
| The action leads to `#rooms` (rooms top after the jump) | 96 px | 96 px | 96 px |
| "Xem phòng trống" anywhere on the page | no | no | no |
| CLS (load, then a full scroll) | 0 | 0 | 0 |
| Controls under 44 px tall | none | none | none |
| Figures, private | 1,100,000 · 1,200,000 (Bare Chic One only) | same | same |
| Figures, `?price=public` | **none** | **none** | **none** |
| Never-stated strings (Quận 1, 28m2, 2 người lớn, giường đôi, Studio ·, nearby names, 14:00, 12:00, VND, ₫, /đêm, còn phòng, About…) | none | none | none |
| Gallery tiles, all labelled by room | 6 (swipe row) | 5 + "Xem tất cả 6 ảnh" | 5 + "Xem tất cả 6 ảnh" |
| Gallery grid: groups and thumbnails | One 2 · Two 1 · Three 1 · Indochine 2 (6) | same | same |
| Grid → photo → ArrowRight → "Tất cả ảnh" → Escape | ✔ focus: "Tất cả ảnh", then the photograph's thumbnail, then the opener | ✔ | ✔ |
| Swipe on a photograph in the viewer (touch) | ✔ 3/6 → 4/6 | ✔ | n/a |
| Swipe on the phone gallery row (touch) | ✔ slide 1 → 2, counter "2/6" | n/a | n/a |
| Room galleries: captions show only that room; the count matches the button | ✔ One 1/2, 2/2 · Two 1/1 · Three 1/1 · Indochine 1/2, 2/2 | ✔ | ✔ |
| Page scroll locked while the viewer is open | ✔ | ✔ | ✔ |
| Amenities disclosure (keyboard Enter) | ✔ opens, "Thu gọn" | ✔ | ✔ |
| Phone pill: shown mid-page, hidden over the rooms | ✔ | n/a | n/a |
| Page and console errors | 0 | 0 | 0 |
| `noindex`, JSON-LD | noindex, 0 | same | same |

**Keyboard order (1440, from the top).**
1. The review link, VNest, and the four criteria-bar fields (02.1).
2. "Tất cả cơ sở".
3. The five visible gallery tiles, then "Xem tất cả 6 ảnh". The sixth tile is hidden from 768 px and is not a tab stop.
4. The four room links.
5. "Khám phá các loại phòng".
6. "Xem tất cả 5 tiện nghi".
7. The four "Xem ảnh phòng" buttons.
8. "Xem bản đồ".

Every stop shows a ring.

**Image labels.**
- Each gallery tile is a button named "Xem ảnh n/6: <alt>". The alt text names the room and says what the photograph shows.
- Inside the viewer, the photograph carries its own alt text. Thumbnails are named "Xem ảnh: <alt>".
- Decorative images inside named buttons have an empty `alt`, so nothing is read twice.
- Only the first gallery photograph loads eagerly; every other one is lazy.

**Regression.**
- `/a`, `/a-original`, `/b`, `/b-original`: **24 of 24 identical** to the 20/10 delivery (`v2-after` vs `v2-refine-after`).
- `/b-client` layout: **6 of 6 identical** (`v2-bclient-after` vs `v2-refine-bclient`).
- `git diff HEAD` is empty for `src/features/booking-search` (02.1), `src/features/availability`, `src/features/property-page`, `src/integrations` and `src/app/stays`.
- `src/domain` shows only checkpoint 1's earlier, uncommitted D2 change; this round did not touch it.
- Nothing is staged. No client media is tracked.

**Commands.**

| Command | Result |
|---|---|
| `npm run lint` | 0 errors; the same 3 warnings as before, in earlier QA scripts |
| `npm run typecheck` | Clean |
| `npm test` | **258 of 258** |
| `npm run build` | Succeeds. Routes: `/dev/stays/bare-chic`, `/dev/stays/bare-chic-20-10` |

## Verified content used

| On the page | Value | Source | Status |
|---|---|---|---|
| Name, brand | Bare Chic · Bare Boutique Stays | B4 | normalized / derived (Q13) |
| Address | 12/18 Nguyễn Thị Minh Khai · Phường Sài Gòn, Hồ Chí Minh | I4 | client-supplied; house number corroborated |
| Introduction | E4 sentence 3, verbatim | E4 | normalized (Q21) |
| Story | E4 sentences 1–2 and 4–5, verbatim | E4 | normalized (split only) |
| Amenities, property level | Bếp nhỏ, Phòng tắm riêng, Smart TV, Wifi, Điều hoà nhiệt độ (list incomplete) | F4, merged over F4:F7 | normalized (Q11) |
| Pictograms | kitchen, wifi, air-conditioning; neutral mark for Smart TV and Phòng tắm riêng | `AMENITY_ICON_CHOICES`, from the fixed list `AMENITY_ICONS` | **BMP's choice at your request, not VNest's (Q31)** |
| Room names | Bare Chic One, Bare Chic Two, Bare Chic Three, Bare Indochine | C4–C7 | client-supplied (Q12) |
| Room photographs | One: 1.55.png, 1.47.png · Two: 2.3.png · Three: 1.29.png · Indochine: 53.png, 54.png | Drive folder titles (D4–D7 folders); sha256 in `docs/content/g2/media-record.json` | client-supplied-pending (G2, G3) |
| Bare Chic One reference price (private only) | Ngày thường 1,100,000 · Ngày cuối tuần 1,200,000 | L4 | unverified (Q8, Q24) |
| Other rooms | "Giá đang cập nhật" | L5–L7 empty | missing |
| Transport | Grab, đi bộ, xe bus | K4 | client-supplied |
| Map | `share.google/fskgZreXVjowaoQCO` | J4 | corroborated |

**Room area, maximum occupancy, bed configuration and room-specific amenities are not shown for any room.** The v2 workbook does not supply them, and no client response has arrived. The card template has a slot for verified specifications (`RoomView.specs`); it is empty and tested to stay empty.

## Unresolved content dependencies

| Needed for | What | Ref |
|---|---|---|
| Room cards | Area, maximum occupancy and bed configuration per room (the 15/10 room sheet was withdrawn; its values are not reconfirmed) | Q23 |
| Room cards, amenities | Room-specific amenities; the complete property list (F4 ends in ",..") | Q11 |
| Room prices | Rates for Two, Three and Indochine, or confirmation that L4:L7 covers all four; currency, unit, tax, validity, permission to publish | Q8, Q24 |
| Amenities | VNest's confirmation of the three pictograms | Q31 (new) |
| Gallery | Any photograph of the property as a whole: facade, entrance, stairs, shared space. Until then the gallery is honestly a gallery of rooms | Q16 |
| Room galleries | More photographs per room (G4, below); unwatermarked originals; usage rights | G4, Q15 |
| Bare Chic One / Three | Which room 1.56.png and 1.59.png show: they are in both folders | Q6 |
| Introduction | A one-line tagline | Q21 |
| Naming | "Bare Indochine" as Bare Chic's fourth room | Q12 |

**Proposed G4: needs your explicit authorisation.** It would be the same scope as G2 and G3: private local review only, never committed or published.

These are the remaining Bare Chic files listed in the Drive folders on 15/10, **excluding 1.56.png and 1.59.png** until Q6 is answered:
- Bare Chic One: 1.11.png, 1.42.png
- Bare Chic Two: 2.4.png, 2.5.png, 2.9.png, 2.10.png, 2.32.png
- Bare Chic Three: 1.18.png, 1.27.png, 1.57.png
- Bare Indochine: 50.png, 51.png, 52.png

That is 13 files, and the room galleries would grow to 4, 6, 4 and 5. Their Drive file ids are in `docs/content/vnest-client-data.draft.json` (`mediaFolders`). **Nothing has been downloaded.**

## Comparison with checkpoint 1, and the four departures

**Checkpoint 1 (19/10) at a glance.**
- One opening frame and two supporting frames.
- An H1 with "TP.HCM · Quận 1" and sentences 2–3 of E4 as the introduction.
- "Giá tham khảo 1,100,000" beside the CTA.
- 02.2's own room selection, in the not-connected state.
- Shared facts "Studio · 28 m² · 2 người lớn".
- Five amenity chips, a policies placeholder line, and 15 nearby places.

The 20/10 build departed from it in four ways. **None is accepted by default.** Each is listed for your decision, as it stands in this refinement.

| # | Departure from checkpoint 1 | Rationale | Impact | Reversible? | Actually required? |
|---|---|---|---|---|---|
| 1 | **Rooms are this page's own cards, not 02.2's room selection** (`PropertyRoomSelection`) | 02.2 draws its own room list and cannot show per-room reference prices, room galleries or specifications without changes to 02.2, which is in review and outside this scope. Showing both would list the rooms twice | The only booking states shown are "not connected" (honest, from the record) and the frozen 02.1 bar. Once a PMS is connected, availability and rates per room are not yet wired into these cards | Yes. Mount `PropertyRoomSelection` in or under `#rooms` again; no data change needed | **Not strictly.** It is needed only for this brief's cards and galleries. Alternative: render 02.2's selection below the cards once a stay is chosen, or build these cards as 02.2's planned compact variant (05.1 checkpoint 5). That is your call |
| 2 | **No "Giá tham khảo" beside the hero action** (approved D3 on 19/10) | Under your rule of 20/10, a rate belongs only to its own row. L4 is Bare Chic One's, so a single figure in the hero would read as the property's price | The price appears on the Bare Chic One card only (private preview) | Yes. One line, e.g. "Bare Chic One · Giá tham khảo 1,100,000" | **Yes, as worded in D3.** A hero figure is possible only if it is labelled as Bare Chic One's, or once VNest answers Q24 |
| 3 | **No "Quận 1", no nearby list, no policy line** | Your 20/10 brief: show only verified address information; do not assume nearby places without a per-property mapping; omit unconfirmed policies rather than fill them | Less local context. Location is the address, the verified map and transport | Yes, each independently | **Nearby and policies: yes**, by the brief (Q28, Q25). **"Quận 1": not strictly.** It is corroborated by two independent sources (G2.1), not invented; the brief's "no district field" concerns the workbook. Your decision |
| 4 | **No hero introduction** (20/10) | It avoided repeating the story section | — | — | **Reverted in this refinement**: one verbatim sentence (E4 s3) under the name, and the story no longer repeats it |

**Further changes in this refinement, for your attention.**
- **Amenity pictograms.** The content model says an icon is "never guessed from a label" and is VNest's choice. Your brief asked for icons. They come from the model's fixed list, are recorded per label as BMP's choice, and await VNest (Q31). The list is not extended, so Smart TV and Phòng tắm riêng have the neutral mark.
- **The photographs section further down was removed** in favour of the top gallery.
- **Each room now lists all of its local photographs** in the record (`mediaIds`), not just one.
- A record-level section `gallery` was added. `photographs` and `opening-frames` are kept only for the comparison route.
- A local launch entry `vnest-v2-client-preview-dev` (next dev, port 3401) was added for quicker iteration. The QA ran on the production build.

---

## G4: thirteen more photographs (authorised 20/10/2026)

**Authorisation**, quoted and recorded in `src/content/vnest-workbook/media.ts` (`G4_AUTHORISATION`): "Authorised: G4, the 13 Bare Chic files listed in docs/qa/05.2/v2-refine/RESULTS.md, for private local review only (never committed, deployed or published). Fetch, verify and add them to the room galleries."

**Pipeline** (`docs/content/g2/fetch-photos.mjs`).
1. The check found all 13 still listed on Drive with the recorded name, size and type.
2. Each download was accepted only if its byte size matched the 15/10 listing and it decoded as an image.
3. Originals were written read-only to `.local-media/` (ignored).
4. Derivatives (AVIF, WebP, JPEG at 480 to 1600 px) were written to `public/dev-client-media/` (ignored).
5. Full sha256 hashes are in `docs/content/g2/media-record.json`.

All 19 Bare Chic files have distinct hashes, so there are no duplicates.

| Room (Drive folder) | File | sha256 | Pixels |
|---|---|---|---|
| Bare Chic One | 1.11.png | `a929f2da…2eee8cbf` | 2048×1365 |
| Bare Chic One | 1.42.png | `f0d84639…6c0c5e49` | 2048×1365 |
| Bare Chic Two | 2.4.png | `6d7b69c2…5cc16a7e` | 2048×1370 |
| Bare Chic Two | 2.5.png | `2f392d84…8e3f95a6` | 1920×1279 |
| Bare Chic Two | 2.9.png | `894e185b…b2028041` | 2048×1366 |
| Bare Chic Two | 2.10.png | `916fb0fb…f048cd13` | 2048×1366 |
| Bare Chic Two | 2.32.png | `73e43189…8bf16a6c` | 2048×1365 |
| Bare Chic Three | 1.18.png | `c3b76d79…75bd9592` | 2048×1365 |
| Bare Chic Three | 1.27.png | `ca939dfd…7e3249f7` | 2048×1370 |
| Bare Chic Three | 1.57.png | `d214ff9f…f5d336d1` | 2048×1366 |
| Bare Indochine | 50.png | `68d7cca6…74937cc7` | 2048×1365 |
| Bare Indochine | 51.png | `340dafd8…21b866c5` | 2048×1365 |
| Bare Indochine | 52.png | `cb798133…756b7aaa` | 2048×1365 |

**What I saw at full size.**
- Every file carries Bare's watermark. None was edited.
- 1.11.png is one photograph, not a collage: a large wall mirror reflects the room.
- **Three photographs show a person**: 1.11.png, 1.18.png and 2.32.png. The alt text says only "một người". Whether VNest holds a model release is added to Q15.
- 1.18.png, from Bare Chic Three's folder, shows the same layout and sports-ground view as Bare Chic One's 1.55.png. The storeys share a design, so this is plausible, but the room attribution rests on the folder alone (as for every photograph).
- 1.42.png (One) and 1.29.png (Three) show near-identical kitchenettes, consistent with that shared design.

**Room galleries now** (the representative first):

| Room | Photographs | Count |
|---|---|---|
| Bare Chic One | 1.55, 1.11, 1.42, 1.47 | 4 |
| Bare Chic Two | 2.3, 2.10, 2.4, 2.5, 2.9, 2.32 | 6 |
| Bare Chic Three | **1.57**, 1.18, 1.29, 1.27 | 4 |
| Bare Indochine | **50**, 51, 52, 53, 54 | 5 |

**Representatives changed for Three and Indochine.** 1.57.png and 50.png show the whole room; 1.29.png (a kitchenette) and 53.png (a wall and a desk) did not. The comparison route `/dev/stays/bare-chic-20-10` is pinned to its original thumbnails, so it is unaffected. 1.56.png and 1.59.png remain excluded (Q6).

**Gallery behaviour with 19 photographs.**
- The top gallery interleaves the rooms: each room's first photograph, then each room's second, and so on. The mosaic's five tiles are therefore One, Two, Three, Indochine, One.
- "Xem tất cả 19 ảnh" opens the grid grouped by room (4, 6, 4, 5).
- The viewer caption now counts within the room ("Bare Chic Two 3/6"), while the arrows still move through every photograph.

**Checks (production build, 390 / 768 / 1440; evidence in `../v2-g4/`).**
- Overflow 0, CLS 0, no control under 44 px, no errors.
- "Khám phá các loại phòng" is in the first screen at every width and leads to `#rooms`.
- The grid shows 4 groups with 19 photographs.
- Grid → photo → arrow → swipe (touch) → "Tất cả ảnh" → Escape works, and focus returns.
- Each room gallery shows only its own photographs, with the count the button states: One 1/4–4/4, Two 1/6–6/6, Three 1/4–4/4, Indochine 1/5–5/5.
- `?price=public`: no figures.
- Phone gallery row: a swipe moves to slide 2/19.
- At 1440, 14 images are not loaded: the photographs beyond the mosaic, which are hidden there and lazy.

**Regression and repository.**
- `/a`, `/a-original`, `/b`, `/b-original`: 24 of 24 identical. `/b-client`: 6 of 6 identical.
- The comparison route: same layout positions as delivered.
- `npm run check`: lint 0 errors (the same 3 older warnings), typecheck clean, **258 of 258** tests. The build succeeds.
- Nothing is staged; no client media is tracked; all originals are read-only.

**Tests updated:** the room-to-photograph mapping, the check that every photograph comes from its own room's Drive folder, never 1.56 or 1.59, and alt text that states no bed size, area or capacity.
