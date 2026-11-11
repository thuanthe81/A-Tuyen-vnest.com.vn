import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { env } from "@/config/env";
import { reviewAccess } from "@/features/property-detail/review-access";
import { buildMetadata } from "@/seo/metadata";
import s from "./proposals.module.css";

/**
 * VNEST V3, STAGE 2/3 VISUAL PROPOSALS (24/10/2026). Static mockups for the owner's choice of
 * direction, NOT an implementation: nothing here is wired into /dev/demo, and nothing is approved.
 *
 *   ?p=brand-a     Connected Brand Index, A "Sổ thương hiệu" (vertical thread, side About panel)
 *   ?p=brand-b     Connected Brand Index, B "Sợi chỉ ngang" (horizontal thread, About band below)
 *   ?p=services-a  Services → Contact → FAQ → Footer, A "Danh mục mở rộng" (accordion + split form)
 *   ?p=services-b  Services → Contact → FAQ → Footer, B "Ba thẻ, một chi tiết" (cards + detail panel)
 *   &state=preview shows the hover/focus preview open, for review captures.
 *
 * Copy: every paragraph is a DRAFT placeholder at the length VNest's content team would write to;
 * no brand story, service term, franchise condition, contact or legal detail is invented. Brand
 * names, cities, logos and photographs are the ones already approved for the local demo. VEYA's
 * screenshots informed the information layering only; no VEYA wording, model or claim is reused.
 * Same access rule as the other demo pages (local development only).
 */
export const dynamic = "force-dynamic";
export const metadata = buildMetadata({ title: "VNest V3 · đề xuất giai đoạn 2/3", path: () => "/dev/v3-proposals", noindex: true });

const ACCESS = reviewAccess(env);
const LOGO = "/dev-fixtures/brand-collection/official-logos";
const MEDIA = "/dev-client-media";

const BRANDS = [
  { id: "bare", name: "Bare Boutique Stays", logo: `${LOGO}/bare-wordmark-transparent.webp`, w: 767, h: 402, cities: "TP. Hồ Chí Minh · Đà Nẵng", photo: "bare-chic", photoAlt: "Bare Chic: bàn làm việc và ghế sofa bên cửa sổ lớn", pos: "55% 50%" },
  { id: "nang", name: "The Nắng Suites", logo: `${LOGO}/the-nang-suites-transparent.webp`, w: 364, h: 512, cities: "Đà Nẵng", photo: "nang-blue-moon-17", photoAlt: "The Nắng Suites: phòng ngủ với gối đỏ và bàn tròn bằng gỗ", pos: "50% 55%" },
  { id: "pepper", name: "Pepper House", logo: `${LOGO}/pepper-house-transparent.webp`, w: 1406, h: 1406, cities: "TP. Hồ Chí Minh", photo: "pepper-house", photoAlt: "Pepper House: ghế bành xanh đậm bên khung cửa kính nhìn ra cây xanh", pos: "30% 50%" },
] as const;

const DRAFT_ONE_LINER = "Một câu định vị thương hiệu, 12–18 từ, do VNest cung cấp.";
const DRAFT_ABOUT =
  "Đoạn giới thiệu thương hiệu do VNest cung cấp, 40–70 từ: tinh thần thương hiệu, phong cách không gian và kiểu khách phù hợp. Nội dung ở đây chỉ là chữ giữ chỗ để thể hiện độ dài, nhịp đọc và khoảng thở của bố cục, không phải mô tả thật của thương hiệu.";
const DRAFT_PREVIEW = "Giới thiệu ngắn 18–25 từ cho bản xem nhanh khi rê chuột hoặc chọn bằng bàn phím. Chữ giữ chỗ.";

const SERVICES = [
  { id: "van-hanh", title: "Quản lý vận hành", line: "Tóm tắt 1 dòng, 10–14 từ (chờ VNest xác nhận phạm vi).", icon: "M4 17V9l6-4 6 4v8M8 17v-4h4v4" },
  { id: "phat-trien", title: "Phát triển dự án (Tư vấn mô hình)", line: "Tư vấn mô hình lưu trú; không bao gồm thiết kế hay thi công (chờ xác nhận).", icon: "M4 15h12M6 15V8l4-3 4 3v7M9 11h2" },
  { id: "nhuong-quyen", title: "Nhượng quyền thương hiệu", line: "Tóm tắt 1 dòng, 10–14 từ; điều kiện và thương hiệu áp dụng chờ VNest.", icon: "M5 10a5 5 0 1 0 10 0 5 5 0 0 0-10 0M10 5v10M5 10h10" },
] as const;
const DRAFT_SERVICE =
  "Mô tả chi tiết 50–80 từ do VNest cung cấp: dịch vụ gồm những phần việc nào, phù hợp với chủ tài sản ở giai đoạn nào, và bước đầu tiên khi trao đổi. Chưa có lợi ích, chi phí, tỷ lệ chia sẻ hay cam kết nào được nêu cho đến khi VNest xác nhận.";

const FAQ = [
  "VNest đang vận hành những thương hiệu và nơi lưu trú nào?",
  "Tôi có tài sản chưa vận hành lưu trú, có thể trao đổi với VNest không?",
  "“Phát triển dự án” gồm những gì, và không gồm những gì?",
  "Nhượng quyền áp dụng cho thương hiệu nào, với điều kiện ra sao?",
  "Sau khi gửi thông tin, VNest liên hệ lại bằng cách nào và khi nào?",
];

function Draft({ children }: { children: ReactNode }) {
  return <span className={s.draft}>{children}</span>;
}

function Photo({ id, alt, pos, sizes, className }: { id: string; alt: string; pos: string; sizes: string; className?: string }) {
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={`${MEDIA}/${id}/800.avif 800w, ${MEDIA}/${id}/1200.avif 1200w, ${MEDIA}/${id}/1600.avif 1600w`} sizes={sizes} />
      <img src={`${MEDIA}/${id}/1200.jpg`} alt={alt} style={{ objectPosition: pos }} loading="lazy" />
    </picture>
  );
}

function Logo({ brand, className }: { brand: (typeof BRANDS)[number]; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- owner-supplied artwork, unaltered
  return <img className={className} src={brand.logo} alt="" width={brand.w} height={brand.h} />;
}

function Banner({ title, note }: { title: string; note: string }) {
  return (
    <div className={s.banner}>
      <Link href="/dev/v3-proposals">← Tất cả đề xuất</Link>
      <strong>{title}</strong>
      <span>{note}</span>
    </div>
  );
}

/* ── Brand Index A: "Sổ thương hiệu" ─────────────────────────────────────── */
function BrandA({ preview }: { preview: boolean }) {
  const selected = BRANDS[0];
  return (
    <section className={s.brandA} aria-labelledby="ba-title">
      <div className={s.brandAIndex}>
        <p className={s.kicker}>Hệ sinh thái lưu trú VNest</p>
        <h2 id="ba-title" className={s.h2}>
          Ba thương hiệu, một sợi chỉ nối.
        </h2>
        <ol className={s.ledger}>
          {BRANDS.map((brand, i) => (
            <li key={brand.id} className={s.ledgerItem} data-selected={i === 0} data-preview={preview && i === 1}>
              <span className={s.node} aria-hidden="true" />
              <button type="button" className={s.ledgerButton} aria-pressed={i === 0}>
                <span className={s.logoBox}>
                  <Logo brand={brand} />
                </span>
                <span className={s.ledgerText}>
                  <span className={s.ledgerName}>{brand.name}</span>
                  <span className={s.ledgerCities}>{brand.cities}</span>
                </span>
              </button>
              <div className={s.preview} role="tooltip">
                <Photo id={brand.photo} alt="" pos={brand.pos} sizes="200px" className={s.previewPhoto} />
                <p>
                  <strong>{brand.name}</strong>
                  <Draft>{DRAFT_PREVIEW}</Draft>
                </p>
              </div>
            </li>
          ))}
        </ol>
        <a className={s.allStays} href="#">
          Xem tất cả 6 nơi lưu trú →
        </a>
      </div>
      <article className={s.aboutPanel} aria-label={`Giới thiệu ${selected.name}`}>
        <Photo id={selected.photo} alt={selected.photoAlt} pos={selected.pos} sizes="(min-width: 64rem) 30vw, 100vw" className={s.aboutPhoto} />
        <div className={s.aboutText}>
          <Logo brand={selected} className={s.aboutLogo} />
          <p className={s.aboutCities}>{selected.cities}</p>
          <p className={s.aboutLine}>
            <Draft>{DRAFT_ONE_LINER}</Draft>
          </p>
          <p className={s.aboutBody}>
            <Draft>{DRAFT_ABOUT}</Draft>
          </p>
          <div className={s.aboutActions}>
            <a href="#" className={s.primary}>
              Khám phá cơ sở {selected.name.split(" ")[0]}
            </a>
            <span className={s.pending}>Website thương hiệu: chờ xác minh tên miền</span>
          </div>
        </div>
      </article>
    </section>
  );
}

/* ── Brand Index B: "Sợi chỉ ngang" ──────────────────────────────────────── */
function BrandB({ preview }: { preview: boolean }) {
  const selected = BRANDS[1];
  return (
    <section className={s.brandB} aria-labelledby="bb-title">
      <div className={s.brandBHead}>
        <div>
          <p className={s.kicker}>Hệ sinh thái lưu trú VNest</p>
          <h2 id="bb-title" className={s.h2}>
            Ba thương hiệu, một sợi chỉ nối.
          </h2>
        </div>
        <a className={s.allStays} href="#">
          Xem tất cả 6 nơi lưu trú →
        </a>
      </div>
      <ol className={s.thread}>
        {BRANDS.map((brand, i) => (
          <li key={brand.id} className={s.threadItem} data-selected={i === 1} data-preview={preview && i === 2}>
            <button type="button" className={s.threadButton} aria-pressed={i === 1}>
              <span className={s.threadLogo}>
                <Logo brand={brand} />
              </span>
              <span className={s.threadNode} aria-hidden="true" />
              <span className={s.threadName}>{brand.name}</span>
              <span className={s.ledgerCities}>{brand.cities}</span>
            </button>
            <div className={`${s.preview} ${s.previewBelow}`} role="tooltip">
              <Photo id={brand.photo} alt="" pos={brand.pos} sizes="200px" className={s.previewPhoto} />
              <p>
                <strong>{brand.name}</strong>
                <Draft>{DRAFT_PREVIEW}</Draft>
              </p>
            </div>
          </li>
        ))}
      </ol>
      <article className={s.band} aria-label={`Giới thiệu ${selected.name}`}>
        <Photo id={selected.photo} alt={selected.photoAlt} pos={selected.pos} sizes="(min-width: 64rem) 55vw, 100vw" className={s.bandPhoto} />
        <div className={s.bandText}>
          <p className={s.kicker}>{selected.cities}</p>
          <h3 className={s.h3}>{selected.name}</h3>
          <p className={s.aboutLine}>
            <Draft>{DRAFT_ONE_LINER}</Draft>
          </p>
          <p className={s.aboutBody}>
            <Draft>{DRAFT_ABOUT}</Draft>
          </p>
          <div className={s.aboutActions}>
            <a href="#" className={s.primary}>
              Khám phá {selected.name}
            </a>
            <span className={s.pending}>Website thương hiệu: chờ xác minh</span>
          </div>
        </div>
      </article>
    </section>
  );
}

/* ── Shared owner-journey blocks ─────────────────────────────────────────── */
function ContactForm({ dark, service }: { dark?: boolean; service: string }) {
  return (
    <form className={`${s.form} ${dark ? s.formOnDark : ""}`} aria-label="Yêu cầu tư vấn (bản đề xuất)">
      <div className={s.formGrid}>
        <label>
          <span>Họ tên <em>*</em></span>
          <input name="name" autoComplete="name" />
        </label>
        <label>
          <span>Số điện thoại hoặc email <em>*</em></span>
          <input name="contact" />
        </label>
        <label>
          <span>Dịch vụ quan tâm</span>
          <select name="service" defaultValue={service}>
            {SERVICES.map((x) => (
              <option key={x.id}>{x.title}</option>
            ))}
            <option>Chưa rõ, cần tư vấn</option>
          </select>
        </label>
        <label>
          <span>Loại tài sản <small>(không bắt buộc)</small></span>
          <select name="asset" defaultValue="">
            <option value="">Chọn</option>
            <option>Danh sách chờ VNest</option>
          </select>
        </label>
        <label className={s.wide}>
          <span>Thông tin thêm <small>(không bắt buộc)</small></span>
          <textarea name="notes" rows={3} />
        </label>
      </div>
      <button type="button" className={s.submit} aria-disabled="true">
        Gửi yêu cầu tư vấn
      </button>
      <p className={s.formNote}>Kênh nhận yêu cầu chưa được kết nối: bản đề xuất không gửi dữ liệu. Thông báo quyền riêng tư: chờ VNest.</p>
    </form>
  );
}

function Faq() {
  return (
    <section className={s.faq} aria-labelledby="faq-title">
      <div>
        <p className={s.kicker}>Hỏi đáp</p>
        <h2 id="faq-title" className={s.h2}>
          Câu hỏi thường gặp
        </h2>
        <p className={s.muted}>4–6 câu, câu trả lời 30–60 từ, do VNest duyệt. Câu về phí, chia sẻ doanh thu và nhượng quyền chỉ đăng khi có nội dung chính thức.</p>
      </div>
      <div className={s.faqList}>
        {FAQ.map((q, i) => (
          <details key={q} open={i === 0}>
            <summary>{q}</summary>
            <p>
              <Draft>Câu trả lời 30–60 từ, chờ VNest.</Draft>
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Footer({ variant }: { variant: "a" | "b" }) {
  return (
    <footer className={`${s.footer} ${variant === "b" ? s.footerB : ""}`}>
      <div className={s.footerTop}>
        <div className={s.footerBrand}>
          {/* eslint-disable-next-line @next/next/no-img-element -- VNest's own artwork */}
          <img src="/dev-fixtures/brand-collection/vnest-symbol.svg" alt="" width={40} height={40} />
          {/* eslint-disable-next-line @next/next/no-img-element -- VNest's own artwork */}
          <img src="/dev-fixtures/brand-collection/vnest-wordmark.svg" alt="VNest" width={117} height={28} className={s.footerWord} />
          <p>Hospitality Management</p>
        </div>
        <nav aria-label="Khám phá">
          <h3>Khám phá</h3>
          <a href="#">Nơi lưu trú</a>
          <a href="#">BOOKING</a>
          <a href="#">Về VNest</a>
        </nav>
        <nav aria-label="Dành cho chủ tài sản">
          <h3>Chủ tài sản</h3>
          <a href="#">Dịch vụ</a>
          <a href="#">Liên hệ tư vấn</a>
          <a href="#">Câu hỏi thường gặp</a>
        </nav>
        <div>
          <h3>Liên hệ</h3>
          <p className={s.muted}>Điện thoại, email, địa chỉ: chờ VNest</p>
          <ul className={s.social} aria-label="Mạng xã hội VNest (đang cập nhật)">
            <li>Facebook</li>
            <li>Instagram</li>
            <li>TikTok</li>
          </ul>
        </div>
      </div>
      <div className={s.footerBottom}>
        <span>© 2026 VNest · Tên pháp nhân và mã số doanh nghiệp: chờ VNest</span>
        <span>Chính sách bảo mật: chưa có trang (không liên kết)</span>
      </div>
    </footer>
  );
}

/* ── Services A: "Danh mục mở rộng" ──────────────────────────────────────── */
function ServicesA() {
  return (
    <>
      <section className={s.servicesA} aria-labelledby="sa-title">
        <div className={s.servicesIntro}>
          <p className={s.kicker}>Dành cho chủ tài sản</p>
          <h2 id="sa-title" className={s.h2}>
            Cùng VNest phát triển tài sản lưu trú.
          </h2>
          <p className={s.muted}>
            <Draft>Đoạn mở 25–40 từ do VNest cung cấp: VNest đồng hành với chủ tài sản ở những giai đoạn nào.</Draft>
          </p>
        </div>
        <div className={s.accordion}>
          {SERVICES.map((x, i) => (
            <details key={x.id} open={i === 1} className={s.service}>
              <summary>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
                  <path d={x.icon} />
                </svg>
                <span>
                  <strong>{x.title}</strong>
                  <small>{x.line}</small>
                </span>
              </summary>
              <div className={s.serviceBody}>
                <p>
                  <Draft>{DRAFT_SERVICE}</Draft>
                </p>
                <a href="#lien-he-a" className={s.textCta}>
                  Trao đổi về {x.title.split(" (")[0]?.toLowerCase()} →
                </a>
              </div>
            </details>
          ))}
        </div>
      </section>
      <section id="lien-he-a" className={s.contactA} aria-labelledby="ca-title">
        <div>
          <p className={s.kicker}>Liên hệ tư vấn</p>
          <h2 id="ca-title" className={s.h2}>
            Kể cho VNest về tài sản của anh chị.
          </h2>
          <p>
            <Draft>Đoạn 25–40 từ: VNest sẽ dùng thông tin để chuẩn bị buổi trao đổi. Không hứa thời gian phản hồi khi chưa có quy trình.</Draft>
          </p>
          <p className={s.selected}>Đã chọn: Phát triển dự án (Tư vấn mô hình)</p>
        </div>
        <ContactForm dark service={SERVICES[1].title} />
      </section>
      <Faq />
      <Footer variant="a" />
    </>
  );
}

/* ── Services B: "Ba thẻ, một chi tiết" ──────────────────────────────────── */
function ServicesB() {
  const first = SERVICES[0];
  return (
    <>
      <section className={s.servicesB} aria-labelledby="sb-title">
        <p className={s.kicker}>Dành cho chủ tài sản</p>
        <h2 id="sb-title" className={s.h2}>
          Ba cách VNest đồng hành cùng chủ tài sản.
        </h2>
        <div className={s.cards} role="tablist" aria-label="Dịch vụ">
          {SERVICES.map((x, i) => (
            <button key={x.id} type="button" role="tab" aria-selected={i === 0} className={s.card}>
              <span className={s.cardNo}>0{i + 1}</span>
              <strong>{x.title}</strong>
              <small>{x.line}</small>
              <span className={s.cardMore} aria-hidden="true">
                {i === 0 ? "Đang xem" : "Xem chi tiết"}
              </span>
            </button>
          ))}
        </div>
        <div className={s.detail} role="tabpanel" aria-label={first.title}>
          <div>
            <h3 className={s.h3}>{first.title}</h3>
            <p>
              <Draft>{DRAFT_SERVICE}</Draft>
            </p>
          </div>
          <ul className={s.detailList}>
            <li>
              <Draft>Phần việc 1 (5–10 từ)</Draft>
            </li>
            <li>
              <Draft>Phần việc 2 (5–10 từ)</Draft>
            </li>
            <li>
              <Draft>Phần việc 3 (5–10 từ)</Draft>
            </li>
          </ul>
          <a href="#lien-he-b" className={s.primary}>
            Tư vấn về quản lý vận hành
          </a>
        </div>
      </section>
      <section id="lien-he-b" className={s.contactB} aria-labelledby="cb-title">
        <div className={s.contactBHead}>
          <p className={s.kicker}>Liên hệ tư vấn</p>
          <h2 id="cb-title" className={s.h2}>
            Bắt đầu một cuộc trao đổi.
          </h2>
          <div className={s.chips} role="radiogroup" aria-label="Dịch vụ quan tâm">
            {SERVICES.map((x, i) => (
              <span key={x.id} role="radio" aria-checked={i === 0} tabIndex={i === 0 ? 0 : -1} className={s.chip}>
                {x.title}
              </span>
            ))}
          </div>
        </div>
        <ContactForm service={first.title} />
      </section>
      <Faq />
      <Footer variant="b" />
    </>
  );
}

const PROPOSALS = {
  "brand-a": { title: "Brand Index A · Sổ thương hiệu", note: "Sợi chỉ dọc nối 3 logo; rê chuột/Tab: xem nhanh; chọn: bảng About bên phải. Điện thoại: 3 logo thành hàng chọn, bảng About bên dưới." },
  "brand-b": { title: "Brand Index B · Sợi chỉ ngang", note: "3 logo trên một sợi chỉ ngang; xem nhanh thả xuống; chọn: dải About rộng bên dưới. Điện thoại: giữ hàng 3 logo, dải About xếp dọc." },
  "services-a": { title: "Dịch vụ / Liên hệ A · Danh mục mở rộng", note: "Tiêu đề cố định bên trái, 3 mục mở rộng bên phải; CTA mỗi mục → form nền olive đã chọn sẵn dịch vụ → FAQ → footer." },
  "services-b": { title: "Dịch vụ / Liên hệ B · Ba thẻ, một chi tiết", note: "3 thẻ ngang chọn như tab; chi tiết rộng bên dưới với 1 CTA → form sáng, dịch vụ chọn bằng chip → FAQ → footer olive." },
} as const;

export default async function V3Proposals({ searchParams }: { searchParams: Promise<{ p?: string; state?: string }> }) {
  if (!ACCESS.route) notFound();
  const { p, state } = await searchParams;
  const preview = state === "preview";
  const key = p && p in PROPOSALS ? (p as keyof typeof PROPOSALS) : null;
  if (!key) {
    return (
      <main className={s.index}>
        <p className={s.kicker}>VNest V3 · 24/10/2026 · chưa duyệt</p>
        <h1 className={s.h2}>Đề xuất giai đoạn 2/3</h1>
        <p className={s.muted}>Bản mô phỏng tĩnh để chọn hướng. Không gắn vào /dev/demo. Mọi đoạn chữ đánh dấu DRAFT là chữ giữ chỗ theo độ dài cần xin VNest.</p>
        <ul>
          {Object.entries(PROPOSALS).map(([id, x]) => (
            <li key={id}>
              <Link href={`/dev/v3-proposals?p=${id}`}>{x.title}</Link>
              <span>{x.note}</span>
            </li>
          ))}
        </ul>
      </main>
    );
  }
  const meta = PROPOSALS[key];
  return (
    <div className={s.page}>
      <Banner title={meta.title} note={meta.note} />
      {key === "brand-a" ? <BrandA preview={preview} /> : null}
      {key === "brand-b" ? <BrandB preview={preview} /> : null}
      {key === "services-a" ? <ServicesA /> : null}
      {key === "services-b" ? <ServicesB /> : null}
    </div>
  );
}
