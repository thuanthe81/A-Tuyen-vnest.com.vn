"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode, type TouchEvent } from "react";
import { Lightbox, type LightboxHandle, type Photo } from "./Lightbox";
import styles from "./RoomCardCarousel.module.css";

export type RoomMetaSpecInput = {
  kind?: "type" | "size" | "capacity";
  label: string;
  value: string;
};

function inferKind(spec: RoomMetaSpecInput): "type" | "size" | "capacity" {
  if (spec.kind) return spec.kind;
  if (/diện tích/i.test(spec.label)) return "size";
  if (/sức chứa|khách|người/i.test(spec.label)) return "capacity";
  return "type";
}

function MetaIcon({ kind }: { kind: "type" | "size" | "capacity" }) {
  if (kind === "type") {
    // Bed icon
    return (
      <svg className={styles.metaIcon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2.5 14.5v-8M17.5 14.5v-4.5a2 2 0 0 0-2-2H2.5M2.5 11.5h15M5.5 8h3.5a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H5.5a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1Z" />
      </svg>
    );
  }
  if (kind === "size") {
    // Area / dimensions icon
    return (
      <svg className={styles.metaIcon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="14" height="14" rx="1.5" />
        <path d="M6.5 9.5 9.5 6.5M6.5 6.5h3v3M13.5 10.5l-3 3M13.5 13.5h-3v-3" />
      </svg>
    );
  }
  // Guests icon
  return (
    <svg className={styles.metaIcon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7.5" cy="6.5" r="2.5" />
      <path d="M3 15.5c0-2.2 2-4 4.5-4s4.5 1.8 4.5 4" />
      <circle cx="13.5" cy="7" r="2" />
      <path d="M14 11.8c1.8.3 3 1.7 3 3.7" />
    </svg>
  );
}

/**
 * Compact icon-based verified room metadata:
 * [Bed icon] Studio · [Area icon] 28 m² · [Guests icon] 2 người lớn
 * Displays strictly source-supported values; omits missing or unconfirmed fields.
 */
export function RoomCompactMeta({
  specs,
  className,
}: {
  specs: readonly RoomMetaSpecInput[];
  className?: string;
}) {
  if (specs.length === 0) return null;
  return (
    <ul className={`${styles.metaList} ${className ?? ""}`} aria-label="Thông số phòng đã xác minh">
      {specs.map((spec) => {
        const kind = inferKind(spec);
        // Shown as written: "2 người lớn" means adults, so it is not shortened to "khách" (25/10/2026).
        const formatted = spec.value;
        return (
          <li key={`${spec.label}-${spec.value}`} className={styles.metaItem} data-meta-kind={kind}>
            <MetaIcon kind={kind} />
            <span className="sr-only">{spec.label}: </span>
            <span>{formatted}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Maximum primary curated photographs shown in the inline room-card carousel & dots bar. */
const MAX_INLINE_CAROUSEL_PHOTOS = 6;

/**
 * Inline Room Photography Carousel for both Booking Results and Property Detail room cards.
 * - Keeps inline card carousels visually curated (up to 6 primary curated photographs with
 *   restrained pagination dots), while making the complete eligible room photo collection
 *   accessible through the full-screen Lightbox viewer & grid.
 * - Shows the first approved room photograph without loading all gallery images eagerly.
 * - Provides subtle previous/next controls over the image.
 * - Supports mobile touch swipe gestures (`onTouchStart` / `onTouchEnd`).
 * - Preserves aspect ratio with zero layout shift when changing photos.
 * - Clicking the image opens the full-screen Lightbox at the active photo.
 */
export function RoomCardCarousel({
  roomName,
  photos,
  sizes = "(min-width: 64rem) 560px, (min-width: 48rem) 50vw, 100vw",
  action,
  className,
}: {
  roomName: string;
  photos: readonly Photo[];
  sizes?: string;
  action?: ReactNode;
  className?: string;
}) {
  const lightboxRef = useRef<LightboxHandle>(null);
  const [index, setIndex] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastSwipeAtRef = useRef(0);

  const validPhotos = photos.filter((p) => Boolean(p.src));
  const totalAll = validPhotos.length;
  const carouselPhotos = validPhotos.slice(0, MAX_INLINE_CAROUSEL_PHOTOS);
  const total = carouselPhotos.length;
  const safeIndex = total > 0 ? ((index % total) + total) % total : 0;
  const activePhoto = carouselPhotos[safeIndex];

  if (!activePhoto || !activePhoto.src) {
    return (
      <div
        className={`${styles.carousel} ${styles.placeholder} ${className ?? ""}`}
        role="img"
        aria-label={`Chưa có ảnh: ${roomName}`}
      >
        {roomName}
      </div>
    );
  }

  const goPrev = () => {
    if (total <= 1) return;
    setIndex((prev) => (prev - 1 + total) % total);
  };

  const goNext = () => {
    if (total <= 1) return;
    setIndex((prev) => (prev + 1) % total);
  };

  const commitSwipe = (dx: number, dy: number) => {
    if (total <= 1) return;
    const now = Date.now();
    if (now - lastSwipeAtRef.current < 80) return;
    if (Math.abs(dx) >= 32 && Math.abs(dx) > Math.abs(dy)) {
      lastSwipeAtRef.current = now;
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (total <= 1) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || total <= 1) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    commitSwipe(touch.clientX - start.x, touch.clientY - start.y);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;
    touchStartRef.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || total <= 1) return;
    commitSwipe(event.clientX - start.x, event.clientY - start.y);
  };

  return (
    <div
      className={`${styles.carousel} ${className ?? ""}`}
      data-room-carousel={roomName}
      data-photo-index={safeIndex}
      data-photo-total={total}
      data-room-gallery-total={totalAll}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <button
        type="button"
        className={styles.imageTrigger}
        onClick={() => {
          if (Date.now() - lastSwipeAtRef.current < 350) return;
          lightboxRef.current?.open(safeIndex);
        }}
        aria-label={`Mở thư viện ảnh phòng ${roomName} (ảnh ${safeIndex + 1}/${totalAll})`}
      >
        <Image
          key={activePhoto.id}
          src={activePhoto.src}
          alt={activePhoto.alt}
          width={activePhoto.width}
          height={activePhoto.height}
          sizes={sizes}
          loading="lazy"
          className={styles.image}
        />
      </button>

      {totalAll > total ? (
        <button
          type="button"
          className={styles.galleryCountBadge}
          onClick={(e) => {
            e.stopPropagation();
            lightboxRef.current?.open("grid");
          }}
          aria-label={`Xem tất cả ${totalAll} ảnh của ${roomName}`}
        >
          {totalAll} ảnh
        </button>
      ) : null}

      {total > 1 ? (
        <>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navPrev}`}
            data-testid="carousel-prev"
            aria-label={`Ảnh trước · ${roomName}`}
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12.5 4.5 7 10l5.5 5.5" />
            </svg>
          </button>

          <button
            type="button"
            className={`${styles.navBtn} ${styles.navNext}`}
            data-testid="carousel-next"
            aria-label={`Ảnh sau · ${roomName}`}
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7.5 4.5 13 10l-5.5 5.5" />
            </svg>
          </button>

          <div className={styles.dotsBar} role="group" aria-label={`Chọn ảnh phòng ${roomName}`}>
            {carouselPhotos.map((photo, idx) => (
              <button
                key={photo.id}
                type="button"
                className={styles.dotBtn}
                aria-current={idx === safeIndex}
                aria-label={`Ảnh ${idx + 1} / ${total} · ${roomName}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(idx);
                }}
              >
                <span className={styles.dot} />
              </button>
            ))}
          </div>
        </>
      ) : null}

      <Lightbox
        ref={lightboxRef}
        title={`Ảnh ${roomName}`}
        groups={[{ room: roomName, photos: validPhotos }]}
        grid={totalAll > total}
        action={action}
      />
    </div>
  );
}
