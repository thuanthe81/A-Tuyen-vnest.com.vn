import type { Orientation, Shot } from "../content";
import { Picture } from "../Picture";
import { STOCK_PHOTOS } from "./media";
import { Photo } from "./Photo";

/** A frame's picture: the reference photograph where the shot has one, the drawing everywhere else. */
export function FramePicture({ shot, orientation, sizes, priority = false }: { shot: Shot; orientation: Orientation; sizes: string; priority?: boolean }) {
  const photo = STOCK_PHOTOS[shot.scene];
  return photo ? <Photo photo={photo} sizes={sizes} priority={priority} /> : <Picture concept="c" shot={shot} orientation={orientation} sizes={sizes} priority={priority} />;
}
