import { notFound } from "next/navigation";
import { env } from "@/config/env";
import { PartnerShowcase } from "@/features/partner-concepts/PartnerShowcase";
import { servicePhoto } from "@/features/partner/selection-picture";
import { reviewAccess } from "@/features/property-detail/review-access";
import { buildMetadata } from "@/seo/metadata";
import { PartnerPreview, readPreviewQuery, type PreviewQuery } from "../preview";

/** Hợp tác cùng VNest, Concept A · Editorial Service Showcase (exploration, 8/11/2026). Private, local, noindex. */
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({ title: "Hợp tác · phương án A", path: () => "/dev/partner-concepts/a", noindex: true });

const ACCESS = reviewAccess(env);

export default async function ConceptA({ searchParams }: { searchParams?: Promise<PreviewQuery> }) {
  if (!ACCESS.route) notFound();
  const { locale, service } = readPreviewQuery(searchParams ? await searchParams : {});
  return (
    <PartnerPreview concept="a" locale={locale}>
      <PartnerShowcase locale={locale} photo={servicePhoto()} initial={service ?? "van-hanh"} />
    </PartnerPreview>
  );
}
