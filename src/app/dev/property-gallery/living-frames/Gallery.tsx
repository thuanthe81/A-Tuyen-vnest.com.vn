"use client";

import { createContext, useContext, useState } from "react";
import { COPY, type Shot } from "../content";
import { Viewer } from "../Viewer";
import { STOCK_COPY, STOCK_PHOTOS } from "./media";
import { Photo } from "./Photo";

const OpenGallery = createContext<(index: number) => void>(() => undefined);

/**
 * The complete gallery, shared by everything on the page that can open it: the control on
 * the showcase and each still frame. One viewer, built the first time it is opened.
 */
export function GalleryProvider({ shots, children }: { shots: readonly Shot[]; children: React.ReactNode }) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  return (
    <OpenGallery value={setOpenAt}>
      {children}
      <Viewer
        concept="c"
        shots={shots}
        openAt={openAt}
        onClose={() => setOpenAt(null)}
        // A shot with a reference photograph shows it, whole, and says whose it is; the rest are the drawings.
        picture={(shot) => (STOCK_PHOTOS[shot.scene] ? <Photo photo={STOCK_PHOTOS[shot.scene]!} sizes="(min-width: 64rem) 60rem, 100vw" wholeWhenWide /> : null)}
        note={(shot) => (STOCK_PHOTOS[shot.scene] ? STOCK_COPY.caption(STOCK_PHOTOS[shot.scene]!.credit) : null)}
      />
    </OpenGallery>
  );
}

export function useOpenGallery() {
  return useContext(OpenGallery);
}

/** A still frame: pressing it opens the gallery at that picture. */
export function FrameButton({ index, title, className, children }: { index: number; title: string; className?: string; children: React.ReactNode }) {
  const open = useOpenGallery();
  return (
    <button type="button" className={className} onClick={() => open(index)} aria-label={COPY.openPhoto(index, title)}>
      {children}
    </button>
  );
}
