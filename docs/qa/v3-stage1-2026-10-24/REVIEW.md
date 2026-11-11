# VNest V3 · Stage 1 (P0 UX corrections) and Stage 2/3 proposals: review package

24/10/2026 (Claude Code takeover after Codex and Antigravity). Next CEO review: **Friday 30/10/2026**.
Source of requirements: `VNest_V3_CEO_Feedback_Spec.md` (R01–R14) and its 7 screenshots (kept outside the repo).
Status: **IN REVIEW.** Nothing committed, pushed, deployed or frozen. Stage 2/3 are proposals only.

## 1. Takeover findings (code is the source of truth)

- Branch `design/vnest-property-gallery-exploration`, HEAD `e2a1f60f`. Since 15/10 everything is uncommitted: 22 modified tracked files and 22 untracked paths, plus ignored client media (`.local-media/` 105 MB, `public/dev-client-media/` 24 MB). Nothing was reset, stashed, cleaned, switched or deleted. A copy of `src/` and `docs/` was saved outside the repo before any edit.
- `docs/handoff/CODEX_TAKEOVER.md` §3 is out of date. Homepage hero, header and menu, About/Partner/Contact, room drawer, the Nắng page (`/dev/stays/the-nang-suites`), the six-property booking selector and the homepage calendar fix all exist (ROADMAP updates of 22–23/10).
- **Double booking bar, root cause.** Bare Chic (`?view=demo`) and the Nắng page rendered the demo `SiteHeader` and then `PropertySearchBar` → `ResultsSearchBar` (section 02.2). That second bar brought its own "VNest" text mark (a stand-in from before a header existed) and a "Tất cả cơ sở" row. There was only one search form, but there were two full-width bars stacked: the "two bars" in screenshot 03. Nothing in 02.1 caused it.
- **BOOK NOW label.** The compact and mobile bars showed only an icon, with "Tìm kiếm" as screen-reader text, inside frozen 02.1 code. An integration-only change was not possible without breaking label-in-name accessibility. **The owner approved a minimal opt-in exception on 24/10** (§3).
- **A search left the demo.** A valid search went to `/stays/bare-chic`, the old 05.1 page; the 21/10 handoff listed this as the "known exit". It is now handled at the integration layer (§2B).
- A `next start` from 23/10 23:49 still holds port 3400. QA used port 3401. **That old server now serves a replaced build: restart it before presenting.**

## 2. What was implemented (Stage 1)

| | CEO | Result |
|---|---|---|
| A | R01 | Header: VNest logo larger (symbol 28 → 38 px, wordmark 19 → 28 px tall on desktop; artwork unchanged), **BOOKING** in the bar's copper (white on #b04f2a, 5.3:1, ≥44 px), Menu kept. "Khám phá nơi lưu trú", "Về VNest" and "Hợp tác" left the bar; all four destinations stay in the Menu. BOOKING is a real link (`/dev/demo#dat-phong`); with script it opens the hero bar's dates in place |
| B | R02 | **One bar in every state.** The header is the single sticky row. Property pages and the booking step carry the compact 02.1 bar inside it (`booking="always"`). On the homepage the hero keeps the floating 02.1 bar, and once it is scrolled past the compact bar takes BOOKING's place in the same header row (`booking="after-hero"`). This replaces 02.1's separate sticky bar there. Verified: 1 visible bar at top and scrolled, at 1440, 768 and 390, on the homepage, Bare Chic, Nắng and the booking step |
| C | R02 | **BOOK NOW** as text in all densities: floating, compact, phone pill and phone panel. Validation, dates, guests and state are 02.1's own: without dates it opens the calendar with 02.1's message. A valid stay opens **`/dev/demo/dat-phong`**, a demo step that repeats property, room, dates, nights and guests. It says plainly that online booking is not connected and that nothing was sent, held or paid; its next steps are the property's rooms (stay kept), the collection, and contact placeholders. No availability, price, reservation or confirmation anywhere |
| D | R03 | BOOK NOW in the property photo viewer (grid and single-photo views), in each room's photo viewer and in the room drawer (replacing "Chọn ngày lưu trú"). It sits in the bottom bar beside the arrows: never over the photo, close or grid controls (measured). It carries property, dates, guests and the room. Without dates it closes the viewer or drawer and opens the bar's dates (desktop calendar, phone panel) |
| E | R04 | Hero carousel: 5 curated photos, one per property and alternating cities. **Pepper House** (the previous poster, so the first screen is unchanged), **Bare Chic · Bare Indochine**, **The Nắng Suites · Blue Moon**, **Bare Hyphen**, **Bare Hàn**. Each is pinned to its Drive ID and SHA-256, so a changed file is not shown. Held people photos (RELEASE_HOLDS) can never appear. Cross-fade every 6 s; pauses on hover, on focus anywhere in the hero (including the booking bar) and in a hidden tab; dots, previous/next and swipe stop it; a pause/play button comes first. With reduced motion it starts paused and switches without a fade. Only the first photo loads with the page (high priority), the second after it, later ones on demand. Separate crops for wide and tall heroes. Captions name the property and city from the workbook |

### Files changed

- **02.1 exception (opt-in, owner-approved 24/10):** `src/features/booking-search/presentation.tsx` (new), `BookingBar.tsx`, `MobileBookingSearch.tsx`.
- **Demo integration:** `src/features/demo/` `SiteHeader.tsx`, `HomeHero.tsx`, `Demo.module.css`; new `BookingCta.tsx`, `BookingCta.module.css`, `booking-flow.ts`, `hero-slides.ts`, `HeroCarousel.tsx`, `DemoPropertyShell.tsx`, `v3-stage1.test.ts`.
- **Routes:** `src/app/dev/demo/page.tsx`, `src/app/dev/stays/bare-chic/page.tsx` (demo view only), `src/app/dev/stays/the-nang-suites/page.tsx`; new `src/app/dev/demo/dat-phong/page.tsx`, `src/app/dev/v3-proposals/` (`page.tsx`, `proposals.module.css`).
- **Property detail (optional action slot; unchanged without it):** `src/features/property-detail/` `PropertyDetail.tsx`, `PropertyDetail.module.css`, `Lightbox.tsx`, `PropertyGallery.tsx`, `RoomPhotos.tsx`, `RoomDrawer.tsx`.
- **Records:** `docs/REVIEW_LOG.md`, `docs/ROADMAP.md`, this folder.

## 3. The 02.1 exception, exactly

`BookingPresentationProvider` (new) supplies `{ submitLabel, submitLang }`. `BookingBar` and `MobileBookingSearch` read it. When it is set, the action shows that text (with `lang="en"`) instead of the icon, and in the compact bar it is a text button instead of an icon square. When it is absent, the old markup renders unchanged. No state, date, guest, validation, routing, PMS or test change. Only the demo pages provide it.
**Proof:** full-page captures of 8 routes × 3 widths from the pre-change build and the final build are **pixel-identical (24/24, 0 different pixels)**. The routes are `/dev/booking-search`, `/stays`, `/stays/bare-chic`, `/dev/stays/bare-chic` (private and public), `/dev/stays/bare-chic-20-10`, `/dev/brand-collection/b` and `b-client` (`regression/compare-before-after.json`).

## 4. QA (final build, `next start`, real mouse at 1440 and touch at 768 and 390)

`scripts/qa.mjs` → `results.json`. **All checks pass at all three widths; 0 console errors.**

- R01: old links gone, BOOKING ≥44 px with a real link, BOOKING opens the dates (calendar at 1440 and 768, full-screen panel at 390), Menu keeps all four destinations, Escape returns focus to Menu.
- R02: 1 bar on the homepage at top and scrolled, on Bare Chic at top and scrolled, on the booking step and on Nắng.
- R03: viewer BOOK NOW is 44 px tall, inside the viewport and overlaps neither the photo nor the close button. Without dates it closes the viewer and opens the dates. From a room drawer with `adults=3`, the step shows Bare Chic, Bare Chic Two, 6–8/11, 2 nights and 3 guests, starting at the top. "Xem các loại phòng" returns to `#rooms` with the same stay in the bar.
- R04: 5 slides, only 2 photos loaded at start, auto-advance within 6 s, dots work by keyboard (Enter), choosing a slide stops rotation (live region becomes polite), next control works, reduced motion stays on slide 1 and offers "Tiếp tục".
- Page health: no horizontal overflow, no broken images, CLS ≤ 0.004, on every page and width.
- Suite: `npm run check` → lint 0 errors (the 3 old warnings in QA scripts), typecheck clean, **299/299 tests**, of which 6 are new. `npm run build` succeeds.

**Not tested:** physical iPhone/Android, real screen readers. Also not done: a manual contrast check of the hero text against all 5 photos (the existing shade is kept; it looks legible in the captures).

### Evidence

- `before/` and `after/`: 1440, 768 and 390 captures of the homepage, homepage scrolled, property top, property scrolled, viewer and room drawer (`after/` matches `before/` names).
- `after/qa-*`: step-by-step QA captures, including the booking step.
- `regression/`: before/after pixel comparison.
- `proposals/`: Stage 2/3 mockups.
- Scripts: `scripts/capture.mjs`, `qa.mjs`, `regress.mjs`, `proposals.mjs`.

## 5. Stage 2/3 proposals (not implemented; `/dev/v3-proposals`)

All copy is a labelled **DRAFT** placeholder at the length to request. Logos, names, cities and photos are the ones already approved for the demo. VEYA informed the information layering only.

**Connected Brand Index**: 3 brands, no "All", no counts; "Xem tất cả 6 nơi lưu trú" stays as a separate link.
- **A · Sổ thương hiệu** (`?p=brand-a`): left, a ledger of 3 rows with logos in equal 56 px boxes plus name and city, on a vertical copper thread whose selected node is filled. Hover or Tab shows a preview card (photo + 18–25 words) beside the row; it is pointer-transparent. Click or Enter selects. Right, a full About panel: photo, official logo, city, one-liner, About text, "Khám phá cơ sở" (internal) and the website marked "chờ xác minh". Phone: the three logos become one tappable row on a horizontal thread, with the panel below and no hover. Closest to the approved desktop direction.
- **B · Sợi chỉ ngang** (`?p=brand-b`): three equal logo tiles on a horizontal thread under the heading. The preview drops below the tile. The selected brand opens a wide band below: a 7/12 photo and a 5/12 text column. Phone: same row, band stacked. More photo-led; it moves further from the approved 22–23/10 layout.

**Services → Contact → FAQ → Footer**
- **A · Danh mục mở rộng** (`?p=services-a`): a heading fixed on the left and 3 accordion rows on the right (icon, title, one line). The open row shows details and one CTA, "Trao đổi về …", which leads to a dark olive Contact section with the form and the selected service pre-filled → FAQ accordion (5 questions) → light footer.
- **B · Ba thẻ, một chi tiết** (`?p=services-b`): 3 cards act as tabs, with a wide detail panel below holding 3 work items and one CTA → a light, centred contact with service chips → FAQ → olive footer.
- In both: the form fields are name, phone/email, service (pre-filled), asset type (optional) and notes. **Submit is disabled and labelled not connected**; there is no fake sent state and the privacy notice is pending. The footer links only real routes; phone, email, address, legal entity, tax code and policy are marked "chờ VNest"; social icons are non-clickable placeholders.

**Recommendation:** Brand **A** (keeps the approved logo-and-thread navigation; the About panel answers R06/R07 directly) and Services **A** (the accordion keeps three short defaults, and the owner path reads top to bottom). B is the alternative if the CEO wants a more photo-led brand moment.

## 6. Content questions for VNest / CEO (with length limits)

1. **BOOK NOW without a PMS (Q7):** is the honest step plus "liên hệ" enough for 30/10, or should it lead to a hotline or form? Which official booking phone, email or Zalo?
2. **Brands (×3):** one-liner 12–18 words; About 40–70 words; preview 18–25 words; one approved photo each; official websites (verified domains; Facebook kept separate).
3. **Services (×3):** summary line 10–14 words; detail 50–80 words; 3 work items of 5–10 words each. Confirm *Phát triển dự án = tư vấn mô hình only* (no design, construction or turnkey), and **who may franchise which brand** under which conditions.
4. **Contact:** the lead channel and who handles it, the asset-type list, the privacy/consent text, and the expected reply process (no promise until then).
5. **FAQ:** 4–6 questions with 30–60-word answers; which topics are public and which are 1:1 only (fees, revenue share, franchise terms).
6. **Footer:** legal entity name, tax code, address, hotline/email, policy pages, official VNest social accounts.
7. **Hero:** confirm the 5 photos and their order (Pepper House first). Is a person-free Bare Đa Kao photo wanted? Workbook location labels read "TP.HCM · Quận 1": keep the district in captions?
8. **About VNest:** keep it on the homepage or move it (R09; unchanged for now).
9. **R12:** confirm that "QA" means a partner Q&A/FAQ.

---

# Stage 2 and Stage 3 implementation (24/10/2026, later the same day)

Owner approved the **directions**: Stage 2 = Brand Index **A "Sổ thương hiệu"**, Stage 3 = Services/Contact **B "Ba thẻ, một chi tiết"**. That approval covers direction only; final visual acceptance is pending. Built on `/dev/demo` (plus the footer on the demo property pages and the booking step). Stage 1 is preserved. Status: **IN REVIEW, stopped for final visual acceptance.** Nothing committed, pushed, deployed or frozen.

New homepage order: header → hero carousel → **Brand Index A** (`#thuong-hieu`) → **six-property collection** (`#kham-pha`) → Về VNest (unchanged, R09) → **Services B** (`#hop-tac`) → **Contact** (`#lien-he`) → **FAQ** (`#hoi-dap`) → **footer**. The Menu's four links still land on real sections.

## Stage 2: Brand Index A

- **Index:** three brands only, with no "Tất cả" and no counts. It is a three-row ledger on a vertical copper thread. The selected node is filled, and a copper connector runs from it across the gap to the About panel (desktop).
- **Logos:** the official artwork, unaltered (`object-fit: contain`; proportions measured identical to the source files). Each mark has its own optical height inside one shared box: Bare's hairline script is drawn largest (58 px desktop, 44 px phone), then Nắng (52 / 40) and Pepper House (44 / 34).
- **Spacing:** the logo box, the name/city text, a reserved preview-thumbnail slot and the node column sit on one grid. Rows are a fixed 116 px, so nothing moves under the pointer.
- **Hover or focus is preview only.** The preview (photo plus a DRAFT line) appears inside the hovered row. It never overlaps the About panel (measured) and never blocks a click: the panel CTA stays hittable while a preview shows.
- **Selection:** click, Enter or Space commits. Arrow keys, Home and End move focus and preview; Escape closes a preview. It is built as tabs with manual activation. On phones the three marks form one row of tabs (short names) and a tap selects directly, with no hover step.
- **About panel:** one approved photograph, the logo, the brand name once, cities, the brand's properties by name (no counts), a DRAFT one-liner (12–18 words), a DRAFT About (40–70 words) and **one CTA**. No brand website is verified, so the CTA is "Khám phá {brand}". It filters the six-property collection to that brand and scrolls to it. The website is flagged "chờ VNest xác minh tên miền" as an internal note, not a link.
- **Collection:** a separate section with brand and city filters (no counts on chips), a live result line with "Bỏ lọc", and the existing cards, prices and same-tab links to Bare Chic and Nắng. "Xem tất cả 6 nơi lưu trú" leads there.
- `/dev/brand-collection/b`, `/b-client` and `ConnectedIndex` are untouched (pixel-identical).

## Stage 3: Services B, Contact, FAQ, Footer

- **Services:** three cards are always visible with short copy. Each card is a disclosure button for **one** shared detail region.
  - On desktop the region spans the row, with a copper caret under the chosen card. On phones it opens directly below the chosen card.
  - Choosing the open card again closes it.
  - The selected card is olive with a copper top edge and a turned chevron.
- **Detail region:** DRAFT detail (40–60 words), three DRAFT items and **one service-specific CTA**. "Phát triển dự án (Tư vấn mô hình)" states *model consulting only; no design, construction or turnkey (pending VNest confirmation)*. "Nhượng quyền" states that its brands, conditions and costs are not published. No fees, returns, shares or commitments appear anywhere.
- **CTA → Contact:** it keeps the service, scrolls smoothly (instantly with reduced motion), pre-selects the service chip and moves focus to the Contact heading, clear of the sticky header.
- **Contact:** centred, with a paper card on a warm sand ground. It has three fields (name, phone or email, optional message) plus service chips. A visible label reads "Bản mô phỏng giao diện · chưa nhận yêu cầu thật" on a dashed card.
  - Submit is muted and `aria-disabled`. Pressing it sends nothing (no request, measured) and explains why: no success state.
- **FAQ:** five DRAFT questions, one open at a time (native disclosures, keyboard operable). Answers are DRAFT placeholders of 30–60 words.
- **Footer:** columns follow the 03.1 sitemap (Lưu trú, Về VNest, Hợp tác, Liên hệ). Every link is a working route or section (checked: all 200 or existing ids). Hotline, email, address, policies, legal entity, tax code and VNest social accounts are flagged "Chờ VNest" / "Chưa có trang" as text, never links. The VNest artwork is unaltered on a light ground. The footer also appears on Bare Chic, Nắng and the booking step.
- The old Partner roadmap and Contact components remain in `HomeSections.tsx`, unused, not deleted.

## Integration fix found during QA

On the homepage the sticky header could cover the hero's booking pill for about 65 px of scroll, during which neither bar was visible. 02.1 hands over at the viewport top, and that code is frozen. The header now also hands over as soon as the hero bar passes under it, using its own observer at the integration layer.

## Files (Stage 2/3)

- **New:** `src/features/demo/HomeCollection.tsx` and `.module.css`, `DemoPhoto.tsx`, `OwnerJourney.tsx` and `.module.css`, `DemoFooter.tsx`.
- **Changed:** `src/app/dev/demo/page.tsx`, `src/features/demo/SiteHeader.tsx` (`id="top"`, header hand-over), `DemoPropertyShell.tsx` (footer).
- **Untouched:** 02.1 core beyond the Stage 1 exception; `ConnectedIndex` and the shared Brand Collection modules.
- **QA:** `scripts/stage23.mjs`, `stage23-results.json`, `stage23/`.

## QA (final build, `next start`, real mouse at 1440, touch at 768 and 390)

- **Stage 2/3:** `stage23.mjs` passes every check at all three widths (24 at 1440, 20 at 768 and 390), with **0 console errors**:
  - **Brand index:** structure, logo proportions and optical order; hover preview without selection, inside its row, off the panel, not blocking the CTA; click commits; keyboard arrow/Escape/Enter; tap selects.
  - **Collection:** the panel CTA filters and scrolls; city filters work with no chip counts; reset; a card reaches Bare Chic in the same tab; "Xem tất cả" works.
  - **Services and Contact:** three cards and one region; the region opens under its card and closes again; the consulting scope text; CTA → Contact with the service pre-selected and focus placed; three fields with the mockup label; submit sends no request and shows no success.
  - **FAQ, footer, page:** FAQ exclusive and keyboard; footer routes all live with pending items unlinked; no horizontal overflow; reduced motion removes the panel and detail animations.
- **Stage 1 regression:** `qa.mjs` passes every check at all three widths, 0 errors. `regress.mjs`: 24/24 frozen and non-demo captures pixel-identical to the pre-V3 build.
- **Suite:** lint 0 errors (3 old warnings in QA scripts), typecheck clean, 299/299 tests, production build OK.
- **Not tested:** physical phones, real screen readers.
- **Screenshots** (`stage23/`), per width (1440, 768, 390):
  - **Stage 2:** `s2-brand-index`, `s2-hover-preview` (1440), `s2-nang-selected` (1440) or `s2-pepper-selected` (touch), `s2-panel`, `s2-collection-filtered`.
  - **Stage 3:** `s3-services`, `s3-franchise-open`, `s3-consulting-open`, `s3-contact`, `s3-contact-attempt`, `s3-faq`, `s3-footer`.

## Content still needed (Stage 2/3)

- **Brand copy, per brand:** one-liner (12–18 words), About (40–70 words), preview line (10–16 words), verified website domains.
- **Service copy, per service:** detail (40–60 words) and three work items (5–10 words each). Confirmation of the consulting-only scope, and of franchising brands, conditions and costs.
- **Contact:** the lead channel and its owner, the privacy notice, the contact lead text (20–35 words).
- **FAQ:** the final 4–6 questions and their answers (30–60 words each).
- **Footer:** hotline, email, address, legal entity, tax code, policy pages, VNest social accounts.

---

# Stage 2 refinement: brand hover preview and discovery filters (24/10/2026, after owner review)

Two corrections requested before final acceptance. Everything else on Stages 1–3 is unchanged. Status: **IN REVIEW, stopped for visual acceptance.**

## 1. Brand hover preview, redesigned

- **Rows at rest:** each row now holds only the official logo, name, city, node and thread. The inline thumbnail and DRAFT text are gone, and rows are a calmer 104 px.
- **The preview** is now **one floating editorial card** (desktop, ≥1024 px):
  - Width is `min(36vw, 31rem)`: 496 px at 1440, 461 px at 1280.
  - A 16:10 approved photograph, then the small official logo and city, the brand name, a DRAFT intro (12–20 words) and the hint "Nhấn để xem giới thiệu đầy đủ".
  - It has a hairline border, a soft two-layer shadow, a 14 px radius and a 200 ms fade-and-slide (none with reduced motion).
- **Placement:** it opens 20 px right of the thread, centred on the hovered row and extending over the right column. It is clamped into the viewport below the sticky header and repositioned on scroll and resize.
  - It is absolutely positioned (no reflow, measured), never covers the navigation or the active row, and is pointer-transparent, so it can never block a click.
- **Interaction contract:**
  - **Hover intent:** opening waits 120 ms, so a quick pass opens nothing. Moving between rows switches at once without flicker. Leaving closes after a 160 ms grace.
  - Hover never commits a selection, and the selected brand never previews.
  - Click or Enter commits, updates the About panel and dismisses the card. Escape dismisses it and keeps the selection.
  - **Keyboard:** focus gives the same preview (`aria-describedby` points to its intro); arrows move between brands.
  - **Touch and below 1024 px:** no hover at all. A tap selects directly, the About panel follows below, and logos stay ≥34 px tall.
- No brand website is invented: the panel still says the domain awaits VNest verification.

## 2. Discovery filters, redesigned

The page reads top to bottom: **introduction → filter toolbar → grid.**

1. **Full-width introduction:** "KHÁM PHÁ NƠI LƯU TRÚ", "Tất cả nơi lưu trú", and one line, "6 nơi lưu trú của ba thương hiệu VNest tại TP. Hồ Chí Minh và Đà Nẵng." That line uses facts already in the workbook.
2. **One toolbar between two hairlines:**
   - **Desktop (≥1024 px):** two rows on a shared label column (Thương hiệu, Thành phố), each a **segmented control on one track that never wraps**. The live result ("Tất cả 6 nơi ở", "3 nơi ở · Bare Boutique Stays · TP. Hồ Chí Minh") sits to the right across both rows, with "Bỏ lọc" when filtered. A single row did not fit comfortably (it needs about 1,290 px), so this uses two intentional rows.
   - **Tablet (768–1023 px):** each label above a full-width control, options split evenly. All options are ≥44 px.
   - **Phone:** two compact selects side by side (46 px) with the result line below. The whole filter area is under 190 px tall.
3. **Grid:** unchanged cards, prices and links.

- The full set remains, including the "all" options: **Mọi thương hiệu / Bare Boutique Stays / The Nắng Suites / Pepper House** and **Mọi thành phố / TP. Hồ Chí Minh / Đà Nẵng**. Combined filtering, the six-property inventory, data, availability, price and booking logic are untouched; the same filter reducer is used.
- The section rule is now aligned with the content edges.

## Files

- `src/features/demo/HomeCollection.tsx` and `HomeCollection.module.css`: brand index preview and discovery section.
- QA: new `scripts/refine.mjs`, `refine-results.json`, `refine/`; `scripts/stage23.mjs` updated to the new preview contract.

## QA (`next start`; real mouse at 1440 and 1280, touch at 768 and 390)

- **Preview:** rows at rest are clean; a quick pass opens nothing; hovering Nắng previews only (selection and panel unchanged).
  - Size: 496 px at 1440, 461 px at 1280. The card stays inside the viewport and below the header, never over the ledger or active row, pointer-transparent, with no reflow and no layout shift.
  - Hovering Pepper switches directly; hovering the selected brand shows nothing; leaving closes after the grace period.
  - Escape keeps the selection; a click commits; keyboard focus previews, Escape closes, Enter commits; reduced motion has no animation.
  - Touch: a tap selects directly, with no card, and the panel follows below.
- **Filters:** order is introduction → toolbar → grid; all options offered; segmented on one line, no orphans, ≥44 px (tablet and desktop); selects on phones in a compact area.
  - Combinations and counts, checked through real pointer, touch or select input: Bare 4; Bare + HCM 3; Bare + Đà Nẵng 1; Pepper with Đà Nẵng drops the city and says so (1); Nắng 1; Nắng + Đà Nẵng 1; all + Đà Nẵng 2; all 6.
- No horizontal overflow at any width. Results are in `refine-results.json`, with console errors recorded there.
- **Screenshots in `refine/`:**
  - Per width (1440, 1280, 768, 390): `-1-brand-rest`, `-5-filters`, `-6-filters-bare`.
  - Desktop (1440, 1280): `-2-hover-nang`, `-3-hover-pepper`, `-4-selected-pepper`.
  - Touch (768, 390): `-4-selected-nang`.

## Owner decision

Owner visual acceptance, 24/10/2026: "Accepted: the floating brand preview and the discovery filter toolbar are visually approved." This approves the two Stage 2 corrections visually. It is not a freeze, not production approval, and not acceptance of DRAFT content.
