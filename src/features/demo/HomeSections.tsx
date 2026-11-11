import Link from "next/link";
import { DEMO_LINKS } from "./links";
import { ContactPlaceholders } from "./SiteHeader";
import styles from "./Demo.module.css";

/**
 * CEO DEMO HOMEPAGE SECTIONS (refined 22/10/2026): Hợp tác cùng VNest and Liên hệ. "Về VNest" moved to
 * `AboutVNest.tsx` (About VNest V2, "The Art of Staying", 4/11/2026).
 *
 * Strictly aligned with the CEO's 21/10/2026 directive: VNest focuses on HOSPITALITY MANAGEMENT
 * ONLY ("Quản lý khách sạn / vận hành lưu trú") and no longer offers turnkey development,
 * architectural design or construction services.
 *
 * Only verified VNest brand material is used (docs/design/brand-collection/README.md §1):
 * - Lockup and positioning: "Hospitality Management"
 * - Portfolio: 3 brands (Bare Boutique Stays, The Nắng Suites, Pepper House), 6 properties,
 *   2 cities (TP. Hồ Chí Minh and Đà Nẵng)
 * - No unverified commercial terms, revenue guarantees, statistics or fake forms.
 */
const PARTNER_PILLARS = [
  {
    index: "01",
    label: "Trọng tâm hợp tác",
    title: "Quản lý & vận hành lưu trú",
    detail: "Tập trung chuyên sâu vào quản lý và vận hành khách sạn, đồng hành cùng chủ sở hữu cơ sở lưu trú.",
  },
  {
    index: "02",
    label: "Dành cho chủ sở hữu",
    title: "Cùng trao đổi về cơ sở của bạn",
    detail: "Dành cho chủ sở hữu khách sạn và cơ sở lưu trú đang tìm hiểu hợp tác quản lý vận hành.",
  },
  {
    index: "03",
    label: "Hệ sinh thái hiện diện",
    title: "Hiện diện tại TP. Hồ Chí Minh & Đà Nẵng",
    detail: "Hiện diện tại TP. Hồ Chí Minh và Đà Nẵng qua Bare Boutique Stays, The Nắng Suites và Pepper House.",
  },
  {
    index: "04",
    label: "Phạm vi hợp tác",
    title: "Bắt đầu từ nhu cầu của từng cơ sở",
    detail: "Các hạng mục quản lý cụ thể cần được trao đổi và xác nhận trước khi thống nhất hợp tác.",
  },
] as const;

const PARTNER_STEPS = [
  { step: "Bước 01", title: "Chia sẻ thông tin cơ sở lưu trú & định hướng của chủ sở hữu" },
  { step: "Bước 02", title: "Trao đổi trực tiếp về mô hình quản lý vận hành phù hợp" },
  { step: "Bước 03", title: "Làm rõ phạm vi hợp tác trước khi thống nhất" },
] as const;

export function PartnerWithVNest() {
  return (
    <section id="hop-tac" className={styles.partner} aria-labelledby="hop-tac-title">
      <div className={styles.partnerInner}>
        <div className={styles.partnerTop}>
          <div className={styles.partnerIdentity}>
            <p className={styles.partnerKicker}>Hợp tác cùng VNest · Dành cho chủ sở hữu cơ sở lưu trú</p>
            <h2 id="hop-tac-title" className={styles.partnerTitle}>
              Không gian của bạn. VNest đồng hành vận hành.
            </h2>
          </div>
          <div className={styles.partnerIntroCol}>
            <p className={styles.partnerLead}>
              VNest tập trung vào quản lý và vận hành cơ sở lưu trú, hướng đến trải nghiệm nhất quán cho khách hàng và một phương thức hợp tác rõ ràng với chủ sở hữu.
            </p>
            <div className={styles.partnerScopeBadge}>
              <span className={styles.partnerScopeDot} aria-hidden="true" />
              <span>Định hướng trọng tâm: Quản lý &amp; vận hành khách sạn (Hospitality Management)</span>
            </div>
          </div>
        </div>

        <ul className={styles.partnerPillars} aria-label="Trọng tâm đồng hành cùng chủ sở hữu">
          {PARTNER_PILLARS.map((item) => (
            <li key={item.index} className={styles.partnerPillarCard}>
              <div className={styles.partnerPillarMeta}>
                <span className={styles.partnerPillarIndex} aria-hidden="true">
                  {item.index}
                </span>
                <span className={styles.partnerPillarLabel}>{item.label}</span>
              </div>
              <h3 className={styles.partnerPillarTitle}>{item.title}</h3>
              <p className={styles.partnerPillarDetail}>{item.detail}</p>
            </li>
          ))}
        </ul>

        <div className={styles.partnerActionPanel}>
          <div className={styles.partnerStepsWrap}>
            <p className={styles.partnerStepsHeading}>Lộ trình kết nối dành cho chủ sở hữu</p>
            <ol className={styles.partnerStepsList}>
              {PARTNER_STEPS.map((s) => (
                <li key={s.step}>
                  <span className={styles.partnerStepCode}>{s.step}</span>
                  <span>{s.title}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.partnerCtaBox}>
            <Link href={DEMO_LINKS.contact} className={styles.partnerCta}>
              Liên hệ hợp tác
            </Link>
            <p className={styles.partnerNote}>
              Bản trình diễn: phạm vi quản lý chi tiết và đầu mối liên hệ đang chờ VNest xác nhận.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ContactVNest() {
  return (
    <footer id="lien-he" className={styles.contact} aria-labelledby="lien-he-title">
      <div className={styles.contactInner}>
        <div className={styles.contactLeadCol}>
          <p className={styles.kicker}>Kênh kết nối · Khái niệm trình diễn</p>
          <h2 id="lien-he-title" className={styles.sectionTitle}>
            Liên hệ &amp; trao đổi hợp tác
          </h2>
          <p className={styles.sectionLead}>
            Thông tin liên hệ chính thức của VNest — dành cho khách lưu trú và chủ sở hữu quan tâm đến hợp tác quản lý vận hành — đang được hoàn thiện cho bản trình diễn này.
          </p>
        </div>
        <div className={styles.contactCard}>
          <p className={styles.contactCardTitle}>Đầu mối liên hệ dự kiến (đang cập nhật)</p>
          <p className={styles.contactCardSub}>
            Các kênh liên hệ chính thức sẽ được kích hoạt ngay sau khi VNest xác nhận thông tin đầu mối phụ trách.
          </p>
          <ContactPlaceholders />
        </div>
      </div>
    </footer>
  );
}
