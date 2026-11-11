"use client";

import { useEffect, useSyncExternalStore } from "react";

const SCENARIO_KEY = "vnest:mock-scenario";
const nothingToWatch = () => () => undefined;

function storedScenario(): string | null {
  try {
    return window.sessionStorage.getItem(SCENARIO_KEY);
  } catch {
    return null;
  }
}

/**
 * DEVELOPMENT ONLY. Which simulated scenario the mock provider is asked for. It comes from
 * the URL (`mock=`) and is remembered for the tab, because a search from the booking bar
 * builds a fresh URL without it. Returns undefined when the mock provider is not in use.
 */
export function useMockScenario(fromUrl: string | undefined, enabled: boolean): string | undefined {
  const stored = useSyncExternalStore(nothingToWatch, storedScenario, () => null);
  useEffect(() => {
    if (!enabled || !fromUrl) return;
    try {
      window.sessionStorage.setItem(SCENARIO_KEY, fromUrl);
    } catch {
      // Storage can be unavailable; the scenario then simply lasts for one page.
    }
  }, [enabled, fromUrl]);
  return enabled ? (fromUrl ?? stored ?? undefined) : undefined;
}
