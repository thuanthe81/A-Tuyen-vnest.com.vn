import { headers } from "next/headers";
import { DEFAULT_LOCALE, type Locale } from "@/domain/locale";
import { LOCALE_HEADER, localeFromParam } from "./preview-locale";

/** The locale of this request on the private review routes, as the proxy decided it (Vietnamese otherwise). */
export async function requestLocale(): Promise<Locale> {
  return localeFromParam((await headers()).get(LOCALE_HEADER)) ?? DEFAULT_LOCALE;
}
