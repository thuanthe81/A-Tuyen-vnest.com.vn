import type { Locale } from "@/domain/locale";
import { resolveLocalized } from "@/domain/locale";
import type { PropertyRepository } from "@/domain/ports";
import type { PropertyRecord } from "@/domain/property";
import { resolveProperty } from "@/domain/property";

/**
 * Serves property records held in the repository itself (src/content/properties, or the
 * mock records). A CMS or content API would be a second implementation of the same port.
 */
export function createPropertyRepository(
  records: readonly PropertyRecord[],
  options: { enabledLocales: readonly Locale[]; latency?: () => Promise<void> },
): PropertyRepository {
  const { enabledLocales, latency = () => Promise.resolve() } = options;
  const resolveAll = (locale: Locale) =>
    records.flatMap((record) => {
      const property = resolveProperty(record, locale, enabledLocales);
      return property ? [property] : [];
    });

  return {
    async listProperties(locale, filter = {}) {
      await latency();
      return resolveAll(locale).filter(
        (property) => filter.destination === undefined || property.place.area.slug === filter.destination,
      );
    },
    async getProperty(slug, locale) {
      await latency();
      const record = records.find((candidate) => candidate.slug === slug);
      return record ? resolveProperty(record, locale, enabledLocales) : undefined;
    },
    async listLocations(locale) {
      await latency();
      const areas = new Map(resolveAll(locale).map((property) => [property.place.area.id, property.place.area]));
      const byId = new Map(records.map((record) => [record.place.area.id, record.place.area]));
      return [...areas.keys()].flatMap((id) => {
        const area = byId.get(id);
        return area ? [resolveLocalized(area, locale)] : [];
      });
    },
    async getBookingTarget(propertyId, providerId) {
      const record = records.find((candidate) => candidate.id === propertyId);
      if (!record) return undefined;
      const mapping = record.booking.providers[providerId];
      return {
        propertyId: record.id,
        ...(record.place.timeZone ? { timeZone: record.place.timeZone } : {}),
        rooms: record.rooms.map((room) => ({
          roomTypeId: room.id,
          ...(room.maxOccupancy !== undefined ? { maxOccupancy: room.maxOccupancy } : {}),
        })),
        ...(mapping ? { mapping } : {}),
      };
    },
  };
}
