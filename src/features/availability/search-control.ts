/**
 * Opens the booking search from elsewhere on the page ("change dates", "change guests").
 *
 * The booking bar (section 02.1) is frozen and exposes no way to open it from outside, so
 * this presses the bar's own control, exactly as the guest would: the field's button on the
 * desktop bar, or the pill on a phone. It relies on two attributes of that markup,
 * `data-field` and `aria-haspopup="dialog"`. If section 02.1 ever gains an open(field)
 * function, this file is the one place to switch over.
 */
export const SEARCH_BAR_ATTRIBUTE = "data-results-search";

export function openSearch(field: "checkIn" | "guests" | "property" = "checkIn"): void {
  const bar = document.querySelector(`[${SEARCH_BAR_ATTRIBUTE}]`);
  if (!bar) return;
  const visible = (element: HTMLElement) => element.getClientRects().length > 0;
  const candidates = [
    ...bar.querySelectorAll<HTMLElement>(`button[data-field~="${field}"]`),
    ...bar.querySelectorAll<HTMLElement>('button[aria-haspopup="dialog"]'),
  ];
  const control = candidates.find(visible);
  if (!control) return;
  control.focus();
  if (control.getAttribute("aria-expanded") !== "true") control.click();
}
