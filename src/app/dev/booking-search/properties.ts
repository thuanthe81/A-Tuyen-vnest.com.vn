import { site } from "@/config/site";
import type { PropertyOption } from "@/features/booking-search/search-form";
import { getServices } from "@/server/services";

/**
 * The properties offered in the search bar, from the content repository. With mock content
 * these are the neutral sample records; real pages will pass VNest's six properties the same way.
 */
export async function loadPropertyOptions(): Promise<PropertyOption[]> {
  const properties = await getServices().properties.listProperties(site.defaultLocale);
  return properties.map((property) => ({
    id: property.id,
    slug: property.slug,
    name: property.identity.name,
    area: property.place.area.name,
  }));
}
