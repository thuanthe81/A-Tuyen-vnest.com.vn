# Partnership CTA — interaction study and preview (9/11/2026)

Status: **the owner chose A · Copper wipe (9/11/2026); it is integrated (§ Decision and integration below) and awaits
visual acceptance on the pages.**
- Nothing is staged or committed, and the stash is untouched.

Preview: http://localhost:3401/dev/partner-cta (add `?lang=en`). It is local only and noindex.

## Source of the reference

The screen recording mentioned in the brief was not found on this machine. The only recording, on the Desktop
(8/11 23:31), shows our own Hợp tác concepts.

The interaction was therefore read from the live M Village development site, which the earlier brief referenced. I used
its main CTA, the "Tư vấn miễn phí" / "Trở thành nhà đầu tư" pill, measuring its styles and capturing frames through
the hover (`screens/reference-mvillage-*.png`).

If the owner's recording shows a different button, send it and the study will be redone from it.

## What the reference does

| | M Village |
|---|---|
| Default | Light neutral pill (#F5F4F3), 54 px tall, fully rounded, no border. A 44 px orange disc sits at the left, 5 px from the edge, with a thin white arrow. Black semibold 16 px label. |
| Hover | The disc stretches to fill the pill (width 44 px → full, **300 ms**, ease-out `cubic-bezier(0.4, 0, 0.2, 1)`), leaving a 5 px light ring. The label turns white (**150 ms**). |
| Arrow | Stays still: the movement is the fill, not the arrow. |
| Border | None; the light pill and its 5 px ring frame the fill. |
| Focus | The same as hover, plus the browser's default outline. |
| Flaw | The label turns white in 150 ms, faster than the fill moves. For a moment the end of the label is white on light grey and disappears (`reference-mvillage-1-hover-60ms.png`). |

## The VNest candidate: "wipe"

`src/features/partner/cta-candidates/WipeCta.tsx` and `.module.css`.

**Default**
- Transparent, with a Dark Olive label (#37412F).
- A fine outline: Dark Olive at 32 %, as a 1 px inset line.
- A 44 px disc at the left with a light arrow.
- No arrow cell, no underline, no shadow.

**Hover and keyboard focus**
- The disc's fill wipes across the button (320 ms in, 260 ms out, the reference's curve), keeping a 5 px ring inside
  the outline. The outline takes the fill's colour, and the arrow stays still.
- **Fixed against the reference:** the button is two identical layers. The filled, light layer is clipped to the disc
  at rest and to the whole button when active, so the label changes colour exactly at the fill's edge and is never
  invisible (`option-*-wipe-080ms.png`).
- Keyboard focus shows the fill plus a 2 px Dark Olive ring.

**Touch and reduced motion**
- Phones have no hover, so a press shows the fill.
- With reduced motion the state changes with no movement (transition 0 s, checked).

**Accessibility**
- The second copy of the label is hidden from screen readers.
- The button is 54 px tall.
- Contrast: Dark Olive on beige 10:1; light label on Copper 4.6:1, on Dark Olive 11:1.

**Two tones**
- **A · Copper wipe:** Copper appears only in the disc at rest and in the fill on hover. Closest to the reference's
  energy.
- **B · Olive wipe:** the same with Dark Olive, so no Copper at all. Quieter.
- In both, the homepage's link to the partner page uses the olive tone with an up-right arrow. In Option B that makes
  it identical to the consultation CTAs; if B is chosen, the link should get its own variant (for example no disc
  fill).

**Wording and destinations are unchanged.** The preview's live buttons are the real ones:
- the hero's "Trao đổi về tài sản của bạn" goes to the partner page's form;
- the three service CTAs go to the form with their service chosen;
- the homepage row CTA goes to the homepage form;
- the section link goes to the partner page.

## Checks

- `/dev/partner-cta`, VI and EN, at 1440 and 390: no horizontal overflow, no console or hydration errors.
- Reduced motion: transitions are 0 s on every live button.
- No underline anywhere in any button, every button is at least 48 px tall, and the light layer is `aria-hidden`.
- Lint has 0 errors (the 3 old warnings remain), and `tsc` passes. The route is noindex (`X-Robots-Tag: noindex,
  nofollow`) and local only.

## Files (all new; nothing approved changed)

- `src/features/partner/cta-candidates/WipeCta.tsx`, `WipeCta.module.css`
- `src/app/dev/partner-cta/page.tsx`, `preview.module.css`
- `docs/qa/partner-cta-2026-11-09/`: this file, `scripts/shots-cta.mjs`, `screens/`

## Screenshots (`screens/`)

- `compare-reference-and-options.png`: M Village, A and B side by side, at rest, mid-wipe, on hover and on focus.
- `preview-{vi,en}-desktop.png`, `preview-{vi,en}-mobile.png`: the whole preview page.
- `option-{a,b}-{default,hover,focus}.png`: the hero CTA in each state.
- `option-{a,b}-wipe-{000,080,160,240,400}ms.png`: the hover, frame by frame.
- `option-a-mobile-{default,focus}.png`: the phone.
- `reference-mvillage-*.png`: the reference, captured from the live site.

## To decide

1. A (Copper) or B (Olive), or keep today's split CTA.
2. If the wipe is chosen: whether the homepage link keeps the olive wipe (A) or gets a quieter variant (needed with B).
3. Whether the contact card's "Gửi yêu cầu tư vấn" should follow. It is shared with the property-page footers.

Once a treatment is chosen, integration means swapping `CtaContent` + `ctaClass` for `WipeCta` in
`ServiceAccordion.tsx` and `PartnerPage.tsx`, then re-running the QA in
`docs/qa/partner-page-refinement-2026-11-09/scripts/qa-refinement.mjs` with its CTA checks updated.

## Decision and integration (9/11/2026)

The owner chose **A · Copper wipe**. It is now the one partnership CTA, written once in `src/features/partner/CtaContent.tsx`
and `Cta.module.css`, which replace the split CTA. The `CtaContent` + `ctaClass()` interface is kept, so the pages changed
by one argument.

| Where | CTA | Tone |
|---|---|---|
| Partner page, hero | "Trao đổi về tài sản của bạn" → this page's form | Copper |
| Partner page, services 01–03 | each service's CTA → this page's form with the service chosen | Copper |
| Homepage accordion, open row | each service's CTA → the homepage form with the service chosen | Copper |
| Homepage, after the accordion | "Tìm hiểu thêm về hợp tác" → the partner page (up-right arrow) | Olive |

Wording and destinations are unchanged. The candidate folder (`cta-candidates/`) was folded into the shared component.
`/dev/partner-cta` stays as the record of the choice: A marked "chosen, in use", B kept for reference, and the old
split button removed (its code no longer exists).

**Not changed:** the contact card's "Gửi yêu cầu tư vấn →". It is shared with every property-page footer, so it waits
for the owner's word.

**QA** (`scripts/qa-cta-integration.mjs`, 375–1440, VI and EN): **388 passed, 0 failed** (`qa-results.txt`).
- It repeats all of the refinement round's checks.
- The CTA checks were rewritten for the wipe: the readable base layer and the aria-hidden filled copy say the same; each
  CTA is transparent at rest; contrast is 10:1 at rest and 4.6:1 or more filled; there is no underline; each is at least
  48 px tall.
- Hover opens the fill, colours the outline and leaves the arrow exactly where it was, then returns to rest.
- Keyboard focus shows the fill and a solid ring.
- Under reduced motion, transitions are 0 s.

**Also:**
- lint has 0 errors (the 3 old warnings remain) and `tsc` passes;
- unit tests pass 464/464;
- browser tests pass: homepage content 11/11, About 16/16, mobile interactions 16/16;
- `next build` succeeds.

**Screenshots:**
- `integrated-ctas-default-hover-focus.png`: hero, service, homepage row and homepage link, each at rest, on hover and
  with focus.
- `integrated-cta-mobile.png`: the CTA on a phone.
- `integrated-partner-page-mobile-sheet.png`: the phone page in four columns.
- `integrated/`: full pages and every close-up.

**Files changed for the integration:**
- `src/features/partner/CtaContent.tsx` and `Cta.module.css`: now the wipe.
- `src/features/partner/ServiceAccordion.tsx`: the link uses the olive tone; its comments are updated.
- `ServiceAccordion.module.css` and `page/PartnerPage.module.css`: comments only.
- `src/app/dev/partner-cta/page.tsx`: records the choice.

**Removed:** `src/features/partner/cta-candidates/`.

## Correction (9/11/2026, after the owner's review): homepage solid, partner page two-state wipe

The copper wipe was **not accepted**. Two scoped changes, with no other redesign.

### Homepage: the approved solid Copper CTA, restored

The Concept B accordion's CTAs are again the approved button from before the experiments:
- solid Copper (#9A683C), white label and → arrow;
- 56 px tall, 10 px corners, 1.5 rem side padding, the original soft shadow;
- on hover the Copper deepens slightly (#8F6036) and the arrow nudges 4 px.

There is no wipe and no arrow cell. Each CTA stays on the description's column (the approved alignment polish).

The link "Tìm hiểu thêm về hợp tác ↗" is understated again: Dark Olive text, a Copper ↗ and no fill. It has **no
permanent underline**; its label is underlined only on hover or keyboard focus.

Labels, destinations and service preselection are unchanged.

### Partner page: the two-state wipe (`/dev/demo/hop-tac` only)

`src/features/partner/CtaContent.tsx` and `Cta.module.css`, a scoped class used only by the partner page's hero and
service CTAs.

- **At rest:** white, Dark Olive label, Copper arrow (#A87444), one subtle 1 px edge. No disc, no olive segment, no
  second outline.
- **Hover, keyboard focus or press:** one Copper layer (#9A683C, the approved CTA Copper) is revealed from **left to
  right over the whole button**: label, arrow area and edge, in **300 ms** (ease-out). It runs back the same way when
  the pointer leaves.
  - At the end the button is entirely Copper with a white label and arrow, one object.
  - No ring except the keyboard-focus ring; no shadow, glow or scaling. The arrow stays still.
- **Readable throughout:** the Copper layer carries its own white copy of the label and arrow (hidden from screen
  readers), laid out identically. Every letter is therefore either Dark Olive on white (11:1) or white on Copper
  (4.6:1), never white on white.
  - #9A683C is used for the fill because white on #A87444 is only 4.0:1, below AA at this text size. The resting arrow
    uses #A87444.
- **Reduced motion:** the state changes at once.

Not changed: the contact card, footer, form and booking buttons, and every global style.

`/dev/partner-cta` now records this decision: the partner CTA at rest, at 50 %, at 100 % and focused, with the live
buttons, plus a note that the homepage keeps solid Copper. The superseded experiments' code was removed; their
screenshots stay above.

### QA

`scripts/qa-cta-correction.mjs`, at 390, 768, 1024 and 1440 px, in Vietnamese and English: **344 passed, 0 failed**
(`qa-results-correction.txt`). It repeats every earlier check (client text from the client document, preselection,
captions, brand ecosystem, layout, console) and adds:
- **Homepage CTA:** solid Copper (#9A683C), a white label and →, 10 px corners, no clipped layer and no underline. On
  hover it turns #8F6036 and there are no wipe layers in the section.
- **Homepage link:** Dark Olive text with a Copper ↗, no fill and no permanent underline. It opens the partner page in
  the same language.
- **Partner CTAs at rest:** white, a Dark Olive label, a Copper arrow, a single 1 px edge and no ring. The Copper face
  is hidden and screen readers skip it, and both faces say the same.
- **Partner hover (1440 and 1024):**
  - a running clip-path transition of 250–350 ms;
  - at the end, the Copper face covers every one of 24 sample points across the button, the arrow area included;
  - no ring, no scaling, and the arrow does not move;
  - leaving starts a reverse transition of 250–350 ms, which returns to rest.
- **Keyboard focus:** fills the button and shows a solid ring.
- **Reduced motion:** transitions are 0 s and the state is still reached.
- **Taps and destinations:** on phones, tapping a service CTA lands on the form with that service chosen. Every CTA
  keeps its address.

Also:
- lint has 0 errors (the 3 old warnings remain), `tsc` passes and unit tests pass 464/464;
- browser tests pass: homepage content 11/11, About 16/16, mobile interactions 16/16;
- `next build` succeeds.

The dev server was restarted once more because the Mac's network address changed again (now 192.168.100.171). Its two
LAN tests passed after the restart.

### Screenshots (`screens/correction/`, and `screens/correction-sheet.png`)

- **Homepage:** `home-cta-desktop-default.png`, `home-cta-desktop-hover.png`, `home-cta-mobile-default.png`,
  `home-link-desktop-default.png`, `home-section-{desktop,mobile}.png`.
- **Partner hero:** `partner-hero-0-default.png`, `partner-hero-1-wipe-50.png` (the page's own transition, paused where
  the Copper covers half the button), `partner-hero-2-wipe-100.png`, `partner-hero-3-focus.png`,
  `partner-hero-mobile-default.png`.
- **Partner service:** `partner-service-0-default.png`, `partner-service-2-hover.png`,
  `partner-service-mobile-{default,focus}.png`.
- **Full page and review page:** `partner-page-desktop-full.png`, `review-page-{desktop,mobile}.png`.

### Files

- `src/features/partner/ServiceAccordion.tsx` and `.module.css`: the solid Copper CTA and the understated link, both
  restored.
- `src/features/partner/CtaContent.tsx` and `Cta.module.css`: now the partner page's two-state wipe only.
- `src/app/dev/partner-cta/page.tsx` and `preview.module.css`: the record of the decision.
- `docs/qa/partner-cta-2026-11-09/scripts/qa-cta-correction.mjs` and `shots-cta-correction.mjs`.

The partner page's own files are unchanged (it already used `CtaContent` + `ctaClass()`).
