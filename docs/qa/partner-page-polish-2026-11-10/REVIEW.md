# Partner page — hero and brand row polish (10/11/2026)

Status: **done, awaiting the owner's visual review.**
- Partner page only (`/dev/demo/hop-tac`).
- Nothing staged or committed; the stash is untouched.

## 1. Hero: the three-item service list removed

The small list under the hero CTA (01 Quản lý vận hành, 02 Phát triển dự án, 03 Nhượng quyền thương hiệu) is gone,
along with its styles and its unused label ("Ba dịch vụ"). The heading, supporting line, CTA and photograph are
unchanged.

Rebalanced:
- **Desktop:** the hero is one row. The text block is centred vertically against the photograph (QA: centres within
  2 px), so the CTA closes the text with even space above and below and no gap under it.
- **Photograph:** keeps its earlier size (about 690 px tall at 1440, at least 34 rem) and now fills its frame
  absolutely. With the list gone, the frame lost the height it used to take from that row, and an empty olive band had
  appeared under the photo; that is fixed.
- **Tablet and phone:** the photograph follows the CTA at the hero's normal spacing (32 px).

## 2. Brand row: Bare optically aligned

**Cause.** Bare used its full lockup: the script "bare", a tall empty gap, then "BOUTIQUE STAYS", all in one file.
Standing the three files on one line put Bare's script about 40 px higher than the centres of the other two marks, with
its small serif subtitle far below. The two symbols had their names set under them in our type. The row could not line
up.

**Fix.** One structure for the three brands, in the same layout as before:
- **The mark** is centred in a band of the same height for all three, at its own proportions. Its height is the band
  × an optical factor (Bare 0.56, Pepper House 0.78, The Nắng Suites 0.94), so the thin script and the heavy symbols
  carry the same weight.
- **A small optical lift** is added for marks whose ink sits low in their own box: Bare by 6 % of the band (most of
  the script is its short lowercase letters) and The Nắng Suites by 2 % (its heavy base). Centring the boxes alone
  still left them looking low.
- **The name** is set under each mark, in the same spaced capitals, on one shared line: BOUTIQUE STAYS, PEPPER HOUSE,
  THE NẮNG SUITES.
- **Bare's artwork:** Bare now uses its official script wordmark (`bare-wordmark-transparent.webp`, the derivative the
  homepage brand index already uses) instead of the full lockup. The wordmark is unaltered and keeps its proportions.
  "BOUTIQUE STAYS" is set in the same type as the other two names.
  - Screen readers read "Bare" (the mark's alt) then "Boutique Stays", so each brand's full name is kept.
- **Not changed:** the layout (VNest band above, cream row below), the headline and kicker, phone stacking, and the
  brand data kept for later use. No captions, counts, lines or decorations were added.

**For the owner.** Bare's subtitle is now set in the site's type rather than the lockup's serif, the same as the two
other names. If VNest wants Bare's own serif subtitle, the alternative is an official Bare lockup with a shorter gap.

## QA

`scripts/qa-polish.mjs`, at 390, 768, 1024 and 1440 px, in Vietnamese and English: **344 passed, 0 failed** (`qa-results.txt`). It repeats every
check of the CTA correction round (homepage solid Copper CTA, the partner page's two-state wipe, client text,
preselection, captions, layout, console, destinations) and adds:
- **Hero:**
  - no list in the hero, and the CTA is its only link and closes the text block;
  - the photograph fills its frame;
  - desktop: text centred against the photograph (within 2 px);
  - tablet and phone: the photograph follows the CTA at 24–40 px;
  - no stray space at the hero's foot.
- **Brand row:**
  - the files are official, at their own proportions (within 2 %) and visibly sized;
  - alt plus name gives each full brand name;
  - in the row, the three bands are level and the three names sit on one line (within 1 px);
  - each mark is centred in its band, apart from its own lift (within 1 px), and clears its name;
  - nothing else is in the section.

Also: lint has 0 errors (the 3 old warnings remain), `tsc` passes and unit tests pass 464/464 (the brand-row unit test
was updated to the new structure).

## Files

- `src/features/partner/page/PartnerPage.tsx` and `.module.css`: the hero without its list; the brand row's band and
  name structure.
- `src/features/partner/brand-family.ts`: each mark's `alt`, `caption`, `optical` and `lift`; Bare's script wordmark.
- `src/features/partner/partner-page-content.ts`: the unused "Ba dịch vụ" label removed.
- `src/features/partner/partner-page-content.test.ts`: the brand-row test.
- `docs/qa/partner-page-polish-2026-11-10/`: this file, `scripts/qa-polish.mjs`, `scripts/shots-polish.mjs` and
  `screens/`.

## Screenshots (`screens/`)

- **Brand row:** `compare-brands-desktop.png` (before | after), `brands-{1440,1024,768,390}.png`,
  `brands-other-widths.png`.
- **Hero:** `hero-{1440,1024,768,390}.png`, `hero-all-widths.png`.
- **Full page:** `partner-page-desktop-full.png`, `partner-page-mobile-full.png`.
- **Before:** in `before/`.
