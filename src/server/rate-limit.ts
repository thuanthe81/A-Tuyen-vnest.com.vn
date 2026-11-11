/**
 * A small in-memory sliding-window limiter. Keys should already be hashed (no raw client address is stored).
 *
 * In memory means per server instance: on a platform that runs several instances, each counts on its own, so the
 * effective limit is higher. Good enough as a first line; a shared store (Redis, the platform's firewall / rate-limit
 * rules) is the upgrade path (BACKEND-HANDOFF.md §11.6).
 */

export interface Window {
  windowMs: number;
  max: number;
}

export interface RateLimiter {
  /** Records one hit for `key` and says whether it is within every window. A refused hit is still counted. */
  hit(key: string, now: number): boolean;
}

export function createRateLimiter(windows: readonly Window[], maxKeys = 10_000): RateLimiter {
  const longest = Math.max(...windows.map((w) => w.windowMs));
  const hits = new Map<string, number[]>();
  let lastSweep = 0;

  const sweep = (now: number) => {
    if (now - lastSweep < 60_000 && hits.size < maxKeys) return;
    lastSweep = now;
    for (const [key, times] of hits) {
      const kept = times.filter((t) => now - t < longest);
      if (kept.length) hits.set(key, kept);
      else hits.delete(key);
    }
    // Still full after the sweep: drop the oldest keys rather than grow without bound.
    while (hits.size >= maxKeys) hits.delete(hits.keys().next().value as string);
  };

  return {
    hit(key, now) {
      sweep(now);
      const times = (hits.get(key) ?? []).filter((t) => now - t < longest);
      times.push(now);
      hits.set(key, times);
      return windows.every((w) => times.filter((t) => now - t < w.windowMs).length <= w.max);
    },
  };
}
