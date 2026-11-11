"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DEMO_HOME, DEMO_LINKS } from "./links";

/**
 * CEO demo only (21/10/2026): keeps the presenter inside the demo when a component the demo places
 * unchanged links out of it. On Bare Chic, the booking bar's wrapper links "VNest" to `/` (still the
 * Phase 01 placeholder) and "Tất cả cơ sở" to `/stays`. A plain click on a same-origin link to
 * exactly those paths goes to the demo's home or its collection instead. Nothing in 02.1 or 02.2
 * changes: their hrefs stay as they are (open in a new tab, they still lead there), and a search
 * from the bar is not touched (it goes to /stays, which says no booking provider is connected).
 */
const REDIRECTS: Readonly<Record<string, string>> = { "/": DEMO_HOME, "/stays": DEMO_LINKS.discover };

export function DemoLinkGuard() {
  const router = useRouter();
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank") return;
      const url = new URL(anchor.href);
      const to = url.origin === location.origin ? REDIRECTS[url.pathname] : undefined;
      if (!to) return;
      event.preventDefault();
      event.stopPropagation();
      router.push(to);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);
  return null;
}
