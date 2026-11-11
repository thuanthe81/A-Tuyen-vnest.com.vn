"use client";

import type { ReactNode } from "react";
import { DEMO_HOME } from "./links";

/**
 * A link to a homepage section (`/dev/demo#<section>`). A real link (works without script and from other pages); on the
 * homepage it scrolls in place, smoothly unless reduced motion is preferred, without adding a history entry.
 */
export function SectionLink({
  section,
  className,
  onArrive,
  children,
}: {
  section: "kham-pha" | "lien-he" | "tu-van";
  className?: string;
  /** Runs after an in-page scroll starts, e.g. to move focus to the target's heading. */
  onArrive?: () => void;
  children: ReactNode;
}) {
  return (
    <a
      href={`${DEMO_HOME}#${section}`}
      className={className}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        const target = document.getElementById(section);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
        onArrive?.();
      }}
    >
      {children}
    </a>
  );
}
