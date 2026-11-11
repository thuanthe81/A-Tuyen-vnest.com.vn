# VNest V3 · Final UX refinement (25/10/2026): review package

**Status: IN REVIEW, stopped for the owner's final visual acceptance.** Nothing committed, pushed, merged, deployed or frozen; no reset, clean, stash or branch switch; client photography untouched; frozen 02.1 code untouched.

**Demo:** <http://localhost:3402/dev/demo> (`next start`, launch configuration `vnest-v3-qa`, fresh build of this round). Property pages: `/dev/stays/bare-chic?view=demo` and `/dev/stays/the-nang-suites`. Ignore the old process on port 3400.

## 1. R3 room facts (approved demo display interpretation)

Recorded in `ROOM_FACT_INTERPRETATION` (`src/content/vnest-workbook/property-details.ts`):
- `rule: "R3"`, `status: "approved-demo-display"`, `displayOnly: true`;
- written per-room confirmation still pending (Q37).

Each value keeps its raw text and anchor cell. Its rule names the merged range and says "display metadata only: not provider-confirmed occupancy, eligibility or availability, and not a child policy".

| Rooms | Shown | Source cells |
|---|---|---|
| Bare Chic One, Two, Three, Indochine | Studio · 28 m² · 2 người lớn | D4:D7, E4:E7 (merged), F4:F25 |
| Bare Hàn Ground, One, Two, Three | Studio · 30 m² · 2 người lớn | D16:D19, E16:E19 (merged), F4:F25 |
| Pepper House 3rd-floor, 4th-floor | Studio · 40 m² · 2 người lớn | D24:D25, E24:E25 (merged), F4:F25 |
| Bare Hyphen One, Two, Three / Four | Studio · 18 m² / Duplex studio · 30 m² · 2 người lớn | own rows D8–E11, F4:F25 |
| Bare Đa Kao One, Two, Three, Four | Studio · 13 / 19 / 19 / 17 m² · 2 người lớn | own rows D12–E15, F4:F25 |
| Yellow Submarine, Pale Blue Eyes, Green River, Blue Moon | Studio · 21 / 23 / 30 / 36 m² · 2 người lớn | own rows D20–E23, F4:F25 |

- Explicit row values always win over a merge.
- No booking code turns "2 người lớn" into a limit (`verifiedMaxAdults` is null for every room); real eligibility comes from ezCloud.
- Cards show icons only, with no verification text.

## 2. Room-card price region and CTA

- **Hierarchy (both properties):** room name → metadata → price → "Chọn phòng" → "Xem chi tiết phòng". The approved card layout and the inline gallery are unchanged.
- **Price states** (`PropertyRoomCollection.tsx` `RoomPrice`, data `src/content/vnest-workbook/public-rates.ts`):
  - **Approved public starting rate:** "Chỉ từ {amount} / đêm". A rate needs a currency, a basis (per night) and a recorded VNest approval. **None is approved**, so the list is empty.
  - **Otherwise:** "Xem giá theo ngày" (neutral, with a calendar icon). No amount is invented, and workbook figures are never published automatically.
  - **Private preview only:** "Giá tham khảo · ngày thường" with the indicative workbook figure, as before.
  - Once ezCloud is connected, stay-specific provider prices replace static rates for booking decisions.
- **Desktop (≥ 832 px, real pointer):**
  - price and action share one strip;
  - at rest the price leads and "Chọn phòng" is outlined (text 4.6:1 on beige);
  - hover or keyboard focus fills it with the approved #9A683C;
  - colour only: no movement, the same width in every state (measured 135 px);
  - the price stays visible in every state and is linked to the button for screen readers (`aria-describedby`).
- **Touch and narrow screens:** the price sits on its own line, and a full-width filled "Chọn phòng" always shows (no hover).
- Reduced motion removes the transition.
- **Semantics unchanged:** "Chọn phòng" adds a provisional selection; BOOK NOW opens the review, which continues to the honest booking step. No confirmation is ever shown.

Screenshots: `cta-states-1440.jpg` (rows: Bare Chic rest / hover / focus, then The Nắng Suites rest / hover / focus); cards in `shots/1440-*-room-card.jpg` and `shots/390-*-room-card.jpg`.

## 3. Footer

- **Removed:** the "Lưu trú" column, and the Instagram/TikTok placeholders.
- **Left:** the original VNest artwork, "Hospitality Management", and a confirmed descriptor ("Ba thương hiệu lưu trú, sáu nơi ở tại TP. Hồ Chí Minh và Đà Nẵng.").
- **Right:** a Dark Olive Contact area, about 44% of the footer width on desktop and full width on phones. It holds:
  - the heading "Bắt đầu một cuộc trò chuyện.";
  - a large clickable hotline;
  - the email;
  - the address;
  - "Gửi yêu cầu tư vấn" (to the existing Contact section; no second form);
  - Facebook (opens in a new tab).
- **Bottom row:** Về VNest, Thương hiệu, Dịch vụ, Hỏi đáp; © 2026 VNest with one pending-legal flag; Về đầu trang.
- **Phones:** logo, then Contact, then links and legal.
- One footer per page, unchanged.

Screenshots: `shots/1440-footer.jpg`, `shots/768-footer.jpg`, `shots/390-footer.jpg`.

### Official contact details

| Item | Status | Source |
|---|---|---|
| Hotline 090 698 82 61 (`tel:+84906988261`) | **Verified** | facebook.com/vnest.com.vn/about, 25/10/2026 |
| Email hello@vnest.com.vn | **Verified** | same |
| Address 12/18 Nguyễn Thị Minh Khai, Phường Sài Gòn, TP. HCM | **Verified; kept by owner decision (25/10/2026).** It is also Bare Chic's address; VNest publishes it as its own | same |
| Facebook facebook.com/vnest.com.vn | **Active link** | owner brief |
| Instagram, TikTok | Omitted (no official URL) | — |
| Legal entity, tax code, privacy and terms pages | **Pending** (flag in the bottom row) | not published |

Evidence: `evidence/facebook-about-2026-10-25.txt` (the page text; a login prompt covered the visual, so no screenshot).

## 4. Location module (second brief)

- **Placement:** a full-width "Vị trí" section after the rooms and before City Notes, which keeps the approved "City Notes after Vị trí" order. The hero's narrow column could not hold a two-column card, so it keeps the intro plus a "Vị trí và di chuyển ↓" link.
- **Layout:** two columns on desktop (map left, information right); stacked on phones, map first.
- **Map (replaced 25/10/2026 at the owner's request): the official Google Maps embed.**
  - The synthetic street pattern and the OpenStreetMap tiles are removed.
  - Each page uses Google's own iframe, generated through Google Maps → Share → Embed a map for the verified place and used unchanged: Bare Chic `0x317529bd65e9671d:0x1aff14577a350dd4` (`/g/11f6ywgqpw`), The Nắng Suites `0x3142172062a243ed:0xbf1dc451da67c4c2` (`/g/11fnr8n47n`). The Google IDs match the workbook share links. Codes are in `evidence/google-maps-embed-2026-10-25.txt`.
  - Google's logo, attribution, controls and "Open in Maps" stay visible. The iframe title is "Bản đồ Google: {property}".
  - **Layout:** about 58% map and 42% information on desktop. On phones the map sits on top at full width, compact 16:10 (222 px high at 390).
  - **Loading:** nothing loads from Google until the section is within about 600 px of the screen. Before mounting the iframe, a no-cors HEAD request checks that Google is reachable: a blocked or offline frame still fires "load" with the browser's error page, which a cross-origin frame cannot reveal.
  - **Fallback** (while loading, or if Google is unreachable): a plain panel with a pin icon, the status ("Đang tải…" / "Không tải được bản đồ Google."), the address and "Xem trên Google Maps". No map-like graphic and no broken image.
  - "Xem trên Google Maps" in the information column works independently of the embed.
  - **The Nắng Suites:** Google's own place card in the embed shows Google's address, "Số 31, 74/31 Võ Văn Kiệt, An Hải". This is Google's content, not VNest's text, and it conflicts with the workbook's K174/31 (Q19). The page's own text still shows no house number. This is for the owner to note.
- **Information:**
  - full address;
  - "Sân bay gần nhất": Tân Sơn Nhất (SGN) or Đà Nẵng (DAD);
  - "Cách sân bay: khoảng 9,5 km / 5,9 km";
  - "Di chuyển: khoảng 30 / 15 phút bằng ô tô";
  - "Phương tiện thuận tiện": Grab · Đi bộ · Xe bus;
  - **"Xem trên Google Maps"** (the property's own Google place, new tab) and "Xem chính sách đặt phòng" (topics only, "Chờ VNest xác nhận");
  - one line: "Khoảng cách và thời gian theo Google Maps, có thể thay đổi theo giao thông."
- **Sources** (`src/features/property-detail/location-travel.ts`; evidence in `evidence/`):
  - Google Maps driving directions read 25/10/2026: Tân Sơn Nhất → Bare Chic 9.5 km / 29 min; Đà Nẵng airport → The Nắng Suites 5.9 km / 15 min. The times reflect traffic at that moment and are shown rounded;
  - coordinates are the Google places';
  - not confirmed by VNest.
- **Transport:** the workbook (K) says "Grab, đi bộ, xe bus" for every property. **"Taxi" from the brief's example is not in the source, so it is not shown.**
- **The Nắng Suites address:** the house number conflicts (workbook K174/31, Google 74/31; Q19). The module shows "Đường Võ Văn Kiệt · Sơn Trà, Đà Nẵng" with no number. The internal note "Số nhà đang chờ…" now appears only in the private preview; before, it was shown to guests.

Screenshots: `shots/<1440|768|390>-<bare-chic|the-nang-suites>-location.jpg`.

## 5. B2B review (no rebuild)

Services (exactly the three official cards, one detail panel, one CTA each), Contact (service pre-fill, accessible validation, submission off, "Chưa gửi" with no fake success), FAQ (six questions, DRAFT answers) and About VNest are unchanged. They are re-verified by the QA below. No issues were found that needed a change.

## 6. QA

Run on `next start` with the fresh build. Headless Chrome with **device emulation, not a physical device**.

- `../v3-takeover-2026-10-25/scripts/qa.mjs`: **183/183 checks pass** at 1440, 768 and 390, with **0 console errors, 0 non-GET requests** (results in `../v3-takeover-2026-10-25/results.json`). New this round:
  - **PR1:** every Bare Chic room card shows "Xem giá theo ngày" and no amount;
  - **PR2:**
    - desktop: transparent at rest, #9A683C on hover and on focus, price visible, width constant;
    - touch: full-width filled button with a visible price;
  - **L (both properties):** airport, km, minutes, workbook transport, Google Maps in a new tab, policy dialog, map base, side by side at 1440 and map first at 390, the hero link, City Notes after the module;
  - **S9:** internal footer links resolve; exactly the hotline, the email and Facebook (new tab) are linked;
  - **F1:** no "Lưu trú"; Contact 44% wide at 1440, 94% / 91% at 768 / 390; hotline 34 px.
- **Earlier checks, all passing again:**
  - guest journeys (homepage BOOK NOW → Booking Results → rooms → review → honest step; homepage → property → gallery arrows and swipe → rooms → BOOK NOW review);
  - the R3 facts on all 22 rooms, and occupancy not enforced;
  - the Studio pool (no duplicates, no availability count);
  - refresh and Back; unique units; no fake confirmation;
  - partner journey (service → CTA → Contact pre-fill and focus → validation → "Chưa gửi" → FAQ);
  - direct URLs 200; no horizontal overflow; no broken images; no covered fixed CTAs.
- **Frozen and non-demo regression:** 18/18 pixel-identical (02.1 preview, `/stays`, `/stays/bare-chic`, frozen Bare Chic 20/10, Brand Collection `/b` and `/b-client`). The 6 differing captures are the two Bare Chic review views, which change by design.
- **Suite:** lint 0 errors (3 old warnings in QA scripts), typecheck clean, **325/325 tests**, production build OK.
- **Google Maps embed verification** (`scripts/map.mjs`, `map-results.json`; headless Chrome 155 painting real pixels):
  - both properties, at 1440, 768 and 390: state `loaded`;
  - official `maps/embed?pb=` source carrying the place id;
  - no iframe before scrolling near;
  - 238–487 distinct colours in the map area (a painted Google map, not the flat fallback);
  - map 58% wide on desktop and full width on top on phones; no overflow;
  - a one-finger vertical drag starting on the map still scrolls the page by 185–309 px (Google's cooperative gestures).
- **Blocked simulation** (Google embed URL blocked in Chrome): state `failed`, fallback visible, no iframe, no broken image (`shots/map-1440-blocked-fallback.jpg`).
- **QA rerun after the map change:** 183/183, 0 console errors. Data-carrying requests (POST, PUT, PATCH, DELETE): 0. The only non-GET requests are the map's reachability HEADs to google.com.
- **Frozen regression:** 18/18 identical.
- **Not covered:** physical phones and screen readers. The built-in browser pane was hidden (background page), so map loading was verified in headless Chrome. Manual check on a normal browser: open the two property pages, scroll to "Vị trí", and confirm the Google map shows the red marker on the property.

## 7. Files changed this round

- **New:**
  - `src/content/vnest-workbook/public-rates.ts`;
  - `src/features/property-detail/location-travel.ts` and `location-travel.test.ts`;
  - `docs/qa/v3-final-2026-10-25/` (this file, `scripts/shots.mjs`, `scripts/cta-sheet.mjs`, `shots/`, `evidence/`).
- **Changed:**
  - `src/features/property-detail/PropertyRoomCollection.tsx` and `.module.css` (price region, booking strip);
  - `LocationAndPoliciesPanel.tsx` and `.module.css` (now the location module);
  - `PropertyDetail.tsx` and `.module.css` (module placement, hero link);
  - `view.ts` (`from` price state, `streetName`);
  - `src/features/demo/DemoFooter.tsx`, `OwnerJourney.module.css` (footer);
  - `src/content/vnest-workbook/property-details.ts` and `room-facts.test.ts` (R3 status, child-policy note);
  - `docs/qa/v3-takeover-2026-10-25/scripts/qa.mjs` (new checks).
- **Map replacement (later on 25/10):** `location-travel.ts` (official embed sources, OSM tile code removed), `location-travel.test.ts`, `LocationAndPoliciesPanel.tsx` and `.module.css` (`GoogleMapEmbed`: lazy mount, reachability check, fallback), `scripts/map.mjs`, `evidence/google-maps-embed-2026-10-25.txt`.

## 8. Remaining blockers and dependencies

- **Prices:** VNest's approved public starting rates (amount, currency, per-night basis, approval record), or the ezCloud connection.
- **Rooms:** written per-room confirmation of type, area and occupancy (Q37); booking policies per property (Q25).
- **Contact:** legal entity, tax code, privacy and terms pages; the Instagram and TikTok URLs; the contact form's lead destination and privacy notice (submission stays off).
- **Location:**
  - VNest's confirmation of the airport figures (or its own);
  - the Nắng house number (Q19);
  - whether "taxi" belongs in the transport list;
  - the Google place card's "74/31" for The Nắng Suites (Google's content; see §4).
- **Content:** DRAFT Services, FAQ and brand copy (unchanged).
