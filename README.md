# VNest V3

Website của VNest Hospitality Management (Next.js 16, React 19, TypeScript). Bản demo nội bộ, chưa phát hành.

**Bắt đầu tại [START_HERE.md](START_HERE.md)**: cách chạy, cấu trúc, trạng thái. Tài liệu backend: [docs/handoff/](docs/handoff/README.md).

## Nguyên tắc khi sửa code

- Không bịa thông tin về cơ sở: tên, địa chỉ, tiện ích, giá, chính sách, đánh giá đều phải từ VNest.
- Không màn hình nào được nói hoặc ngụ ý là đã đặt phòng thành công, hay có phòng trống, khi provider chưa trả lời thật.
- Trang không import adapter hay dữ liệu mock trực tiếp; trang gọi `getServices()` (`src/server/services.ts`).
- Tên field của provider chỉ nằm trong `src/integrations/`. Credential là biến môi trường phía server, chỉ đọc trong
  `src/config/env.ts`.
- Bản build có dữ liệu mock hoặc bản nháp không bao giờ được index. `noindex` không phải là cơ chế bảo vệ truy cập.
