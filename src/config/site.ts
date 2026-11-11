import type { Locale } from "@/domain/locale";
import { DEFAULT_LOCALE } from "@/domain/locale";

export const site = {
  name: "VNest",
  defaultLocale: DEFAULT_LOCALE,
  /**
   * Languages the site serves. Vietnamese only until VNest approves translations: adding a
   * language here is necessary but not sufficient, since each property must also approve it.
   */
  enabledLocales: [DEFAULT_LOCALE] as readonly Locale[],
  /**
   * Timezone used to decide "today" for a search that is not tied to one property.
   * ASSUMPTION to confirm with VNest: every property is in Vietnam, which has a single timezone.
   */
  timeZone: "Asia/Ho_Chi_Minh",
  /** Open Graph locale codes. */
  ogLocale: { vi: "vi_VN", en: "en_US" } satisfies Record<Locale, string>,
} as const;
