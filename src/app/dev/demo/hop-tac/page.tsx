import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { env } from "@/config/env";
import { readSelectionManifest } from "@/content/vnest-workbook/selection-photos";
import { readClientProperties } from "@/content/vnest-workbook/records";
import { resolveLocalized } from "@/domain/locale";
import { DemoFooter } from "@/features/demo/DemoFooter";
import { SiteHeader } from "@/features/demo/SiteHeader";
import demoStyles from "@/features/demo/Demo.module.css";
import { requestLocale } from "@/features/locale/request-locale";
import { brandFamily } from "@/features/partner/brand-family";
import { PartnerPage } from "@/features/partner/page/PartnerPage";
import { PARTNER_META, PARTNER_PHOTOS } from "@/features/partner/partner-page-content";
import { PARTNER_PAGE } from "@/features/partner/routes";
import { selectionPicture, servicePhoto } from "@/features/partner/selection-picture";
import { reviewAccess } from "@/features/property-detail/review-access";
import { consultationMode } from "@/server/services";
import { buildMetadata } from "@/seo/metadata";

/**
 * HỢP TÁC CÙNG VNEST, the dedicated page for property owners (owner brief, 9/11/2026). Private review route: local only
 * (same `reviewAccess` rule as the demo homepage) and never indexed (noindex here, the proxy's header and robots.txt's
 * `/dev/` exclusion). Its planned public address is `/hop-tac`, once VNest approves the content and the page.
 * The language follows the private preview (`?lang=en`, decided by the proxy).
 */
export const dynamic = "force-dynamic";

const ACCESS = reviewAccess(env);

export async function generateMetadata(): Promise<Metadata> {
  const locale = await requestLocale();
  return buildMetadata({
    title: resolveLocalized(PARTNER_META.title, locale),
    description: resolveLocalized(PARTNER_META.description, locale),
    locale,
    path: () => PARTNER_PAGE,
    noindex: true,
  });
}

export default async function PartnerRoute() {
  if (!ACCESS.route) notFound();
  const locale = await requestLocale();
  const records = readClientProperties();
  const manifest = readSelectionManifest();
  const family = brandFamily(records);
  return (
    <>
      <SiteHeader />
      <main className={demoStyles.page}>
        <PartnerPage
          locale={locale}
          family={family}
          delivery={consultationMode()}
          photos={{
            hero: selectionPicture(PARTNER_PHOTOS.hero.n, PARTNER_PHOTOS.hero.altEn, manifest),
            why: selectionPicture(PARTNER_PHOTOS.why.n, PARTNER_PHOTOS.why.altEn, manifest),
            service: servicePhoto(manifest),
          }}
        />
      </main>
      <DemoFooter variant="minimal" />
    </>
  );
}
