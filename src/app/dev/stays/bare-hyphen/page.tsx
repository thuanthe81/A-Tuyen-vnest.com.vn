/**
 * BARE HYPHEN PROPERTY DETAIL PAGE (`/dev/stays/bare-hyphen`, VNest V3 Property Photography & Page Completion).
 *
 * Uses the established VNest property page system (`DemoPropertyShell`, `PropertyDetail`,
 * `PropertyGallery`, `PropertyRoomCollection`, `LocationAndPoliciesPanel`, `CityNotes`,
 * `RelatedProperties`) with Bare Hyphen's 4 physical units, 48 confidently attributed room
 * photographs, and 22 property-level photographs (`Exterior` & `Common Space`).
 */
import { notFound } from "next/navigation";
import { env } from "@/config/env";
import { site } from "@/config/site";
import { localPhotoLookup } from "@/content/drafts";
import { buildBareHyphen } from "@/content/drafts/bare-hyphen/record";
import { resolvePropertySpaceGroups } from "@/content/drafts/property-spaces";
import { cityNote } from "@/content/vnest-workbook/city-notes";
import type { PriceAudience } from "@/content/vnest-workbook/pricing";
import { readClientProperties } from "@/content/vnest-workbook/records";
import { selectionLookup } from "@/content/vnest-workbook/selection-photos";
import { resolveProperty } from "@/domain/property";
import { CityNotes } from "@/features/city-notes/CityNotes";
import { buildCityNotesView } from "@/features/city-notes/view";
import { BookNowButton } from "@/features/demo/BookingCta";
import { stayFromQuery } from "@/features/demo/booking-flow";
import { demoBookingOptions } from "@/features/demo/booking-options";
import { DemoPropertyShell } from "@/features/demo/DemoPropertyShell";
import { PropertyDetail } from "@/features/property-detail/PropertyDetail";
import { reviewAccess } from "@/features/property-detail/review-access";
import { buildDetailView } from "@/features/property-detail/view";
import { buildMetadata } from "@/seo/metadata";
import { clientCollection } from "../../brand-collection/client/adapter";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Bare Hyphen · bản trình diễn",
  path: () => "/dev/stays/bare-hyphen",
  noindex: true,
});

const photoLookup = (key: string) => (key.startsWith("sel-") ? selectionLookup()(key) : localPhotoLookup(key));

export default async function BareHyphenDemo({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  if (!reviewAccess(env).route) notFound();

  const query = await searchParams;
  const audience: PriceAudience =
    query.view === "private" || query.price === "private" ? "private-preview" : "public";
  const { record, trace } = buildBareHyphen(photoLookup);
  const property = resolveProperty(record, site.defaultLocale, site.enabledLocales);
  if (!property) notFound();

  const view = buildDetailView(trace, { audience, bookingConnected: false });
  const extraGroups = resolvePropertySpaceGroups("bare-hyphen", photoLookup);
  const note = cityNote("ho-chi-minh");
  const cityView = note ? buildCityNotesView(note, { audience }) : null;
  const options = demoBookingOptions(clientCollection(readClientProperties()));

  return (
    <DemoPropertyShell initial={stayFromQuery(query, property.slug)} options={options}>
      <PropertyDetail
        property={property}
        view={view}
        extraGroups={extraGroups}
        cityNotes={cityView ? <CityNotes view={cityView} /> : undefined}
        bookAction={({ room, place }) => (
          <BookNowButton
            key={`${place}-${room ?? property.id}`}
            room={room}
            tone={place === "viewer" ? "dark" : "light"}
            block={place === "drawer"}
          />
        )}
      />
    </DemoPropertyShell>
  );
}
