import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CardVisual } from "@/components/property-card/CardVisual";
import { toCardImage } from "@/components/property-card/model";
import { env } from "@/config/env";
import { MOCK_AVAILABILITY_SCENARIOS } from "@/config/mock-scenarios";
import { routes } from "@/config/routes";
import { site } from "@/config/site";
import { galleryMedia, isPublishable } from "@/domain/property";
import { resultsCopy } from "@/features/availability/copy";
import { SampleBanner } from "@/features/availability/SampleBanner";
import { toRoomViews } from "@/features/availability/view-models";
import { PropertyRoomSelection, PropertyRoomSelectionFallback } from "@/features/property-page/PropertyRoomSelection";
import { PropertySearchBar, PropertySearchBarFallback } from "@/features/property-page/PropertySearchBar";
import { JsonLd } from "@/seo/JsonLd";
import { buildMetadata } from "@/seo/metadata";
import { propertyPageSeo } from "@/seo/property";
import { breadcrumbJsonLd, lodgingJsonLd } from "@/seo/structured-data";
import { absoluteUrl } from "@/seo/urls";
import { getServices } from "@/server/services";

/**
 * A property's own page (section 05.1): who it is, shown first by its pictures, and then
 * its rooms for the guest's stay (section 02.2).
 *
 * The page is the same for every guest. It never reads dates or guests on the server, so it
 * is generated ahead of time, has one canonical address, and puts the property's content in
 * the first response. The two parts that depend on the stay, the booking bar and the room
 * selection, read the URL in the browser and load availability by themselves.
 *
 * THIS IS THE SHELL. In the approved order the page is: gallery, identity and the way to
 * rooms, amenities, nearby, rooms. The gallery is one picture for now; amenities and nearby
 * are not built yet and nothing stands in for them.
 */
type Params = { params: Promise<{ property: string }> };

async function load(slug: string) {
  return getServices().properties.getProperty(slug, site.defaultLocale);
}

export async function generateStaticParams() {
  const properties = await getServices().properties.listProperties(site.defaultLocale);
  return properties.map((property) => ({ property: property.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const property = await load((await params).property);
  return property ? buildMetadata(propertyPageSeo(property)) : {};
}

export default async function PropertyPage({ params }: Params) {
  const { property: slug } = await params;
  const services = getServices();
  const [property, properties] = await Promise.all([load(slug), services.properties.listProperties(site.defaultLocale)]);
  if (!property) notFound();

  const usesMockBooking = env.bookingProvider === "mock";
  const sample = usesMockBooking || property.source === "mock";
  const [primary] = galleryMedia(property);
  const primaryImage = toCardImage(primary?.kind === "video" ? primary.poster : primary);
  const line = property.narrative.positioning ?? property.identity.tagline;
  const page = absoluteUrl(routes.property(property.slug, property.locale));

  return (
    <>
      {sample ? <SampleBanner /> : null}

      <Suspense fallback={<PropertySearchBarFallback />}>
        <PropertySearchBar
          slug={property.slug}
          timeZone={property.place.timeZone}
          mockEnabled={usesMockBooking}
          options={properties.map((option) => ({ id: option.id, slug: option.slug, name: option.identity.name, area: option.place.area.name }))}
        />
      </Suspense>

      <main className="mx-auto max-w-site px-(--vn-gutter) pb-40 lg:pb-(--vn-space-24)">
        {/* 1. Gallery. One picture until the gallery is built: the first of the record's gallery, or its signature visual. */}
        <section aria-label={resultsCopy.galleryLabel}>
          <CardVisual image={primaryImage} sizes="(min-width: 80rem) 80rem, 100vw" priority className="aspect-[4/5] rounded-(--bk-r-shell) sm:aspect-[3/2] lg:aspect-[21/9]" />
        </section>

        {/* 2. Identity, and the way straight to rooms. */}
        <header className="mt-(--vn-space-6) flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-8">
          <div className="min-w-0">
            <p className="text-[0.6875rem] font-medium tracking-(--bk-label-tracking) text-ink-muted uppercase">{property.place.area.name}</p>
            <h1 className="mt-2 text-(length:--vn-text-4xl) leading-none font-medium tracking-[-0.035em] text-balance">{property.identity.name}</h1>
            {line ? <p className="mt-3 max-w-xl text-(length:--vn-text-lg) leading-snug text-pretty text-ink-muted">{line}</p> : null}
          </div>
          {/* A plain link to a place on this page: it keeps the dates in the URL and works before any script has loaded. */}
          <a
            href="#rooms"
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-(--bk-r-field) bg-action px-6 text-[0.9375rem] font-semibold text-on-action transition-colors duration-(--vn-duration-fast) hover:bg-action-hover"
          >
            {resultsCopy.viewAvailableRooms}
          </a>
        </header>

        {/* 3. Amenities and 4. Nearby come here. Not built yet; nothing is shown in their place. */}

        {/* 5. Rooms for the stay. The margin keeps the heading clear of the sticky bar when jumped to. */}
        <section id="rooms" aria-label={resultsCopy.roomsTitle} className="mt-(--vn-space-12) scroll-mt-24 border-t border-line pt-(--vn-space-8)">
          <Suspense fallback={<PropertyRoomSelectionFallback />}>
            <PropertyRoomSelection
              property={{ id: property.id, slug: property.slug, timeZone: property.place.timeZone }}
              rooms={toRoomViews(property)}
              mock={usesMockBooking ? { scenarios: MOCK_AVAILABILITY_SCENARIOS, configured: env.mockAvailabilityScenario } : undefined}
            />
          </Suspense>
        </section>
      </main>

      {/* Emitted only for a real, approved property; never price, availability or rating. */}
      <JsonLd data={lodgingJsonLd(property, { page, absolute: absoluteUrl })} />
      {isPublishable(property) ? (
        <JsonLd data={breadcrumbJsonLd([{ name: site.name, url: absoluteUrl(routes.home(property.locale)) }, { name: property.identity.name, url: page }])} />
      ) : null}
    </>
  );
}
