> **Historical (21/10/2026).** Current entry point: [START_HERE.md](../../START_HERE.md).

# VNest V2: Codex takeover

Written 21/10/2026 from the actual repository state; **updated later on 21/10 after the final demo refinement was implemented** (see the note at the top of §9). CEO demo: **Friday 23/10/2026**. Read `docs/WORKFLOW.md` (owner's protocol) and `docs/ROADMAP.md` (section status) before changing anything.

## 1. Repository state

- **Branch:** `design/vnest-property-gallery-exploration`. Never touch `main`. Do not commit, push, merge or deploy without the owner's explicit approval.
- **Last commits:** `e2a1f60f` (Living Frames / Brand Collection status), `1e7fbbaa`, `06f9a6e1` (Brand Collection prototypes), `dc93ae44`, `b166f5b4` (gallery explorations). 02.1 is frozen at `1b75a6f` plus hotfix `9b2febc`.
- **Everything since 15/10 is uncommitted:**
  - 22 tracked files are modified. Some changes predate the 20–21/10 work (`env.ts`, `services.ts`, `content/layouts.ts`, `domain/media.ts`, tests, `eslint.config.mjs`, `.gitignore`, `launch.json`). Others are from the demo: `brand-collection/b/ConnectedIndex.tsx`, `shared.tsx`, `shared.module.css`, `ROADMAP.md`, `REVIEW_LOG.md`.
  - 22 untracked paths, including all of `src/content/vnest-workbook/`, `src/content/drafts/`, `src/features/property-detail/`, `src/features/city-notes/`, `src/features/demo/`, `src/app/dev/{stays,demo,city-notes}/` and `docs/{content,qa/05.2,qa/city-notes,qa/demo,design/city-notes}/`.
- **Do not** reset, stash, clean, checkout or delete. The untracked tree is the only copy of this work.
- A stray folder `~/Documents/GitHub/VNest%202/` (a headless Chrome profile) exists outside the repo. The owner said to leave it untouched.

## 2. CEO demo entry

**<http://localhost:3400/dev/demo>**: one tab, one origin. Its Bare Chic card opens `/dev/stays/bare-chic?view=demo`, and the VNest mark or "← Tất cả nơi ở" returns to the start.

- Do not start from `/`: it is still the Phase 01 placeholder.
- Run on `next start`, not `next dev` (commands in §10).
- Current demo handoff and evidence: `docs/qa/demo/HANDOFF.md` and `docs/qa/demo/results.json` (journey passes at 1440, 768 and 390 as built on 20/10).

## 3. Status by section

| Section | Status | Where |
|---|---|---|
| Homepage | **Not built.** `/` is a placeholder. The demo start page `/dev/demo` stands in: a VNest bar, a two-column opening (text and a Bare Indochine photo, **not** the approved 60–70vh hero), then the Brand Collection | `src/app/dev/demo/page.tsx`, `src/features/demo/` |
| 02.1 Floating booking bar | **APPROVED / FROZEN.** Not on `/dev/demo` yet. On Bare Chic it is shown unchanged through `PropertySearchBar` (owner's decision 20/10; `&search=0` hides it) | `src/features/booking-search/` (`HeroBookingBar.tsx`: floating bar, mobile bar and scroll hand-over; `StickyBookingBar.tsx`, `StaySearchProvider.tsx`), preview `/dev/booking-search`, record `docs/decisions/02.1-floating-booking-search-bar.md` |
| 03.1 Header and navigation | **Spec only, not authorised** (`docs/sections/03.1-header-navigation-spec.md`, still frames at `/dev/header`). The demo uses a minimal bar (`DemoHeader`): logo plus "Tất cả nơi ở". No menu, no overlay, no "Hợp tác" | `src/features/demo/DemoHeader.tsx` |
| Brand Collection, concept B | **Direction approved, not frozen.** Client content `/dev/brand-collection/b-client`; reused on `/dev/demo` with the new optional props `hero`, `links`, `presentation` and `review={null}` (without them `/b` and `/b-client` stay pixel-identical, verified) | `src/app/dev/brand-collection/` (`b/ConnectedIndex.tsx`, `shared.tsx`, `client/`) |
| Bare Chic (05.2), G4 | **Direction approved 20/10, not frozen, not production-approved.** Hero gallery and viewer, identity, intro, amenities (3 pictograms + "Xem tất cả" `<details>`), 4 room cards with their own galleries, location, City Notes. Frozen comparison copy `/dev/stays/bare-chic-20-10` (do not edit) | `src/app/dev/stays/bare-chic/page.tsx`, `src/features/property-detail/` (`PropertyDetail.tsx`, `PropertyGallery.tsx`, `Lightbox.tsx`, `RoomPhotos.tsx`, `BookingPill.tsx`, `view.ts`), record `src/content/drafts/bare-chic/record.ts` |
| City Notes | **CS-1 to CS-7 approved as direction, not frozen.** Integrated after Vị trí on every Bare Chic view. "Bánh mì Huỳnh Hoa" is applied via `OWNER_CORRECTIONS` (snapshot unchanged). Standalone test route `/dev/city-notes` | `src/content/vnest-workbook/city-notes.ts`, `src/features/city-notes/`, spec `docs/sections/city-notes-spec.md`, QA `docs/qa/city-notes/RESULTS.md` |
| About VNest | **Not built** | — |
| Partner with VNest ("Hợp tác") | **Not built** | — |
| Room-detail drawer | **Not built** | — |

## 4. Approved versus frozen

- **Frozen:** 02.1 only. Do not change its contracts, date logic or guest logic; place it, don't rewrite it.
- **Direction approved, not frozen:** Brand Collection concept B, Bare Chic G4 (do not redesign the gallery, room galleries, room cards or CTA), City Notes.
- **In review / draft:** 02.2 results (`/stays`), 05.1 shell.
- **Proposed only:** 03.1 header, 03.2 homepage hero.
- Nothing is production-approved. Each section needs the owner's explicit approval (`docs/WORKFLOW.md`).

## 5. Routes and access

- **All `/dev/*` review routes** answer 404 unless `DEPLOY_ENV=development` is declared (`src/features/property-detail/review-access.ts`).
- **Bare Chic views:**
  - default: private preview, with review notes and reference prices;
  - `?price=public`: what a public build shows;
  - `?view=demo`: the presentation view. No notes, no figures, the three held photos removed, 16 photographs.
- **Known gap:** `/dev/brand-collection/b-client` checks only `env.deployEnv === "development" && !env.indexable`, not the declared rule (reported, unfixed).

## 6. Data and media

- **Workbook:** `VNest_Informationv2.xlsx` (sha256 `126e77dc…028241d9`). It is read from `~/Downloads` and is not in the repo. Verbatim snapshots: `src/content/vnest-workbook/workbook.ts` and `details.ts`. Never edit them by hand; they are regenerated by script.
- **Adapters** (`src/content/vnest-workbook/`):
  - `records.ts`: properties, `Sourced<T>` values with cell, status and question;
  - `property-details.ts`, `pricing.ts` (price states; figures in private preview only), `media.ts`, `photo-manifest.ts`, `location-evidence.ts`, `city-notes.ts`;
  - `legacy-room-sheet.ts`: the 15/10 room sheet, **not reconfirmed in v2**, never shown.
- **Audits and questions:** `docs/content/CLIENT-DATA-AUDIT-2026-10-15.md` and `docs/content/WORKBOOK-V2-SOURCE-DIFF-2026-10-20.md` (questions Q1–Q36).
- **Media is gitignored:** originals in `.local-media/`, derived 480/800/1200/1600 jpg, webp and avif in `public/dev-client-media/<key>/`.
  - **A fresh clone has no photographs.** Work in this folder, or re-derive with `docs/content/g2/fetch-photos.mjs`. The fetch is authorised only for the recorded G2–G4 sets: **download nothing new**.
- **Bare Chic rooms in v2:** no verified area, occupancy, bed or description (Q23, Q11). Show none of them, and do not restore them from the legacy sheet.

## 7. Photo restrictions (Q15)

- **No client photo has public-release rights** (Q15). All of them are for private local review only. `publicReleaseCandidates()` in `media.ts` returns none.
- **People:** `RELEASE_HOLDS` lists 1.11, 2.32 and 1.18 (a person is visible; model release pending). They are excluded in `?view=demo`; keep them out of anything shown or distributed externally.
- **Excluded:** 1.56 and 1.59 sit in two rooms' folders (Q6).
- **Other properties:** Bare Hàn and The Nắng Suites have no authorised photos; their cards show labelled placeholders.
- **Watermarks:** Bare photos carry a Bare watermark.
- **YouTube** (Pepper House, `EBBBXnSAX0E`): rights not cleared. Do not download, rehost or treat it as approved. At most, a muted embed experiment that is clearly labelled; a local-photo poster must remain the default.

## 8. Known bugs, gaps and demo risks

- **02.1 bar links leave the demo:** its "VNest" text goes to `/` (the placeholder) and "Tất cả cơ sở" goes to `/stays`. Search also goes to `/stays`, which says no provider is connected. 02.1 is frozen, so the presenter must avoid these links.
- **Bare Chic booking:** no provider is connected. Rooms show "Giá đang cập nhật" in the public and demo views. There is no availability or checkout, and none may be simulated.
- **Brand logos:** partner logos have not been supplied. `presentation` shows the brand names instead of dashed slots.
- **Not tested:** real devices, screen readers.
- **Lint:** 3 warnings in older QA scripts (`docs/qa/brand-collection/scripts/lib.mjs`, `docs/qa/living-frames/media-test/scripts/lib.mjs`, `interact.mjs`). No errors.
- **Gotchas:**
  - **No Prettier config:** do not run Prettier, which reflows to 80 columns against the repo's long-line style.
  - **Tailwind `[hidden]`:** the base layer sets `[hidden]{display:none!important}` inside a cascade layer, so use data attributes for anything a no-script style must reveal.
  - **Headless CDP:** it times out on `next dev`, so QA on `next start`.
  - **QA library imports:** import `docs/qa/brand-collection/scripts/lib.mjs` by `file://` URL, because the folder name contains a space.

## 9. Top three tasks before Friday (the owner's 21/10 brief)

**Update, 21/10/2026: all three are now implemented and pass QA** (`docs/qa/demo/HANDOFF.md`):
- the header and full-screen menu (`src/features/demo/SiteHeader.tsx`);
- the hero with the 02.1 floating and sticky bars (`HomeHero.tsx`, `src/app/dev/demo/page.tsx`);
- About, Partner and Contact (`HomeSections.tsx`);
- all five amenities, and the room drawer (`src/features/property-detail/RoomDrawer.tsx`).

The rows in §3 marked "Not built" for these are out of date. What remains is presentation rehearsal and the owner's review. The original task text follows for reference.

1. **Homepage hero, booking bar and header on `/dev/demo`.**
   - A dominant hero (60–70vh on desktop) with a local photo poster and a video-ready slot (no YouTube by default).
   - The frozen `HeroBookingBar` floating over its lower edge (see `/dev/booking-search` for the reference composition).
   - A site header: VNest logo, "Khám phá nơi lưu trú", a prominent "Hợp tác" and a menu trigger.
   - A full-screen overlay with Khám phá nơi lưu trú, Về VNest, Hợp tác cùng VNest and Liên hệ. Native `<dialog>`: Escape, close button, focus trap, focus restoration. Contact and social icons as non-clickable placeholders.
   - Use the same header on Bare Chic in place of `DemoHeader`.
2. **About VNest and Partner with VNest sections on `/dev/demo`.**
   - Only confirmed brand material:
     - tagline "Hospitality Management";
     - three brands, six properties, TP. Hồ Chí Minh and Đà Nẵng;
     - the concept slides' values "Ấm áp, Tự nhiên, Mộc mạc, Gắn kết";
     - the symbol's meaning: separate lines (owners, properties, guests, operators, partners, design, construction, technology) that create value once connected, around an open centre. Source: `docs/design/brand-collection/README.md` §1.
   - Partner section: visually distinctive, with a CTA to a clearly labelled concept or contact block on the same page. No invented business model, returns or statistics; no form or backend.
3. **Bare Chic amenities and room drawer** (`src/features/property-detail/PropertyDetail.tsx`).
   - **Amenities:** remove the `<details>` "Xem tất cả" and show all five supplied amenities at once. Smart TV and Phòng tắm riêng have no pictogram key in `AMENITY_ICONS`; they get the neutral mark unless an icon is added to `Pictogram.tsx`.
   - **Room drawer:** a "Xem chi tiết phòng" control on each room card opens a modal drawer.
     - Size: right side at about 42% width on desktop, near full screen on phones, with internal scrolling and a sticky close control and CTA.
     - Contents: the room's existing photos (`roomPhotos(room.id)`, held photos filtered in demo); its name; "Tiện nghi chung tại Bare Chic" (property-level); the price through the existing `RoomPrice` (figures only in private preview).
     - No size, occupancy, bed or description: VNest has not verified them.
     - CTA: a next step into the 02.1 bar, without fake availability.

Then re-run `node docs/qa/demo/scripts/journey.mjs`. Extend it for the overlay, hero and drawer; it already covers the gallery, room gallery, amenities, CTA, City Notes and same-tab navigation. Do not start the other five property pages.

## 10. Commands

```bash
npm run build
```

```bash
DEPLOY_ENV=development CONTENT_SOURCE=client-draft BOOKING_PROVIDER=none npx next start --port 3400
```

Or use the launch configuration `vnest-v2-client-preview`. `vnest-v2-client-preview-dev` runs `next dev` on port 3401; only one `next dev` can run per folder.

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npm run check
```

`npm run check` runs lint, typecheck and tests together: 285 of 285 tests passed on 20/10. QA scripts: `docs/qa/demo/scripts/journey.mjs` (demo journey, recordings), `docs/qa/city-notes/scripts/regress.mjs` (pixel regression of existing routes).

## Addendum, 21/10/2026 (room facts and demo navigation)

- **Room facts.**
  - `confirmedRoomFact()` and `LEGACY_ROOM_CONFIRMATION` in `src/content/vnest-workbook/property-details.ts` show legacy values from a room's own row only (status `confirmed`, Q37 written record pending).
  - Bare Chic One shows Studio · 28 m² · 2 người lớn; the other three rooms show none.
  - Tests: `room-facts.test.ts` and `property-detail/view.test.ts`.
  - Do not lend merged values to other rooms.
- **Demo navigation.** `src/features/demo/DemoLinkGuard.tsx`, Bare Chic demo view only, redirects 02.1's `/` and `/stays` links into the demo.
- **Known exit.** A search ("Tìm kiếm") still goes to `/stays/bare-chic`, the older 05.1 page. See `docs/qa/demo/HANDOFF.md`.
- **QA:** `node docs/qa/demo/scripts/rooms-and-links.mjs` (drawers and link inventory) and `journey.mjs`.

