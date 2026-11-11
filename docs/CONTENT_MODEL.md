# Property content model

Updated 09/10/2026, end of Phase 01. The precise definition is `src/domain/property.ts`; this document explains it.

No real property exists in the repository yet. `src/content/properties/index.ts` is empty on purpose. The six records in `src/integrations/content/mock/` are labelled development fixtures used only when `CONTENT_SOURCE=mock`; their pictures are drawn stand-ins in `public/dev-fixtures/`, each labelled inside the picture.

## 1. The record

One `PropertyRecord` per property.

| Part | Fields | Purpose |
|---|---|---|
| Administration | `id`, `slug`, `source`, `status`, `approvedLocales` | Stable identity, URL, and whether the record may be published and in which languages |
| Identity and signature visual | `identity`: name, tagline, category, `signatureMediaId`, `logoMediaId`, `brandId` | Who the property is and the one image or video that stands for it everywhere it is introduced |
| Narrative and positioning | `narrative`: positioning, summary | The short form of its story, for cards, introductions and metadata |
| Photography and video | `media.images`, `media.videos` | One library per property; everything else refers to assets by id |
| Amenities | `amenities` (with a `signature` flag) | What the property offers, and what is particular to it |
| Nearby experiences and local context | `place` (area, address, coordinates, timezone), `nearby` | Where it is and what is around it. Distances and travel times only when verified |
| Rooms and rate references | `rooms`, `rateReferences` | Room types, and optional verified "from" prices that are never bookable |
| Policies and questions | `policies`, `faqs` | Editorial policy text and common questions |
| SEO | `seo`: title, description, share image, structured-data facts | Each emitted only when present on an approved record |
| Presentation | `presentation`: layout, sections, theme | How the property tells its story (below) |
| Booking-provider mapping | `booking.providers` | This property's identifiers at each provider. Server-side only: removed before a record reaches a page |

Three optional fields were added for the property page (section 05.1, 11/10/2026):

| Field | Meaning | Checked by the content gate |
|---|---|---|
| `identity.galleryMediaIds` | The media that open the property page, in VNest's order; the first is the primary one. Absent: the signature visual stands alone | Every id exists; none repeats; none is a picture of a room type |
| `Amenity.icon` | A key from the fixed list `AMENITY_ICONS`. Absent: a neutral mark. An icon is never guessed from a label | The key is in the list |
| `RoomType.highlight` | The one thing that sets a room type apart, in VNest's words | One line, at most 80 characters; translated in every approved language |

Almost every descriptive field is optional. Absent means "not supplied yet"; the UI renders without it and nothing is invented to fill a gap.

## 2. Distinctiveness

Each property must have its own visual and experiential identity. The model gives three levers, from strongest to lightest:

1. **A layout template of its own** (`presentation.layout`). A layout is a different page composition, not a reordering: for example a film-led opening, a long-form editorial with images set into text, or a place-led page that starts from the surroundings. Layouts are registered in `src/content/layouts.ts` and built from shared components. Only `baseline` exists today; layouts are designed with the properties in Phases 05 and 06.
2. **Editorial sections** (`presentation.sections`). A typed list of blocks: `narrative` (heading, paragraphs, media), `media` (a feature image, video or gallery) and `collection` (rooms, amenities, nearby, location, policies, questions). Each block can name a `variant`, which a layout draws in its own way.
3. **Theme tokens** (`presentation.theme`). Colour, type and shape overrides, limited to the tokens in `src/styles/theme-contract.ts`.

Reason for this split: six fully separate page implementations would diverge in SEO, accessibility and booking behaviour and multiply maintenance; one template with a colour swap would not be distinctive. Benefit: the booking UI, metadata, structured data and components are shared and tested once, while the composition, the storytelling and the signature media differ per property.

The signature visual is deliberately a first-class field, not just the first gallery image: it is what the discovery cards (Phase 04) and the property opening are built around.

## 3. Media

Every asset has `width`, `height`, `alt` and `rights`. Images may carry a focal point for cropping. Video requires a poster image, so a page reads fully without video playing.

| `rights` | Meaning | Allowed on an approved record |
|---|---|---|
| `placeholder` | No file; a labelled block is drawn | No |
| `temporary-licensed` | A stand-in that shows no VNest property | No |
| `client-supplied-pending` | VNest's own photograph, authorised for a private review; usage rights not yet confirmed (added 19/10/2026, section 05.2) | No: draft records only |
| `client-approved` | VNest's own, cleared for publication | Yes |

## 4. Languages

Translatable fields are `LocalizedText`: `{ vi: "…", en?: "…" }`. Pages never see that shape; the repository resolves a record to one language and hands components plain strings.

A language is served only when it is enabled for the site **and** listed in the record's `approvedLocales`. Validation rejects an approved language with any untranslated field. Writing English text into a record therefore publishes nothing until VNest approves it.

## 5. Publication

A record is publishable (indexed, in the sitemap, described in structured data) only when `source` is not `mock` and `status` is `approved`. `approved` means VNest has verified its facts and wording.

## 6. Validation: the content gate

`validatePropertyRecord` (`src/domain/property-validation.ts`) runs over every record in `npm test`, so CI blocks a broken record. It checks:

- slugs and unique ids
- that every reference (signature media, room media, section media, rate references, provider room mapping) points at something that exists
- media dimensions, and that non-placeholder images have a file
- that the layout is registered and theme tokens are themeable
- that the timezone is a real IANA zone
- that the primary language and every approved language are complete
- publication rules: mock records are never approved; approved records show only client-approved media

## 7. Adding a property

1. Create `src/content/properties/<slug>/index.ts` exporting a `PropertyRecord` with `source: "client-supplied"` and `status: "draft"`.
2. Put its media under `public/properties/<slug>/` and list each asset with dimensions, alt text and rights.
3. Register the record in `src/content/properties/index.ts`.
4. Run `npm test`. Fix every issue the content gate reports.
5. Set `status: "approved"` only after VNest has verified the record.

## 8. What VNest needs to supply per property

Name and slug; area, address, coordinates; positioning and story; the signature visual; photography and video with usage rights; amenities; nearby experiences; room types with capacity, bedding and area; policies; SEO title and description; provider identifiers; and its relationship to a brand, if any.
