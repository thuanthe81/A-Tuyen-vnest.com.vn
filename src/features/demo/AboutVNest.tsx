import { resolveLocalized, type Locale } from "@/domain/locale";
import { editorialSerif } from "@/styles/fonts";
import { ABOUT_COPY, ABOUT_ENGLISH_IN_VIETNAMESE } from "./about-copy";
import styles from "./AboutVNest.module.css";
import { SectionLink } from "./SectionLink";

/**
 * ABOUT VNEST V2 — "THE ART OF STAYING" (owner-approved creative direction, 4/11/2026), in Vietnamese and English.
 *
 * A full-width Dark Olive editorial banner: "ABOUT VNEST." on the left, the copper serif display word with its supporting
 * line on the right, one short paragraph and one quiet link to the VNest contact section (client review 6/11/2026). Real HTML text only: no photographs, brand list,
 * counters or decorative symbols. The display word is a language-specific composition ("Ở. / Theo cách riêng." or
 * "Stay. / Your way."), sized per language. Copy (about-copy.ts) is a DRAFT pending VNest's approval. The `#ve-vnest`
 * anchor is kept for the header menu and the footer.
 */
export function AboutVNest({ locale = "vi" }: { locale?: Locale }) {
  const copy = resolveLocalized(ABOUT_COPY, locale);
  // On the Vietnamese page the eyebrow and title are English words; on the English page the whole section is English.
  const englishIn = (key: (typeof ABOUT_ENGLISH_IN_VIETNAMESE)[number]) => (locale === "vi" && ABOUT_ENGLISH_IN_VIETNAMESE.includes(key) ? "en" : undefined);
  return (
    <section
      id="ve-vnest"
      lang={locale}
      data-lang={locale}
      className={`${styles.about} ${editorialSerif.variable}`}
      aria-labelledby="ve-vnest-title"
    >
      <div className={styles.inner}>
        <div className={styles.lead}>
          <p className={styles.eyebrow} lang={englishIn("eyebrow")}>
            {copy.eyebrow}
          </p>
          <h2 id="ve-vnest-title" className={styles.title} lang={englishIn("title")}>
            {copy.title}
          </h2>
        </div>
        <div className={styles.body}>
          <p className={styles.statement}>
            <span className={styles.accent}>{copy.display}</span> <span className={styles.statementRest}>{copy.supporting}</span>
          </p>
          <p className={styles.description}>{copy.description}</p>
          <SectionLink section="lien-he" className={styles.cta}>
            {copy.cta} <span aria-hidden="true">→</span>
          </SectionLink>
        </div>
      </div>
    </section>
  );
}
