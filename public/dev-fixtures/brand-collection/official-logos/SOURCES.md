# Owner-supplied brand artwork — 22 October 2026

Source: `/Users/noe/Downloads/VNest_Brand_Logos_Codex_Handoff.zip`.
Original PNGs are byte-for-byte copies. WebP derivatives use Sharp lossless encoding at original dimensions. Decoded RGB pixel equality verified for all three; no crop, recolouring, background removal, or redraw.

| File | Dimensions | Original SHA-256 |
|---|---|---|
| bare-boutique-stays.png | 2048 × 2048 | 5f21a2480226fda1f5aa5e65d547b18bf7ae522f6d492326f48162d97d023544 |
| pepper-house.png | 1638 × 1638 | 365c959e57dbbdc8072bfc0d79039c6f7e77a6e9e51822cf9a9838492bc9e4cb |
| the-nang-suites.png | 800 × 800 | 85426eba7ffed14c1530bf4bacc2b0ece3e1970da5b49ba5f2ba01adfb041c36 |

Demo-only data wiring keeps exploration routes unchanged. The selected stage displays the intact square canvas with contain sizing; index labels remain readable text, and cards do not repeat logos. Existing local-review access restrictions apply.

## Navigation placement refinement — 22 October 2026

Supersedes the selected-stage placement described above. Navigation now uses `bare-wordmark-transparent.webp`, `the-nang-suites-transparent.webp` and `pepper-house-transparent.webp`. Original PNGs and earlier derivatives remain untouched.

Deterministic preparation: `docs/qa/demo/logo-placement-2026-10-22/prepare-logos.mjs`. Uniform source backgrounds (Bare RGB 242/242/242, others white) are unmatted into continuous alpha, preserving antialiased edge coverage without binary masking, erosion or dilation. Each derivative is tightly cropped with six source pixels of breathing room and saved losslessly at source resolution. No generated artwork, tracing, font substitution or intentional colour changes.

The navigation's Bare derivative isolates the existing script wordmark; the full brand name is adjacent in text. The complete original lockup, including the subtitle at its original spacing, is also retained as `bare-boutique-stays-transparent.webp` and in the untouched PNG. Optical display sizes differ by mark; CSS uses contain, with no recolouring or filters.
