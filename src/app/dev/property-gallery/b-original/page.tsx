import { buildMetadata } from "@/seo/metadata";
import { AMENITIES, COPY, PROPERTY, SHOTS_B } from "../content";
import { PreviewFrame } from "../PreviewFrame";
import styles from "./b.module.css";
import { displayB } from "./font";
import { Reel } from "./Reel";

/**
 * CONCEPT B AS FIRST PRESENTED (11/10/2026), kept unchanged so the refinement at
 * /dev/property-gallery/b can be compared with it and measured against it. Not being developed.
 *
 * The first screen is one picture, edge to edge, with the name standing still over it. The
 * pictures move sideways underneath as one reel that starts inside the building and ends in
 * the neighbourhood. The booking action never leaves the bottom of the screen until the rooms.
 */
export const metadata = buildMetadata({ title: "Khảo sát thư viện ảnh: Concept B (bản gốc)", path: () => "/dev/property-gallery/b-original", noindex: true });

export default function ConceptB() {
  return (
    <PreviewFrame concept="b-original">
      <div className={`${styles.root} ${displayB.variable}`}>
        <main>
          <Reel property={PROPERTY} shots={SHOTS_B} />

          {/* The way into amenities: the night surface of the reel carries on, and the list is set as large type. A sketch of the transition, not the amenities section. */}
          <section className={styles.after} aria-labelledby="b-amenities">
            <p className={styles.stubNote}>Phần kế tiếp. Chỉ phác cách chuyển tiếp, chưa phải thiết kế tiện nghi.</p>
            <h2 id="b-amenities" className={styles.afterTitle}>
              {COPY.amenities}
            </h2>
            <ul className={styles.words}>
              {AMENITIES.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </section>
        </main>

        {/* One sticky element, pure CSS: it holds the bottom edge for as long as this block is on screen, and leaves with it when the rooms arrive. */}
        <div className={styles.dock}>
          <a href="#rooms" className={styles.cta}>
            {COPY.cta}
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 3v12m0 0 5-5m-5 5-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </PreviewFrame>
  );
}
