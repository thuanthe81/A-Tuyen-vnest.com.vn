import { Be_Vietnam_Pro, Cormorant_Garamond } from "next/font/google";

/**
 * PROVISIONAL typeface. VNest has not supplied its identity; Be Vietnam Pro is used because
 * it is drawn for Vietnamese diacritics and is openly licensed (SIL OFL). next/font downloads
 * it at build time and serves it from this site, so no visitor request goes to Google.
 * Replace here when VNest's typography is approved.
 */
export const bodyFont = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

/**
 * Editorial serif italic for the About VNest statement ("Ở.", owner-approved direction 4/11/2026). PROVISIONAL like the
 * body face: Cormorant Garamond (SIL OFL) is drawn for Vietnamese. One weight and style only, applied to that section.
 */
export const editorialSerif = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: ["500"],
  style: ["italic"],
  variable: "--font-editorial-serif",
  display: "swap",
});
