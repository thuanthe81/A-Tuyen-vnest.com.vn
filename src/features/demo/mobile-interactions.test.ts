import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";
import { clientCollection } from "@/app/dev/brand-collection/client/adapter";
import { BRAND_FACEBOOK_LINKS, BRAND_WEBSITES, orderBrands } from "./brand-showcase";
import { NO_FILTERS, fromSearch, matches } from "@/app/dev/brand-collection/filter";
import { buildBareChic, type PhotoLookup } from "@/content/drafts/bare-chic/record";
import { buildBareDaKao } from "@/content/drafts/bare-da-kao/record";
import { buildBareHan } from "@/content/drafts/bare-han/record";
import { buildBareHyphen } from "@/content/drafts/bare-hyphen/record";
import { buildPepperHouse } from "@/content/drafts/pepper-house/record";
import { buildNang } from "@/content/drafts/the-nang-suites/record";
import { cityNote } from "@/content/vnest-workbook/city-notes";
import { HERO_SELECTION, SELECTION } from "@/content/vnest-workbook/image-selection";
import { RELEASE_HOLDS } from "@/content/vnest-workbook/media";
import type { SelectionManifest } from "@/content/vnest-workbook/selection-photos";
import { parseIsoDate, type IsoDate } from "@/domain/dates";
import { buildMonths, dayRole } from "@/features/booking-search/calendar";
import {
  checkSubmit,
  clearDates,
  criteriaFromForm,
  emptySearchForm,
  pickDate,
  searchFromForm,
  setAdults,
  setProperty,
  type PropertyOption,
} from "@/features/booking-search/search-form";
import { buildCityNotesView } from "@/features/city-notes/view";
import { buildDetailView } from "@/features/property-detail/view";
import {
  demoBookingResultsUrl,
  demoBookingStepFromMultiRoomUrl,
  demoPropertyUrl,
  demoPropertyUrlFromMultiRoom,
  stayFromQuery,
} from "./booking-flow";
import { buildBookingResultsCatalog } from "./booking-results-data";
import {
  addRoomGroup,
  assignRoomPreference,
  clearRoomPreference,
  evaluateRoomForSlot,
  parseMultiRoomQuery,
  removeRoomGroup,
  setRoomGroupAdults,
  totalRequestedAdults,
} from "./booking-results-state";
import { HERO_AUTOPLAY_INTERVAL, heroSlides } from "./hero-slides";
import { SERVICES, isServiceId, serviceTitle, validateContact } from "./owner-journey";

const ROOT = process.cwd();
const readSrc = (relPath: string) => fs.readFileSync(path.join(ROOT, relPath), "utf8");

const d = (value: string): IsoDate => {
  const parsed = parseIsoDate(value);
  assert.ok(parsed, `Invalid date: ${value}`);
  return parsed;
};

describe("VNest V3 Mobile Interaction Recovery — Automated Regression Suite", () => {
  test("0. Dev server cross-origin configuration allows exact LAN hosts without broad private-network or public tunnel wildcards", () => {
    const nextConfigSrc = readSrc("next.config.ts");
    assert.ok(nextConfigSrc.includes("allowedDevOrigins"), "next.config.ts must configure allowedDevOrigins for mobile LAN testing");
    assert.ok(nextConfigSrc.includes("networkInterfaces"), "allowedDevOrigins must include active host LAN IPv4 interfaces");
    for (const forbiddenWildcard of [
      "192.168.*.*",
      "10.*.*.*",
      "172.*.*.*",
      "*.trycloudflare.com",
      "**.trycloudflare.com",
      "*.ngrok-free.app",
      "**.ngrok-free.app",
      "*.loca.lt",
      "**.loca.lt",
    ]) {
      assert.ok(
        !nextConfigSrc.includes(forbiddenWildcard),
        `next.config.ts must not include overly broad wildcard ${forbiddenWildcard}`,
      );
    }
  });

  test("1. Mobile Navigation Menu & Scroll-Lock Ownership: opens modal dialog, syncs scroll lock across overlapping modals, and handles popstate/navigation", () => {
    const headerSrc = readSrc("src/features/demo/SiteHeader.tsx");
    assert.ok(headerSrc.includes("dialog.current?.showModal()"), "Menu button must open native modal dialog immediately");
    assert.ok(
      headerSrc.includes('document.querySelector("dialog[open]") ? "hidden" : ""'),
      "Mobile menu must sync document scroll lock based on whether any modal dialog remains open",
    );
    assert.ok(
      headerSrc.includes('window.addEventListener("popstate"'),
      "SiteHeader must close open dialogs and release scroll lock on browser Back/Forward navigation",
    );
    assert.ok(
      headerSrc.includes("event.target === dialog.current"),
      "Mobile menu dialog must close when tapping outside on the dialog backdrop",
    );
    assert.ok(
      headerSrc.includes("handleNavClick") && headerSrc.includes("scrollIntoView"),
      "Tapping a mobile navigation link must close the menu without stealing scroll back to the sticky header and scroll hash targets into view",
    );

    // Verify all modal/drawer surfaces use safe overlapping scroll-lock ownership
    for (const modalFile of [
      "src/features/booking-search/MobileBookingSearch.tsx",
      "src/features/property-detail/RoomDrawer.tsx",
      "src/features/property-detail/Lightbox.tsx",
      "src/features/property-detail/PropertyRoomCollection.tsx",
      "src/features/property-detail/LocationAndPoliciesPanel.tsx",
    ]) {
      const src = readSrc(modalFile);
      assert.ok(
        src.includes('document.querySelector("dialog[open]") ? "hidden" : ""'),
        `${modalFile} must preserve scroll lock if another modal dialog is open and clear it when no dialog is open`,
      );
    }
  });

  test("2. Book Now / Booking CTA, Date Picker & Guest Selector: state transitions, URL routing, and scroll-lock cleanup", () => {
    const mobileSearchSrc = readSrc("src/features/booking-search/MobileBookingSearch.tsx");
    const bookingCtaSrc = readSrc("src/features/demo/BookingCta.tsx");
    const bookingResultsSrc = readSrc("src/features/demo/BookingResults.tsx");

    // Scroll lock must be synced on mobile booking close and cleared before router.push
    assert.ok(
      mobileSearchSrc.includes("syncScrollLock()"),
      "MobileBookingSearch must sync document overflow lock when opening, closing, or unmounting",
    );
    assert.ok(
      bookingCtaSrc.includes('document.documentElement.style.overflow = ""'),
      "BookingCta must clear any open dialog/drawer overflow lock before navigating via router.push",
    );
    assert.ok(
      bookingResultsSrc.includes('data-field={!editorOpen ? "property checkIn checkOut guests" : undefined}'),
      "BookingResults edit button must expose data-field when collapsed so header BOOKING CTA opens the editor on mobile",
    );

    // Date picker state transitions: check-in -> check-out -> complete -> clear -> re-pick
    const step1 = pickDate(emptySearchForm, "checkIn", d("2026-11-10"));
    assert.equal(step1.form.checkIn, "2026-11-10");
    assert.equal(step1.form.checkOut, undefined);
    assert.equal(step1.next, "checkOut");

    const step2 = pickDate(step1.form, "checkOut", d("2026-11-14"));
    assert.equal(step2.form.checkIn, "2026-11-10");
    assert.equal(step2.form.checkOut, "2026-11-14");
    assert.equal(step2.next, "done");

    const months = buildMonths(d("2026-11-01"), 2);
    assert.equal(months.length, 2);
    assert.equal(dayRole(d("2026-11-10"), step2.form.checkIn, step2.form.checkOut), "start");
    assert.equal(dayRole(d("2026-11-12"), step2.form.checkIn, step2.form.checkOut), "between");
    assert.equal(dayRole(d("2026-11-14"), step2.form.checkIn, step2.form.checkOut), "end");

    // Guest selector & property selector state transitions
    const withGuests = setAdults(step2.form, 4, {});
    assert.equal(withGuests.adults, 4);
    assert.equal(setAdults(withGuests, 0, {}).adults, 1, "Adults cannot drop below 1");

    const props: PropertyOption[] = [
      { id: "bare-chic", slug: "bare-chic", name: "Bare Chic", area: "TP. Hồ Chí Minh" },
      { id: "the-nang-suites", slug: "the-nang-suites", name: "The Nắng Suites", area: "Đà Nẵng" },
    ];
    const withProp = setProperty(withGuests, "bare-chic", props);
    const validation = checkSubmit(withProp, { today: d("2026-11-01") });
    assert.equal(validation.ok, true);

    if (validation.ok) {
      const search = searchFromForm(withProp, criteriaFromForm(withProp), props);
      const url = demoBookingResultsUrl(search);
      assert.equal(url, "/dev/demo/tim-phong?property=bare-chic&checkIn=2026-11-10&checkOut=2026-11-14&rooms=2%2C2&adults=4");
      const restored = stayFromQuery(Object.fromEntries(new URL(url, "http://localhost:3400").searchParams));
      assert.deepEqual(restored, {
        criteria: { checkIn: "2026-11-10", checkOut: "2026-11-14", adults: 4 },
        filters: { property: "bare-chic" },
      });
    }

    const cleared = clearDates(withProp);
    assert.equal(cleared.checkIn, undefined);
    assert.equal(cleared.checkOut, undefined);
    assert.equal(cleared.adults, 4);
    assert.equal(cleared.propertyId, "bare-chic");
  });

  test("3. Homepage Hero Carousel: 6 curated slides, 3s autoplay, neighbor pre-mounting, and horizontal-locked touch swipe", () => {
    const properties = [
      { id: "pepper-house", name: "Pepper House", location: { label: "TP. Hồ Chí Minh" } },
      { id: "bare-chic", name: "Bare Chic", location: { label: "TP. Hồ Chí Minh" } },
      { id: "the-nang-suites", name: "The Nắng Suites", location: { label: "Đà Nẵng" } },
      { id: "bare-hyphen", name: "Bare Hyphen", location: { label: "TP. Hồ Chí Minh" } },
      { id: "bare-da-kao", name: "Bare Đa Kao", location: { label: "TP. Hồ Chí Minh" } },
      { id: "bare-han", name: "Bare Hàn", location: { label: "Đà Nẵng" } },
    ];
    const variant = (key: string, type: string, width: number) => ({
      src: `/dev-client-media/selection/${key}/${width}.${type.split("/")[1]}`,
      type,
      width,
      height: Math.round(width / 1.5),
      bytes: 1,
    });
    const manifest: SelectionManifest = {
      photos: Object.fromEntries(
        SELECTION.map((c) => [
          c.key,
          {
            sha256: c.sha256,
            width: 2048,
            height: 1365,
            variants: [480, 800, 1600, 2048].flatMap((w) => ["image/avif", "image/jpeg"].map((t) => variant(c.key, t, w))),
          },
        ]),
      ),
    };

    const slides = heroSlides(manifest, properties);
    // Owner's Phase A corrections (7/11/2026): was 3000 ms; now a 600 ms fade + about 2 s fully visible = 2600 ms.
    assert.equal(HERO_AUTOPLAY_INTERVAL, 2600);
    assert.equal(slides.length, 6);
    assert.deepEqual(HERO_SELECTION, [1, 5, 9, 11, 13, 17]);

    const heroSrc = readSrc("src/features/demo/HeroCarousel.tsx");
    assert.ok(heroSrc.includes("onTouchStart") && heroSrc.includes("onTouchMove") && heroSrc.includes("onTouchEnd"), "HeroCarousel must handle native touch swipe events on mobile");
    assert.ok(heroSrc.includes("Math.abs(dx) >= 36 && Math.abs(dx) > Math.abs(dy) * 1.2"), "HeroCarousel must lock horizontal vs vertical swipe axis to avoid accidental slide changes during vertical scroll");
    assert.ok(heroSrc.includes("mount(1, count - 1)"), "HeroCarousel must pre-mount neighbor slides after hydration so swipes and autoplay never stall");
    // Owner's Phase A corrections (7/11/2026): the hero no longer pauses on mouse hover (it was guarded against synthesized
    // touch hovers); it must move on its own. So there is no hover state left to guard.
    assert.ok(!heroSrc.includes("setHovered") && !heroSrc.includes("onPointerEnter"), "HeroCarousel must not pause on hover");
  });

  test("4. '3 Sợi Chỉ Nối' / Brand Collection: brand tabs, property links, and 'Khám phá nơi ở' filtering & scrolling", () => {
    const collection = clientCollection();
    assert.equal(collection.brands.length, 3);
    assert.deepEqual(
      collection.brands.map((b) => b.name),
      ["Bare Boutique Stays", "The Nắng Suites", "Pepper House"],
    );

    // Filtering by each brand yields the exact properties belonging to that brand
    for (const brand of collection.brands) {
      const shown = matches(collection.properties, { ...NO_FILTERS, brand: brand.id });
      assert.ok(shown.length > 0, `Brand ${brand.name} must have properties`);
      for (const prop of shown) {
        assert.equal(prop.brand, brand.id);
        assert.ok(demoPropertyUrl(prop.id)?.startsWith(`/dev/stays/${prop.id}`), `Property ${prop.id} must resolve to a valid detail route`);
      }
    }

    const parsed = fromSearch("?brand=the-nang&city=da-nang");
    assert.equal(parsed.brand, "the-nang");
    assert.equal(parsed.city, "da-nang");

    // Phase B (owner, 7/11/2026): the brand section moved to BrandShowcase.tsx, shows the brands as Bare → Pepper House →
    // The Nắng (display order only: the data above keeps workbook order), and replaces "Khám phá nơi ở" + Facebook with one
    // "Visit us ↗" to each brand's confirmed website. The mobile scroll and property-link checks are unchanged.
    assert.deepEqual(
      orderBrands(collection.brands).map((b) => b.id),
      ["bare", "pepper-house", "the-nang"],
    );
    const showcaseSrc = readSrc("src/features/demo/BrandShowcase.tsx");
    // Since Phase B the page scrolls the brand strip (with the panel under it) into view, not the panel alone, so the brand
    // switch stays on screen; the condition (panel low on the screen) is unchanged.
    assert.ok(showcaseSrc.includes("panelEl.getBoundingClientRect().top > window.innerHeight") && showcaseSrc.includes("window.scrollBy"), "Selecting a brand on mobile must bring the brand detail panel into view if below the fold");
    assert.ok(showcaseSrc.includes("links[p.id]"), "Brand panel property names must render clickable links to their property detail pages");
    assert.ok(!showcaseSrc.includes("BRAND_FACEBOOK_LINKS") && !showcaseSrc.includes("facebook.com"), "The brand section no longer shows Facebook buttons");
    assert.ok(
      showcaseSrc.includes("BRAND_WEBSITES[brand.id]") && showcaseSrc.includes('target="_blank"') && showcaseSrc.includes('rel="noopener noreferrer"'),
      "'Visit us' must use the brand website configuration and open in a new tab with rel='noopener noreferrer'",
    );
    // No invented destination: a website is either missing (null) or recorded with its source and date, and never Facebook or VNest.
    for (const [brand, site] of Object.entries(BRAND_WEBSITES)) {
      if (!site) continue;
      assert.ok(site.source && site.checked, `${brand} website must say where and when it was confirmed`);
      assert.doesNotMatch(site.url, /facebook\.com|vnest/i, `${brand} website must be the brand's own`);
    }
    // The client-supplied Facebook Pages stay recorded as brand data.
    assert.deepEqual(BRAND_FACEBOOK_LINKS, {
      bare: "https://www.facebook.com/bareboutiquestays",
      "pepper-house": "https://www.facebook.com/pepperhouse.asia",
      "the-nang": "https://www.facebook.com/TheNangSuites",
    });
  });

  test("5. Property Detail Pages: preserves approved room ordering & names across all 6 properties and supports gallery, room drawer, room carousel & room selection", () => {
    const heldKeys = new Set(RELEASE_HOLDS.map((h) => h.key));
    const withPhotos: PhotoLookup = (key) =>
      heldKeys.has(key) ? null : { src: `/dev-client-media/${key}/1600.jpg`, width: 1600, height: 1066 };

    const expectedRoomOrders: Record<string, string[]> = {
      "bare-chic": ["Bare Chic One", "Bare Chic Two", "Bare Chic Three", "Bare Indochine"],
      "bare-hyphen": ["Bare Hyphen One", "Bare Hyphen Two", "Bare Hyphen Three", "Bare Hyphen Four"],
      "bare-da-kao": ["Bare Đa Kao One", "Bare Đa Kao Two", "Bare Đa Kao Three", "Bare Đa Kao Four"],
      "bare-han": ["Bare Hàn Ground", "Bare Hàn One", "Bare Hàn Two", "Bare Hàn Three"],
      "the-nang-suites": ["Yellow Submarine", "Pale Blue Eyes", "Green River", "Blue Moon"],
      "pepper-house": ["Pepper House 3rd-floor", "Pepper House 4th-floor"],
    };

    const builders = {
      "bare-chic": () => buildBareChic(withPhotos),
      "bare-hyphen": () => buildBareHyphen(withPhotos),
      "bare-da-kao": () => buildBareDaKao(withPhotos),
      "bare-han": () => buildBareHan(withPhotos),
      "the-nang-suites": () => buildNang(withPhotos),
      "pepper-house": () => buildPepperHouse(withPhotos),
    };

    for (const [slug, buildDraft] of Object.entries(builders)) {
      const { record, trace } = buildDraft();
      const detail = buildDetailView(trace, { audience: "private-preview", bookingConnected: false });
      assert.deepEqual(
        detail.rooms.map((r) => r.name),
        expectedRoomOrders[slug],
        `Property ${slug} must preserve exact approved room ordering and names`,
      );
      assert.ok(record.media.images.length > 0, `Property ${slug} must have curated gallery photos`);
      for (const room of record.rooms) {
        assert.ok(room.mediaIds.length > 0, `Room ${room.name.vi} in ${slug} must have curated room photos`);
      }
    }

    // Multi-room & single-room selection state in PropertyRoomCollection / BookingResults
    const catalog = buildBookingResultsCatalog();
    for (const prop of catalog) {
      for (const room of prop.rooms) {
        for (const photo of room.photos) {
          assert.equal(heldKeys.has(photo.id), false, `Held photo ${photo.id} must never appear in ${prop.id} room gallery`);
        }
      }
    }
    const validSlugs = catalog.map((p) => p.id);
    const validRoomIds = new Set(catalog.flatMap((p) => p.rooms.map((r) => r.id)));
    const bareChic = catalog.find((p) => p.id === "bare-chic")!;

    let groups = parseMultiRoomQuery({ property: "bare-chic", rooms: "2,2" }, validSlugs, validRoomIds).roomGroups;
    assert.equal(groups.length, 2);

    // Select Bare Chic One for Slot 1 -> advances active slot to 2
    const pick1 = assignRoomPreference(groups, 1, bareChic.rooms[0]!);
    assert.equal(pick1.assigned, true);
    assert.equal(pick1.nextActiveSlot, 2);
    assert.equal(evaluateRoomForSlot(bareChic.rooms[0]!, pick1.groups[0]!, pick1.groups).isSelectedForSlot, true);

    // Select Bare Chic Two for Slot 2
    const pick2 = assignRoomPreference(pick1.groups, 2, bareChic.rooms[1]!);
    assert.equal(pick2.assigned, true);
    assert.deepEqual(
      pick2.groups.map((g) => g.preferredRoomId),
      ["bare-chic-one", "bare-chic-two"],
    );

    // Add Slot 3, update adults, and verify URL handoff
    groups = addRoomGroup(pick2.groups);
    assert.equal(groups.length, 3);
    assert.equal(totalRequestedAdults(groups), totalRequestedAdults(pick2.groups), "adding a room keeps the guest total");
    const before = totalRequestedAdults(groups);
    groups = setRoomGroupAdults(groups, 3, 2);
    assert.equal(totalRequestedAdults(groups), before + 1);
    assert.equal(removeRoomGroup(groups, 3), groups, "5 guests need 3 rooms (two per room): the room stays");
    groups = setRoomGroupAdults(groups, 3, 1);
    groups = removeRoomGroup(groups, 3);
    assert.equal(groups.length, 2);
    assert.equal(totalRequestedAdults(groups), before, "removing a room keeps the guest total");

    const stepUrl = demoBookingStepFromMultiRoomUrl({
      propertySlug: "bare-chic",
      checkIn: d("2026-11-06"),
      checkOut: d("2026-11-08"),
      roomGroups: groups,
    });
    assert.equal(
      stepUrl,
      "/dev/demo/dat-phong?property=bare-chic&checkIn=2026-11-06&checkOut=2026-11-08&rooms=2%2C2&adults=4&prefs=bare-chic-one%2Cbare-chic-two",
    );

    const propUrl = demoPropertyUrlFromMultiRoom(
      "bare-chic",
      {
        propertySlug: "bare-chic",
        checkIn: d("2026-11-06"),
        checkOut: d("2026-11-08"),
        roomGroups: clearRoomPreference(groups, 2),
      },
      "rooms",
    );
    assert.equal(
      propUrl,
      "/dev/stays/bare-chic?view=demo&checkIn=2026-11-06&checkOut=2026-11-08&rooms=2%2C2&adults=4&prefs=bare-chic-one%2C#rooms",
    );

    // Verify Lightbox, RoomCardCarousel, RoomDrawer, and PropertyRoomCollection mobile touch/selection contracts
    const lightboxSrc = readSrc("src/features/property-detail/Lightbox.tsx");
    const roomCarouselSrc = readSrc("src/features/property-detail/RoomCardCarousel.tsx");
    const roomDrawerSrc = readSrc("src/features/property-detail/RoomDrawer.tsx");
    const roomCollectionSrc = readSrc("src/features/property-detail/PropertyRoomCollection.tsx");

    assert.ok(lightboxSrc.includes("onTouchStart") && lightboxSrc.includes("onTouchEnd"), "Lightbox must support native touch swiping");
    assert.ok(roomCarouselSrc.includes("lastSwipeAtRef") && roomCarouselSrc.includes("onTouchEnd"), "RoomCardCarousel must support touch swiping and guard against accidental lightbox clicks after swiping");
    assert.ok(roomDrawerSrc.includes("onTouchStart") && roomDrawerSrc.includes("onTouchEnd"), "RoomDrawer strip must support touch swiping");
    assert.ok(roomCollectionSrc.includes("Đã chọn phòng") && roomCollectionSrc.includes("aria-pressed={activeEval.isSelectedForSlot}"), "PropertyRoomCollection must visibly update room card and button selection states");
  });

  test("6. Booking Policies: opens modal dialog with scroll lock and displays only approved policy status without invented terms", () => {
    const withPhotos: PhotoLookup = (key) => ({ src: `/dev-client-media/${key}/1600.jpg`, width: 1600, height: 1066 });
    const detail = buildDetailView(buildBareChic(withPhotos).trace, { audience: "private-preview", bookingConnected: false });
    const serialized = JSON.stringify(detail);

    // Must not invent check-in/out hours or cancellation terms
    for (const forbidden of ["14:00", "12:00", "hoàn tiền 100%", "không hoàn hủy"]) {
      assert.ok(!serialized.includes(forbidden), `Must not invent policy term "${forbidden}"`);
    }

    const policyPanelSrc = readSrc("src/features/property-detail/LocationAndPoliciesPanel.tsx");
    assert.ok(policyPanelSrc.includes("Xem chính sách đặt phòng"), "Must render 'Xem chính sách đặt phòng' trigger");
    assert.ok(
      policyPanelSrc.includes("dialogRef.current?.showModal()") &&
        policyPanelSrc.includes('document.querySelector("dialog[open]") ? "hidden" : ""'),
      "Policy dialog must open as modal and manage document scroll lock cleanly",
    );
  });

  test("7. Food & Exploration (CityNotes): category tabs and expand/collapse list work for both HCMC and Đà Nẵng properties", () => {
    for (const city of ["ho-chi-minh", "da-nang"] as const) {
      const note = cityNote(city);
      assert.ok(note, `CityNote record must exist for ${city}`);
      const notes = buildCityNotesView(note, { audience: "private-preview" });
      assert.ok(notes, `CityNotes view must exist for ${city}`);
      assert.equal(notes.categories.length, 2);
      assert.deepEqual(
        notes.categories.map((c) => [c.id, c.label]),
        [
          ["eat", "Ăn & uống"],
          ["explore", "Khám phá"],
        ],
      );
      for (const cat of notes.categories) {
        assert.ok(cat.places.length > cat.featured, `Category ${cat.id} in ${city} must have more places (${cat.places.length}) than featured (${cat.featured}) so expand/collapse is active`);
      }
    }

    const cityNotesSrc = readSrc("src/features/city-notes/CityNotes.tsx");
    assert.ok(cityNotesSrc.includes('id="so-tay-thanh-pho"'), "CityNotes section must have id='so-tay-thanh-pho' for anchor navigation");
    assert.ok(cityNotesSrc.includes("Xem tất cả") && cityNotesSrc.includes("Thu gọn"), "CityNotes must toggle between 'Xem tất cả' and 'Thu gọn'");
  });

  test("8. Partner With VNest (OwnerJourney): service disclosures, consultation CTA, and honest un-connected contact validation", () => {
    assert.equal(SERVICES.length, 3);
    assert.deepEqual(
      SERVICES.map((s) => [s.id, serviceTitle(s)]),
      [
        ["van-hanh", "Quản lý vận hành"],
        ["tu-van-mo-hinh", "Phát triển dự án (Tư vấn mô hình)"],
        ["nhuong-quyen", "Nhượng quyền thương hiệu"],
      ],
    );
    for (const s of SERVICES) {
      assert.equal(isServiceId(s.id), true);
      assert.ok(s.cta.vi.length > 5 && (s.cta.en ?? "").length > 5);
    }

    // Contact validation states
    const invalidBoth = validateContact({ name: " ", reach: "" });
    assert.ok(invalidBoth.name && invalidBoth.reach);

    const invalidReach = validateContact({ name: "Nguyễn Văn A", reach: "not-a-phone-or-email" });
    assert.equal(invalidReach.name, undefined);
    assert.ok(invalidReach.reach);

    const validPhone = validateContact({ name: "Nguyễn Văn A", reach: "0905 123 456" });
    assert.deepEqual(validPhone, {});

    const validEmail = validateContact({ name: "Nguyễn Văn A", reach: "owner@example.com" });
    assert.deepEqual(validEmail, {});

    // The form copy moved from OwnerJourney.tsx to contact-copy.ts (client review 6/11/2026); the expectation is unchanged.
    const contactCopySrc = readSrc("src/features/demo/contact-copy.ts");
    assert.ok(
      contactCopySrc.includes("Chưa gửi. Thông tin hợp lệ, nhưng biểu mẫu chưa được kết nối"),
      "OwnerJourney form must honestly report that no backend channel is connected yet instead of faking submission success",
    );
  });
});
