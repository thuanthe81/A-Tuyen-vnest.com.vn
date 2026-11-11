import type { JsonLd as JsonLdData } from "./structured-data";
import { serializeJsonLd } from "./structured-data";

/** Renders structured data into the server HTML. Renders nothing when there is none to state. */
export function JsonLd({ data }: { data: JsonLdData | undefined }) {
  if (!data) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
