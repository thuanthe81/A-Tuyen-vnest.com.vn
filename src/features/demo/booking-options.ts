import type { ClientCollection } from '@/app/dev/brand-collection/client/adapter';
import type { PropertyOption } from '@/features/booking-search/search-form';

/** Demo search scope comes from the same workbook inventory as Brand Collection.
 * These are selection labels/identifiers, not bookability or provider mappings.
 * Workbook IDs are the canonical slugs used by the existing demo routes.
 */
export function demoBookingOptions(content: ClientCollection): PropertyOption[] {
  return content.properties.map(property => ({
    id: property.id,
    slug: property.id,
    name: property.name,
    area: property.location!.label,
  }));
}
