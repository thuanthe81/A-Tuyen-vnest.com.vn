"use client";

import Link from "next/link";
import { useState } from "react";
import { CardVisual } from "@/components/property-card/CardVisual";
import type { PropertyCardModel } from "@/components/property-card/model";
import { PropertyCard, PropertyCardSkeleton } from "@/components/property-card/PropertyCard";
import type { SearchCriteria } from "@/domain/search";
import { issueMessage } from "@/features/booking-search/copy";
import { fieldOfIssue } from "@/features/booking-search/search-form";
import { detailMessage, failureMessage, resultsCopy } from "./copy";
import type { PropertyStay, SortOrder } from "./derive";
import { canSortByPrice, derivePropertyStay, initialLayout, orderStays, summarizeStays } from "./derive";
import { formatTime } from "./format";
import { ArrowRightIcon, Notice, PriceLine, PriceUnavailable, SimulatedTag, Skeleton, StatusLabel, buttonQuiet, buttonText } from "./parts";
import { openSearch } from "./search-control";
import type { AvailabilityView } from "./useAvailability";
import type { RoomView } from "./view-models";

const GRID = "grid gap-x-8 gap-y-14 md:grid-cols-2 lg:gap-x-10 lg:gap-y-16 xl:grid-cols-3";
/** The decision area keeps one height in every state, so an arriving answer moves nothing. */
const DECISION = "flex min-h-[7.5rem] items-end justify-between gap-4 border-t border-line pt-4";

/**
 * Journey A: the guest has dates and has not chosen a property. The answer is which
 * properties have a room, each introduced by its own character, with the total for the
 * stay and one way on: its rooms.
 */
export function AllPropertiesResults({
  cards,
  rooms,
  criteria,
  staySummary,
  view,
  timeZone,
  retrying,
  onReload,
  onRetryProperty,
  roomsHref,
}: {
  cards: readonly PropertyCardModel[];
  rooms: Readonly<Record<string, readonly RoomView[]>>;
  criteria: SearchCriteria;
  /** "12 – 15 thg 11 · 3 đêm · 2 khách", or undefined in browse mode. */
  staySummary: string | undefined;
  view: AvailabilityView;
  timeZone: string;
  retrying: readonly string[];
  onReload: () => void;
  onRetryProperty: (property: { id: string; slug: string }) => void;
  roomsHref: (slug: string) => string;
}) {
  const [sort, setSort] = useState<SortOrder>("editorial");
  const answer = view.kind === "ready" ? view.answer : undefined;
  const stale = view.kind === "ready" && view.stale;
  const simulated = answer?.source === "mock";

  const stays = answer ? cards.map((card) => derivePropertyStay(answer, { id: card.id, rooms: rooms[card.id] ?? [] }, criteria.adults)) : undefined;
  const summary = stays ? summarizeStays(stays) : undefined;
  const cardOf = (id: string) => cards.find((card) => card.id === id);
  const stayOf = (id: string) => stays?.find((stay) => stay.propertyId === id);

  // The order is decided once, when an answer first arrives: available first, confirmed sold
  // out after. A property retried later is updated where it stands and never moves, so nothing
  // the guest is looking at jumps. Only a new search, or the guest's own sort, reorders.
  const generation = view.kind === "ready" ? view.generation : undefined;
  const [layout, setLayout] = useState<{ generation: number; listed: string[]; soldOut: string[] }>();
  const current = stays && generation !== undefined ? (layout?.generation === generation ? layout : { generation, ...initialLayout(stays) }) : undefined;
  if (current && current !== layout) setLayout(current);

  const sortable = stays ? canSortByPrice(stays) : false;
  const listedStays = current && stays ? current.listed.flatMap((id) => stayOf(id) ?? []) : undefined;
  // Sorting is the guest's own action, so it may reorder; it only ever reorders what is already in the main list.
  const listed = listedStays && sortable && sort === "price" ? orderStays(listedStays, "price") : listedStays;
  const soldOut = current && stays ? current.soldOut.flatMap((id) => stayOf(id) ?? []) : [];
  const unpriced = stays ? stays.filter((stay) => stay.status === "available" && !stay.from).length : 0;

  let heading: string;
  if (view.kind === "invalid") heading = resultsCopy.invalidHeading;
  else if (view.kind === "idle") heading = resultsCopy.browseHeading(cards.length);
  else if (view.kind === "loading") heading = resultsCopy.checkingHeading;
  else if (view.kind === "failed") heading = view.reason === "not-configured" ? resultsCopy.notConnectedHeading : resultsCopy.failedHeading;
  else if (summary && summary.available > 0) heading = resultsCopy.availableHeading(summary.available);
  else if (summary && summary.soldOut === summary.total && summary.total > 0) heading = resultsCopy.noneHeading;
  else heading = resultsCopy.uncheckedHeading;

  const extras = summary
    ? [
        unpriced > 0 ? resultsCopy.unpricedCount(unpriced) : undefined,
        summary.unchecked > 0 ? resultsCopy.uncheckedCount(summary.unchecked) : undefined,
        summary.soldOut > 0 && summary.available > 0 ? resultsCopy.soldOutCount(summary.soldOut) : undefined,
      ].filter(Boolean)
    : [];
  const subline = [staySummary ?? (view.kind === "idle" ? resultsCopy.browseHint : undefined), ...extras].filter(Boolean).join(" · ");

  const viewRooms = (card: PropertyCardModel) => (
    <Link href={roomsHref(card.slug)} className={`${buttonQuiet} after:absolute after:inset-0 after:rounded-(--bk-r-shell)`}>
      <span>
        {resultsCopy.viewRooms}
        <span className="sr-only"> tại {card.name}</span>
      </span>
      <ArrowRightIcon />
    </Link>
  );

  const decision = (card: PropertyCardModel, stay: PropertyStay | undefined) => {
    if (!stay) {
      // Browse mode, an invalid search, or a search that failed as a whole: the property is introduced and nothing is claimed.
      return (
        <div className={DECISION}>
          <p className="max-w-[16rem] text-sm leading-snug text-ink-muted">{view.kind === "idle" ? resultsCopy.browseHint : view.kind === "failed" ? failureMessage(view.reason) : ""}</p>
          {view.kind === "idle" ? viewRooms(card) : null}
        </div>
      );
    }
    switch (stay.status) {
      case "available": {
        const room = stay.from ? rooms[card.id]?.find((candidate) => candidate.id === stay.from?.roomTypeId) : undefined;
        const caption = stay.from ? [resultsCopy.nights(stay.from.price.nights), room?.name].filter(Boolean).join(" · ") : undefined;
        return (
          <div className={DECISION}>
            {stay.from ? (
              <PriceLine price={stay.from.price} simulated={simulated} stale={stale} prefix={resultsCopy.from} {...(caption ? { caption } : {})} />
            ) : (
              // Available, but no verified price: said plainly, with no figure and no promise of one.
              <PriceUnavailable simulated={simulated} />
            )}
            {viewRooms(card)}
          </div>
        );
      }
      case "error": {
        const busy = retrying.includes(card.id);
        return (
          <div className={DECISION}>
            <p className="max-w-[16rem] text-sm leading-snug text-ink-muted">{failureMessage(stay.failure ?? "unknown")}</p>
            {stay.retryable ? (
              <button type="button" aria-busy={busy} aria-disabled={busy} onClick={() => onRetryProperty({ id: card.id, slug: card.slug })} className={`${buttonQuiet} aria-disabled:cursor-progress aria-disabled:opacity-60`}>
                {busy ? resultsCopy.retrying : resultsCopy.retry}
                <span className="sr-only">: {card.name}</span>
              </button>
            ) : null}
          </div>
        );
      }
      case "unknown":
        return (
          <div className={DECISION}>
            <p className="max-w-[18rem] text-sm leading-snug text-ink-muted">
              <span className="font-medium text-ink">{detailMessage(stay.detail, criteria.adults)}</span>
              {stay.detail === "over-capacity" && stay.largestRoom ? <span className="block">{resultsCopy.largestRoom(stay.largestRoom)}</span> : null}
            </p>
            {stay.detail === "over-capacity" ? (
              <button type="button" onClick={() => openSearch("guests")} className={buttonQuiet}>
                {resultsCopy.changeGuests}
              </button>
            ) : null}
          </div>
        );
      case "sold-out":
        // Only reached when a property retried in place turns out to be sold out: it stays where it is.
        return (
          <div className={DECISION}>
            <p className="max-w-[16rem] text-sm leading-snug text-ink-muted">{resultsCopy.soldOutRow}</p>
            <button type="button" onClick={() => openSearch("checkIn")} className={buttonQuiet}>
              {resultsCopy.changeDates}
            </button>
          </div>
        );
    }
  };

  const status = (stay: PropertyStay | undefined) => {
    if (!stay) return view.kind === "failed" && view.reason !== "not-configured" ? <StatusLabel tone="error">{resultsCopy.statusError}</StatusLabel> : null;
    // A stale result outranks what it said: "available" twenty minutes ago is not "available".
    if (stale && (stay.status === "available" || stay.status === "sold-out")) return <StatusLabel tone="stale">{resultsCopy.statusStale}</StatusLabel>;
    if (stay.status === "available") return <StatusLabel tone="available">{resultsCopy.statusAvailable}</StatusLabel>;
    if (stay.status === "error") return <StatusLabel tone="error">{resultsCopy.statusError}</StatusLabel>;
    if (stay.status === "sold-out") return <StatusLabel tone="sold-out">{resultsCopy.statusSoldOut}</StatusLabel>;
    return <StatusLabel tone="unknown">{resultsCopy.statusUnknown}</StatusLabel>;
  };

  const grid = listed ? listed.map((stay) => ({ card: cardOf(stay.propertyId), stay })) : cards.map((card) => ({ card, stay: undefined }));
  const loading = view.kind === "loading";

  return (
    <div className="mx-auto max-w-site px-(--vn-gutter) pt-(--vn-space-8) pb-(--vn-space-24) md:pt-(--vn-space-12)">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-medium tracking-(--bk-label-tracking) text-ink-muted uppercase">{resultsCopy.eyebrowAll}</p>
          <h1 className="mt-2 text-(length:--vn-text-4xl) leading-none font-medium tracking-[-0.035em] text-balance">{heading}</h1>
          {subline ? <p className="mt-4 text-[0.9375rem] text-ink-muted">{subline}</p> : null}
        </div>
        {view.kind === "loading" || view.kind === "ready" ? (
          // Its place is kept while loading and when there is nothing to sort, so results never jump when it appears.
          <div role="group" aria-label={resultsCopy.sortLabel} inert={!sortable} className={`${sortable ? "" : "invisible"} flex shrink-0 gap-1 self-start rounded-(--bk-r-tabs) bg-surface-muted p-1 md:self-auto`}>
            {(["editorial", "price"] as const).map((order) => (
              // Buttons, not links: sorting never creates a URL for a crawler to follow.
              <button
                key={order}
                type="button"
                aria-pressed={sort === order}
                onClick={() => setSort(order)}
                className="h-11 rounded-(--bk-r-field) px-4 text-sm font-medium text-ink-muted transition-colors duration-(--vn-duration-fast) aria-pressed:bg-surface-raised aria-pressed:text-ink aria-pressed:shadow-field"
              >
                {order === "editorial" ? resultsCopy.sortEditorial : resultsCopy.sortPrice}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      {/* Says in words what changed, for anyone who cannot see the page rearrange. */}
      <p role="status" className="sr-only">
        {view.kind === "loading" ? resultsCopy.checkingHeading : [heading, ...extras].join(". ")}
      </p>

      <div className="mt-(--vn-space-8) flex flex-col gap-4 empty:hidden">
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
        {summary && summary.available === 0 && summary.soldOut === summary.total && summary.total > 0 ? (
          <Notice
            title={resultsCopy.noneHeading}
            action={
              <button type="button" onClick={() => openSearch("checkIn")} className={buttonQuiet}>
                {resultsCopy.changeDates}
              </button>
            }
          >
            {resultsCopy.allSoldOutBody}
          </Notice>
        ) : null}
      </div>

      {loading ? (
        // One outline per property while the provider is asked. The real cards then appear already
        // in their final order, so no card a guest has started reading ever changes place.
        // Keyed apart from the results, so the browser builds the real cards new and in place instead of sliding outlines around.
        <ul key="outlines" aria-hidden="true" className={`mt-(--vn-space-8) ${GRID}`}>
          {cards.map((card) => (
            <li key={card.id}>
              <PropertyCardSkeleton variant="results">
                <div className={DECISION}>
                  <span className="flex flex-col gap-2">
                    <Skeleton className="h-7 w-36" />
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-3 w-52 max-w-full" />
                  </span>
                  <Skeleton className="h-11 w-32 rounded-(--bk-r-field)" />
                </div>
              </PropertyCardSkeleton>
            </li>
          ))}
        </ul>
      ) : grid.length > 0 ? (
        <ul key={generation ?? "browse"} className={`mt-(--vn-space-8) ${GRID}`}>
          {grid.map(({ card, stay }, index) =>
            card ? (
              <li key={card.id}>
                <PropertyCard model={card} variant="results" status={status(stay)} priority={index < 3} dimmed={stale}>
                  {decision(card, stay)}
                </PropertyCard>
              </li>
            ) : null,
          )}
        </ul>
      ) : null}

      {soldOut.length > 0 ? (
        <section aria-labelledby="sold-out-heading" className="mt-(--vn-space-16)">
          <div className="flex items-center justify-between gap-4 border-b border-line pb-3">
            <h2 id="sold-out-heading" className="text-[0.6875rem] font-medium tracking-(--bk-label-tracking) text-ink-muted uppercase">
              {resultsCopy.soldOutSection}
              {simulated ? (
                <span className="ml-2 normal-case">
                  <SimulatedTag />
                </span>
              ) : null}
            </h2>
            <button type="button" onClick={() => openSearch("checkIn")} className={buttonText}>
              {resultsCopy.changeDates}
            </button>
          </div>
          <ul className="divide-y divide-line">
            {soldOut.map((stay) => {
              const card = cardOf(stay.propertyId);
              return card ? (
                <li key={card.id} className="flex items-center gap-4 py-4">
                  <CardVisual image={card.visual} sizes="5rem" showLabel={false} className="aspect-[4/3] w-20 shrink-0 rounded-(--bk-r-field) opacity-70" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-ink">{card.name}</h3>
                    <p className="truncate text-sm text-ink-muted">
                      {card.area} · {resultsCopy.soldOutRow}
                    </p>
                  </div>
                  {stale ? <StatusLabel tone="stale">{resultsCopy.statusStale}</StatusLabel> : <StatusLabel tone="sold-out">{resultsCopy.statusSoldOut}</StatusLabel>}
                </li>
              ) : null;
            })}
          </ul>
        </section>
      ) : null}

      {view.kind === "ready" && !stale ? <p className="mt-(--vn-space-8) text-xs text-ink-muted">{resultsCopy.updatedAt(formatTime(view.receivedAt, timeZone))}</p> : null}
    </div>
  );
}
