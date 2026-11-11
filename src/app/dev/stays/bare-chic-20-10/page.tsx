import { notFound } from "next/navigation";
import { Suspense } from "react";
import { env } from "@/config/env";
import { site } from "@/config/site";
import { localPhotoLookup } from "@/content/drafts";
import { buildBareChic } from "@/content/drafts/bare-chic/record";
import type { PriceAudience } from "@/content/vnest-workbook/pricing";
import { WORKBOOK } from "@/content/vnest-workbook/workbook";
import { resolveProperty } from "@/domain/property";
import { PropertyDetail } from "@/features/property-detail/v2-2026-10-20/PropertyDetail";
import styles from "@/features/property-detail/v2-2026-10-20/PropertyDetail.module.css";
import { buildDetailView } from "@/features/property-detail/v2-2026-10-20/view";
import { PropertySearchBar, PropertySearchBarFallback } from "@/features/property-page/PropertySearchBar";
import { reviewAccess } from "@/features/property-detail/review-access";
import { buildMetadata } from "@/seo/metadata";
import { getServices } from "@/server/services";

/**
 * PRESERVED FOR COMPARISON: the Bare Chic prototype as delivered on 20/10/2026 (workbook v2, first
 * build), before the refinement of the same day. Not maintained; drawn by a frozen copy of its
 * components (src/features/property-detail/v2-2026-10-20). The current prototype is
 * /dev/stays/bare-chic. It shares the draft record, so record-level corrections show here too.
 *
 * Original header follows.
 *
 * BARE CHIC, PROPERTY DETAIL PROTOTYPE (section 05.2, 20/10/2026). Private and local; never
 * indexed; not the production route. The draft record (src/content/drafts/bare-chic, built from
 * VNest_Informationv2.xlsx) is drawn by src/features/property-detail.
 *
 * Booking: the frozen criteria bar (02.1) stays at the top, unchanged; it is the way into the
 * booking journey. The rooms section says that online booking is not connected, because no
 * provider knows Bare Chic (`record.booking.providers` is empty): nothing is simulated.
 *
 * Prices: the workbook's reference figures are drawn only in the private preview (a development,
 * non-indexable build), and only for a room whose own cell states them. With ?price=public the
 * page shows what a public build would: no number at all.
 */
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({ title: "Bare Chic · bản 20/10 (đối chiếu)", path: () => "/dev/stays/bare-chic-20-10", noindex: true });

// Local development only: 404 on any deployment, and no private preview on an unidentified host.
const ACCESS = reviewAccess(env);
const PRIVATE_PREVIEW = ACCESS.privatePreview;
const PATH = "/dev/stays/bare-chic-20-10";

export default async function BareChicPreview({ searchParams }: { searchParams: Promise<{ price?: string }> }) {
  if (!ACCESS.route) notFound();
  const simulated = (await searchParams).price === "public";
  const audience: PriceAudience = PRIVATE_PREVIEW && !simulated ? "private-preview" : "public";
  const { record, trace } = buildBareChic(localPhotoLookup);
  const draftSource = env.contentSource === "client-draft";
  const services = getServices();
  const served = draftSource ? await services.properties.getProperty("bare-chic", site.defaultLocale) : undefined;
  const property = served ?? resolveProperty(record, site.defaultLocale, site.enabledLocales)!;
  const options = draftSource
    ? (await services.properties.listProperties(site.defaultLocale)).map((p) => ({ id: p.id, slug: p.slug, name: p.identity.name, area: p.place.area.name }))
    : [{ id: property.id, slug: property.slug, name: property.identity.name, area: property.place.area.name }];

  const view = buildDetailView(trace, { audience, bookingConnected: Object.keys(record.booking.providers).length > 0 });
  const received = `${WORKBOOK.received.slice(8, 10)}/${WORKBOOK.received.slice(5, 7)}`;

  return (
    <>
      <p className={styles.review}>
        <strong>Bản 20/10, giữ lại để đối chiếu</strong> · Dữ liệu từ bảng VNest ({received}), chưa duyệt.{" "}
        {audience === "private-preview"
          ? "Giá tham khảo lấy nguyên văn từ bảng VNest: chưa xác minh, chưa rõ tiền tệ, đơn vị và thuế; không phải giá đặt phòng."
          : "Giá chưa được duyệt để công bố, nên trang không hiện con số."}
        {simulated ? <a href={PATH}>Trở lại bản xem trước riêng</a> : audience === "private-preview" ? <a href={`${PATH}?price=public`}>Xem như bản công khai</a> : null}
      </p>
      <Suspense fallback={<PropertySearchBarFallback />}>
        <PropertySearchBar slug={property.slug} timeZone={property.place.timeZone} options={options} mockEnabled={false} />
      </Suspense>
      <PropertyDetail property={property} view={view} />
    </>
  );
}
