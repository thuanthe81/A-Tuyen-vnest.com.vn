"use client";

import { useEffect, useState } from "react";
import { ArrowDown } from "../b/icons";
import { COPY } from "../content";
import styles from "./lf.module.css";

/** The height of the sticky criteria bar (section 02.1, 4rem and its hairline). */
const BAR_HEIGHT = 65;

/**
 * The booking action, kept in reach after the one in the first screen has scrolled away: a
 * small button in the corner, not a bar. It is fixed, so it never moves the page; it is the
 * only thing pinned besides the criteria bar; and it stands down at the rooms.
 */
export function CtaPill() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const inline = document.getElementById("cta-inline");
    const rooms = document.getElementById("rooms");
    if (!inline || !rooms) return;
    let inlineVisible = true;
    let roomsReached = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === inline) inlineVisible = entry.isIntersecting;
          // Reached, or already scrolled past.
          else roomsReached = entry.isIntersecting || entry.boundingClientRect.top < 0;
        }
        setShow(!inlineVisible && !roomsReached);
      },
      // The criteria bar covers the top of the screen: an action underneath it is not in reach.
      { rootMargin: `-${BAR_HEIGHT}px 0px 0px 0px` },
    );
    observer.observe(inline);
    observer.observe(rooms);
    return () => observer.disconnect();
  }, []);

  return (
    <a href="#rooms" className={styles.pill} data-show={show || undefined} inert={!show}>
      {COPY.cta}
      <ArrowDown />
    </a>
  );
}
