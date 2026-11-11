"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PropertyLocation } from "../data";
import styles from "../shared.module.css";

/**
 * The card's location label as a disclosure (G2.1). The label ("TP.HCM · Quận 1") is a button;
 * it opens a small panel with the address, the current ward and city as supplied, and a map link
 * where one is verified. Not a dialog: focus stays on the button, Tab moves into the panel.
 * Closes on Escape (focus returns to the button), on a click or tap outside, or on the button.
 *
 * Cards have no link of their own today, so nothing is nested. If a card link is added later it
 * must stay a sibling of this button (e.g. on the name), never wrap it.
 */
export function LocationDisclosure({ location, propertyName }: { location: PropertyLocation; propertyName: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const within = root.current?.contains(document.activeElement);
      setOpen(false);
      if (within) button.current?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div className={styles.location} ref={root}>
      <button
        ref={button}
        type="button"
        className={styles.locationTrigger}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${location.label}, xem địa chỉ ${propertyName}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{location.label}</span>
        <span className={styles.locationChevron} aria-hidden="true" />
      </button>
      <div id={panelId} className={styles.locationPanel} role="region" aria-label={`Địa chỉ ${propertyName}`} hidden={!open}>
        <p className={styles.locationHeading}>Địa chỉ</p>
        {location.street && <p className={styles.locationStreet}>{location.street}</p>}
        {location.ward && <p className={styles.locationWard}>{location.ward}</p>}
        {location.note && <p className={styles.locationNote}>{location.note}</p>}
        {location.mapUrl && (
          <a className={styles.locationMap} href={location.mapUrl} target="_blank" rel="noopener noreferrer">
            Xem bản đồ<span className={styles.visuallyHidden}> {propertyName} trên Google Maps (mở thẻ mới)</span>
            <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </div>
  );
}
