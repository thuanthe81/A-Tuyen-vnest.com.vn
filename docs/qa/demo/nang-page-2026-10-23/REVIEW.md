# The Nắng Suites — visual review, 23 October 2026

Demo entry: http://localhost:3400/dev/demo
New property: http://localhost:3400/dev/stays/the-nang-suites

## Completed

- Blue Moon **17.png** replaces Green River in the Nắng homepage showcase, card and combined/all-brand previews. Daylight, a centered bed/lounge composition, blue textiles and warm wood work across wide and card crops.
- Bare Hàn now uses the corrected **Bare Han Ground / 26.jpg** from workbook v2 D16. Exact folder title and Bare watermark verified.
- Nắng detail reuses the VNest property architecture: seven photos grouped into Blue Moon, Yellow Submarine, Pale Blue Eyes and Green River; gallery, room drawers, property-level amenities, location, Da Nang City Notes and unchanged booking-bar handover. Its blue-grey, beige and timber/gold palette is scoped to the new page.
- Public pricing safeguards, same-tab navigation, existing logos and all previously excluded photographs preserved. New photos with people are also excluded.

## Screenshots

| View | Desktop 1440 | Mobile 390 |
|---|---|---|
| Homepage all brands | [All](1440-home-all.png) | [All](390-home-all.png) |
| Nắng selected | [Nắng](1440-home-nang.png) | [Nắng](390-home-nang.png) |
| Bare selected | [Bare](1440-home-bare.png) | [Bare](390-home-bare.png) |
| Bare Hàn card | [Bare Hàn](1440-home-bare-han.png) | [Bare Hàn](390-home-bare-han.png) |
| Nắng first view | [First view](1440-nang-first-view.png) | [First view](390-nang-first-view.png) |
| Nắng full page | [Full page](1440-nang-page.png) | [Full page](390-nang-page.png) |
| Nắng drawer | [Drawer](1440-nang-drawer.png) | [Drawer](390-nang-drawer.png) |

Tablet evidence uses the same filenames prefixed `768-`. Pepper selected screenshots are also included.

## Limitations retained

- Nắng's house number and current ward await confirmation (existing Q19/Q14). The street number is withheld; the existing location note and property map remain. Workbook: K174/31 Võ Văn Kiệt; earlier evidence: 74/31. No guessed correction.
- Room sizes, occupancy, bedding and numeric rates are omitted. Online booking is not connected; the room CTA hands over to the existing date selector, not a simulated reservation.
- Local demo only; images remain ignored by Git and public release rights are not inferred. The existing missing `/favicon.ico` produces a non-photo 404.
- No performance score measured. No commit, push, merge, deployment, branch switch, reset, clean, stash or freeze.

Provenance and exact hashes: [PHOTOGRAPHY.md](PHOTOGRAPHY.md), [sources.json](sources.json). Scope: [SCOPE.md](SCOPE.md).

## QA results

- Lint: pass, zero errors; three pre-existing warnings in older QA scripts (`lint-final.log`).
- Typecheck: pass (`check.log`).
- Unit tests: **292/292 pass** (`check.log`), including new Nắng grouping/missing-media coverage and existing exact-source photo guards.
- Production build: pass after final scoped mobile CSS (`build.log`).
- Browser: 1440/768/390px, no horizontal overflow or broken property images. New page reached through the real homepage link; grouped gallery and room drawer verified at each width (`capture.json`). Screenshots inspected at all three widths.
- Brand/city filters: **36 states**, correct counts, all official logos loaded, no overflow (`brands.json`). Existing incompatible-city behavior retains its explanatory brand reset.
- Preservation journey: homepage hero/booking bar, menu keyboard focus, About/Partner links and contact CTA, same-tab Bare Chic navigation, photo viewer, room drawer and date-picker handover, City Notes tabs/expand/collapse, and masterbrand return all pass at all three widths (`results.json`). No console errors; only existing favicon 404 on first desktop load.
- Seven new originals match recorded hashes; every prior photo-manifest entry is unchanged (`preservation.json`).

Working tree remains on `design/vnest-property-gallery-exploration`, with the original 22 tracked modified files and extensive untracked source preserved. This task adds the Nắng draft/route, demo-only approved-photo mapping, a property-scoped palette, and review evidence. Shared drawer copy now uses the current property name (Bare Chic's wording remains identical). No frozen search implementation was edited.
