import { buildMetadata } from "@/seo/metadata";
import { CuratedGallery } from "./CuratedGallery";

/** BRAND COLLECTION EXPLORATION, concept A. Isolated; not part of the homepage. Never indexed. */
export const metadata = buildMetadata({ title: "Khảo sát: bộ sưu tập thương hiệu A", path: () => "/dev/brand-collection/a", noindex: true });

export default async function BrandCollectionA({ searchParams }: { searchParams: Promise<{ areas?: string }> }) {
  const { areas } = await searchParams;
  return <CuratedGallery mode={areas === "sample" ? "sample" : "verified"} />;
}
