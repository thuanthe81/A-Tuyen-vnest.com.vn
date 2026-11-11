import assert from "node:assert/strict";
import { test } from "node:test";
import { cityNote } from "@/content/vnest-workbook/city-notes";
import { buildCityNotesView } from "./view";

const view = (city: "ho-chi-minh" | "da-nang", audience: "private-preview" | "public") => buildCityNotesView(cityNote(city)!, { audience })!;

test("heading, label and tabs as approved (CS-1, CS-3): Ăn & uống first, four places each", () => {
  const v = view("ho-chi-minh", "public");
  assert.equal(v.label, "VNest City Notes");
  assert.equal(v.heading, "Ăn gì, đi đâu ở TP. Hồ Chí Minh");
  assert.equal(view("da-nang", "public").heading, "Ăn gì, đi đâu ở Đà Nẵng");
  assert.deepEqual(
    v.categories.map((c) => [c.label, c.places.length, c.featured]),
    [
      ["Ăn & uống", 7, 4],
      ["Khám phá", 8, 4],
    ],
  );
});

test("the heading never says the places are near the guest's property", () => {
  for (const audience of ["public", "private-preview"] as const) {
    const text = JSON.stringify(view("ho-chi-minh", audience));
    for (const absent of ["quanh nơi bạn ở", "gần", "Bare Chic", "Pepper House", "km", "phút"]) assert.ok(!text.includes(absent), `found "${absent}"`);
  }
});

test("public: no review flags and no pending notes; the flagged values are still shown as the rules say", () => {
  const v = view("da-nang", "public");
  assert.deepEqual(v.pending, []);
  assert.ok(v.categories.every((c) => c.places.every((p) => p.review === null)));
  const all = v.categories.flatMap((c) => c.places);
  assert.equal(all.find((p) => p.name === "Chợ Hàn")!.location, "119 Trần phú, Hải Châu");
  assert.equal(all.find((p) => p.name === "Tan coffee")!.location, "Bình Hiên, Hải Châu");
});

test("private preview: the two flagged places say what VNest must confirm, with Q32", () => {
  const flagged = [...view("ho-chi-minh", "private-preview").categories, ...view("da-nang", "private-preview").categories].flatMap((c) => c.places.filter((p) => p.review));
  assert.deepEqual(flagged.map((p) => p.name).sort(), ["Chợ Hàn", "Tan coffee"]);
  assert.ok(flagged.every((p) => p.review!.includes("Q32")));
  assert.ok(view("da-nang", "private-preview").pending.some((p) => p.questions.includes("Q36")));
});

test("every place carries its cells for the trace", () => {
  const place = view("ho-chi-minh", "private-preview").categories[0].places[0]!;
  assert.equal(place.name, "ThaiYen Cafe");
  assert.equal(place.source, "C5 · D5");
});
