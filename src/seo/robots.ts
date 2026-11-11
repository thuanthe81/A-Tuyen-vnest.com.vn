/**
 * What crawlers are told, as pure functions of the current settings.
 *
 * Both are evaluated per request (src/app/robots.ts, src/proxy.ts), never baked into a build:
 * a build made for production and then started as a preview must still refuse crawlers.
 */

export const NOINDEX_HEADER = { name: "X-Robots-Tag", value: "noindex, nofollow" } as const;

export interface RobotsRules {
  rules: { userAgent: string; allow?: string; disallow: string | string[] };
  sitemap?: string;
}

export function buildRobots(settings: { indexable: boolean }, absolute: (path: string) => string): RobotsRules {
  if (!settings.indexable) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/dev/"] }, sitemap: absolute("/sitemap.xml") };
}

/** The header every response carries unless the running deployment is indexable. */
export function robotsHeader(settings: { indexable: boolean }): typeof NOINDEX_HEADER | undefined {
  return settings.indexable ? undefined : NOINDEX_HEADER;
}
