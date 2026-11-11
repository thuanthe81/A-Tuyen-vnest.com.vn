# VNest V3: handoff cho backend

Cập nhật 11/11/2026, theo code trên branch `handoff/vnest-v3-backend-2026-11-11` (xem
[START_HERE](../../START_HERE.md)). Đường dẫn file trong tài liệu tính từ `src/`, trừ khi ghi khác.

Việc còn mở và người chịu trách nhiệm: [OPEN_ITEMS.md](OPEN_ITEMS.md). Chi tiết sâu hơn (tiếng Anh) nằm trong
[BACKEND-HANDOFF.md](BACKEND-HANDOFF.md), bản 9–10/11. Tài liệu này dẫn tới đó khi cần, không chép lại.

## 1. Kiến trúc

Next.js App Router. Trang là server component; dữ liệu đi qua `getServices()` trong `server/services.ts`, nơi chọn
nguồn nội dung, provider và cách gửi form theo biến môi trường. Không có database: dữ liệu 6 cơ sở và các phòng là file
TypeScript trong `content/vnest-workbook/`, sinh ra từ workbook Excel của VNest.

| Lớp | Thư mục | Ghi chú |
| --- | --- | --- |
| Route, API | `app/` | V3 nằm trong `app/dev/`. API: `app/api/consultation/route.ts` (POST) |
| Quy tắc thuần | `domain/`, `domain/hybrid-booking/` | Không import React/Next, test bằng `node:test` |
| Gọi bên ngoài | `integrations/booking/`, `integrations/consultation/` | Chỉ chạy server. ESLint chặn `app/` và `features/` import vào đây |
| Composition root | `server/services.ts` | Nơi nối adapter thật vào |
| Biến môi trường | `config/env.ts` | Nơi duy nhất đọc `process.env`, và kiểm giá trị lúc khởi động |
| UI | `features/` | `demo/` (trang chủ, kết quả, form), `property-detail/` (trang cơ sở), `booking-search/` (thanh tìm kiếm, frozen) |

**Route private:** mọi thứ dưới `/dev/*`. Các route này chỉ mở khi `DEPLOY_ENV=development` được khai báo
(`features/property-detail/review-access.ts`), luôn có `noindex` và trả 404 khi chạy production.

**Route public hiện có:** đều không phải V3.
- `/` là placeholder Phase 01.
- `/stays` và `/stays/[property]` là trang mẫu Phase 02.2, dùng dữ liệu giả.
- `/api/availability` chỉ phục vụ `/stays`; V3 không dùng route này.
- `robots.txt` và `sitemap.xml` đóng hoàn toàn khi site chưa được phép index.
- `/api/consultation` có sẵn, nhưng trả 503 khi chưa bật gửi email.

**Ranh giới frontend/backend:** browser không bao giờ gọi provider.
- Trang kết quả `/dev/demo/tim-phong` hỏi trạng thái phòng trống ngay lúc server render, qua
  `getServices().hybridAvailability.resolveAll()`.
- Trang cơ sở và bước đặt phòng không gọi provider.
- Form tư vấn là chỗ duy nhất browser gọi API của site.

## 2. Luồng đặt phòng

```
Trang chủ /dev/demo            thanh tìm kiếm: cơ sở · nhận phòng · trả phòng · người lớn + trẻ em · BOOK NOW
  → Kết quả /dev/demo/tim-phong  server tính trạng thái từng cơ sở (resolveAll), client chỉ hiển thị
      cơ sở GoHost  → trang cơ sở /dev/stays/<slug>: chọn phòng theo từng "slot" → dialog xem lại → /dev/demo/dat-phong
      cơ sở ezCloud → nút "Kiểm tra giá & đặt phòng": chuyển sang trang ezCloud (hiện chưa có URL nên chỉ báo trạng thái)
  /dev/demo/dat-phong            chỉ tóm tắt lựa chọn; ghi rõ chưa gửi, chưa giữ phòng, chưa thanh toán
```

**Trạng thái nằm trong URL.** Mỗi trang đọc URL khi load và ghi lại bằng `history.replaceState`, nên Back và refresh giữ
nguyên lựa chọn. Không có session, cookie hay storage cho booking (cookie duy nhất là lựa chọn ngôn ngữ). Khi sửa code
ghi URL, giữ `window.history.state` của Next, nếu không nút Back sẽ hỏng (chi tiết: BACKEND-HANDOFF.md §2).

| Tham số URL | Dạng | Ghi chú |
| --- | --- | --- |
| `property` | slug, hoặc không có | Không có hoặc slug lạ = mọi cơ sở |
| `checkIn`, `checkOut` | `YYYY-MM-DD` | Trả phòng sau nhận phòng; không nhận ngày đã qua (giờ `Asia/Ho_Chi_Minh`) |
| `adults` | số nguyên ≥ 1 | Tổng người lớn |
| `rooms` | `N` hoặc `a,b,c` | Số phòng, hoặc số người lớn từng phòng |
| `children` | 1–99 | Không có = 0. Không cộng vào người lớn, không chia vào phòng |
| `prefs` | room id theo slot, cách nhau dấu phẩy | Phòng khách *muốn*, không phải giữ phòng |
| `room`, `sim`, `lang` | | Phòng khách đi từ đó; giả lập trạng thái (chỉ khi QA); ngôn ngữ |

Code đọc và ghi URL:
- `features/demo/booking-results-state.ts`: `parseMultiRoomQuery` / `serializeMultiRoomQuery`, kiểu `MultiRoomSearchState`
  và `RoomGroupSlot`.
- `features/demo/booking-flow.ts`: tạo URL giữa các trang.
- `domain/hybrid-booking/guest-party.ts`: `parseChildren`.

**Quy tắc khách và phòng.** Các quy tắc này là tạm thời: VNest chưa xác nhận bằng văn bản.
- Mỗi phòng 1–2 người lớn, tối đa 6 phòng (`domain/hybrid-booking/room-occupancy.ts`).
- Số phòng và số người lớn đều do khách chọn; code không tự sửa cái này cho khớp cái kia. URL không hợp lệ vẫn được giữ
  và hiện thông báo sửa (`occupancy-correction`); khi đó không gọi provider.
- Trẻ em: chưa có chính sách (`CHILD_POLICY.status = "unconfirmed"`). Nhóm có trẻ em không được gửi đi hỏi GoHost
  (`children-policy`). Lý do: câu trả lời chỉ cho người lớn sẽ là câu trả lời cho một kỳ nghỉ khác.
- Các giới hạn kỹ thuật (stepper trẻ em tới 6, parse tới 99) không phải quy tắc của VNest; xem BACKEND-HANDOFF.md §4.1.

**Ví dụ.** Khách tìm phòng ở Bare Đa Kao 4–6/12/2026: phòng 1 có 2 người lớn và chọn trước `bare-da-kao-one`, phòng 2
có 1 người lớn, đi cùng 1 trẻ em. URL do `serializeMultiRoomQuery` tạo ra:

```
/dev/demo/tim-phong?property=bare-da-kao&checkIn=2026-12-04&checkOut=2026-12-06&rooms=2%2C1&adults=3&children=1&prefs=bare-da-kao-one%2C
```

Object mà server và adapter nhận (`StayRequest` trong `domain/hybrid-booking/property-availability.ts`, do
`stayRequestFromState` trong `features/demo/hybrid-results.ts` tạo):

```json
{ "checkIn": "2026-12-04", "checkOut": "2026-12-06", "roomAdults": [2, 1], "children": 1 }
```

Với ví dụ này, kết quả hiện tại là `needs-provider-check` với lý do `children-policy`, vì có trẻ em. Bỏ trẻ em đi thì
kết quả là `unconfigured`, vì GoHost chưa được cấu hình. Chưa có API contract nào cho việc tạo booking; xem §3.

## 3. Provider: GoHost và ezCloud

Hai provider khác nhau về bản chất:

| | GoHost | ezCloud |
| --- | --- | --- |
| Cơ sở | Bare Đa Kao (`bare-da-kao`), Pepper House (`pepper-house`) | Bare Chic, Bare Hyphen, Bare Hàn, The Nắng Suites (`bare-chic`, `bare-hyphen`, `bare-han`, `the-nang-suites`) |
| Cách làm | `native`: VNest tự hiển thị phòng trống, giá và cho chọn phòng, dữ liệu từ API GoHost | `external-handoff`: VNest không có API. Khách được chuyển sang trang đặt phòng của ezCloud |
| Code | `integrations/booking/gohost-adapter.ts` (chỉ server) | `domain/hybrid-booking/ezcloud-handoff.ts` |
| Hiện tại | Mọi lệnh gọi trả `unconfigured` | Cả 4 cơ sở `unconfigured`, không có link |

Cơ sở nào dùng provider nào: `domain/hybrid-booking/provider-assignment.ts`. Cách hoạt động tương ứng:
`domain/hybrid-booking/booking-mode.ts`. Component không bao giờ kiểm tên provider trực tiếp.

### 3.1 GoHost

Adapter có 5 operation, trong interface `GoHostAdapter`:
- `searchAvailability`, `readRates`: đều chưa gọi gì, trả `unconfigured`. Khi đã đủ cấu hình, chúng sẽ trả
  `contract-not-implemented` cho tới khi code request thật.
- `validateSelection`: kiểm số lượng phòng khách chọn so với số phòng provider xác nhận. Hàm này đã chạy được
  (`domain/hybrid-booking/stay-validation.ts`).
- `initiateBooking`, `readBookingStatus`: **tắt** (`booking-creation-disabled`, `booking-status-disabled`).

Luồng hiện tại: `server/services.ts` → `integrations/booking/resolve-availability.ts` (`resolvePropertyAvailability`) →
adapter. Kết quả là `PropertyAvailabilityState` (`domain/hybrid-booking/property-availability.ts`), một trong 5 trạng
thái: `available`, `unavailable`, `needs-provider-check`, `unconfigured`, `error`.
- Chỉ `available` và `unavailable` là khẳng định về phòng, và chỉ được trả khi có response thật từ provider.
- Lỗi luôn là `error`, không bao giờ hiển thị thành "hết phòng".
- Một cơ sở lỗi không làm hỏng các cơ sở khác (có `try/catch` trong resolver).

**Phần demo chạy được:** chọn ngày, khách, phòng; trạng thái trung thực; dialog xem lại; trang tóm tắt.
`available`/`unavailable` và giá chỉ xuất hiện ở chế độ giả lập: server chạy với `AVAILABILITY_SIMULATION=private-review`,
URL có `?sim=`, và luôn có nhãn giả lập.

**Cần để chạy thật:**

| Cần | Đặt ở đâu |
| --- | --- |
| API base URL (https) | env `GOHOST_API_BASE_URL` |
| API key phía server | env `GOHOST_API_KEY` |
| Xác nhận hợp đồng giá, thuế, hủy phòng | env `GOHOST_RATE_PLAN_CONTRACT_CONFIRMED=true` |
| ID cơ sở GoHost và ID từng loại phòng: Bare Đa Kao (`bare-da-kao-one` … `-four`) và Pepper House (`pepper-house-3rd-floor`, `pepper-house-4th-floor`) | `providerPropertyRef`, `roomRefs` trong `integrations/booking/property-provider-routing.ts` |
| Tài liệu API: availability, rate, tạo booking, trạng thái booking, thanh toán, giới hạn request | adapter |
| GoHost có nhận trẻ em không, có cần tuổi không | `domain/hybrid-booking/guest-party.ts` |

Các bước khi tích hợp:
1. Điền ID vào bảng routing. `goHostBlockers()` (`integrations/booking/provider-config.ts`) hiện chưa truyền
   `propertyMappings` vào `evaluatePropertyBookingReadiness`; nối chỗ này hoặc điền thẳng vào route.
2. Viết request thật trong `searchAvailability` và `readRates`. Map lỗi và timeout sang `AvailabilityErrorCode`.
3. Thêm timeout và retry. Hiện tại timeout và giới hạn request chưa được code, vì chưa biết giới hạn của GoHost.
4. Cuối cùng mới tới `initiateBooking` và `readBookingStatus`, khi đã có hợp đồng booking và thanh toán.

`validateSelection` phải chạy trên server, dựa trên số phòng provider trả về, không tin dữ liệu từ client. Hiện chưa có
tồn kho nên khách có thể chọn cùng một phòng ở hai slot.

### 3.2 ezCloud

VNest xác nhận ezCloud không có API availability hay booking cho VNest: khách đặt phòng trên trang của ezCloud. Vì vậy
site không bao giờ hiển thị giá hay phòng trống của 4 cơ sở này.

`EZCLOUD_HANDOFF_BY_PROPERTY` trong `domain/hybrid-booking/ezcloud-handoff.ts`: cả 4 cơ sở đều `unconfigured`. Một mục
đã cấu hình gồm `destinationUrl` (bắt buộc https) và `params`, là **tên tham số mà ezCloud chấp nhận**. Code có sẵn 5
chỗ cho tên tham số: ngày nhận, ngày trả, người lớn, số phòng, trẻ em. ezCloud **chưa cung cấp tên nào**, kể cả cho
trẻ em.

`resolveHandoffAction` chỉ gắn những tham số đã có tên; phần không chuyển được thì báo cho khách nhập lại, ví dụ
"Số trẻ em (2) cần được nhập lại ở đó". Chưa có giả định nào về iframe, widget, deep link tới phòng, return URL hay
callback thanh toán.

Những gì không đồng bộ được qua cách làm này:
- giá và phòng trống;
- phòng khách chọn trên VNest;
- trạng thái booking sau khi khách rời site (không có callback).

Cần từ VNest: URL đặt phòng chính thức cho từng cơ sở, tên tham số ezCloud chấp nhận, và cách điều hướng (tab mới hay
cùng tab).

## 4. Form tư vấn

Form `#tu-van`, dùng chung cho trang chủ và trang hợp tác. Email nhận: **hello@vnest.com.vn** (owner xác nhận
10/11/2026). Có địa chỉ nhận không có nghĩa là email đã gửi được.

| Phần | File |
| --- | --- |
| Form, trạng thái, honeypot | `features/demo/Consultation.tsx` |
| Gửi từ browser (POST JSON) | `features/demo/consultation-submit.ts` |
| Quy tắc kiểm tra, dùng chung cho browser và server | `domain/consultation.ts` |
| Endpoint | `app/api/consultation/route.ts`: `POST /api/consultation` |
| Handler: origin, kích thước, rate limit, spam, kiểm tra, trùng lặp | `server/consultation.ts`, `server/rate-limit.ts` |
| Soạn và gửi email | `integrations/consultation/` (`email-sink.ts`, `compose-email.ts`, `resend.ts`, `mock.ts`) |
| Email nhận, giới hạn | `config/consultation.ts` |

| Biến (chỉ server) | Giá trị |
| --- | --- |
| `CONSULTATION_DELIVERY` | `disabled` (mặc định), `mock` (chỉ khi `DEPLOY_ENV=development`), `resend` |
| `RESEND_API_KEY` | Bắt buộc với `resend`. Là secret: đặt trong secret store của host |
| `CONSULTATION_SENDER` | Bắt buộc với `resend`, ví dụ `VNest Website <ten@vnest.com.vn>`; VNest chọn tên hộp thư |
| `CONSULTATION_RECIPIENT` | Tùy chọn; mặc định hello@vnest.com.vn. Dùng hộp thư test trên staging |

Chọn `resend` mà thiếu key hoặc sender thì server không khởi động.

**Trạng thái:**

| | |
| --- | --- |
| Đã code | Kiểm tra dữ liệu ở cả browser và server; endpoint; gửi qua Resend (HTTP, không dùng SDK); mock; rate limit; honeypot `vnx_hp`; chống gửi trùng |
| Đã cấu hình | Chỉ địa chỉ nhận. Chưa có tài khoản Resend, API key hay sender |
| Đã test | Unit test của form nằm trong `npm test` (toàn bộ 500/500 ngày 11/11). QA trình duyệt trên bản build production, ở chế độ mock và chế độ tắt: 154/154, chạy lại ngày 11/11 trên code đã gộp |
| Chưa xác minh | Gửi thật qua Resend, và email có tới hello@vnest.com.vn không (không vào spam) |

Hành vi theo cấu hình:
- **Mặc định:** form ghi "Biểu mẫu trực tuyến chưa hoạt động", và một lần gửi hợp lệ báo "Chưa gửi"; endpoint trả 503.
- **Khi bật:** chỉ báo thành công sau khi provider trả 2xx. Khi lỗi, form giữ nguyên dữ liệu khách đã nhập.

**Domain gửi.** Owner đã chọn Resend (11/11/2026). `vnest.com.vn` có DMARC `p=reject`. Phải thêm bản ghi DNS của Resend (DKIM, và SPF trên subdomain
`send.`) mà không đụng MX và SPF hiện có, rồi đợi Resend báo Verified. Các bước: BACKEND-HANDOFF.md §11.3. Cách test
gửi thật trên staging: §11.8.

**Hạn chế đã biết:** rate limit lưu trong bộ nhớ, nên mỗi instance server đếm riêng. IP lấy từ `X-Forwarded-For`, chỉ
tin được khi host ghi đè header này. Nếu deploy nhiều instance hoặc serverless, cần store dùng chung (ví dụ Redis) hoặc
rate limit của nền tảng.

### Quyền riêng tư (chưa giải quyết)

Form thu tên, số điện thoại hoặc email, và nội dung tự do. VNest chưa duyệt thông báo quyền riêng tư nào, và site không
tuyên bố tuân thủ quy định nào. Trước khi mở form ra công chúng, VNest cần xác định yêu cầu theo Nghị định 13/2023/NĐ-CP
và Luật Bảo vệ dữ liệu cá nhân (hiệu lực 1/1/2026), rồi cung cấp:
- nội dung thông báo;
- có cần checkbox đồng ý không;
- thời gian lưu dữ liệu.

Email provider cũng xử lý dữ liệu này. Chi tiết: BACKEND-HANDOFF.md §11.7.

## 5. CRM hoặc kênh nhận khác

Muốn thêm CRM hay đổi provider email, viết một `ConsultationSink` mới (`domain/consultation.ts`) hoặc một
`EmailTransport` mới. Sau đó chọn nó trong `createConsultation()` ở `server/services.ts`. Form, endpoint và handler
không phải sửa. Chỉ trả `ok: true` khi nơi nhận đã xác nhận.

## 6. Ảnh

Code đọc ảnh qua 2 manifest:
- `content/vnest-workbook/photo-manifest.ts` (`public/dev-client-media/manifest.json`);
- `content/vnest-workbook/selection-photos.ts` (`public/dev-client-media/selection/manifest.json`).

Chọn ảnh nào cho hero, ảnh bìa cơ sở và ảnh phòng: `content/vnest-workbook/image-selection.ts`. Mapping cũ cho 4 ảnh
G2: `content/vnest-workbook/media.ts` (phần chú thích đầu file đã cũ). Mỗi ảnh có các bản AVIF, WebP, JPEG với `srcset`.

`public/dev-client-media/` (khoảng 280 MB) và ảnh gốc `.local-media/` (khoảng 870 MB) **không có trong Git**:
- VNest chỉ cho phép dùng ảnh để xem nội bộ trên máy local, không commit, không deploy, không công bố.
- Một số ảnh chưa rõ quyền sử dụng.

Clone mới không có hai manifest này. Code chỉ hiển thị một ảnh khi manifest có ảnh đó; nếu không, trang hiện khung
placeholder, không có ảnh hỏng. Thẻ "Khám phá thêm những nơi ở khác" cuối trang cơ sở chọn ảnh qua
`features/property-detail/related-media.ts`. Build và test chạy bình thường khi không có ảnh.

Ảnh gốc được lưu riêng, ngoài repo. Chia sẻ bộ ảnh cho bất kỳ ai cũng cần owner và VNest cho phép. Làm backend không cần
bộ ảnh này. Đừng tải ảnh lên repo hay host công khai.

Trước khi phát hành:
- VNest cho phép dùng ảnh trên web bằng văn bản;
- chọn chỗ host ảnh (object storage + CDN, hoặc một bộ ảnh đã tối ưu đưa vào build);
- cấu hình `images` trong `next.config.ts`;
- thay đường dẫn `/dev-client-media/`.

Script tạo ảnh: `docs/content/g2/` và `docs/content/selection/`. Không chạy lại `fetch-photos.mjs --derive`, vì lệnh đó
xóa các mục thêm bằng tay.

## 7. Ngôn ngữ và SEO

**Ngôn ngữ.**
- Mô hình chung: `domain/locale.ts` (`LocalizedText { vi, en? }`, `resolveLocalized`).
- Trên `/dev/*`, `?lang=en` chọn tiếng Anh. `proxy.ts` nhớ lựa chọn bằng cookie và chuyển ngôn ngữ cho server qua
  header. Server đọc bằng `requestLocale()`, client bằng `useLocale()`.
- Tiếng Anh mới phủ một phần trang chủ, trang hợp tác và footer.
- Còn tiếng Việt: thanh tìm kiếm, kết quả, bước đặt phòng, và toàn bộ 6 trang cơ sở (danh sách:
  `docs/qa/phase-e-audit-2026-11-10/AUDIT.md`, mục D1).
- Phần tiếng Anh do BMP soạn, chờ VNest duyệt.
- Route public chưa có ngôn ngữ nào ngoài tiếng Việt: `site.enabledLocales = ["vi"]`.

**SEO.**
- Index chỉ được bật khi đủ cả 3 điều kiện: `SITE_INDEXABLE=true`, `DEPLOY_ENV=production` với `SITE_URL` là https
  public, và không có dữ liệu mock hay `client-draft`.
- Khi đủ điều kiện, `next.config.ts` (lúc build) và `proxy.ts` (lúc chạy) cùng phải đồng ý. `npm run test:promotion`
  kiểm tra điều này.
- Đừng gỡ khóa này.

**Khi đưa V3 ra route public** (việc của BMP; owner chưa chốt URL, `/hop-tac` mới là dự kiến):
- dời trang khỏi `/dev/*`;
- chuyển các module trang dùng đang nằm trong `app/dev/brand-collection/client/` ra chỗ khác;
- nối `sitemap.ts` với route mới;
- thêm description, ảnh OG, JSON-LD, favicon;
- quyết định URL cho tiếng Anh.

## 8. Checklist backend

- [ ] Clone branch `handoff/vnest-v3-backend-2026-11-11`, chạy được `npm run check` và `npm run build`.
- [ ] GoHost: lấy tài liệu API và credential từ VNest. Điền ID cơ sở và phòng, viết `searchAvailability`/`readRates`, map
      lỗi, thêm timeout. Test với `resolvePropertyAvailability`.
- [ ] GoHost: kiểm `validateSelection` với số phòng thật; sau đó mới thiết kế `initiateBooking`, `readBookingStatus` và
      thanh toán.
- [ ] Trẻ em: khi VNest có chính sách, cập nhật `CHILD_POLICY` và request gửi GoHost.
- [ ] ezCloud: khi VNest gửi URL và tên tham số, điền `EZCLOUD_HANDOFF_BY_PROPERTY` và test `resolveHandoffAction`.
- [ ] Form: tạo tài khoản Resend, xác minh domain, đặt 3 biến. Test một lần gửi thật trên staging và xác nhận email tới
      hello@vnest.com.vn. Quyết định rate limit nếu chạy nhiều instance.
- [ ] Hosting: chọn nền tảng; đặt `SITE_URL`, `DEPLOY_ENV`, các secret; bảo đảm host ghi đè `X-Forwarded-For`.
- [ ] Không gỡ khóa `noindex` và không mở `/dev/*` ra production.
