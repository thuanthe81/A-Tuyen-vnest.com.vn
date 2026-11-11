"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { DEFAULT_LOCALE, resolveLocalized, type Locale, type Resolved } from "@/domain/locale";
import { LANG_COOKIE, LANG_PARAM, localeFromParam, withLocale } from "./preview-locale";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** The remembered preview language (the proxy's cookie), when there is one. */
export function rememberedLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  const entry = document.cookie.split("; ").find((part) => part.startsWith(`${LANG_COOKIE}=`));
  return localeFromParam(entry?.slice(LANG_COOKIE.length + 1));
}

export function rememberLocale(locale: Locale) {
  document.cookie = `${LANG_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

/**
 * The language of the private review pages. It follows the address (`?lang=en`), so a switch, Back and refresh all agree
 * with what the URL says. A page restored from a cache in the other language (Back after a switch) is replaced by the same
 * page in the remembered language: the owner chose that Back returns to the previous page in the chosen language.
 */
export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const params = useSearchParams();
  const router = useRouter();
  const fromUrl = localeFromParam(params?.get(LANG_PARAM));
  const locale = params ? (fromUrl ?? DEFAULT_LOCALE) : initialLocale;

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const align = () => {
      const wanted = rememberedLocale();
      if (!wanted || wanted === locale) return;
      router.replace(withLocale(`${location.pathname}${location.search}${location.hash}`, wanted), { scroll: false });
    };
    align();
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) align();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [locale, router]);

  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** A copy object (LocalizedText fields) in the current language. */
export function useCopy<T>(copy: T): Resolved<T> {
  const locale = useLocale();
  return useMemo(() => resolveLocalized(copy, locale), [copy, locale]);
}
