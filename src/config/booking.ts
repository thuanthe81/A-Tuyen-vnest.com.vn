/**
 * Site-side limits on booking data. These are VNest's own caution, applied on top of
 * whatever a provider states; they are not provider facts.
 */
export const booking = {
  /**
   * The longest a price is shown as current when the provider states no validity of its own.
   * PROVISIONAL: 15 minutes is the build team's assumption, to be replaced by the validity
   * ezCloud or GoHost document for their quotes.
   */
  priceMaxAgeMs: 15 * 60_000,
  /**
   * How long this site waits for a provider before answering "timeout" itself, so one slow
   * search can never hold a guest indefinitely. An adapter that asks per property is expected
   * to bound each property's request below this and report the slow ones as failures.
   * PROVISIONAL, like the limit above.
   */
  providerTimeoutMs: 12_000,
  /** How long the browser waits for an availability answer before reporting a timeout. */
  requestTimeoutMs: 20_000,
} as const;
