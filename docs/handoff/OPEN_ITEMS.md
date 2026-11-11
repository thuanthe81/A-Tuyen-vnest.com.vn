# VNest V3: việc còn mở

Cập nhật 11/11/2026. Chỉ gồm việc chưa xong.

**Mức ưu tiên:**
- **P0:** cần để bắt đầu backend.
- **P1:** chặn phát hành public.
- **P2:** nên làm trước khi phát hành.
- **P3:** nhỏ.

Mục ghi "(audit 10/11)" lấy từ `docs/qa/phase-e-audit-2026-11-10/AUDIT.md` và chưa được kiểm lại hôm nay.

## BMP (frontend)

| Việc | Hiện trạng | Cần làm | Ai | Ưu tiên |
| --- | --- | --- | --- | --- |
| Quyền truy cập repo | Repo `Noe-09/VNest-2` là private | Thêm dev làm collaborator | Owner | P0 |
| Test e2e chạy được trên máy khác | 6 file trong `test/e2e/` import Playwright từ đường dẫn tuyệt đối trên máy BMP. CI không chạy e2e | Thêm `playwright` vào devDependencies, sửa import, thêm job e2e | BMP | P2 |
| `.env.example` | Giá trị mặc định là của Phase 01 (`CONTENT_SOURCE=mock`, `BOOKING_PROVIDER=mock`); thiếu `AVAILABILITY_SIMULATION`, `GOHOST_*` | Cập nhật theo V3 | BMP | P2 |
| Route public | V3 chỉ có ở `/dev/*` (404 khi production). `/` vẫn là placeholder Phase 01 | Owner chốt URL; BMP dời trang, nối sitemap, thêm metadata, OG, JSON-LD, favicon | Owner, BMP | P1 |
| Phụ thuộc ngược | Trang chủ, trang cơ sở và `features/*` import từ `app/dev/brand-collection/client/` | Chuyển các module đó ra trước khi dời route | BMP | P1 |
| Tiếng Anh | Thanh tìm kiếm, kết quả, bước đặt phòng và 6 trang cơ sở còn tiếng Việt (audit 10/11, mục D1) | Soạn bản tiếng Anh sau khi VNest duyệt nội dung | BMP | P2 |
| Ngày demo mặc định | `DEFAULT_DEMO_SEARCH` dùng 6–8/11/2026, đã qua | Bỏ, hoặc tính theo ngày hiện tại | BMP | P3 |
| Accessibility | Các mục A1–A5, B5 (audit 10/11) | Sửa theo audit | BMP | P2 |

## Backend

| Việc | Hiện trạng | Cần làm | Ai | Ưu tiên |
| --- | --- | --- | --- | --- |
| GoHost availability và giá | Adapter có interface, chưa gọi API; mọi cơ sở `unconfigured` | Viết `searchAvailability`/`readRates`, timeout, map lỗi; nối ID phòng (BACKEND_HANDOFF §3.1) | Backend | P1 |
| GoHost đặt phòng | `initiateBooking`, `readBookingStatus` đang tắt; chưa có thiết kế thanh toán | Thiết kế sau khi có hợp đồng API; kiểm `validateSelection` với tồn kho thật | Backend | P1 |
| Gửi email form | Code xong. Delivery `disabled`; chưa gửi thật lần nào | Cấu hình Resend, test một lần gửi thật trên staging, xác nhận email tới hello@vnest.com.vn | Backend (cần VNest cho DNS) | P1 |
| Rate limit form | Lưu trong bộ nhớ, mỗi instance đếm riêng | Nếu chạy nhiều instance hoặc serverless: dùng store chung hoặc rate limit của nền tảng | Backend | P2 |
| Hosting và deploy | Chưa chọn nền tảng | Chọn host; đặt `SITE_URL`, `DEPLOY_ENV=production`, secret; bảo đảm host ghi đè `X-Forwarded-For` | Backend, BMP | P1 |
| Host ảnh | Ảnh ngoài Git, chỉ được xem nội bộ | Chọn CDN hoặc storage và cấu hình `next.config.ts` **sau khi** có quyền dùng ảnh | Backend, BMP | P1 |

## VNest

| Việc | Hiện trạng | Cần làm | Ai | Ưu tiên |
| --- | --- | --- | --- | --- |
| Tài liệu và credential GoHost | Chưa có | API base URL, API key, giới hạn request; ID cơ sở và loại phòng cho Bare Đa Kao và Pepper House; hợp đồng giá, thuế, hủy phòng; tạo booking và thanh toán | VNest, GoHost | P0 cho phần GoHost |
| ezCloud handoff | Cả 4 cơ sở chưa có URL | URL đặt phòng chính thức cho từng cơ sở; tên tham số ezCloud nhận (ngày, người lớn, phòng, trẻ em); mở tab mới hay cùng tab | VNest, ezCloud | P1 |
| Chính sách trẻ em | Chưa có; nhóm có trẻ em không được gửi hỏi GoHost | Độ tuổi, phụ thu, số trẻ mỗi phòng, nôi hoặc giường phụ | VNest | P1 |
| Quy tắc 1–2 người lớn mỗi phòng, thông tin phòng | Tạm thời, chưa xác nhận bằng văn bản | Xác nhận, hoặc gửi giới hạn của provider | VNest | P1 |
| Chính sách hủy, nội quy, thanh toán | Cả 6 trang cơ sở ghi "Chờ VNest xác nhận" (audit 10/11) | Gửi nội dung chính sách | VNest | P1 |
| Email gửi form | Đã xác nhận địa chỉ nhận. Owner chọn Resend (11/11) | Tạo tài khoản Resend do VNest sở hữu, với API key chỉ có quyền gửi; thêm bản ghi DNS của Resend trên `vnest.com.vn`; chọn tên hộp thư gửi | VNest | P1 |
| Quyền riêng tư form | Chưa có thông báo hay mẫu đồng ý | Nội dung thông báo, có cần checkbox không, thời gian lưu dữ liệu (NĐ 13/2023, Luật BVDLCN) | VNest (pháp lý) | P1 |
| Quyền dùng ảnh | Chỉ được xem nội bộ trên máy local; một số ảnh chưa rõ quyền | Văn bản cho phép dùng trên web. Quyết định dev backend có được nhận bộ ảnh không | VNest, Owner | P1 |
| Link mạng xã hội, website thương hiệu | Facebook đã có; Instagram, LinkedIn, TikTok và `BRAND_WEBSITES` chưa có | Gửi URL, hoặc quyết định ẩn | VNest | P2 |
| Kênh đặt phòng trực tiếp | Trang `dat-phong` ghi "đang được VNest cập nhật" | Xác nhận hotline và email dùng cho đặt phòng | VNest | P2 |
| Duyệt nội dung | Nội dung 05.11 còn 3 điểm chờ; trang hợp tác và tiếng Anh đang là bản nháp; địa chỉ The Nắng và quận của Hyphen, Đa Kao chưa chốt (audit 10/11) | Duyệt bằng văn bản | VNest | P1 |

## Chặn phát hành

Phải xong trước khi đưa lên public. Chi tiết nằm ở các bảng trên.

1. Chưa có route public cho V3, và chưa có metadata, sitemap cho các trang mới.
2. Chưa đặt được phòng: GoHost chưa nối, ezCloud chưa có URL. Owner cần quyết định có phát hành trước khi nối booking
   hay không.
3. Chưa có quyền dùng ảnh trên web và chưa có chỗ host ảnh.
4. Form chưa gửi email thật và chưa có thông báo quyền riêng tư.
5. Chính sách cơ sở, chính sách trẻ em và nội dung chưa được VNest duyệt.
6. Bản sao ảnh và archive dự án mới chỉ có trên một ổ đĩa của BMP. Cần một bản sao lưu ngoài máy.
