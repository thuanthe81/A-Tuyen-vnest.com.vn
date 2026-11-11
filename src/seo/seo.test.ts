import assert from "node:assert/strict";
import { test } from "node:test";
import { routes } from "@/config/routes";
import type { PropertyRecord } from "@/domain/property";
import { resolveProperty } from "@/domain/property";
import { mockPropertyRecords } from "@/integrations/content/mock/records";
import { readEnv } from "@/config/env";
import { buildMetadata } from "@/seo/metadata";
import { propertyPageSeo } from "@/seo/property";
import { buildRobots, robotsHeader } from "@/seo/robots";
import { buildSitemap } from "@/seo/sitemap";
import { breadcrumbJsonLd, lodgingJsonLd, organizationJsonLd, serializeJsonLd } from "@/seo/structured-data";

const absolute = (path: string) => new URL(path, "https://example.test").toString();
const mockA = mockPropertyRecords[0]!;

const approved: PropertyRecord = {
  ...mockA,
  id: "p-real",
  slug: "real-stay",
  source: "client-supplied",
  status: "approved",
  approvedLocales: ["vi", "en"],
  identity: { name: { vi: "Tên thật", en: "Real name" } },
  narrative: { summary: { vi: "Tóm tắt", en: "Summary" } },
  place: { area: { id: "a", slug: "area", name: { vi: "Khu", en: "Area" } }, address: { vi: "Số 1", en: "No. 1" }, coordinates: { latitude: 10.5, longitude: 106.5 } },
  media: {
    images: [{ kind: "image", id: "hero", src: "/p/hero.jpg", alt: { vi: "a", en: "a" }, rights: "client-approved", width: 1600, height: 1000 }],
    videos: [],
  },
  amenities: [{ id: "am", label: { vi: "Hồ bơi", en: "Pool" } }],
  nearby: [],
  rooms: [{ id: "r", slug: "room", name: { vi: "Phòng", en: "Room" }, amenities: [], mediaIds: [] }],
  seo: { shareImageId: "hero", structuredData: { lodgingType: "Hotel" } },
  presentation: { layout: "baseline", sections: [] },
};

const viOnly = resolveProperty(approved, "vi", ["vi"])!;
const bilingual = resolveProperty(approved, "vi", ["vi", "en"])!;
const sample = resolveProperty(mockA, "vi", ["vi"])!;
const propertyPath = (slug: string) => (locale: "vi" | "en") => routes.property(slug, locale);

test("metadata: canonical has no query, and a non-indexable build is noindex everywhere", () => {
  const meta = buildMetadata({ title: "T", path: propertyPath("real-stay") }, { indexable: false });
  assert.deepEqual(meta.alternates, { canonical: "/stays/real-stay" });
  assert.deepEqual(meta.robots, { index: false, follow: false });
  assert.equal(meta.description, undefined);
});

test("metadata: indexable pages carry no robots rule unless they opt out", () => {
  assert.equal(buildMetadata({ title: "T", path: propertyPath("x") }, { indexable: true }).robots, undefined);
  assert.deepEqual(buildMetadata({ title: "T", path: propertyPath("x"), noindex: true }, { indexable: true }).robots, { index: false, follow: true });
});

test("metadata: language alternates appear only when a page exists in more than one language", () => {
  const meta = buildMetadata({ title: "T", description: "D", locale: "en", locales: ["vi", "en"], path: propertyPath("x") }, { indexable: true });
  assert.deepEqual(meta.alternates, {
    canonical: "/en/stays/x",
    languages: { vi: "/stays/x", en: "/en/stays/x", "x-default": "/stays/x" },
  });
  assert.equal(meta.openGraph?.locale, "en_US");
  assert.equal(meta.openGraph?.description, "D");
});

test("structured data: nothing for sample or draft records", () => {
  assert.equal(lodgingJsonLd(sample, { page: absolute("/stays/co-so-mau-a"), absolute }), undefined);
  const draft = resolveProperty({ ...approved, status: "draft" }, "vi", ["vi"])!;
  assert.equal(lodgingJsonLd(draft, { page: absolute("/stays/real-stay"), absolute }), undefined);
});

test("structured data: only fields the record has, and never price, availability or rating", () => {
  const data = lodgingJsonLd(viOnly, { page: absolute("/stays/real-stay"), absolute });
  assert.deepEqual(data, {
    "@context": "https://schema.org",
    "@type": "Hotel",
    "@id": "https://example.test/stays/real-stay#lodging",
    name: "Tên thật",
    url: "https://example.test/stays/real-stay",
    description: "Tóm tắt",
    image: ["https://example.test/p/hero.jpg"],
    address: { "@type": "PostalAddress", streetAddress: "Số 1", addressLocality: "Khu" },
    geo: { "@type": "GeoCoordinates", latitude: 10.5, longitude: 106.5 },
    amenityFeature: [{ "@type": "LocationFeatureSpecification", name: "Hồ bơi", value: true }],
  });
  const text = JSON.stringify(data);
  for (const forbidden of ["priceRange", "offers", "aggregateRating", "review", "telephone"]) assert.equal(text.includes(forbidden), false, forbidden);
});

test("structured data: organisation, breadcrumbs, and safe serialisation", () => {
  assert.deepEqual(organizationJsonLd({ name: "VNest", url: "https://example.test/" }), {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "VNest",
    url: "https://example.test/",
  });
  const crumbs = breadcrumbJsonLd([{ name: "Home", url: "https://example.test/" }, { name: "Stay", url: "https://example.test/stays/x" }]);
  assert.deepEqual((crumbs.itemListElement as { position: number }[]).map((item) => item.position), [1, 2]);
  assert.equal(serializeJsonLd({ name: "</script><script>alert(1)" }).includes("<"), false);
});

test("sitemap: empty unless indexable, and sample records are never listed", () => {
  assert.deepEqual(buildSitemap({ indexable: false, enabledLocales: ["vi"], properties: [viOnly], absolute }), []);
  const urls = buildSitemap({ indexable: true, enabledLocales: ["vi"], properties: [viOnly, sample], absolute }).map((entry) => entry.url);
  assert.deepEqual(urls, ["https://example.test/", "https://example.test/stays/real-stay", "https://example.test/stays/real-stay/rooms/room"]);
});

test("sitemap: a property is listed in each approved language with alternates", () => {
  const entries = buildSitemap({ indexable: true, enabledLocales: ["vi", "en"], properties: [bilingual], absolute });
  assert.deepEqual(entries.map((entry) => entry.url).slice(0, 4), [
    "https://example.test/",
    "https://example.test/en",
    "https://example.test/stays/real-stay",
    "https://example.test/en/stays/real-stay",
  ]);
  assert.deepEqual(entries[2]?.alternates, {
    languages: { vi: "https://example.test/stays/real-stay", en: "https://example.test/en/stays/real-stay" },
  });
});

// Regression for verification finding F1: these answers used to be fixed when the site was built.
// They are now functions of the settings of the deployment that is running.
test("robots: the same code refuses crawlers as a preview and admits them only as indexable production", () => {
  const production = { SITE_URL: "https://vnest.example", SITE_INDEXABLE: "true", DEPLOY_ENV: "production", CONTENT_SOURCE: "files", BOOKING_PROVIDER: "none" };
  const refused = [
    readEnv({ ...production, DEPLOY_ENV: "preview" }),
    readEnv({ ...production, DEPLOY_ENV: "development" }),
    readEnv({ ...production, DEPLOY_ENV: undefined }),
    readEnv({ ...production, SITE_INDEXABLE: undefined }),
    readEnv({ ...production, BOOKING_PROVIDER: "mock" }),
  ];
  for (const settings of refused) {
    assert.deepEqual(buildRobots(settings, absolute), { rules: { userAgent: "*", disallow: "/" } });
    assert.deepEqual(robotsHeader(settings), { name: "X-Robots-Tag", value: "noindex, nofollow" });
  }
  const live = readEnv(production);
  assert.equal(robotsHeader(live), undefined);
  assert.deepEqual(buildRobots(live, absolute), {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/dev/"] },
    sitemap: "https://example.test/sitemap.xml",
  });
});

// ---- Property pages (section 05.1) ----

test("property page: one canonical address without dates, whatever the guest searched", () => {
  const meta = buildMetadata(propertyPageSeo(viOnly), { indexable: true });
  assert.deepEqual(meta.alternates, { canonical: "/stays/real-stay" });
  assert.equal(meta.openGraph?.url, "/stays/real-stay");
  assert.equal(JSON.stringify(meta).includes("checkIn"), false);
  assert.equal(meta.robots, undefined, "a real, approved property on an indexable deployment may be indexed");
  assert.equal(meta.title, "Tên thật");
  assert.equal(meta.description, "Tóm tắt");
  assert.deepEqual(meta.openGraph?.images, [{ url: "/p/hero.jpg", width: 1600, height: 1000, alt: "a" }]);
});

test("property page: a sample or draft property is never indexed, and nothing is written for it", () => {
  const draft = resolveProperty({ ...approved, status: "draft" }, "vi", ["vi"])!;
  for (const property of [sample, draft]) {
    const meta = buildMetadata(propertyPageSeo(property), { indexable: true });
    assert.deepEqual(meta.robots, { index: false, follow: true });
    assert.equal(meta.description, undefined, "no description is published for a record VNest has not approved");
    assert.equal(meta.openGraph?.images, undefined, "a stand-in picture is never offered as the share image");
  }
  // And on a deployment that is not indexable, nothing is, whatever the record says.
  assert.deepEqual(buildMetadata(propertyPageSeo(viOnly), { indexable: false }).robots, { index: false, follow: false });
});

test("property page: language alternates only for languages the property is approved in", () => {
  assert.equal(buildMetadata(propertyPageSeo(viOnly), { indexable: true }).alternates?.languages, undefined);
  assert.deepEqual(buildMetadata(propertyPageSeo(bilingual), { indexable: true }).alternates, {
    canonical: "/stays/real-stay",
    languages: { vi: "/stays/real-stay", en: "/en/stays/real-stay", "x-default": "/stays/real-stay" },
  });
});

test("property page: the sitemap lists it at the same address as its canonical", () => {
  const urls = buildSitemap({ indexable: true, enabledLocales: ["vi"], properties: [viOnly, sample], absolute }).map((entry) => entry.url);
  assert.ok(urls.includes(absolute(routes.property(viOnly.slug))));
  assert.equal(urls.some((url) => url.includes(sample.slug)), false);
});
