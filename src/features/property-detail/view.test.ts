import assert from "node:assert/strict";
import { test } from "node:test";
import { buildBareChic, type PhotoLookup } from "@/content/drafts/bare-chic/record";
import { ROWS } from "@/content/vnest-workbook/workbook";
import { buildDetailView } from "./view";

const withPhotos: PhotoLookup = (key) => ({ src: `/dev-client-media/${key}/1600.jpg`, width: 1600, height: 1066 });
const { trace } = buildBareChic(withPhotos);
const view = (audience: "private-preview" | "public") => buildDetailView(trace, { audience, bookingConnected: false });

test("private preview: Bare Chic One shows its own L4 figures as written; the other rooms are pending", () => {
  const rooms = view("private-preview").rooms;
  assert.deepEqual(
    rooms.map((r) => r.name),
    ["Bare Chic One", "Bare Chic Two", "Bare Chic Three", "Bare Indochine"],
  );
  assert.deepEqual(rooms[0]!.price, { kind: "reference", weekday: "1,100,000", weekend: "1,200,000", cell: "L4" });
  for (const room of rooms.slice(1)) assert.deepEqual(room.price, { kind: "pending" }, `${room.name} gets no figure from the merge over L4:L7`);
});

test("public mode: no room carries a number", () => {
  const public_ = view("public");
  assert.ok(public_.rooms.every((r) => r.price.kind === "pending"));
  assert.ok(!/\d{3},\d{3}/.test(JSON.stringify(public_.rooms)));
});

test("the view states nothing the workbook does not: no area, no facts, no nearby, no policies", () => {
  const v = view("private-preview");
  const text = JSON.stringify(v);
  for (const absent of ["Quận 1", "28m2", "Dinh Độc Lập", "14:00", "VND", "₫", "/đêm", "mỗi đêm"]) assert.ok(!text.includes(absent), `found "${absent}"`);
  assert.deepEqual([v.location.street, v.location.rest], ["12/18 Nguyễn Thị Minh Khai", "Phường Sài Gòn, Hồ Chí Minh"]);
  assert.equal(v.location.mapUrl, "https://share.google/fskgZreXVjowaoQCO", "J4 has one hyperlink record and it matches its text");
  assert.equal(v.brand, "Bare Boutique Stays");
  assert.equal(v.bookingConnected, false);
});

test("the primary action explores rooms while booking is not connected; availability only when it is", () => {
  assert.equal(view("private-preview").cta, "Khám phá các loại phòng");
  assert.equal(buildDetailView(trace, { audience: "public", bookingConnected: true }).cta, "Xem phòng trống");
});

test("introduction and story: every sentence of E4 once, verbatim; the introduction is not repeated", () => {
  const v = view("public");
  const e4 = ROWS.find((r) => r.row === 4)!.E!.trim();
  assert.equal(v.intro, "Đó là một ngôi nhà gồm bốn tầng mà mỗi tầng là một căn studio riêng biệt, hiện đại và tiện nghi.");
  assert.ok(!v.story.join(" ").includes(v.intro!));
  const sentences = (text: string) => text.split(/(?<=\.)\s+/).sort();
  assert.deepEqual(sentences([v.intro!, ...v.story].join(" ")), sentences(e4));
});

test("room facts (R3, owner 25/10/2026): D4:D7, E4:E7 and F4:F25 apply to all four Bare Chic rooms", () => {
  const all = ["Loại phòng: Studio", "Diện tích: 28 m²", "Sức chứa: 2 người lớn"];
  for (const audience of ["private-preview", "public"] as const) {
    assert.deepEqual(
      view(audience).rooms.map((r) => [r.name, r.specs.map((x) => `${x.label}: ${x.value}`)]),
      [
        ["Bare Chic One", all],
        ["Bare Chic Two", all],
        ["Bare Chic Three", all],
        ["Bare Indochine", all],
      ],
    );
  }
  // The trace keeps the 15/10 values untouched, as not reconfirmed by v2.
  assert.deepEqual(
    [trace.rooms[0]!.legacy.size.raw, trace.rooms[0]!.legacy.size.status, trace.rooms[0]!.legacy.size.source[0]!.cell],
    ["28m2", "not-reconfirmed", "E4"],
  );
  assert.deepEqual(trace.rooms[1]!.legacy.size.coversRows, [4, 5, 6, 7], "E4:E7 spans the four rooms, and R3 shows it on each");
  assert.deepEqual(view("private-preview").dependencies.rooms.map((d) => d.questions[0]), ["Q23", "Q11", "Q8"]);
});
