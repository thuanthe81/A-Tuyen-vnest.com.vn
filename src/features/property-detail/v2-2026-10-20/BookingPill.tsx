"use client";

import { useEffect, useState, type ReactNode } from "react";
import styles from "./PropertyDetail.module.css";

/**
 * Phones only: the way to the rooms, kept within reach once the hero's own action has scrolled
 * away, and put away again while the rooms are on screen (there is nothing to jump to then). It is
 * fixed, so it never moves the page; it is hidden from assistive technology while hidden.
 */
export function BookingPill({ heroActionId, roomsId, children }: { heroActionId: string; roomsId: string; children: ReactNode }) {
  const [heroGone, setHeroGone] = useState(false);
  const [roomsInView, setRoomsInView] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(heroActionId);
    const rooms = document.getElementById(roomsId);
    if (!hero || !rooms || typeof IntersectionObserver === "undefined") return;
    const heroObserver = new IntersectionObserver(([entry]) => setHeroGone(!entry!.isIntersecting && entry!.boundingClientRect.top < 0));
    const roomsObserver = new IntersectionObserver(([entry]) => setRoomsInView(entry!.isIntersecting), { rootMargin: "0px 0px -20% 0px" });
    heroObserver.observe(hero);
    roomsObserver.observe(rooms);
    return () => {
      heroObserver.disconnect();
      roomsObserver.disconnect();
    };
  }, [heroActionId, roomsId]);

  const shown = heroGone && !roomsInView;
  return (
    <div className={styles.pill} data-shown={shown} aria-hidden={!shown} inert={!shown}>
      {children}
    </div>
  );
}
