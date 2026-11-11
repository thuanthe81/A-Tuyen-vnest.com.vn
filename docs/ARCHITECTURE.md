# Architecture

Updated 09/10/2026, end of Phase 01.

## 1. Shape

```
        src/app  (routes, server components)
            │  calls getServices()
            ▼
     src/server/services.ts  ── chooses implementations from env ──┐
            │                                                      │
            ▼                                                      ▼
     src/domain/ports.ts  ◄── implemented by ──  src/integrations/{booking,content}
            ▲
            │  types and pure logic only
     src/domain/*  (no React, no Next, no vendor names)
```

Dependency direction: `app → server → domain ← integrations`. Three ESLint rules enforce it:

| Rule | Reason | Benefit |
|---|---|---|
| `src/domain` imports only its own files | The domain must run anywhere TypeScript runs | A backend team can reuse it or read it as a specification; tests need no framework |
| `app`, `features`, `components`, `seo` cannot import `integrations` or property records | Pages must not know where data comes from | Replacing the mock with ezCloud or GoHost changes no page |
| `process.env` is read only in `config/env.ts` | Configuration is validated once, in one file | Invalid settings fail at start-up; secrets are auditable in one place |

## 2. Decisions

| Decision | Reason | Expected benefit |
|---|---|---|
| Separate repository from V1 | V1 must be preserved untouched | No shared branch, history or deploy target can affect V1 |
| Clean scaffold; only V1's domain logic ported | V1's UI and CSS are one unit tied to the old look, and its pages render per request | No inherited styling debt; SEO-friendly rendering from the start |
| Next.js 16 App Router, React 19, TypeScript strict | Server rendering and static generation are built in; same stack as V1 so the domain ports unchanged | Indexable HTML without client JavaScript; no retraining |
| Three runtime dependencies (`next`, `react`, `react-dom`) | Every dependency is a maintenance and performance cost | Small bundle, short audit list, easy upgrades |
| No test framework: Node's own runner on the TypeScript sources | Node 22.18+ runs TypeScript directly; a 20-line hook resolves the `@/` alias | Zero test dependencies; the whole suite runs in about 0.2 s |
| One styling system: Tailwind 4 reading CSS tokens | V1 mixed a 2,100-line global stylesheet with Tailwind | One place to change a value; property themes work by overriding tokens |
| System fonts and neutral colours for now | VNest has not supplied its identity | Nothing provisional can be mistaken for a design direction; no font download at build |
| Content as typed records in the repository, behind a repository port | Six properties do not justify a CMS; the port keeps the option open | Content is reviewed like code and validated in CI; a CMS later is a second implementation, not a rewrite |
| One `BookingProvider` port with declared capabilities | Which hand-off modes ezCloud or GoHost support is unknown | The UI offers only what a provider declares; no provider is assumed to do everything |
| Failure as a value, not an exception | Provider outages are normal operating conditions | Every caller must handle failure; a PMS outage never takes a content page down |

## 3. SEO architecture

**Rendering**

- Public content is server-rendered or statically generated. Property pages (Phase 05) will be generated ahead of time from property records, so the full content is in the first HTML response.
- **Availability is never part of the page render.** The browser asks `GET /api/availability` after load. Reason: reading dates during render would make every property page dynamic and uncacheable, as in V1. Benefit: content pages stay static and fast, and a slow or failing PMS cannot delay or break them.
- Meaningful HTML must not depend on client-side animation: content is in the markup, and video always has a poster image (`VideoAsset.poster` is required by the type).

**What is built**

| Concern | Where | Behaviour |
|---|---|---|
| Canonical URLs | `seo/metadata.ts` | Path without query parameters, so a page opened with dates points at its one indexable address |
| Titles, descriptions, Open Graph | `seo/metadata.ts` | From real fields only; a missing description is omitted, never written to fill the gap |
| Language alternates (`hreflang`) | `seo/metadata.ts`, `seo/sitemap.ts` | Emitted only when a page exists in more than one approved language |
| Structured data | `seo/structured-data.ts`, `seo/JsonLd.tsx` | `Organization`, `BreadcrumbList`, lodging. Only for approved, non-sample records and only for fields present. No price, availability or rating markup |
| Sitemap | `app/sitemap.ts` | Empty unless indexable; lists only publishable properties |
| Robots | `app/robots.ts` | Disallow all unless indexable; `/api/` and `/dev/` always excluded |
| Internal links | `config/routes.ts` | Every URL is built in one file, so links stay consistent and the URL scheme can change in one place |

**Indexing is locked three ways.** A deployment is indexable only when `SITE_INDEXABLE=true`, `DEPLOY_ENV=production` and neither content nor booking is mocked. Otherwise robots.txt disallows everything, every page carries a `noindex` meta tag, and every response carries an `X-Robots-Tag: noindex` header.

**The lock is checked when the site is built and again on every request** (corrected 10/10/2026, verification finding F1). `next.config.ts` fixes the header into a build that was not made indexable; `src/proxy.ts` adds it per request whenever the running deployment is not indexable; `robots.txt` and the sitemap are answered per request. Both must agree, so a production build started as a preview is refused, and so is a preview build started as production. `npm run test:promotion` proves both against real builds. The `noindex` meta tag on statically generated pages is still decided at build time; the header covers that case.

**Production needs a real public origin** (finding F2). With `DEPLOY_ENV=production`, `SITE_URL` must be set to a public https origin; otherwise the build and the server stop with an error instead of publishing localhost addresses. Reason: a leaked preview or sample page in search results damages the brand and is slow to remove. This is not access protection; confidential previews still need a password.

**A deployment is production only when that is established** (final safeguards, 11/10/2026). `src/config/env.ts` decides which deployment is running from two kinds of signal: `DEPLOY_ENV`, which a person sets, and what the hosting platform reports by itself. Rules:

- An empty `DEPLOY_ENV` counts as not set.
- If `DEPLOY_ENV` and the platform disagree, the one that is **not** production wins. A variable meant for the live site and applied to previews as well cannot open them.
- If nothing says which deployment this is, it is treated as development: never indexable, and never assumed to be production.
- A platform variable that is present but empty or unreadable closes the deployment (treated as a preview). One that is absent says nothing.
- Only the exact value `SITE_INDEXABLE=true` asks for indexing.

So a deployment is indexable only when all of these hold: it is confirmed as production, `SITE_URL` is a public https origin (production refuses to build or start otherwise), `SITE_INDEXABLE` is exactly `true`, and neither content nor booking is mocked. Unapproved records are kept out separately by the content gate (`isPublishable`), whatever the deployment.

Problems are reported, not guessed around. Lines beginning `[vnest config]` are printed when the build and the server start (`next.config.ts`): an unidentified deployment, signals that disagree, an empty `DEPLOY_ENV`, a `SITE_INDEXABLE` request that cannot take effect and why, and a local or missing `SITE_URL` on anything that is not a declared development run. They are warnings; the only configuration that stops a deployment is production without a public https `SITE_URL`.

| Where | What identifies it | Result |
|---|---|---|
| Local development (`npm run dev`) | Nothing needed | Development, mock data, not indexable, localhost addresses. Silent |
| Local production build or `npm start` | `DEPLOY_ENV=development` in `.env.local` (as in `.env.example`) | As above. Without it: same result, with a warning that the deployment is not identified |
| CI | `DEPLOY_ENV: development` on the build step | Development, not indexable. The promotion test sets its own values for every case it builds |
| Vercel preview | `VERCEL_ENV=preview`, set by Vercel | Preview, never indexable, even if `DEPLOY_ENV=production` reaches it. Set `SITE_URL` per preview or accept the warning about localhost addresses |
| Vercel production | `VERCEL_ENV=production`, set by Vercel | Production. Requires a public https `SITE_URL`. Indexable only with `SITE_INDEXABLE=true` and real content and booking. `DEPLOY_ENV=preview` there holds it closed on purpose |
| Netlify, Render | Their preview signals are recognised and can only close a deployment: with `NETLIFY=true`, any `CONTEXT` other than `production`; with `RENDER=true`, any `IS_PULL_REQUEST` other than `false` | Their production is **not** taken on trust: set `DEPLOY_ENV=production` on the live site |
| Any other host, a container, a server | Nothing is recognised | Set `DEPLOY_ENV` explicitly on every environment. Without it the site runs closed and says so |

Not verified against a real host: the Vercel, Netlify and Render variable names are taken from those platforms' documentation; no deployment has been made yet.

**Languages.** Vietnamese is the provisional primary language. Every translatable field is a `LocalizedText` with Vietnamese required. A language is served for a property only when the site enables it (`config/site.ts`) **and** the record lists it in `approvedLocales`, and validation refuses to approve a language with any untranslated field. Reason: English content must not be published without approved translations. URLs are ready for it: the primary language has no prefix, others get one (`/en/...`). When a second language is enabled, public routes move under an `app/[locale]` segment; because all links come from `routes.ts`, that is a mechanical change.

## 4. Design tokens

`src/styles/tokens.css` has two layers: primitive scales (space, type, radius, motion) and semantic tokens that components read. `globals.css` maps the semantic tokens into Tailwind utilities (`bg-surface`, `text-ink`, `font-display`). A property may override only the tokens listed in `styles/theme-contract.ts`; content validation rejects any other. Reason: theming must not be able to break shared structure such as spacing or state colours.

Tokens are the lightest of three levers for distinctiveness, not the main one. See `CONTENT_MODEL.md`.

## 5. Open architecture questions

- Public URL words (`/stays/...` is provisional) and whether slugs are Vietnamese or English. Must be settled before launch.
- Hosting platform. `DEPLOY_ENV` is generic; `VERCEL_ENV` is honoured if Vercel is used.
- Whether both providers may run at once during a migration. The content model already maps each property per provider; routing by property would be a small change in `server/services.ts`.
