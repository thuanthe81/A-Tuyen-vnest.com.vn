import type { CSSProperties } from "react";
import type { ConsultationMode } from "@/domain/consultation";
import { resolveLocalized, type Locale } from "@/domain/locale";
import { BRAND_INDEX_UI } from "@/features/demo/brand-copy";
import { ConsultationForm, ConsultationProvider, ContactSection } from "@/features/demo/Consultation";
import { OwnerFaq } from "@/features/demo/OwnerFaq";
import { OWNER_JOURNEY_UI, SERVICES, type Service } from "@/features/demo/owner-journey";
import type { FamilyBrand } from "../brand-family";
import { familyCounts } from "../brand-family";
import { CtaContent, ctaClass } from "../CtaContent";
import { PAGE_FAQ, PARTNER_HERO, PARTNER_PHOTOS, PARTNER_SECTIONS, PARTNER_STRENGTHS, PROCESS_DETAILS, PROCESS_STEPS, familyLine } from "../partner-page-content";
import { CONSULTATION_ANCHOR, PARTNER_PAGE, consultationHref } from "../routes";
import { ServiceVisual } from "../ServiceVisual";
import type { SelectionPicture, ServicePhoto } from "../service-visuals";
import { ConsultLink } from "./ConsultLink";
import { Picture } from "./Picture";
import styles from "./PartnerPage.module.css";

/**
 * THE PARTNER PAGE (/dev/demo/hop-tac; owner brief of 9/11/2026, visual refinement the same day): the B2B story the
 * homepage's accordion introduces.
 *
 * 01 Hero → 02 the three services → 03 why VNest → 04 how it works → 05 the brand ecosystem → 06 FAQ, contact and form.
 * One h1; an h2 per section; h3 per service, strength and step. Everything but the form's behaviour is rendered on the
 * server. Content: partner-page-content.ts (what is client text, what is from client text, what is DRAFT); service and
 * FAQ copy is the client's (owner-journey.ts), read, never copied. The consultation form and contact block are the
 * homepage's own components (Consultation.tsx); service CTAs choose their service in it. Photographs carry no caption:
 * their alt text describes them and the image registry keeps their source.
 */
export type PartnerPageProps = {
  locale: Locale;
  photos: { hero: SelectionPicture | null; why: SelectionPicture | null; service: ServicePhoto | null };
  family: readonly FamilyBrand[];
  /** Whether the consultation form sends (server configuration; off by default). */
  delivery?: ConsultationMode;
};

const t = resolveLocalized;

export function PartnerPage({ locale, photos, family, delivery = "off" }: PartnerPageProps) {
  const formHref = (service?: Service["id"]) => (service ? consultationHref(service, locale, PARTNER_PAGE) : `#${CONSULTATION_ANCHOR}`);
  return (
    <ConsultationProvider delivery={delivery}>
      <div className={styles.page} lang={locale}>
        <Hero locale={locale} photo={photos.hero} formHref={formHref()} />
        <Services locale={locale} photo={photos.service} formHref={formHref} />
        <Why locale={locale} photo={photos.why} family={family} />
        <Process locale={locale} />
        <Ecosystem locale={locale} family={family} />
        <OwnerFaq locale={locale} items={PAGE_FAQ} title={PARTNER_SECTIONS.faqTitle} />
        <ContactSection locale={locale} />
        <ConsultationForm locale={locale} />
      </div>
    </ConsultationProvider>
  );
}

/* ── 01 · Hero ── */

function Hero({ locale, photo, formHref }: { locale: Locale; photo: SelectionPicture | null; formHref: string }) {
  const hero = t(PARTNER_HERO, locale);
  return (
    <section className={styles.hero} aria-labelledby="hop-tac-title">
      <div className={styles.heroText}>
        <p className={styles.kicker}>{hero.kicker}</p>
        <h1 id="hop-tac-title" className={styles.h1}>
          {hero.title}
        </h1>
        <p className={styles.heroLead}>{hero.supporting}</p>
        <ConsultLink href={formHref} className={`${ctaClass()} ${styles.heroCta}`}>
          <CtaContent>{hero.cta}</CtaContent>
        </ConsultLink>
      </div>
      <div className={styles.heroFrame}>
        <Picture photo={photo} locale={locale} className={styles.cover} sizes="(min-width: 64rem) 55vw, 100vw" position={PARTNER_PHOTOS.hero.position} eager />
      </div>
    </section>
  );
}

/* ── 02 · Services ── */

function Services({ locale, photo, formHref }: { locale: Locale; photo: ServicePhoto | null; formHref: (service: Service["id"]) => string }) {
  const ui = t(OWNER_JOURNEY_UI, locale);
  return (
    <section id="dich-vu" className={styles.services} aria-labelledby="dich-vu-title">
      <div className={styles.head}>
        <p className={styles.kicker}>{ui.servicesKicker}</p>
        <h2 id="dich-vu-title" className={styles.h2}>
          {ui.servicesTitle}
        </h2>
      </div>
      {SERVICES.map((s, i) => (
        <article key={s.id} id={`dich-vu-${s.id}`} className={styles.chapter} data-service={s.id} data-side={i % 2 ? "right" : "left"} aria-labelledby={`dich-vu-${s.id}-title`}>
          <div className={styles.chapterFrame}>
            <ServiceVisual service={s} locale={locale} photo={photo} notes={false} />
          </div>
          <div className={styles.chapterText}>
            <p className={styles.chapterNo} aria-hidden="true">
              {s.no}
            </p>
            <h3 id={`dich-vu-${s.id}-title`} className={styles.h3}>
              {t(s.title, locale)}
              {s.sub ? <span className={styles.sub}>{t(s.sub, locale)}</span> : null}
            </h3>
            <p className={styles.chapterLead}>{t(s.line, locale)}</p>
            <p className={styles.chapterBody}>{t(s.description, locale)}</p>
            <div className={styles.highlights}>
              <p className={styles.highlightsLabel}>{t(PARTNER_SECTIONS.highlights, locale)}</p>
              <ul>
                {s.highlights.map((h) => (
                  <li key={h.vi}>{t(h, locale)}</li>
                ))}
              </ul>
            </div>
            <ConsultLink href={formHref(s.id)} service={s.id} className={`${ctaClass()} ${styles.chapterCta}`}>
              <CtaContent>{t(s.cta, locale)}</CtaContent>
            </ConsultLink>
          </div>
        </article>
      ))}
    </section>
  );
}

/* ── 03 · Why VNest ── */

function Why({ locale, photo, family }: { locale: Locale; photo: SelectionPicture | null; family: readonly FamilyBrand[] }) {
  const counts = familyCounts(family, locale);
  return (
    <section id="the-manh" className={styles.why} aria-labelledby="the-manh-title">
      <div className={styles.whyInner}>
        <div className={styles.whyFrame}>
          <Picture photo={photo} locale={locale} className={styles.cover} sizes="(min-width: 64rem) 40vw, 100vw" />
        </div>
        <div className={styles.whyText}>
          <p className={styles.kicker}>{t(PARTNER_SECTIONS.whyKicker, locale)}</p>
          <h2 id="the-manh-title" className={styles.h2}>
            {t(PARTNER_SECTIONS.whyTitle, locale)}
          </h2>
          <ol className={styles.strengths}>
            {PARTNER_STRENGTHS.map((point, i) => (
              <li key={point.id} data-strength={point.id}>
                <span className={styles.strengthNo} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className={styles.strengthLabel}>{t(point.label, locale)}</h3>
                <p className={styles.strengthText}>{point.text === "records" ? familyLine(locale, { ...counts, names: family.map((b) => b.name) }) : t(point.text, locale)}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ── 04 · How it works ── */

function Process({ locale }: { locale: Locale }) {
  const details = PROCESS_DETAILS.filter((group) => group.items.length > 0);
  return (
    <section id="cach-hop-tac" className={styles.process} aria-labelledby="cach-hop-tac-title">
      <div className={styles.head}>
        <p className={styles.kicker}>{t(PARTNER_SECTIONS.processKicker, locale)}</p>
        <h2 id="cach-hop-tac-title" className={styles.h2}>
          {t(PARTNER_SECTIONS.processTitle, locale)}
        </h2>
      </div>
      <ol className={styles.steps}>
        {PROCESS_STEPS.map((step, i) => (
          <li key={step.id} className={styles.step}>
            <span className={styles.stepNo} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className={styles.stepTitle}>{t(step.title, locale)}</h3>
            <p className={styles.stepText}>{t(step.text, locale)}</p>
          </li>
        ))}
      </ol>
      {details.length ? (
        <div className={styles.details}>
          {details.map((group) => (
            <div key={group.id} className={styles.detailGroup}>
              <h3 className={styles.stepTitle}>{t(group.title, locale)}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item.vi}>{t(item, locale)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/* ── 05 · The brand ecosystem ── */

/**
 * VNest above its three brands, in two regions (owner, 9/11/2026): a Dark Olive band with VNest's mark and one line,
 * then the three official marks on cream. Each brand has the same structure (10/11/2026): its mark centred in one band
 * the three share, at its own proportions and balanced by eye (`optical`, brand-family.ts), and its name on one common
 * line below, so the row reads as three equals.
 * Nothing else: no photographs, descriptions, places or counts (they stay in the data). The section shows the family,
 * not an offer: franchising (Bare Boutique Stays and Pepper House only) is service 03's, above.
 *
 * Only VNest's copper symbol is used on the band: the approved wordmark is Dark Olive, the band's own colour, and there is
 * no reversed version to use. The headline and the kicker are the homepage brand section's approved ones.
 */
function Ecosystem({ locale, family }: { locale: Locale; family: readonly FamilyBrand[] }) {
  const ui = t(BRAND_INDEX_UI, locale);
  return (
    <section id="thuong-hieu" className={styles.ecosystem} aria-labelledby="thuong-hieu-title">
      <div className={styles.ecosystemInner}>
        <div className={styles.parent}>
          {/* eslint-disable-next-line @next/next/no-img-element -- VNest's own vector artwork, approved Copper */}
          <img className={styles.parentMark} src="/dev-fixtures/brand-collection/vnest-symbol-approved.svg" alt="VNest" width={456} height={449} />
          <p className={styles.parentKicker}>{ui.kicker}</p>
          <h2 id="thuong-hieu-title" className={styles.parentTitle}>
            {ui.titleStart} {ui.titleEnd}
          </h2>
        </div>
        <ul className={styles.family} aria-label={ui.tablist}>
          {family.map((brand) => (
            <li key={brand.id} className={styles.member} data-brand={brand.id} style={{ "--optical": brand.logo.optical, "--lift": brand.logo.lift } as CSSProperties}>
              {/* The mark, centred in the band the three share. */}
              <span className={styles.memberBand}>
                {/* eslint-disable-next-line @next/next/no-img-element -- official logo file, unaltered */}
                <img className={styles.memberMark} src={brand.logo.src} width={brand.logo.width} height={brand.logo.height} alt={brand.logo.alt} loading="lazy" decoding="async" />
              </span>
              <span className={styles.memberName}>{brand.logo.caption}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
