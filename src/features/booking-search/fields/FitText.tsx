"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * ONE LINE THAT NEVER CUTS A WORD WHEN A SHORTER READING EXISTS (Phase D refinement, 10/11/2026, opt-in).
 *
 * Shows the first of `options` (longest first) that fits the space it is given, measured in the line's own font; the
 * last one truncates as before if even it does not fit. `options[0]` is the complete reading: it is what the server
 * renders, what a screen reader hears and the hover title whenever a shorter one is shown. Used only where a
 * presentation passes shorter readings (the compact bars' guest field); without them nothing changes.
 */
export function FitText({ options, className = "" }: { options: readonly string[]; className?: string }) {
  const lineRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [index, setIndex] = useState(0);
  const key = options.join("\u0000");

  useLayoutEffect(() => {
    const line = lineRef.current;
    const measure = measureRef.current;
    if (!line || !measure) return;
    const list = key.split("\u0000");
    const pick = () => {
      const room = line.clientWidth;
      // Hidden (zero width): keep the complete reading until the line is laid out.
      if (room === 0) return;
      let chosen = list.length - 1;
      for (let i = 0; i < list.length; i++) {
        measure.textContent = list[i]!;
        if (measure.scrollWidth <= room) {
          chosen = i;
          break;
        }
      }
      measure.textContent = "";
      setIndex(chosen);
    };
    pick();
    const observer = new ResizeObserver(pick);
    observer.observe(line);
    // Widths change once the web font arrives.
    document.fonts?.ready.then(pick).catch(() => {});
    return () => observer.disconnect();
  }, [key]);

  const full = options[0] ?? "";
  const shown = options[Math.min(index, options.length - 1)] ?? full;
  const shortened = shown !== full;
  return (
    <span ref={lineRef} className={`relative block min-w-0 truncate ${className}`} title={shortened ? full : undefined}>
      <span aria-hidden={shortened || undefined}>{shown}</span>
      {shortened ? <span className="sr-only">{full}</span> : null}
      {/* Holds the line at the complete reading's width (within what the bar gives it), so the space measured never
          shrinks with the shorter text shown. No height, never seen or read. */}
      <span aria-hidden="true" className="invisible block h-0 overflow-hidden whitespace-nowrap">
        {full}
      </span>
      <span ref={measureRef} aria-hidden="true" className="pointer-events-none invisible absolute top-0 left-0 whitespace-nowrap" />
    </span>
  );
}
