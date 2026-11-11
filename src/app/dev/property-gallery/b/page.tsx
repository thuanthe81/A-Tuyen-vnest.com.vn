import { buildMetadata } from "@/seo/metadata";
import { AMENITY_PREVIEW, COPY, HERO_BPLUS, NEARBY_PREVIEW, PROPERTY, SHOTS_BPLUS, STORIES_BPLUS } from "../content";
import { PreviewFrame } from "../PreviewFrame";
import { Arrival } from "./Arrival";
import styles from "./b.module.css";
import { CtaPill } from "./CtaPill";
import { displayBPlus } from "./font";
import { Pictogram } from "./icons";

/**
 * B+, "Cinematic Arrival, Editorial Discovery". A design exploration, not the property page.
 * Refined from Concept B after the review of 11/10/2026; the first version is kept at
 * /dev/property-gallery/b-original.
 *
 * One picture fills the first screen and the identity sits on the page's own paper, cut into
 * the picture's corner. Below it, four pictures each show a different side of the property,
 * and the page hands over to amenities and nearby in two rows of pictograms. Nothing has to
 * be swiped to understand the property, and the complete gallery is one press away.
 */
export const metadata = buildMetadata({ title: "Khảo sát thư viện ảnh: B+", path: () => "/dev/property-gallery/b", noindex: true });

const SURFACE = "#f3f1ea";

export default function ConceptBPlus() {
  return (
    <PreviewFrame concept="b" surface={SURFACE}>
      <div className={`${styles.root} ${displayBPlus.variable}`}>
        <main>
          <Arrival property={PROPERTY} hero={HERO_BPLUS} stories={STORIES_BPLUS} shots={SHOTS_BPLUS} />

          {/* The way into amenities and nearby. A sketch of the transition only: neither section is designed here. */}
          <section className={styles.next} aria-label={`${COPY.amenities}, ${COPY.nearby}`}>
            <div className={styles.row}>
              <h2 className={styles.rowTitle}>{COPY.amenities}</h2>
              <ul className={`${styles.marks} ${styles.six}`}>
                {AMENITY_PREVIEW.map((item) => (
                  <li key={item.label}>
                    <Pictogram name={item.icon} />
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.row}>
              <h2 className={styles.rowTitle}>{COPY.nearby}</h2>
              <ul className={`${styles.marks} ${styles.four}`}>
                {NEARBY_PREVIEW.map((item) => (
                  <li key={item.label}>
                    <Pictogram name={item.icon} />
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
            <p className={styles.stubNote}>Phác thảo chuyển tiếp. Hai mục Tiện nghi và Quanh đây chưa được thiết kế trong bản khảo sát này.</p>
          </section>
        </main>
        <CtaPill />
      </div>
    </PreviewFrame>
  );
}
