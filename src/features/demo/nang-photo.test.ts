import assert from "node:assert/strict";
import { test } from "node:test";
import { clientCollection } from "@/app/dev/brand-collection/client/adapter";
import type { PhotoManifest } from "@/content/vnest-workbook/photo-manifest";
import { NANG_DEMO_KEY, NANG_DEMO_SOURCE, withNangDemoPhoto } from "./nang-photo";

const content = clientCollection();
const entry = { ...NANG_DEMO_SOURCE, width: 2048, height: 1366, variants: [{ src: "/dev-client-media/the-nang-suites/800.jpg", type: "image/jpeg", width: 800, height: 534, bytes: 1 }] };
const manifest: PhotoManifest = { photos: { [NANG_DEMO_KEY]: entry } };
test("Nắng demo photo fails closed for missing assets, swapped source, changed original or no JPEG fallback", () => {
  assert.equal(withNangDemoPhoto(content, null), content);
  for (const change of [{ driveFileId: "another-property" }, { sha256: "unverified" }, { variants: [] }]) {
    assert.equal(withNangDemoPhoto(content, { photos: { [NANG_DEMO_KEY]: { ...entry, ...change } } }), content);
  }
});
test("verified Nắng photo replaces only its placeholder and preserves all other property records", () => {
  const result = withNangDemoPhoto(content, manifest);
  for (const property of result.properties) {
    if (property.id === "the-nang-suites") {
      assert.equal(property.placeholder, undefined);
      assert.equal(property.photo?.fallback.src, entry.variants[0]!.src);
    } else assert.equal(property, content.properties.find((p) => p.id === property.id));
  }
});
