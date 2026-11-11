"use client";

import styles from "./lf.module.css";

const VARIANTS = [
  { key: "drawn", label: "Minh hoạ", href: "/dev/property-gallery/living-frames" },
  { key: "a", label: "A", href: "/dev/property-gallery/living-frames/media-a" },
  { key: "b", label: "B", href: "/dev/property-gallery/living-frames/media-b" },
] as const;

/**
 * For the reviewer of the media reality check only: the drawn page, variant A and variant B,
 * one press apart, keeping the stay that is in the address. It lives in the test's own
 * disclosure line, from 768px (below that A and B are the same page), and is not part of
 * the design.
 */
export function VariantSwitch({ current }: { current: "a" | "b" }) {
  return (
    <span className={styles.switch}>
      {VARIANTS.map((variant) => (
        <a
          key={variant.key}
          href={variant.href}
          aria-current={variant.key === current ? "page" : undefined}
          // Plain links that work without script; with it, they carry the dates and guests across.
          onClick={(event) => {
            event.currentTarget.href = variant.href + window.location.search;
          }}
        >
          {variant.label}
        </a>
      ))}
    </span>
  );
}
