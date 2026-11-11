import type { Locale } from "@/domain/locale";
import type { ServiceId } from "@/features/demo/owner-journey";
import { DEMO_HOME } from "@/features/demo/links";
import { withLocale } from "@/features/locale/preview-locale";

/**
 * Where the partner journey lives in the private preview. The dedicated page sits under the demo homepage, so it shares
 * its header, language preview and access rule (local only, noindex). Its public address is planned as `/hop-tac`, once
 * VNest approves the page and the homepage itself leaves `/dev/demo` (docs/qa/partner-page-2026-11-09/HANDOFF.md).
 */
export const PARTNER_PAGE = `${DEMO_HOME}/hop-tac`;

/** The consultation form's anchor, on the homepage and on the partner page. */
export const CONSULTATION_ANCHOR = "tu-van";

/** The partner page in one language (`?lang=en` for English, nothing for Vietnamese). */
export const partnerPageHref = (locale: Locale) => withLocale(PARTNER_PAGE, locale);

/**
 * A service CTA's address: the consultation form of `page` with that service chosen (`?dich-vu=`, read by the form on
 * load). It works without script and in a new tab; on the page itself the CTA scrolls to the form instead.
 */
export function consultationHref(service: ServiceId, locale: Locale, page: string = DEMO_HOME): string {
  // On the homepage, `intro=0` skips the opening animation: the visitor is going to the form.
  const params = new URLSearchParams(page === DEMO_HOME ? { intro: "0", "dich-vu": service } : { "dich-vu": service });
  return withLocale(`${page}?${params.toString()}#${CONSULTATION_ANCHOR}`, locale);
}
