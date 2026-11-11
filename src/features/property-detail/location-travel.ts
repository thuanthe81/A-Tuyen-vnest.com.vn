/**
 * LOCATION MODULE DATA (25/10/2026): map position, nearest airport and the drive from it, for the
 * property pages that exist (Bare Chic, The Nắng Suites).
 *
 * Source: Google Maps driving directions from the city's airport to the property's Google place, read
 * 25/10/2026 (screenshots and notes in docs/qa/v3-final-2026-10-25/evidence/). The time reflects traffic
 * at the time of checking, so it is shown rounded as "khoảng …" and labelled as a Google Maps estimate.
 * Coordinates are the Google place's. Not confirmed by VNest; replace with VNest's own figures if
 * supplied. The transport list comes from the workbook (sheet 1, column K), not from here.
 */
export type LocationTravel = {
  /** WGS84, from the property's Google place. */
  lat: number;
  lng: number;
  airport: { name: string; code: string };
  /** Driving distance and time from the airport, Google Maps. */
  km: number;
  minutes: number;
  source: string;
  checked: string;
  /**
   * The official Google Maps embed for the property's verified Google place, generated through Google
   * Maps → Share → Embed a map (25/10/2026), used unchanged. The place id and kgmid match the workbook's
   * share link (15/10 audit).
   */
  embed: { src: string; placeId: string; kgmid: string };
};

export const LOCATION_TRAVEL: Readonly<Record<string, LocationTravel>> = {
  "bare-chic": {
    lat: 10.7885194,
    lng: 106.701447,
    airport: { name: "Tân Sơn Nhất", code: "SGN" },
    km: 9.5,
    minutes: 29,
    source: "Google Maps, chỉ đường ô tô từ Sân bay quốc tế Tân Sơn Nhất",
    checked: "2026-10-25",
    embed: {
      src: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.2973934104402!2d106.701447!3d10.7885194!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317529bd65e9671d%3A0x1aff14577a350dd4!2sBare%20Chic%20-%20Bare%20Boutique%20Stays!5e0!3m2!1sen!2s!4v1792942946773!5m2!1sen!2s",
      placeId: "0x317529bd65e9671d:0x1aff14577a350dd4",
      kgmid: "/g/11f6ywgqpw",
    },
  },
  "bare-da-kao": {
    lat: 10.79123,
    lng: 106.7015005,
    airport: { name: "Tân Sơn Nhất", code: "SGN" },
    km: 8.5,
    minutes: 21,
    source: "Google Maps, chỉ đường ô tô từ Sân bay quốc tế Tân Sơn Nhất",
    checked: "2026-10-27",
    embed: {
      src: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.281834510845!2d106.7015005!3d10.79123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317529ac8dc9dad7%3A0x1ff29c194ba069ea!2sBare%20Da%20Kao%20-%20Bare%20Boutique%20Stays!5e0!3m2!1sen!2s!4v1792943050000!5m2!1sen!2s",
      placeId: "0x317529ac8dc9dad7:0x1ff29c194ba069ea",
      kgmid: "/g/11z6464xjg",
    },
  },
  "the-nang-suites": {
    lat: 16.0629799,
    lng: 108.2372824,
    airport: { name: "Đà Nẵng", code: "DAD" },
    km: 5.9,
    minutes: 15,
    source: "Google Maps, chỉ đường ô tô từ Sân bay quốc tế Đà Nẵng",
    checked: "2026-10-25",
    // Google's place card in this embed shows Google's address (74/31), which conflicts with the
    // workbook's K174/31 (Q19); VNest's own text on the page states no house number.
    embed: {
      src: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.0483867251623!2d108.2372741!3d16.0629787!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3142172062a243ed%3A0xbf1dc451da67c4c2!2sThe%20Nang%20Suites!5e0!3m2!1sen!2s!4v1792943016484!5m2!1sen!2s",
      placeId: "0x3142172062a243ed:0xbf1dc451da67c4c2",
      kgmid: "/g/11fnr8n47n",
    },
  },
};

/** "9,5 km" (Vietnamese decimal comma). */
export const formatKm = (km: number) => `${km.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} km`;

/** Rounded to 5 minutes: 29 → 30, 15 → 15. */
export const roundMinutes = (minutes: number) => Math.max(5, Math.round(minutes / 5) * 5);

/** "Grab, đi bộ, xe bus" → ["Grab", "Đi bộ", "Xe bus"]. */
export function transportModes(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean)
    .map((m) => m.charAt(0).toLocaleUpperCase("vi-VN") + m.slice(1));
}
