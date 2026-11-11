import { env } from "@/config/env";

/** Absolute URL on the public origin, for canonical links, sitemaps and structured data. */
export function absoluteUrl(path: string): string {
  return new URL(path, env.siteUrl).toString();
}
