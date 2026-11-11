import { buildMetadata } from "@/seo/metadata";
import { ConnectedIndexOriginal } from "./ConnectedIndex";

/** Concept B as first reviewed on 15/10/2026, before the refinement: kept for comparison. Never indexed. */
export const metadata = buildMetadata({ title: "Khảo sát: bộ sưu tập thương hiệu B (bản gốc)", path: () => "/dev/brand-collection/b-original", noindex: true });

export default async function BrandCollectionBOriginal({ searchParams }: { searchParams: Promise<{ areas?: string }> }) {
  const { areas } = await searchParams;
  return <ConnectedIndexOriginal mode={areas === "sample" ? "sample" : "verified"} />;
}
