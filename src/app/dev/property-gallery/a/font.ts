import { Newsreader } from "next/font/google";

/**
 * EXPLORATION typeface for Concept A's display text. Not a brand decision: VNest's identity
 * has not been supplied. Chosen because it has an optical-size axis (it sharpens at large
 * sizes) and is drawn with Vietnamese diacritics. Loaded only by this route.
 */
export const displayA = Newsreader({
  subsets: ["latin", "vietnamese"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-concept-a",
  display: "swap",
});
