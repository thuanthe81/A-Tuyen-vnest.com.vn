import { Bricolage_Grotesque } from "next/font/google";

/**
 * EXPLORATION typeface for Concept B's display text. Not a brand decision: VNest's identity
 * has not been supplied. Chosen because it has a width axis (it can be set narrow and heavy,
 * like a film title) and is drawn with Vietnamese diacritics. Loaded only by this route.
 */
export const displayB = Bricolage_Grotesque({
  subsets: ["latin", "vietnamese"],
  axes: ["opsz", "wdth"],
  variable: "--font-concept-b",
  display: "swap",
});
