# About VNest V2 — "The Art of Staying" (4/11/2026)

Status: READY FOR OWNER VISUAL ACCEPTANCE, not frozen. Production build on `vnest-v3-qa` (http://localhost:3402/dev/demo#ve-vnest).
Copy is a **DRAFT pending VNest content approval**.

Evidence (`screens/`): `about-{375,390,430,768,1440}-after.png` (section), `about-*-before.png` (old section),
`compare-about-{1440,390}.png` (before/after), `homepage-full-{1440,390}-{before,after}.png` (full homepage context),
`about-{1440,390}-option-copper-C08A57.png` (contrast option, see §4). Scripts: `capture.mjs`, `render-contrast-option.mjs`;
checks: `test/e2e/about-vnest.test.mjs`.

## 0. Bilingual typography (added 5/11/2026)

- **Copy model:** the section's copy is `LocalizedText` (`src/features/demo/about-copy.ts`), resolved with the existing
  `resolveLocalized(value, locale)`, so the English version shows no Vietnamese copy. A unit test (`about-copy.test.ts`) requires the
  English to be complete (`missingTranslations`) and free of Vietnamese apart from the brand name The Nắng Suites.
- **Vietnamese:** "Ở." / "Theo cách riêng." / "Khám phá các không gian". **English:** "Stay." / "Your way." / "Explore our stays".
- **Language marking:** the section carries `lang="vi"` or `lang="en"`. On the Vietnamese page the English eyebrow and title are
  marked `lang="en"`.
- **Compositions:** both use Cormorant Garamond italic, which has full Vietnamese glyph support (the "Ở" hook renders properly).
  "Ở." is a single glyph set large (100–160 px). "Stay." is five letters, so it is set smaller and tighter (72–132 px, −0.025em, with a
  little room for the italic full stop). In both languages, at every width, the display word is the largest type in the section and
  shares one row with its supporting line, which never breaks.
- **English description:** the build team's DRAFT translation, because the brief supplied only the display word, supporting line and
  CTA: "From Bare Boutique Stays to The Nắng Suites and Pepper House, VNest brings together places to stay with a character of their
  own, carefully considered in every experience and warm in the way they welcome you." VNest must approve it.
- **How English is reached:** `site.enabledLocales` is still Vietnamese only and no `/en` pages exist, so English is a private preview:
  `/dev/demo?lang=en`. Only the About section is translated so far; the rest of the homepage stays Vietnamese in that preview.
- **QA (vi and en at 375, 390, 768, 1440; 8/8):**
  - Copy, `lang` and CTA target are correct, and no Vietnamese appears in the English version.
  - The serif loads for the glyphs used, and the display word is larger than the title.
  - The supporting line stays on one line on the same row as the display word; the title takes at most two lines.
  - Nothing is clipped (including the "Ở" diacritic), and there is no horizontal overflow.
  - The section's own text moves at most 1 px between first parse and fonts ready (next/font preloads the serif with a size-matched
    fallback).
- **Screenshots:** `screens/compare-bilingual-{375,390,768,1440}.png` and `screens/bilingual-{vi,en}-*.png`.
- **Pre-existing, outside this section:** on a 1440 px load the homepage has one hydration-time layout shift (≈0.5). The services and
  contact sections change height and the About band moves 80 px as a whole; its content does not change. This is relevant only when
  someone lands directly on `#ve-vnest`. Not changed here.

## 1. What was built

- A full-width Dark Olive (#37412F) band, height set by its content (never 100vh), between the stays and the services.
- Left (45%): eyebrow "VNEST / OUR STORY", the `h2` "ABOUT VNEST." (Be Vietnam Pro 600, oversized, two lines on desktop, one on phones).
- Right (55%): "Ở." in copper serif italic, "Theo cách riêng." on its baseline, the one-paragraph description, and the quiet link
  "Khám phá các không gian ↗" (sand text, copper underline).
- Phones: stacked; "Ở." stays the largest glyph at every width (100 px at 375 px, title 44 px); "Theo cách riêng." never breaks.
- Real HTML text; `section#ve-vnest` named by its `h2`; English lines marked `lang="en"`. The page keeps one `h1`.
- CTA: a real link to the existing discovery section (`/dev/demo#kham-pha`); on the homepage it scrolls smoothly without adding a history
  entry (same behaviour as the collection's "Xem tất cả nơi ở"); reduced motion respected; 44 px target; visible focus ring.
- No photographs, logo letterforms, symbols, cards, brand list, counters or animation (only a colour transition on the link underline).

## 2. Removed

- The old section: headline "Mỗi không gian, một câu chuyện riêng.", the long description, the VNest symbol, the four value chips,
  the brand list (Bare / The Nắng / Pepper House), both photographs (Bare Hyphen, Bare Đa Kao) and the "TP. HCM · Đà Nẵng" card.
- Its code: `AboutVNest`, `VALUES` and `BRAND_PORTFOLIO` in `HomeSections.tsx`, and 255 lines of About-only CSS in `Demo.module.css`
  (checked unused elsewhere). No media file or manifest touched.

## 3. Typography and spacing

| Element | Desktop (1440) | Phone (375) |
| --- | --- | --- |
| "ABOUT VNEST." | 100 px, line-height 0.92, −0.035em, 2 lines | 44 px, 1 line |
| "Ở." | 160 px Cormorant Garamond italic 500, copper | 100 px |
| "Theo cách riêng." | 36 px, 500 | 22 px |
| Description | 18 px / 1.65, max 38rem | 16 px / 1.65 |
| Section padding | 112 px top/bottom | 52 px |
| Section height | ≈ 510 px | ≈ 500 px (about 0.6 of the screen) |

**New font:** "Ở." needs a serif with Vietnamese glyphs; the site only had Be Vietnam Pro. Cormorant Garamond (SIL OFL, Vietnamese subset)
is loaded via `next/font` (self-hosted, one weight, italic only) and applied to this section only. PROVISIONAL, like the body face,
until VNest's typography is supplied.

## 4. Decision needed: copper contrast

The specified copper **#A87444 on #37412F is 2.68:1**, below the WCAG minimum of 3:1 even for very large text. It is implemented as
specified. A lighter tint of the same copper, **#C08A57, is 3.58:1** and passes for large text; see
`about-1440-option-copper-C08A57.png` and `about-390-option-copper-C08A57.png`. All other text passes (sand on olive 9.11:1; eyebrow and
description are lighter sand at 72% and 86% opacity, both above 4.5:1). The CTA underline is decorative; its text is sand.

## 5. QA (production build)

| Check | Result |
| --- | --- |
| 375 / 390 / 430 / 768 / 1440: olive background, sand text, `h2` names the section, no images/symbols/lists, old copy gone, copper serif italic "Ở." larger than the title, "Theo cách riêng." on one line, not full-height, no horizontal or in-section overflow, CTA ≥ 44 px, no console errors | PASS (5/5) |
| CTA: real link to `/dev/demo#kham-pha`; tap scrolls to the stays; address unchanged | PASS |
| Mobile menu "Về VNest" still reaches `#ve-vnest`; scroll lock released | PASS |
| Section order (stays → About → services); one `h1` | PASS |
| Nest Converge intro runs and clears (1440, 390), no errors | PASS |
| Hybrid booking e2e / mobile interaction suite | 79/79 · 16/16 |
| `npm run check`: lint 0 errors (3 old warnings in `docs/qa` scripts), typecheck, 400 unit tests | PASS |
| Production build | PASS |

## 6. Files changed

`src/features/demo/AboutVNest.tsx` (new), `src/features/demo/AboutVNest.module.css` (new), `src/features/demo/DiscoverLink.tsx` (new),
`src/styles/fonts.ts` (editorial serif), `src/app/dev/demo/page.tsx` (import), `src/features/demo/HomeSections.tsx` (old About removed),
`src/features/demo/Demo.module.css` (old About styles removed), `test/e2e/about-vnest.test.mjs` (new), this folder.
Nothing staged, committed, pushed or deployed; the 21 previously staged files are untouched.
