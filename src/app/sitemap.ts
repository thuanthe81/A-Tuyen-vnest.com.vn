import type { MetadataRoute } from "next";
import { env } from "@/config/env";
import { site } from "@/config/site";
import { buildSitemap } from "@/seo/sitemap";
import { absoluteUrl } from "@/seo/urls";
import { getServices } from "@/server/services";

// Per request, for the same reason as robots.ts: the sitemap follows the running deployment, not the build.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!env.indexable) return [];
  const properties = await getServices().properties.listProperties(site.defaultLocale);
  return buildSitemap({ indexable: env.indexable, enabledLocales: site.enabledLocales, properties, absolute: absoluteUrl });
}
