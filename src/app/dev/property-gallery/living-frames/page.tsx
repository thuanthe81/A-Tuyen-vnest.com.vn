import { buildMetadata } from "@/seo/metadata";
import { LivingFramesView } from "./View";

/** LIVING FRAMES with its drawn stand-ins: the page as it was reviewed on 12/10/2026. See ./View.tsx. */
export const metadata = buildMetadata({ title: "Khảo sát: Living Frames", path: () => "/dev/property-gallery/living-frames", noindex: true });

export default function LivingFrames() {
  return <LivingFramesView />;
}
