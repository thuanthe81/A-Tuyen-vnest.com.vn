import { buildMetadata } from "@/seo/metadata";
import { AMENITIES, COPY, PROPERTY, SHOTS_A } from "../content";
import { PreviewFrame } from "../PreviewFrame";
import styles from "./a.module.css";
import { CtaDock } from "./CtaDock";
import { displayA } from "./font";
import { Spread } from "./Spread";

/**
 * CONCEPT A, "Architectural Editorial". A design exploration, not the property page.
 *
 * The page reads like a spread from an architecture monograph: the name is set first and
 * large, and the pictures are plates of different proportions placed off-grid against it.
 * There is no carousel. A numbered plate index is the gallery's control.
 */
export const metadata = buildMetadata({ title: "Khảo sát thư viện ảnh: Concept A", path: () => "/dev/property-gallery/a", noindex: true });

export default function ConceptA() {
  return (
    <PreviewFrame concept="a" surface="#f3f1ea">
      <div className={`${styles.root} ${displayA.variable}`}>
        <main>
          <Spread property={PROPERTY} shots={SHOTS_A} />

          {/* The way into amenities: the plate numbering carries on as a drawing's legend. A sketch of the transition, not the amenities section. */}
          <section className={styles.legend} aria-labelledby="a-amenities">
            <div className={styles.legendHead}>
              <p className={styles.sectionNo} aria-hidden="true">
                02
              </p>
              <h2 id="a-amenities" className={styles.legendTitle}>
                {COPY.amenities}
              </h2>
              <p className={styles.stubNote}>Phần kế tiếp. Chỉ phác cách chuyển tiếp, chưa phải thiết kế tiện nghi.</p>
            </div>
            <ol className={styles.legendList}>
              {AMENITIES.map((label, index) => (
                <li key={label}>
                  <span className={styles.key} aria-hidden="true">
                    {index + 1}
                  </span>
                  {label}
                </li>
              ))}
            </ol>
          </section>
        </main>
        <CtaDock name={PROPERTY.name} />
      </div>
    </PreviewFrame>
  );
}
