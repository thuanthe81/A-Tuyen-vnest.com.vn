# Partner journey: technical note for adding client content (9/11/2026)

The rule: **client copy lives in data files; components only read it.** Never type client text into a component, and
never fill a gap with an assumption.

## Where things are

| Content | File | Read by |
|---|---|---|
| Services: names, card lines, descriptions, Key Highlights, CTA labels | `src/features/demo/owner-journey.ts` (`SERVICES`) | Homepage accordion and partner page |
| Owner/B2B FAQs | `owner-journey.ts` (`OWNER_FAQ`) | Homepage (all six), partner page (`PAGE_FAQ`) |
| Brand positioning | `src/features/demo/brand-copy.ts` (`BRAND_COPY`) | Homepage brands, partner page brands |
| Brands, stays, cities | Workbook records, via `src/features/partner/brand-family.ts` | Partner page (counted, never typed) |
| Brand logos in the ecosystem | `brand-family.ts` (`LOGOS`: official file, `nameInArtwork`, `optical`) | Partner page, brand ecosystem |
| Contact details | `src/features/demo/vnest-contact.ts` | Contact card (one component, every page) |
| Partner page wording, strengths, steps, photos | `src/features/partner/partner-page-content.ts` | Partner page |

## Adding what VNest sends

- **A strength (Why VNest).**
  1. Add an entry to `PARTNER_STRENGTHS`: `id`, `label`, `text` (`{ vi, en }`), `status: "client"` and `source` (the
     document and section).
  2. Remove the matching subject from `PENDING_STRENGTHS`.

  The section draws every entry, numbered, so no layout change is needed. Three to five points read best; more should
  become a second group.
- **Partnership details (How it works).** Fill `items` in the matching `PROCESS_DETAILS` group (owner, VNest, models,
  operating responsibilities, revenue and profit). A group with at least one item appears under the steps. The empty
  ones draw nothing.
- **Process steps.** If VNest rewrites the process, replace `PROCESS_STEPS` (three or four steps fit one line on
  desktop).
- **A service change.** Edit `SERVICES` once; the homepage and the partner page both follow.
- **More FAQs on the partner page.** Add the index to `PAGE_FAQ`, using the `FAQ` names. Avoid FAQs already used
  elsewhere on the page.
- **Approved English.** Replace the DRAFT string in place and change its marker comment.
- **Photographs.**
  - Change a number in `PARTNER_PHOTOS` or `BRAND_PHOTOS` (registry: `src/content/vnest-workbook/image-selection.ts`).
  - A photograph with a `hold` is never shown.
  - Give each photograph an English alt; the Vietnamese alt is the registry's.

The unit tests in `partner-page-content.test.ts` fail if the page's own wording gains a figure or a performance word,
or if a quoted client sentence no longer matches the client text.

## Components

- **`CtaContent` + `ctaClass()`** (`src/features/partner/CtaContent.tsx`, `Cta.module.css`).
  - The partner page's CTA, used for its hero and service CTAs only: the two-state wipe (owner's correction,
    9/11/2026).
  - At rest it is white with a Dark Olive label and a Copper arrow. On hover or focus a Copper face is revealed from
    left to right over the whole button.
  - It is scoped, not a global button style.
  - The homepage accordion keeps its own approved solid Copper CTA (`ServiceAccordion.module.css`). The contact,
    footer and booking buttons are separate.
- **The brand ecosystem** (`Ecosystem` in `page/PartnerPage.tsx`).
  - It draws VNest's symbol and the approved kicker and headline, then one logo per `brandFamily()` entry.
  - Each brand has the same structure (10/11/2026): an official mark centred in a band shared by the three, then its
    name in spaced capitals on one shared line.
  - Swapping in a new official file is a `LOGOS` change: set `alt` (what the mark spells) and `caption` (the visible
    name; together they make the full name). Then tune `optical` (height in the band) and `lift` (an optical nudge
    up) until the three marks weigh the same and sit level.
  - Photographs, descriptions, places and counts are deliberately not drawn here.

- **`ServiceAccordion`** (homepage).
  - Props: `locale`, `photo`, `initial`, `ctaHref`, `onCta`, `more` (the section link).
  - It knows nothing about the form: the page passes `onCta`.
- **`ConsultationProvider` / `ConsultationForm` / `ContactSection`** (`src/features/demo/Consultation.tsx`).
  - One form for every page; a page wraps its content in the provider.
  - `useConsultation().goToForm(service?)` chooses a service, keeps `?dich-vu=` and scrolls to `#tu-van`.
  - The form validates only. Connecting it (lead channel, consent, privacy notice) is in
    `docs/handoff/BACKEND-HANDOFF.md`, "Forms"; replace the `unsent` branch of `onSubmit`, never fake a success.
- **`PartnerPage`** (`src/features/partner/page/`).
  - A server component; its sections are small functions in the same file.
  - It takes its photographs and the brand family as props, resolved by the route.

## Going public

1. VNest approves the copy (REVIEW.md §3) and the photographs (rights: Q15).
2. Move the route from `src/app/dev/demo/hop-tac` to `src/app/hop-tac` when the homepage leaves `/dev/demo`, and set
   `PARTNER_PAGE` in `src/features/partner/routes.ts`.
3. Remove `noindex` from `generateMetadata`. Add a canonical path per language once public `/en/...` routes exist
   (`src/config/routes.ts`).
4. Add the page to the sitemap (`src/seo/sitemap.ts`) and, if approved, to the menu and footer.
5. No structured data is emitted today. Only add what VNest confirms (an `Organization` with its real contact details),
   never ratings or unconfirmed services.
