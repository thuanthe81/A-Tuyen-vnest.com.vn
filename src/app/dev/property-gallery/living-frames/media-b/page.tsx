import { buildMetadata } from "@/seo/metadata";
import { LivingFramesView } from "../View";

/**
 * MEDIA REALITY CHECK, variant B: Living Frames with three third-party reference assets in
 * the first screen, and the two still frames given more of the sheet from 768px. Private local
 * review only; nothing here is VNest's. See ../media.ts.
 */
export const metadata = buildMetadata({ title: "Khảo sát: Living Frames, ảnh tham khảo B (hai khung phụ lớn hơn)", path: () => "/dev/property-gallery/living-frames/media-b", noindex: true });

export default function LivingFramesMediaB() {
  return <LivingFramesView media="stock" geometry="b" />;
}
