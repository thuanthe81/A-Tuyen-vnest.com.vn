"use client";

import { useEffect, useRef, useState } from "react";
import { Picture } from "./Picture";

type PictureProps = React.ComponentProps<typeof Picture>;

/**
 * A secondary picture that is not requested until the guest is about to reach it.
 *
 * The browser's own lazy loading starts fetching well over a screen ahead, which on a phone
 * means every picture below a full-screen hero is requested at once. This waits until the
 * frame is within `ahead` of the screen. The frame is sized by its parent, so nothing moves
 * when the picture arrives. Without script the picture is still delivered, eagerly, by the
 * noscript copy.
 */
export function DeferredPicture({ ahead = "50%", className = "", ...picture }: PictureProps & { ahead?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: `${ahead} 0px` },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, [ahead]);

  return (
    <span ref={ref} className={className}>
      {near ? (
        <Picture {...picture} />
      ) : (
        <noscript>
          <Picture {...picture} />
        </noscript>
      )}
    </span>
  );
}
