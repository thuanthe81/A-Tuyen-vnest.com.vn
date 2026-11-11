/**
 * Opens the header booking bar's own "Phòng & khách" field, so the guest and room steppers exist in one place only
 * (owner brief, 5/11/2026). The approved bar is not changed: this presses its existing controls.
 * - Desktop and tablet: the bar's guests field (`button[data-field="guests"]`).
 * - Phones: the compact search pill opens its sheet, then the sheet's "Phòng & khách" section (`[data-section="guests"]`).
 * Returns false when no visible bar is found (the caller then explains where to change it).
 */
function visible(el: Element | null | undefined): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  if (!el.getClientRects().length) return false;
  const style = getComputedStyle(el);
  return style.visibility !== "hidden" && style.display !== "none";
}

export function openSharedOccupancyField(): boolean {
  const field = [...document.querySelectorAll('header button[data-field="guests"]')].find(visible);
  if (field) {
    field.scrollIntoView({ block: "nearest" });
    field.click();
    return true;
  }
  // The phone pill is the button right before the bar's search sheet (whose content renders only once open).
  const pill = [...document.querySelectorAll("header dialog")]
    .map((dialog) => ({ dialog, trigger: dialog.previousElementSibling }))
    .find(({ trigger }) => visible(trigger) && trigger.getAttribute("aria-haspopup") === "dialog");
  if (pill && visible(pill.trigger)) {
    pill.trigger.click();
    let frames = 0;
    const openGuests = () => {
      const section = pill.dialog.querySelector<HTMLButtonElement>('[data-section="guests"]');
      if (section) {
        if (section.getAttribute("aria-expanded") !== "true") section.click();
      } else if (frames++ < 20) requestAnimationFrame(openGuests);
    };
    requestAnimationFrame(openGuests);
    return true;
  }
  return false;
}
