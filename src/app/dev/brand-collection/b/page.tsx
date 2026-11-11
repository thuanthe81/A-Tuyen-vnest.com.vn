import { buildMetadata } from "@/seo/metadata";
import { ConnectedIndex } from "./ConnectedIndex";

/** BRAND COLLECTION EXPLORATION, concept B. Isolated; not part of the homepage. Never indexed. */
export const metadata = buildMetadata({ title: "Khảo sát: bộ sưu tập thương hiệu B", path: () => "/dev/brand-collection/b", noindex: true });

export default async function BrandCollectionB({ searchParams }: { searchParams: Promise<{ areas?: string }> }) {
  const { areas } = await searchParams;
  return <ConnectedIndex mode={areas === "sample" ? "sample" : "verified"} />;
}
