"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { BookingBar } from "@/features/booking-search/BookingBar";
import { MobileBookingSearch } from "@/features/booking-search/MobileBookingSearch";
import { useStaySearch } from "@/features/booking-search/StaySearchProvider";
import { BOOKING_SLOT, HeaderBookingLink } from "./BookingCta";
import { ContactChannels } from "./ContactChannels";
import { LanguageSwitch } from "@/features/locale/LanguageSwitch";
import { useLocale } from "@/features/locale/LocaleProvider";
import { DEMO_HOME, DEMO_LINKS } from "./links";
import { siteCopyFor } from "./site-copy";
import styles from "./Demo.module.css";

/**
 * CEO DEMO SITE HEADER (21/10/2026; simplified for VNest V3 Stage 1, 24/10/2026, CEO R01/R02).
 *
 * The VNest logo (larger, artwork unchanged), BOOKING and Menu. "Khám phá nơi lưu trú", "Về VNest"
 * and "Hợp tác" left the bar at the CEO's request; all four destinations stay in the Menu overlay.
 * Not section 03.1, which is still a proposal: a header for the presentation only.
 *
 * The header is the one bar at the top of every demo page, and it carries the one booking bar:
 * - `booking="after-hero"` (homepage): BOOKING while the hero's own 02.1 bar is on screen; once the
 *   guest scrolls past it, the compact bar takes BOOKING's place in this same row. It replaces 02.1's
 *   separate sticky bar, so there is never a second bar under the header.
 * - `booking="always"` (property pages, booking step): the compact bar always, in this row. It replaces
 *   the 02.2 results bar the property pages placed under the header (the "two bars" the CEO saw).
 * The 02.1 components are placed unchanged; this only gives them their row.
 *
 * The overlay is a native modal <dialog>: the rest of the page is inert while it is open (focus
 * stays inside), Escape and the close button close it, and focus returns to the menu button.
 * The overlay's contact row shows VNest's official channels (ContactChannels, since 6/11/2026).
 */
// Client review 6/11/2026: four destinations in this order, no numbers. "Về VNest" stays reachable from the footer.
const MENU = [
  { href: DEMO_LINKS.discover, label: "menuDiscover" },
  { href: DEMO_LINKS.partner, label: "menuPartner" },
  { href: DEMO_LINKS.faq, label: "menuFaq" },
  { href: DEMO_LINKS.contact, label: "menuContact" },
] as const;

export function VNestMark({ className, onClick }: { className?: string; onClick?: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  const copy = siteCopyFor(useLocale());
  return (
    <Link href={DEMO_HOME} className={`${styles.brand} ${className ?? ""}`} aria-label={copy.homeLabel} onClick={onClick}>
      {/* eslint-disable-next-line @next/next/no-img-element -- 7 KB vector, VNest's own artwork in approved Copper Bronze */}
      <img className={styles.brandSymbol} src="/dev-fixtures/brand-collection/vnest-symbol-approved.svg" alt="" width={456} height={449} />
      <span className={styles.brandWordmarkGroup}>
        {/* eslint-disable-next-line @next/next/no-img-element -- 4 KB vector, VNest's own artwork in approved Dark Olive */}
        <img className={styles.brandWordmark} src="/dev-fixtures/brand-collection/vnest-wordmark-approved.svg" alt="" width={704} height={168} />
        <span className={styles.brandTagline} lang="en">
          Hospitality Management
        </span>
      </span>
    </Link>
  );
}

function Lines() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M3 6h14M3 10h14M3 14h14" />
    </svg>
  );
}

function Cross() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

/** Contact channels, drawn but not linked: VNest has not supplied the details (no dead links). */
export function ContactPlaceholders() {
  const copy = siteCopyFor(useLocale());
  return (
    <ul className={styles.contactIcons} aria-label={copy.contactChannels}>
      <li>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" />
        </svg>
        {copy.phone}
      </li>
      <li>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
          <path d="m4 7 8 6 8-6" />
        </svg>
        Email
      </li>
      <li aria-label={copy.channelPending("Facebook")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M14 21v-8h3l.5-4H14V7c0-1 .5-2 2-2h2V2h-3c-3 0-5 2-5 5v2H7v4h3v8" /></svg>
        Facebook
      </li>
      <li aria-label={copy.channelPending("Instagram")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" /></svg>
        Instagram
      </li>
      <li aria-label={copy.channelPending("TikTok")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M14 3v13a5 5 0 1 1-5-5v3a2 2 0 1 0 2 2V3h3c0 3 2 5 5 5v3c-2 0-4-1-5-2" /></svg>
        TikTok
      </li>
      <li className={styles.contactNote}>{copy.pending}</li>
    </ul>
  );
}

/** The booking row and actions, for headers that carry the booking bar (inside StaySearchProvider). */
function BookingAware({ mode, menu }: { mode: "after-hero" | "always"; menu: ReactNode }) {
  const { stickyActive } = useStaySearch();
  const copy = siteCopyFor(useLocale());
  // 02.1's own hand-over measures against the top of the viewport; this header is sticky, so the
  // hero bar can sit hidden beneath it. Hand over as soon as the hero bar passes under the header.
  const [underHeader, setUnderHeader] = useState(false);
  useEffect(() => {
    if (mode !== "after-hero") return;
    const bar = document.getElementById("dat-phong");
    const header = document.getElementById("top");
    if (!bar || !header) return;
    const height = Math.round(header.getBoundingClientRect().height);
    const observer = new IntersectionObserver(([entry]) => entry && setUnderHeader(!entry.isIntersecting && entry.boundingClientRect.top < height), { rootMargin: `-${height}px 0px 0px 0px` });
    observer.observe(bar);
    return () => observer.disconnect();
  }, [mode]);
  const shown = mode === "always" || stickyActive || underHeader;
  return (
    <>
      <div className={styles.headerBooking} data-shown={shown} inert={!shown} {...{ [BOOKING_SLOT]: "header" }}>
        <BookingBar variant="compact" hidden={!shown} className="hidden md:flex" />
        <MobileBookingSearch variant="compact" className="flex md:hidden" />
      </div>
      <nav aria-label={copy.mainNav} className={styles.nav}>
        <LanguageSwitch className={styles.headerLanguage} />
        {shown ? null : <HeaderBookingLink href={`${DEMO_HOME}#dat-phong`} className={styles.bookingLink} />}
        {menu}
      </nav>
    </>
  );
}

export function SiteHeader({ booking }: { booking?: "after-hero" | "always" }) {
  const copy = siteCopyFor(useLocale());
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(true);

  const syncScrollLock = () => {
    document.documentElement.style.overflow = document.querySelector("dialog[open]") ? "hidden" : "";
  };

  useEffect(() => {
    const node = dialog.current;
    const onPopState = () => {
      document.querySelectorAll<HTMLDialogElement>("dialog[open]").forEach((d) => d.close());
      document.documentElement.style.overflow = "";
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      if (node?.open) node.close();
      syncScrollLock();
    };
  }, []);

  const openMenu = () => {
    restoreFocus.current = true;
    dialog.current?.showModal();
    syncScrollLock();
  };

  const close = () => {
    dialog.current?.close();
    syncScrollLock();
  };

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    restoreFocus.current = false;
    dialog.current?.close();
    syncScrollLock();
    if (typeof window === "undefined") return;
    if (href === DEMO_HOME && window.location.pathname === DEMO_HOME) {
      event.preventDefault();
      window.history.pushState(window.history.state, "", `${DEMO_HOME}${window.location.search}`);
      window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      return;
    }
    if (href.startsWith(`${DEMO_HOME}#`) && window.location.pathname === DEMO_HOME) {
      const hashId = href.slice(DEMO_HOME.length + 1);
      const target = document.getElementById(hashId);
      if (target) {
        event.preventDefault();
        window.history.pushState(window.history.state, "", `${DEMO_HOME}${window.location.search}${href.slice(DEMO_HOME.length)}`);
        requestAnimationFrame(() => {
          target.scrollIntoView({
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
            block: "start",
          });
        });
      }
    }
  };

  const menu = (
    <button ref={trigger} type="button" className={styles.menuButton} aria-haspopup="dialog" onClick={openMenu}>
      <Lines />
      <span className={styles.menuLabel}>{copy.menu}</span>
      <span className="sr-only">{copy.openMenu}</span>
    </button>
  );

  return (
    <header id="top" className={styles.header}>
      <div className={styles.headerInner}>
        <VNestMark />
        {booking ? (
          <BookingAware mode={booking} menu={menu} />
        ) : (
          <>
            <span aria-hidden="true" />
            <nav aria-label={copy.mainNav} className={styles.nav}>
              <LanguageSwitch className={styles.headerLanguage} />
              <HeaderBookingLink href={`${DEMO_HOME}#dat-phong`} className={styles.bookingLink} />
              {menu}
            </nav>
          </>
        )}
      </div>

      <dialog
        ref={dialog}
        className={styles.overlay}
        aria-label={copy.menuDialog}
        onClose={() => {
          syncScrollLock();
          if (restoreFocus.current && !document.querySelector("dialog[open]")) trigger.current?.focus();
          restoreFocus.current = true;
        }}
        onClick={(event) => {
          if (event.target === dialog.current) close();
        }}
      >
        <div className={styles.overlayInner}>
          <div className={styles.overlayTop}>
            <VNestMark onClick={(event) => handleNavClick(event, DEMO_HOME)} />
            <button type="button" className={styles.closeButton} onClick={close}>
              <Cross />
              {copy.close}
            </button>
          </div>
          <nav aria-label="Menu" className={styles.overlayNav}>
            <ul>
              {MENU.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={(event) => handleNavClick(event, item.href)}>
                    {copy[item.label]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <LanguageSwitch className={styles.menuLanguage} onSwitch={close} />
          <div className={styles.overlayContact}>
            <p className={styles.kicker}>{copy.contactKicker}</p>
            <ContactChannels tone="light" compact />
          </div>
        </div>
      </dialog>
    </header>
  );
}
