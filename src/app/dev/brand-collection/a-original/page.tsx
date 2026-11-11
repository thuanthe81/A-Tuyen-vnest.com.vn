import { buildMetadata } from "@/seo/metadata";
import { CuratedGallery } from "../a/CuratedGallery";

/** Concept A as first reviewed on 15/10/2026, before the copper thread: kept for comparison. Never indexed. */
export const metadata = buildMetadata({ title: "Khảo sát: bộ sưu tập thương hiệu A (bản gốc)", path: () => "/dev/brand-collection/a-original", noindex: true });

export default async function BrandCollectionAOriginal({ searchParams }: { searchParams: Promise<{ areas?: string }> }) {
  const { areas } = await searchParams;
  return <CuratedGallery mode={areas === "sample" ? "sample" : "verified"} thread={false} />;
}
