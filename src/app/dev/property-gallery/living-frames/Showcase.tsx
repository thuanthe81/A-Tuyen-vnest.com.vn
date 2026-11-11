"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GridMark } from "../b/icons";
import { COPY, pad, type Frame } from "../content";
import { FramePicture } from "./FramePicture";
import { useOpenGallery } from "./Gallery";
import styles from "./lf.module.css";

/** "ended" is a clip played once, resting on its last frame. "unavailable" is a clip that could not be loaded: the poster stands, with no control that would do nothing. */
type Playback = "poster" | "playing" | "paused" | "ended" | "unavailable";

/** Remembered for the visit: a guest who paused the clip does not get it started again on the next page. */
const CHOICE = "vnest.showcase";
const remembered = () => {
  try {
    return window.sessionStorage.getItem(CHOICE);
  } catch {
    return null;
  }
};
const remember = (value: "paused" | null) => {
  try {
    if (value) window.sessionStorage.setItem(CHOICE, value);
    else window.sessionStorage.removeItem(CHOICE);
  } catch {
    // Storage can be unavailable (private windows, blocked site data). The page works without it.
  }
};

/** Motion and data the guest, or their device, has asked to go without. */
function shouldHoldStill(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(prefers-reduced-data: reduce)").matches ||
    connection?.saveData === true ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g" ||
    remembered() === "paused"
  );
}

/**
 * The one frame that moves.
 *
 * The poster is an ordinary picture and is what the first screen is judged on: it loads with
 * priority, over a 32-pixel preview that is already in the page, and is all there is until,
 * and unless, the clip plays. The clip is not requested with the page. It starts by itself
 * only when the page has finished loading and nothing asks it to hold still (reduced motion,
 * reduced data, a very slow connection, or the guest's own pause earlier in the visit);
 * otherwise it waits for the control. It is muted and inline, it pauses when it leaves the
 * screen, and one labelled control pauses it for good. Nothing about booking depends on any
 * of this.
 *
 * It loops, unless `once`: then it plays through a single time and rests on its last frame,
 * and the control offers to play it again. That is for filmed material, where a camera move
 * that jumps back to its start reads as a fault.
 */
export function Showcase({ poster, clip, preview, count, once = false, chip = COPY.illustration }: { poster: Frame; clip: { wide: string; small: string }; preview: string; count: number; once?: boolean; chip?: string }) {
  const screen = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  // The guest's own choice outlives scrolling away and back.
  const stoppedByGuest = useRef(false);
  // A clip that has played through does not start again by itself when it comes back on screen.
  const finished = useRef(false);
  const [playback, setPlayback] = useState<Playback>("poster");
  const openGallery = useOpenGallery();

  const play = useCallback(() => {
    const element = video.current;
    const box = screen.current;
    if (!element || !box) return;
    // The file that suits the frame's size, attached only when it is first needed.
    if (!element.getAttribute("src")) element.src = box.clientWidth <= 480 ? clip.small : clip.wide;
    // Refused autoplay (low-power mode, a browser policy) leaves the poster and the control, nothing else.
    element.play().catch(() => undefined);
  }, [clip.small, clip.wide]);

  useEffect(() => {
    const element = video.current;
    const box = screen.current;
    if (!element || !box) return;
    if (shouldHoldStill()) {
      stoppedByGuest.current = true;
      return;
    }

    let started = false;
    const begin = () => {
      started = true;
      play();
    };
    // After the page's own content, so the clip never competes with the poster, the type or the booking action.
    const whenIdle = () => (window.requestIdleCallback ? window.requestIdleCallback(begin, { timeout: 1500 }) : window.setTimeout(begin, 300));
    if (document.readyState === "complete") whenIdle();
    else window.addEventListener("load", whenIdle, { once: true });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry || !started) return;
        if (!entry.isIntersecting) element.pause();
        else if (!stoppedByGuest.current && !finished.current) play();
      },
      { threshold: 0.25 },
    );
    observer.observe(box);
    return () => {
      window.removeEventListener("load", whenIdle);
      observer.disconnect();
    };
  }, [play]);

  function toggle() {
    if (playback === "playing") {
      stoppedByGuest.current = true;
      remember("paused");
      video.current?.pause();
    } else {
      stoppedByGuest.current = false;
      finished.current = false;
      remember(null);
      play();
    }
  }

  const shown = playback === "playing" || playback === "paused" || playback === "ended";
  const label = playback === "playing" ? COPY.pauseVideo : playback === "ended" ? COPY.replayVideo : COPY.playVideo;

  return (
    <figure className={styles.showcase}>
      <div ref={screen} className={styles.screen} style={{ backgroundImage: `url(${preview})` }}>
        <FramePicture shot={poster} orientation="l" sizes="(min-width: 80rem) 54rem, (min-width: 48rem) 72vw, 100vw" priority />
        <video
          ref={video}
          className={styles.video}
          data-on={shown ? "" : undefined}
          muted
          playsInline
          loop={!once}
          preload="none"
          aria-label={`${COPY.showcase}, không có âm thanh`}
          onPlaying={() => setPlayback("playing")}
          // A clip that failed to load also reports a pause: it stays unavailable.
          onPause={() => setPlayback((now) => (now === "unavailable" ? now : "paused"))}
          onEnded={() => {
            finished.current = true;
            setPlayback("ended");
          }}
          onError={() => setPlayback("unavailable")}
        />
        <span className={styles.chip}>{chip}</span>
        {/* The way to every picture, on the frame itself, so it is in the first screen at every width. */}
        <button type="button" className={styles.all} onClick={() => openGallery(0)} aria-label={COPY.viewAllPhotos(count)}>
          <GridMark />
          {COPY.photos(count)}
        </button>
        {playback === "unavailable" ? null : (
          <button type="button" className={styles.toggle} onClick={toggle} aria-label={label}>
            {playback === "playing" ? (
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect x="2" y="1" width="3.5" height="12" rx="0.5" />
                <rect x="8.5" y="1" width="3.5" height="12" rx="0.5" />
              </svg>
            ) : playback === "ended" ? (
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.8 8a5.2 5.2 0 1 0 1.6-3.75" />
                <path d="M2.6 1.9v2.9h2.9" />
              </svg>
            ) : (
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M3 1.2v11.6a.5.5 0 0 0 .76.43l9.3-5.8a.5.5 0 0 0 0-.86L3.76.77A.5.5 0 0 0 3 1.2Z" />
              </svg>
            )}
          </button>
        )}
      </div>
      <figcaption className={styles.cap}>
        <b>{pad(1)}</b>
        <span>{poster.side}</span>
      </figcaption>
    </figure>
  );
}
