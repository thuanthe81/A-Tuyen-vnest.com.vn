import { routes } from "@/config/routes";
import type { Property } from "@/domain/property";
import { findImage, isPublishable } from "@/domain/property";
import type { PageSeo } from "./metadata";

/**
 * How a property page describes itself to search engines and when shared.
 *
 * The canonical address is the page without parameters, so the same property opened with
 * any dates or guests is one page. Only a real property that VNest has approved may be
 * indexed; a sample or draft record is always noindex, and nothing is written for it that
 * the record does not hold: no description is composed, and no stand-in picture is offered
 * as the share image.
 */
export function propertyPageSeo(property: Property): PageSeo {
  const publishable = isPublishable(property);
  const description = property.seo.description ?? property.narrative.summary;
  const share = findImage(property, property.seo.shareImageId ?? property.identity.signatureMediaId);
  return {
    title: property.seo.title ?? property.identity.name,
    ...(publishable && description ? { description } : {}),
    locale: property.locale,
    locales: property.availableLocales,
    path: (locale) => routes.property(property.slug, locale),
    noindex: !publishable,
    ...(publishable && share?.src && share.rights === "client-approved" ? { image: { url: share.src, width: share.width, height: share.height, alt: share.alt } } : {}),
  };
}
