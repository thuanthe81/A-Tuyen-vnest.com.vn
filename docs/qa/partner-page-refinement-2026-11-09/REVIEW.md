# Partner page — final visual refinement (9/11/2026, second round)

Status: **refined, awaiting the owner's visual acceptance.**
- Private preview only, noindex.
- Nothing staged, committed or published; the 21 staged files and the GitHub Desktop stash are untouched.

| What | Local URL |
|---|---|
| Partner page | http://localhost:3401/dev/demo/hop-tac (add `?lang=en`) |
| Homepage section | http://localhost:3401/dev/demo?intro=0#hop-tac |

The page's structure, content and behaviour are as accepted. Only the four requested refinements changed.

## 1. Photography without captions

Removed, everywhere they appeared:
- the "ẢNH MINH HOẠ · PEPPER HOUSE" chip on the service 01 photograph (homepage accordion, partner page, and the Concept
  A reference preview, which shares the visual);
- the "Bare Chic Three · TP. Hồ Chí Minh" and "Pepper House 3rd Floor · TP. Hồ Chí Minh" lines under the hero and Why
  VNest photographs;
- the property and city lines under the three brand photographs, which left with the brand cards (§2).

Kept:
- **Crops and proportions:** unchanged; see the `compare-photo-*.png` sheets.
- **Alt text:** every photograph keeps its alt text in both languages.
- **Sources:** the image registry (`image-selection.ts`: file, SHA-256, original name, authorisation) is untouched.
- **Watermark:** Bare's own mark, inside the delivered hero photograph, is not edited.
- **Photographer credits:** no photographer credit was ever shown, and none is listed in the registry.
- **Removed code:** the draft copy of the removed chip and the caption helper are deleted.

## 2. The brand ecosystem

**Before:** three cards, each with a photograph and its caption, the logo, the name, the positioning paragraph, stays,
cities and a franchise pill, then a franchising note.

**After:** two regions in one quiet composition, with no borders and no shadows.
- **Top, the VNest band (Dark Olive #37412F):** VNest's approved copper symbol, the kicker "Hệ sinh thái lưu trú VNest"
  and the headline "Ba thương hiệu, một sợi chỉ nối." Both are the homepage brand section's approved UI copy, so the
  section has no wording of its own.
  - The symbol stands alone because the approved wordmark is Dark Olive, the band's own colour, and no reversed (cream)
    version exists. Nothing is recoloured.
- **Bottom, the family (cream #FBF9F5):** the three official logo files in the homepage's brand order: Bare Boutique
  Stays, Pepper House, The Nắng Suites.
  - Each file keeps its own proportions; QA checks that the displayed ratio equals the file's within 2 %.
  - They are balanced by eye, not forced to one size: an `optical` height factor per mark (Bare's thin script lockup
    1.0, Pepper House's heavy symbol 0.6, The Nắng Suites 0.72).
  - On a tablet and up they stand on one common line, so Bare's own "BOUTIQUE STAYS" sits level with the other two names.
  - On phones they stack, centred, with generous space between them.
- **Names:**
  - Bare's lockup spells its name, so it gets no text label; its alt text names it.
  - The Pepper House and The Nắng Suites files are symbols only, so their name is set under them in small spaced
    capitals. Without it the section would not say which brand is which.
- **Not shown:** photographs, descriptions, places, counts and franchise marks.
  - Stays, cities and the franchise flag stay in `brand-family.ts`, and the positioning lines in `brand-copy.ts`, for
    later use.
- **Franchising:** this section shows the family, not an offer. Service 03 (client copy) still names Bare Boutique
  Stays and Pepper House only, with VNest management, and shows only their logos. The franchise pills and the closing
  franchising note were removed with the cards.

## 3. The split CTA

One component (`features/partner/CtaContent.tsx` + `Cta.module.css`), used for:
- the hero CTA;
- the three service CTAs on the partner page;
- the three accordion CTAs on the homepage.

**Primary (Copper).**
- The action is set on the Copper body (#9A683C).
- On the right is an arrow cell in a deeper copper (#86592F) behind a fine light separator.
- The arrow is drawn, not typed, so it never takes the text's underline or baseline.
- **Hover:** the body deepens slightly (#8F6036), the arrow cell turns Dark Olive and the arrow moves 3 px, over
  220 ms. There is no glow, gradient or bounce, and the large drop shadow is gone.
- **Accessibility:** contrast is 4.6:1 (white on body) and above 4.5:1 on the cell. Keyboard focus shows a 2 px olive
  ring. Targets are 56 px tall (48 px for the secondary). With reduced motion, nothing moves or fades.

**Secondary (outline).**
- The same shape in Dark Olive, with no fill, an up-right arrow and its own cell, which fills olive on hover.
- Used for the homepage's one section-level link, "Tìm hiểu thêm về hợp tác" / "Explore partnership opportunities". It
  replaces the underlined text link and the short underline under its arrow.

**Wording and destinations.**
- The wording is unchanged and no copy change is proposed.
- Destinations are unchanged: service CTAs preselect their service, the hero CTA goes to the form, and the homepage link
  goes to the partner page (QA checks all three).

**Not changed:** the contact card's "Gửi yêu cầu tư vấn →" button. That card is shared with every property page's
footer, so changing it would reach beyond this page (§6).

## 4. Decoration removed, structure kept

Removed:
- The short copper strokes before every kicker on the partner page (six of them).
- The visible "Ba dịch vụ" label over the hero's service links (it repeated the services heading). The list keeps the
  name for screen readers.
- The hero's dark top rule; it is now a light hairline.
- The tiny copper dashes before each Key Highlight, and the line under each highlight; spacing does the work.
- The underline under the homepage link and its arrow.
- The brand cards' rules, pills and note bar.

Kept, because they separate content or guide a choice:
- the hairlines between the accordion rows and between the three service chapters;
- the lines between the strengths;
- the process line joining the three numbered steps;
- the separators between the hero's service links;
- the FAQ rules;
- every focus indicator.

Kept for the owner to decide: the copper stroke before the homepage accordion's kicker, which the owner asked for on
8/11/2026 (§6).

## 5. QA

`scripts/qa-refinement.mjs` ran at 375, 390, 430, 768, 1024 and 1440 px, in Vietnamese and English: **384 passed,
0 failed** (`qa-results.txt`).

It repeats every check of the first round:
- client text against the client document;
- alignment within 1 px;
- service preselection, the homepage link and the language switch;
- FAQ, form and contact;
- overflow, clipping, and console or hydration errors.

It adds:
- **Photographs:** no caption, chip or credit on or under any photograph, on either page; exactly three photographs
  on the partner page, each with alt text.
- **Brand ecosystem:** VNest's mark, the three official files in order, proportions within 2 %, visible size, names
  only where the file lacks them, and no photograph, paragraph, place, count, link or franchise mark.
- **Franchising:** service 03 still names only Bare and Pepper House and shows no The Nắng Suites artwork.
- **CTAs:** every CTA is a label plus an arrow cell with a drawn arrow hidden from screen readers. Each is at least
  48 px tall, has no underline anywhere and reaches 4.5:1 contrast or more. No underlined arrow link remains.
- **CTA behaviour (desktop, mouse):** hover deepens the body and turns the cell Dark Olive, with a small arrow move.
  Keyboard focus shows a solid ring. With reduced motion, transitions are 0 s and nothing moves.
- **Layout shift:** cumulative layout shift on load is below 0.02.

Also:
- lint has 0 errors (the 3 old warnings remain) and `tsc` passes;
- unit tests pass 464/464, including 2 new ones (logo files and names, no photo caption);
- browser tests pass: homepage content 11/11, About 16/16, mobile interactions 16/16;
- `next build` succeeds.

## 6. For the owner and VNest

- **Reversed VNest logo:** a cream version of the full lockup would let the band show the wordmark beside the symbol.
  Today it shows the symbol only.
- **Brand names:** the "PEPPER HOUSE" and "THE NẮNG SUITES" names are set in the site's type under their symbols.
  Official lockups that include the names would replace them.
- **Repeated headline:** the ecosystem reuses the homepage brand section's headline, "Ba thương hiệu, một sợi chỉ
  nối." Its English, "Three brands, one connecting thread.", is still a draft.
- **Contact card button:** "Gửi yêu cầu tư vấn →" keeps its earlier style. Bringing it to the split CTA would also
  change the property pages' footers. Say if you want it.
- **Homepage kicker stroke:** keep or remove the copper stroke before the accordion's kicker. It was kept as approved
  on 8/11/2026.
- **Still open from the first round:**
  - VNest's own strengths and partnership terms (the fields are ready, nothing invented is shown);
  - approval of the draft and owner-brief copy;
  - the photographs (n° 3, 15, 16);
  - brand websites;
  - the form's lead channel.

## 7. Files

New:
- `src/features/partner/CtaContent.tsx` and `src/features/partner/Cta.module.css`
- `docs/qa/partner-page-refinement-2026-11-09/`:
  - this file and `qa-results.txt`
  - `scripts/qa-refinement.mjs` and `scripts/shots-refinement.mjs`
  - `screens/`

Changed:
- `src/features/partner/page/PartnerPage.tsx` and `.module.css`: no captions, split CTAs, the new ecosystem, the
  decoration cleanup.
- `src/features/partner/ServiceAccordion.tsx` and `.module.css`: split CTAs and the outline link.
- `src/features/partner/ServiceVisual.tsx` and `.module.css`, and `service-visuals.ts`: the photo chip removed.
- `src/features/partner/brand-family.ts`: logo marks (`nameInArtwork`, `optical`) and the homepage's brand order.
- `src/features/partner/partner-page-content.ts`: the brand cards' draft copy and photo choices removed, and comments
  updated.
- `src/features/partner/partner-page-content.test.ts`
- `src/app/dev/demo/hop-tac/page.tsx`: no caption data, no brand photographs.
- `docs/qa/partner-page-2026-11-09/HANDOFF.md`: the ecosystem and the CTA component.

Not touched: booking, GoHost, ezCloud, the hero slideshow, the homepage brand collection, Discovery, Coming Soon,
About, the FAQ copy, the header, menu and footer, and the proxy.

## 8. Screenshots (`screens/`)

- **Brand ecosystem, before and after:** `compare-brands-desktop.png`, `compare-brands-mobile.png`.
- **Partner page, full:** `after/partner-page-desktop-full.png`, `after/partner-page-desktop-full-en.png`,
  `after/partner-page-mobile-full.png`, and the phone page in four columns in `sheet-partner-page-mobile.png`.
- **CTAs:**
  - `compare-ctas.png`: before and after, at rest and on hover (service, homepage link, hero);
  - `after-cta-focus-and-mobile.png`: keyboard focus and the phone CTA;
  - `after/cta-*-{default,hover,focus}.png`.
- **Photography, before and after:** `compare-photo-service-01.png`, `compare-photo-hero.png`, `compare-photo-why.png`.
- **Homepage section:** `after/home-accordion-desktop.png`, `after/home-accordion-mobile.png`.
