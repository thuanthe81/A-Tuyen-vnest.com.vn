"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { buildHeroStrip, MAX_HERO_STRIP, MOSAIC, type HeroStripSlide } from "./hero-strip";
import { Lightbox, type LightboxHandle, type PhotoGroup } from "./Lightbox";
import styles from "./PropertyDetail.module.css";

export { buildHeroStrip, MAX_HERO_STRIP, MOSAIC, type HeroStripSlide };

/**
 * The photographs at the top of the page. Room photographs come first (interleaved so the opening
 * tiles show every room), and optional property-level groups (`extraGroups`: Exterior, Common Space,
 * Office) appear as separate labeled groups inside the full Lightbox gallery modal.
 *
 * - Rooms are interleaved (each room's representative first), so the opening tiles show every room.
 * - Phones: one row that swipes sideways (native scroll snapping), with a counter.
 * - Wider screens: a mosaic of the first five, one large.
 * - Every tile opens that photograph in the viewer; "Xem tất cả ảnh" opens the grid grouped by room
 *   and property-level space.
 */
export function PropertyGallery({
  title,
  groups,
  extraGroups = [],
  action,
}: {
  title: string;
  groups: readonly PhotoGroup[];
  extraGroups?: readonly PhotoGroup[];
  action?: ReactNode;
}) {
  const lightbox = useRef<LightboxHandle>(null);
  const strip = useRef<HTMLUListElement>(null);
  const [shown, setShown] = useState(0);
  const allGroups = [...groups, ...extraGroups];
  const grouped = allGroups.flatMap((group) => group.photos);
  const stripSlides = buildHeroStrip(groups, extraGroups, MAX_HERO_STRIP);
  // Shared room photographs (e.g. Bare Hyphen One & Three referencing the same physical image assets)
  // do not inflate the unique property gallery image count.
  const totalCount = new Set(grouped.map((p) => p.src ?? p.id)).size;

  // The phone counter follows the slide in view.
  useEffect(() => {
    const list = strip.current;
    if (!list) return;
    const onScroll = () => setShown(Math.round(list.scrollLeft / Math.max(1, list.clientWidth)));
    list.addEventListener("scroll", onScroll, { passive: true });
    return () => list.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={styles.gallery}>
      <ul
        ref={strip}
        className={styles.mosaic}
        data-mosaic-count={Math.min(stripSlides.length, MOSAIC)}
        aria-label={`${title}: ${totalCount} ảnh`}
      >
        {stripSlides.map(({ photo, roomLabel }, i) => (
          <li key={photo.id} data-beyond-mosaic={i >= MOSAIC || undefined}>
            <button type="button" className={styles.tile} onClick={() => lightbox.current?.open(grouped.indexOf(photo))} aria-label={`Xem ảnh ${i + 1}/${totalCount}: ${photo.alt}`}>
              {photo.src ? (
                <Image
                  src={photo.src}
                  alt=""
                  width={photo.width}
                  height={photo.height}
                  sizes={i === 0 ? "(min-width: 80rem) 640px, (min-width: 48rem) 50vw, 100vw" : "(min-width: 80rem) 320px, (min-width: 48rem) 25vw, 100vw"}
                  priority={i === 0}
                  decoding="async"
                  {...(i === 0 ? {} : { loading: "lazy" as const })}
                />
              ) : (
                <span className={styles.thumbPlaceholder}>Ảnh giữ chỗ (bản phát triển)</span>
              )}
              {roomLabel ? (
                <span className={styles.tileLabel} aria-hidden="true">
                  {roomLabel}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
      <p className={styles.counter} aria-hidden="true">
        {shown + 1}/{stripSlides.length}
      </p>
      <button type="button" className={styles.allPhotos} onClick={() => lightbox.current?.open("grid")}>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M3.5 3.5h5v5h-5zM11.5 3.5h5v5h-5zM3.5 11.5h5v5h-5zM11.5 11.5h5v5h-5z" />
        </svg>
        Xem tất cả {totalCount} ảnh
      </button>
      <Lightbox ref={lightbox} title={title} groups={allGroups} grid action={action} />
    </div>
  );
}
