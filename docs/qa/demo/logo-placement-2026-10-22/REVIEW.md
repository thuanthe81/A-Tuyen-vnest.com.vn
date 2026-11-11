# Brand Index logo placement — visual review

22 October 2026. IN REVIEW, not approved or frozen.
Demo: http://localhost:3400/dev/demo

Official logos now sit in the brand navigation, beside full names on desktop and above short labels on mobile. Property counts, keyboard radio selection and copper timeline markers remain. The selected showcase uses a compact name/city caption; no redundant logo square. “Tất cả” and VNest masterbrand artwork are unchanged.

Original PNGs remain byte-identical (SHA-256 matches the prior asset manifest). Added tightly cropped transparent lossless WebP derivatives using deterministic background unmatting and continuous edge alpha. No AI generation, erosion, tracing, font substitution or recolouring. Bare's original script wordmark is isolated for legibility next to the full brand name; its complete lockup with subtitle is retained separately. Preparation script and crop dimensions: `prepare-logos.mjs`, `assets.json`.

## Screenshots

| Selection | Desktop 1440 | Mobile 390 |
|---|---|---|
| All | [Screenshot](1440-all.png) | [Screenshot](390-all.png) |
| Bare | [Screenshot](1440-bare.png) | [Screenshot](390-bare.png) |
| Pepper House | [Screenshot](1440-pepper-house.png) | [Screenshot](390-pepper-house.png) |
| The Nắng Suites | [Screenshot](1440-the-nang.png) | [Screenshot](390-the-nang.png) |

Also captured at 768px. Inspected rendered artwork, optical sizing, caption spacing, active states and mobile labels. Full original Bare hairline strokes retained; no artificial thickening.

## Verification

- `check.log`: lint zero errors (three pre-existing warnings), typecheck pass, 288/288 tests pass.
- `build.log`: production build pass.
- `brands.json`: 36 selection/city states, including all 6 properties; Bare 4 / HCM 3 / Da Nang 1, Pepper HCM 1 and Nắng Da Nang 1. Existing incompatible-city fallback retained. No horizontal overflow or unloaded logos.
- `smoke.json`: three official navigation images, no selected-stage images; keyboard ArrowRight selection works, all radio targets exceed 44px in both dimensions, same-tab Bare Chic navigation passes at 1440 and 390.
- No business data, filter/search logic, About/Partner, booking-bar or property-detail changes. Existing exploration routes and source/ignored media retained. No commit, push, merge, deployment or branch change.

Existing photo placeholders for Bare Hàn and Nắng remain intentional. No new blocker identified. Stopped for owner visual review.
