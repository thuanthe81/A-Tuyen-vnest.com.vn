/**
 * Homepage hero timing, in a client-safe module: `hero-slides.ts` reads the selection manifest from disk (server only), so a
 * client component must not import values from it.
 */

/** Cross-fade between slides (owner's Phase A corrections, 7/11/2026). Demo.module.css `.heroSlide` uses the same 600 ms. */
export const HERO_FADE = 600;
/** How long a slide is fully visible once its fade-in has finished: about 2 seconds. */
export const HERO_DWELL = 2000;
/** Time from one slide change to the next: the fade-in plus the dwell (2.6 s). */
export const HERO_AUTOPLAY_INTERVAL = HERO_FADE + HERO_DWELL;
