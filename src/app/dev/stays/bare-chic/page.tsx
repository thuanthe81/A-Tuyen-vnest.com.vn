import { notFound } from "next/navigation";
import { Suspense } from "react";
import { env } from "@/config/env";
import { site } from "@/config/site";
import { localPhotoLookup } from "@/content/drafts";
import { buildBareChic } from "@/content/drafts/bare-chic/record";
import { resolvePropertySpaceGroups } from "@/content/drafts/property-spaces";
import { cityNote } from "@/content/vnest-workbook/city-notes";
import { RELEASE_HOLDS } from "@/content/vnest-workbook/media";
import type { PriceAudience } from "@/content/vnest-workbook/pricing";
import { readClientProperties } from "@/content/vnest-workbook/records";
import { WORKBOOK } from "@/content/vnest-workbook/workbook";
import { resolveProperty, type Property } from "@/domain/property";
import { CityNotes } from "@/features/city-notes/CityNotes";
import { buildCityNotesView } from "@/features/city-notes/view";
import { BookNowButton } from "@/features/demo/BookingCta";
import { stayFromQuery } from "@/features/demo/booking-flow";
import { demoBookingOptions } from "@/features/demo/booking-options";
import { DemoLinkGuard } from "@/features/demo/DemoLinkGuard";
import { DemoPropertyShell } from "@/features/demo/DemoPropertyShell";
import { SiteHeader } from "@/features/demo/SiteHeader";
import { PropertyDetail } from "@/features/property-detail/PropertyDetail";
import styles from "@/features/property-detail/PropertyDetail.module.css";
import { buildDetailView } from "@/features/property-detail/view";
import { PropertySearchBar, PropertySearchBarFallback } from "@/features/property-page/PropertySearchBar";
import { reviewAccess } from "@/features/property-detail/review-access";
import { buildMetadata } from "@/seo/metadata";
import { getServices } from "@/server/services";
import { clientCollection } from "../../brand-collection/client/adapter";

/**
 * BARE CHIC, PROPERTY DETAIL PROTOTYPE (section 05.2, 20/10/2026; refined the same day; the first
 * build is kept at /dev/stays/bare-chic-20-10 for comparison). Private and local; never
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
 *
 * ?view=demo, the CEO presentation (23/10/2026), reached from /dev/demo: the public state (no
 * figures, no review notes), the demo site header in place of the review notice, and the three
 * photographs that show a person left out (RELEASE_HOLDS, Q15), so every gallery count is of what
 * is shown. Since VNest V3 Stage 1 (24/10/2026, CEO R02/R03) the 02.1 compact bar sits in the demo
 * header itself (one bar, not two), its action reads BOOK NOW, and the photo viewers and room
 * drawers carry BOOK NOW too (`DemoPropertyShell`). ?view=demo&search=0 shows the header alone. VNest City Notes, the TP. Hồ Chí Minh list, follows Vị trí in every
 * view.
 */
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({ title: "Bare Chic · bản xem trước", path: () => "/dev/stays/bare-chic", noindex: true });

// Local development only: 404 on any deployment, and no private preview on an unidentified host.
const ACCESS = reviewAccess(env);
const PRIVATE_PREVIEW = ACCESS.privatePreview;
const PATH = "/dev/stays/bare-chic";

/** The photographs on hold (a person is visible; Q15), removed from every gallery and room list. */
const HELD = new Set(RELEASE_HOLDS.filter((hold) => hold.authorisation !== "granted").map((hold) => hold.key));
function withoutHeldPhotos(property: Property): Property {
  const keep = (ids: readonly string[]) => ids.filter((id) => !HELD.has(id));
  return {
    ...property,
    rooms: property.rooms.map((room) => ({ ...room, mediaIds: keep(room.mediaIds) })),
    presentation: { ...property.presentation, sections: property.presentation.sections.map((section) => ("mediaIds" in section && section.mediaIds ? { ...section, mediaIds: keep(section.mediaIds) } : section)) },
  };
}

export default async function BareChicPreview({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!ACCESS.route) notFound();
  const query = await searchParams;
  const demo = query.view === "demo";
  const showSearch = !demo || query.search !== "0";
  const simulated = query.price === "public" || demo;
  const audience: PriceAudience = PRIVATE_PREVIEW && !simulated ? "private-preview" : "public";
  const { record, trace } = buildBareChic(localPhotoLookup);
  const draftSource = env.contentSource === "client-draft";
  const services = getServices();
  const served = draftSource ? await services.properties.getProperty("bare-chic", site.defaultLocale) : undefined;
  const resolved = served ?? resolveProperty(record, site.defaultLocale, site.enabledLocales)!;
  const property = query.holds === "include" ? resolved : withoutHeldPhotos(resolved);
  const options = draftSource
    ? (await services.properties.listProperties(site.defaultLocale)).map((p) => ({ id: p.id, slug: p.slug, name: p.identity.name, area: p.place.area.name }))
    : [{ id: property.id, slug: property.slug, name: property.identity.name, area: property.place.area.name }];

  const view = buildDetailView(trace, { audience, bookingConnected: Object.keys(record.booking.providers).length > 0 });
  const note = cityNote("ho-chi-minh");
  const cityNotesView = note ? buildCityNotesView(note, { audience }) : null;
  const extraGroups = resolvePropertySpaceGroups("bare-chic", localPhotoLookup);
  const received = `${WORKBOOK.received.slice(8, 10)}/${WORKBOOK.received.slice(5, 7)}`;

  if (demo && showSearch) {
    const demoOptions = demoBookingOptions(clientCollection(readClientProperties()));
    return (
      <DemoPropertyShell initial={stayFromQuery(query, property.slug)} options={demoOptions}>
        <PropertyDetail
          property={property}
          view={view}
          extraGroups={extraGroups}
          cityNotes={cityNotesView ? <CityNotes view={cityNotesView} /> : undefined}
          bookAction={({ room, place }) => <BookNowButton key={`${place}-${room ?? property.id}`} room={room} tone={place === "viewer" ? "dark" : "light"} block={place === "drawer"} />}
        />
      </DemoPropertyShell>
    );
  }

  return (
    <>
      {demo ? (
        <>
          <SiteHeader />
          <DemoLinkGuard />
        </>
      ) : (
        <p className={styles.review}>
          <strong>Bản xem trước riêng</strong> · Dữ liệu VNest {received}, chưa duyệt ·{" "}
          {audience === "private-preview" ? "Giá tham khảo chưa xác minh, không phải giá đặt phòng." : "Bản công khai: không hiện giá."}
          {simulated ? <a href={PATH}>Trở lại bản xem trước riêng</a> : audience === "private-preview" ? <a href={`${PATH}?price=public`}>Xem như bản công khai</a> : null}
        </p>
      )}
      {showSearch ? (
        <Suspense fallback={<PropertySearchBarFallback />}>
          <PropertySearchBar slug={property.slug} timeZone={property.place.timeZone} options={options} mockEnabled={false} />
        </Suspense>
      ) : null}
      <PropertyDetail property={property} view={view} extraGroups={extraGroups} cityNotes={cityNotesView ? <CityNotes view={cityNotesView} /> : undefined} />
    </>
  );
}
