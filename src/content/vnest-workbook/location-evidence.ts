/**
 * LOCATION EVIDENCE for the property cards (G2.1, 19/10/2026): what independent public sources say
 * about each property's address and area, and where each Google Maps link resolves.
 *
 * Rules applied:
 * - The visitor-orientation label ("Quận 1", "Hải Châu", "Sơn Trà") is a FORMER district (before the
 *   two-level system of July 2025). It is shown only when a source names it for this property or
 *   for its exact address. It is never inferred from a current ward name (Phường Sài Gòn, Phường
 *   Tân Định), from the street, or from neighbouring house numbers.
 * - The current official ward is the workbook's, as supplied. For Đà Nẵng the workbook does not
 *   say whether "Hải Châu" and "Sơn Trà" are new wards or former districts (audit Q14).
 * - A "Xem bản đồ" link is shown only when the workbook link is free of conflict and resolves to the
 *   Google place named for this property. Resolution was checked by following the share link's
 *   redirects only; Google's own pages answered with a bot check (CAPTCHA), which was not bypassed,
 *   so the places' addresses on Google were not read.
 */
import type { Evidence, QuestionId } from "./sourced";

const CHECKED = "2026-10-19";

export type LocationEvidence = {
  /** The former-district label, when a source names it for this property; else null (city only). */
  area: string | null;
  areaEvidence: readonly Evidence[];
  /** Sources on the street address and house number. */
  addressEvidence: readonly Evidence[];
  /** Whether the house number matches every source found, conflicts with one, or was not found. */
  addressCheck: "matches" | "conflicts" | "not-found";
  /** Where the workbook's map link (cell text) resolves, by redirect. */
  mapResolvesTo: { kgmid: string; name: string; checked: string };
  /** Open questions this location still depends on. */
  questions: readonly QuestionId[];
};

export const LOCATION_EVIDENCE: Readonly<Record<string, LocationEvidence>> = {
  "bare-chic": {
    area: "Quận 1",
    areaEvidence: [
      { url: "https://toplist.vn/top-list/homestay-dep-va-doc-dao-tai-quan-1-thanh-pho-ho-chi-minh-26785.htm", says: "Bare Boutique Stays: \"12/18 Nguyễn Thị Minh Khai, Quận 1, TP. HCM\"", checked: CHECKED, note: "Undated" },
      { url: "https://mytour.vn/en/blog/bai-viet/top-11-most-beautiful-homestays-in-district-1-ho-chi-minh-city.html", says: "Bare Boutique Stays: \"12/18 Nguyen Thi Minh Khai, District 1, Ho Chi Minh City\"", checked: CHECKED, note: "Last updated 1/10/2026" },
    ],
    addressEvidence: [],
    addressCheck: "matches",
    mapResolvesTo: { kgmid: "/g/11f6ywgqpw", name: "Bare Chic - Bare Boutique Stays", checked: CHECKED },
    questions: [],
  },
  "bare-hyphen": {
    area: null,
    areaEvidence: [],
    addressEvidence: [{ url: "https://www.hrs.com/en/hotel/1451275", says: "Bare Hyphen: \"29a/18 Nguyễn Đình Chiểu, Ho Chi Minh City\" (no district or ward)", checked: CHECKED }],
    addressCheck: "matches",
    // The cell text resolves here. In the 15/10 workbook the cell's hyperlink opened Bare Chic; in v2
    // the range record J8:J11 targets the cell text, but the record for J8 still opens Bare Chic (Q4).
    mapResolvesTo: { kgmid: "/g/11h1rbknrd", name: "Bare Hyphen - Bare Boutique Stays", checked: CHECKED },
    questions: ["Q4", "Q20"],
  },
  "bare-da-kao": {
    area: null,
    areaEvidence: [],
    addressEvidence: [],
    addressCheck: "not-found",
    // The cell text resolves here. In v2 the range record J12:J15 targets Bare Hyphen's link
    // (YV37L6mKA2VrWBO2S, which resolves to "Bare Hyphen - Bare Boutique Stays"), so the map is held (Q22).
    mapResolvesTo: { kgmid: "/g/11z6464xjg", name: "Bare Da Kao - Bare Boutique Stays", checked: CHECKED },
    questions: ["Q20", "Q22"],
  },
  "bare-han": {
    area: "Hải Châu",
    areaEvidence: [{ url: "https://www.airbnb.co.uk/rooms/54043688", says: "\"Perfect Sanctuary in BareHan\", host Vnest Hospitality Consulting: district \"Quận Hải Châu\", neighbourhood \"Phường Hải Châu\", \"located on Tran Phu Street\"; exact location after booking", checked: CHECKED }],
    addressEvidence: [],
    addressCheck: "not-found",
    mapResolvesTo: { kgmid: "/g/11rfthwlkw", name: "Bare Han - Bare Boutique Stays", checked: CHECKED },
    questions: ["Q14"],
  },
  "the-nang-suites": {
    area: "Sơn Trà",
    areaEvidence: [{ url: "https://mia.vn/cam-nang-du-lich/the-nang-suites-khong-gian-om-tron-nhieu-cam-nghiem-giua-long-thanh-pho-bien-6428", says: "\"Địa chỉ: 74/31 Võ Văn Kiệt, Sơn Trà, thành phố Đà Nẵng\"", checked: CHECKED, note: "Published 26.09.2023, before the two-level system: Sơn Trà is the district" }],
    addressEvidence: [{ url: "https://mia.vn/cam-nang-du-lich/the-nang-suites-khong-gian-om-tron-nhieu-cam-nghiem-giua-long-thanh-pho-bien-6428", says: "House number 74/31; the workbook writes K174/31", checked: CHECKED }],
    addressCheck: "conflicts",
    mapResolvesTo: { kgmid: "/g/11fnr8n47n", name: "The Nang Suites", checked: CHECKED },
    questions: ["Q14", "Q19"],
  },
  "pepper-house": {
    area: "Quận 1",
    areaEvidence: [
      { url: "https://archilovers.com/projects/185946/pepper-house-pepper-builders-makers.html", says: "The architect's project page: \"located in the heart of the main business district (District 1)\"; facade faces the Thi Nghe canal", checked: CHECKED },
      { url: "https://www.hotels.com/ho1288158464/pepper-house-studio-apartment-ho-chi-minh-city-vietnam/", says: "\"19 Hoang Sa Street, Da Kao Ward\" (Đa Kao: a former ward of District 1)", checked: CHECKED, note: "Seen in search results; the page itself timed out" },
    ],
    addressEvidence: [],
    addressCheck: "matches",
    mapResolvesTo: { kgmid: "/g/11l6686012", name: "Pepper House", checked: CHECKED },
    questions: [],
  },
};
