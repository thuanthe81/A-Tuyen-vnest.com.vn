import assert from "node:assert/strict";
import { test } from "node:test";
import { EDITORIAL_LAYOUTS } from "@/content/layouts";
import { APPROVED_PROPERTY_COPY } from "@/content/vnest-workbook/approved-copy";
import { ROWS } from "@/content/vnest-workbook/workbook";
import { isPublishable } from "@/domain/property";
import { validatePropertyRecord } from "@/domain/property-validation";
import { buildBookingResultsCatalog } from "@/features/demo/booking-results-data";
import { buildDetailView } from "@/features/property-detail/view";
import { THEMEABLE_TOKENS } from "@/styles/theme-contract";
import { BARE_DA_KAO_EXTENDED_BY_ROOM, BARE_DA_KAO_VERIFIED_MAP_URL, buildBareDaKao, type PhotoLookup } from "./record";

const options = { layouts: EDITORIAL_LAYOUTS, themeableTokens: THEMEABLE_TOKENS };
const withPhotos: PhotoLookup = (key) => ({ src: `/dev-client-media/${key}/1600.jpg`, width: 1600, height: 1066 });
const withoutPhotos: PhotoLookup = () => null;

test("Bare Đa Kao draft passes the content gate, with or without local photographs", () => {
  for (const lookup of [withPhotos, withoutPhotos]) {
    assert.deepEqual(validatePropertyRecord(buildBareDaKao(lookup).record, options), []);
  }
});

test("Bare Đa Kao is a client-supplied draft, never published to production, with no PMS mapping", () => {
  const { record } = buildBareDaKao(withPhotos);
  assert.deepEqual([record.source, record.status, record.approvedLocales], ["client-supplied", "draft", ["vi"]]);
  assert.equal(isPublishable(record), false);
  assert.deepEqual(record.booking.providers, {});
  assert.deepEqual([record.rateReferences, record.policies, record.faqs], [[], [], []]);
});

test("Bare Đa Kao rooms: four Studio units with R3 display metadata (13 m², 19 m², 19 m², 17 m²; 2 người lớn) and preserved provenance", () => {
  const { trace } = buildBareDaKao(withPhotos);
  const publicView = buildDetailView(trace, { audience: "public", bookingConnected: false });
  assert.deepEqual(
    publicView.rooms.map((r) => [r.id, r.name, r.specs.map((s) => `${s.label}: ${s.value}`)]),
    [
      ["bare-da-kao-one", "Bare Đa Kao One", ["Loại phòng: Studio", "Diện tích: 13 m²", "Sức chứa: 2 người lớn"]],
      ["bare-da-kao-two", "Bare Đa Kao Two", ["Loại phòng: Studio", "Diện tích: 19 m²", "Sức chứa: 2 người lớn"]],
      ["bare-da-kao-three", "Bare Đa Kao Three", ["Loại phòng: Studio", "Diện tích: 19 m²", "Sức chứa: 2 người lớn"]],
      ["bare-da-kao-four", "Bare Đa Kao Four", ["Loại phòng: Studio", "Diện tích: 17 m²", "Sức chứa: 2 người lớn"]],
    ],
  );

  // Provenance cells from the 15/10 room sheet remain intact in the trace:
  assert.deepEqual(
    trace.rooms.map((r) => [
      r.name.display,
      r.legacy.type.source[0]!.cell,
      r.legacy.size.source[0]!.cell,
      r.legacy.capacity.source[0]!.cell,
    ]),
    [
      ["Bare Đa Kao One", "D12", "E12", "F4"],
      ["Bare Đa Kao Two", "D13", "E13", "F4"],
      ["Bare Đa Kao Three", "D14", "E14", "F4"],
      ["Bare Đa Kao Four", "D15", "E15", "F4"],
    ],
  );

  // R3 rule: "2 người lớn" is display metadata only and never becomes a booking eligibility restriction.
  const catalog = buildBookingResultsCatalog();
  const catalogDaKao = catalog.find((p) => p.id === "bare-da-kao")!;
  assert.equal(catalogDaKao.rooms.length, 4);
  for (const room of catalogDaKao.rooms) {
    assert.equal(room.verifiedMaxAdults, null, `${room.name} must not enforce a booking restriction from R3 display metadata`);
  }
});

test("Bare Đa Kao galleries: preserves all 23 primary curated photographs first across the 4 rooms and appends 71 distinct new photographs (21 + 21 + 27 + 25 = 94)", () => {
  const { record } = buildBareDaKao(withPhotos);
  const byRoom = Object.fromEntries(record.rooms.map((r) => [r.name.vi, r.mediaIds]));
  assert.deepEqual(byRoom, {
    "Bare Đa Kao One": [
      "sel-06-bare-da-kao-one",
      "bare-da-kao-one-28-6",
      "bare-da-kao-one-23",
      "bare-da-kao-one-28-4",
      "bare-da-kao-one-28-8",
      ...BARE_DA_KAO_EXTENDED_BY_ROOM["Bare Đa Kao One"]!,
    ],
    "Bare Đa Kao Two": [
      "sel-07-bare-da-kao-two",
      "bare-da-kao-two-30-1",
      "bare-da-kao-two-30-10",
      "bare-da-kao-two-30-11",
      "bare-da-kao-two-30-12",
      "bare-da-kao-two-30-16",
      ...BARE_DA_KAO_EXTENDED_BY_ROOM["Bare Đa Kao Two"]!,
    ],
    "Bare Đa Kao Three": [
      "sel-08-bare-da-kao-three",
      "bare-da-kao-three-29-6",
      "bare-da-kao-three-29-18",
      "bare-da-kao-three-29-20",
      "bare-da-kao-three-29-21",
      "bare-da-kao-three-29-22",
      ...BARE_DA_KAO_EXTENDED_BY_ROOM["Bare Đa Kao Three"]!,
    ],
    "Bare Đa Kao Four": [
      "sel-09-bare-da-kao-four",
      "bare-da-kao-four-31-1",
      "bare-da-kao-four-31-12",
      "bare-da-kao-four-31-17",
      "bare-da-kao-four-31-20",
      "bare-da-kao-four-31-23",
      ...BARE_DA_KAO_EXTENDED_BY_ROOM["Bare Đa Kao Four"]!,
    ],
  });
  const gallery = record.presentation.sections.find((s) => s.id === "gallery");
  assert.ok(gallery?.kind === "media");
  assert.equal(gallery.mediaIds.length, 94);
  assert.equal(new Set(gallery.mediaIds).size, 94);
  assert.equal(record.identity.signatureMediaId, "sel-09-bare-da-kao-four");
});

test("Bare Đa Kao introduction, story, location and pricing follow workbook v2 E12, I12, J12 and L12:L15", () => {
  const { trace } = buildBareDaKao(withPhotos);
  const publicView = buildDetailView(trace, { audience: "public", bookingConnected: false });
  const privateView = buildDetailView(trace, { audience: "private-preview", bookingConnected: false });
  const e12 = ROWS.find((r) => r.row === 12)!.E!.trim();

  assert.equal(
    publicView.intro,
    "Bare Đa Kao được lấy cảm hứng từ vẻ đẹp duyên dáng của kiến trúc hiện đại Saigon thời vàng son những năm 1950-1970.",
  );
  assert.ok(!publicView.story.join(" ").includes(publicView.intro!));
  const sentences = (text: string) =>
    text
      .replace(/\s+/g, " ")
      .trim()
      .split(/(?<=\.)\s+/)
      .sort();
  assert.deepEqual(sentences([publicView.intro!, ...publicView.story].join(" ")), sentences(e12));

  assert.deepEqual([publicView.location.street, publicView.location.rest], ["14/3 Nguyễn Đình Chiểu", "phường Tân Định, TP HCM"]);
  assert.equal(publicView.location.mapUrl, BARE_DA_KAO_VERIFIED_MAP_URL);

  // Public mode: every room displays "pending" ("Xem giá theo ngày")
  assert.ok(publicView.rooms.every((r) => r.price.kind === "pending"));

  // Private preview: L12, L13 and L15 state own-row reference figures; L14 (Bare Đa Kao Three) is under L13:L14 merge so pending
  assert.deepEqual(
    privateView.rooms.map((r) => [r.name, r.price.kind]),
    [
      ["Bare Đa Kao One", "reference"],
      ["Bare Đa Kao Two", "reference"],
      ["Bare Đa Kao Three", "pending"],
      ["Bare Đa Kao Four", "reference"],
    ],
  );
});

test("Content integration slots stay empty by default and cleanly overlay approved copy when supplied", () => {
  assert.deepEqual(APPROVED_PROPERTY_COPY, {});
  const { trace } = buildBareDaKao(withPhotos);
  const defaultView = buildDetailView(trace, { audience: "public", bookingConnected: false });
  assert.equal(defaultView.distinctiveFeatures, undefined);
  assert.equal(defaultView.policies, undefined);
  assert.equal(defaultView.faqs, undefined);
  assert.equal(defaultView.localRecommendations, undefined);
  for (const room of defaultView.rooms) {
    assert.equal(room.summary, undefined);
    assert.equal(room.description, undefined);
    assert.equal(room.highlights, undefined);
  }

  const withApproved = buildDetailView(trace, {
    audience: "public",
    bookingConnected: false,
    approvedCopy: {
      tagline: "Không gian lưu trú lấy cảm hứng từ kiến trúc Sài Gòn thập niên 1950–1970.",
      introduction: ["Đoạn giới thiệu chính thức 1.", "Đoạn giới thiệu chính thức 2."],
      roomDescriptions: {
        "bare-da-kao-one": {
          summary: "Studio tầng trệt nhìn ra hàng trúc xanh.",
          description: ["Không gian yên tĩnh với cửa kính lớn đón sáng."],
          highlights: ["Khung cửa sổ nhìn ra mảng xanh", "Bàn trà nhỏ bên cửa sổ"],
        },
      },
      distinctiveFeatures: [{ id: "arch", title: "Kiến trúc Sài Gòn hiện đại", description: "Cảm hứng 1950–1970" }],
      policies: [{ id: "check-in-out", label: "Nhận phòng / Trả phòng", value: "14:00 / 12:00" }],
      faqs: [{ id: "faq-1", question: "Có chỗ gửi xe không?", answer: "Vui lòng liên hệ trước khi đến." }],
      localRecommendations: [{ id: "rec-1", name: "Chợ Tân Định", category: "Điểm tham quan", address: "Hai Bà Trưng" }],
    },
  });

  assert.equal(withApproved.intro, "Không gian lưu trú lấy cảm hứng từ kiến trúc Sài Gòn thập niên 1950–1970.");
  assert.deepEqual(withApproved.story, ["Đoạn giới thiệu chính thức 1.", "Đoạn giới thiệu chính thức 2."]);
  assert.equal(withApproved.rooms[0]!.summary, "Studio tầng trệt nhìn ra hàng trúc xanh.");
  assert.deepEqual(withApproved.rooms[0]!.description, ["Không gian yên tĩnh với cửa kính lớn đón sáng."]);
  assert.deepEqual(withApproved.rooms[0]!.highlights, ["Khung cửa sổ nhìn ra mảng xanh", "Bàn trà nhỏ bên cửa sổ"]);
  assert.equal(withApproved.distinctiveFeatures?.length, 1);
  assert.equal(withApproved.policies?.length, 1);
  assert.equal(withApproved.faqs?.length, 1);
  assert.equal(withApproved.localRecommendations?.length, 1);
});
