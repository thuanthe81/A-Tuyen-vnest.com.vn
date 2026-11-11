# Tài liệu handoff VNest V3

Đọc theo thứ tự:
1. [START_HERE.md](../../START_HERE.md): dự án là gì, chạy thế nào, cấu trúc thư mục. Khoảng 5 phút.
2. [BACKEND_HANDOFF.md](BACKEND_HANDOFF.md): luồng đặt phòng, GoHost, ezCloud, form tư vấn, ảnh, ngôn ngữ, SEO.
3. [OPEN_ITEMS.md](OPEN_ITEMS.md): việc còn mở và ai làm.

## Tham khảo khi cần

| Tài liệu | Dùng khi | Trạng thái |
| --- | --- | --- |
| [BACKEND-HANDOFF.md](BACKEND-HANDOFF.md) | Cần chi tiết: URL contract, giới hạn kỹ thuật (§4.1), cấu hình DNS cho email (§11.3), định dạng email (§11.5), test gửi thật (§11.8) | Tiếng Anh, 9–10/11/2026. Còn đúng, trừ §6: tên tham số ezCloud **chưa** được xác nhận |
| [phase-e-audit-2026-11-10/AUDIT.md](../qa/phase-e-audit-2026-11-10/AUDIT.md) | Danh sách lỗi theo mã (A1, B1, …), kết quả test ngày 10/11 | Audit 10/11; các mục về form tư vấn (H5, C4, G5) đã cũ |
| [consultation-form-2026-11-10/REVIEW.md](../qa/consultation-form-2026-11-10/REVIEW.md) | Form tư vấn: các file, kết quả QA, quyết định cho owner | 11/11/2026 |
| [booking/HYBRID-BOOKING-V1.md](../booking/HYBRID-BOOKING-V1.md) | Lý do chia GoHost/ezCloud, các trạng thái availability | Còn đúng |
| [decisions/v3-booking-bar-occupancy-field.md](../decisions/v3-booking-bar-occupancy-field.md) | Ô "Phòng & khách" (đã khóa thiết kế) | Còn đúng |
| [i18n/BILINGUAL-PLAN.md](../i18n/BILINGUAL-PLAN.md) | Kiến trúc VI/EN | Kế hoạch 6/11; tiến độ thực tế xem BACKEND_HANDOFF §7 |
| [content/g2/README.md](../content/g2/README.md) | Quy trình lấy và xử lý ảnh, phạm vi cho phép | Ảnh G2, 18/10 |

## Tài liệu cũ

Giữ lại làm lịch sử, đừng dùng làm hướng dẫn:
- `docs/ARCHITECTURE.md`, `docs/BOOKING.md`, `docs/CONTENT_MODEL.md`: Phase 01–02. Các nguyên tắc ranh giới vẫn đúng,
  nhưng mô tả trạng thái đã cũ.
- `docs/handoff/CODEX_TAKEOVER.md`: 21/10.
- `docs/ROADMAP.md`, `docs/WORKFLOW.md`, `docs/REVIEW_LOG.md`: quy trình làm việc của BMP.
- `docs/qa/*`: báo cáo QA theo ngày. Script QA trong đó có đường dẫn và port của máy BMP.
