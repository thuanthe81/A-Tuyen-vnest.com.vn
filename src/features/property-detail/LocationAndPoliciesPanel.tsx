"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatKm, LOCATION_TRAVEL, roundMinutes, transportModes } from "./location-travel";
import styles from "./LocationAndPoliciesPanel.module.css";
import type { PropertyDetailView } from "./view";

type Props = {
  id?: string;
  propertySlug: string;
  propertyName: string;
  location: PropertyDetailView["location"];
  transport: string | null;
  policies?: PropertyDetailView["policies"];
  audience: PropertyDetailView["audience"];
};

/**
 * THE OFFICIAL GOOGLE MAPS EMBED (25/10/2026, owner brief): Google's own iframe for the verified place,
 * unchanged, with Google's logo, attribution and controls. It is mounted only when the section comes
 * near the viewport. Until Google's map has loaded (or if it never does), a plain panel shows the address
 * and "Xem trên Google Maps": no drawn map, no tiles, no screenshot, no broken image.
 */
function GoogleMapEmbed({ src, title, address, mapUrl }: { src: string; title: string; address: string | null; mapUrl: string | null }) {
  const box = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<"waiting" | "loaded" | "failed">("waiting");

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let cancelled = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        // A blocked or offline iframe still fires "load" (with the browser's error page), and a
        // cross-origin frame cannot be inspected. So check that Google is reachable first: an opaque
        // no-cors HEAD resolves when it is and rejects when blocked, offline or filtered.
        fetch(src, { method: "HEAD", mode: "no-cors", cache: "no-store" })
          .then(() => !cancelled && setMounted(true))
          .catch(() => !cancelled && setState("failed"));
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [src]);

  useEffect(() => {
    if (!mounted || state !== "waiting") return;
    const timer = window.setTimeout(() => setState((s) => (s === "waiting" ? "failed" : s)), 12000);
    return () => window.clearTimeout(timer);
  }, [mounted, state]);

  return (
    <div ref={box} className={styles.map} data-map-state={mounted || state === "failed" ? state : "idle"}>
      <div className={styles.mapFallback} aria-hidden={state === "loaded" || undefined}>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 17.5s-5.5-4.6-5.5-9a5.5 5.5 0 1 1 11 0c0 4.4-5.5 9-5.5 9Z" />
          <circle cx="10" cy="8.5" r="2" />
        </svg>
        <p className={styles.mapFallbackStatus}>{state === "failed" ? "Không tải được bản đồ Google." : "Đang tải bản đồ Google…"}</p>
        {address ? <p className={styles.mapFallbackAddress}>{address}</p> : null}
        {mapUrl ? (
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={styles.mapFallbackLink} tabIndex={state === "loaded" ? -1 : undefined}>
            Xem trên Google Maps<span aria-hidden="true"> ↗</span>
          </a>
        ) : null}
      </div>
      {mounted ? (
        <iframe
          className={styles.mapFrame}
          src={src}
          title={title}
          loading="lazy"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          data-loaded={state === "loaded" || undefined}
          onLoad={() => setState("loaded")}
        />
      ) : null}
    </div>
  );
}

/**
 * LOCATION MODULE (redesigned 25/10/2026, owner brief): a two-column card, the official Google Maps
 * embed of the verified place on the left (about 58% on desktop) and the essentials on the right: address, nearest airport, distance and drive time (Google Maps estimate, see
 * location-travel.ts), transport (workbook), "Xem trên Google Maps" (the property's own Google place,
 * new tab) and "Xem chính sách đặt phòng". Stacked on phones, map first.
 *
 * The policy dialog lists topics only: VNest has not confirmed which policy lines apply to which
 * property (Q25), so no values and no process promises.
 */
export function LocationAndPoliciesPanel({ id, propertySlug, propertyName, location, transport, policies, audience }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const travel = LOCATION_TRAVEL[propertySlug] ?? null;
  const modes = transportModes(transport);

  const syncScrollLock = () => {
    document.documentElement.style.overflow = document.querySelector("dialog[open]") ? "hidden" : "";
  };

  useEffect(() => {
    const node = dialogRef.current;
    return () => {
      if (node?.open) node.close();
      syncScrollLock();
    };
  }, []);

  const openPolicies = () => {
    dialogRef.current?.showModal();
    syncScrollLock();
  };

  const closePolicies = () => {
    dialogRef.current?.close();
    syncScrollLock();
  };

  return (
    <section id={id} className={styles.module} aria-labelledby={`${titleId}-h`}>
      <h2 id={`${titleId}-h`} className={styles.heading}>
        Vị trí
      </h2>
      <div className={styles.card}>
        {travel ? (
          <GoogleMapEmbed
            src={travel.embed.src}
            title={`Bản đồ Google: ${propertyName}`}
            address={location.street ? [location.street, location.rest].filter(Boolean).join(", ") : location.streetName ? [`Đường ${location.streetName}`, location.rest].filter(Boolean).join(", ") : null}
            mapUrl={location.mapUrl}
          />
        ) : (
          <div className={styles.map} data-map-state="failed">
            <div className={styles.mapFallback}>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 17.5s-5.5-4.6-5.5-9a5.5 5.5 0 1 1 11 0c0 4.4-5.5 9-5.5 9Z" />
                <circle cx="10" cy="8.5" r="2" />
              </svg>
              <p className={styles.mapFallbackStatus}>{propertyName}</p>
              {location.street || location.streetName ? (
                <p className={styles.mapFallbackAddress}>
                  {location.street ? [location.street, location.rest].filter(Boolean).join(", ") : [`Đường ${location.streetName}`, location.rest].filter(Boolean).join(", ")}
                </p>
              ) : null}
              {location.mapUrl ? (
                <a href={location.mapUrl} target="_blank" rel="noopener noreferrer" className={styles.mapFallbackLink}>
                  Xem trên Google Maps<span aria-hidden="true"> ↗</span>
                </a>
              ) : null}
            </div>
          </div>
        )}

        <div className={styles.info}>
          {location.street || location.streetName ? (
            <address className={styles.address}>
              {/* A conflicting house number is left out, never guessed; Google Maps opens the exact place. */}
              <span className={styles.street}>{location.street ?? `Đường ${location.streetName}`}</span>
              {location.rest ? <span className={styles.rest}>{location.rest}</span> : null}
            </address>
          ) : null}
          {audience === "private-preview" && location.note ? <p className={styles.reviewNote}>{location.note}</p> : null}

          {travel ? (
            <dl className={styles.facts}>
              <div>
                <dt>
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M2.5 11.5 17.5 6l-1-2-6 1.5L7 2.5 5.5 3l2 3.5L4 7.5 2.5 6 1.5 6.5l1.5 3Zm1 5h13" />
                  </svg>
                  Sân bay gần nhất
                </dt>
                <dd>
                  {travel.airport.name} <span className={styles.code}>({travel.airport.code})</span>
                </dd>
              </div>
              <div>
                <dt>
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M3 10h14M3 10l3-3M3 10l3 3M17 10l-3-3M17 10l-3 3" />
                  </svg>
                  Cách sân bay
                </dt>
                <dd>khoảng {formatKm(travel.km)}</dd>
              </div>
              <div>
                <dt>
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M3.5 12 5 7.5a1.5 1.5 0 0 1 1.4-1h7.2a1.5 1.5 0 0 1 1.4 1l1.5 4.5v3.5h-13Z M6.5 12.5h.01M13.5 12.5h.01M3.5 15.5v1M16.5 15.5v1" />
                  </svg>
                  Di chuyển
                </dt>
                <dd>khoảng {roundMinutes(travel.minutes)} phút bằng ô tô</dd>
              </div>
            </dl>
          ) : null}

          {modes.length ? (
            <div className={styles.modes}>
              <span className={styles.modesLabel}>Phương tiện thuận tiện</span>
              <ul>
                {modes.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className={styles.actions}>
            {location.mapUrl ? (
              <a href={location.mapUrl} target="_blank" rel="noopener noreferrer" className={styles.mapCta} data-testid="property-google-maps-link">
                Xem trên Google Maps<span aria-hidden="true">↗</span>
                <span className="sr-only"> (mở trong tab mới)</span>
              </a>
            ) : null}
            <button ref={triggerRef} type="button" className={styles.policyBtn} aria-haspopup="dialog" data-testid="open-policy-dialog" onClick={openPolicies}>
              Xem chính sách đặt phòng
            </button>
          </div>

          {travel ? <p className={styles.note}>Khoảng cách và thời gian theo Google Maps, có thể thay đổi theo giao thông.</p> : null}
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className={styles.policyDialog}
        aria-labelledby={titleId}
        onClose={() => {
          syncScrollLock();
          if (!document.querySelector("dialog[open]")) triggerRef.current?.focus();
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) closePolicies();
        }}
      >
        <div className={styles.dialogInner}>
          <div className={styles.dialogHead}>
            <h2 id={titleId} className={styles.dialogTitle}>
              Chính sách đặt phòng · {propertyName}
            </h2>
            <button type="button" className={styles.dialogClose} data-testid="close-policy-dialog" onClick={closePolicies}>
              Đóng
            </button>
          </div>
          <div className={styles.dialogBody}>
            {policies?.length ? (
              <dl className={styles.policyList}>
                {policies.map((policy) => (
                  <div key={policy.id} className={styles.policyRow}>
                    <dt>{policy.label}</dt>
                    <dd>{policy.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <>
                <p className={styles.dialogLead}>
                  VNest chưa xác nhận chính sách áp dụng cho <strong>{propertyName}</strong>. Các mục dưới đây sẽ được cập nhật khi có thông tin chính thức.
                </p>
                <dl className={styles.policyList}>
                  {["Giờ nhận phòng & trả phòng", "Hủy, hoàn tiền & đổi ngày", "Thanh toán & tiền cọc", "Quy định lưu trú chung"].map((topic) => (
                    <div key={topic} className={styles.policyRow}>
                      <dt>{topic}</dt>
                      <dd>Chờ VNest xác nhận</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </div>
        </div>
      </dialog>
    </section>
  );
}
