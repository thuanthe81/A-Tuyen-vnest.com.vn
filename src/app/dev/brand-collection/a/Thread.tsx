"use client";

import { useCallback, useLayoutEffect, useState, type RefObject } from "react";
import styles from "./a.module.css";

type Geometry = { d: string; start: [number, number]; tie: [number, number]; ring: number; width: number; height: number };

/**
 * The copper thread borrowed from concept B: one line from the chosen panel to the result
 * line, so the choice and what it shows read as one connected gesture.
 *
 * It leaves along the foot of the chosen panel, turns down the page margin (so it never
 * crosses a filter), and ties into the result line with the two interlaced rings, then runs
 * along it. Drawn from measured positions, redrawn when the choice changes, re-measured on
 * resize. Decoration only: hidden from assistive technology, never in the way of a pointer,
 * and with reduced motion it simply appears.
 */
export function Thread({ pageRef, groupRef, resultId, chosen }: { pageRef: RefObject<HTMLElement | null>; groupRef: RefObject<HTMLElement | null>; resultId: string; chosen: string }) {
  const [geometry, setGeometry] = useState<Geometry | null>(null);

  const measure = useCallback(() => {
    const page = pageRef.current;
    const group = groupRef.current;
    const pressed = group?.querySelector<HTMLElement>('[aria-pressed="true"]');
    const result = document.getElementById(resultId)?.parentElement;
    if (!page || !group || !pressed || !result) return setGeometry(null);
    const p = page.getBoundingClientRect();
    const g = group.getBoundingClientRect();
    const c = pressed.getBoundingClientRect();
    const r = result.getBoundingClientRect();
    const left = g.left - p.left;
    // Half the margin, at most 20 px outside the content: close enough to belong to it.
    const turn = Math.round(left - Math.min(20, left / 2));
    const foot = Math.round(c.bottom - p.top) + 3.5;
    const line = Math.round(r.top - p.top) + 0.5;
    const startX = Math.round(c.right - p.left) - 2;
    const endX = Math.round(g.right - p.left);
    const k = Math.min(10, (line - foot) / 2);
    const d = `M${startX} ${foot}H${turn + k}Q${turn} ${foot} ${turn} ${foot + k}V${line - k}Q${turn} ${line} ${turn + k} ${line}H${endX}`;
    setGeometry({ d, start: [startX, foot], tie: [turn, line], ring: Math.min(22, 2 * turn - 2), width: p.width, height: p.height });
  }, [pageRef, groupRef, resultId]);

  useLayoutEffect(() => {
    measure();
  }, [measure, chosen]);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => measure());
    if (pageRef.current) observer.observe(pageRef.current);
    if (groupRef.current) observer.observe(groupRef.current);
    document.fonts?.ready.then(() => measure());
    return () => observer.disconnect();
  }, [measure, pageRef, groupRef]);

  if (!geometry) return null;
  const [tx, ty] = geometry.tie;
  const rx = geometry.ring / 2;
  const ry = rx * 0.72;
  return (
    <svg className={styles.thread} width={geometry.width} height={geometry.height} viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true" focusable="false">
      {/* A new key per choice replays the draw; a resize only moves it. */}
      <g key={chosen} className={styles.threadDraw}>
        <circle cx={geometry.start[0]} cy={geometry.start[1]} r="2.5" className={styles.threadDot} />
        <path d={geometry.d} pathLength={1} className={styles.threadLine} />
        <g className={styles.threadTie} style={{ transformOrigin: `${tx}px ${ty}px` }}>
          <circle cx={tx} cy={ty} r={ry * 0.75} className={styles.threadKnot} />
          <ellipse cx={tx} cy={ty} rx={rx} ry={ry} transform={`rotate(-28 ${tx} ${ty})`} />
          <ellipse cx={tx} cy={ty} rx={rx} ry={ry} transform={`rotate(32 ${tx} ${ty})`} />
        </g>
      </g>
    </svg>
  );
}
