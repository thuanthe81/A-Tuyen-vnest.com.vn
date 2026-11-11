import Link from "next/link";
import { readClientProperties } from "@/content/vnest-workbook/records";
import { readPhotoManifest } from "@/content/vnest-workbook/photo-manifest";
import { readSelectionManifest } from "@/content/vnest-workbook/selection-photos";
import {
  DEMO_BARE_CHIC,
  DEMO_BARE_DA_KAO,
  DEMO_BARE_HAN,
  DEMO_BARE_HYPHEN,
  DEMO_LINKS,
  DEMO_PEPPER_HOUSE,
  DEMO_THE_NANG_SUITES,
} from "@/features/demo/links";
import { relatedCardMedia } from "./related-media";
import styles from "./RelatedProperties.module.css";

const BRAND_LABELS: Readonly<Record<string, string>> = {
  bare: "Bare Boutique Stays",
  "the-nang": "The Nắng Suites",
  "pepper-house": "Pepper House",
};

const CITY_LABELS: Readonly<Record<string, string>> = {
  "ho-chi-minh": "TP. Hồ Chí Minh",
  "da-nang": "Đà Nẵng",
};

const IMPLEMENTED_DETAIL_ROUTES: Readonly<Record<string, string>> = {
  "bare-chic": DEMO_BARE_CHIC,
  "bare-hyphen": DEMO_BARE_HYPHEN,
  "bare-da-kao": DEMO_BARE_DA_KAO,
  "bare-han": DEMO_BARE_HAN,
  "the-nang-suites": DEMO_THE_NANG_SUITES,
  "pepper-house": DEMO_PEPPER_HOUSE,
};

/**
 * PRIORITY 6 — Related Properties Section Before Footer.
 *
 * Introduces OTHER verified VNest properties (excluding the currently viewed property).
 * Uses verified property data, one approved image per card, official property name,
 * verified address/city, truthful pricing status ("Xem giá theo ngày" until published rates
 * are explicitly confirmed by VNest), and prominent navigation CTA.
 */
export function RelatedProperties({ currentPropertyId }: { currentPropertyId: string }) {
  const allRecords = readClientProperties();
  const others = allRecords.filter((record) => record.id !== currentPropertyId);
  const selection = readSelectionManifest();
  const photos = readPhotoManifest();

  if (others.length === 0) return null;

  return (
    <section
      aria-labelledby="related-properties-title"
      className={styles.section}
      data-testid="related-properties-section"
    >
      <div className={styles.header}>
        <div className={styles.headerTitles}>
          <p className={styles.kicker}>Hệ sinh thái lưu trú VNest</p>
          <h2 id="related-properties-title" className={styles.title}>
            Khám phá thêm những nơi ở khác
          </h2>
        </div>

        <Link href={DEMO_LINKS.discover} className={styles.allStaysLink}>
          <span>Xem tất cả nơi ở</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <ul className={styles.grid} aria-label="Các nơi ở khác thuộc VNest">
        {others.map((record) => {
          const id = record.id;
          const name = record.name.display ?? id;
          const brandId = record.brand.display ?? "bare";
          const cityId = record.city.display ?? "ho-chi-minh";
          const brandLabel = BRAND_LABELS[brandId] ?? brandId;
          const cityLabel = CITY_LABELS[cityId] ?? cityId;
          const street = record.location.street.display;
          const ward = record.location.ward.display;
          const addressDisplay = [street, ward].filter(Boolean).join(", ") || cityLabel;
          // A photograph only when it is on this machine (related-media.ts); otherwise the plain media box.
          const media = relatedCardMedia(id, selection, photos);
          const detailRoute = IMPLEMENTED_DETAIL_ROUTES[id];
          const href = detailRoute ?? `/dev/demo/tim-phong?property=${encodeURIComponent(id)}`;
          const ctaLabel = detailRoute ? "Khám phá nơi ở" : "Xem phòng";

          return (
            <li key={id} className={styles.card} data-property-id={id}>
              <div className={styles.mediaWrap}>
                {media ? (
                  <picture>
                    <source
                      type="image/avif"
                      srcSet={`/dev-client-media/${media.folderKey}/480.avif 480w, /dev-client-media/${media.folderKey}/800.avif 800w, /dev-client-media/${media.folderKey}/1200.avif 1200w`}
                      sizes="(min-width: 68rem) 25rem, (min-width: 44rem) 46vw, 94vw"
                    />
                    <source
                      type="image/webp"
                      srcSet={`/dev-client-media/${media.folderKey}/480.webp 480w, /dev-client-media/${media.folderKey}/800.webp 800w, /dev-client-media/${media.folderKey}/1200.webp 1200w`}
                      sizes="(min-width: 68rem) 25rem, (min-width: 44rem) 46vw, 94vw"
                    />
                    <img
                      src={`/dev-client-media/${media.folderKey}/800.jpg`}
                      alt={media.alt}
                      width={800}
                      height={533}
                      loading="lazy"
                      decoding="async"
                      style={media.objectPosition ? { objectPosition: media.objectPosition } : undefined}
                    />
                  </picture>
                ) : null}
                <span className={styles.cityBadge}>{cityLabel}</span>
              </div>

              <div className={styles.body}>
                <div className={styles.infoTop}>
                  <p className={styles.brandLabel}>{brandLabel}</p>
                  <h3 className={styles.propertyName}>{name}</h3>
                  <p className={styles.addressLine}>{addressDisplay}</p>
                </div>

                <div className={styles.footerRow}>
                  <span className={styles.rateNote}>Xem giá theo ngày</span>
                  <Link href={href} className={styles.cardCta}>
                    <span>{ctaLabel}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
