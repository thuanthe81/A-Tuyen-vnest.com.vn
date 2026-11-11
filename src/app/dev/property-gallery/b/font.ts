import { Prata } from "next/font/google";

/**
 * EXPLORATION typeface for B+'s display text: the property name, section titles and picture
 * captions. Not a brand decision: VNest's identity has not been supplied.
 *
 * Chosen by weight as much as by look. It is one upright style with no variable axes, and
 * its Vietnamese file carries the letters other families put in a third, larger file:
 * 16 KB in all (measured), where the first Concept B's display face was 150 KB. Everything
 * else on the page uses the site's body face, which is already loaded.
 */
export const displayBPlus = Prata({
  subsets: ["latin", "vietnamese"],
  weight: "400",
  variable: "--font-concept-b",
  display: "swap",
});
