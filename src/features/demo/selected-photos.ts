import type { ClientCollection } from "@/app/dev/brand-collection/client/adapter";
import { toPhoto } from "@/app/dev/brand-collection/client/photos";
import { withRoomCover, withSelectedFirst } from "@/content/vnest-workbook/image-selection";
import { largestJpeg, selectedCover, selectedRoomImages, type SelectionManifest } from "@/content/vnest-workbook/selection-photos";
import type { Photo as LightboxPhoto } from "@/features/property-detail/Lightbox";

/**
 * THE OWNER IMAGE SELECTION ON DEMO SURFACES (26/10/2026). Both helpers fall back to what the
 * surface showed before when a selected photograph is missing or on hold.
 */

/** Property cards: each property's representative photograph (PROPERTY_COVER) as its card photo. */
export function withSelectedCovers(content: ClientCollection, manifest: SelectionManifest | null): ClientCollection {
  return {
    ...content,
    properties: content.properties.map((property) => {
      const cover = selectedCover(manifest, property.id);
      if (!cover) return property;
      const { placeholder: _placeholder, ...rest } = property;
      return { ...rest, photo: toPhoto(cover.entry, cover.image.crop.card) };
    }),
  };
}

/**
 * Room cards and room viewers: the room's selected photographs first (the first is the cover),
 * then the room's existing gallery, minus older copies of the same photographs.
 */
export function withSelectedRoomPhotos(existing: readonly LightboxPhoto[], roomIdOrName: string, roomName: string, manifest: SelectionManifest | null): LightboxPhoto[] {
  const selected = new Map(
    selectedRoomImages(manifest, roomIdOrName).flatMap(({ image, entry }) => {
      const jpeg = largestJpeg(entry);
      return jpeg ? [[image.key, { id: image.key, src: jpeg.src, width: jpeg.width, height: jpeg.height, alt: image.alt, room: roomName }] as const] : [];
    }),
  );
  const byId = new Map(existing.map((photo) => [photo.id, photo]));
  return withRoomCover(withSelectedFirst([...byId.keys()], roomIdOrName, (key) => selected.has(key)), roomIdOrName).map((id) => selected.get(id) ?? byId.get(id)!);
}
