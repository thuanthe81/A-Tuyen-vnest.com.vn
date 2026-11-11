import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readClientProperties } from "@/content/vnest-workbook/records";
import { clientCollection } from "./adapter";
import { G2_AUTHORISATION, PHOTOGRAPHY_AUTHORISED, PRIMARY_IMAGES, PROPOSED_IMAGES, type Authorisation } from "@/content/vnest-workbook/media";
import { readPhotoManifest, type PhotoManifest } from "@/content/vnest-workbook/photo-manifest";
import { toPhoto, withPhotos } from "./photos";

// Synthetic: no real photograph or authorisation is involved in these tests.
const records = readClientProperties();
const content = clientCollection(records);
const entry = (driveFileId: string) => ({
  driveFileId,
  sha256: "0".repeat(64),
  width: 2400,
  height: 1600,
  variants: [800, 480].flatMap((width) =>
    ["image/jpeg", "image/webp", "image/avif"].map((type) => ({ src: `/dev-client-media/x/${width}.${type.split("/")[1]}`, type, width, height: (width * 2) / 3, bytes: 1 })),
  ),
});
const manifest: PhotoManifest = { photos: Object.fromEntries(PRIMARY_IMAGES.map(({ property, image }) => [property, entry(image.driveFileId)])) };
const granted: Authorisation = { grantedBy: "test", capacity: "test", date: "2026-01-01", scope: "private-local-review", reference: "unit test", driveFileIds: PRIMARY_IMAGES.map(({ image }) => image.driveFileId) };
const photoIds = (c: typeof content) => c.properties.filter((p) => p.photo).map((p) => p.id);

describe("G2 photographs: the gate", () => {
  it("records the 18/10 authorisation: private local review of exactly the four primaries", () => {
    assert.equal(PHOTOGRAPHY_AUTHORISED, true);
    assert.equal(G2_AUTHORISATION!.scope, "private-local-review");
    assert.deepEqual([...G2_AUTHORISATION!.driveFileIds].sort(), PRIMARY_IMAGES.map(({ image }) => image.driveFileId).sort());
  });

  it("changes nothing without a manifest or without an authorisation", () => {
    assert.equal(withPhotos(content, records, null, granted), content);
    assert.equal(withPhotos(content, records, manifest, null), content);
    assert.equal(readPhotoManifest("/nonexistent/manifest.json"), null);
  });

  it("gives the four primaries their photograph and drops their placeholder", () => {
    assert.deepEqual(photoIds(withPhotos(content, records, manifest)), ["bare-chic", "bare-hyphen", "bare-da-kao", "pepper-house"], "with the recorded authorisation");
    const out = withPhotos(content, records, manifest, granted);
    assert.deepEqual(photoIds(out), ["bare-chic", "bare-hyphen", "bare-da-kao", "pepper-house"]);
    for (const p of out.properties.filter((x) => x.photo)) assert.equal(p.placeholder, undefined);
  });

  it("never gives Bare Hàn or The Nắng Suites a photograph, even if a manifest lists one", () => {
    const forged: PhotoManifest = { photos: { ...manifest.photos, "bare-han": entry("1Z4vuWjXfnmulrXzy9cfMm_raSCjlehN-"), "the-nang-suites": entry("1Z4vuWjXfnmulrXzy9cfMm_raSCjlehN-") } };
    const out = withPhotos(content, records, forged, { ...granted, driveFileIds: [...granted.driveFileIds, "1Z4vuWjXfnmulrXzy9cfMm_raSCjlehN-"] });
    for (const id of ["bare-han", "the-nang-suites"]) {
      const p = out.properties.find((x) => x.id === id)!;
      assert.equal(p.photo, undefined);
      // No primary image was proposed or authorised for them, so a forged manifest entry gives nothing.
      assert.equal(p.placeholder?.reason, "Ảnh chờ cấp quyền sử dụng");
    }
  });

  it("rejects a file that is not the property's proposed primary, or not covered by the authorisation", () => {
    const alternate = PROPOSED_IMAGES["bare-chic"]!.find((i) => i.role === "alternate")!;
    const swapped = withPhotos(content, records, { photos: { ...manifest.photos, "bare-chic": entry(alternate.driveFileId) } }, { ...granted, driveFileIds: [...granted.driveFileIds, alternate.driveFileId] });
    assert.ok(!photoIds(swapped).includes("bare-chic"));
    const partial = withPhotos(content, records, manifest, { ...granted, driveFileIds: granted.driveFileIds.slice(1) });
    assert.deepEqual(photoIds(partial), ["bare-hyphen", "bare-da-kao", "pepper-house"]);
    const otherScope = withPhotos(content, records, manifest, { ...granted, scope: "public" as unknown as "private-local-review" });
    assert.deepEqual(photoIds(otherScope), []);
  });
});

describe("G2 photographs: responsive sources", () => {
  it("offers AVIF, then WebP, then a JPEG fallback, each by width", () => {
    const photo = toPhoto(manifest.photos["bare-chic"]!, "50% 60%");
    assert.deepEqual(
      photo.sources.map((s) => s.type),
      ["image/avif", "image/webp"],
    );
    assert.equal(photo.sources[0]!.srcSet, "/dev-client-media/x/480.avif 480w, /dev-client-media/x/800.avif 800w");
    assert.equal(photo.fallback.src, "/dev-client-media/x/800.jpeg");
    assert.deepEqual([photo.width, photo.height, photo.objectPosition], [2400, 1600, "50% 60%"]);
  });
});
