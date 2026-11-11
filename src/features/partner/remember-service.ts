import type { ServiceId } from "@/features/demo/owner-journey";

/** Keeps the chosen service in the address (`?dich-vu=`) without a history entry, as the approved section does. */
export function rememberService(id: ServiceId) {
  const url = new URL(window.location.href);
  url.searchParams.set("dich-vu", id);
  window.history.replaceState(window.history.state, "", url);
}
