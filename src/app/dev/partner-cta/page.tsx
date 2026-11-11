import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { env } from "@/config/env";
import { resolveLocalized, type Locale } from "@/domain/locale";
import demoStyles from "@/features/demo/Demo.module.css";
import { SERVICES } from "@/features/demo/owner-journey";
import { requestLocale } from "@/features/locale/request-locale";
import { withLocale } from "@/features/locale/preview-locale";
import { CtaLink } from "@/features/partner/CtaContent";
import { PARTNER_HERO } from "@/features/partner/partner-page-content";
import { CONSULTATION_ANCHOR, PARTNER_PAGE, consultationHref, partnerPageHref } from "@/features/partner/routes";
import { reviewAccess } from "@/features/property-detail/review-access";
import { buildMetadata } from "@/seo/metadata";
import styles from "./preview.module.css";

/**
 * CTA REVIEW PAGE (owner briefs of 9/11/2026). Records the CTA decision for Hợp tác cùng VNest:
 * - the homepage accordion keeps its approved solid Copper CTA (no wipe);
 * - the partner page uses the two-state wipe (white → Copper, left to right), shown here at rest, half way, fully
 *   wiped and focused, then live with its real wording and destinations.
 * The earlier experiments (split button, Copper and Olive disc wipes) were superseded and their code removed; their
 * screenshots stay in docs/qa/partner-cta-2026-11-09/. Private, local, noindex (`reviewAccess`).
 */
export const dynamic = "force-dynamic";

const ACCESS = reviewAccess(env);

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ title: "CTA · bản xem trước", path: () => "/dev/partner-cta", noindex: true });
}

/** Review chrome only (labels of this page, never site copy). */
const CHROME = {
  title: { vi: "Hợp tác · nút kêu gọi hành động · bản xem trước", en: "Partnership · CTA · preview" },
  back: { vi: "Trang hợp tác", en: "Partner page" },
  partner: { vi: "Trang hợp tác · wipe hai trạng thái", en: "Partner page · two-state wipe" },
  partnerHint: {
    vi: "Mặc định nền trắng, chữ Dark Olive, mũi tên Copper, một viền mảnh. Khi di chuột hoặc chọn bằng bàn phím, lớp Copper phủ từ trái sang phải toàn bộ nút; chữ và mũi tên thành trắng.",
    en: "White at rest, Dark Olive label, Copper arrow, one fine edge. On hover or keyboard focus a Copper layer covers the whole button from left to right; the label and arrow turn white.",
  },
  home: { vi: "Trang chủ · nút Copper đặc (giữ nguyên bản đã duyệt)", en: "Homepage · solid Copper (the approved button, unchanged)" },
  homeHint: {
    vi: "Accordion Hợp tác trên trang chủ dùng lại nút Copper đặc đã duyệt, không có hiệu ứng wipe.",
    en: "The homepage's Hợp tác accordion uses the approved solid Copper button again, with no wipe.",
  },
  homeLink: { vi: "Xem trên trang chủ", en: "See it on the homepage" },
  live: { vi: "Dùng thử: các nút thật, đúng nội dung và đích đến", en: "Try them: the real buttons, with their wording and destinations" },
  heroCta: { vi: "Hero", en: "Hero" },
  serviceCta: { vi: "Dịch vụ", en: "Service" },
} as const;

const STATES: Readonly<Record<Locale, readonly [string, string, string, string]>> = {
  vi: ["Mặc định", "Wipe 50%", "Wipe 100% (di chuột)", "Bàn phím (focus)"],
  en: ["Default", "Wipe 50%", "Wipe 100% (hover)", "Keyboard focus"],
};

export default async function CtaPreview() {
  if (!ACCESS.route) notFound();
  const locale: Locale = await requestLocale();
  const c = resolveLocalized(CHROME, locale);
  const states = STATES[locale];
  const heroLabel = resolveLocalized(PARTNER_HERO.cta, locale);
  const heroHref = withLocale(`${PARTNER_PAGE}#${CONSULTATION_ANCHOR}`, locale);
  const other = locale === "vi" ? "en" : "vi";

  return (
    <main className={`${demoStyles.page} ${styles.page}`} lang={locale}>
      <nav className={styles.bar} aria-label={c.title} data-preview-bar>
        <span className={styles.barTitle}>{c.title}</span>
        <span className={styles.barLinks}>
          <Link href={partnerPageHref(locale)}>{c.back}</Link>
          <Link href={withLocale("/dev/partner-cta", other)} lang={other}>
            {other.toUpperCase()}
          </Link>
        </span>
      </nav>

      <section className={styles.option} data-option="partner" aria-labelledby="option-partner">
        <h2 id="option-partner" className={styles.h2}>
          {c.partner}
        </h2>
        <p className={styles.hint}>{c.partnerHint}</p>
        <div className={styles.states}>
          {(["rest", "half", "full", "focus"] as const).map((state, i) => (
            <figure key={state} className={styles.state} data-state-preview={state}>
              <CtaLink href={heroHref} state={state === "rest" ? undefined : state === "focus" ? "full" : state} tabIndex={-1} data-focus-preview={state === "focus" || undefined}>
                {heroLabel}
              </CtaLink>
              <figcaption>{states[i]}</figcaption>
            </figure>
          ))}
        </div>

        <h3 className={styles.h3}>{c.live}</h3>
        <dl className={styles.live}>
          <div>
            <dt>{c.heroCta}</dt>
            <dd>
              <CtaLink href={heroHref} data-live="hero">
                {heroLabel}
              </CtaLink>
            </dd>
          </div>
          {SERVICES.map((s) => (
            <div key={s.id}>
              <dt>
                {c.serviceCta} {s.no}
              </dt>
              <dd>
                <CtaLink href={consultationHref(s.id, locale, PARTNER_PAGE)} data-live="service" data-service={s.id}>
                  {resolveLocalized(s.cta, locale)}
                </CtaLink>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.option} data-option="home" aria-labelledby="option-home">
        <h2 id="option-home" className={styles.h2}>
          {c.home}
        </h2>
        <p className={styles.hint}>
          {c.homeHint} <Link href={withLocale("/dev/demo?intro=0#hop-tac", locale)}>{c.homeLink}</Link>
        </p>
      </section>
    </main>
  );
}
