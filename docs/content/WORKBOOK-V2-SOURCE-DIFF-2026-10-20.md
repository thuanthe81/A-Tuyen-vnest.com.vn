# VNest workbook v2: source diff and reconciliation

Date: 20/10/2026. Status: **for the owner's review.** Nothing committed.

| | Previous | New (v2) |
|---|---|---|
| File | `VNest_Information.xlsx` | `VNest_Informationv2.xlsx` (read from `~/Downloads`, not copied into the repository) |
| Received | 15/10/2026 | 20/10/2026 |
| sha256 | `b5081c75847b1e0141c7453e0d1fbee41513e0232e00c5167ef28a0b1a0af6f1` | `126e77dca61f065a65027669ff2e2cf329dfeed1c01545ad7a94c8c4028241d9` |
| Sheets | Tổng quan 6 cơ sở · Thông tin các điểm tham quan · **Cơ sở & danh sách phòng** | Tổng quan 6 cơ sở · Thông tin các điểm tham quan · **Booking & chính sách** |

**Method.** Both files were unzipped and every cell, merge and hyperlink record was read from the XML, by a script. The script was first checked against the old workbook: it reproduces the existing snapshot (`workbook.ts`) with 0 differences across 22 rows. The snapshot files were then regenerated from v2 (`src/content/vnest-workbook/{workbook,rates,details}.ts`). Strings are verbatim, including v2's Windows line breaks (`\r\n`).

**Brief's known facts, checked against the file.**

| Fact | Result |
|---|---|
| Six properties, 22 room records | ✔ Rows 4–25, six official names in B |
| Separate sheets for overview, nearby attractions, booking policies | ✔ |
| Room sheet (type, area, capacity) absent | ✔ |
| 14 room records with weekday/weekend text, 8 without | ✔ L4, L8, L11, L12, L13, L15–L18, L20–L24 have text. Rows 5, 6, 7, 9, 10, 14, 19, 25 have none of their own |
| The Nắng Suites photo folders distinct from Bare Hàn's | ✔ D20–D23 now link four new folders (below) |
| Bare Hàn and The Nắng Suites descriptions changed; Pepper House differs | ✔ All three. Bare Chic, Bare Hyphen and Bare Đa Kao are unchanged (Đa Kao only in line-break encoding) |
| J12 displays `2GZVfHKLcCJLT8jU0`, its hyperlink targets `YV37L6mKA2VrWBO2S` | ✔ With a detail: see §2 |

---

## 1. Descriptions (column E)

| Property | Cell | Change | Notes for VNest (not corrected) |
|---|---|---|---|
| Bare Chic | E4 (E4:E7) | **Unchanged** | — |
| Bare Hyphen | E8 (now E8:E11) | Unchanged; the cell is now merged over its four rows | — |
| Bare Đa Kao | E12 | Same text; `\n` line breaks became `\r\n` | — |
| Bare Hàn | E16 | **New text.** Before: a quoted copy of Bare Đa Kao's description (audit Q2). Now: its own ("Mỗi tầng tại Bare Han chỉ chứa một căn hộ…") | Q2 is answered at source. The text writes "Bare Han" without the diacritic, three times (Q27) |
| The Nắng Suites | E20 | **Second paragraph replaced.** Before: "Gian phòng có diện tích rộng rãi nhất…" (the reason for Q3). Now: "Dạo quanh các căn phòng…" | Q3 looks answered (the text no longer describes one room); confirm. Typo "hiết kế" for "thiết kế" (Q27) |
| Pepper House | E24 | **Replaced.** Before: the café, co-working space and canal-view room. Now: "Căn hộ tầng năm Pepper House… phong cách Industrial Retro…" | It describes a **fifth-floor** apartment; the rooms are "3rd-floor" and "4th-floor" (Q26). Wording that reads as translated ("kết thúc bê tông mộc mạc", "ghế sofa theo phong cách đệm ngược – tiêu cự của căn phòng") needs VNest's approval (Q27) |

## 2. Hyperlinks: photo folders (D) and maps (J)

v2 writes **more than one hyperlink record over some cells**: one for the cell and one for its merged range. The adapter now keeps every record (`DLinkRecords`, `JLinkRecords`) and treats any disagreement with the cell text as a conflict. It never prefers one record and never substitutes a link.

| Cell | Text shown | Records in v2 (document order) | Effect |
|---|---|---|---|
| **J12 Bare Đa Kao** | `share.google/2GZVfHKLcCJLT8jU0` | `J12` → `2GZVfHKLcCJLT8jU0`; then `J12:J15` → **`YV37L6mKA2VrWBO2S`** | **New defect.** A spreadsheet follows the range record, applied last, which opens Bare Hyphen's link. On 19/10, `YV37…` resolved to "Bare Hyphen - Bare Boutique Stays". The 15/10 workbook had one record matching the text. **Map held** for Bare Đa Kao (**Q22**). In `/b-client` the location panel now says "Đường dẫn bản đồ chờ VNest xác nhận" and offers no map |
| J8 Bare Hyphen | `share.google/YV37L6mKA2VrWBO2S` | `J8` → `fskgZreXVjowaoQCO` (Bare Chic's); then `J8:J11` → `YV37…` | Probably fixed: the range record matches the text. The cell record still opens Bare Chic, so the map stays **held** (Q4, updated) |
| J4 Bare Chic | `share.google/fskgZreXVjowaoQCO` | One record, same | **Verified.** On 19/10 it resolved to "Bare Chic - Bare Boutique Stays". Shown |
| J16, J20, J24 | — | One record each, matching | Unchanged |
| D5, D6, D7 Bare Chic Two, Three, Indochine | "Link hình ảnh" | `D5:D7` → Bare Chic **One's** folder; then the cell's own folder | The cell-specific records, applied last, keep the 15/10 folders. The stray range record is housekeeping (Q29). Photo attribution is unaffected: the G3 files were identified by their Drive folder titles |
| **D20–D23 The Nắng Suites** | "Link hình ảnh" | `1ExyqVrGs1azUqoX_gHyh15lxSYQw4kVC`, `1U5oDedfTCielLny0PnMpzQfshimsYhAz`, `136jviLxLQlOcGXv1Y00dXETGBaXe2Lf2`, `1lh0lRA5dLEqNnIlJsADanj0GthLQPMQf` | **Updated.** Before: Bare Hàn's four folders (audit Q1). Now distinct from D16–D19. The new folders were **not opened**: nothing was viewed or downloaded (Q30) |
| G4, G8, G12, G24 | "Thông tin các điểm ăn uống & tham quan" | Internal links to `'Thông tin các điểm tham quan'!A2:D19`, plus a stale record to `'Booking & chính sách'!A3:H11` | The links tie each property to its city's list. They do not say any place is near a property |

## 3. Room prices (column L)

**No figure changed.** The 14 texts are identical to 15/10. One merge was added: **L8:L10** (Bare Hyphen One–Three).

| Row | Room | v2 L cell | Status |
|---|---|---|---|
| 4 | **Bare Chic One** | `Ngày thường: 1,100,000 … Ngày cuối tuần: 1,200,000` (merged L4:L7) | Stated |
| 5, 6, 7 | Bare Chic Two, Three, Bare Indochine | empty (under L4:L7) | **No price** |
| 8 | Bare Hyphen One | 1,000,000 / 1,100,000 (merged L8:L10, **new**) | Stated |
| 9, 10 | Bare Hyphen Two, Three | empty (under L8:L10) | No price |
| 11 | Bare Hyphen Four | 1,080,000 / 1,180,000 | Stated |
| 12, 13 | Bare Đa Kao One, Two | 1,000,000 / 1,100,000; 1,050,000 / 1,150,000 (L13:L14) | Stated |
| 14 | Bare Đa Kao Three | empty (under L13:L14) | No price |
| 15 | Bare Đa Kao Four | 1,200,000 / 1,300,000 | Stated |
| 16, 17, 18 | Bare Hàn Ground, One, Two | 1,160,000 / 1,260,000; 1,110,000 / 1,210,000; 1,200,000 / 1,300,000 (L18:L19) | Stated |
| 19 | Bare Hàn Three | empty (under L18:L19) | No price |
| 20–23 | Yellow Submarine, Pale Blue Eyes, Green River, Blue Moon | 840,000 / 940,000; 970,000 / 1,070,000; 1,085,000 / 1,185,000; 1,390,000 / 1,500,000 | Stated |
| 24 | Pepper House 3rd-floor | 1,215,000 / 1,315,000 (L24:L25) | Stated |
| 25 | Pepper House 4th-floor | empty (under L24:L25) | No price |

**Rule applied (new, `pricing.ts` `roomRate`).** A rate belongs only to the room on its own row. A merge is recorded (`drawnOver`, `underMergeOf`) but never lends the figure to the rows it is drawn over. The figure is kept as written, with no currency, unit, tax or validity added.

**Note for VNest (Q24).** The sheet draws L4:L7 across all four Bare Chic rooms, so VNest may mean 1,100,000 / 1,200,000 for all four. Under your rule the page shows it for Bare Chic One only. The same applies to L8:L10, L13:L14, L18:L19 and L24:L25.

The Brand Collection card figures are unchanged (lowest stated weekday per property). Its internal list of rooms without a rate now follows the same rule.

## 4. Fields in the previous workbook and missing from v2

| Previous field | Where | v2 | Handling |
|---|---|---|---|
| Room type, area, capacity | Sheet "Cơ sở & danh sách phòng", D–F | **Sheet removed** | Kept as legacy reference only: `src/content/vnest-workbook/legacy-room-sheet.ts`. Every value has status **`not-reconfirmed`** and `display: null` (Q23). Bare Chic's old values ("Studio", "28m2", "2 người lớn", all merged over four rooms or more) **are no longer shown** |
| Room names on the room sheet | C | Present on the overview sheet (C) | Now read from the overview sheet |

Nothing else was lost. The overview columns B–M, the nearby sheet and the merges all remain. The nearby sheet differs only in A, where "1.0" became "1".

## 5. New sheet: "Booking & chính sách"

| Row | Item (A) | Value (B) | Applies to (C) |
|---|---|---|---|
| 4 | Giờ nhận phòng | 0.5833… (format h:mm → **14:00**) | *empty* |
| 5 | Giờ trả phòng | 0.5 (h:mm → **12:00**) | *empty* |
| 6 | Nhận phòng sớm / trả phòng muộn | Không áp dụng | *empty* |
| 7–10 | Huỷ / hoàn tiền · Đổi ngày · Thanh toán · Tiền cọc / phí phát sinh | *empty* | *empty* |
| 11 | Trẻ em / vật nuôi / quy định đặc biệt | Không áp dụng | *empty* |
| 12–14 | Quy trình xác nhận booking · Email / tin nhắn xác nhận · Kênh hỗ trợ khách hàng | *empty* | *empty* |

Read into `policyLines()`, every line `publishable: false`. **Nothing is published.** The sheet's own instruction (A2) asks VNest to say whether each line applies to all properties, and C is empty on every line. "Không áp dụng" is ambiguous: it could mean "not offered" or "no rule". Seven of the eleven lines are blank (Q25, which supersedes Q9 in part).

## 6. Area / district

v2 has no area or district field. Nothing is derived from it. The Bare Chic page shows the address as supplied and the city read from it; it no longer shows "Quận 1". The Brand Collection's location label is unchanged: it was built on 19/10 from independent sources (G2.1) and awaits your review there. The Area filter stays off.

## 7. Nearby places

The attraction sheet is unchanged. Its blocks name four properties (TP.HCM) and two (Đà Nẵng); no row maps a place to one property, and there are no distances. **Not shown on the Bare Chic page** (Q28). Still read, in the trace, for when VNest confirms a mapping.

## 8. What changed in `/b-client` (intended source corrections only)

Pixel regression against the build before this change, at 390, 768 and 1440 px: `docs/qa/brand-collection/b-client/regression/v2-bclient-before` → `v2-bclient-after` (layout only) and `…-photos` (with photographs). Differences appear in exactly three places:

1. The review line now says `VNest_Informationv2.xlsx (nhận 20/10)` instead of `VNest_Information.xlsx (nhận 15/10)`.
2. The Bare Hàn and The Nắng Suites placeholders now say **"Ảnh chờ cấp quyền sử dụng"** instead of "Chờ VNest xác nhận thư mục ảnh", because the folder conflict is gone. They still show no photograph: none was proposed or authorised.
3. Bare Đa Kao's location panel, which shows only when opened, has no "Xem bản đồ" and gains the note "Đường dẫn bản đồ chờ VNest xác nhận" (Q22).

The layout, interaction and the card prices did not change. `/a`, `/a-original`, `/b`, `/b-original`: **24 of 24 captures identical.**

## 9. Provenance of every field the Bare Chic prototype shows

| On the page | Value | Source | Status |
|---|---|---|---|
| H1 | Bare Chic | B4, the suffix " - Bare Boutique Stays" removed | normalized (rule `shortName`, Q13) |
| Brand line | Bare Boutique Stays | B4 suffix | derived |
| Masterbrand | VNest | 02.1 criteria bar (frozen) | site |
| Address (hero, location) | 12/18 Nguyễn Thị Minh Khai / Phường Sài Gòn, Hồ Chí Minh | I4, split at the first comma for display | client-supplied; house number corroborated (G2.1) |
| Xem bản đồ | `https://share.google/fskgZreXVjowaoQCO` | J4: one record, matches its text, resolves to Bare Chic's place (19/10) | corroborated |
| Story (2 paragraphs) | E4 verbatim, split after sentence 3 | E4 | normalized (split only; joined, the paragraphs equal E4: tested) |
| Amenities | Bếp nhỏ, Phòng tắm riêng, Smart TV, Wifi, Điều hoà nhiệt độ + "VNest đang hoàn thiện danh sách" | F4 (ends in ",..") | normalized (Q11) |
| Transport | Grab, đi bộ, xe bus | K4 | client-supplied |
| Room names | Bare Chic One, Two, Three, Bare Indochine | C4–C7 | client-supplied (Q12 for "Bare Indochine") |
| "4 phòng" | count of C4–C7 | C4–C7 | derived |
| Bare Chic One price (private only) | Ngày thường 1,100,000 · Ngày cuối tuần 1,200,000 | L4 | client-supplied, unverified (Q8, Q24) |
| Other rooms | "Giá đang cập nhật" | L5–L7 empty | missing |
| Booking status | "Đặt phòng trực tuyến chưa sẵn sàng. Chưa có hệ thống đặt phòng nào được kết nối." | `record.booking.providers` empty; 02.2's copy | system |
| Photographs (6) and captions | rooms named by Drive folder title | G2 and G3 manifests; sha256 re-verified 20/10 (9 of 9 originals match `docs/content/g2/media-record.json`) | `client-supplied-pending` |

**Not shown, on purpose:** room type, size, capacity and bedding (Q23); policies, including 14:00 and 12:00 (Q25); nearby places (Q28); former district; any currency, "per night" or tax; availability.

## 10. Questions for VNest (new and updated)

Numbering continues the audit (`CLIENT-DATA-AUDIT-2026-10-15.md` §7).

| # | Question |
|---|---|
| **Q4 (updated)** | Bare Hyphen map: J8 carries two links, `fskgZ…` (Bare Chic's) and `YV37…`. Please confirm `YV37L6mKA2VrWBO2S` and remove the other. |
| **Q22** | **Bare Đa Kao map:** the cell shows `2GZVfHKLcCJLT8jU0`, but its range hyperlink opens `YV37L6mKA2VrWBO2S`, which is Bare Hyphen. Which link is Bare Đa Kao's? |
| **Q23** | The room sheet (type, area, capacity) is gone from v2. Were those values withdrawn, or will they be resent? Please give them per room, with bedding (supersedes Q10). |
| **Q24** | Rates merged across rooms (L4:L7, L8:L10, L13:L14, L18:L19, L24:L25): does one rate apply to every room in the range, or only to the first? Q7 and Q8 stand: currency, which nights are weekend, taxes and fees, validity, and permission to publish. |
| **Q25** | Booking policies: which properties does each line apply to (column C is empty)? Does "Không áp dụng" mean "not offered" or "no special rule"? Cancellation, date change, payment, deposit, confirmation and support are blank. |
| **Q26** | Pepper House description: it describes a fifth-floor apartment, but the rooms are 3rd-floor and 4th-floor. Which unit does it describe? |
| **Q27** | Wording to approve: "Bare Han" spelled without the diacritic (Bare Hàn); "hiết kế" (The Nắng Suites); Pepper House's phrasing ("kết thúc bê tông mộc mạc", "đệm ngược – tiêu cự"). The website will show VNest's text exactly as approved. |
| **Q28** | Nearby places: may the site present the TP.HCM list as near Bare Chic specifically, or should each property have its own list with distances? |
| **Q29** | Housekeeping: stray hyperlink records over D5:D7 (to Bare Chic One's folder) and G4, G8, G12, G24 (to a range of the policy sheet that does not exist, A3:H11). |
| **Q30** | The four new The Nắng Suites folders (D20–D23): please confirm they show The Nắng Suites. They have not been opened. |
| **Q31** | (Added with the page refinement, 20/10.) Amenity pictograms: BMP chose kitchen, wifi and air-conditioning pictograms for "Bếp nhỏ", "Wifi" and "Điều hoà nhiệt độ". Does VNest approve them? |

Answered at source, pending confirmation: Q1 (Nắng folders), Q2 (Bare Hàn description), Q3 (Nắng description scope), Q9 (in part).

Unchanged and still open: Q5, Q6, Q8, Q11–Q21.

## 11. Files

- **Regenerated snapshot:** `src/content/vnest-workbook/workbook.ts`, `rates.ts`, `details.ts`.
- **New legacy file:** `legacy-room-sheet.ts`.
- **Readers:** `sourced.ts` (adds the status `not-reconfirmed` and the policy sheet), `records.ts` (multi-record hyperlinks, question ids), `pricing.ts` (`roomRate`, `weekendFigure`, per-row rule), `property-details.ts` (room names from the overview sheet, legacy facts, `policyLines`), `location-evidence.ts` (Q22 note).

`docs/content/vnest-client-data.draft.json` is the 15/10 inventory and was left as historical evidence.

## Addendum, 21/10/2026: legacy room facts

The project owner relayed that VNest's admin confirmed the supplied room information as accurate. Reconciled scope: the values the 15/10 room sheet held in each room's own row; blank cells stay blank, and merged cells lend nothing. Shown since 21/10 for Bare Chic One (Studio, 28 m², 2 người lớn) via `confirmedRoomFact()`; the snapshot is unchanged.

| # | Question |
|---|---|
| **Q37** | Please confirm in writing that the 15/10 room sheet (type, size, capacity) is current and accurate. In particular: does "2 người lớn" (F4, merged over F4:F25) apply to Bare Chic One only, or to every room? And what are the size, type and capacity of Bare Chic Two, Three and Indochine (blank under the D4:D7 and E4:E7 merges)? |

