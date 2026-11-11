import { DEFAULT_LOCALE, isLocale, type Locale } from "@/domain/locale";

/**
 * PRIVATE BILINGUAL PREVIEW (owner-approved plan, 6/11/2026: docs/i18n/BILINGUAL-PLAN.md).
 *
 * On the private review routes (`/dev/*`) the language is `?lang=en`; Vietnamese has no parameter. The proxy remembers the
 * choice in a cookie and adds `lang=en` to any review page opened without it, so every link and booking hand-off keeps the
 * language without each link builder knowing about it. The proxy hands the locale to the server in a request header.
 * Public bilingual routes (`/en/...`) are a release step, not this mechanism.
 */
export const LANG_PARAM = "lang";
export const LANG_COOKIE = "vnest-lang";
export const LOCALE_HEADER = "x-vnest-locale";
/** Only these paths take part in the preview. Public routes stay Vietnamese until release. */
export const PREVIEW_PREFIX = "/dev/";

export function isPreviewPath(pathname: string): boolean {
  return pathname.startsWith(PREVIEW_PREFIX);
}

/** The locale an address asks for: `lang=en` is English, anything else Vietnamese. */
export function localeFromParam(value: string | null | undefined): Locale | null {
  return value && isLocale(value) ? value : null;
}

/**
 * The same address in another language: `lang=en` is set for English and removed for Vietnamese; every other parameter
 * and the hash are kept, so dates, guests, rooms and room choices travel with the switch.
 */
export function withLocale(href: string, locale: Locale, base = "http://vnest.local"): string {
  const url = new URL(href, base);
  if (locale === DEFAULT_LOCALE) url.searchParams.delete(LANG_PARAM);
  else url.searchParams.set(LANG_PARAM, locale);
  const query = url.searchParams.toString();
  return `${url.pathname}${query ? `?${query}` : ""}${url.hash}`;
}
