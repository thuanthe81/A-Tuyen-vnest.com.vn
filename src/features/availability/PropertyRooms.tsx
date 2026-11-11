"use client";

import Link from "next/link";
import { useState } from "react";
import { CardVisual } from "@/components/property-card/CardVisual";
import { getBookingReadiness } from "@/domain/booking";
import type { SearchCriteria } from "@/domain/search";
import { issueMessage } from "@/features/booking-search/copy";
import { fieldOfIssue } from "@/features/booking-search/search-form";
import { detailMessage, failureMessage, resultsCopy } from "./copy";
import type { PricedOffer, RoomStay, Selection } from "./derive";
import { derivePropertyStay, deriveRoomStays, findSelected, unpricedRoomAction } from "./derive";
import { formatMoney, formatTime } from "./format";
import { Notice, PriceLine, PriceUnavailable, SimulatedTag, Skeleton, StatusLabel, buttonQuiet } from "./parts";
import { openSearch } from "./search-control";
import type { AvailabilityView } from "./useAvailability";
import type { RoomView } from "./view-models";

/** A room shows this many rates before folding the rest away. */
const RATES_SHOWN = 3;

function facts(room: RoomView): string {
  return [room.maxOccupancy !== undefined ? resultsCopy.capacity(room.maxOccupancy) : undefined, room.bedding, room.areaSqm !== undefined ? resultsCopy.area(room.areaSqm) : undefined]
    .filter(Boolean)
    .join(" · ");
}

function RoomHeader({ room, note, priority = false }: { room: RoomView; note?: React.ReactNode; priority?: boolean }) {
  const line = facts(room);
  return (
    <div className="flex items-center gap-4 p-4 sm:gap-5 sm:p-5">
      <CardVisual image={room.image} sizes="(min-width: 40rem) 10rem, 6rem" showLabel={false} priority={priority} className="aspect-[4/3] w-24 shrink-0 rounded-(--bk-r-field) sm:w-44" />
      <div className="min-w-0 flex-1">
        <h4 className="text-(length:--vn-text-xl) leading-snug font-medium tracking-[-0.01em] text-balance">{room.name}</h4>
        {/* Only what the record holds: a missing fact is left out, never filled in. */}
        {line ? <p className="mt-1 text-sm text-ink-muted">{line}</p> : null}
        {note}
      </div>
    </div>
  );
}

function RateOption({ offer, checked, simulated, stale, onChoose }: { offer: PricedOffer; checked: boolean; simulated: boolean; stale: boolean; onChoose: () => void }) {
  const terms: [string, string][] = [];
  if (offer.ratePlan?.inclusions?.length) terms.push([resultsCopy.inclusions, offer.ratePlan.inclusions.join(", ")]);
  if (offer.cancellationPolicy) terms.push([resultsCopy.cancellation, offer.cancellationPolicy]);
  if (offer.paymentTerms) terms.push([resultsCopy.payment, offer.paymentTerms]);

  return (
    <label className="flex cursor-pointer gap-3 p-4 sm:px-5 transition-colors duration-(--vn-duration-fast) hover:bg-capsule has-checked:bg-capsule-field has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-(--vn-focus)">
      {/* One radio group across every room: a stay has one rate, and arrow keys walk all of them. */}
      <input type="radio" name="offer" value={offer.offerRef} checked={checked} onChange={onChoose} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-ink-muted transition-colors duration-(--vn-duration-fast) peer-checked:border-ink peer-checked:bg-ink"
      >
        <span className="size-2 rounded-full bg-surface-raised" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:justify-between sm:gap-6">
        <span className="flex min-w-0 flex-col gap-1">
          <span className="font-medium text-ink">{offer.ratePlan?.name ?? resultsCopy.rateUnnamed}</span>
          {terms.length > 0 ? (
            terms.map(([term, text]) => (
              // The provider's own words, shown as given. The site writes no terms.
              <span key={term} className="text-sm leading-snug text-ink-muted">
                <span className="font-medium text-ink">{term}:</span> {text}
              </span>
            ))
          ) : (
            <span className="text-sm leading-snug text-ink-muted">{resultsCopy.termsLater}</span>
          )}
        </span>
        <span className="shrink-0">
          <PriceLine price={offer.price} simulated={simulated} stale={stale} showAverage align="end" />
        </span>
      </span>
    </label>
  );
}

function RoomRates({ stay, selection, simulated, stale, priority, onChoose }: { stay: Extract<RoomStay, { kind: "rates" }>; priority: boolean; selection: Selection | undefined; simulated: boolean; stale: boolean; onChoose: (selection: Selection) => void }) {
  const [expanded, setExpanded] = useState(false);
  const room: RoomView = stay.room;
  const chosenRef = selection?.kind === "rate" && selection.roomTypeId === room.id ? selection.offerRef : undefined;
  const chosenIndex = chosenRef === undefined ? -1 : stay.offers.findIndex((offer) => offer.offerRef === chosenRef);
  // A chosen rate is never folded out of sight.
  const shown = expanded || chosenIndex >= RATES_SHOWN ? stay.offers : stay.offers.slice(0, RATES_SHOWN);
  const hidden = stay.offers.length - RATES_SHOWN;

  return (
    <fieldset className="min-w-0 overflow-hidden rounded-(--bk-r-shell) border border-line bg-surface-raised">
      <legend className="sr-only">{resultsCopy.ratesOf(room.name)}</legend>
      <RoomHeader
        room={room}
        priority={priority}
        // Stated only when the provider gives a count. Never estimated, never used as pressure.
        note={stay.unitsLeft !== undefined ? <p className="mt-1 text-sm text-ink-muted">{resultsCopy.unitsLeft(stay.unitsLeft)}</p> : undefined}
      />
      <ul className="divide-y divide-line border-t border-line">
        {shown.map((offer) => (
          <li key={offer.offerRef}>
            <RateOption
              offer={offer}
              checked={chosenRef === offer.offerRef}
              simulated={simulated}
              stale={stale}
              onChoose={() => onChoose({ kind: "rate", roomTypeId: room.id, offerRef: offer.offerRef })}
            />
          </li>
        ))}
      </ul>
      {hidden > 0 && chosenIndex < RATES_SHOWN ? (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
          className="flex h-12 w-full items-center justify-center border-t border-line text-sm font-medium text-ink underline underline-offset-4 transition-colors duration-(--vn-duration-fast) hover:bg-capsule"
        >
          {expanded ? resultsCopy.fewerRates : resultsCopy.moreRates(hidden)}
        </button>
      ) : null}
      {stay.unpriced.length > 0 ? (
        // Offers the provider sent without a price are named, and cannot be chosen as a rate.
        <p className="border-t border-line p-4 text-sm text-ink-muted sm:px-5">{resultsCopy.unpricedOffers(stay.unpriced.map((offer) => offer.ratePlan?.name ?? resultsCopy.rateUnnamed).join(", "))}</p>
      ) : null}
    </fieldset>
  );
}

/**
 * A room the provider says is available without giving a verified price. It is presented as
 * a room, never as a rate: no figure, no radio among the rates. Whether it can be taken
 * forward depends on what the provider declares it supports.
 */
function RoomWithoutPrice({
  stay,
  chosen,
  simulated,
  canSelect,
  priority,
  onChoose,
}: {
  stay: Extract<RoomStay, { kind: "unpriced" }>;
  chosen: boolean;
  simulated: boolean;
  canSelect: boolean;
  priority: boolean;
  onChoose: (selection: Selection) => void;
}) {
  const room: RoomView = stay.room;
  return (
    <div className="overflow-hidden rounded-(--bk-r-shell) border border-line bg-surface-raised">
      <RoomHeader room={room} priority={priority} note={stay.unitsLeft !== undefined ? <p className="mt-1 text-sm text-ink-muted">{resultsCopy.unitsLeft(stay.unitsLeft)}</p> : undefined} />
      <div className={`flex flex-col gap-4 border-t border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${chosen ? "bg-capsule-field" : ""}`}>
        <PriceUnavailable simulated={simulated} />
        {canSelect ? (
          <button type="button" aria-pressed={chosen} onClick={() => onChoose({ kind: "room", roomTypeId: room.id })} className={`${buttonQuiet} aria-pressed:bg-ink aria-pressed:text-surface-raised`}>
            {chosen ? resultsCopy.roomSelected : resultsCopy.selectRoom}
            <span className="sr-only">: {room.name}</span>
          </button>
        ) : (
          <p className="max-w-[18rem] text-sm leading-snug text-ink-muted">{resultsCopy.noPriceNoHandoff}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Room and rate selection for one property and one stay (section 02.2). It is a part of the
 * property page (section 05.1), which owns the gallery, the identity and everything around
 * it; this component owns availability, prices, terms, the choice and the way on.
 *
 * INTERIM PRESENTATION. The rules and states here are the approved ones. The tall room
 * cards are to be replaced by compact room blocks at a later checkpoint.
 */
export function PropertyRooms({
  property: card,
  rooms,
  criteria,
  staySummary,
  view,
  timeZone,
  retrying,
  onReload,
  onRetryProperty,
  allHref,
}: {
  property: { id: string; slug: string };
  rooms: readonly RoomView[];
  criteria: SearchCriteria;
  staySummary: string | undefined;
  view: AvailabilityView;
  timeZone: string;
  retrying: readonly string[];
  onReload: () => void;
  onRetryProperty: (property: { id: string; slug: string }) => void;
  /** The same search across all properties. */
  allHref: string;
}) {
  const [selection, setSelection] = useState<Selection>();
  const [boundary, setBoundary] = useState<string>();

  const answer = view.kind === "ready" ? view.answer : undefined;
  const stale = view.kind === "ready" && view.stale;
  const simulated = answer?.source === "mock";
  const property = { id: card.id, rooms };
  const stay = answer ? derivePropertyStay(answer, property, criteria.adults) : undefined;
  const roomStays = answer ? deriveRoomStays(answer, property, criteria.adults) : [];
  const bookable = roomStays.filter((room) => room.kind === "rates" || room.kind === "unpriced");
  const others = roomStays.filter((room) => room.kind !== "rates" && room.kind !== "unpriced");
  const hasRates = bookable.some((room) => room.kind === "rates");
  // A room without a price can be taken forward only if the provider declares a hand-off for it.
  const canSelectRoom = view.kind === "ready" && unpricedRoomAction(view.capabilities) === "select-room";
  const showSummary = hasRates || (bookable.length > 0 && canSelectRoom);
  const selected = findSelected(roomStays, selection);
  // The guest chose a rate that a newer answer no longer holds.
  const offerGone = selection !== undefined && answer !== undefined && !selected;
  const busy = retrying.includes(card.id);

  const choose = (next: Selection) => {
    setSelection(next);
    setBoundary(undefined);
  };

  const onContinue = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || stale) return;
    // A room alone is not a bookable selection: there is no offer to hand over, and no price is claimed.
    if (selected.kind === "room") return setBoundary(resultsCopy.boundaryRoom);
    // The one tested answer to "can this be booked?". Mock data reads as simulated, never bookable.
    const readiness = getBookingReadiness({ propertyId: card.id, roomTypeId: selected.room.id, criteria, issues: [], availability: answer, selectedOfferRef: selected.offer.offerRef, ...(selected.room.maxOccupancy !== undefined ? { maxOccupancy: selected.room.maxOccupancy } : {}) });
    if (readiness.kind === "simulated") setBoundary(resultsCopy.boundarySimulated);
    else if (readiness.kind === "bookable") setBoundary(resultsCopy.boundaryNotBuilt);
    else setSelection(undefined);
  };

  const status =
    view.kind === "loading" ? (
      <StatusLabel tone="checking">{resultsCopy.statusChecking}</StatusLabel>
    ) : stale ? (
      <StatusLabel tone="stale">{resultsCopy.statusStale}</StatusLabel>
    ) : stay?.status === "available" ? (
      <StatusLabel tone="available">{resultsCopy.statusAvailable}</StatusLabel>
    ) : stay?.status === "sold-out" ? (
      <StatusLabel tone="sold-out">{resultsCopy.statusSoldOut}</StatusLabel>
    ) : stay?.status === "error" || (view.kind === "failed" && view.reason !== "not-configured") ? (
      <StatusLabel tone="error">{resultsCopy.statusError}</StatusLabel>
    ) : stay?.status === "unknown" ? (
      <StatusLabel tone="unknown">{resultsCopy.statusUnknown}</StatusLabel>
    ) : null;

  const announcement =
    view.kind === "loading" ? resultsCopy.checkingHeading : stay?.status === "available" ? `${resultsCopy.roomsHeading}: ${bookable.length}` : stay?.status === "sold-out" ? resultsCopy.propertySoldOut : "";

  const changeDates = (
    <button type="button" onClick={() => openSearch("checkIn")} className={buttonQuiet}>
      {resultsCopy.changeDates}
    </button>
  );
  const otherProperties = (
    <Link href={allHref} className={buttonQuiet}>
      {resultsCopy.otherProperties}
    </Link>
  );

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-(length:--vn-text-2xl) leading-(--vn-leading-tight) font-medium tracking-[-0.02em]">{resultsCopy.roomsTitle}</h2>
          <p className="mt-1 text-[0.9375rem] text-ink-muted">{staySummary ?? resultsCopy.roomsBrowseHint}</p>
        </div>
        {status}
      </div>

      <p role="status" className="sr-only">
        {announcement}
      </p>

      {/* The second column exists only when there is something to choose and continue with. */}
      <form onSubmit={onContinue} noValidate className={`mt-(--vn-space-8) ${showSummary ? "lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-12" : "max-w-[52rem]"}`}>
        <div className="flex min-w-0 flex-col gap-4">
          {view.kind === "invalid" ? (
            <Notice
              tone="critical"
              title={resultsCopy.invalidHeading}
              action={
                <button type="button" onClick={() => openSearch(view.issues[0] && fieldOfIssue(view.issues[0]) === "guests" ? "guests" : "checkIn")} className={buttonQuiet}>
                  {resultsCopy.fixSearch}
                </button>
              }
            >
              <ul>
                {view.issues.map((issue, index) => (
                  <li key={index}>{issueMessage(issue)}</li>
                ))}
              </ul>
            </Notice>
          ) : null}

          {view.kind === "failed" ? (
            <Notice
              tone={view.reason === "not-configured" ? "neutral" : "critical"}
              title={view.reason === "not-configured" ? resultsCopy.notConnectedHeading : resultsCopy.failedHeading}
              action={
                view.retryable ? (
                  <button type="button" onClick={onReload} className={buttonQuiet}>
                    {resultsCopy.retry}
                  </button>
                ) : undefined
              }
            >
              {view.reason === "not-configured" ? resultsCopy.notConnectedBody : failureMessage(view.reason)}
            </Notice>
          ) : null}

          {stale ? (
            <Notice
              tone="caution"
              title={resultsCopy.staleTitle}
              action={
                <button type="button" onClick={onReload} className={buttonQuiet}>
                  {resultsCopy.refresh}
                </button>
              }
            >
              {resultsCopy.staleBody(view.kind === "ready" ? formatTime(view.receivedAt, timeZone) : undefined)}
            </Notice>
          ) : null}

          {offerGone ? <Notice tone="caution" title={resultsCopy.offerGone} /> : null}

          {stay?.status === "error" ? (
            <Notice
              tone="critical"
              title={resultsCopy.failedHeading}
              action={
                stay.retryable ? (
                  <button type="button" aria-busy={busy} aria-disabled={busy} onClick={() => onRetryProperty({ id: card.id, slug: card.slug })} className={`${buttonQuiet} aria-disabled:cursor-progress aria-disabled:opacity-60`}>
                    {busy ? resultsCopy.retrying : resultsCopy.retry}
                  </button>
                ) : undefined
              }
            >
              {failureMessage(stay.failure ?? "unknown")}
            </Notice>
          ) : null}

          {stay?.status === "sold-out" ? (
            <Notice
              title={resultsCopy.statusSoldOut}
              action={
                <>
                  {otherProperties}
                  {changeDates}
                </>
              }
            >
              {resultsCopy.propertySoldOut}
            </Notice>
          ) : null}

          {stay?.status === "unknown" ? (
            <Notice
              title={detailMessage(stay.detail, criteria.adults)}
              action={
                stay.detail === "over-capacity" ? (
                  <>
                    <button type="button" onClick={() => openSearch("guests")} className={buttonQuiet}>
                      {resultsCopy.changeGuests}
                    </button>
                    {otherProperties}
                  </>
                ) : (
                  otherProperties
                )
              }
            >
              {stay.detail === "over-capacity" && stay.largestRoom ? resultsCopy.largestRoom(stay.largestRoom) : undefined}
            </Notice>
          ) : null}

          {view.kind === "loading" ? (
            // Outlines while the provider is asked; the rooms then appear already in their final order.
            <div aria-hidden="true" className="flex flex-col gap-4">
              <Skeleton className="h-4 w-36" />
              {rooms.map((room) => (
                <div key={room.id} className="overflow-hidden rounded-(--bk-r-shell) border border-line bg-surface-raised">
                  <div className="flex items-center gap-4 p-4 sm:gap-5 sm:p-5">
                    <Skeleton className="aspect-[4/3] w-24 shrink-0 rounded-(--bk-r-field) sm:w-44" />
                    <span className="flex flex-col gap-2">
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-4 w-52 max-w-full" />
                    </span>
                  </div>
                  {[0, 1].map((row) => (
                    <div key={row} className="flex items-start justify-between gap-6 border-t border-line p-4 sm:px-5">
                      <span className="flex flex-col gap-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48 max-w-full" />
                      </span>
                      <span className="flex flex-col items-end gap-2">
                        <Skeleton className="h-7 w-28" />
                        <Skeleton className="h-4 w-20" />
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : null}

          {view.kind === "idle" || view.kind === "invalid" || view.kind === "failed" ? (
            // No dates, or no answer: the rooms the property has, with no claim about price or availability.
            <>
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-[0.6875rem] font-medium tracking-(--bk-label-tracking) text-ink-muted uppercase">{resultsCopy.roomsBrowseHeading}</h3>
                {view.kind === "idle" ? (
                  <button type="button" onClick={() => openSearch("checkIn")} className={buttonQuiet}>
                    {resultsCopy.chooseDates}
                  </button>
                ) : null}
              </div>
              {rooms.map((room, index) => (
                <div key={room.id} className="overflow-hidden rounded-(--bk-r-shell) border border-line bg-surface-raised">
                  <RoomHeader room={room} priority={index < 2} />
                </div>
              ))}
            </>
          ) : null}

          {bookable.length > 0 ? (
            <>
              <h3 className="flex items-center gap-2 text-[0.6875rem] font-medium tracking-(--bk-label-tracking) text-ink-muted uppercase">
                {resultsCopy.roomsHeading}
                {simulated ? <SimulatedTag /> : null}
              </h3>
              {bookable.map((room, index) =>
                room.kind === "rates" ? (
                  <RoomRates key={room.room.id} priority={index < 2} stay={room} selection={selection} simulated={simulated} stale={stale} onChoose={choose} />
                ) : room.kind === "unpriced" ? (
                  <RoomWithoutPrice
                    key={room.room.id}
                    priority={index < 2}
                    stay={room}
                    chosen={selection?.kind === "room" && selection.roomTypeId === room.room.id}
                    simulated={simulated}
                    canSelect={canSelectRoom}
                    onChoose={choose}
                  />
                ) : null,
              )}
            </>
          ) : null}

          {others.length > 0 ? (
            <section aria-labelledby="other-rooms-heading" className="mt-(--vn-space-4)">
              <h3 id="other-rooms-heading" className="border-b border-line pb-3 text-[0.6875rem] font-medium tracking-(--bk-label-tracking) text-ink-muted uppercase">
                {resultsCopy.unavailableRooms}
              </h3>
              <ul className="divide-y divide-line">
                {others.map((room) => (
                  <li key={room.room.id} className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <h4 className="truncate font-medium text-ink">{room.room.name}</h4>
                      <p className="text-sm text-ink-muted">
                        {room.kind === "sold-out" ? resultsCopy.soldOutRow : room.kind === "over-capacity" ? resultsCopy.roomTooSmall(criteria.adults, room.maxOccupancy) : resultsCopy.roomUnverified}
                      </p>
                    </div>
                    {room.kind === "sold-out" ? <StatusLabel tone="sold-out">{resultsCopy.roomSoldOut}</StatusLabel> : <StatusLabel tone="unknown">{room.kind === "over-capacity" ? resultsCopy.capacity(room.maxOccupancy) : resultsCopy.statusUnknown}</StatusLabel>}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {view.kind === "ready" && !stale ? <p className="text-xs text-ink-muted">{resultsCopy.updatedAt(formatTime(view.receivedAt, timeZone))}</p> : null}
        </div>

        {/* One summary: a bar fixed to the bottom of a phone once a rate is chosen, a panel beside the rooms on a wide screen. */}
        {showSummary ? (
          <aside
            aria-label={resultsCopy.selectionHeading}
            className={`z-30 border-line bg-surface-raised max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:border-t max-lg:px-(--vn-gutter) max-lg:pt-3 max-lg:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-lg:shadow-pop lg:sticky lg:top-24 lg:rounded-(--bk-r-shell) lg:border lg:p-6 ${
              selected ? "" : "max-lg:hidden"
            }`}
          >
            <h3 className="text-[0.6875rem] font-medium tracking-(--bk-label-tracking) text-ink-muted uppercase max-lg:sr-only">{resultsCopy.selectionHeading}</h3>
            {selected ? (
              <div className="flex items-center justify-between gap-4 lg:mt-3 lg:flex-col lg:items-stretch lg:gap-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink lg:text-(length:--vn-text-lg) lg:whitespace-normal">{selected.room.name}</p>
                  <p className="truncate text-sm text-ink-muted lg:whitespace-normal">
                    {[selected.kind === "rate" ? selected.offer.ratePlan?.name : resultsCopy.roomSelected, staySummary].filter(Boolean).join(" · ")}
                  </p>
                  <div className="mt-1 lg:mt-4 lg:border-t lg:border-line lg:pt-4">
                    <span className="lg:hidden">
                      <span className="text-sm font-semibold tabular-nums">{selected.kind === "rate" ? formatMoney(selected.offer.price.total) : resultsCopy.priceUnavailable}</span>
                    </span>
                    <span className="hidden lg:block">
                      {selected.kind === "rate" ? <PriceLine price={selected.offer.price} simulated={simulated} stale={stale} /> : <PriceUnavailable simulated={simulated} detail={false} />}
                    </span>
                  </div>
                </div>
                {/* The one coloured action on the page. */}
                <button
                  type="submit"
                  aria-disabled={stale}
                  className="flex h-12 shrink-0 items-center justify-center rounded-(--bk-r-field) bg-(--bk-cta) px-5 text-[0.9375rem] font-semibold text-(--bk-on-cta) transition-[background-color,scale] duration-(--vn-duration-fast) hover:bg-(--bk-cta-hover) active:scale-[0.97] aria-disabled:cursor-not-allowed aria-disabled:bg-surface-muted aria-disabled:text-ink-muted lg:h-14"
                >
                  {selected.kind === "rate" ? resultsCopy.continue : resultsCopy.continueWithRoom}
                </button>
              </div>
            ) : (
              <p className="mt-3 text-[0.9375rem] text-ink-muted">{hasRates ? resultsCopy.selectionEmpty : resultsCopy.selectionEmptyRoom}</p>
            )}
            <p role="status" className="text-sm leading-snug text-ink-muted empty:hidden max-lg:mt-2 lg:mt-4">
              {stale && selected ? resultsCopy.continueStale : (boundary ?? (selected?.kind === "room" ? resultsCopy.roomNotRate : undefined))}
            </p>
          </aside>
        ) : null}
      </form>
    </div>
  );
}
