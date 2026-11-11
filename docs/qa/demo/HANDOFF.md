# CEO demo handoff (Friday 23/10/2026)

Refined 21/10/2026. Private, local, one tab, one origin. **Nothing committed, pushed, deployed or frozen.**

## Start it

```bash
npm run build
```

```bash
DEPLOY_ENV=development CONTENT_SOURCE=client-draft BOOKING_PROVIDER=none npx next start --port 3400
```

Open **<http://localhost:3400/dev/demo>**. Not `/`, which is still the Phase 01 placeholder.

## Click-by-click flow

1. **Homepage.** The hero (Pepper House photograph, about 66% of a desktop screen) with the 02.1 floating bar over its lower edge. Scroll down: the compact bar takes over at the top; scroll back and it returns.
2. **Menu** (top right) opens the full-screen menu: Khám phá nơi lưu trú, Về VNest, Hợp tác cùng VNest, Liên hệ. Each link goes to its section on the same page; Esc or "Đóng" closes it.
3. **Hợp tác** (header) → the olive partner section. "Liên hệ hợp tác" → the contact block, which says the details are being updated.
4. In the collection, click **Bare Chic →**. Bare Chic opens in the same tab.
5. **Gallery.** Click a photo; use "Ảnh sau"; press Esc.
6. **Tiện nghi.** All five amenities, each with an icon.
7. **Rooms.** "Xem chi tiết phòng" opens the room drawer: the room's photos (‹ › or swipe), the amenities shared by the property, "Giá đang cập nhật". "Chọn ngày lưu trú" closes the drawer and opens the 02.1 date picker.
8. **City Notes.** Switch tabs; "Xem tất cả" / "Thu gọn".
9. The **VNest** logo returns to the homepage.

The booking bar's own "VNest" and "Tất cả cơ sở" links now stay in the demo: a demo-only click guard (`src/features/demo/DemoLinkGuard.tsx`) sends them to `/dev/demo` and its collection, and 02.1 is unchanged. "Xem bản đồ" and the cards' map links open Google Maps in a new tab (marked ↗).

**Remaining exit, do not press "Tìm kiếm" during the demo.** To reproduce:
1. On Bare Chic (or after "Chọn ngày lưu trú" in a room drawer), choose two dates and press **Tìm kiếm**.
2. The page goes to `/stays/bare-chic?checkIn=…`: the older 05.1 property page (different design, "Xem phòng trống"), not part of the demo. From the homepage bar it goes to `/stays`.
3. Return with the browser's Back button. The search is 02.1's own navigation and is not redirected, because that would leave a dead search button.

## Concept only, not live

- **No booking, availability or prices.** Rooms say "Giá đang cập nhật", and the page says online booking is not connected. The 02.1 bar is real UI, but no PMS is behind it.
- **Room facts.** Bare Chic One shows Studio · 28 m² · 2 người lớn, from the 15/10 room sheet, which VNest's admin confirmed as accurate (relayed by the owner 21/10; a written record is pending, Q37). The other three rooms had no values in their own rows, so they show none and no placeholder. There are no bed details or descriptions anywhere.
- **Hero video.**
  - The component accepts a local, rights-cleared video (muted, looping; the poster stays when reduced motion is set).
  - The Pepper House YouTube showcase (`EBBBXnSAX0E`) is published by **GEMA Architecture & Interior Design**, not VNest. It is not embedded or downloaded: reuse rights, YouTube's player branding and third-party requests.
- **Partner.** No partnership model, terms or form exist yet; the section says so.
- **Contact.** Phone, email and social details are not supplied; the icons are deliberately not links.
- **About VNest.** Uses only VNest's brand material: the tagline, the three brands, six properties and two cities, and the values and symbol meaning from VNest's concept presentation. The headlines are BMP's draft wording.
- **Photographs.** 16 of Bare Chic's 19: three with people are held (Q15). Every client photograph is for private review only until rights are confirmed.
- **Other properties.** Bare Hàn and The Nắng Suites show labelled photo placeholders. Partner brand logos are not supplied. Only Bare Chic has a detail page.

## Evidence (`docs/qa/demo/`)

- **Screenshots** at 1440 and 390:
  - `*-1-home.png`, `*-2-menu.png`, `*-3-about.png`, `*-3-partner.png`;
  - `*-4-bare-chic.png`, `*-5-room-drawer.png`, `*-6-dates-from-drawer.png`, `*-7-city-notes.png`;
  - `*-bare-chic-full.jpg`.
- **Recordings:** `journey-1440.webp`, `journey-390.webp`.
- **Results:** `results.json`. Re-run with `node docs/qa/demo/scripts/journey.mjs` while the server runs.
- The 20/10 captures in this folder were replaced by these.

## QA (21/10/2026, `next start`, one tab, real mouse at 1440 and touch at 390 and 768)

Every item passed at all three widths:

- **Hero:** 66% of the screen (74% on phones); poster loaded, no video; the 02.1 bar inside the hero and in the first screen.
- **Sticky bar:** appears after scrolling past the floating bar, hidden again at the top.
- **Menu:** opens; Tab stays inside; Esc closes and focus returns to Menu; "Đóng" closes.
- **Section links:** all four menu links and the partner CTA close the menu and land on their section, in the same tab.
- **Bare Chic:**
  - same tab, 16 photographs, none held;
  - five amenities with icons, no "Xem thêm";
  - "Bánh mì Huỳnh Hoa";
  - no internal notes, question numbers or figures.
- **Viewers:** the gallery viewer (next, Esc) and a room gallery (Đóng) both work.
- **Room drawer:**
  - opens at 42% of the width at 1440, 54% at 768, full width at 390;
  - the CTA stays in view, the first image loads, nothing is clipped, no horizontal overflow;
  - photo 2/3 works;
  - Esc closes it and focus returns to its button;
  - "Chọn ngày lưu trú" opens the 02.1 dates.
- **City Notes:** the tab switches, then 8 places expanded, 4 collapsed.
- **Return:** the VNest logo brings you back to the homepage.
- **Page health:** no horizontal overflow, broken images, failed requests or console errors; CLS 0 on load for both pages.
- **Suite:** `npm run check` passes 285 of 285 tests, typecheck is clean, and lint has 0 errors (3 old warnings in QA scripts). `npm run build` succeeds.
- **Regression:** `/dev/brand-collection/b`, `/b-client` and `/dev/stays/bare-chic-20-10` are pixel-identical to before.

Not tested: real devices, screen readers.

## Blockers

None. Rebuild and start the server on the presentation machine, and rehearse once.
