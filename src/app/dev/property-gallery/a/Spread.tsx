"use client";

import { useEffect, useRef, useState } from "react";
import { COPY, pad, type PROPERTY, type Shot } from "../content";
import { Picture } from "../Picture";
import { Viewer } from "../Viewer";
import styles from "./a.module.css";
import { Arrow } from "./CtaDock";

/** How many plates are composed on the page. The rest wait in the viewer, behind "+N". */
const ON_PAGE = 5;

/** The rendered width of each plate, for the browser's choice of file once real photographs are used. */
const SIZES = ["(min-width: 48rem) 42vw, 78vw", "(min-width: 48rem) 25vw, 56vw", "(min-width: 48rem) 58vw, 84vw", "(min-width: 48rem) 26vw, 60vw", "(min-width: 48rem) 25vw, 70vw"];
const ORIENTATION = ["p", "p", "l", "p", "p"] as const;

/**
 * The spread: identity, five plates and their index.
 *
 * One set of markup. From 768px the plates are placed on a twelve-column grid and nothing
 * scrolls sideways; below it the same plates become a strip to swipe, with CSS scroll-snap.
 * Script is needed only for the viewer and to mark the current plate while swiping.
 */
export function Spread({ property, shots }: { property: typeof PROPERTY; shots: readonly Shot[] }) {
  const strip = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [viewerAt, setViewerAt] = useState<number | null>(null);
  const plates = shots.slice(0, ON_PAGE);
  const more = shots.length - plates.length;

  useEffect(() => {
    const root = strip.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setCurrent(Number((entry.target as HTMLElement).dataset.plate));
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll("[data-plate]").forEach((plate) => observer.observe(plate));
    return () => observer.disconnect();
  }, []);

  /** On a phone the index moves the strip; where every plate is already on the page it opens the plate. */
  function select(index: number) {
    const root = strip.current;
    const plate = root?.querySelector<HTMLElement>(`[data-plate="${index}"]`);
    if (root && plate && root.scrollWidth > root.clientWidth + 1) root.scrollTo({ left: plate.offsetLeft - parseFloat(getComputedStyle(root).paddingLeft) });
    else setViewerAt(index);
  }

  return (
    <>
      <div className={styles.spread}>
        <header className={styles.identity}>
          <p className={styles.meta}>{property.area}</p>
          <h1 className={styles.name}>{property.name}</h1>
          <p className={styles.statement}>{property.statement}</p>
          <div className={styles.actions}>
            {/* A plain link to a place on this page: it works before any script has loaded. */}
            <a id="cta-inline" href="#rooms" className={styles.cta}>
              {COPY.cta}
              <Arrow />
            </a>
            <button type="button" className={styles.textLink} onClick={() => setViewerAt(0)}>
              {COPY.allPhotos(shots.length)}
            </button>
          </div>
        </header>

        <div ref={strip} className={styles.plates} role="group" aria-label={COPY.gallery}>
          {plates.map((shot, index) => (
            <figure key={shot.scene} className={`${styles.plate} ${styles[`p${index + 1}`]}`} data-plate={index}>
              <button type="button" className={styles.frame} onClick={() => setViewerAt(index)} aria-label={COPY.openPhoto(index, shot.title)}>
                <Picture concept="a" shot={shot} orientation={ORIENTATION[index] ?? "p"} sizes={SIZES[index] ?? "50vw"} priority={index === 0} />
                {index === 0 ? <span className={styles.standIn}>{COPY.standIn}</span> : null}
                {index === plates.length - 1 && more > 0 ? <span className={styles.more}>+{more} ảnh</span> : null}
              </button>
              <figcaption className={styles.caption}>
                <span className={styles.plateNo}>Pl. {pad(index + 1)}</span>
                {shot.title}
              </figcaption>
            </figure>
          ))}
        </div>

        <nav className={styles.index} aria-label="Mục lục ảnh">
          <ol>
            {plates.map((shot, index) => (
              <li key={shot.scene}>
                <button type="button" aria-current={current === index ? "true" : undefined} aria-label={COPY.goToPhoto(index, shot.title)} onClick={() => select(index)}>
                  <span className={styles.plateNo}>{pad(index + 1)}</span>
                  <span className={styles.indexTitle}>{shot.title}</span>
                </button>
              </li>
            ))}
            <li className={styles.indexAll}>
              <button type="button" onClick={() => setViewerAt(0)}>
                <span className={styles.plateNo}>+{more}</span>
                <span className={styles.indexTitle}>{COPY.allPhotos(shots.length)}</span>
              </button>
            </li>
          </ol>
        </nav>

        <blockquote className={styles.quote}>
          <p>{property.summary}</p>
        </blockquote>
      </div>

      <Viewer concept="a" shots={shots} openAt={viewerAt} onClose={() => setViewerAt(null)} />
    </>
  );
}
