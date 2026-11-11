import { resolveLocalized, type Locale, type LocalizedText } from "@/domain/locale";
import { OWNER_FAQ, OWNER_JOURNEY_UI } from "./owner-journey";
import styles from "./OwnerJourney.module.css";

/**
 * `#hoi-dap`: the client's owner/B2B questions (owner-journey.ts, 05.11 Final) as one-open-at-a-time native disclosures
 * (`<details name>`: opening one closes the other; each summary exposes its expanded state and controls its answer
 * natively, and works with Enter and Space). All closed on arrival (owner, 10/11/2026). The homepage shows all six; the
 * partner page a few of them (`items`), with its own heading.
 */
export function OwnerFaq({
  locale,
  items = OWNER_FAQ,
  kicker = OWNER_JOURNEY_UI.faqKicker,
  title = OWNER_JOURNEY_UI.faqTitle,
}: {
  locale: Locale;
  items?: readonly { q: LocalizedText; a: LocalizedText }[];
  kicker?: LocalizedText;
  title?: LocalizedText;
}) {
  return (
    <section id="hoi-dap" lang={locale} className={styles.faq} aria-labelledby="hoi-dap-title">
      <div>
        <p className={styles.kicker}>{resolveLocalized(kicker, locale)}</p>
        <h2 id="hoi-dap-title" className={styles.h2}>
          {resolveLocalized(title, locale)}
        </h2>
      </div>
      <div className={styles.faqList}>
        {items.map((item) => (
          <details key={item.q.vi} {...{ name: "vnest-faq" }}>
            <summary>{resolveLocalized(item.q, locale)}</summary>
            <p>{resolveLocalized(item.a, locale)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
