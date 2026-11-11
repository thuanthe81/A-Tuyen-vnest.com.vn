"use client";

import Link from "next/link";
import { describeAvailability, type AvailabilityView } from "@/domain/hybrid-booking/availability-view";
import { HANDOFF_CTA_LABEL, bookingModeForProperty } from "@/domain/hybrid-booking/booking-mode";
import { resolveHandoffAction, type HandoffAction } from "@/domain/hybrid-booking/ezcloud-handoff";
import { staleAvailability, type PropertyAvailabilityState, type StayRequest } from "@/domain/hybrid-booking/property-availability";
import type { CatalogProperty } from "./booking-results-data";
import styles from "./HybridResults.module.css";
import { DemoPhoto } from "./DemoPhoto";

/**
 * PROVIDER-AWARE PROPERTY RESULTS (hybrid booking V1).
 *
 * One property card for all six properties, with ONE discovery journey (owner decision V1.1, 4/11/2026):
 * the photo, the name and "Chọn phòng" always open the property's own detail page, with the stay kept.
 * Provider differences start only at the explicit availability or booking action, decided by the
 * property's booking mode (`booking-mode.ts`), never by a provider name in the markup:
 *  - native (GoHost): "Kiểm tra phòng trống", the intentional room-first search inside these results.
 *  - external hand-off (ezCloud): "Kiểm tra giá & đặt phòng", with no price, availability or sold-out claim.
 * The list keeps the collection's fixed order. It is never sorted by price, never counts available
 * rooms across properties and never offers one cart across two systems.
 */
export function AvailabilityNote({ view, onRetry }: { view: AvailabilityView; onRetry?: () => void }) {
  return (
    <div className={styles.availability} data-status={view.status} data-tone={view.tone} data-testid={`availability-${view.status}`}>
      <p className={styles.availabilityHeadline}>{view.headline}</p>
      {view.detail ? <p className={styles.availabilityDetail}>{view.detail}</p> : null}
      {view.price ? (
        <p className={styles.price} data-testid="verified-price">
          <span className={styles.priceAmount}>{view.price.amount}</span>
          <span className={styles.priceContext}>{view.price.context}</span>
          {view.price.simulated ? <span className={styles.simulatedTag}>Mô phỏng · không phải giá thật</span> : null}
          {view.price.conditions.length ? <span className={styles.priceContext}>{view.price.conditions.join(" · ")}</span> : null}
        </p>
      ) : null}
      {view.retryable && onRetry ? (
        <button type="button" className={styles.retry} onClick={onRetry}>
          Thử lại
        </button>
      ) : null}
    </div>
  );
}

type CardActions = {
  /** The explicit availability / booking action inside the results (room-first for native, the hand-off state for external). */
  onOpen: (propertyId: string) => void;
  onEditDates: () => void;
  onRetry: () => void;
  /** The property's detail page, carrying the stay. */
  detailHref: (propertyId: string) => string | undefined;
};

/** The discovery action, the same for every property. */
export const DISCOVERY_CTA_LABEL = "Chọn phòng";
/** The explicit availability search for properties that book inside VNest. */
export const AVAILABILITY_CTA_LABEL = "Kiểm tra phòng trống";

function HandoffLink({ action, className, onFallback }: { action: HandoffAction; className: string | undefined; onFallback: () => void }) {
  if (action.kind === "external") {
    return (
      <a href={action.href} className={className} rel="noopener noreferrer" data-testid="handoff-cta">
        {HANDOFF_CTA_LABEL}
      </a>
    );
  }
  return (
    <button type="button" className={className} onClick={onFallback} data-testid="handoff-cta">
      {HANDOFF_CTA_LABEL}
    </button>
  );
}

function PropertyResultCard({
  property,
  state,
  stay,
  actions,
}: {
  property: CatalogProperty;
  state: PropertyAvailabilityState;
  stay: StayRequest;
  actions: CardActions;
}) {
  const mode = bookingModeForProperty(property.id);
  const view = describeAvailability(state);
  const detailHref = actions.detailHref(property.id);
  const handoff = mode === "external-handoff" ? resolveHandoffAction(property.id, stay) : null;

  // The explicit, provider-specific action. It is secondary: discovery always goes through the property page.
  const providerAction =
    mode === "external-handoff" && handoff ? (
      <HandoffLink action={handoff} className={styles.secondary} onFallback={() => actions.onOpen(property.id)} />
    ) : state.status === "unavailable" ? (
      <button type="button" className={styles.secondary} onClick={actions.onEditDates}>
        Đổi ngày
      </button>
    ) : (
      <button type="button" className={styles.secondary} onClick={() => actions.onOpen(property.id)} data-testid="check-availability">
        {AVAILABILITY_CTA_LABEL}
      </button>
    );

  const media = property.coverPhoto ? (
    <DemoPhoto photo={property.coverPhoto} sizes="(min-width: 64rem) 360px, (min-width: 44rem) 40vw, 100vw" alt="" loading="lazy" />
  ) : (
    <div className={styles.placeholder}>{property.name}</div>
  );

  return (
    <li className={styles.card} data-property={property.id} data-status={state.status} data-mode={mode}>
      {/* The photo is a second way into the same page; it is hidden from assistive tech, the name carries the link. */}
      {detailHref ? (
        <Link href={detailHref} className={styles.media} tabIndex={-1} aria-hidden="true" data-testid="property-photo-link">
          {media}
        </Link>
      ) : (
        <div className={styles.media}>{media}</div>
      )}
      <div className={styles.body}>
        <p className={styles.kicker}>{property.locationLabel}</p>
        <h2 className={styles.name}>
          {detailHref ? (
            <Link href={detailHref} className={styles.nameLink} data-testid="property-name-link">
              {property.name}
            </Link>
          ) : (
            property.name
          )}
        </h2>
        {property.descriptionExcerpt ? <p className={styles.excerpt}>{property.descriptionExcerpt}</p> : null}
        <AvailabilityNote view={view} {...(view.retryable ? { onRetry: actions.onRetry } : {})} />
        <div className={styles.actions}>
          {detailHref ? (
            <Link href={detailHref} className={styles.primary} data-testid="open-property">
              {DISCOVERY_CTA_LABEL}
            </Link>
          ) : null}
          {providerAction}
        </div>
      </div>
    </li>
  );
}

export function PropertyResultsList({
  properties,
  states,
  stale,
  stay,
  actions,
}: {
  properties: readonly CatalogProperty[];
  states: Readonly<Record<string, PropertyAvailabilityState>>;
  /** The stay changed after the states were checked: nothing verified is shown. */
  stale: boolean;
  stay: StayRequest;
  actions: CardActions;
}) {
  return (
    <ul className={styles.list} aria-label="Nơi lưu trú VNest" data-testid="property-results">
      {properties.map((property) => {
        const raw = states[property.id];
        if (!raw) return null;
        return <PropertyResultCard key={property.id} property={property} state={stale ? staleAvailability(raw) : raw} stay={stay} actions={actions} />;
      })}
    </ul>
  );
}

/**
 * The ezCloud property inside the results: the property summary and an honest hand-off state. Nothing
 * here is a room choice or a price, because the booking, rates and availability live on the provider's page.
 */
export function HandoffPanel({
  property,
  stay,
  summary,
  detailHref,
  onEditDates,
}: {
  property: CatalogProperty;
  stay: StayRequest;
  summary: string;
  detailHref: string | undefined;
  onEditDates: () => void;
}) {
  const action = resolveHandoffAction(property.id, stay);
  const hasDates = Boolean(stay.checkIn && stay.checkOut);
  return (
    <section className={styles.handoff} aria-labelledby="handoff-title" data-testid="handoff-panel" data-handoff={action.kind}>
      <div className={styles.handoffMedia}>
        {property.coverPhoto ? <DemoPhoto photo={property.coverPhoto} sizes="(min-width: 44rem) 40vw, 100vw" alt={property.name} /> : <div className={styles.placeholder}>{property.name}</div>}
      </div>
      <div className={styles.handoffBody}>
        <p className={styles.kicker}>{property.locationLabel}</p>
        <h2 id="handoff-title" className={styles.name}>
          {property.name}
        </h2>
        <p className={styles.handoffStay} data-testid="handoff-stay">
          {summary}
        </p>
        {action.kind === "external" ? (
          <>
            <p className={styles.excerpt}>
              Bước đặt phòng của {property.name} diễn ra trên trang đặt phòng của cơ sở, nơi hiển thị giá và tình trạng phòng.
              {action.transfers.dates && action.transfers.guests
                ? " Ngày và số khách bạn chọn được chuyển sang đó."
                : action.transfers.dates
                  ? " Ngày bạn chọn được chuyển sang đó; số khách cần chọn lại."
                  : " Ngày và số khách cần được chọn lại ở đó."}
              {stay.children && !action.transfers.children ? ` Số trẻ em (${stay.children}) cần được nhập lại ở đó.` : ""}
            </p>
            <div className={styles.actions}>
              <HandoffLink action={action} className={styles.primary} onFallback={onEditDates} />
              {detailHref ? (
                <Link href={detailHref} className={styles.secondary}>
                  Xem các phòng
                </Link>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <p className={styles.handoffNotice} role="note" data-testid="handoff-unconfigured">
              <strong>{HANDOFF_CTA_LABEL}</strong> chưa được kết nối trong bản xem trước. VNest chưa gửi yêu cầu nào, chưa giữ phòng nào và chưa hiển thị giá hay tình trạng phòng.
            </p>
            <p className={styles.excerpt}>
              {hasDates ? "Ngày và số khách bạn chọn vẫn được giữ trên VNest, nhưng chưa được chuyển sang trang đặt phòng." : "Chọn ngày ở thanh đặt phòng phía trên để chuẩn bị kỳ lưu trú."}
            </p>
            <div className={styles.actions}>
              {detailHref ? (
                <Link href={detailHref} className={styles.primary}>
                  Xem các phòng
                </Link>
              ) : null}
              <button type="button" className={styles.secondary} onClick={onEditDates}>
                Đổi ngày
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
