import assert from "node:assert/strict";
import { test } from "node:test";
import type { PhotoManifest } from "@/content/vnest-workbook/photo-manifest";
import { PROPERTY_COVER, selectionImage } from "@/content/vnest-workbook/image-selection";
import type { SelectionManifest } from "@/content/vnest-workbook/selection-photos";
import { APPROVED_PROPERTY_MEDIA, relatedCardMedia } from "./related-media";

const IDS = Object.keys(APPROVED_PROPERTY_MEDIA);
const variant = { src: "/x/800.jpg", type: "image/jpeg", width: 800, height: 533, bytes: 1 };
const photosWith = (keys: readonly string[]): PhotoManifest => ({
  photos: Object.fromEntries(keys.map((key) => [key, { driveFileId: "", sha256: "", width: 800, height: 533, variants: [variant] }])),
});

test("a fresh clone (no client media, no manifests) points no related card at a photograph", () => {
  assert.equal(IDS.length, 6);
  for (const id of IDS) assert.equal(relatedCardMedia(id, null, null), undefined, id);
});

test("the approved photograph is used only when the local photo manifest lists it", () => {
  const all = photosWith(IDS.map((id) => APPROVED_PROPERTY_MEDIA[id]!.folderKey));
  for (const id of IDS) assert.deepEqual(relatedCardMedia(id, null, all), APPROVED_PROPERTY_MEDIA[id], id);

  const partial = photosWith(["bare-chic"]);
  assert.deepEqual(relatedCardMedia("bare-chic", null, partial), APPROVED_PROPERTY_MEDIA["bare-chic"]);
  assert.equal(relatedCardMedia("bare-han", null, partial), undefined);
});

test("the owner's selected cover wins when its derivative is on this machine", () => {
  const image = selectionImage(PROPERTY_COVER["bare-da-kao"]!)!;
  const selection: SelectionManifest = { photos: { [image.key]: { sha256: image.sha256, width: 800, height: 533, variants: [variant] } } };
  assert.deepEqual(relatedCardMedia("bare-da-kao", selection, null), {
    folderKey: `selection/${image.key}`,
    objectPosition: image.crop.card,
    alt: image.alt,
  });
});
