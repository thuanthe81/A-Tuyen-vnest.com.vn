"use client";

import { photoAlt } from "@/content/vnest-workbook/content-en";
import { useLocale } from "@/features/locale/LocaleProvider";
import { placeLabel } from "./place-names";
import { siteCopyFor } from "./site-copy";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import type { HeroSlide } from "./hero-slides";
import { HERO_AUTOPLAY_INTERVAL } from "./hero-timing";
import styles from "./Demo.module.css";

/**
 * HOMEPAGE HERO SLIDESHOW (VNest V3 Stage 1, 24/10/2026, CEO R04; simplified after the client review of 6/11/2026 and
 * the owner's Phase A corrections of 7/11/2026): a quiet cross-fade through the curated photographs, behind the heading and
 * the 02.1 floating bar. Nothing to operate on screen: no dots, arrows, captions or pause button.
 *
 * Motion: a slide changes every `interval` ms (2.6 s: a 600 ms cross-fade, then about 2 s fully visible), looping. It
 * pauses while the booking bar (or anything reached by keyboard) has focus, and while the tab is hidden. A mouse over the
 * hero no longer pauses it (the owner wants it to move on its own). A touch swipe changes the slide and holds the rotation
 * for `RESUME_AFTER`. Pause/play (WCAG 2.2.2) is a real button, first in the hero's keyboard order, visually hidden until
 * it has keyboard focus; screen readers always reach it. With prefers-reduced-motion the hero is static (first photograph,
 * no rotation, no fade) unless the guest presses play. Slides keep their group role and accessible names; the live region
 * speaks only while not rotating. The server renders the first slide, paused-safe; rotation starts after hydration.
 *
 * Loading: only the first photograph loads with the page (high priority); the next one is fetched
 * once the first has loaded, and each later one only when the slide before it is shown. A slide is
 * faded in only once its photograph has loaded, so the hero never flashes empty.
 */
const REDUCED = "(prefers-reduced-motion: reduce)";
/** The hero is taller than 3:2 on phones and tablets, so a cover-fitted photograph renders wider than the screen. */
const SIZES = "(max-width: 47.99rem) 215vw, (max-width: 63.99rem) 135vw, 100vw";
/** After a manual change, how long the rotation waits before its next interval starts. */
const RESUME_AFTER = 3000;
function subscribeReduced(onChange: () => void) {
  const query = matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

export function HeroCarousel({ slides: sourceSlides, interval = HERO_AUTOPLAY_INTERVAL, text, booking, labelledBy }: { slides: readonly HeroSlide[]; interval?: number; text: ReactNode; booking: ReactNode; labelledBy: string }) {
  const locale = useLocale();
  const copy = siteCopyFor(locale);
  // Captions name the property, room and place; alt text describes the photograph (English entries: content-en.ts).
  const slides = useMemo(
    () => sourceSlides.map((slide) => ({ ...slide, caption: placeLabel(slide.caption, locale), alt: photoAlt(slide.alt, locale) })),
    [sourceSlides, locale],
  );
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(0);
  const [mounted, setMounted] = useState<ReadonlySet<number>>(() => new Set([0]));
  // null until the guest uses the rotation control: then their choice wins over the default.
  const [chosenPlaying, setChosenPlaying] = useState<boolean | null>(null);
  const [focused, setFocused] = useState(false);
  // True for RESUME_AFTER after a swipe; restarts with every further manual change.
  const [manualHold, setManualHold] = useState(false);
  const loaded = useRef(new Set<number>([0]));
  const target = useRef(0);
  const swipeFrom = useRef<{ x: number; y: number; axis: "x" | "y" | null } | null>(null);
  const lastSwipeAt = useRef(0);
  // Reduced motion: no automatic rotation unless the guest asks for it. Server: assume motion is fine, render paused-safe markup.
  const reduced = useSyncExternalStore(subscribeReduced, () => matchMedia(REDUCED).matches, () => false);
  const hidden = useSyncExternalStore(subscribeVisibility, () => document.hidden, () => false);
  const playing = chosenPlaying ?? !reduced;
  const setPlaying = (next: boolean) => setChosenPlaying(next);

  const mount = useCallback((...indices: number[]) => {
    setMounted((current) => {
      const wanted = indices.map((i) => ((i % count) + count) % count).filter((i) => !current.has(i));
      return wanted.length ? new Set([...current, ...wanted]) : current;
    });
  }, [count]);

  // Pre-mount neighbor slides after hydration so autoplay and left/right swipes never wait on unmounted images.
  useEffect(() => {
    if (count <= 1) return;
    const timer = setTimeout(() => mount(1, count - 1), 0);
    return () => clearTimeout(timer);
  }, [count, mount]);

  const go = useCallback(
    (next: number) => {
      const i = ((next % count) + count) % count;
      target.current = i;
      setIndex(i);
      mount(i, i + 1, i - 1);
      if (loaded.current.has(i)) setVisible(i);
    },
    [count, mount],
  );

  const onLoad = (i: number) => {
    loaded.current.add(i);
    if (i === 0 && count > 1) mount(1, count - 1);
    if (i === target.current) setVisible(i);
  };

  // Fallback: if an image finished loading before hydration or its load event was suppressed, ensure visible catches up to index.
  useEffect(() => {
    if (visible === index) return;
    const delay = loaded.current.has(index) ? 0 : 240;
    const timer = setTimeout(() => {
      loaded.current.add(index);
      setVisible(index);
    }, delay);
    return () => clearTimeout(timer);
  }, [index, visible]);

  const rotating = playing && !focused && !hidden && !manualHold && count > 1;
  useEffect(() => {
    if (!manualHold) return;
    const timer = setTimeout(() => setManualHold(false), RESUME_AFTER);
    return () => clearTimeout(timer);
  }, [manualHold, index]);
  useEffect(() => {
    if (!rotating) return;
    const timer = setTimeout(() => go(target.current + 1), interval);
    return () => clearTimeout(timer);
  }, [rotating, index, visible, interval, go]);

  const choose = (next: number) => {
    setManualHold(true);
    go(next);
  };

  const commitSwipe = (dx: number, dy: number, axis: "x" | "y" | null) => {
    if (axis === "y") return;
    const now = Date.now();
    if (now - lastSwipeAt.current < 80) return;
    if (Math.abs(dx) >= 36 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      lastSwipeAt.current = now;
      choose(target.current + (dx < 0 ? 1 : -1));
    }
  };

  if (!count) {
    return (
      <section className={styles.hero} aria-labelledby={labelledBy}>
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.heroContent}>
          <div className={styles.heroText}>{text}</div>
          <div className={styles.heroBooking}>{booking}</div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={styles.hero}
      aria-labelledby={labelledBy}
      aria-roledescription="carousel"
      onFocus={(event) => {
        // A tap on the closed mobile booking pill must not freeze rotation on touch devices;
        // open dialogs, form inputs, and desktop keyboard/booking focus do.
        const targetEl = event.target as Element;
        const finePointer = matchMedia("(pointer: fine)").matches;
        const inOpenDialogOrInput =
          targetEl.closest("dialog[open], input, select, textarea") !== null ||
          (finePointer && targetEl.closest("[data-booking-slot]") !== null);
        const keyboardFocus = finePointer && targetEl.matches(":focus-visible");
        setFocused(inOpenDialogOrInput || keyboardFocus);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      onTouchStart={(event) => {
        if ((event.target as Element).closest("button, a, input, select, textarea, dialog[open]")) return;
        const touch = event.touches[0];
        if (!touch) return;
        swipeFrom.current = { x: touch.clientX, y: touch.clientY, axis: null };
      }}
      onTouchMove={(event) => {
        const from = swipeFrom.current;
        const touch = event.touches[0];
        if (!from || !touch) return;
        const dx = touch.clientX - from.x;
        const dy = touch.clientY - from.y;
        if (!from.axis && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
          from.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
        }
      }}
      onTouchEnd={(event) => {
        const from = swipeFrom.current;
        swipeFrom.current = null;
        const touch = event.changedTouches[0];
        if (!from || !touch) return;
        commitSwipe(touch.clientX - from.x, touch.clientY - from.y, from.axis);
      }}
      onPointerDown={(event) => {
        // Swipe on the photograph only: never from buttons, links or open dialogs.
        if (event.pointerType === "mouse" || (event.target as Element).closest("button, a, input, select, textarea, dialog[open]")) return;
        swipeFrom.current = { x: event.clientX, y: event.clientY, axis: null };
      }}
      onPointerMove={(event) => {
        const from = swipeFrom.current;
        if (!from || event.pointerType === "mouse") return;
        const dx = event.clientX - from.x;
        const dy = event.clientY - from.y;
        if (!from.axis && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
          from.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
        }
      }}
      onPointerUp={(event) => {
        const from = swipeFrom.current;
        swipeFrom.current = null;
        if (!from || event.pointerType === "mouse") return;
        commitSwipe(event.clientX - from.x, event.clientY - from.y, from.axis);
      }}
    >
      <div className={styles.heroSlides} aria-live={rotating ? "off" : "polite"}>
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${count}: ${slide.caption}`}
            aria-hidden={i !== index}
            className={styles.heroSlide}
            data-active={i === visible}
            style={{ "--pos": slide.position, "--pos-tablet": slide.tabletPosition, "--pos-mobile": slide.mobilePosition } as CSSProperties}
          >
            {mounted.has(i) ? (
              <picture>
                {slide.sources.map((source) => (
                  <source key={source.type} type={source.type} srcSet={source.srcSet} sizes={SIZES} />
                ))}
                <img
                  src={slide.fallback.src}
                  srcSet={slide.fallback.srcSet}
                  sizes={SIZES}
                  alt={slide.alt}
                  width={slide.width}
                  height={slide.height}
                  decoding="async"
                  fetchPriority={i === 0 ? "high" : "low"}
                  onLoad={() => onLoad(i)}
                  ref={(node) => {
                    // Already decoded before hydration (the first slide usually is): onLoad will not fire.
                    if (node?.complete && node.naturalWidth > 0 && !loaded.current.has(i)) onLoad(i);
                  }}
                />
              </picture>
            ) : null}
          </div>
        ))}
      </div>
      <div className={styles.heroShade} aria-hidden="true" />
      <div className={styles.heroContent}>
        <div className={styles.heroRow}>
          {/* Hidden until keyboard focus (then a small pill above the heading); first in the hero's tab order. */}
          {count > 1 ? (
            <button type="button" className={styles.heroPause} onClick={() => setPlaying(!playing)}>
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                {playing ? <path d="M6.5 4.5h2v11h-2zM11.5 4.5h2v11h-2z" /> : <path d="M7 4.5v11l8.5-5.5z" />}
              </svg>
              {playing ? copy.carouselPause : copy.carouselPlay}
            </button>
          ) : null}
          <div className={styles.heroText}>{text}</div>
        </div>
        <div className={styles.heroBooking} id="dat-phong" data-booking-slot="hero">
          {booking}
        </div>
      </div>
    </section>
  );
}
