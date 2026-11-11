import { buildMetadata } from "@/seo/metadata";
import { LivingFramesView } from "../View";

/**
 * MEDIA REALITY CHECK, variant A: Living Frames with three third-party reference assets in
 * the first screen, on the sheet's geometry as designed. Private local
 * review only; nothing here is VNest's. See ../media.ts.
 */
export const metadata = buildMetadata({ title: "Khảo sát: Living Frames, ảnh tham khảo A (hình học hiện tại)", path: () => "/dev/property-gallery/living-frames/media-a", noindex: true });

export default function LivingFramesMediaA() {
  return <LivingFramesView media="stock" geometry="a" />;
}
