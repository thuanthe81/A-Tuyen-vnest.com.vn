"use client";

import { useEffect, useRef, useState } from "react";
import { COPY, pad, type PROPERTY, type Shot } from "../content";
import { Picture } from "../Picture";
import { Viewer } from "../Viewer";
import styles from "./b.module.css";

/**
 * The reel: full-screen frames in one sideways strip, the identity held still above them.
 *
 * Swiping and snapping are the browser's (CSS scroll-snap); the strip is focusable, so the
 * arrow keys scroll it. Script only reports which frame is in view, so the route line, the
 * chapter and the caption can follow, and moves the strip when a control is pressed.
 */
export function Reel({ property, shots }: { property: typeof PROPERTY; shots: readonly Shot[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [viewerAt, setViewerAt] = useState<number | null>(null);
  const firstAround = shots.findIndex((shot) => shot.chapter === "around");
  const around = firstAround >= 0 && active >= firstAround;
  const chapters = [
    { key: "stay", label: COPY.stay, start: 0 },
    ...(firstAround > 0 ? [{ key: "around", label: COPY.around, start: firstAround }] : []),
  ] as const;

  useEffect(() => {
    const root = track.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.frame));
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll("[data-frame]").forEach((frame) => observer.observe(frame));
    return () => observer.disconnect();
  }, []);

  function go(index: number) {
    const root = track.current;
    if (root) root.scrollTo({ left: Math.max(0, Math.min(shots.length - 1, index)) * root.clientWidth });
  }

  return (
    <>
      <section className={styles.hero} aria-roledescription="carousel" aria-label={COPY.gallery}>
        <div ref={track} className={styles.track} tabIndex={0} role="group" aria-label={`${COPY.gallery}: cuộn ngang để xem`}>
          {shots.map((shot, index) => (
            <figure key={shot.scene} className={styles.frame} data-frame={index} data-active={active === index || undefined} aria-roledescription="slide" aria-label={`${index + 1} / ${shots.length}`}>
              <Picture concept="b" shot={shot} orientation="auto" wide="(min-aspect-ratio: 1/1)" sizes="100vw" priority={index === 0} />
              <figcaption className="sr-only">{shot.title}</figcaption>
            </figure>
          ))}
        </div>
        <div className={styles.scrim} aria-hidden="true" />
        <span className={styles.standIn}>{COPY.standIn}</span>
        <button type="button" className={styles.all} onClick={() => setViewerAt(active)}>
          {COPY.allPhotos(shots.length)}
        </button>

        <div className={styles.title}>
          <p className={styles.eyebrow}>
            <span>{property.area}</span>
            {/* Decoration for the eye: the same words are on the chapter controls below. */}
            <span className={styles.chapterNow} aria-hidden="true" data-on={around || undefined}>
              {COPY.around}
            </span>
          </p>
          <h1 className={styles.name}>{property.name}</h1>
          <div className={styles.lines}>
            <p className={styles.line} data-on={active === 0 || undefined}>
              {property.statement}
            </p>
            <p className={styles.line} aria-hidden="true" data-on={active !== 0 || undefined}>
              {shots[active]?.title}
            </p>
          </div>
        </div>

        <div className={styles.route}>
          <div className={styles.chapters}>
            {chapters.map((chapter) => (
              <button
                key={chapter.key}
                type="button"
                className={styles.chapter}
                style={{ flexGrow: (chapter.key === "stay" ? firstAround : shots.length - firstAround) || shots.length }}
                aria-current={(chapter.key === "around") === around ? "true" : undefined}
                onClick={() => go(chapter.start)}
              >
                {chapter.label}
              </button>
            ))}
          </div>
          <div className={styles.stops} role="group" aria-label="Chọn ảnh">
            {shots.map((shot, index) => (
              <button key={shot.scene} type="button" className={styles.stop} data-passed={index <= active || undefined} data-first={index === firstAround || undefined} aria-current={index === active ? "true" : undefined} aria-label={COPY.goToPhoto(index, shot.title)} onClick={() => go(index)}>
                <span />
              </button>
            ))}
          </div>
          <div className={styles.step}>
            <p className={styles.count} aria-hidden="true">
              {pad(active + 1)} <span>/ {pad(shots.length)}</span>
            </p>
            <button type="button" className={styles.arrow} aria-label={COPY.previous} disabled={active === 0} onClick={() => go(active - 1)}>
              <Chevron direction="left" />
            </button>
            <button type="button" className={styles.arrow} aria-label={COPY.next} disabled={active === shots.length - 1} onClick={() => go(active + 1)}>
              <Chevron direction="right" />
            </button>
          </div>
        </div>
      </section>

      <Viewer concept="b" shots={shots} openAt={viewerAt} onClose={() => setViewerAt(null)} />
    </>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d={direction === "left" ? "M11 4 6 9l5 5" : "m7 4 5 5-5 5"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
