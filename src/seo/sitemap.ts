import { routes } from "@/config/routes";
import type { Locale } from "@/domain/locale";
import type { Property } from "@/domain/property";
import { isPublishable } from "@/domain/property";

export interface SitemapEntry {
  url: string;
  alternates?: { languages: Record<string, string> };
}

/**
 * The pages search engines are invited to. Empty unless the site is indexable, and only
 * publishable properties are ever listed, each in every language it is approved for.
 */
export function buildSitemap(input: {
  indexable: boolean;
  enabledLocales: readonly Locale[];
  properties: readonly Property[];
  absolute: (path: string) => string;
}): SitemapEntry[] {
  const { indexable, enabledLocales, properties, absolute } = input;
  if (!indexable) return [];

  const entry = (path: (locale: Locale) => string, locales: readonly Locale[]): SitemapEntry[] =>
    locales.map((locale) => ({
      url: absolute(path(locale)),
      ...(locales.length > 1
        ? { alternates: { languages: Object.fromEntries(locales.map((code) => [code, absolute(path(code))])) } }
        : {}),
    }));

  return [
    ...entry((locale) => routes.home(locale), enabledLocales),
    ...properties.filter(isPublishable).flatMap((property) => [
      ...entry((locale) => routes.property(property.slug, locale), property.availableLocales),
      ...property.rooms.flatMap((room) => entry((locale) => routes.room(property.slug, room.slug, locale), property.availableLocales)),
    ]),
  ];
}
