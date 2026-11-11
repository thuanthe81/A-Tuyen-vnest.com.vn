"use client";

import { useEffect, useState } from "react";
import { COPY } from "../content";
import styles from "./a.module.css";

/**
 * The booking action, kept in reach after the one in the first screen has scrolled away.
 * It is fixed, so showing and hiding it never moves the page, and it stands down as soon as
 * the rooms are on screen, where the selection summary will need the same edge.
 */
export function CtaDock({ name }: { name: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const inline = document.getElementById("cta-inline");
    const rooms = document.getElementById("rooms");
    if (!inline || !rooms) return;
    let inlineVisible = true;
    let roomsReached = false;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === inline) inlineVisible = entry.isIntersecting;
        // Reached, or already scrolled past.
        else roomsReached = entry.isIntersecting || entry.boundingClientRect.top < 0;
      }
      setShow(!inlineVisible && !roomsReached);
    });
    observer.observe(inline);
    observer.observe(rooms);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.dock} data-show={show || undefined} inert={!show}>
      <p className={styles.dockName}>{name}</p>
      <a href="#rooms" className={styles.cta}>
        {COPY.cta}
        <Arrow />
      </a>
    </div>
  );
}

export function Arrow() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 3v12m0 0 5-5m-5 5-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
