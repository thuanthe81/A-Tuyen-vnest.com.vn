# VNest V3: bắt đầu từ đây

Cập nhật 11/11/2026. Tài liệu này mô tả code trên branch `handoff/vnest-v3-backend-2026-11-11`: commit handoff ngày
11/11/2026, nối tiếp checkpoint `559a0619`. So với checkpoint, bản này có thêm backend form tư vấn, icon mạng xã hội ở
footer và bộ tài liệu handoff.

## Dự án

VNest V3 là website mới của VNest Hospitality Management: 6 cơ sở lưu trú thuộc 3 thương hiệu (Bare Boutique Stays,
Pepper House, The Nắng Suites) ở TP. Hồ Chí Minh và Đà Nẵng. Site có:
- tìm phòng theo ngày, số người lớn, trẻ em và số phòng;
- trang chi tiết từng cơ sở và chọn phòng;
- trang hợp tác cho chủ nhà (B2B);
- form yêu cầu tư vấn.

**Công nghệ:**
- Next.js 16.3.8 (App Router, Turbopack). Đây là bản có thay đổi lớn so với Next.js 15; đọc
  `node_modules/next/dist/docs/` khi cần API.
- React 19.3 và TypeScript strict.
- Styling: CSS Modules cho phần V3; Tailwind v4 chỉ còn ở các trang Phase 01–02 cũ.
- Runtime dependency chỉ có `next`, `react`, `react-dom`.
- Không có database, không có auth.

**Trạng thái:** đây là bản demo nội bộ, chưa phát hành.
- Toàn bộ giao diện V3 nằm dưới `/dev/*`. Các route này trả 404 khi chạy production, và luôn `noindex`.
- Chưa nối GoHost hay ezCloud: không ai đặt được phòng.
- Form tư vấn đã có backend, nhưng mặc định không gửi email. Chưa có email thật nào được gửi đi.

## Chạy local

**Yêu cầu:** Node 24 (`.nvmrc`; tối thiểu 22.18 theo `engines`) và npm.

```bash
npm ci
```

**Cấu hình:** tạo file `.env.local` ở thư mục gốc với 3 dòng sau. Thiếu `DEPLOY_ENV=development` thì mọi route `/dev/*`
trả 404. Hai dòng còn lại là cấu hình BMP dùng khi QA: dữ liệu bản nháp của VNest, không có provider mock.

```bash
DEPLOY_ENV=development
CONTENT_SOURCE=client-draft
BOOKING_PROVIDER=none
```

`.env.example` liệt kê đủ các biến; giá trị mặc định trong file đó là của các trang Phase 01 cũ, không dùng cho V3.

**Chạy dev server:**

```bash
npm run dev
```

**Build production và chạy bản build:** dùng cùng `.env.local`.

```bash
npm run build
```

```bash
npm start
```

| Route (port mặc định 3000) | Nội dung |
| --- | --- |
| `/dev/demo?intro=0` | Trang chủ V3. `intro=0` bỏ qua hiệu ứng mở đầu |
| `/dev/demo?intro=0&lang=en` | Bản tiếng Anh (chỉ một phần, xem BACKEND_HANDOFF §7) |
| `/dev/demo/tim-phong` | Kết quả tìm phòng |
| `/dev/stays/bare-da-kao`, `/dev/stays/pepper-house` | Trang cơ sở dùng GoHost |
| `/dev/stays/bare-chic?view=demo`, `/dev/stays/bare-hyphen`, `/dev/stays/bare-han`, `/dev/stays/the-nang-suites` | Trang cơ sở dùng ezCloud |
| `/dev/demo/dat-phong` | Bước tóm tắt đặt phòng (không gửi gì) |
| `/dev/demo/hop-tac` | Trang hợp tác B2B, có form tư vấn |

Repo không có ảnh của khách hàng. Clone mới vẫn chạy bình thường: chỗ nào thiếu ảnh sẽ hiện khung placeholder, không có
ảnh hỏng. Làm backend không cần bộ ảnh. Xem BACKEND_HANDOFF §6.

## Kiểm tra

| Lệnh | Làm gì |
| --- | --- |
| `npm run check` | Lint + typecheck + unit test. CI chạy lệnh này cùng `npm run build` |
| `npm test` | Unit test (`node:test` chạy thẳng file `.ts`, không cần build) |
| `npm run test:promotion` | Kiểm tra khóa `noindex` trên 5 bản build thật, mất khoảng 10 giây. **Đổi tên `.env.local` trước khi chạy**: Next đọc file này khi build và ghi đè môi trường của test (5/15 test sẽ fail) |

Test trình duyệt trong `test/e2e/` **chưa chạy được trên máy khác**: chúng import Playwright từ một đường dẫn tuyệt đối
trên máy BMP. Việc sửa đã được ghi trong [OPEN_ITEMS](docs/handoff/OPEN_ITEMS.md).

## Cấu trúc

```
src/
  app/            Route. V3 nằm trong app/dev/ (demo, stays, demo/tim-phong, demo/dat-phong, demo/hop-tac); API trong app/api/
  domain/         TypeScript thuần, không React/Next: tìm kiếm, ngày, quy tắc phòng, trạng thái availability, form tư vấn
  domain/hybrid-booking/   Cơ sở nào dùng provider nào, StayRequest, GuestParty, ezCloud handoff
  integrations/   Code chỉ chạy trên server: GoHost adapter, gửi email (Resend/mock), nguồn dữ liệu cơ sở
  server/         Composition root (services.ts) và handler server (form tư vấn, rate limit)
  features/       UI theo khu vực: demo/ (trang chủ, kết quả, form), property-detail/ (trang cơ sở), booking-search/ (thanh tìm kiếm)
  content/vnest-workbook/  Dữ liệu 6 cơ sở và phòng, lấy từ workbook Excel của VNest, viết thành TS
  config/         env.ts (nơi duy nhất đọc process.env), routes.ts, site.ts, consultation.ts
  seo/, proxy.ts  Metadata, robots, sitemap; proxy đặt noindex và ngôn ngữ cho /dev/*
test/             Bootstrap cho node:test; test/e2e/ là test Playwright
docs/handoff/     Tài liệu handoff (bắt đầu từ README.md trong đó)
docs/qa/          Báo cáo QA theo ngày: tài liệu tham khảo, không phải hướng dẫn
```

Các quy tắc lint đang bắt buộc:
- `app/` và `features/` không import từ `integrations/`.
- Chỉ `config/env.ts` được đọc `process.env`.
- Có test chặn component client import module provider.

## Trước khi làm backend

- **GoHost** (Bare Đa Kao, Pepper House): adapter đã có interface nhưng chưa gọi API nào. Thiếu API URL, key, ID cơ sở
  và phòng, và hợp đồng giá.
- **ezCloud** (4 cơ sở còn lại): chỉ chuyển khách sang trang đặt phòng của ezCloud. Chưa có URL nào, và chưa biết tên
  tham số.
- **Form tư vấn:** cần tài khoản email provider và domain gửi đã xác minh. Cần thêm nội dung thông báo quyền riêng tư
  trước khi mở form ra công chúng.
- **Route public:** chưa có. Đưa V3 từ `/dev/*` ra route public là việc của BMP.

Đọc tiếp:
1. [docs/handoff/BACKEND_HANDOFF.md](docs/handoff/BACKEND_HANDOFF.md): tài liệu kỹ thuật chính.
2. [docs/handoff/OPEN_ITEMS.md](docs/handoff/OPEN_ITEMS.md): việc còn mở, ai làm.
3. [docs/handoff/README.md](docs/handoff/README.md): danh mục tài liệu tham khảo.
