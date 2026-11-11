/**
 * The two boundaries between the site and everything behind it.
 *
 * PropertyRepository   content VNest controls (see property.ts)
 * BookingProvider      what only the PMS / booking engine knows (see availability.ts, booking.ts)
 *
 * Implementations live in src/integrations and are chosen in src/server/services.ts.
 */

import type { AvailabilityRequest, AvailabilityResult } from "./availability.ts";
import type { BookingCapabilities, BookingHandoff, BookingIntent, HandoffContext } from "./booking.ts";
import type { Locale, Resolved } from "./locale.ts";
import type { Location, Property, ProviderPropertyMapping } from "./property.ts";
import type { BrowseFilters, StayRules } from "./search.ts";

/** What a booking adapter needs to know about a property: identifiers and capacities, no editorial content. */
export interface BookingTarget {
  propertyId: string;
  timeZone?: string;
  rooms: readonly { roomTypeId: string; maxOccupancy?: number }[];
  /** This property's identifiers at the given provider. Absent when the property is not mapped to it. */
  mapping?: ProviderPropertyMapping;
}

export interface PropertyRepository {
  /** Properties that can be served in the given language. */
  listProperties(locale: Locale, filter?: BrowseFilters): Promise<readonly Property[]>;
  getProperty(slug: string, locale: Locale): Promise<Property | undefined>;
  listLocations(locale: Locale): Promise<readonly Resolved<Location>[]>;
  /** Server-side only. */
  getBookingTarget(propertyId: string, providerId: string): Promise<BookingTarget | undefined>;
}

export interface BookingProvider {
  /** Stable identifier, also the key of PropertyRecord.booking.providers. */
  readonly id: string;
  readonly capabilities: BookingCapabilities;
  /** Stay restrictions for a property, or general ones when no property is given. Empty when unknown. */
  getStayRules(propertyId?: string): Promise<StayRules>;
  searchAvailability(request: AvailabilityRequest): Promise<AvailabilityResult>;
  beginBooking(intent: BookingIntent, context: HandoffContext): Promise<BookingHandoff>;
}
