import type { AmenityIcon } from "@/domain/property";

/**
 * Amenity pictograms on a 24 px grid, one stroke weight, ported from the property-gallery sketch
 * (src/app/dev/property-gallery/b/icons.tsx). Keys are the content model's fixed list; an amenity
 * without one draws the neutral mark, as the model requires. Decorative: the label beside each
 * pictogram carries the meaning.
 */
const PATHS: Partial<Record<AmenityIcon, React.ReactNode>> = {
  wifi: (
    <>
      <path d="M3 9.5a13 13 0 0 1 18 0M6 13a8.5 8.5 0 0 1 12 0M9 16.5a4.2 4.2 0 0 1 6 0" />
      <circle cx="12" cy="19.5" r="0.6" fill="currentColor" />
    </>
  ),
  "air-conditioning": <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5" />,
  kitchen: <path d="M7 3v7a2.5 2.5 0 0 0 2.5 2.5V21M4.5 3v5.5M9.5 3v5.5M16.5 21v-7h-2V7.5c0-2.5 1-4.5 2-4.5Z" />,
};

/**
 * Pictograms for supplied labels that the content model's fixed list has no key for (BMP's choice
 * for the CEO demo, 21/10/2026, as Q31's). Matched on the exact workbook label only.
 */
const LABEL_PATHS: Readonly<Record<string, React.ReactNode>> = {
  "Smart TV": (
    <>
      <rect x="3" y="5" width="18" height="12" rx="1.5" />
      <path d="M9 20.5h6M12 17v3.5" />
    </>
  ),
  "Phòng tắm riêng": <path d="M5 21V7.5A3.5 3.5 0 0 1 8.5 4h2A3.5 3.5 0 0 1 14 7.5V9M10.5 9h7M11.5 12v1.2M14 12v1.2M16.5 12v1.2M12.7 15.5v1.2M15.3 15.5v1.2" />,
};

export function Pictogram({ icon, size = 24, label }: { icon: AmenityIcon | undefined; size?: number; label?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {(icon && PATHS[icon]) ?? (label && LABEL_PATHS[label]) ?? <circle cx="12" cy="12" r="2.5" />}
    </svg>
  );
}
