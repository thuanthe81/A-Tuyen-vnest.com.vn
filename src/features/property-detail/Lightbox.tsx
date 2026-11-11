"use client";

import Image from "next/image";
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type ReactNode, type Ref } from "react";
import styles from "./PropertyDetail.module.css";

/** One photograph as the page may show it. `src` is absent for a labelled placeholder. */
export type Photo = {
  id: string;
  src?: string;
  width: number;
  height: number;
  alt: string;
  room: string;
  /** Optional source folder provenance preserved for auditability. */
  sourceProvenance?: string;
};
/** Photographs of one room or property-level space, under that group's name. */
export type PhotoGroup = {
  room: string;
  photos: readonly Photo[];
  /** Optional descriptive notice (e.g., when VNest approves shared representative layout photography). */
  notice?: string;
  sourceProvenance?: string;
};
/** `"grid"`: every photograph, grouped by room. A number: that photograph, in group order. */
export type LightboxTarget = "grid" | number;
export type LightboxHandle = { open: (target: LightboxTarget) => void };

/**
 * Incremental rendering thresholds for large galleries (Priority 3):
 * When a property gallery has > 24 total photographs (e.g. Bare Đa Kao's 108 photographs),
 * each room group initially mounts 9 thumbnails (3 rows on 3-column desktop) and reveals
 * additional batches of 12 on scroll or button click, while keeping all photographs and counts intact.
 */
const INCREMENTAL_GALLERY_THRESHOLD = 24;
const INITIAL_GROUP_BATCH = 9;
const GROUP_BATCH_STEP = 12;

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const BACK = "M12.5 4.5 7 10l5.5 5.5";
const NEXT = "M7.5 4.5 13 10l-5.5 5.5";
const CLOSE = "m5 5 10 10M15 5 5 15";
const GRID = "M3.5 3.5h5v5h-5zM11.5 3.5h5v5h-5zM3.5 11.5h5v5h-5zM11.5 11.5h5v5h-5z";

/**
 * The photographs viewer: a native modal dialog, so focus stays inside, Escape closes it and
 * assistive technology treats the page behind as inert. Two views:
 * - the grid (only when `grid` is set): every photograph, grouped under its room's name;
 * - one photograph, fitted whole, with its room and its place among that room's photographs. Arrow
 *   keys, two buttons and a horizontal swipe move through every photograph, room after room.
 * Focus returns to whatever opened it. The page behind does not scroll while it is open.
 *
 * `action` (VNest V3 Stage 1, 24/10/2026, CEO R03): the page's next step (BOOK NOW in the demo),
 * in the bottom bar beside the arrows, in both views: never over the photograph or its controls.
 * Without it the viewer is unchanged.
 */
export function Lightbox({ ref, title, groups, grid = false, action }: { ref: Ref<LightboxHandle>; title: string; groups: readonly PhotoGroup[]; grid?: boolean; action?: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const sentinels = useRef< Map<string, HTMLButtonElement | null> >(new Map());
  const swipeFrom = useRef<{ x: number; y: number } | null>(null);
  const lastSwipeAt = useRef(0);
  const [view, setView] = useState<LightboxTarget | null>(null);
  const [visibleByGroup, setVisibleByGroup] = useState<Readonly<Record<string, number>>>({});
  const photos = groups.flatMap((group) => group.photos);
  const count = photos.length;
  // Deduplicate shared physical image assets across room galleries when displaying the property-wide total.
  const uniqueCount = new Set(photos.map((p) => p.src ?? p.id)).size;
  const useIncrementalGrid = count > INCREMENTAL_GALLERY_THRESHOLD;

  const ensurePhotoVisibleInGrid = useCallback(
    (photoIndex: number) => {
      if (!useIncrementalGrid) return;
      const targetPhoto = photos[photoIndex];
      if (!targetPhoto) return;
      const group = groups.find((g) => g.photos.includes(targetPhoto));
      if (!group) return;
      const indexInGroup = group.photos.indexOf(targetPhoto);
      const needed = Math.max(INITIAL_GROUP_BATCH, Math.ceil((indexInGroup + 1) / 3) * 3);
      setVisibleByGroup((prev) => {
        const currentLimit = prev[group.room] ?? INITIAL_GROUP_BATCH;
        if (currentLimit >= needed) return prev;
        return { ...prev, [group.room]: Math.min(group.photos.length, needed) };
      });
    },
    [groups, photos, useIncrementalGrid],
  );

  const syncScrollLock = () => {
    document.documentElement.style.overflow = document.querySelector("dialog[open]") ? "hidden" : "";
  };

  useImperativeHandle(ref, () => ({
    open(target) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (typeof target === "number") {
        ensurePhotoVisibleInGrid(target);
      }
      setView(target === "grid" && !grid ? 0 : target);
      dialog.current?.showModal();
      syncScrollLock();
    },
  }));

  const step = useCallback((by: number) => setView((v) => (typeof v === "number" && count > 1 ? (v + by + count) % count : v)), [count]);

  // Moving between the two views keeps focus where the visitor is: on the "all photos" button
  // after choosing a photograph, on that photograph's thumbnail after going back to the grid.
  const showPhoto = (index: number) => {
    setView(index);
    requestAnimationFrame(() => backButton.current?.focus());
  };
  const showGrid = () => {
    const from = view;
    if (typeof from === "number") {
      ensurePhotoVisibleInGrid(from);
    }
    setView("grid");
    requestAnimationFrame(() => (typeof from === "number" ? thumbs.current[from] : null)?.focus());
  };

  const expandGroup = useCallback((room: string, totalInGroup: number) => {
    setVisibleByGroup((prev) => {
      const currentLimit = prev[room] ?? INITIAL_GROUP_BATCH;
      if (currentLimit >= totalInGroup) return prev;
      return { ...prev, [room]: Math.min(totalInGroup, currentLimit + GROUP_BATCH_STEP) };
    });
  }, []);

  // Automatically expand incremental groups as the visitor scrolls through the Lightbox grid.
  useEffect(() => {
    if (view !== "grid" || !useIncrementalGrid) return;
    const rootEl = gridContainerRef.current;
    if (!rootEl || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const room = (entry.target as HTMLElement).dataset.expandRoom;
          if (!room) continue;
          const group = groups.find((g) => g.room === room);
          if (group) {
            expandGroup(room, group.photos.length);
          }
        }
      },
      { root: rootEl, rootMargin: "320px 0px" },
    );

    for (const node of sentinels.current.values()) {
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, [view, useIncrementalGrid, groups, visibleByGroup, expandGroup]);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const onClose = () => {
      syncScrollLock();
      setView(null);
      if (!document.querySelector("dialog[open]")) opener.current?.focus();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    node.addEventListener("close", onClose);
    node.addEventListener("keydown", onKey);
    return () => {
      node.removeEventListener("close", onClose);
      node.removeEventListener("keydown", onKey);
      if (node.open) node.close();
      syncScrollLock();
    };
  }, [step]);

  const commitSwipe = (dx: number, dy: number) => {
    if (count <= 1) return;
    const now = Date.now();
    if (now - lastSwipeAt.current < 80) return;
    if (Math.abs(dx) >= 36 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      lastSwipeAt.current = now;
      step(dx < 0 ? 1 : -1);
    }
  };

  const closeViewer = () => {
    dialog.current?.close();
    syncScrollLock();
  };

  const current = typeof view === "number" ? photos[view] : undefined;
  // The caption counts within the photograph's own room ("Bare Chic Two 3/6"): the set is grouped.
  const group = current ? groups.find((g) => g.photos.includes(current)) : undefined;
  const place = current && group ? `${group.photos.indexOf(current) + 1}/${group.photos.length}` : "";

  return (
    <dialog
      ref={dialog}
      className={styles.viewer}
      aria-label={title}
      onClick={(event) => {
        if (event.target === dialog.current) closeViewer();
      }}
    >
      {view === null ? null : (
        <div className={styles.viewerInner}>
          <div className={styles.viewerBar}>
            {current ? (
              <p className={styles.viewerCaption} aria-live="polite">
                {current.room}
                <span className={styles.viewerCount}>{place}</span>
              </p>
            ) : (
              <p className={styles.viewerCaption}>
                {title}
                <span className={styles.viewerCount}>{uniqueCount} ảnh</span>
              </p>
            )}
            <div className={styles.viewerTools}>
              {grid && current ? (
                <button type="button" ref={backButton} className={styles.textButton} onClick={showGrid}>
                  <Icon d={GRID} />
                  Tất cả ảnh
                </button>
              ) : null}
              <button type="button" className={styles.textButton} onClick={closeViewer} aria-label="Đóng">
                <Icon d={CLOSE} />
                <span>Đóng</span>
              </button>
            </div>
          </div>

          {current ? (
            <figure
              className={styles.viewerFigure}
              onTouchStart={(event) => {
                const touch = event.touches[0];
                if (touch) swipeFrom.current = { x: touch.clientX, y: touch.clientY };
              }}
              onTouchEnd={(event) => {
                const from = swipeFrom.current;
                swipeFrom.current = null;
                const touch = event.changedTouches[0];
                if (!from || !touch) return;
                commitSwipe(touch.clientX - from.x, touch.clientY - from.y);
              }}
              onPointerDown={(event) => {
                swipeFrom.current = { x: event.clientX, y: event.clientY };
              }}
              onPointerUp={(event) => {
                const from = swipeFrom.current;
                swipeFrom.current = null;
                if (!from) return;
                commitSwipe(event.clientX - from.x, event.clientY - from.y);
              }}
            >
              {current.src ? (
                <Image
                  key={current.id}
                  src={current.src}
                  alt={current.alt}
                  width={current.width}
                  height={current.height}
                  sizes="100vw"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <div className={styles.thumbPlaceholder}>{current.alt}</div>
              )}
            </figure>
          ) : (
            <div ref={gridContainerRef} className={styles.viewerGrid}>
              <div className={styles.viewerGridInner}>
                {groups.map((group) => {
                  const offset = photos.indexOf(group.photos[0]!);
                  const limit = useIncrementalGrid ? (visibleByGroup[group.room] ?? INITIAL_GROUP_BATCH) : group.photos.length;
                  const visiblePhotos = group.photos.slice(0, limit);
                  const remaining = group.photos.length - visiblePhotos.length;

                  return (
                    <section
                      key={group.room}
                      aria-label={`${group.room}, ${group.photos.length} ảnh`}
                      className={styles.viewerGroup}
                      data-photo-count={group.photos.length <= 2 ? "compact" : "full"}
                      data-group-total={group.photos.length}
                      data-group-rendered={visiblePhotos.length}
                    >
                      <div className={styles.viewerGroupHeader}>
                        <div className={styles.viewerGroupTitleWrap}>
                          <h3 className={styles.viewerGroupTitle}>{group.room}</h3>
                          {group.notice ? <p className={styles.viewerGroupNotice}>{group.notice}</p> : null}
                        </div>
                        <span className={styles.viewerGroupBadge}>{group.photos.length} ảnh</span>
                      </div>
                      <ul>
                        {visiblePhotos.map((photo, i) => (
                          <li key={photo.id}>
                            <button
                              type="button"
                              ref={(node) => {
                                thumbs.current[offset + i] = node;
                              }}
                              onClick={() => showPhoto(offset + i)}
                              aria-label={`Xem ảnh ${i + 1}/${group.photos.length}: ${photo.alt}`}
                            >
                              {photo.src ? (
                                <Image
                                  src={photo.src}
                                  alt=""
                                  width={photo.width}
                                  height={photo.height}
                                  sizes="(min-width: 64rem) 420px, (min-width: 48rem) 46vw, 92vw"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <span className={styles.thumbPlaceholder}>{photo.room}</span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                      {remaining > 0 ? (
                        <button
                          type="button"
                          ref={(node) => {
                            sentinels.current.set(group.room, node);
                          }}
                          data-expand-room={group.room}
                          className={styles.viewerMoreButton}
                          onClick={() => expandGroup(group.room, group.photos.length)}
                        >
                          Xem thêm {remaining} ảnh · {group.room} ({visiblePhotos.length}/{group.photos.length})
                        </button>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            </div>
          )}

          {action ? (
            <div className={`${styles.viewerNav} ${styles.viewerNavAction}`}>
              <span aria-hidden="true" />
              <div className={styles.viewerArrows}>
                {current && count > 1 ? (
                  <>
                    <button type="button" className={styles.iconButton} onClick={() => step(-1)} aria-label="Ảnh trước">
                      <Icon d={BACK} />
                    </button>
                    <button type="button" className={styles.iconButton} onClick={() => step(1)} aria-label="Ảnh sau">
                      <Icon d={NEXT} />
                    </button>
                  </>
                ) : null}
              </div>
              <div className={styles.viewerAction}>{action}</div>
            </div>
          ) : current && count > 1 ? (
            <div className={styles.viewerNav}>
              <button type="button" className={styles.iconButton} onClick={() => step(-1)} aria-label="Ảnh trước">
                <Icon d={BACK} />
              </button>
              <button type="button" className={styles.iconButton} onClick={() => step(1)} aria-label="Ảnh sau">
                <Icon d={NEXT} />
              </button>
            </div>
          ) : null}
        </div>
      )}
    </dialog>
  );
}
