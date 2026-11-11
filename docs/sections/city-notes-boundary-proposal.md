# VNest City Notes: proposed work boundary

Date: 20/10/2026. Status: **PROPOSAL for the owner's review. Nothing is built.**

This is a separate, independent design exploration. It is not part of 05.2 and does not modify the approved Bare Chic gallery structure or any other part of the Bare Chic page.

## 1. Purpose

City Notes presents VNest's recommended places at **city level**. There are two notes, TP. Hồ Chí Minh and Đà Nẵng, built from the destination sheet of `VNest_Informationv2.xlsx`.

It answers the question the property pages may not answer: what VNest suggests in the city. It says nothing about distance from any property (Q28).

## 2. Source data (verified against the file)

| | TP. Hồ Chí Minh | Đà Nẵng |
|---|---|---|
| Block | "Thông tin các điểm tham quan", rows 2–18 | rows 20–36 |
| Header (names the properties the block serves) | A2 "Khu vực các cơ sở: Bare Chic, Bare Đa Kao, Bare Hyphen, Pepper House" | A20 "Khu vực các cơ sở: Bare Hàn, The Nắng Suites" |
| Places to visit (column B "Tên địa điểm tham quan") | 8: Dinh Độc Lập, Phố đi bộ Nguyễn Huệ, Nhà thờ Đức Bà Sài Gòn & Bưu điện Trung tâm Thành phố, Chợ Bến Thành, Thảo Cầm Viên Sài Gòn, Bảo tàng Chứng tích chiến tranh, Bảo tàng Mỹ Thuật Thành phố Hồ Chí Minh, Nhà thờ Tân Định | 8: Bán đảo Sơn Trà, Ngũ Hành Sơn, Cầu Rồng, Nhà thờ chính toà Đà Nẵng (Nhà thờ Con Gà), Chợ Hàn, Chợ Cồn, Biển Mỹ Khê, Bảo tàng Điêu khắc Chăm |
| Food and drink (column C "Tên địa điểm ăn uống") | 7: ThaiYen Cafe, Cơm niêu Thiên Lý, Phở Phượng, Lunch Lady, Bánh mì Huynh Hoa, Hủ tiếu nam vang Thành Đạt, Bánh mì chim chạy | 7: Hải sản Năm Đảnh, Bún chả cá 109, Bún mắm Vân, Bánh xèo Bà Dưỡng, Tiệm kiết (cà phê), Tan coffee, Bếp của ngoại |
| Address (column D) | One per place | One per place |
| Links from the overview sheet | G4:H7, G8:H11, G12:H15, G24 → A2:D19 | G16, G20 → A21:D36 |

The sheet is identical to 15/10 apart from the numbering in column A ("1" instead of "1.0"). It is already in the verbatim snapshot (`src/content/vnest-workbook/details.ts`, `NEARBY_SHEET`).

**What the source does not have:** descriptions or reasons for each recommendation, opening hours, prices, photographs, coordinates, map links, distances and travel times.

**Data quality, to report and not correct silently:**
- D33 "**!0** Nguyễn Thiện Thuật" (probably "10").
- D30 "Trần **phú**".
- D11 "…Nguyễn Đình Chiểu**,P**hường…" (no space after the comma).
- Doubled spaces ("Phường  Sài Gòn") and leading spaces (D8, D12, D24).
- "Bánh mì Huynh Hoa": usually spelt Huỳnh Hoa. To ask VNest; do not change.
- **Mixed address conventions.** TP.HCM uses the post-July-2025 wards (Phường Sài Gòn, Bến Thành, Xuân Hòa, Cầu Ông Lãnh). Đà Nẵng uses the former district names (Hải Châu, Sơn Trà, Ngũ Hành Sơn); see Q14.
- Some "addresses" are areas, not addresses ("Sơn Trà, Đà Nẵng", "An Hải, Đà Nẵng", "Đường Lê Lợi, …").

## 3. In scope

| Item | Where |
|---|---|
| A reader that turns the two blocks into two city notes. Each value is `Sourced` with its cell and status. Names stay verbatim; addresses get whitespace normalisation only, by a written rule; defects are flagged, not fixed | **New** `src/content/vnest-workbook/city-notes.ts`, with tests. It leaves `property-details.ts`, `nearbyFor()` and the Bare Chic record untouched |
| A content audit of the 30 places and their open questions | `docs/content/CITY-NOTES-AUDIT.md` |
| Art direction first: static boards with one or two compositions, before any code | `docs/design/city-notes/` |
| After approval: one isolated, `noindex` development route, guarded like the Bare Chic pages (404 unless `DEPLOY_ENV=development` is declared) | `/dev/city-notes` (or `/a`, `/b` if two compositions are approved) |
| QA at 390, 768 and 1440: accessibility, no overflow, CLS, keyboard | `docs/qa/city-notes/` |

## 4. Out of scope

Nothing here may change these, and City Notes will not:
- the Bare Chic page, its gallery, its record, its routes (`/dev/stays/*`) or its tests;
- the Brand Collection prototypes;
- 02.1 and 02.2, booking, the PMS, the domain and server code;
- production routes, the homepage and `main`.

City Notes will also not:
- state that a place is near any property, or give distances, travel times, ratings, hours or prices;
- embed a map;
- fetch place photographs, scrape Google or use stock imagery without a separate approval;
- rewrite, translate or "improve" VNest's names.

**No link** from the property pages to City Notes in this checkpoint. Linking is a later integration decision, and it depends on Q28.

## 5. Decisions requested before anything is built

| # | Decision | Options | Recommendation |
|---|---|---|---|
| CN-D1 | Name and voice | Keep "VNest City Notes" as the working name only, and use a Vietnamese title on the page (e.g. "Ghi chú thành phố" or "Sổ tay thành phố")? | A Vietnamese title on the page, consistent with your guidance against decorative English |
| CN-D2 | Imagery | (a) Typographic and graphic only, no photographs. (b) Ask VNest for its own photographs of the places. (c) Licensed stock, private review only | **(a)** for the first exploration, with (b) asked of VNest in parallel. The source has no images, and none should be implied |
| CN-D3 | Map links per place | (a) None. (b) A Google Maps **search** link built from the verbatim name and address | **(a)**. A built search link is an unverified target, the same class of risk as the J12 defect |
| CN-D4 | Framing of each list | Show the header's property names ("Gợi ý cho khách ở Bare Chic, Bare Đa Kao, Bare Hyphen, Pepper House") or the city only | **The city only** in the page voice; the header stays traceable in the data. Naming properties invites "near" readings (Q28) |
| CN-D5 | Intended placement | A standalone page, a homepage section, or a module for property pages | Explore it as a **standalone page**, and decide placement after review. Placement changes the composition, so it is better named now |
| CN-D6 | Number of compositions | One, or two to compare | Two static boards, then build one |

## 6. Questions for VNest (new)

| # | Question |
|---|---|
| **Q32** | Data corrections for the destination sheet: D33 "!0 Nguyễn Thiện Thuật" (10?), D30 "Trần phú", the spelling of "Bánh mì Huynh Hoa", and D11's missing space. |
| **Q33** | Is each city list meant for **every** VNest property in that city, or will lists be curated per property (with distances)? (Extends Q28.) |
| **Q34** | Would VNest give one line on **why** it recommends each place, and does it have photographs of them it may share? |
| **Q35** | Which address convention should the site use for Đà Nẵng places: the post-2025 wards, or the former districts as written? (Extends Q14.) |

## 7. Checkpoints

1. **CN-0, this boundary.** Your approval, with CN-D1 to CN-D6.
2. **CN-1.** Reader, tests, content audit and static art-direction boards. Stop for review.
3. **CN-2.** One isolated prototype on the approved board, with QA at 390, 768 and 1440. Stop for review.

No commit, push, merge, deployment or freeze at any checkpoint unless you ask for one.
