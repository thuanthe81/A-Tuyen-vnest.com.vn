import { HomepageBookingOverlays } from "@/features/demo/HomepageBookingOverlays";
import { NestReveal } from "@/features/demo/NestReveal";
import { withBareHanDemoPhoto } from "@/features/demo/bare-han-photo";
import { notFound } from "next/navigation";
import { env } from "@/config/env";
import { site } from "@/config/site";
import { readPhotoManifest } from "@/content/vnest-workbook/photo-manifest";
import { readSelectionManifest } from "@/content/vnest-workbook/selection-photos";
import { withSelectedCovers } from "@/features/demo/selected-photos";
import { cardPrices } from "@/content/vnest-workbook/pricing";
import { readClientProperties } from "@/content/vnest-workbook/records";
import { isLocale, type Locale } from "@/domain/locale";
import { hasDates, type QueryInput } from "@/domain/search";
import { HeroBookingBar } from "@/features/booking-search/HeroBookingBar";
import { demoPropertyUrl, homeStayKey, stayFromQuery } from "@/features/demo/booking-flow";
import { parseChildren } from "@/domain/hybrid-booking/guest-party";
import {
  DEMO_BARE_CHIC,
  DEMO_BARE_DA_KAO,
  DEMO_BARE_HAN,
  DEMO_BARE_HYPHEN,
  DEMO_PEPPER_HOUSE,
  DEMO_THE_NANG_SUITES,
} from "@/features/demo/links";
import styles from "@/features/demo/Demo.module.css";
import { withNangDemoPhoto } from "@/features/demo/nang-photo";
import { HomeHero } from "@/features/demo/HomeHero";
import { AboutVNest } from "@/features/demo/AboutVNest";
import { HomeCollection } from "@/features/demo/HomeCollection";
import { OwnerJourney } from "@/features/demo/OwnerJourney";
import { servicePhoto } from "@/features/partner/selection-picture";
import { DemoFooter } from "@/features/demo/DemoFooter";
import { SiteHeader } from "@/features/demo/SiteHeader";
import { DemoBookingScope } from "@/features/demo/BookingCta";
import { HomepageStaySearch } from "@/features/demo/HomepageStaySearch";
import { heroSlides } from "@/features/demo/hero-slides";
import { reviewAccess } from "@/features/property-detail/review-access";
import { consultationMode } from "@/server/services";
import { buildMetadata } from "@/seo/metadata";
import { demoBookingOptions } from "@/features/demo/booking-options";
import { clientCollection } from "../brand-collection/client/adapter";
import { withPhotos } from "../brand-collection/client/photos";

/**
 * CEO DEMO START, the stand-in homepage (private, local; Friday 23/10/2026; refined 21/10).
 * One tab, one origin: header (logo, BOOKING, menu overlay) → hero carousel with the frozen 02.1
 * floating bar (the header takes the compact bar once it is scrolled past) → Brand Collection (Bare Chic's card opens /dev/stays/bare-chic?view=demo) →
 * Về VNest → Hợp tác cùng VNest (the approved Visual Accordion since 9/11/2026, with a link to /dev/demo/hop-tac) → Liên hệ. 02.1 is placed with one approved presentation change
 * (its action reads BOOK NOW, 24/10/2026); a valid search opens the demo booking step
 * (/dev/demo/dat-phong), which says no booking provider is connected. Prices show the public
 * no-number state. Same access rule as the Bare Chic review pages.
 */
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({ title: "VNest · bản trình diễn", path: () => "/dev/demo", noindex: true });

const ACCESS = reviewAccess(env);

export default async function DemoStart({ searchParams }: { searchParams?: Promise<QueryInput> }) {
  if (!ACCESS.route) notFound();
  const query = searchParams ? await searchParams : {};
  const records = readClientProperties();
  const manifest = readPhotoManifest();
  const selection = readSelectionManifest();
  // Property covers and hero slides: the owner's image selection (image-selection.ts, 26/10/2026).
  const content = withSelectedCovers(withBareHanDemoPhoto(withNangDemoPhoto(withPhotos(clientCollection(records), records, manifest), manifest), manifest), selection);
  // Owner-supplied artwork, lossless delivery copies; originals retained alongside them.
  const logos = {
    bare: { src: "/dev-fixtures/brand-collection/official-logos/bare-wordmark-transparent.webp", width: 767, height: 402 },
    "pepper-house": { src: "/dev-fixtures/brand-collection/official-logos/pepper-house-transparent.webp", width: 1406, height: 1406 },
    "the-nang": { src: "/dev-fixtures/brand-collection/official-logos/the-nang-suites-transparent.webp", width: 364, height: 512 },
  };
  content.brands = content.brands.map((brand) => ({ ...brand, logo: logos[brand.id] }));
  const bareChic = content.properties.find((p) => p.name === "Bare Chic");
  const options = demoBookingOptions(content);
  const slides = heroSlides(selection, content.properties);
  const hasStayQuery = ["property", "checkIn", "checkOut", "adults", "rooms", "prefs"].some((k) => query[k] !== undefined);
  const initial = hasStayQuery ? stayFromQuery(query) : undefined;
  const datedCriteria = initial && hasDates(initial.criteria) ? initial.criteria : undefined;
  // Brand cards carry the whole search in the address: dates, adults, children, and rooms only as the guest chose them.
  const rawRooms = Array.isArray(query.rooms) ? query.rooms[0] : query.rooms;
  const party = { children: parseChildren(query.children), rooms: rawRooms || undefined };
  const cardHref = (slug: string, fallback: string) => (datedCriteria ? (demoPropertyUrl(slug, datedCriteria, undefined, party) ?? fallback) : fallback);
  const bareChicHref = cardHref("bare-chic", DEMO_BARE_CHIC);
  const bareHyphenHref = cardHref("bare-hyphen", DEMO_BARE_HYPHEN);
  const bareDaKaoHref = cardHref("bare-da-kao", DEMO_BARE_DA_KAO);
  const bareHanHref = cardHref("bare-han", DEMO_BARE_HAN);
  const nangHref = cardHref("the-nang-suites", DEMO_THE_NANG_SUITES);
  const pepperHouseHref = cardHref("pepper-house", DEMO_PEPPER_HOUSE);
  const introParam = Array.isArray(query.intro) ? query.intro[0] : query.intro;
  // Private language preview (`?lang=en`): English is not enabled site-wide (site.enabledLocales) until VNest approves the
  // translations, so it is reachable only on this review route. Translated so far: the brand index, About, Services and FAQ.
  const langParam = Array.isArray(query.lang) ? query.lang[0] : query.lang;
  const previewLocale: Locale = langParam && isLocale(langParam) ? langParam : site.defaultLocale;
  return (
    // The stay is read from the address in the browser (HomepageStaySearch), so Back restores a submitted search; it asks
    // for a fresh render when the cached one was made for another address (`renderedStay`), so the cards' links follow.
    <HomepageStaySearch properties={options} renderedStay={homeStayKey(query)}>
      {/* Phase D (9/11/2026): the homepage bar asks for adults and children only; rooms are chosen at room selection.
          A submitted search is remembered in this page's address (10/11/2026). */}
      <DemoBookingScope roomField="hidden" rememberSearch>
      <HomepageBookingOverlays>
      <NestReveal initialIntroParam={introParam} />
      <SiteHeader booking="after-hero" />
      <main className={styles.page}>
        <HomeHero booking={<HeroBookingBar />} slides={slides} />
        <HomeCollection
          content={content}
          prices={cardPrices("public")}
          links={{
            ...(bareChic ? { [bareChic.id]: bareChicHref } : {}),
            "bare-hyphen": bareHyphenHref,
            "bare-da-kao": bareDaKaoHref,
            "bare-han": bareHanHref,
            "the-nang-suites": nangHref,
            "pepper-house": pepperHouseHref,
          }}
          locale={previewLocale}
        />
        <AboutVNest locale={previewLocale} />
        <OwnerJourney locale={previewLocale} photo={servicePhoto(selection)} delivery={consultationMode()} />
      </main>
      <DemoFooter variant="minimal" />
    </HomepageBookingOverlays>
      </DemoBookingScope>
    </HomepageStaySearch>
  );
}
