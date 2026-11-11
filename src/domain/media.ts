/**
 * Photographs and video. Every asset carries its dimensions (so layout never shifts while
 * it loads), alternative text, and its usage rights.
 */

import type { LocalizedText } from "./locale.ts";

/**
 * "placeholder" has no file: the UI draws a labelled block at the asset's ratio.
 * "temporary-licensed" is a stand-in that shows no VNest property and must be labelled as such.
 * "client-supplied-pending" is VNest's own photograph, supplied and authorised for a private
 * review, whose usage rights (credit, licence, public use) are not yet confirmed. Draft records
 * only: validation rejects it on an approved record, like every value but "client-approved".
 * Only "client-approved" assets may appear on a published property.
 */
export type MediaRights = "placeholder" | "temporary-licensed" | "client-supplied-pending" | "client-approved";

interface MediaBase {
  id: string;
  alt: LocalizedText;
  rights: MediaRights;
  /** Intrinsic pixel size of the file, or the intended ratio for a placeholder. */
  width: number;
  height: number;
  credit?: { author: string; sourceUrl?: string };
  /** Which room type the asset shows, so room media is never mixed up. */
  roomTypeId?: string;
}

export interface ImageAsset extends MediaBase {
  kind: "image";
  /** Absent only for placeholders. */
  src?: string;
  /** The point that must stay in frame when the image is cropped, as fractions from the top-left. */
  focalPoint?: { x: number; y: number };
}

export interface VideoAsset extends MediaBase {
  kind: "video";
  sources: readonly { src: string; type: string }[];
  /** Shown before playback and whenever video cannot or should not play. Required: the page must read without video. */
  poster: ImageAsset;
  durationSeconds?: number;
  /** Decides whether the video may autoplay muted as decoration or needs controls. */
  hasAudio: boolean;
  captionsSrc?: string;
}

export type MediaAsset = ImageAsset | VideoAsset;
