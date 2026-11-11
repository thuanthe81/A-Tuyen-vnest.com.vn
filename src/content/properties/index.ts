/**
 * VNest's real properties. One folder per property, each exporting a PropertyRecord
 * (see src/domain/property.ts and docs/CONTENT_MODEL.md), registered in the list below.
 *
 * Empty on purpose: no real property has been supplied and verified yet, and nothing
 * about a real property is ever invented. Sample records for development live in
 * src/integrations/content/mock and are used only when CONTENT_SOURCE=mock.
 */

import type { PropertyRecord } from "@/domain/property";

export const propertyRecords: readonly PropertyRecord[] = [];
