import { notFound } from "next/navigation";
import { env } from "@/config/env";
import { ServiceAccordion } from "@/features/partner/ServiceAccordion";
import { servicePhoto } from "@/features/partner/selection-picture";
import { reviewAccess } from "@/features/property-detail/review-access";
import { buildMetadata } from "@/seo/metadata";
import { PartnerPreview, readPreviewQuery, type PreviewQuery } from "../preview";

/** Hợp tác cùng VNest, Concept B · Visual Accordion (exploration, 8/11/2026; approved 9/11/2026, now on the homepage). Private, local, noindex. */
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({ title: "Hợp tác · phương án B", path: () => "/dev/partner-concepts/b", noindex: true });

const ACCESS = reviewAccess(env);

export default async function ConceptB({ searchParams }: { searchParams?: Promise<PreviewQuery> }) {
  if (!ACCESS.route) notFound();
  const { locale, service } = readPreviewQuery(searchParams ? await searchParams : {});
  return (
    <PartnerPreview concept="b" locale={locale}>
      <ServiceAccordion locale={locale} photo={servicePhoto()} initial={service ?? "van-hanh"} />
    </PartnerPreview>
  );
}
