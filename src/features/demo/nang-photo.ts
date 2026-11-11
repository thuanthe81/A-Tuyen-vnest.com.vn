import type { ClientCollection } from "@/app/dev/brand-collection/client/adapter";
import { toPhoto } from "@/app/dev/brand-collection/client/photos";
import type { PhotoManifest } from "@/content/vnest-workbook/photo-manifest";

/** Blue Moon 17.png: workbook D23; selected 23/10 for daylight and clear composition. */
export const NANG_DEMO_KEY = "nang-blue-moon-17";
export const NANG_DEMO_SOURCE = {
  "driveFileId": "16U9iuZuwTWXw8hqGqcqp9OKhnR_m0QK3",
  "sha256": "1fa767846a665145b83c29118a4a7bd60c3d0d0fee72ed6176e523e6d05c5722"
} as const;

export function withNangDemoPhoto(content: ClientCollection, manifest: PhotoManifest | null): ClientCollection {
  const entry = manifest?.photos[NANG_DEMO_KEY];
  if (!entry || entry.driveFileId !== NANG_DEMO_SOURCE.driveFileId || entry.sha256 !== NANG_DEMO_SOURCE.sha256 || !entry.variants.some((v) => v.type === "image/jpeg")) return content;
  return { ...content, properties: content.properties.map((property) => {
    if (property.id !== "the-nang-suites") return property;
    const { placeholder: _placeholder, ...rest } = property;
    return { ...rest, photo: toPhoto(entry, "50% 50%") };
  }) };
}
