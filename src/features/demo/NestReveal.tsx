"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import {
  VNEST_DESCRIPTOR_PATHS,
  VNEST_LOCKUP_VIEWBOX,
  VNEST_NEST_RINGS,
  VNEST_SYMBOL_PATH,
  VNEST_WORDMARK_PATHS,
} from "./nest-reveal-geometry";
import {
  DEFAULT_NEST_REVEAL_VARIANT,
  NEST_REVEAL_TIMING,
  introPlayedInThisDocument,
  isDocumentEntry,
  markIntroPlayedInThisDocument,
  resolveInitialNestRevealPhase,
  resolveNestRevealDecision,
  type NestRevealDecision,
  type NestRevealPhase,
  type NestRevealVariant,
} from "./nest-reveal-state";
import styles from "./NestReveal.module.css";

export type { NestRevealPhase };

const RING_GROUP_CLASSES = [
  styles.ringGroup1,
  styles.ringGroup2,
  styles.ringGroup3,
  styles.ringGroup4,
] as const;

const MASK_STROKE_CLASSES = [
  styles.maskStroke1,
  styles.maskStroke2,
  styles.maskStroke3,
  styles.maskStroke4,
] as const;

export interface NestRevealProps {
  /** Optional server-forwarded ?intro= value if available */
  initialIntroParam?: string;
}

/**
 * The Nest Reveal — VNest V3 Signature Entrance Experience.
 *
 * Uses the exact approved VNest circular nest symbol and wordmark geometry:
 * - Phase 1 (The Beginning): Warm ivory canvas (#F1ECE4); first copper stroke
 *   (#A87444) begins drawing in the center.
 * - Phase 2 (Forming the Nest): Remaining original nest strokes progressively
 *   draw and converge into one complete nest.
 * - Phase 3 (Brand Reveal): Symbol settles into its exact approved compound
 *   form as the VNest wordmark (#37412F) and descriptor (#A87444) fade in.
 * - Phase 4 (Seamless Entrance): Softly dissolves to reveal the live homepage
 *   already rendered and interactive underneath.
 */
export function NestReveal({ initialIntroParam }: NestRevealProps = {}) {
  const initialVariant: NestRevealVariant =
    initialIntroParam?.trim().toLowerCase() === "draw"
      ? "draw"
      : initialIntroParam?.trim().toLowerCase() === "converge"
        ? "converge"
        : DEFAULT_NEST_REVEAL_VARIANT;

  const [phase, setPhase] = useState<NestRevealPhase>(() =>
    resolveInitialNestRevealPhase(initialIntroParam),
  );
  const [variant, setVariant] = useState<NestRevealVariant>(initialVariant);
  const decisionRef = useRef<{
    key: string;
    decision: NestRevealDecision;
  } | null>(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const search =
      window.location.search ||
      (initialIntroParam ? `?intro=${initialIntroParam}` : "");
    const decisionKey = `${window.location.pathname}::${search}::${initialIntroParam ?? ""}`;

    if (!decisionRef.current || decisionRef.current.key !== decisionKey) {
      const prefersReducedMotion =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const entry = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;

      const decision = resolveNestRevealDecision({
        pathname: window.location.pathname,
        search,
        alreadyPlayedInDocument: introPlayedInThisDocument(),
        documentEntry: isDocumentEntry(window.location.pathname, entry?.name),
        prefersReducedMotion,
        defaultVariant: initialVariant,
      });

      // Kept per mount, so re-renders and React's development double effects reuse the same decision.
      decisionRef.current = { key: decisionKey, decision };

      if (decision.shouldMarkSeen) {
        // This document has played it: later mounts (client-side navigation, Back, the VI/EN switch) skip it.
        // A refresh or reload starts a new document, so it plays again.
        markIntroPlayedInThisDocument();
      }
    }

    const { decision } = decisionRef.current;
    setVariant(decision.variant);

    if (decision.action === "skip") {
      setPhase("complete");
      return;
    }

    if (decision.action === "static-reduced-motion") {
      setPhase("brand-reveal");
      const dissolveTimer = window.setTimeout(() => {
        setPhase("dissolving");
      }, NEST_REVEAL_TIMING.reducedMotionHoldMs);
      const completeTimer = window.setTimeout(() => {
        setPhase("complete");
      }, NEST_REVEAL_TIMING.reducedMotionHoldMs + NEST_REVEAL_TIMING.reducedMotionDissolveMs);

      return () => {
        window.clearTimeout(dissolveTimer);
        window.clearTimeout(completeTimer);
      };
    }

    setPhase("beginning");

    const formingTimer = window.setTimeout(() => {
      setPhase("forming");
    }, 150);

    const brandTimer = window.setTimeout(() => {
      setPhase("brand-reveal");
    }, 540);

    const dissolveTimer = window.setTimeout(() => {
      setPhase("dissolving");
    }, NEST_REVEAL_TIMING.revealMs);

    const completeTimer = window.setTimeout(() => {
      setPhase("complete");
    }, NEST_REVEAL_TIMING.totalMs);

    return () => {
      window.clearTimeout(formingTimer);
      window.clearTimeout(brandTimer);
      window.clearTimeout(dissolveTimer);
      window.clearTimeout(completeTimer);
    };
  }, [initialIntroParam, initialVariant]);

  if (phase === "checking" || phase === "complete") {
    return null;
  }

  const variantClass =
    variant === "draw" ? styles.variantDraw : styles.variantConverge;
  const overlayClass = [
    styles.overlay,
    variantClass,
    phase === "dissolving" ? styles.overlayDissolving : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={overlayClass}
      aria-hidden="true"
      data-vnest-reveal="true"
      data-vnest-reveal-phase={phase}
      data-vnest-reveal-variant={variant}
    >
      <div className={styles.stage}>
        <svg
          className={styles.lockupSvg}
          viewBox={VNEST_LOCKUP_VIEWBOX}
          focusable="false"
          aria-hidden="true"
        >
          <defs>
            <clipPath id="vnest-approved-symbol-clip">
              <path d={VNEST_SYMBOL_PATH} />
            </clipPath>
            {VNEST_NEST_RINGS.map((ring, index) => (
              <mask
                key={ring.id}
                id={`vnest-nest-mask-${ring.id}`}
                maskUnits="userSpaceOnUse"
                x="240"
                y="120"
                width="520"
                height="500"
              >
                <path
                  d={ring.centerline.d}
                  strokeWidth={96}
                  className={`${styles.maskStroke} ${MASK_STROKE_CLASSES[index] ?? ""}`}
                  style={
                    {
                      "--ring-len": `${ring.centerline.length}`,
                    } as CSSProperties
                  }
                />
              </mask>
            ))}
          </defs>

          {/* Phase 1 & 2: Original VNest symbol strokes progressively forming the nest */}
          <g
            clipPath={
              variant === "draw"
                ? "url(#vnest-approved-symbol-clip)"
                : undefined
            }
          >
            {VNEST_NEST_RINGS.map((ring, index) => (
              <g
                key={ring.id}
                className={RING_GROUP_CLASSES[index] ?? ""}
                data-vnest-ring={ring.id}
              >
                <path
                  d={ring.fillPath}
                  className={styles.ringFill}
                  mask={`url(#vnest-nest-mask-${ring.id})`}
                />
              </g>
            ))}
          </g>

          {/* Phase 3: Exact approved compound symbol settles into final locked geometry */}
          <path
            d={VNEST_SYMBOL_PATH}
            className={styles.settledSymbol}
            data-vnest-symbol-settled="true"
          />

          {/* Phase 3: Approved VNest wordmark (#37412F) */}
          <g className={styles.wordmarkGroup} data-vnest-wordmark="true">
            {VNEST_WORDMARK_PATHS.map((d, index) => (
              <path key={index} d={d} />
            ))}
          </g>

          {/* Phase 3: Existing small HOSPITALITY MANAGEMENT descriptor (#A87444) */}
          <g className={styles.descriptorGroup} data-vnest-descriptor="true">
            {VNEST_DESCRIPTOR_PATHS.map((d, index) => (
              <path key={index} d={d} />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
