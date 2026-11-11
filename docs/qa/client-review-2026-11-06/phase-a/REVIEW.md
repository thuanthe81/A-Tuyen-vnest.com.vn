# Phase A — general homepage refinements (client review 6/11/2026)

Status: **conditionally accepted 7/11/2026; corrections and the final contact refinement built, awaiting the owner's
final Phase A visual acceptance** (see "Corrections, 7/11/2026" and "Final contact refinement, 7/11/2026" at the end). Phase B has not started. Nothing committed, staged, stashed or deployed.
Review on the local dev server: `vnest-v2-client-preview-dev`, http://localhost:3401/dev/demo?intro=0 (English: `&lang=en`).

## What changed

| # | Request | Result |
|---|---------|--------|
| A1 | Hero: no dots, arrows or captions; 3 s per slide; soft transition; pause kept | Dots, arrows and the caption line are gone. Each slide stays 3 s once shown (measured 2999–3009 ms at all six widths), then a 900 ms cross-fade (was 600 ms). One quiet round pause/play button stays (WCAG 2.2.2). Hover, keyboard focus, a hidden tab and the pause button stop the rotation; a touch swipe still changes slide. Reduced motion: starts paused, no fade. Photographs, crops and loading order unchanged. |
| A2 | About CTA → contact | "Khám phá các không gian ↗" → "Liên hệ VNest →" (EN "Contact VNest →"), a real link to `/dev/demo#lien-he`; smooth scroll on the homepage, no history entry. The arrow is → because the target is on the same page (↗ means external). Banner otherwise untouched. |
| A3 | Menu: no numbers; Khám phá · Hợp tác · Hỏi đáp · Liên hệ | Done, in that order (EN: Explore · Partner · FAQ · Contact). "Về VNest" left the menu (not in the requested list); the footer still links to it. The menu's contact row now shows VNest's real hotline, email and Facebook instead of the old "Đang cập nhật" placeholders. |
| A4 | FAQ → contact details → form → minimal footer; one background; no DRAFT labels | New order: Services → FAQ → Contact (`#lien-he`) → footer. The contact section uses the FAQ's grid and background with no divider: VNest's details on the left (one large heading, "Bắt đầu một cuộc trò chuyện."), the form on the right (small subheading "Yêu cầu tư vấn"). Phones stack details, then form. The homepage footer is now minimal (logo, links, © 2026 VNest, back to top); property pages keep the full footer with the contact block. Removed from customer view: the DRAFT paragraph, "Bản mô phỏng giao diện · chưa nhận yêu cầu thật", the "chưa hoạt động" pill and "Chính sách…: chờ VNest". The form still says plainly that it is not active and never claims success. |

## Evidence

Before / after, 390 and 1440 px (`before-*.png`, `after-*.png` in this folder): hero, About, FAQ → contact → footer, menu.

Automated checks (`../scripts/qa-a.mjs`, results in `qa-a-results.txt`): **94/94** at 375, 390, 430, 768, 1024 and 1440 px.
They cover hero controls and timing, pause, reduced motion, overflow, section order, contact layout, no DRAFT text, menu order
and fit, menu → contact, About CTA → contact, service CTA → form, the form's non-submission, console and hydration errors, the
English page, and the property-page footer.

| Suite | Result |
|-------|--------|
| lint | 0 errors (3 old warnings in `docs/qa/living-frames` scripts) |
| typecheck | pass |
| unit (`npm test`) | 426/426 |
| e2e about-vnest | 16/16 |
| e2e homepage-content | 11/11 |
| e2e mobile-interactions | 16/16 |
| e2e occupancy | 8/8 |
| e2e room-selection (dev server) | 20/22, see below |
| e2e hybrid-booking (dev server) | 75/79, see below |

The remaining e2e failures are unrelated to Phase A and come from running on the dev server. The suites are written for the
production server; a full run on a fresh production build is planned for Phase E.
- 3 hybrid-booking "provider states" tests need the simulation server (`vnest-v3-qa-sim`, `AVAILABILITY_SIMULATION`).
- 1 hybrid-booking Pepper House @375 test: the dev server never reached "network idle" on the first image-heavy load; the same
  test passes at 390, 430, 768 and 1440.
- 2 room-selection tests: React's development-only warning "Cannot update a component while rendering a different component"
  (`StaySearchProvider` from `PropertyRoomCollection`). This is existing code, untouched here; it will be looked at in Phase D,
  which works on the booking code.

## Test expectations changed (owner-approved behaviour)

- `about-copy.test.ts`, `test/e2e/about-vnest.test.mjs`: CTA text and target (was "Khám phá các không gian" → `#kham-pha`;
  now "Liên hệ VNest" → `#lien-he`). The "Về VNest reaches the section" check now uses the footer link instead of the menu.
- `test/e2e/mobile-interactions.test.mjs`: the current hero slide is read from the slide groups (`aria-hidden`), since the dots
  no longer exist. The autoplay and swipe assertions are unchanged.
- `test/e2e/hybrid-booking.test.mjs`: the menu link is found by its target `#kham-pha` (label is now "Khám phá").
- `mobile-interactions.test.ts`: the "never fake success" text check reads `contact-copy.ts`, where the form copy now lives.
  The expected sentence is unchanged.

## Problems found in the existing working tree, fixed here because they blocked the review

- `/dev/demo` did not compile in dev: today's bilingual work made `HomeHero` a client component that imported a value from
  `hero-slides.ts`, which reads the selection manifest from disk (`node:fs`). Fix: the 3 s constant moved to the client-safe
  `hero-timing.ts`, and `hero-slides.ts` re-exports it.
- `HeroCarousel` imported `photoAlt` from `photo-alts-en`, a file that does not exist; it is in `content-en.ts`.
- At phone width the header "VI | EN" switch overlapped the logo and pushed the page 30 px wide, because the switch's own
  `display` rule won over the header's `display: none`. The header rule is now scoped to `.nav`. On phones, the switch is in the
  menu, as intended.

## Files

New: `ContactChannels.tsx` (one contact block for the homepage, footer and menu), `vnest-contact.ts` (VNest's contact data,
moved out of `DemoFooter.tsx`), `contact-copy.ts` (bilingual form copy and validation messages), `SectionLink.tsx` (replaces
`DiscoverLink.tsx`, which became unused), `hero-timing.ts`.
Changed: `HeroCarousel.tsx`, `HomeHero.tsx`, `hero-slides.ts`, `Demo.module.css`, `site-copy.ts`, `links.ts`, `SiteHeader.tsx`,
`AboutVNest.tsx`, `about-copy.ts`, `OwnerJourney.tsx`, `OwnerJourney.module.css`, `owner-journey.ts`, `DemoFooter.tsx`,
`src/app/dev/demo/page.tsx`, plus the tests listed above.

## For the owner

1. Approve Phase A as built, or give corrections.
2. Optional choices:
   - Should "Về VNest" return to the menu? It was not in the requested list of four.
   - Is the menu's contact row OK without the postal address? It was dropped so the menu fits a phone screen.
3. **Needed before Phase B5:** the official website URL of each brand (Bare Boutique Stays, Pepper House, The Nắng Suites).
   Only the three Facebook pages exist in the project and the client documents. No URL will be invented.

## Corrections, 7/11/2026 (owner)

Owner's review of the screenshots: three corrections before Phase B. Evidence in `corrections/` (screenshots at 390 and 1440,
`qa-a2-results.txt`); script `../scripts/qa-a2.mjs`, screenshots `../scripts/shots-a2.mjs`.

| # | Correction | Result |
|---|------------|--------|
| 1 | Menu: full section names | VI "Khám phá nơi ở · Hợp tác cùng VNest · QA · Liên hệ"; EN "Explore stays · Partner with VNest · Q&A · Contact". No numbers, same large type. "Về VNest" stays out of the menu and in the footer. The menu's contact row is unchanged (no address; the address is in Contact). The owner wrote "Liên Hệ"; it is "Liên hệ" here, in sentence case like the other three items — one word to confirm. |
| 2 | Contact: Dark Olive identity, form below | `#lien-he` is now one card: a Dark Olive (#37412F) panel with the copper kicker "Liên hệ VNest", the large cream heading "Bắt đầu một cuộc trò chuyện." (72 px at 1440, 2 lines on phones), hotline, email, address, a copper "Gửi yêu cầu tư vấn →" and Facebook; then, directly below, the form on Light Beige (#F8F4EE) with the rounded bottom. Desktop uses the FAQ's 5/7 columns in both parts, so the heading, form title and fields line up with the FAQ. The CTA is a real link to `/dev/demo#tu-van`; it scrolls to the form (smoothly unless reduced motion) and moves focus to the form heading. One `h2` in the section; the form title stays a small `h3`. Fields, draft state and the honest "Chưa gửi…" message are unchanged; no success is ever shown. Minimal footer kept. Service CTAs still go to the form with `#lien-he` in the address (unchanged; existing tests rely on it). |
| 3 | Hero: no visible controls; ≈2 s dwell, ≈600 ms fade | No dots, arrows, captions or button on screen. A slide changes every 2.6 s: a 600 ms cross-fade, then 2 s fully visible (`hero-timing.ts`; measured 2600–2621 ms). Mouse hover no longer pauses it (otherwise a desktop visitor resting on the hero would see it stop). It still pauses while the booking bar or a keyboard-focused element in the hero has focus, and while the tab is hidden. Pause/play is a real button, first in the hero's tab order and always available to screen readers; it is visually hidden and appears as a small pill above the heading only on keyboard focus, without moving the layout. With reduced motion the hero is static (first photograph, no fade). Same photographs, crops and loading. No page auto-scroll. |

### QA

`qa-a2.mjs`: **137/137** at 375, 390, 430, 768, 1024, 1440 px, plus reduced motion, hidden tab, English and the property-page
footer. Covers exact menu labels (VI/EN), every menu anchor and close (click and Escape), menu fit and clipping, contact colours,
heading size and count, form position and background, contact details shown once, CTA → form + focus, honest non-submission,
hero controls hidden, fade and cycle timing, mouse-over no longer pausing, keyboard pause (reveal, no layout shift, holds),
overflow, console and hydration errors.

| Suite | Result |
|-------|--------|
| lint | 0 errors (3 old warnings in `docs/qa/living-frames`; fixed an unused variable in `qa-a.mjs`) |
| typecheck | pass |
| unit | 426/426 |
| e2e about-vnest / homepage-content / occupancy | 16/16 · 11/11 · 8/8 |
| e2e hybrid-booking, menu → Khám phá nơi ở → property → Back | pass |
| e2e mobile-interactions | 14/16 on the dev server. The 2 failures are the scroll-lock stress tests, which use fixed stay dates 6–8/11/2026: since today (7/11) check-in is in the past, so the room hand-off never opens. A scratch copy with dates 20–22/11 passes 16/16. The test file is unchanged; it needs relative dates (Phase E). |

Test expectations changed (owner-approved): `mobile-interactions.test.ts` and `v3-stage1.test.ts` — the hero interval was
3000 ms, now 2600 ms; the "ignore synthesized touch hovers" check became "no hover pause". Comments only in
`about-vnest.test.mjs` and `hybrid-booking.test.mjs` (menu wording).

Files: `site-copy.ts` (menu labels), `OwnerJourney.tsx` + `OwnerJourney.module.css` (contact panel, form below, `#tu-van`),
`SectionLink.tsx` (`tu-van` target, focus after arriving), `ContactChannels.tsx` (comment), `HeroCarousel.tsx` +
`Demo.module.css` + `hero-timing.ts` (timing, no hover pause, focus-revealed pause), the tests above, QA scripts.

## Final contact refinement, 7/11/2026 (owner)

The combined olive-and-beige contact card was not the wanted composition. Evidence in `contact-final/` (each section on
its own and the FAQ → footer run at 390, 768 and 1440 px in both languages; where the contact CTA lands;
`qa-a3-results.txt`); scripts `../scripts/qa-a3.mjs`, `../scripts/shots-a3.mjs`.

| Request | Result |
|---------|--------|
| Restore the original Contact design | `#lien-he` is the footer composition of 25/10 again: the VNest artwork, "Hospitality Management" and the one-line introduction on the left; a standalone, rounded Dark Olive (#37412F) card on the right with "Bắt đầu một cuộc trò chuyện.", hotline, email, address, the copper "Gửi yêu cầu tư vấn →" and Facebook. Same typography and proportions as before (the CSS is the original footer CSS). Below 1024 px the identity stacks above the card. |
| Form as its own section | Page order FAQ → Contact `#lien-he` → Consultation form `#tu-van` → minimal footer. The two are sibling sections in the page, with no shared card. The form sits in its own restrained cream card (#F8F4EE, thin line, rounded on all sides) with a small heading "Yêu cầu tư vấn" (h2 of its own section, about 40% of the contact headline's size). The contact headline is not repeated. Whitespace between the card and the form: 40 px on phones, 56 px at 768, 80 px from 1024. |
| Anchors and CTAs | Contact CTA: a real link to `/dev/demo#tu-van`; scrolls to the form section and focuses its heading, no history entry (mouse and keyboard). Service CTAs: preselect the service, land on `#tu-van`, address `?dich-vu=<id>#tu-van` (was `#lien-he`, now that the form has its own anchor); a shared link with that address opens on the form with the service chosen. The property pages' footer CTA also goes to `/dev/demo#tu-van`; Back returns to the property page. The About CTA and menu "Liên hệ" still go to `#lien-he`. |
| Clean code | One component, `VNestContactBlock.tsx` (identity + card), renders both the homepage Contact section and the property pages' full footer; `VNestBrand` also gives the minimal footer its logo. Contact data stays in `vnest-contact.ts`, channels in `ContactChannels.tsx`, form logic and copy unchanged. Nothing else changed: hero, About, menu, booking, brands. |

### QA

`qa-a3.mjs`: **297/297** at 375, 390, 430, 768, 1024 and 1440 px, Vietnamese and English, plus the property page at 390
and 1440. Covers section order, no shared container, one contact heading on the page, card colours and radius, identity
(logo, tagline, introduction), two columns vs stacked, the whitespace, the form's card and heading, all fields and the four
service choices, contact details shown once, the minimal footer, contact CTA (click and Enter: scroll, focus, no history
entry), the three service CTAs (preselected, in view, focus), the shared link, honest non-submission (never success, values
kept), overflow, console and hydration errors, the property footer CTA and Back.

| Suite | Result |
|-------|--------|
| lint | 0 errors (the 3 old warnings) |
| typecheck | pass |
| unit | 426/426 |
| e2e homepage-content / about-vnest / occupancy | 11/11 · 16/16 · 8/8 |
| e2e hybrid-booking, menu → Khám phá nơi ở → property → Back | pass |
| e2e mobile-interactions | 14/16; the same 2 fixed-date (6–8/11/2026) scroll-lock tests as above. A scratch copy with 20–22/11 passes 16/16 (deleted after the run). |

Test expectation changes (owner-requested structure): the form now lives in `#tu-van`, not inside `#lien-he`.
`homepage-content.test.mjs` expects the service CTA address `…dich-vu=van-hanh#tu-van` and finds the radio in `#tu-van`;
`mobile-interactions.test.mjs` finds the submit button, status and fields in `#tu-van`. The assertions themselves are
unchanged.

Files: new `VNestContactBlock.tsx`; changed `OwnerJourney.tsx` (Contact section, separate form section, service CTA to
`#tu-van`), `OwnerJourney.module.css` (contact and form section rules; the combined-card rules removed), `DemoFooter.tsx`
(uses the shared component; CTA to `#tu-van`), the two e2e files above, QA scripts.
