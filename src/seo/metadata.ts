import type { Metadata } from "next";
import { env } from "@/config/env";
import { site } from "@/config/site";
import type { Locale } from "@/domain/locale";
import { DEFAULT_LOCALE } from "@/domain/locale";

export interface PageSeo {
  title: string;
  /** From real content only. A missing description is omitted, never written to fill the gap. */
  description?: string;
  locale?: Locale;
  /** Builds this page's path in a given language, without query parameters. */
  path: (locale: Locale) => string;
  /** Languages this page exists in. Language alternates are emitted only when there is more than one. */
  locales?: readonly Locale[];
  /** For pages that must never be indexed: sample data, drafts, or anything that depends on dates. */
  noindex?: boolean;
  image?: { url: string; width: number; height: number; alt: string };
}

/**
 * Page metadata. The canonical URL never includes search parameters, so a property page
 * opened with dates still points search engines at the one indexable address.
 */
export function buildMetadata(page: PageSeo, settings: { indexable: boolean } = env): Metadata {
  const locale = page.locale ?? DEFAULT_LOCALE;
  const locales = page.locales ?? [locale];
  const canonical = page.path(locale);
  const indexed = settings.indexable && !page.noindex;

  return {
    title: page.title,
    ...(page.description ? { description: page.description } : {}),
    alternates: {
      canonical,
      ...(locales.length > 1
        ? { languages: { ...Object.fromEntries(locales.map((code) => [code, page.path(code)])), "x-default": page.path(DEFAULT_LOCALE) } }
        : {}),
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: page.title,
      ...(page.description ? { description: page.description } : {}),
      url: canonical,
      locale: site.ogLocale[locale],
      ...(page.image ? { images: [page.image] } : {}),
    },
    ...(indexed ? {} : { robots: { index: false, follow: settings.indexable } }),
  };
}
