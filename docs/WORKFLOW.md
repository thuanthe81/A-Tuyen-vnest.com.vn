# Section-by-section quality protocol

Adopted 09/10/2026 on the instruction of the project owner. It governs all work on VNest V2. The priority is quality and precision, not speed.

## 1. The eight steps

Every section goes through these in order. Work never continues to another section automatically.

| Step | What happens | Output | Gate |
|---|---|---|---|
| 1. Plan | Scope the section and its dependencies | Section specification (below) | |
| 2. Propose design decisions | Layout, visual direction, alternatives and trade-offs | Part of the specification | **Owner approves the direction** before any significant visual or architectural work |
| 3. Implement | Build to production standard | Code on the feature branch | |
| 4. Test and review | Visual and functional QA (below) | Evidence: screenshots, check results | Critical issues fixed first |
| 5. Refine | Apply feedback to the same section, as many rounds as needed | Entries in `REVIEW_LOG.md` | |
| 6. Request approval | Review package (below), then stop | | **Owner approves explicitly** |
| 7. Document | Design Decision Record | `docs/decisions/[number]-[name].md` | |
| 8. Freeze | Section marked FROZEN in `ROADMAP.md` | | |

A section is APPROVED only after explicit confirmation from the owner. Working, or looking acceptable to the implementer, is not approval.

## 2. Section specification (before implementation)

Concise, and covering each of:

- Business objective
- User intent and expected interactions
- Contribution to direct-booking conversion (stated as a hypothesis unless there is evidence)
- Proposed layout and visual direction
- SEO considerations
- Mobile behaviour
- Component structure
- Required content and assets
- Backend data requirements
- Alternative approaches and trade-offs

## 3. Implementation standards

Priorities: distinctive and intentional visual design; intuitive experience; SEO-friendly HTML and rendering; mobile first; accessibility and keyboard support; performance and Core Web Vitals; modular TypeScript components; data separate from presentation; PMS-independent booking.

No decorative element, animation, library or abstraction is added without a stated purpose. No generic templates.

## 4. Mandatory QA

- Viewports: 390 px (mobile), 768 px (tablet), 1440 px (desktop), at minimum.
- Inspect the actual rendered page at each size, not only source or DOM measurements.
- Verify the important interactions and relevant edge cases, including keyboard use.
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Record measured performance when it is available. Never state a score or a completed test without evidence; say what was not measured.
- Fix every critical issue before requesting approval.

## 5. Review package (when requesting approval)

- Screenshots or a verifiable preview
- What was implemented
- Design rationale
- Interactions and test results
- SEO decisions
- Known limitations
- Backend integration considerations

## 6. Records

| Record | File | When |
|---|---|---|
| Roadmap and section status | `docs/ROADMAP.md` | Updated at every status change |
| Review log | `docs/REVIEW_LOG.md` | Every round of feedback and the revision made |
| Design Decision Record | `docs/decisions/[number]-[name].md` | After approval, from `docs/decisions/TEMPLATE.md` |

Records distinguish **design hypotheses** from **validated findings**. A decision is never said to improve conversion without supporting evidence.

## 7. Freeze policy

A FROZEN section is not redesigned or refactored during later work unless the necessity is explained and the owner approves. Bug fixes and cross-section integration changes are documented in the review log, tested for regressions, and submitted for review whenever they affect approved behaviour.

## 8. Standing VNest requirements

- VNest uses ezCloud and may migrate to GoHost. The site stays provider-independent.
- Nothing is invented: no API capability, availability, price, booking result, or fact about a real property.
- Each of the six properties has a distinctive identity on a shared, maintainable architecture.
- The homepage prioritises booking intent; property pages prioritise the stay experience; SEO is part of the foundation.
- V1 and its repository are never modified. Nothing is pushed or deployed without explicit approval.

## 9. Creative direction

Set by VNest's CEO, relayed by the owner on 09/10/2026. It applies to every section.

VNest chose BMP for a fresh creative perspective and for its understanding of a younger generation of hospitality guests. The site is not a modernised hotel website; it should feel distinctive, contemporary, desirable and effortless to use.

- Bring a design-led perspective without giving up clarity or usability. Differentiation serves the guest's experience and never competes with it.
- Avoid conventional, generic hotel-website patterns.
- Prioritise emotional appeal, intuitive interaction and mobile-first behaviour.
- Design for guests who value distinctive spaces and experiences, while staying accessible to every other audience.
- **Assumptions about younger guests are hypotheses, not facts.** Record them as hypotheses until there is evidence.
- Be intentional with micro-interactions, typography, proportion and hierarchy, and document the reasoning behind each important choice.
- Booking conversion, performance, accessibility and SEO are non-negotiable.

## 10. Status vocabulary

`NOT STARTED` → `SPECIFICATION` → `DIRECTION APPROVED` → `IN PROGRESS` → `IN REVIEW` → `APPROVED` → `FROZEN`
