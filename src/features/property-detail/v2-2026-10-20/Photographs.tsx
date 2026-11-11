"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./PropertyDetail.module.css";

/** One photograph as the page may show it. `src` is absent for a labelled placeholder. */
export type Photograph = { id: string; src?: string; width: number; height: number; alt: string; room: string };

const Arrow = ({ back = false }: { back?: boolean }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d={back ? "M12.5 4.5 7 10l5.5 5.5" : "M7.5 4.5 13 10l-5.5 5.5"} />
  </svg>
);

/**
 * The photographs section and its viewer. Every photograph names its room, in its caption and in
 * the viewer. The viewer is a native modal dialog: focus stays inside it, Escape closes it, the
 * arrow keys and two buttons move between photographs, and focus returns to the photograph that
 * opened it. No autoplay, no carousel on the page itself.
 */
export function Photographs({ photos }: { photos: readonly Photograph[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const openers = useRef<(HTMLButtonElement | null)[]>([]);
  const [index, setIndex] = useState<number | null>(null);

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const step = useCallback((by: number) => setIndex((i) => (i === null ? i : (i + by + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const onClose = () =>
      setIndex((i) => {
        if (i !== null) openers.current[i]?.focus();
        return null;
      });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    node.addEventListener("close", onClose);
    node.addEventListener("keydown", onKey);
    return () => {
      node.removeEventListener("close", onClose);
      node.removeEventListener("keydown", onKey);
    };
  }, [step]);

  const current = index === null ? null : photos[index];

  return (
    <>
      <ul className={styles.strip} aria-label="Ảnh các phòng">
        {photos.map((photo, i) => (
          <li key={photo.id}>
            {photo.src ? (
              <button
                type="button"
                className={styles.thumb}
                ref={(node) => {
                  openers.current[i] = node;
                }}
                onClick={() => open(i)}
                aria-label={`Xem lớn: ${photo.alt}`}
              >
                <Image src={photo.src} alt="" width={photo.width} height={photo.height} sizes="(min-width: 80rem) 600px, (min-width: 48rem) 50vw, 78vw" loading="lazy" />
              </button>
            ) : (
              <div className={styles.thumbPlaceholder} role="img" aria-label={photo.alt}>
                Ảnh giữ chỗ (bản phát triển)
                <br />
                {photo.room}
              </div>
            )}
            <p className={styles.caption}>{photo.room}</p>
          </li>
        ))}
      </ul>

      <dialog ref={dialog} className={styles.viewer} aria-label="Ảnh các phòng của Bare Chic">
        {current ? (
          <div className={styles.viewerInner}>
            <div className={styles.viewerBar}>
              <p className={styles.viewerCaption} aria-live="polite">
                {current.room}
                <span className={styles.viewerCount}>
                  {index! + 1}/{photos.length}
                </span>
              </p>
              <button type="button" className={styles.iconButton} onClick={() => dialog.current?.close()} aria-label="Đóng">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="m5 5 10 10M15 5 5 15" />
                </svg>
              </button>
            </div>
            <figure className={styles.viewerFigure}>
              {current.src ? <Image key={current.id} src={current.src} alt={current.alt} width={current.width} height={current.height} sizes="100vw" /> : null}
            </figure>
            <div className={styles.viewerNav}>
              <button type="button" className={styles.iconButton} onClick={() => step(-1)} aria-label="Ảnh trước">
                <Arrow back />
              </button>
              <button type="button" className={styles.iconButton} onClick={() => step(1)} aria-label="Ảnh sau">
                <Arrow />
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
