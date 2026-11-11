import { Suspense } from "react";
import { ArrowDown, Pin } from "../b/icons";
import { COPY, pad, type Frame, type PROPERTY } from "../content";
import { FramePicture } from "./FramePicture";
import { FrameButton } from "./Gallery";
import { STOCK_COPY, STOCK_PHOTOS, type Geometry } from "./media";
import styles from "./lf.module.css";
import { Showcase } from "./Showcase";
import { StayLine } from "./Stay";

/**
 * The first screen. Who the property is, the frame that moves, two still frames, and the
 * booking action. The name, the place, the statement and the action are plain HTML and need
 * no script, no picture and no video.
 *
 * The source order is showcase, identity, action, still frames: that is the order a phone
 * shows and the order the keyboard follows. From 768px the pieces are placed on a grid, with
 * the identity at the top left.
 *
 * `geometry` "b" is the media reality check's second variant: the same sheet, with the two
 * still frames given more of its width from 768px. `once` and `chip` are the showcase's.
 */
export function Sheet({
  slug,
  property,
  showcase,
  clip,
  preview,
  frames,
  count,
  geometry = "a",
  once = false,
  chip,
}: {
  slug: string | undefined;
  property: typeof PROPERTY;
  showcase: Frame;
  clip: { wide: string; small: string };
  preview: string;
  frames: readonly Frame[];
  count: number;
  geometry?: Geometry;
  once?: boolean;
  chip?: string;
}) {
  // What each still frame takes of the screen from 768px, for the browser's choice of file.
  const wide = geometry === "b" ? ["(min-width: 80rem) 13.25rem, (min-width: 48rem) 16.5vw", "(min-width: 80rem) 10rem, (min-width: 48rem) 12.5vw"] : ["(min-width: 48rem) 14vw", "(min-width: 48rem) 10vw"];
  return (
    <div className={styles.sheet} data-geometry={geometry === "b" ? "b" : undefined}>
      <Showcase poster={showcase} clip={clip} preview={preview} count={count} once={once} chip={chip} />

      <header className={styles.identity}>
        <p className={styles.place}>
          <Pin />
          {property.area}
        </p>
        <h1 className={styles.name}>{property.name}</h1>
        <p className={styles.statement}>{property.statement}</p>
      </header>

      <div className={styles.action}>
        <p className={styles.stay}>
          <span>{COPY.yourStay}</span>
          {slug ? (
            <Suspense fallback={<>&nbsp;</>}>
              <StayLine slug={slug} />
            </Suspense>
          ) : (
            COPY.noDates
          )}
        </p>
        {/* A plain link to a place on this page: it keeps the dates in the address and works before any script has loaded. */}
        <a id="cta-inline" href="#rooms" className={styles.cta}>
          {COPY.cta}
          <ArrowDown />
        </a>
      </div>

      <div className={styles.supports}>
        {frames.map((frame, index) => (
          <figure key={frame.scene} className={index === 0 ? styles.upright : styles.square}>
            <FrameButton index={index + 1} title={frame.title} className={styles.frame}>
              <FramePicture shot={frame} orientation={frame.orientation} sizes={index === 0 ? `${wide[0]}, 56vw` : `${wide[1]}, 40vw`} />
              {STOCK_PHOTOS[frame.scene] ? <span className={styles.chip}>{STOCK_COPY.mark}</span> : null}
            </FrameButton>
            <figcaption className={styles.cap}>
              <b>{pad(index + 2)}</b>
              <span>{frame.side}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
