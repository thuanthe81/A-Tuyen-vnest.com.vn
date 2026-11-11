import { clientCollection } from "@/app/dev/brand-collection/client/adapter";
import { withPhotos } from "@/app/dev/brand-collection/client/photos";
import type { Photo as BrandPhoto } from "@/app/dev/brand-collection/data";
import { localPhotoLookup } from "@/content/drafts";
import { AMENITY_ICON_CHOICES, buildBareChic } from "@/content/drafts/bare-chic/record";
import { buildBareDaKao } from "@/content/drafts/bare-da-kao/record";
import { buildBareHan } from "@/content/drafts/bare-han/record";
import { buildBareHyphen } from "@/content/drafts/bare-hyphen/record";
import { buildPepperHouse } from "@/content/drafts/pepper-house/record";
import { buildNang } from "@/content/drafts/the-nang-suites/record";
import type { BrandId, CityId } from "@/content/vnest-workbook/ids";
import { RELEASE_HOLDS } from "@/content/vnest-workbook/media";
import { readPhotoManifest, type PhotoManifest } from "@/content/vnest-workbook/photo-manifest";
import { readSelectionManifest, selectionLookup, type SelectionManifest } from "@/content/vnest-workbook/selection-photos";
import { amenitiesOf, confirmedRoomFact, orderedRoomsForProperty, transportOf } from "@/content/vnest-workbook/property-details";
import { readClientProperties, slug } from "@/content/vnest-workbook/records";
import { findImage, resolveProperty, type AmenityIcon, type Property } from "@/domain/property";
import { site } from "@/config/site";
import type { Photo as LightboxPhoto } from "@/features/property-detail/Lightbox";
import { approvedDemoPhoto } from "./approved-photos";
import { withBareHanDemoPhoto } from "./bare-han-photo";
import { DEMO_PROPERTY_PAGES } from "./booking-flow";
import { withNangDemoPhoto } from "./nang-photo";
import { withSelectedCovers, withSelectedRoomPhotos } from "./selected-photos";

/**
 * VERIFIED CATALOG DATA & PMS INVENTORY ADAPTER FOR BOOKING RESULTS (/dev/demo/tim-phong).
 *
 * Built strictly from VNest_Informationv2.xlsx (`src/content/vnest-workbook`), reconciled own-row
 * legacy room facts (`confirmedRoomFact`), and the authorised local photo manifest (G2, G3, G4 and
 * approved demo photos). Held photographs with a visible person (`RELEASE_HOLDS`, Q15) are
 * strictly excluded.
 *
 * Workbook Audit (Task 4 & Task 6):
 * - Every named row in Column C of `VNest_Informationv2.xlsx` (rows 4–25, 22 rows total) is a
 *   distinct physical unit (`optionKind: "physical-unit"`, `physicalUnits: 1`).
 * - Several properties have multiple physical units that share an own-row confirmed `roomType`
 *   ("Studio") in the 15/10 room sheet (`sameTypeUnitIds`):
 *   - Bare Hyphen: 3 physical units (`Bare Hyphen One`, `Two`, `Three`) of `Studio` (`18 m²`), plus
 *     1 unit (`Bare Hyphen Four`) of `Duplex studio` (`30 m²`).
 *   - Bare Đa Kao: 4 physical units (`Bare Đa Kao One..Four`) of `Studio`.
 *   - The Nắng Suites: 4 physical units (`Yellow Submarine`, `Pale Blue Eyes`, `Green River`,
 *     `Blue Moon`) of `Studio`.
 * - No live availability, units-left count, price, rate plan, or booking provider mapping is
 *   fabricated when `BOOKING_PROVIDER=none`.
 */

export type RoomOptionKind = "physical-unit" | "room-type";

export type ProviderAvailabilitySnapshot = {
  /** Trusted provider identifier (e.g. "ezcloud"). */
  providerId: string;
  /** Provider-confirmed available unit count for the exact stay dates and occupancy. */
  availableUnits: number;
  /** ISO timestamp when availability was verified. */
  verifiedAt?: string;
};

export type ProviderRatePlanSnapshot = {
  ratePlanId: string;
  ratePlanName: string;
  /** Final relevant price for the searched stay. */
  totalStayPrice: number;
  currency: string;
};

export type ProviderRoomInventoryOverlay = {
  roomId: string;
  optionKind?: RoomOptionKind;
  physicalUnits?: number;
  availability?: ProviderAvailabilitySnapshot | null;
  ratePlan?: ProviderRatePlanSnapshot | null;
  verifiedMaxAdults?: number | null;
};

export type CatalogAmenity = {
  id: string;
  label: string;
  icon?: AmenityIcon;
};

export type CatalogRoomSpec = {
  kind: "type" | "size" | "capacity";
  label: string;
  value: string;
  cell: string;
};

export type CatalogRoom = {
  id: string;
  propertyId: string;
  propertyName: string;
  cityId: CityId;
  cityLabel: string;
  locationLabel: string;
  row: number;
  name: string;
  /**
   * Distinguishes a single unique physical unit ("physical-unit", e.g. "Bare Chic One")
   * from a multi-unit room category ("room-type", e.g. a PMS room category with multiple units).
   */
  optionKind: RoomOptionKind;
  /** Own-row verified room category/type (`"Studio"`, `"Duplex studio"`, or `null` when unverified in own row). */
  roomType: string | null;
  /** Own-row verified room size (`"28 m²"`, `"18 m²"`, etc., or `null` when unverified in own row). */
  roomSize: string | null;
  /**
   * Identifier grouping physical units at the same property that share a verified `roomType`
   * (e.g. `"bare-hyphen:studio"`), or `null` when `roomType` is unverified.
   */
  roomTypeGroupId: string | null;
  /**
   * Ordered IDs of all physical units at the same property sharing this room's verified `roomType`.
   * Allows provisional same-type multi-unit selection in no-PMS mode without inventing inventory.
   */
  sameTypeUnitIds: readonly string[];
  /**
   * Total physical unit count represented by this option (`1` for each unique physical room in the
   * workbook; `> 1` when an option represents a multi-unit room category).
   */
  physicalUnits: number;
  /**
   * Provider-confirmed available quantity for the searched stay (`null` without a trusted PMS response).
   */
  availableUnits: number | null;
  /** Alias preserved for compatibility with existing inventory consumers (`null` without PMS). */
  inventoryQuantity: number | null;
  /** Provider-confirmed rate plan & stay price (`null` without a trusted PMS response). */
  ratePlan: ProviderRatePlanSnapshot | null;
  /** Only own-row confirmed specifications (Q37); blank or merge-lent cells are omitted. */
  specs: readonly CatalogRoomSpec[];
  /** Own-row confirmed adult capacity (`2` for Bare Chic One, `null` for all 21 other rooms). */
  verifiedMaxAdults: number | null;
  /** Approved person-free photographs belonging to this room's Drive folder. */
  photos: readonly LightboxPhoto[];
};

export type CatalogProperty = {
  id: string;
  name: string;
  officialName: string;
  brandId: BrandId;
  brandName: string;
  cityId: CityId;
  cityLabel: string;
  locationLabel: string;
  street: string | null;
  ward: string | null;
  locationNote: string | null;
  mapUrl: string | null;
  transport: string | null;
  descriptionExcerpt: string | null;
  coverPhoto: BrandPhoto | null;
  placeholderReason: string | null;
  demoPageHref: string | null;
  amenities: readonly CatalogAmenity[];
  amenitiesIncomplete: boolean;
  rooms: readonly CatalogRoom[];
};

const HELD_KEYS = new Set(RELEASE_HOLDS.filter((hold) => hold.authorisation !== "granted").map((hold) => hold.key));

/** Single-room primary photos for properties that do not yet have full multi-room galleries imported. */
const SINGLE_ROOM_PRIMARY_PHOTOS: Readonly<Record<string, { manifestKey: string; alt: string; useApprovedDemo?: boolean }>> = {
  "bare-hyphen-one": {
    manifestKey: "bare-hyphen",
    alt: "Bare Hyphen (thư mục Bare Hyphen One): cửa gỗ có ô kính tròn bên cạnh giường ngủ",
  },
  "bare-da-kao-one": {
    manifestKey: "bare-da-kao",
    alt: "Bare Đa Kao One: khung cửa sổ nhìn ra hàng trúc xanh, gối tựa và tách trà trên bàn",
  },
  "bare-han-ground": {
    manifestKey: "bare-han-ground-26",
    alt: "Bare Hàn Ground: phòng ngủ với vòm gỗ phía sau đầu giường và cây xanh bên cửa sổ",
    useApprovedDemo: true,
  },
  "pepper-house-3rd-floor": {
    manifestKey: "pepper-house",
    alt: "Pepper House 3rd-floor: phòng ngủ với ghế bành xanh đậm, giường trắng và khung cửa kính lớn nhìn ra cây xanh",
  },
};

function resolvedRoomPhotos(property: Property, roomId: string, roomName: string): LightboxPhoto[] {
  const mediaIds = (property.rooms.find((r) => r.id === roomId)?.mediaIds ?? []).filter((id) => !HELD_KEYS.has(id));
  return mediaIds.flatMap((id) => {
    const image = findImage(property, id);
    if (!image || !image.src) return [];
    return [{ id: image.id, src: image.src, width: image.width, height: image.height, alt: image.alt, room: roomName }];
  });
}

function singleRoomPhoto(manifest: PhotoManifest | null, roomSlug: string, roomName: string): LightboxPhoto[] {
  if (!manifest || HELD_KEYS.has(roomSlug)) return [];
  const spec = SINGLE_ROOM_PRIMARY_PHOTOS[roomSlug];
  if (!spec || HELD_KEYS.has(spec.manifestKey)) return [];
  const entry = spec.useApprovedDemo ? approvedDemoPhoto(manifest, spec.manifestKey) : manifest.photos[spec.manifestKey];
  const jpeg = entry?.variants.filter((v) => v.type === "image/jpeg").sort((a, b) => b.width - a.width)[0];
  if (!jpeg) return [];
  return [{ id: spec.manifestKey, src: jpeg.src, width: jpeg.width, height: jpeg.height, alt: spec.alt, room: roomName }];
}

function firstSentence(text: string | null): string | null {
  if (!text) return null;
  const sentences = text.split(/(?<=\.)\s+/).map((s) => s.trim()).filter(Boolean);
  return sentences[0] ?? null;
}

const CITY_LABELS: Readonly<Record<CityId, string>> = {
  "ho-chi-minh": "TP. Hồ Chí Minh",
  "da-nang": "Đà Nẵng",
};

const BRAND_NAMES: Readonly<Record<BrandId, string>> = {
  bare: "Bare Boutique Stays",
  "the-nang": "The Nắng Suites",
  "pepper-house": "Pepper House",
};

export function buildBookingResultsCatalog(manifest: PhotoManifest | null = readPhotoManifest(), selection: SelectionManifest | null = readSelectionManifest()): readonly CatalogProperty[] {
  const records = readClientProperties();
  // Property covers and room covers: the owner's image selection (image-selection.ts) where present.
  const collection = withSelectedCovers(withBareHanDemoPhoto(withNangDemoPhoto(withPhotos(clientCollection(records), records, manifest), manifest), manifest), selection);
  const selected = selectionLookup(selection);

  // Selected photographs come from the `selection` passed in, so this catalog is consistent with it.
  const bareChicProperty = resolveProperty(buildBareChic((key) => (key.startsWith("sel-") ? selected(key) : localPhotoLookup(key))).record, site.defaultLocale, site.enabledLocales)!;
  const bareHyphenProperty = resolveProperty(buildBareHyphen((key) => (key.startsWith("sel-") ? selected(key) : localPhotoLookup(key))).record, site.defaultLocale, site.enabledLocales)!;
  const bareDaKaoProperty = resolveProperty(buildBareDaKao((key) => (key.startsWith("sel-") ? selected(key) : localPhotoLookup(key))).record, site.defaultLocale, site.enabledLocales)!;
  const bareHanProperty = resolveProperty(buildBareHan((key) => (key.startsWith("sel-") ? selected(key) : localPhotoLookup(key))).record, site.defaultLocale, site.enabledLocales)!;
  const pepperHouseProperty = resolveProperty(buildPepperHouse((key) => (key.startsWith("sel-") ? selected(key) : localPhotoLookup(key))).record, site.defaultLocale, site.enabledLocales)!;
  const nangProperty = resolveProperty(
    buildNang((key) => {
      if (key.startsWith("sel-")) return selected(key);
      const entry = approvedDemoPhoto(manifest, key) ?? manifest?.photos[key];
      const jpeg = entry?.variants.filter((v) => v.type === "image/jpeg").sort((a, b) => b.width - a.width)[0];
      return jpeg ? { src: jpeg.src, width: jpeg.width, height: jpeg.height } : null;
    }).record,
    site.defaultLocale,
    site.enabledLocales,
  )!;

  return records.map((record) => {
    const card = collection.properties.find((p) => p.id === record.id)!;
    const firstRow = record.rows[0]!;
    const amenityData = amenitiesOf(firstRow);
    const transportData = transportOf(firstRow);
    const orderedRooms = orderedRoomsForProperty(record.id);
    const roomRows = orderedRooms.map((r) => r.details);
    const brandId = record.brand.display!;
    const cityId = record.city.display!;
    const cityLabel = CITY_LABELS[cityId];
    const locationLabel = card.location?.label ?? cityLabel;

    const amenities: CatalogAmenity[] = (amenityData.display ?? []).map((label) => {
      const iconKey = label === "Bếp" ? "kitchen" : AMENITY_ICON_CHOICES[label];
      return {
        id: slug(label),
        label,
        ...(iconKey ? { icon: iconKey } : {}),
      };
    });

    const initialRooms = roomRows.flatMap((room) => {
      const roomName = room.name.display;
      if (!roomName) return [];
      const roomSlug = slug(roomName);

      const typeFact = confirmedRoomFact(room.legacy.type, room.row, "type");
      const sizeFact = confirmedRoomFact(room.legacy.size, room.row, "size");
      const capacityFact = confirmedRoomFact(room.legacy.capacity, room.row, "capacity");

      const specs: CatalogRoomSpec[] = [];
      if (typeFact.display) specs.push({ kind: "type", label: "Loại phòng", value: typeFact.display, cell: typeFact.source[0]!.cell });
      if (sizeFact.display) specs.push({ kind: "size", label: "Diện tích", value: sizeFact.display, cell: sizeFact.source[0]!.cell });
      if (capacityFact.display) specs.push({ kind: "capacity", label: "Sức chứa", value: capacityFact.display, cell: capacityFact.source[0]!.cell });

      // R3 (25/10/2026): the occupancy shown on the card is display metadata, not an eligibility rule.
      // No limit is enforced until ezCloud supplies one, so existing selections are never dropped for it.
      const verifiedMaxAdults: number | null = null;

      let photos: LightboxPhoto[] = [];
      if (record.id === "bare-chic") {
        photos = resolvedRoomPhotos(bareChicProperty, roomSlug, roomName);
      } else if (record.id === "bare-hyphen") {
        photos = resolvedRoomPhotos(bareHyphenProperty, roomSlug, roomName);
      } else if (record.id === "bare-da-kao") {
        photos = resolvedRoomPhotos(bareDaKaoProperty, roomSlug, roomName);
      } else if (record.id === "bare-han") {
        photos = resolvedRoomPhotos(bareHanProperty, roomSlug, roomName);
      } else if (record.id === "the-nang-suites") {
        photos = resolvedRoomPhotos(nangProperty, roomSlug, roomName);
      } else if (record.id === "pepper-house") {
        photos = resolvedRoomPhotos(pepperHouseProperty, roomSlug, roomName);
      } else {
        photos = singleRoomPhoto(manifest, roomSlug, roomName);
      }
      photos = withSelectedRoomPhotos(photos, roomSlug, roomName, selection);

      const roomType = typeFact.display ?? null;
      const roomSize = sizeFact.display ?? null;
      const roomTypeGroupId = roomType ? `${record.id}:${slug(roomType)}` : null;

      return [
        {
          id: roomSlug,
          propertyId: record.id,
          propertyName: record.name.display!,
          cityId,
          cityLabel,
          locationLabel,
          row: room.row,
          name: roomName,
          optionKind: "physical-unit" as const,
          roomType,
          roomSize,
          roomTypeGroupId,
          physicalUnits: 1,
          availableUnits: null,
          inventoryQuantity: null,
          ratePlan: null,
          specs,
          verifiedMaxAdults,
          photos,
        },
      ];
    });

    // Compute `sameTypeUnitIds` for rooms within the same property that share a verified `roomTypeGroupId`.
    const unitIdsByTypeGroup = new Map<string, string[]>();
    for (const room of initialRooms) {
      if (!room.roomTypeGroupId) continue;
      const list = unitIdsByTypeGroup.get(room.roomTypeGroupId) ?? [];
      list.push(room.id);
      unitIdsByTypeGroup.set(room.roomTypeGroupId, list);
    }

    const rooms: CatalogRoom[] = initialRooms.map((room) => ({
      ...room,
      sameTypeUnitIds: room.roomTypeGroupId ? (unitIdsByTypeGroup.get(room.roomTypeGroupId) ?? [room.id]) : [room.id],
    }));

    return {
      id: record.id,
      name: record.name.display!,
      officialName: record.officialName.display!,
      brandId,
      brandName: BRAND_NAMES[brandId],
      cityId,
      cityLabel,
      locationLabel,
      street: record.location.street.display,
      ward: record.location.ward.display,
      locationNote: record.location.note,
      mapUrl: record.location.mapUrl.display,
      transport: transportData.display,
      descriptionExcerpt: firstSentence(record.description.display),
      coverPhoto: card.photo ?? null,
      placeholderReason: card.placeholder?.reason ?? null,
      demoPageHref: DEMO_PROPERTY_PAGES[record.id] ?? null,
      amenities,
      amenitiesIncomplete: amenityData.incomplete,
      rooms,
    };
  });
}

/**
 * Adapter for overlaying provider-confirmed availability and rate data (e.g. from ezCloud PMS)
 * onto the static VNest room catalog without mutating catalog definitions.
 * When `overlays` is empty or omitted (no-PMS mode), the catalog remains strictly catalog-only.
 */
export function applyProviderInventoryToCatalog(
  catalog: readonly CatalogProperty[],
  overlays: readonly ProviderRoomInventoryOverlay[] = [],
): readonly CatalogProperty[] {
  if (overlays.length === 0) return catalog;
  const byRoomId = new Map(overlays.map((o) => [o.roomId, o]));

  return catalog.map((property) => ({
    ...property,
    rooms: property.rooms.map((room) => {
      const overlay = byRoomId.get(room.id);
      if (!overlay) return room;
      const physicalUnits =
        overlay.physicalUnits !== undefined && overlay.physicalUnits >= 1
          ? Math.round(overlay.physicalUnits)
          : room.physicalUnits;
      const availableUnits =
        overlay.availability !== undefined
          ? overlay.availability
            ? Math.max(0, Math.min(physicalUnits, Math.round(overlay.availability.availableUnits)))
            : null
          : room.availableUnits;
      return {
        ...room,
        optionKind: overlay.optionKind ?? (physicalUnits > 1 ? "room-type" : room.optionKind),
        physicalUnits,
        availableUnits,
        inventoryQuantity: availableUnits,
        ratePlan: overlay.ratePlan !== undefined ? overlay.ratePlan : room.ratePlan,
        verifiedMaxAdults:
          overlay.verifiedMaxAdults !== undefined ? overlay.verifiedMaxAdults : room.verifiedMaxAdults,
      };
    }),
  }));
}
