/**
 * DEVELOPMENT FIXTURES. Nothing here describes a real VNest property.
 *
 * Six records stand in for VNest's six properties, which have not been supplied. Names,
 * places, rooms, amenities, capacities, bed types and floor areas are neutral placeholders
 * that say "mẫu" (sample); every record is source: "mock", so the UI labels it and it is
 * never indexed. No address, policy, price or review is invented.
 *
 * Pictures are drawn stand-ins in public/dev-fixtures, each with "ẢNH MẪU · KHÔNG PHẢI HÌNH
 * ẢNH VNEST" inside the picture itself. They are marked "temporary-licensed", the rights
 * value for a stand-in that shows no VNest property, and can never appear on an approved
 * record. Delete that folder with these records when real content arrives.
 *
 * The records differ on purpose, to exercise incomplete content:
 *   A  complete: two room types, three signature amenities, narrative, nearby, sections,
 *      a gallery order, amenity icon keys and one room highlight (the only record with them)
 *   B  partial: one room type of unknown capacity, no timezone, no narrative, no signature amenity, a placeholder with no file
 *   C  two room types, two signature amenities, a tagline but no positioning
 *   D  three room types, four signature amenities (a card shows at most three)
 *   E  one small room type, one signature amenity
 *   F  two room types, three signature amenities, no room pictures
 */

import type { ImageAsset } from "@/domain/media";
import type { Amenity, Location, PropertyRecord, RoomType } from "@/domain/property";

const area1: Location = { id: "area-mock-1", slug: "dia-diem-mau-1", name: { vi: "Địa điểm mẫu 1" } };
const area2: Location = { id: "area-mock-2", slug: "dia-diem-mau-2", name: { vi: "Địa điểm mẫu 2" } };
const area3: Location = { id: "area-mock-3", slug: "dia-diem-mau-3", name: { vi: "Địa điểm mẫu 3" } };

function placeholder(id: string, alt: string, width: number, height: number, roomTypeId?: string): ImageAsset {
  return { kind: "image", id, alt: { vi: `Ảnh giữ chỗ: ${alt}` }, rights: "placeholder", width, height, ...(roomTypeId ? { roomTypeId } : {}) };
}

/** A drawn stand-in from public/dev-fixtures. */
function fixture(id: string, file: string, alt: string, width: number, height: number, roomTypeId?: string): ImageAsset {
  return {
    kind: "image",
    id,
    src: `/dev-fixtures/${file}.svg`,
    alt: { vi: `Ảnh minh hoạ mẫu: ${alt}` },
    rights: "temporary-licensed",
    width,
    height,
    ...(roomTypeId ? { roomTypeId } : {}),
  };
}

function amenities(key: string, count: number, signature: number): Amenity[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${key}-amenity-${index + 1}`,
    label: { vi: `Tiện nghi mẫu ${index + 1}` },
    ...(index < signature ? { signature: true } : {}),
  }));
}

function room(key: string, index: number, details: Partial<Pick<RoomType, "maxOccupancy" | "bedding" | "areaSqm">> = {}, picture = true): RoomType {
  return {
    id: `room-mock-${key}${index}`,
    slug: `loai-phong-mau-${index}`,
    name: { vi: `Loại phòng mẫu ${index}` },
    ...details,
    amenities: [],
    mediaIds: picture ? [`${key}-room-${index}`] : [],
  };
}

const roomPicture = (key: string, upper: string, index: number) =>
  fixture(`${key}-room-${index}`, `property-${key}-room-${index}`, `loại phòng mẫu ${index} của cơ sở mẫu ${upper}`, 1200, 900, `room-mock-${key}${index}`);

const base = { source: "mock", status: "draft", approvedLocales: ["vi"], rateReferences: [], policies: [], faqs: [], seo: {} } as const;

const propertyA: PropertyRecord = {
  ...base,
  id: "prop-mock-a",
  slug: "co-so-mau-a",
  identity: {
    name: { vi: "Cơ sở mẫu A" },
    tagline: { vi: "Dòng giới thiệu mẫu" },
    signatureMediaId: "a-signature",
    // The gallery pictures themselves are drawn at the gallery checkpoint; these two exist already.
    galleryMediaIds: ["a-signature", "a-detail"],
  },
  narrative: {
    positioning: { vi: "Câu định vị mẫu cho cơ sở A." },
    summary: { vi: "Đoạn tóm tắt mẫu, dùng để kiểm tra bố cục. Không mô tả cơ sở thật nào." },
  },
  place: { area: area1, timeZone: "Asia/Ho_Chi_Minh" },
  media: {
    images: [
      fixture("a-signature", "property-a", "hình ảnh đặc trưng của cơ sở mẫu A", 1600, 1200),
      placeholder("a-detail", "chi tiết không gian của cơ sở mẫu A", 1200, 1500),
      roomPicture("a", "A", 1),
      roomPicture("a", "A", 2),
    ],
    videos: [],
  },
  // Icon keys only exercise the field. The amenities stay placeholders, so no key says anything true about a property.
  amenities: amenities("a", 5, 3).map((amenity, index) => ({ ...amenity, ...(index < 3 ? { icon: (["wifi", "garden", "breakfast"] as const)[index] } : {}) })),
  nearby: [
    { id: "a-nearby-1", name: { vi: "Trải nghiệm lân cận mẫu 1" }, category: "culture" },
    { id: "a-nearby-2", name: { vi: "Trải nghiệm lân cận mẫu 2" }, category: "food-drink" },
  ],
  rooms: [
    { ...room("a", 1, { maxOccupancy: 2, bedding: { vi: "Kiểu giường mẫu 1" }, areaSqm: 20 }), highlight: { vi: "Điểm khác biệt mẫu của loại phòng 1" } },
    room("a", 2, { maxOccupancy: 4, bedding: { vi: "Kiểu giường mẫu 2" }, areaSqm: 30 }),
  ],
  presentation: {
    layout: "baseline",
    sections: [
      {
        kind: "narrative",
        id: "a-story",
        heading: { vi: "Tiêu đề câu chuyện mẫu" },
        body: [{ vi: "Đoạn văn mẫu thứ nhất." }, { vi: "Đoạn văn mẫu thứ hai." }],
        mediaIds: ["a-detail"],
      },
      { kind: "collection", id: "a-rooms", collection: "rooms" },
      { kind: "collection", id: "a-amenities", collection: "amenities" },
      { kind: "collection", id: "a-nearby", collection: "nearby" },
    ],
  },
  booking: {
    providers: {
      mock: { propertyRef: "MOCK-A", roomRefs: { "room-mock-a1": "MOCK-A-1", "room-mock-a2": "MOCK-A-2" } },
    },
  },
};

const propertyB: PropertyRecord = {
  ...base,
  id: "prop-mock-b",
  slug: "co-so-mau-b",
  identity: { name: { vi: "Cơ sở mẫu B" }, signatureMediaId: "b-signature" },
  narrative: {},
  // No timezone: stands for a property whose "today" the site cannot judge.
  place: { area: area2 },
  media: {
    images: [fixture("b-signature", "property-b", "hình ảnh đặc trưng của cơ sở mẫu B", 1600, 1200), placeholder("b-room-1", "loại phòng mẫu 1 của cơ sở mẫu B", 1200, 900, "room-mock-b1")],
    videos: [],
  },
  amenities: amenities("b", 1, 0),
  nearby: [],
  rooms: [room("b", 1)],
  presentation: { layout: "baseline", sections: [{ kind: "collection", id: "b-rooms", collection: "rooms" }] },
  booking: { providers: { mock: { propertyRef: "MOCK-B" } } },
};

const propertyC: PropertyRecord = {
  ...base,
  id: "prop-mock-c",
  slug: "co-so-mau-c",
  identity: { name: { vi: "Cơ sở mẫu C" }, tagline: { vi: "Dòng giới thiệu mẫu" }, signatureMediaId: "c-signature" },
  narrative: {},
  place: { area: area1, timeZone: "Asia/Ho_Chi_Minh" },
  media: { images: [fixture("c-signature", "property-c", "hình ảnh đặc trưng của cơ sở mẫu C", 1600, 1200), roomPicture("c", "C", 1), roomPicture("c", "C", 2)], videos: [] },
  amenities: amenities("c", 3, 2),
  nearby: [],
  rooms: [
    room("c", 1, { maxOccupancy: 2, bedding: { vi: "Kiểu giường mẫu 1" } }),
    room("c", 2, { maxOccupancy: 3, bedding: { vi: "Kiểu giường mẫu 2" }, areaSqm: 25 }),
  ],
  presentation: { layout: "baseline", sections: [{ kind: "collection", id: "c-rooms", collection: "rooms" }] },
  booking: { providers: { mock: { propertyRef: "MOCK-C" } } },
};

const propertyD: PropertyRecord = {
  ...base,
  id: "prop-mock-d",
  slug: "co-so-mau-d",
  identity: { name: { vi: "Cơ sở mẫu D" }, signatureMediaId: "d-signature" },
  narrative: { positioning: { vi: "Câu định vị mẫu cho cơ sở D, dài hơn một chút để kiểm tra việc xuống dòng trên thẻ." } },
  place: { area: area2, timeZone: "Asia/Ho_Chi_Minh" },
  media: {
    images: [fixture("d-signature", "property-d", "hình ảnh đặc trưng của cơ sở mẫu D", 1600, 1200), roomPicture("d", "D", 1), roomPicture("d", "D", 2), roomPicture("d", "D", 3)],
    videos: [],
  },
  amenities: amenities("d", 6, 4),
  nearby: [],
  rooms: [
    room("d", 1, { maxOccupancy: 2, bedding: { vi: "Kiểu giường mẫu 1" }, areaSqm: 20 }),
    room("d", 2, { maxOccupancy: 2, bedding: { vi: "Kiểu giường mẫu 2" }, areaSqm: 25 }),
    room("d", 3, { maxOccupancy: 6, bedding: { vi: "Kiểu giường mẫu 3" }, areaSqm: 40 }),
  ],
  presentation: { layout: "baseline", sections: [{ kind: "collection", id: "d-rooms", collection: "rooms" }] },
  booking: { providers: { mock: { propertyRef: "MOCK-D" } } },
};

const propertyE: PropertyRecord = {
  ...base,
  id: "prop-mock-e",
  slug: "co-so-mau-e",
  identity: { name: { vi: "Cơ sở mẫu E" }, tagline: { vi: "Dòng giới thiệu mẫu" }, signatureMediaId: "e-signature" },
  narrative: { positioning: { vi: "Câu định vị mẫu cho cơ sở E." } },
  place: { area: area3, timeZone: "Asia/Ho_Chi_Minh" },
  media: { images: [fixture("e-signature", "property-e", "hình ảnh đặc trưng của cơ sở mẫu E", 1600, 1200), roomPicture("e", "E", 1)], videos: [] },
  amenities: amenities("e", 2, 1),
  nearby: [],
  rooms: [room("e", 1, { maxOccupancy: 2, bedding: { vi: "Kiểu giường mẫu 1" }, areaSqm: 20 })],
  presentation: { layout: "baseline", sections: [{ kind: "collection", id: "e-rooms", collection: "rooms" }] },
  booking: { providers: { mock: { propertyRef: "MOCK-E" } } },
};

const propertyF: PropertyRecord = {
  ...base,
  id: "prop-mock-f",
  slug: "co-so-mau-f",
  identity: { name: { vi: "Cơ sở mẫu F" }, signatureMediaId: "f-signature" },
  narrative: { positioning: { vi: "Câu định vị mẫu cho cơ sở F." } },
  place: { area: area3, timeZone: "Asia/Ho_Chi_Minh" },
  media: { images: [fixture("f-signature", "property-f", "hình ảnh đặc trưng của cơ sở mẫu F", 1600, 1200)], videos: [] },
  amenities: amenities("f", 3, 3),
  nearby: [],
  rooms: [room("f", 1, { maxOccupancy: 2 }, false), room("f", 2, { maxOccupancy: 4, areaSqm: 35 }, false)],
  presentation: { layout: "baseline", sections: [{ kind: "collection", id: "f-rooms", collection: "rooms" }] },
  booking: { providers: { mock: { propertyRef: "MOCK-F" } } },
};

export const mockPropertyRecords: readonly PropertyRecord[] = [propertyA, propertyB, propertyC, propertyD, propertyE, propertyF];
