import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/config/env";
import { DEFAULT_LOCALE } from "@/domain/locale";
import { LANG_COOKIE, LANG_PARAM, LOCALE_HEADER, isPreviewPath, localeFromParam } from "@/features/locale/preview-locale";
import { robotsHeader } from "@/seo/robots";

/**
 * The request-time indexing lock. Unless the deployment that is running right now is
 * indexable, every response says noindex, whatever settings the build was made with.
 *
 * next.config.ts keeps the build-time lock, so both must agree before anything can be
 * indexed: a production build started as a preview is refused here, and a preview build
 * started as production is refused there.
 *
 * Bilingual preview (private `/dev/*` routes only, docs/i18n/BILINGUAL-PLAN.md): `?lang=en` selects English and is
 * remembered in a cookie; a review page opened without `lang` while English is remembered is redirected to carry it. The
 * locale reaches the server as a request header. Public routes are untouched.
 */
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const preview = isPreviewPath(pathname);
  const asked = preview ? localeFromParam(searchParams.get(LANG_PARAM)) : null;
  const remembered = request.cookies.get(LANG_COOKIE)?.value;

  const rememberedLocale = localeFromParam(remembered);
  if (preview && !asked && rememberedLocale && rememberedLocale !== DEFAULT_LOCALE) {
    const target = request.nextUrl.clone();
    target.searchParams.set(LANG_PARAM, rememberedLocale);
    return withRobots(NextResponse.redirect(target, 307));
  }

  const locale = asked ?? DEFAULT_LOCALE;
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, locale);
  const response = NextResponse.next({ request: { headers } });
  if (asked && remembered !== asked) {
    response.cookies.set(LANG_COOKIE, asked, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  }
  return withRobots(response);
}

function withRobots(response: NextResponse): NextResponse {
  const header = robotsHeader(env);
  if (header) response.headers.set(header.name, header.value);
  return response;
}

/**
 * Next's own background prefetches skip the proxy (Phase D final fixes, 10/11/2026). On English review pages most links
 * carry no `lang` (the proxy adds it, see above). With the redirect, every visible link's prefetch went to a 307, then
 * Next's own 307 to restore its `_rsc` marker, then a payload Next drops unread, a request that never ends (8 English
 * browser tests timed out waiting for network idle). A prefetch is never a page view, so it needs neither the redirect nor
 * the noindex header (next.config.ts keeps the build-time one). Real navigations and full loads still run the proxy:
 * a click on such a link is redirected to `lang=en` exactly as before, and stays a soft navigation.
 * Matcher syntax: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md (`missing`).
 */
export const config = {
  matcher: [{ source: "/:path*", missing: [{ type: "header", key: "next-router-prefetch" }] }],
};
