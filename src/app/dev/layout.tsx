import type { ReactNode } from "react";
import { LocaleProvider } from "@/features/locale/LocaleProvider";
import { requestLocale } from "@/features/locale/request-locale";

/**
 * Private review routes: the bilingual preview (`?lang=en`, docs/i18n/BILINGUAL-PLAN.md). The proxy decides the locale;
 * client components read it from LocaleProvider, server pages from `requestLocale()`.
 */
export default async function DevLayout({ children }: { children: ReactNode }) {
  return <LocaleProvider initialLocale={await requestLocale()}>{children}</LocaleProvider>;
}
