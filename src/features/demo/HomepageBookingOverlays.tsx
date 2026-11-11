"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Homepage integration only: keep 02.1's inline panels in their form (outside-click,
 * focus and shared booking state remain unchanged), but fit their actual dimensions
 * to the viewport. Native mobile dialogs already live in the browser's top layer.
 */
export function HomepageBookingOverlays({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const panels = new Map<HTMLElement, string | null>();
    let frame = 0;
    const fit = () => {
      frame = 0;
      const viewport = window.visualViewport;
      const edge = 16;
      const headerEl = host.querySelector<HTMLElement>("header");
      const headerBottom = headerEl ? Math.max(0, headerEl.getBoundingClientRect().bottom) : 0;
      const left = (viewport?.offsetLeft ?? 0) + edge;
      const top = Math.max((viewport?.offsetTop ?? 0) + edge, headerBottom + 8);
      const right = left + (viewport?.width ?? innerWidth) - edge * 2;
      const bottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? innerHeight) - edge;
      for (const panel of panels.keys()) {
        if (!panel.isConnected || !panel.getClientRects().length) continue;
        const anchor = panel.parentElement;
        if (!anchor) continue;
        panel.style.maxHeight = `${bottom - top}px`;
        panel.style.overflowY = "auto";
        panel.style.overscrollBehavior = "contain";
        const a = anchor.getBoundingClientRect();
        const p = panel.getBoundingClientRect();
        // Prefer below if it fits, otherwise above; very short viewports scroll
        // inside the panel instead of losing its controls beyond the screen.
        const y = a.bottom + edge + p.height <= bottom ? a.bottom + edge
          : a.top - edge - p.height >= top ? a.top - edge - p.height
          : Math.max(top, Math.min(a.bottom + edge, bottom - p.height));
        const x = Math.max(left, Math.min(a.left, right - p.width));
        panel.style.top = `${y - a.top}px`;
        panel.style.bottom = "auto";
        panel.style.left = `${x - a.left}px`;
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(fit); };
    const resize = new ResizeObserver(schedule);
    const discover = () => {
      for (const [panel] of panels) {
        if (!host.contains(panel)) { resize.unobserve(panel); panels.delete(panel); }
      }
      host.querySelectorAll<HTMLElement>('form[role="search"] div[role="dialog"]').forEach(panel => {
        if (!panels.has(panel)) {
          panels.set(panel, panel.getAttribute("style"));
          resize.observe(panel);
        }
      });
      fit();
    };
    const mutations = new MutationObserver(discover);
    mutations.observe(host, { childList: true, subtree: true });
    discover();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      resize.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
      for (const [panel, style] of panels) {
        if (style === null) panel.removeAttribute("style");
        else panel.setAttribute("style", style);
      }
    };
  }, []);
  return (
    <div
      ref={root}
      style={
        {
          "--bk-cta": "#9A683C", // text-safe Copper Bronze (WCAG AA under white text), 25/10/2026
          "--bk-cta-hover": "#8F6036",
          "--bk-on-cta": "#FFFFFF",
          "--vn-capsule": "#FFFFFF",
          "--vn-capsule-field": "#F1ECE4",
          "--vn-ink": "#37412F",
          "--vn-ink-muted": "#8A8173",
          "--vn-action": "#9A683C",
          "--vn-action-hover": "#8F6036",
          "--vn-focus": "#37412F",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
