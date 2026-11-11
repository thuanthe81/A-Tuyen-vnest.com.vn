import type { PhotoManifest } from "@/content/vnest-workbook/photo-manifest";
import { selectedCover, type SelectionManifest } from "@/content/vnest-workbook/selection-photos";

export type RelatedMediaConfig = {
  folderKey: string;
  objectPosition?: string;
  alt: string;
};

/** The earlier approved photograph per property, used when the owner's selected cover is not on this machine. */
export const APPROVED_PROPERTY_MEDIA: Readonly<Record<string, RelatedMediaConfig>> = {
  "bare-chic": {
    folderKey: "bare-chic",
    objectPosition: "50% 56%",
    alt: "Bare Chic: không gian phòng ngủ ấm áp với nội thất gỗ và ánh sáng tự nhiên",
  },
  "bare-hyphen": {
    folderKey: "bare-hyphen",
    objectPosition: "50% 54%",
    alt: "Bare Hyphen: không gian phòng ngủ với cửa gỗ tròn mang cảm hứng Đông Dương",
  },
  "bare-da-kao": {
    folderKey: "bare-da-kao",
    objectPosition: "50% 50%",
    alt: "Bare Đa Kao: góc cửa sổ nhìn ra mảng xanh hàng trúc và bàn trà",
  },
  "bare-han": {
    folderKey: "bare-han-ground-26",
    objectPosition: "45% 50%",
    alt: "Bare Hàn: không gian phòng ngủ ấm cúng với vòm gỗ và ánh nắng bên cửa sổ",
  },
  "the-nang-suites": {
    folderKey: "nang-blue-moon-17",
    objectPosition: "50% 50%",
    alt: "The Nắng Suites: phòng ngủ tràn ngập ánh sáng tự nhiên tại Đà Nẵng",
  },
  "pepper-house": {
    folderKey: "pepper-house",
    objectPosition: "50% 58%",
    alt: "Pepper House: không gian phòng ngủ thanh lịch với cửa kính lớn nhìn ra tán cây",
  },
};

/**
 * The photograph of a related-property card: the owner's selected cover (26/10/2026) when its derivative is on this
 * machine, otherwise the earlier approved photograph when the local photo manifest lists it. Client media is not in Git,
 * so a fresh clone has neither: the result is `undefined` and the card keeps its plain sand media box (no broken image).
 */
export function relatedCardMedia(
  propertyId: string,
  selection: SelectionManifest | null,
  photos: PhotoManifest | null,
): RelatedMediaConfig | undefined {
  const cover = selectedCover(selection, propertyId);
  if (cover) return { folderKey: `selection/${cover.image.key}`, objectPosition: cover.image.crop.card, alt: cover.image.alt };
  const approved = APPROVED_PROPERTY_MEDIA[propertyId];
  return approved && photos?.photos[approved.folderKey] ? approved : undefined;
}
