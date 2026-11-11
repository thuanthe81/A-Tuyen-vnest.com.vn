/** Drawn backdrops standing in for hero imagery. None shows a VNest property. */
export const BACKDROPS = {
  dusk: {
    label: "Hoàng hôn",
    dark: true,
    background:
      "radial-gradient(90% 60% at 72% 18%, rgb(246 205 160 / 0.9) 0%, transparent 60%), radial-gradient(70% 50% at 15% 85%, rgb(60 44 38 / 0.7) 0%, transparent 70%), linear-gradient(180deg, #34495d 0%, #8b6b64 46%, #c98c60 76%, #6e4b3b 100%)",
  },
  day: {
    label: "Ban ngày",
    dark: false,
    background:
      "radial-gradient(80% 60% at 24% 12%, #ffffff 0%, transparent 62%), radial-gradient(60% 40% at 85% 90%, rgb(170 150 110 / 0.6) 0%, transparent 70%), linear-gradient(180deg, #bcd8e3 0%, #e8efe3 54%, #cfc19f 100%)",
  },
  night: {
    label: "Đêm",
    dark: true,
    background: "radial-gradient(60% 40% at 30% 70%, rgb(214 150 90 / 0.35) 0%, transparent 70%), linear-gradient(180deg, #0e1620 0%, #1c2935 58%, #2a221d 100%)",
  },
  busy: {
    label: "Nhiều chi tiết",
    dark: true,
    background:
      "repeating-linear-gradient(115deg, rgb(255 255 255 / 0.16) 0 14px, transparent 14px 46px), repeating-linear-gradient(25deg, rgb(0 0 0 / 0.22) 0 8px, transparent 8px 30px), linear-gradient(160deg, #3f6b52 0%, #c7a15a 50%, #7b3f2c 100%)",
  },
} as const;

export type BackdropId = keyof typeof BACKDROPS;

type Param = string | readonly string[] | undefined;

export function readBackdrop(value: Param): BackdropId {
  return typeof value === "string" && value in BACKDROPS ? (value as BackdropId) : "dusk";
}
