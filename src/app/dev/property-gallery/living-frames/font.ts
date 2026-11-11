import { Bricolage_Grotesque } from "next/font/google";

/**
 * EXPLORATION typeface for the property name and section titles. Not a brand decision:
 * VNest's identity has not been supplied.
 *
 * One weight at the family's normal width: about 36 KB across its Latin, Latin Extended and
 * Vietnamese files (measured). The first version of this prototype set the name narrow and
 * heavier, which needs the family's width axis and arrives as a 120 KB variable font.
 */
export const displayLF = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: "700",
  variable: "--font-lf",
  display: "swap",
});
