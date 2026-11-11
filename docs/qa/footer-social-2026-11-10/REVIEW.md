# Footer — social icons (10–11/11/2026)

Status: **design approved by the owner 11/11/2026 (desktop, tablet, mobile). Facebook activated and integrated QA
passed 11/11/2026.** Nothing staged or committed; the stash is untouched.

## Final round (11/11/2026): Facebook link and integration safety

### 1. Facebook is a real link

- **Verified.** On 11/11/2026 I re-read the page itself, logged out, in the built-in browser:
  facebook.com/vnest.com.vn/about is "VNEST Hospitality Management". Its address (12/18 Nguyễn Thị Minh Khai), mobile
  (090 698 82 61) and email (hello@vnest.com.vn) match `vnest-contact.ts` exactly. This is the same page as the
  25/10 evidence (`docs/qa/v3-final-2026-10-25/evidence/facebook-about-2026-10-25.txt`).
- **The link:**
  - It opens `VNEST_CONTACT.facebook.href` in a new tab (`target="_blank" rel="noopener noreferrer"`).
  - The URL is read from the existing contact configuration, which the contact card also uses. It is not copied
    anywhere.
  - It is named "Facebook VNest (mở trong tab mới)" / "VNest on Facebook (opens in a new tab)" (`socialOpen` in
    `site-copy.ts`).
  - It has no tooltip and is a normal tab stop. Its focus ring hugs the icon (2 px Dark Olive), and it turns Copper on
    hover.
- **Placeholders:** Instagram, LinkedIn and TikTok are unchanged. They are non-navigating images named
  "… – sắp cập nhật", with the tooltip. To activate one later, give it an `href` from `vnest-contact.ts`.
- **Design unchanged:** the final screenshots (`screens/integrated/`) are byte-identical to the approved ones at all
  11 captured states (1440, 1024, 768, 390 and 375 px; VI and EN; homepage, partner page and results page). The only
  new visual is the keyboard focus ring (`screens/integrated/footer-right-facebook-focus.png`).

### 2. Concurrent form-backend work protected

- **The reported compile error.** In the form session's `src/domain/consultation.ts`, two regular expressions
  (`CONTROL`, `CONTROL_EXCEPT_NEWLINE`) contained raw U+2028/U+2029 characters, which JavaScript reads as line breaks.
  That session fixed it itself at 23:46 on 10/11, writing them as `\u2028\u2029` escapes (checked: no raw characters
  remain). I didn't edit that file.
- **State before this round.** The form session's last code edit was at 00:01 and its review at 00:29 on 11/11, and its
  own review reports the work as complete. Its files were stable.
- **Proof nothing was lost.** I took a fingerprint (shasum) of all 37 of its modified and new files before this round,
  and every one is unchanged after it.
  - Its rules in `OwnerJourney.module.css` (the form's hunks near lines 270 and 300) were not touched; my edits are
    only in the footer block.
  - `.claude/launch.json` was restored to its exact earlier bytes after a temporary QA entry was removed.
- **Its screenshots.** Its QA script writes screenshots into its own `shots/` folder. To avoid overwriting them, I ran
  copies of the script from my scratchpad.

### QA — isolated (10/11/2026, earlier round)

- **Setup:** a temporary copy containing committed code plus only the footer files, served by a dev server.
- **Results:** footer QA 667/667 (`qa-results.txt`, `scripts/qa-footer.mjs`).
- **Limits:** it covered the footer with all four icons as placeholders. It didn't include the form-backend code.

### QA — integrated (11/11/2026, the real combined working tree)

| Check | Result |
| --- | --- |
| `npm run typecheck` | clean |
| `npm run lint` | 0 errors (3 old warnings in old QA scripts) |
| `npm test` (includes the form session's 36 new tests) | 500 / 500 |
| `npm run build` (production) | passes |
| Footer QA on the production build, `scripts/qa-footer-integrated.mjs` (home, partner, results; 375–1440; VI + EN) | 844 / 844 |
| e2e homepage-content / mobile-interactions / about-vnest (production build) | 11/11, 16/16, 16/16 |
| Form QA `qa-consultation.mjs`, mock-delivery checks (production build with `CONSULTATION_DELIVERY=mock`) | 142 / 142 |
| Form QA, delivery-off checks (production build, default config) | 12 / 12 |

- **Footer QA covers:**
  - Facebook: the official URL, `_blank`, safe `rel`, no `window.opener`, and a click that opens a new tab and leaves
    the page in place (Facebook's response was stubbed, so nothing reached Facebook).
  - Facebook's label, Copper hover with no tooltip, and focus ring.
  - Tab order: links → Facebook → back to top.
  - The three placeholders: labels, tooltip, not focusable.
  - The approved design: Dark Olive, 18 px, alignment, gaps, the layout at each width, no overflow, footer content
    kept, a clean console, and the accessibility tree (three images and one link).
- **Form QA:** this production server can run with either mock or off delivery, not both, so I ran the form session's
  script once per mode. Its mock-mode block (142 checks) ran against a mock server and its off-mode block (12 checks)
  against the default server. The checks are exactly the form session's own, and the total of 154 matches its review.
- **Combined application:** ready on both counts. The integrated typecheck and production build pass.

### Files changed this round

- `src/features/demo/FooterSocial.tsx`: Facebook gets its `href` from `VNEST_CONTACT` and renders as a link.
- `src/features/demo/site-copy.ts`: `socialOpen` (VI and EN).
- `src/features/demo/OwnerJourney.module.css`, footer block only:
  - the shared class is renamed `.socialIcon`;
  - the tooltip appears only on placeholders, which keep the arrow cursor;
  - the link's focus ring is on the icon.
- `docs/qa/footer-social-2026-11-10/`: this section, `scripts/qa-footer-integrated.mjs`,
  `scripts/shot-facebook-focus.mjs`, `qa-results-integrated.txt` and `screens/integrated/`.

---

# Earlier round (10/11/2026): social placeholders

The footer's bottom row is shared by every demo page (homepage, partner page, results, booking step, property pages),
so the change shows on all of them. Nothing else in the footer changed: the logo block, the contact card (property
pages and results), the four links, © 2026 VNest and "Về đầu trang ↑" are all kept.

## What changed

- **Four icons** (Instagram, LinkedIn, TikTok, Facebook) now sit at the right of the bottom row, just before
  "Về đầu trang ↑", in one right-hand group.
- **Look:**
  - thin Dark Olive line icons at 18 px with even spacing, a transparent background and no pills or brand colours;
  - their centres line up with the row's text;
  - the line icons are from Tabler Icons (MIT), at a 1.5 stroke.
- **Placeholders, not links:**
  - nothing navigates and no address was invented;
  - the icons aren't keyboard stops, so Tab goes from the links straight to "Về đầu trang ↑";
  - the cursor stays an arrow.
- **Hover (mouse only):** the icon turns Copper and a small "Sắp cập nhật" / "Coming soon" tooltip appears above it.
- **Screen readers:** the group is announced as the list "Mạng xã hội VNest", with each icon as an image named
  "Instagram – sắp cập nhật", "LinkedIn – sắp cập nhật", "TikTok – sắp cập nhật" and "Facebook – sắp cập nhật".
  In English the list is "VNest social media" and each item reads "… – coming soon".
- **Layout by width:**
  - **≥ 1024 px:** one row, as before: links · © · icons + back to top.
  - **768–1023 px:** links on the first line; © on the left and the right-hand group on the second.
  - **Phones:** links, then the icons (left, aligned with the links) with back to top on the right, then ©.

## For the owner (10/11; resolved 11/11, see the final round above)

- **Facebook already has an official URL:** facebook.com/vnest.com.vn. The contact card on property and results pages
  links to it ("Facebook"), so on those pages the footer icon saying "sắp cập nhật" contradicts it. Recommendation:
  link the footer Facebook icon to that page, in a new tab, and keep the other three as placeholders. That is a
  one-line change, not made yet because the brief listed Facebook as a placeholder.
- **Next step:** when the Instagram, LinkedIn and TikTok URLs arrive, each icon becomes a link with the same artwork
  (`FooterSocial.tsx`).

## QA

`scripts/qa-footer.mjs` covers the homepage, partner page and results page (the full footer) at 375, 390, 768, 1024
and 1440 px, in Vietnamese and English: **667 passed, 0 failed** (`qa-results.txt`).
- **Labels and semantics:**
  - the list label and the four image labels;
  - the order;
  - no link, button or tab stop;
  - artwork hidden from screen readers;
  - accessibility tree checked.
- **Look:**
  - Dark Olive, transparent and 18 px;
  - on one line, centred with "Về đầu trang ↑" (within 1 px);
  - even gaps;
  - icons before back to top, which stays on the right edge.
- **Layout:**
  - the one-row, tablet and phone arrangements;
  - phone icons aligned with the links;
  - no horizontal overflow.
- **Behaviour:**
  - the tooltip is hidden at rest;
  - hover turns the icon Copper and shows the tooltip;
  - Tab skips the icons.
- **Footer content and console:** everything kept, and the console is clean.

Lint passes on the changed files.

**Verification note.** During this round another session was building the consultation form's backend in the same
checkout: new `src/domain/consultation.ts`, `src/server/*`, `src/app/api/consultation/`, plus edits to `env.ts`,
`Consultation.tsx`, `owner-journey.ts`, `contact-copy.ts`, the two demo pages and the form styles in
`OwnerJourney.module.css`. Its `src/domain/consultation.ts` didn't compile at the time, because a regular expression
contains raw line-separator characters, so the shared dev server on 3401 returned errors. I left that work untouched.
QA ran on a temporary copy instead: committed code plus only the four footer files below, served on 3407. That copy
has since been stopped and its launch entry removed. My rules in `OwnerJourney.module.css` are in the footer block,
apart from that session's form rules.

## Files

- `src/features/demo/FooterSocial.tsx` (new): the four placeholders.
- `src/features/demo/DemoFooter.tsx`: the right-hand group (icons + back to top).
- `src/features/demo/OwnerJourney.module.css`: the bottom row's layout by width, and the icon and tooltip styles.
- `src/features/demo/site-copy.ts`: `socialLabel`, `socialPending`, `socialTip` (VI and EN).
- `docs/qa/footer-social-2026-11-10/`: this file, `scripts/`, `screens/` (and `screens/before/`).

## Screenshots (`screens/`)

- **Homepage:** `home-footer-{1440,1024,768,390,375}-vi.png`, `home-footer-{1440,390}-en.png`.
- **Hover:** `footer-right-default.png`, `footer-right-hover.png` (tooltip).
- **Other footers:** `partner-footer-*` and `results-footer-*` (the full footer with the contact card), at 1440 and
  390.
- **Before:** in `before/`.
