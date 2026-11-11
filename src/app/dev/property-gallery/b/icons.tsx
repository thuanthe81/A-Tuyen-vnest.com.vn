/**
 * Pictograms for the transition sketch, drawn on a 24px grid with one stroke weight. The keys
 * are the content model's (AMENITY_ICONS, NearbyCategory); an unknown key draws a neutral mark,
 * as the model requires. Decorative: the label beside each one carries the meaning.
 */
const PATHS: Record<string, React.ReactNode> = {
  wifi: (
    <>
      <path d="M3 9.5a13 13 0 0 1 18 0M6 13a8.5 8.5 0 0 1 12 0M9 16.5a4.2 4.2 0 0 1 6 0" />
      <circle cx="12" cy="19.5" r="0.6" fill="currentColor" />
    </>
  ),
  "air-conditioning": <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5" />,
  kitchen: <path d="M7 3v7a2.5 2.5 0 0 0 2.5 2.5V21M4.5 3v5.5M9.5 3v5.5M16.5 21v-7h-2V7.5c0-2.5 1-4.5 2-4.5Z" />,
  laundry: (
    <>
      <rect x="4.5" y="3" width="15" height="18" rx="1.5" />
      <circle cx="12" cy="13.5" r="4" />
      <path d="M7.5 6.5h2" />
    </>
  ),
  workspace: <path d="M5 5h14v9.5H5zM2.5 18.5h19M9.5 14.5l-1 4M14.5 14.5l1 4" />,
  garden: <path d="M12 21v-9M12 12c0-4 2.5-6.5 7-6.5 0 4.5-2.5 6.5-7 6.5ZM12 15c0-3-2-5-6-5 0 3.5 2 5 6 5Z" />,
  "food-drink": <path d="M5 9h11v4.5a5.5 5.5 0 0 1-11 0ZM16 10.5h1.5a2 2 0 0 1 0 4H16M4 21h13M8 3.5c0 1.2 1 1.2 1 2.5M12 3.5c0 1.2 1 1.2 1 2.5" />,
  culture: <path d="M3.5 9 12 4l8.5 5M5 9h14M6.5 12v6M10 12v6M14 12v6M17.5 12v6M4 20.5h16" />,
  nature: <path d="M12 21v-5M12 16l-5.5 0L12 4l5.5 12ZM9 11.5h6" />,
  transport: (
    <>
      <rect x="5" y="3.5" width="14" height="13" rx="2" />
      <path d="M5 11h14M8 16.5 6.5 20M16 16.5l1.5 3.5" />
      <circle cx="8.5" cy="13.7" r="0.6" fill="currentColor" />
      <circle cx="15.5" cy="13.7" r="0.6" fill="currentColor" />
    </>
  ),
};

export function Pictogram({ name }: { name: string }) {
  return (
    <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name] ?? <circle cx="12" cy="12" r="3" />}
    </svg>
  );
}

export function ArrowDown() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3v12m0 0 5-5m-5 5-5-5" />
    </svg>
  );
}

export function ArrowRight() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9h12m0 0-5-5m5 5-5 5" />
    </svg>
  );
}

export function GridMark() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" />
    </svg>
  );
}

export function Pin() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <path d="M8 14.5S3.5 10.6 3.5 6.8a4.5 4.5 0 0 1 9 0c0 3.8-4.5 7.7-4.5 7.7Z" />
      <circle cx="8" cy="6.8" r="1.6" />
    </svg>
  );
}
