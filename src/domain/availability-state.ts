/**
 * The lifecycle of one availability check as the booking UI sees it: nothing asked,
 * waiting, answered, or failed. Kept as a pure reducer so the states and their
 * transitions are defined and tested once, independent of any component.
 */

import type { AvailabilityAnswer, AvailabilityFailure, AvailabilityResult } from "./availability.ts";
import type { DatedCriteria } from "./search.ts";
import { sameCriteria } from "./search.ts";

export type AvailabilityState =
  /** No dates chosen, or the criteria are not valid yet. Nothing is claimed about availability. */
  | { kind: "idle" }
  | { kind: "loading"; criteria: DatedCriteria }
  | { kind: "ready"; answer: AvailabilityAnswer }
  | { kind: "failed"; criteria: DatedCriteria; reason: AvailabilityFailure; retryable: boolean };

export type AvailabilityEvent =
  | { type: "cleared" }
  | { type: "requested"; criteria: DatedCriteria }
  | { type: "settled"; criteria: DatedCriteria; result: AvailabilityResult };

export const initialAvailabilityState: AvailabilityState = { kind: "idle" };

export function availabilityReducer(state: AvailabilityState, event: AvailabilityEvent): AvailabilityState {
  switch (event.type) {
    case "cleared":
      return { kind: "idle" };
    case "requested":
      return { kind: "loading", criteria: event.criteria };
    case "settled": {
      // A response for criteria the guest has since changed must never be shown.
      if (state.kind !== "loading" || !sameCriteria(state.criteria, event.criteria)) return state;
      const { result } = event;
      if (result.status === "error") {
        return { kind: "failed", criteria: state.criteria, reason: result.reason, retryable: result.retryable };
      }
      // An answer that is not for the criteria asked is a provider fault, not availability.
      if (!sameCriteria(result.criteria, state.criteria)) {
        return { kind: "failed", criteria: state.criteria, reason: "provider", retryable: true };
      }
      return { kind: "ready", answer: result };
    }
  }
}
