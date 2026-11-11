# Homepage copy: client Final 05.11.2026 (5/11/2026)

Status: **OWNER-ACCEPTED 5/11/2026, content and visual structure FROZEN** (decision record: `docs/decisions/v3-homepage-content-brands-services-faq.md`). Final client publication approval pending; client-review flags in §4 and the The Nắng Suites spelling check (§2) remain open. Production build on `vnest-v3-qa`:
Vietnamese http://localhost:3402/dev/demo · English (private preview) http://localhost:3402/dev/demo?lang=en

Source of truth: "Vnest Website Content - 05.11.2026_Final.docx". It replaces the 04.11.2026 draft for the three existing
homepage sections. A plain-text copy is at `docs/content/homepage-content-2026-11-05/vnest-website-content-2026-11-05-final.txt`;
the 04.11 copy stays in `docs/content/homepage-content-2026-11-04/` as history only. Unit and browser checks now read the
05.11 Final text.

Scope: copy only. No component, layout, spacing, typography or interaction changed. About VNest, booking, occupancy,
property and room data, policies and the contact form were not touched. The copy lives in `src/features/demo/brand-copy.ts`
(brands) and `src/features/demo/owner-journey.ts` (services and FAQs); each field was swapped in place, 40 in all.

## 1. Diff summary (05.11 Final vs 04.11)

| Field | Vietnamese | English |
| --- | --- | --- |
| Brand Hover · Bare Boutique Stays | changed (60→57 chars) | changed (72→60 chars) |
| Brand Hover · The Nắng Suites | changed (71→97 chars) | changed (71→59 chars) |
| Brand Hover · Pepper House | changed (70→84 chars) | changed (72→65 chars) |
| Brand Positioning · Bare Boutique Stays | changed (90→121 chars) | changed (87→127 chars) |
| Brand Positioning · The Nắng Suites | unchanged | changed (79→60 chars) |
| Brand Positioning · Pepper House | changed (79→95 chars) | changed (77→84 chars) |
| Brand About · Bare Boutique Stays | changed (296→296 chars) | changed (326→265 chars) |
| Brand About · The Nắng Suites | changed (329→269 chars) | changed (322→279 chars) |
| Brand About · Pepper House | changed (294→343 chars) | changed (308→302 chars) |
| Service Card · Hospitality Management | changed (59→61 chars) | changed (75→77 chars) |
| Service Card · Project Development | changed (61→69 chars) | unchanged |
| Service Card · Brand Franchising | changed (66→70 chars) | changed (65→78 chars) |
| Expanded Description · Hospitality Management | changed (271→325 chars) | changed (303→327 chars) |
| Expanded Description · Project Development | changed (287→335 chars) | changed (305→342 chars) |
| Expanded Description · Brand Franchising | changed (309→428 chars) | changed (321→447 chars) |
| Key Highlights ×9 | unchanged | unchanged |
| FAQ 1 | Q same, answer changed (272→340) | Q same, answer changed (308→220) |
| FAQ 2 | Q same, answer changed (268→265) | Q same, answer changed (261→260) |
| FAQ 3 | Q same, answer changed (268→280) | Q same, answer changed (275→300) |
| FAQ 4 | Q same, answer changed (278→363) | Q same, answer changed (321→371) |
| FAQ 5 | Q same, answer changed (323→467) | Q same, answer changed (330→480) |
| FAQ 6 | Q same, answer changed (260→175) | Q same, answer changed (280→167) |

Every field is the client's 05.11 text word for word, in both languages, except the two brand-name corrections below.

## 2. Normalisation exceptions (owner decision, 5/11/2026)

The only two differences from the document, applied the same way as for 04.11 (`BRAND_NAME_NORMALISATION`):
- "Vnest" → **"VNest"** (services, FAQs, "Brand Franchising + VNest Management").
- "The Nang Suites" → **"The Nắng Suites"** (The Nắng About, both languages). The official spelling still needs client
  confirmation before publication.

Also, a trailing space after the Vietnamese Bare Boutique Stays positioning was dropped (whitespace only).

## 3. Content changes that matter

- **FAQ 5** now gives room/space sizes: Bare "15–35 m²", Pepper House "từ 35 m² trở lên" / "units from 35 m²". They are
  shown exactly as written. No guest capacity is derived from them anywhere, and the occupancy rule is unchanged.
- **FAQ 6** no longer describes five steps or sends people to "the form".
- **Removed claims are gone:** Bare's "đã có kinh nghiệm nhượng quyền" / "franchise experience" and Pepper House's "hơn 10
  năm vận hành" / "over ten years of operation" (a unit test checks they never return).
- **Franchising model:** brand rights always come with direct VNest management ("đồng thời trực tiếp quản lý vận hành" /
  "and directly manages operations"; "không cấp quyền thương hiệu độc lập" / "not licensed separately").

## 4. Flagged for the client (copied as written, not changed)

1. **FAQ 1, English is shorter than the Vietnamese.** The Vietnamese answer also mentions periodic reporting and operating
   plans (340 vs 220 characters). The two versions differ in detail, not in meaning.
2. **The document header still reads "Nov 4, 2026 · Nội dung nháp bàn giao"** (draft handoff), although the file is named
   Final.

## 5. Fit check

No copy needed shortening; everything fits its approved component.

- **Browser check** (`test/e2e/homepage-content.test.mjs`, vi and en at 375, 390, 768 and 1440 px, 11/11): every brand,
  service and FAQ field matches the 05.11 Final; there is no clipped text and no page or in-section overflow; hover,
  selection, the service disclosure and the FAQ accordion behave as before.
- **Longest texts** (`scripts/longest.mjs`):
  - The hover preview stays fully on screen at 1440 (vi 493 px tall, en 470 px).
  - The service cards keep equal heights on desktop (vi 168 px, en 182 px).
  - The Pepper House panel is 822 px at 1440 in both languages.
  - The franchising detail is the longest view: 281 px at 1440, and 646 / 671 px (vi / en) at 390, about three-quarters of
    a phone screen.
  - FAQ 5's answer is 174 px at 1440 and 302 / 327 px at 390.

## 6. QA

| Check | Result |
| --- | --- |
| Unit: every field verbatim in the 05.11 Final (right heading, label and language), FAQ order, both languages complete, no Vietnamese in English, the brand-name normalisation, removed claims absent, FAQ 5 sizes verbatim with no capacity, franchising model | 426 pass (lint 0 errors, typecheck) |
| Homepage content e2e | 11/11 |
| Regressions: hybrid booking · mobile (Chromium, WebKit) · About · occupancy · room selection | 79/79 · 16/16 · 16/16 · 8/8 · 22/22 |
| Production build | PASS |

Screenshots (`screens/`):
- `brands-*`, `services-*`, `faq-*`: the three sections in vi and en at 375, 390, 768 and 1440 (`brands-*-1440-hover` shows
  the preview card).
- `brands-pepper-*`, `brands-hover-nang-*`, `services-franchise-*`, `faq-5-*`: the longest texts.

Nothing staged, committed, pushed or deployed.
