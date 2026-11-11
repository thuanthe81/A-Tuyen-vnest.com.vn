# Homepage — Services footer action and closed accordions (10/11/2026)

Status: **done, awaiting the owner's visual acceptance.** Nothing staged or committed; the stash is untouched.

Local: http://localhost:3401/dev/demo?intro=0#hop-tac (add `&lang=en`).

## 1. "Tìm hiểu thêm về hợp tác" as the accordion's footer row

The link to the partner page was a separate text link under the rows, aligned with the description column. It is now
the section's closing row, built on the rows' own grid (`--index`, `--toggle`, `--gap`):
- **Layout:** there is no index. The label "Tìm hiểu thêm về hợp tác" / "Explore partnership opportunities" sits on the
  service names' column; the ↗ is centred on the round toggles' column.
- **Hit area and lines:** the whole row is one link. It starts right under the last row's divider (the existing
  line) and has no line or border of its own.
- **Look:** smaller type than a service, no number, and an arrow instead of a toggle, so it concludes the list rather
  than reading as a fourth service. It is Dark Olive and turns Copper on hover, with the ↗ nudged slightly. It is never
  underlined, has no fill, and has a clear focus ring around the row.
- **Destination:** the partner page, in the visitor's language (`partnerPageHref`).
- **Phones:** the same pattern on the phone grid, with no overflow.

The consultation CTAs inside the open rows are unchanged (solid Copper, preselecting their service).

## 2. Services: every row closed on arrival

`ServiceAccordion` now defaults to no open row (`initial = null`), and the homepage no longer passes a default service.
The form controller's unused "first service" value was removed.
- On arrival, after a refresh and on a fresh load with `?dich-vu=` or `?lang=en`, all three rows are closed. The form
  still preselects the service named in the address, as before.
- Choosing a row opens it; choosing it again closes it; choosing another closes the first. Only one is ever open.
- Unchanged: the design, imagery, client copy, alignment, CTA preselection, keyboard, touch and reduced motion.

## 3. FAQ: every question closed on arrival

`OwnerFaq` no longer opens the first question.
- **Behaviour:** the six questions show with their answers closed. A press opens one; a second press closes it;
  opening another closes the first (native `<details name>`).
- **Accessibility:** each question is a native disclosure. Chrome's accessibility tree reports each as focusable with
  `expanded=false`, then `expanded=true` when open (checked). Enter and Space work, and the summary controls its
  answer, so no extra ARIA was added.
- **Partner page:** it shares this component and now behaves the same (its three questions start closed), which is
  consistent across the two pages.
- **Unchanged:** answers, typography and spacing.

## QA

`scripts/qa-accordions.mjs`, at 375, 390, 768, 1024 and 1440 px, in Vietnamese and English: **476 passed, 0 failed**
(`qa-results.txt`). It repeats every check of the previous rounds and adds:
- **Services:**
  - no row open on arrival (and every region inert);
  - each row closed until chosen, then the only one open;
  - a second press closes it, leaving none open.
- **FAQ:**
  - six questions, none open on arrival;
  - one open at a time, with the client's answer;
  - a second press closes it;
  - no overflow.
- **Footer row:**
  - one link, to the partner page in the same language;
  - the whole row clickable, right under the last divider, with no line of its own;
  - 48 px or taller and no index;
  - label on the names' column (within 1 px) and ↗ on the toggles' column (within 1.5 px);
  - Dark Olive, no underline and no fill;
  - Copper on hover and a focus ring.
- **No automatic opening:** after a service CTA is used, a refresh opens nothing (services or FAQ) and the form keeps
  the chosen service.
- **Partner page FAQ:** closed on arrival; one press opens its answer.

Also:
- **Static checks and unit tests:** lint has 0 errors (the 3 old warnings remain), `tsc` passes and unit tests pass
  464/464.
- **Browser tests:** homepage content 11/11, About 16/16, mobile interactions 16/16.

**Regression test updated: `test/e2e/homepage-content.test.mjs`.** Its assertions were made stricter, not looser:
- every service and every question must be closed on arrival;
- each press must open its item and leave only that one open;
- the last press must close everything again;
- the footer row's destination and alignment are now checked;
- the CTA test opens row 01 first, as a visitor would.

## Files

- `src/features/partner/ServiceAccordion.tsx` and `.module.css`: the footer row; no row open by default.
- `src/features/demo/OwnerJourney.tsx`: no default service passed; comments.
- `src/features/demo/Consultation.tsx`: the unused `initialService` removed.
- `src/features/demo/OwnerFaq.tsx`: no question open by default.
- `test/e2e/homepage-content.test.mjs`: the default-closed behaviour and the footer row.
- `docs/qa/homepage-accordions-2026-11-10/`: this file, `scripts/` and `screens/`.

## Screenshots (`screens/`)

- **Services:** `services-desktop-all-closed.png` (and `-en`), `services-desktop-02-open.png`,
  `services-mobile-all-closed.png`, `services-mobile-02-open.png`.
- **Footer row:** `services-footer-{default,hover,focus}.png`; together in `../footer-states.png`.
- **FAQ:** `faq-desktop-all-closed.png` (and `-en`), `faq-desktop-one-open.png`, `faq-mobile-all-closed.png`,
  `faq-mobile-one-open.png`; side by side in `../faq-closed-and-open.png`.
