"use client";

import { useEffect, useRef, useState } from "react";
import { type Concept, COPY, pad, type Shot } from "./content";
import { Picture } from "./Picture";

/**
 * Every picture, on demand: a full-screen native dialog holding one plain column to scroll.
 * No carousel logic. The browser provides the focus trap, Escape and the return of focus.
 * The list is not built until the dialog is first opened, so it costs the page nothing before then.
 *
 * Styled with utilities, not a stylesheet of its own: a stylesheet shared by two routes made
 * the build merge their styles, and each route then preloaded the other's typeface.
 */
export function Viewer({
  concept,
  shots,
  openAt,
  onClose,
  picture,
  note,
}: {
  concept: Concept;
  shots: readonly Shot[];
  openAt: number | null;
  onClose: () => void;
  /** A picture of the caller's own for a shot; null leaves the stand-in drawing. */
  picture?: (shot: Shot) => React.ReactNode | null;
  /** What to say after a shot's title in place of "stand-in"; null leaves it. */
  note?: (shot: Shot) => string | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [built, setBuilt] = useState(false);
  if (openAt !== null && !built) setBuilt(true);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || openAt === null) return;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector(`[data-shot="${openAt}"]`)?.scrollIntoView({ block: "start" });
  }, [openAt]);

  return (
    <dialog ref={ref} className="m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto overscroll-contain border-0 bg-[#121211] p-0 text-[#f4f1ea] [--vn-focus:#f4f1ea] backdrop:bg-[#121211]" aria-label={COPY.gallery} onClose={onClose}>
      <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-[#f4f1ea]/15 bg-[#121211] px-(--vn-gutter)">
        <p className="text-[0.8125rem] font-medium tracking-[0.12em] uppercase">{COPY.allPhotos(shots.length)}</p>
        <button type="button" className="-mr-4 h-11 cursor-pointer px-4 text-[0.9375rem] font-semibold underline underline-offset-[0.3em]" onClick={() => ref.current?.close()}>
          {COPY.close}
        </button>
      </div>
      <ol className="mx-auto grid max-w-[60rem] gap-[clamp(1.5rem,4vw,3rem)] pt-[clamp(1rem,3vw,2.5rem)] pb-16">
        {(built ? shots : []).map((shot, index) => (
          <li key={shot.scene} data-shot={index} className="scroll-mt-[4.5rem]">
            <figure>
              <div className="relative aspect-[4/5] bg-[#24231f] md:aspect-video">
                {picture?.(shot) ?? <Picture concept={concept} shot={shot} orientation="auto" sizes="(min-width: 64rem) 60rem, 100vw" />}
              </div>
              <figcaption className="px-(--vn-gutter) pt-3 text-[0.8125rem] text-[#f4f1ea]/70 md:px-0">
                <span className="mr-2 text-[#f4f1ea] tabular-nums">{pad(index + 1)}</span> {shot.title} · {note?.(shot) ?? COPY.standIn}
              </figcaption>
            </figure>
          </li>
        ))}
      </ol>
    </dialog>
  );
}
