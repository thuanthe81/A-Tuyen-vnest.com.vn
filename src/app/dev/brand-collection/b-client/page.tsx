import { env } from "@/config/env";
import { buildMetadata } from "@/seo/metadata";
import { ConnectedIndex } from "../b/ConnectedIndex";
import { readClientProperties } from "@/content/vnest-workbook/records";
import { readPhotoManifest } from "@/content/vnest-workbook/photo-manifest";
import { cardPrices, type PriceAudience } from "@/content/vnest-workbook/pricing";
import { clientCollection } from "../client/adapter";
import { ClientReviewBar } from "../client/ClientReviewBar";
import { withPhotos } from "../client/photos";

/**
 * BRAND COLLECTION, concept B with VNest's own content (03.3-C1, 16–17/10/2026). Isolated; not
 * part of the homepage. Never indexed. Names, brands and cities come from the client workbook
 * through a traced adapter (../client). Pictures: an authorised local photograph where G2 allows
 * one (../client/photos.ts), otherwise a labelled placeholder; Area is hidden. Proposal: docs/content/03.3-C1-PROPOSAL.md.
 *
 * Prices: the workbook's indicative figures are drawn only in a private local preview, which is
 * a development, non-indexable build. Anywhere else, and with ?price=public, every card shows the
 * no-number fallback, as a public build must until VNest approves prices for display.
 */
export const metadata = buildMetadata({ title: "Khảo sát: bộ sưu tập thương hiệu B · dữ liệu VNest", path: () => "/dev/brand-collection/b-client", noindex: true });

const PRIVATE_PREVIEW = env.deployEnv === "development" && !env.indexable;

export default async function BrandCollectionBClient({ searchParams }: { searchParams: Promise<{ price?: string }> }) {
  const simulated = (await searchParams).price === "public";
  const audience: PriceAudience = PRIVATE_PREVIEW && !simulated ? "private-preview" : "public";
  // Photographs only in the private local preview, and only once authorised and derived.
  const records = readClientProperties();
  const content = PRIVATE_PREVIEW ? withPhotos(clientCollection(records), records, readPhotoManifest()) : clientCollection(records);
  // The landmark and the page heading the exploration pages lack. The h1 is visually hidden so the
  // composition is unchanged: on the homepage the hero carries the visible h1.
  return (
    <main>
      <h1 className="sr-only">Bộ sưu tập thương hiệu VNest · bản xem trước với dữ liệu VNest</h1>
      <ConnectedIndex mode="verified" content={content} showArea={false} review={<ClientReviewBar audience={audience} simulated={simulated} />} prices={cardPrices(audience)} />
    </main>
  );
}
