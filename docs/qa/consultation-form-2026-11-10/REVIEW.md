# Consultation form — real email delivery (built 10–11/11/2026, awaiting owner acceptance)

Brief: complete the shared consultation form (`#tu-van`, homepage + partner page) as a secure lead submission to
`hello@vnest.com.vn`, without redesigning the approved UI. Architecture, setup and privacy dependency:
`docs/handoff/BACKEND-HANDOFF.md` §11.

## Status

- **Built and tested end to end with the development mock.** Real delivery is **OFF**: no email provider account, API
  key or verified sender exists, and `vnest.com.vn` has a strict DMARC policy (`p=reject`), so a provider must be
  verified in VNest's DNS first (§11.3).
- **No real email was sent. Receipt in hello@vnest.com.vn is NOT verified.** The form must not be called operational
  until the staging check in §11.8 passes.
- With no configuration the site behaves exactly as before (notice "chưa hoạt động", "Chưa gửi…", nothing sent).

## Changed files (this work only)

New
- `src/domain/consultation.ts` — validation schema, limits, sanitising, `ConsultationSink` port, `ConsultationMode`
- `src/config/consultation.ts` — recipient default (hello@vnest.com.vn), time zone, rate limits, source-page labels
- `src/integrations/consultation/compose-email.ts` — subject / text / HTML, escaping, Reply-To rule
- `src/integrations/consultation/transport.ts` — `EmailTransport` interface
- `src/integrations/consultation/resend.ts` — Resend HTTP transport (fetch, no SDK)
- `src/integrations/consultation/mock.ts` — development mock (`sent` / `failed` / `slow`)
- `src/integrations/consultation/email-sink.ts` — email implementation of the sink port
- `src/server/consultation.ts` — HTTP-free handler: origin, size, rate limit, honeypot, validation, duplicates, delivery
- `src/server/rate-limit.ts` — in-memory sliding-window limiter
- `src/server/consultation-labels.ts` — service names for the email, from the form copy
- `src/app/api/consultation/route.ts` — `POST /api/consultation`
- `src/features/demo/consultation-submit.ts` — browser submit, maps answers to sent / invalid / limited / failed
- Tests: `src/domain/consultation.test.ts`, `src/integrations/consultation/consultation-email.test.ts`,
  `src/server/consultation.test.ts`, `src/features/demo/consultation-submit.test.ts`
- QA: `scripts/qa-consultation.mjs`, `scripts/render-email-sample.mjs`, `qa-consultation.log`, `email-sample/*.html|txt`

Modified
- `src/features/demo/Consultation.tsx` — states (idle, invalid, unsent, submitting, sent, failed, limited), `delivery` prop, honeypot, in-flight guard, length limits
- `src/features/demo/contact-copy.ts` — intro, submitting, sent, thanks, simulated, failed, limited, length/service errors
- `src/features/demo/owner-journey.ts` — `validateContact` now uses the shared domain rules; `consultationErrorText`
- `src/features/demo/OwnerJourney.module.css` — `.submitLive`, sending state, note link, simulated line, trap, service error
- `src/features/demo/OwnerJourney.tsx`, `src/features/partner/page/PartnerPage.tsx` — pass `delivery`
- `src/app/dev/demo/page.tsx`, `src/app/dev/demo/hop-tac/page.tsx` — read `consultationMode()` on the server
- `src/server/services.ts` — `consultationMode`, `createConsultation`, `getConsultation`
- `src/config/env.ts` — `CONSULTATION_DELIVERY`, `CONSULTATION_RECIPIENT`, `CONSULTATION_SENDER`, `RESEND_API_KEY`
- `.env.example`, `.gitignore` (QA PNGs local), `.claude/launch.json` (`vnest-consult-mock` 3407, `vnest-consult-off` 3408),
  `docs/handoff/BACKEND-HANDOFF.md` (§7 rows, new §11)

Not touched: booking code, GoHost / ezCloud adapters, stash@{0}. Nothing staged, committed or pushed.

## Test results (11/11/2026)

| Check | Result |
| --- | --- |
| `npm run lint` | 0 errors (3 pre-existing warnings in old QA scripts) |
| `npm run typecheck` | clean |
| `npm test` | 500 / 500 (36 new) |
| Browser QA `qa-consultation.mjs` (production build, 1440 + 390, VI + EN, mock + off servers) | 154 / 154 |
| Existing e2e on the off server: mobile-interactions 16, homepage-content 11, about-vnest 16 | 43 / 43 |
| Existing booking e2e: occupancy 10, room-selection 22 | 32 / 32 |
| Existing hybrid-booking e2e (with simulation server) | 79 / 79 (a first run had 7 network-idle timeouts on photo pages that do not use the form; they passed alone and in a full rerun) |
| Server log after QA | only `ref=`, provider, reason; no names, contacts or messages |
| Live delivery | **not run** (no credentials) |

QA brief coverage: (1) empty form, (2) name + email, (3) name + phone (partner page), (4) invalid contact,
(5) optional fields in the payload, (6) preselection from the 3 homepage CTAs, the 3 partner-page CTAs and `?dich-vu=`
(and that the preselected service is the one sent), (7) double click + Enter during sending → one request,
(8) provider failure (502) and network failure keep values and show the failure message with a mailto link,
(9) success only after the server's 200, (10) all feedback in VI and EN. Also: a service changed by hand stays the
only one checked after the success reset (found in self-review: a native form reset would have re-checked the first
service; the form now clears only its text fields). Plus rate limit (6th request → 429, polite
message) and the off state.

Note: the QA build was made from a copy of the working folder, which also contained another session's uncommitted
footer-social edits (`DemoFooter.tsx`, `site-copy.ts`, `FooterSocial.tsx`); they are not part of this work.

## Screenshots (`shots/`, local only)

`{desktop|mobile}-vi-1-idle`, `-2-validation`, `-3-submitting`, `-4-success`, `-5-failure`, `-0-off-unsent`;
`desktop-en-2…5`; `desktop-vi-6-rate-limited`. Email previews: `email-sample/*.png` (fake data).

## Decisions for the owner

1. **Submit button when delivery is on**: filled Dark Olive (it was a muted secondary button because it sent nothing).
   Off: unchanged. Reversible (one class).
2. **Copy** (VI from the brief; EN is a build-team draft): intro "Chia sẻ đôi nét về tài sản và nhu cầu của bạn. Yêu cầu
   sẽ được gửi trực tiếp đến đội ngũ VNest."; thanks "Cảm ơn bạn đã quan tâm đến VNest."; rate-limit message.
3. **Provider**: ~~Resend vs the existing mailbox over SMTP~~ — **decided 11/11/2026: Resend** (already implemented; no code change). Setup: BACKEND-HANDOFF §11.3 option A.

## Remaining blockers before the form is public

1. Resend account + sending-only API key (VNest-owned) and Resend's DNS records on `vnest.com.vn` (DKIM + `send.` subdomain), domain Verified.
2. Sender mailbox name chosen by VNest (`CONSULTATION_SENDER`).
3. Staging live test and confirmed receipt in hello@vnest.com.vn (not in spam), Reply-To working.
4. Approved privacy notice / consent wording (§11.7); legal confirmation of requirements.
5. Hosting decision: confirm `X-Forwarded-For` is set by the platform; consider platform rate limiting / shared store.
6. The form lives on `/dev/*` review routes; the public routes (`/`, `/hop-tac`) are not built yet (Phase E).
