import type { AnchorHTMLAttributes, ReactNode } from "react";
import styles from "./Cta.module.css";

/**
 * THE PARTNER PAGE CTA, two-state wipe (owner's correction, 9/11/2026; Cta.module.css explains it). Partner page only:
 * the homepage accordion keeps its approved solid Copper CTA.
 *
 * `CtaContent` is the inside of the button: the resting face (Dark Olive label, Copper arrow; the one screen readers
 * read) and an identical Copper face (white label and arrow, `aria-hidden`) that the stylesheet reveals from left to
 * right. The link element stays with its owner (the page's consultation links), which adds `ctaClass()`.
 */
export function CtaContent({ children }: { children: ReactNode }) {
  const arrow = (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 10h12.5M11.5 5.5 16 10l-4.5 4.5" />
    </svg>
  );
  return (
    <>
      <span className={styles.face}>
        <span className={styles.label}>{children}</span>
        <span className={styles.arrow}>{arrow}</span>
      </span>
      <span className={`${styles.face} ${styles.fill}`} aria-hidden="true">
        <span className={styles.label}>{children}</span>
        <span className={styles.arrow}>{arrow}</span>
      </span>
    </>
  );
}

/** The class of the partner page CTA. */
export const ctaClass = () => styles.cta;

/** A complete CTA link, for the review page (/dev/partner-cta). `state` freezes the wipe for its screenshots only. */
export function CtaLink({ children, state, className, ...link }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode; state?: "half" | "full" }) {
  return (
    <a {...link} className={`${ctaClass()} ${className ?? ""}`} data-state={state}>
      <CtaContent>{children}</CtaContent>
    </a>
  );
}
