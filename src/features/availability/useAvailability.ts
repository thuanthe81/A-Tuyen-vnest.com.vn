"use client";

import { createContext, createElement, useContext, useEffect, useState } from "react";
import { booking } from "@/config/booking";
import { routes } from "@/config/routes";
import type { AvailabilityAnswer, AvailabilityFailure, AvailabilityResult } from "@/domain/availability";
import { getPriceFreshness, mergeAnswers } from "@/domain/availability";
import { availabilityReducer } from "@/domain/availability-state";
import type { BookingCapabilities } from "@/domain/booking";
import type { CriteriaIssue, DatedCriteria, SearchCriteria } from "@/domain/search";
import { hasDates } from "@/domain/search";
import type { AvailabilityResponse } from "@/server/availability";

export interface AvailabilityQuery {
  criteria: SearchCriteria;
  /** Problems the page already knows about. With any, nothing is asked. */
  issues: readonly CriteriaIssue[];
  /** The one property searched, or undefined for all of them. */
  property: { id: string; slug: string } | undefined;
  allPropertyIds: readonly string[];
  /** Development only: which simulated scenario to ask the mock provider for. */
  mockScenario: string | undefined;
}

/** What the page shows about availability right now. */
export type AvailabilityView =
  /** No dates: browse mode. Nothing is claimed. */
  | { kind: "idle" }
  | { kind: "invalid"; issues: readonly CriteriaIssue[] }
  | { kind: "loading" }
  /** The whole search failed. Never shown as "no rooms". */
  | { kind: "failed"; reason: AvailabilityFailure; retryable: boolean }
  | {
      kind: "ready";
      answer: AvailabilityAnswer;
      /** True once the prices can no longer be shown as current. */
      stale: boolean;
      /** When the answer was received, on this device's clock, for display. */
      receivedAt: number;
      /** Changes with every new search or reload, and stays the same when one property is retried. */
      generation: number;
      /** What the provider declares it can do. Decides which next steps may be offered. */
      capabilities: BookingCapabilities | undefined;
    };

interface Held {
  /** The stay and scenario this is for. */
  key: string;
  /** Every property the answer was asked about, answered or not. */
  covered: readonly string[];
  outcome: { kind: "ready"; answer: AvailabilityAnswer } | { kind: "failed"; reason: AvailabilityFailure; retryable: boolean } | { kind: "rejected"; issues: readonly CriteriaIssue[] };
  /** When it was received, on the server's clock. */
  obtainedAt: number;
  /** This device's clock minus the server's, so age is never measured against a wrong local clock. */
  clockOffset: number;
  /** The server-clock instant it stops being fresh. Undefined when it was already stale on arrival. */
  staleAt: number | undefined;
  generation: number;
  capabilities: BookingCapabilities | undefined;
}

let generations = 0;

type Store = readonly [Held | undefined, React.Dispatch<React.SetStateAction<Held | undefined>>];
const AvailabilityStore = createContext<Store | null>(null);

/**
 * Keeps the last availability answer above the pages that use it. Placed in the layout that
 * /stays and /stays/[property] share, it lets a guest go from the results to a property
 * and back without the provider being asked again for the same stay.
 */
export function AvailabilityStoreProvider({ children }: { children: React.ReactNode }) {
  const store = useState<Held>();
  return createElement(AvailabilityStore, { value: store }, children);
}

const failure = (reason: AvailabilityFailure, retryable: boolean): AvailabilityResult => ({ status: "error", reason, retryable });

/** Asks this site's own endpoint. Every way it can go wrong becomes a value; only a cancelled request throws. */
async function ask(url: string, signal: AbortSignal): Promise<{ result?: AvailabilityResult; issues: readonly CriteriaIssue[]; servedAt: number; capabilities?: BookingCapabilities }> {
  const clientNow = () => Date.now();
  try {
    const response = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(booking.requestTimeoutMs)]), cache: "no-store" });
    if (!response.ok) return { result: failure(response.status >= 500 ? "provider" : "unknown", response.status >= 500), issues: [], servedAt: clientNow() };
    const body = (await response.json()) as AvailabilityResponse;
    const servedAt = Date.parse(body.servedAt);
    return { ...(body.result ? { result: body.result } : {}), issues: body.issues, servedAt: Number.isNaN(servedAt) ? clientNow() : servedAt, capabilities: body.capabilities };
  } catch (error) {
    if (signal.aborted) throw error;
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return { result: failure(timedOut ? "timeout" : "network", true), issues: [], servedAt: clientNow() };
  }
}

function staleAtFor(answer: AvailabilityAnswer, obtainedAt: number, now: number): number | undefined {
  const freshness = getPriceFreshness(answer, { now, maxAgeMs: booking.priceMaxAgeMs, obtainedAt });
  return freshness.kind === "fresh" ? freshness.staleAt : undefined;
}

function hold(key: string, covered: readonly string[], criteria: DatedCriteria, asked: Awaited<ReturnType<typeof ask>>): Held {
  generations += 1;
  const base = { key, covered, obtainedAt: asked.servedAt, clockOffset: Date.now() - asked.servedAt, generation: generations, capabilities: asked.capabilities };
  if (!asked.result) {
    // The server found a problem with the stay that the page had not: show it, claim nothing.
    if (asked.issues.length > 0) return { ...base, outcome: { kind: "rejected", issues: asked.issues }, staleAt: undefined };
    return { ...base, outcome: { kind: "failed", reason: "unknown", retryable: false }, staleAt: undefined };
  }
  // The domain reducer decides what a response means, including refusing an answer for another stay.
  const settled = availabilityReducer({ kind: "loading", criteria }, { type: "settled", criteria, result: asked.result });
  if (settled.kind === "ready") return { ...base, outcome: settled, staleAt: staleAtFor(settled.answer, asked.servedAt, asked.servedAt) };
  if (settled.kind === "failed") return { ...base, outcome: { kind: "failed", reason: settled.reason, retryable: settled.retryable }, staleAt: undefined };
  return { ...base, outcome: { kind: "failed", reason: "unknown", retryable: true }, staleAt: undefined };
}

/**
 * Availability for the search in the URL: asks once, cancels when the search changes, and
 * keeps the answer so that moving from all properties to one of them needs no second request.
 *
 * One request per search, and no polling. An answer is shown only for the stay it was asked
 * for; the request for a search the guest has left is cancelled and its answer discarded.
 */
export function useAvailability(query: AvailabilityQuery) {
  const { criteria, issues, property, allPropertyIds, mockScenario } = query;
  // The shared store when a layout provides one; otherwise the answer lives and dies with this page.
  const shared = useContext(AvailabilityStore);
  const own = useState<Held>();
  const [held, setHeld] = shared ?? own;
  const [attempt, setAttempt] = useState(0);
  const [expired, setExpired] = useState<Held>();
  const [retrying, setRetrying] = useState<readonly string[]>([]);

  const dated = hasDates(criteria) && issues.length === 0 ? criteria : undefined;
  const key = dated ? `${dated.checkIn}|${dated.checkOut}|${dated.adults}|${mockScenario ?? ""}` : undefined;
  const usable = held !== undefined && held.key === key && (property ? held.covered.includes(property.id) : allPropertyIds.every((id) => held.covered.includes(id)));
  const url = dated && !usable ? routes.api.availability(dated, property?.slug, mockScenario) : undefined;

  useEffect(() => {
    if (!url || !dated || !key) return;
    const controller = new AbortController();
    const covered = property ? [property.id] : allPropertyIds;
    ask(url, controller.signal).then(
      (asked) => {
        if (!controller.signal.aborted) setHeld(hold(key, covered, dated, asked));
      },
      () => undefined,
    );
    return () => controller.abort();
  }, [url, key, dated, property, allPropertyIds, attempt, setHeld]);

  // One timer for the moment the prices stop being current. Nothing is re-requested by itself.
  useEffect(() => {
    if (!held || held.outcome.kind !== "ready" || held.staleAt === undefined) return;
    const delay = held.staleAt - (Date.now() - held.clockOffset);
    const timer = setTimeout(() => setExpired(held), Math.min(Math.max(delay, 0), 2 ** 31 - 1));
    return () => clearTimeout(timer);
  }, [held]);

  /** Asks again for everything this search covers. */
  const reload = () => {
    setHeld(undefined);
    setAttempt((count) => count + 1);
  };

  /** Asks again for one property that failed, and folds its answer into the one held. */
  const retryProperty = (target: { id: string; slug: string }) => {
    if (!dated || !key || retrying.includes(target.id)) return;
    setRetrying((ids) => [...ids, target.id]);
    ask(routes.api.availability(dated, target.slug, mockScenario), new AbortController().signal)
      .then((asked) => {
        setHeld((current) => {
          if (!current || current.key !== key || current.outcome.kind !== "ready") return current;
          const { answer } = current.outcome;
          const later: AvailabilityAnswer =
            asked.result?.status === "ok"
              ? asked.result
              : {
                  status: "ok",
                  criteria: answer.criteria,
                  source: answer.source,
                  items: [],
                  failures: [{ propertyId: target.id, reason: asked.result?.reason ?? "unknown", retryable: asked.result?.retryable ?? true }],
                  ...(answer.fetchedAt !== undefined ? { fetchedAt: answer.fetchedAt } : {}),
                };
          const merged = mergeAnswers(answer, later, [target.id]);
          if (!merged) return current;
          const now = Date.now() - current.clockOffset;
          return { ...current, outcome: { kind: "ready", answer: merged }, staleAt: staleAtFor(merged, current.obtainedAt, now) };
        });
      })
      .finally(() => setRetrying((ids) => ids.filter((id) => id !== target.id)));
  };

  let view: AvailabilityView;
  if (issues.length > 0) view = { kind: "invalid", issues };
  else if (!dated) view = { kind: "idle" };
  else if (!usable || !held) view = { kind: "loading" };
  else if (held.outcome.kind === "rejected") view = { kind: "invalid", issues: held.outcome.issues };
  else if (held.outcome.kind === "failed") view = held.outcome;
  else view = { kind: "ready", answer: held.outcome.answer, stale: held.staleAt === undefined || expired === held, receivedAt: held.obtainedAt + held.clockOffset, generation: held.generation, capabilities: held.capabilities };

  return { view, reload, retryProperty, retrying };
}
