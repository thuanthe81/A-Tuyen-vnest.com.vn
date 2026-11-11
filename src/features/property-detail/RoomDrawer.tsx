"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Photo } from "./Lightbox";
import styles from "./PropertyDetail.module.css";

/**
 * ROOM DETAIL DRAWER (CEO demo, 21/10/2026): "Xem chi tiết phòng" on a room card opens the room in
 * a modal drawer, from the right at about 42% of the width on desktop, near full screen on phones.
 *
 * It holds that room's own photographs (the same list as its gallery), its name, and what the page
 * already knows: `children` carries the property-level amenities and the room's price, both
 * rendered by the page under its usual rules (figures only in the private preview), and the
 * room's confirmed facts when it has any (only Bare Chic One does: Studio, 28 m², 2 người lớn).
 * A room without them shows none, and no "being updated" line: nothing is filled in.
 *
 * The next step hands over to the 02.1 bar at the top of the page, unchanged: it closes the drawer
 * and opens the bar's dates. Nothing here checks availability or takes a booking.
 *
 * A native modal <dialog>: the page is inert behind it, Escape and "Đóng" close it, focus returns
 * to the button that opened it, and the body scrolls inside while the header and the action stay.
 *
 * `action` (VNest V3 Stage 1, 24/10/2026, CEO R03): the page's own next step in place of
 * "Chọn ngày lưu trú" (BOOK NOW in the demo, carrying this room). Without it, unchanged.
 */
export function RoomDrawer({ room, photos, children, bookingNote, action }: { room: string; photos: readonly Photo[]; children: ReactNode; bookingNote: string | null; action?: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const strip = useRef<HTMLUListElement>(null);
  const swipeFrom = useRef<{ x: number; y: number; scrollLeft: number } | null>(null);
  const [index, setIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const syncScrollLock = () => {
    document.documentElement.style.overflow = document.querySelector("dialog[open]") ? "hidden" : "";
  };

  useEffect(() => {
    const node = dialog.current;
    return () => {
      if (node?.open) node.close();
      syncScrollLock();
    };
  }, []);

  function openDrawer() {
    setIsOpen(true);
    dialog.current?.showModal();
    syncScrollLock();
  }

  function closeDrawer() {
    dialog.current?.close();
    syncScrollLock();
    setIsOpen(false);
  }

  function go(next: number) {
    const target = Math.max(0, Math.min(photos.length - 1, next));
    const list = strip.current;
    if (list) list.scrollTo({ left: target * list.clientWidth, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    setIndex(target);
  }

  function onScroll() {
    const list = strip.current;
    if (list && list.clientWidth) setIndex(Math.round(list.scrollLeft / list.clientWidth));
  }

  function chooseDates() {
    closeDrawer();
    // The 02.1 bar is a frozen component: it is opened as a guest would, by its own date field.
    const field = [...document.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.offsetParent !== null && /Chọn ngày|Nhận phòng/.test(b.textContent ?? ""));
    window.scrollTo({ top: 0, behavior: "auto" });
    requestAnimationFrame(() => (field ? field.click() : undefined));
  }

  return (
    <>
      <button ref={trigger} type="button" className={styles.roomDetailButton} onClick={openDrawer} aria-haspopup="dialog">
        Xem chi tiết phòng<span className="sr-only">: {room}</span>
      </button>
      <dialog
        ref={dialog}
        className={styles.drawer}
        aria-label={`Chi tiết phòng ${room}`}
        onClose={() => {
          syncScrollLock();
          setIsOpen(false);
          if (!document.querySelector("dialog[open]")) trigger.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === dialog.current) closeDrawer();
        }}
      >
        <div className={styles.drawerHead}>
          <p className={styles.drawerTitle}>Chi tiết phòng</p>
          <button type="button" className={styles.drawerClose} onClick={closeDrawer}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="m5 5 10 10M15 5 5 15" />
            </svg>
            Đóng
          </button>
        </div>
        <div className={styles.drawerBody}>
          {photos.length ? (
            <div className={styles.drawerGallery}>
              <ul
                ref={strip}
                className={styles.drawerStrip}
                onScroll={onScroll}
                onTouchStart={(event) => {
                  const touch = event.touches[0];
                  if (!touch) return;
                  swipeFrom.current = { x: touch.clientX, y: touch.clientY, scrollLeft: strip.current?.scrollLeft ?? 0 };
                }}
                onTouchEnd={(event) => {
                  const start = swipeFrom.current;
                  swipeFrom.current = null;
                  const touch = event.changedTouches[0];
                  if (!start || !touch || photos.length <= 1) return;
                  const dx = touch.clientX - start.x;
                  const dy = touch.clientY - start.y;
                  const movedByScroll = Math.abs((strip.current?.scrollLeft ?? 0) - start.scrollLeft) > 20;
                  if (!movedByScroll && Math.abs(dx) >= 36 && Math.abs(dx) > Math.abs(dy)) {
                    go(index + (dx < 0 ? 1 : -1));
                  }
                }}
                aria-label={`Ảnh ${room}: ${photos.length} ảnh`}
              >
                {isOpen
                  ? photos.map((photo, i) => (
                      <li key={photo.id} aria-hidden={i !== index}>
                        {photo.src ? (
                          <Image
                            src={photo.src}
                            alt={photo.alt}
                            width={photo.width}
                            height={photo.height}
                            sizes="(min-width: 48rem) 42vw, 100vw"
                            loading={i === 0 ? "eager" : "lazy"}
                            decoding="async"
                          />
                        ) : null}
                      </li>
                    ))
                  : null}
              </ul>
              {photos.length > 1 ? (
                <div className={styles.drawerControls}>
                  <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Ảnh trước">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12.5 4.5 7 10l5.5 5.5" />
                    </svg>
                  </button>
                  <p aria-live="polite">
                    {index + 1}/{photos.length}
                  </p>
                  <button type="button" onClick={() => go(index + 1)} disabled={index === photos.length - 1} aria-label="Ảnh sau">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M7.5 4.5 13 10l-5.5 5.5" />
                    </svg>
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className={styles.drawerInfo}>
            <h2 className={styles.drawerName}>{room}</h2>
            {children}
          </div>
        </div>
        <div className={styles.drawerFoot}>
          {action ?? (
            <button type="button" className={styles.cta} onClick={chooseDates}>
              Chọn ngày lưu trú
            </button>
          )}
          {bookingNote ? <p className={styles.drawerNote}>{bookingNote}</p> : null}
        </div>
      </dialog>
    </>
  );
}
