"use client";

import { useState } from "react";
import { COPY, pad, type PROPERTY, type Shot, type Story } from "../content";
import { DeferredPicture } from "../DeferredPicture";
import { Picture } from "../Picture";
import { Viewer } from "../Viewer";
import styles from "./b.module.css";
import { ArrowDown, ArrowRight, GridMark, Pin } from "./icons";

/** Where each story sits in the complete gallery: the hero is first. */
const AFTER_HERO = 1;

/** The rendered width of each story picture, for the browser's choice of file once real photographs are used. */
const SIZES = ["(min-width: 48rem) 56vw, 100vw", "(min-width: 48rem) 31vw, 50vw", "(min-width: 48rem) 31vw, 50vw", "(min-width: 48rem) 56vw, 100vw"];

/**
 * The arrival and the discovery: one picture and the identity, then four pictures that each
 * show a different side of the property.
 *
 * Nothing here moves by itself and nothing has to be swiped. Script is needed for two things
 * only: opening the complete gallery, and holding back the story pictures until the guest
 * is near them. The identity and the booking action are plain HTML.
 */
export function Arrival({ property, hero, stories, shots }: { property: typeof PROPERTY; hero: Shot; stories: readonly Story[]; shots: readonly Shot[] }) {
  const [viewerAt, setViewerAt] = useState<number | null>(null);

  return (
    <>
      <section className={styles.hero} aria-label={property.name}>
        <div className={styles.heroPicture}>
          <Picture concept="b" shot={hero} orientation="auto" wide="(min-aspect-ratio: 1/1)" sizes="100vw" priority />
        </div>
        <span className={styles.standIn}>{COPY.standIn}</span>

        {/* The identity is on the page's own paper, cut into the picture's corner: it never depends on the photograph for contrast. */}
        <div className={styles.plate}>
          <p className={styles.place}>
            <Pin />
            {property.area}
          </p>
          <h1 className={styles.name}>{property.name}</h1>
          <p className={styles.statement}>{property.statement}</p>
          {/* A plain link to a place on this page: it works before any script has loaded. */}
          <a id="cta-inline" href="#rooms" className={styles.cta}>
            {COPY.cta}
            <ArrowDown />
          </a>
        </div>

        <button type="button" className={styles.chip} onClick={() => setViewerAt(0)}>
          <GridMark />
          {COPY.viewPhotos(shots.length)}
        </button>
      </section>

      <section className={styles.tour} aria-labelledby="b-tour">
        <div className={styles.tourHead}>
          <h2 id="b-tour" className={styles.title}>
            {COPY.tour}
          </h2>
          <button type="button" className={styles.textButton} onClick={() => setViewerAt(0)}>
            {COPY.viewAllPhotos(shots.length)}
            <ArrowRight />
          </button>
        </div>

        <div className={styles.stories}>
          {stories.map((story, index) => (
            <figure key={story.scene} className={`${styles.story} ${styles[`s${index + 1}`]}`}>
              <button type="button" className={styles.frame} onClick={() => setViewerAt(index + AFTER_HERO)} aria-label={COPY.openPhoto(index + AFTER_HERO, story.title)}>
                <DeferredPicture concept="b" shot={story} orientation={story.orientation} sizes={SIZES[index] ?? "50vw"} className={styles.deferred} />
              </button>
              <figcaption className={styles.caption}>
                <span className={styles.no}>{pad(index + AFTER_HERO + 1)}</span>
                <span className={styles.aspect}>{story.aspect}</span>
                <span className={styles.note}>{story.note}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <Viewer concept="b" shots={shots} openAt={viewerAt} onClose={() => setViewerAt(null)} />
    </>
  );
}
