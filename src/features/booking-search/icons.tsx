/** The few icons the booking search needs, inline so they cost no request and inherit text colour. */

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export const SearchIcon = () => (
  <svg {...base}>
    <circle cx="9" cy="9" r="5.5" />
    <path d="m13.2 13.2 3.3 3.3" />
  </svg>
);

export const MinusIcon = () => (
  <svg {...base}>
    <path d="M5 10h10" />
  </svg>
);

export const PlusIcon = () => (
  <svg {...base}>
    <path d="M5 10h10M10 5v10" />
  </svg>
);

export const CloseIcon = () => (
  <svg {...base}>
    <path d="m5.5 5.5 9 9m0-9-9 9" />
  </svg>
);

export const ChevronLeftIcon = () => (
  <svg {...base}>
    <path d="m12 4.5-5.5 5.5 5.5 5.5" />
  </svg>
);

export const ChevronRightIcon = () => (
  <svg {...base}>
    <path d="m8 4.5 5.5 5.5-5.5 5.5" />
  </svg>
);

export const SpinnerIcon = () => (
  <svg {...base} className="animate-spin motion-reduce:animate-none">
    <path d="M10 3a7 7 0 1 0 7 7" />
  </svg>
);
