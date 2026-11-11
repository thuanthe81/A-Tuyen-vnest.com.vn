"use client";

import { useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useId, useMemo, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { CONSULTATION_LIMITS, CONSULTATION_TRAP_FIELD, type ConsultationMode } from "@/domain/consultation";
import { resolveLocalized, type Locale } from "@/domain/locale";
import { CONTACT_FORM_COPY } from "./contact-copy";
import { submitConsultation } from "./consultation-submit";
import { SectionLink } from "./SectionLink";
import { siteCopyFor } from "./site-copy";
import { VNestContactBlock } from "./VNestContactBlock";
import { SERVICES, consultationErrorText, isServiceId, serviceTitle, validateContact, type ContactErrors, type ServiceId } from "./owner-journey";
import { VNEST_CONTACT } from "./vnest-contact";
import styles from "./OwnerJourney.module.css";

/**
 * THE CONSULTATION FORM AND ITS CONTACT BLOCK, written once for every page that asks property owners to get in touch:
 * the homepage (OwnerJourney.tsx) and the partner page (/dev/demo/hop-tac). Extracted from OwnerJourney.tsx on 9/11/2026
 * without changing what it shows or does.
 *
 * - `ConsultationProvider` holds the chosen service. It starts from the address (`?dich-vu=`, so a refresh, a shared link
 *   or a service CTA from another page keeps it) and `goToForm(service)` is what every service CTA calls: choose the
 *   service, keep it in the address, scroll to the form and focus the first field still to fill (fine pointer) or the
 *   form heading (touch, so the keyboard does not open uninvited).
 * - `ContactSection` (`#lien-he`): VNest's identity and the Dark Olive contact card (hotline, email, address, Facebook),
 *   whose CTA is a real anchor to the form.
 * - `ConsultationForm` (`#tu-van`): what it does follows `delivery`, which the page reads from the server's configuration
 *   (`consultationMode()` in src/server/services.ts):
 *     off   the default. Validates, sends nothing, never shows success, and the copy says the form is not active.
 *     mock  development only. Posts to /api/consultation, whose mock accepts or fails; success is labelled as simulated.
 *     live  a real provider is configured. Posts to /api/consultation; "sent" only after the server confirms that the
 *           provider accepted the request; the form is reset only then. A failure keeps everything the visitor typed.
 *   Rules: src/domain/consultation.ts (shared with the server). Setup: docs/handoff/BACKEND-HANDOFF.md §11.
 */

export type ConsultationStatus = "idle" | "invalid" | "unsent" | "submitting" | "sent" | "failed" | "limited";

export type ServiceChoice = ServiceId | "chua-ro";

/** The consultation form section's anchor: the contact card's CTA and every service CTA land here. */
export const FORM_ANCHOR = "tu-van";

type Consultation = {
  service: ServiceChoice;
  choose: (choice: ServiceChoice) => void;
  /** Scrolls to the form; with a service, chooses it first (and keeps it in the address). */
  goToForm: (service?: ServiceId) => void;
  focusFormTitle: () => void;
  /** Whether requests are sent (see above). Decided by the server, passed down by the page. */
  delivery: ConsultationMode;
  status: ConsultationStatus;
  setStatus: (status: ConsultationStatus) => void;
  /** The form's section, heading and two required fields, for scrolling and focus. */
  sectionRef: RefObject<HTMLElement | null>;
  titleRef: RefObject<HTMLHeadingElement | null>;
  nameRef: RefObject<HTMLInputElement | null>;
  reachRef: RefObject<HTMLInputElement | null>;
};

const ConsultationContext = createContext<Consultation | null>(null);

export function useConsultation(): Consultation {
  const value = useContext(ConsultationContext);
  if (!value) throw new Error("useConsultation needs a ConsultationProvider");
  return value;
}

/** Keeps the chosen service in the address without adding a history entry. */
function remember(id: ServiceChoice | null, hash?: string) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("dich-vu", id);
  if (hash) url.hash = hash;
  window.history.replaceState(window.history.state, "", url);
}

export function ConsultationProvider({ children, delivery = "off" }: { children: ReactNode; delivery?: ConsultationMode }) {
  const params = useSearchParams();
  const fromUrl = params?.get("dich-vu") ?? null;
  const [service, setService] = useState<ServiceChoice>(isServiceId(fromUrl) || fromUrl === "chua-ro" ? (fromUrl as ServiceChoice) : "van-hanh");
  const [status, setStatus] = useState<ConsultationStatus>("idle");
  const section = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const name = useRef<HTMLInputElement>(null);
  const reach = useRef<HTMLInputElement>(null);

  const choose = useCallback((choice: ServiceChoice) => {
    setService(choice);
    remember(choice);
  }, []);

  const goToForm = useCallback((id?: ServiceId) => {
    if (id) setService(id);
    // A request on its way keeps its "Đang gửi..." until the server answers.
    setStatus((current) => (current === "submitting" ? current : "idle"));
    remember(id ?? null, FORM_ANCHOR);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    section.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    // Focus follows the visitor without a second jump: the first field still empty when a keyboard is likely, the
    // heading on touch (a programmatic focus there would open the on-screen keyboard).
    window.setTimeout(() => {
      const fine = matchMedia("(pointer: fine)").matches;
      const target = !fine ? title.current : !name.current?.value.trim() ? name.current : !reach.current?.value.trim() ? reach.current : name.current;
      target?.focus({ preventScroll: true });
    }, reduce ? 0 : 450);
  }, []);

  const focusFormTitle = useCallback(() => title.current?.focus({ preventScroll: true }), []);

  const value = useMemo<Consultation>(
    () => ({ service, choose, goToForm, focusFormTitle, delivery, status, setStatus, sectionRef: section, titleRef: title, nameRef: name, reachRef: reach }),
    [service, choose, goToForm, focusFormTitle, delivery, status],
  );
  return <ConsultationContext.Provider value={value}>{children}</ConsultationContext.Provider>;
}

/** `#lien-he`: VNest's identity and contact card; its CTA scrolls to the form and hands focus to its heading. */
export function ContactSection({ locale }: { locale: Locale }) {
  const site = siteCopyFor(locale);
  const { focusFormTitle } = useConsultation();
  return (
    <section id="lien-he" lang={locale} className={styles.contact} aria-labelledby="lien-he-title">
      <VNestContactBlock
        titleId="lien-he-title"
        cta={
          <SectionLink section={FORM_ANCHOR} className={styles.footerCta} onArrive={focusFormTitle}>
            {site.footerCta} <span aria-hidden="true">→</span>
          </SectionLink>
        }
      />
    </section>
  );
}

/** "{email}" in a sentence, as VNest's email address linked with mailto. */
function withEmailLink(sentence: string): ReactNode {
  const [before, after] = sentence.split("{email}");
  return (
    <>
      {before}
      <a href={VNEST_CONTACT.email.href}>{VNEST_CONTACT.email.display}</a>
      {after}
    </>
  );
}

/** `#tu-van`: the consultation form (see above for what it sends, and when). */
export function ConsultationForm({ locale }: { locale: Locale }) {
  const form = resolveLocalized(CONTACT_FORM_COPY, locale);
  const { service, choose, delivery, status, setStatus, sectionRef, titleRef, nameRef, reachRef } = useConsultation();
  const choices: readonly { id: ServiceChoice; label: string }[] = [...SERVICES.map((s) => ({ id: s.id as ServiceChoice, label: serviceTitle(s, locale) })), { id: "chua-ro", label: form.serviceUnsure }];
  const [errors, setErrors] = useState<ContactErrors>({});
  const uid = useId();
  // The guard against a second request while one is on its way (a double click, Enter twice): a ref, so it holds
  // before React re-renders the button.
  const inFlight = useRef(false);
  const submitting = status === "submitting";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current) return;
    const element = event.currentTarget;
    const data = new FormData(element);
    const field = (name: string) => String(data.get(name) ?? "");
    const found = validateContact({ name: field("name"), reach: field("reach") }, locale);
    setErrors(found);
    if (found.name || found.reach) {
      setStatus("invalid");
      (found.name ? nameRef : reachRef).current?.focus();
      return;
    }
    if (delivery === "off") {
      // Valid, but delivery is not switched on: say so, keep everything the visitor typed, send nothing.
      setStatus("unsent");
      return;
    }

    inFlight.current = true;
    setStatus("submitting");
    const outcome = await submitConsultation({
      service,
      name: field("name"),
      reach: field("reach"),
      asset: field("asset"),
      message: field("message"),
      source: window.location.pathname,
      locale,
      [CONSULTATION_TRAP_FIELD]: field(CONSULTATION_TRAP_FIELD),
    });
    inFlight.current = false;

    if (outcome.kind === "sent") {
      // Only now, with the server's confirmation, is the form emptied. The text fields only: the service radios are
      // controlled by React, and a native reset would re-check the first-rendered choice.
      for (const name of ["name", "reach", "asset", "message"]) {
        const input = element.elements.namedItem(name);
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) input.value = "";
      }
      setErrors({});
      setStatus("sent");
    } else if (outcome.kind === "invalid") {
      const text = consultationErrorText(outcome.fields, locale);
      setErrors(text);
      setStatus("invalid");
      (text.name ? nameRef : text.reach ? reachRef : nameRef).current?.focus();
    } else {
      setStatus(outcome.kind);
    }
  };

  // After a success, the message gives way as soon as the visitor starts another request.
  const onInput = () => {
    if (status === "sent") setStatus("idle");
  };

  const errorId = (field: keyof ContactErrors) => `${uid}-${field}-error`;
  const note =
    status === "unsent" ? (
      form.unsent
    ) : status === "invalid" ? (
      form.invalid
    ) : status === "submitting" ? (
      form.submitting
    ) : status === "sent" ? (
      <>
        <strong>{form.sent}</strong> {form.sentThanks}
        {delivery === "mock" ? <span className={styles.formNoteMock}>{form.sentSimulated}</span> : null}
      </>
    ) : status === "failed" ? (
      withEmailLink(form.failed)
    ) : status === "limited" ? (
      withEmailLink(form.limited)
    ) : null;
  const strong = status === "unsent" || status === "sent" || status === "failed" || status === "limited";

  return (
    <section ref={sectionRef} id={FORM_ANCHOR} lang={locale} className={styles.consult} aria-labelledby={`${uid}-form-title`}>
      <form
        className={styles.form}
        noValidate
        onSubmit={onSubmit}
        onInput={onInput}
        aria-labelledby={`${uid}-form-title`}
        aria-describedby={`${uid}-notice`}
        aria-busy={submitting || undefined}
        data-delivery={delivery}
        data-status={status}
      >
        <div className={styles.formHead}>
          <h2 id={`${uid}-form-title`} ref={titleRef} tabIndex={-1} className={styles.formTitle}>
            {form.formTitle}
          </h2>
          <p id={`${uid}-notice`} className={styles.formNotice}>
            {delivery === "off" ? form.notice : form.intro}
          </p>
        </div>
        <div className={styles.formBody}>
          <fieldset className={styles.chips} aria-invalid={errors.service ? true : undefined} aria-describedby={errors.service ? errorId("service") : undefined}>
            <legend>{form.serviceLegend}</legend>
            {choices.map((option) => (
              <label key={option.id} className={styles.chip}>
                <input type="radio" name="service" value={option.id} checked={service === option.id} onChange={() => choose(option.id)} />
                <span>{option.label}</span>
              </label>
            ))}
            {errors.service ? (
              <small id={errorId("service")} className={`${styles.error} ${styles.chipsError}`}>
                {errors.service}
              </small>
            ) : null}
          </fieldset>
          <div className={styles.fields}>
            <label className={styles.field}>
              <span>
                {form.name} <em aria-hidden="true">*</em>
              </span>
              <input
                ref={nameRef}
                name="name"
                autoComplete="name"
                maxLength={CONSULTATION_LIMITS.name.max}
                readOnly={submitting}
                required
                aria-required="true"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? errorId("name") : undefined}
              />
              {errors.name ? (
                <small id={errorId("name")} className={styles.error}>
                  {errors.name}
                </small>
              ) : null}
            </label>
            <label className={styles.field}>
              <span>
                {form.reach} <em aria-hidden="true">*</em>
              </span>
              <input
                ref={reachRef}
                name="reach"
                autoComplete="email"
                maxLength={CONSULTATION_LIMITS.reach.max}
                readOnly={submitting}
                required
                aria-required="true"
                aria-invalid={errors.reach ? true : undefined}
                aria-describedby={errors.reach ? errorId("reach") : `${uid}-reach-hint`}
              />
              {errors.reach ? (
                <small id={errorId("reach")} className={styles.error}>
                  {errors.reach}
                </small>
              ) : (
                <small id={`${uid}-reach-hint`} className={styles.hint}>
                  {form.reachHint}
                </small>
              )}
            </label>
            <label className={`${styles.field} ${styles.wide}`}>
              <span>
                {form.asset} <small>{form.optional}</small>
              </span>
              <input
                name="asset"
                autoComplete="off"
                maxLength={CONSULTATION_LIMITS.asset.max}
                readOnly={submitting}
                aria-invalid={errors.asset ? true : undefined}
                aria-describedby={errors.asset ? errorId("asset") : undefined}
              />
              {errors.asset ? (
                <small id={errorId("asset")} className={styles.error}>
                  {errors.asset}
                </small>
              ) : null}
            </label>
            <label className={`${styles.field} ${styles.wide}`}>
              <span>
                {form.message} <small>{form.optional}</small>
              </span>
              <textarea
                name="message"
                rows={3}
                maxLength={CONSULTATION_LIMITS.message.max}
                readOnly={submitting}
                aria-invalid={errors.message ? true : undefined}
                aria-describedby={errors.message ? errorId("message") : undefined}
              />
              {errors.message ? (
                <small id={errorId("message")} className={styles.error}>
                  {errors.message}
                </small>
              ) : null}
            </label>
          </div>
          {/* The spam trap: off-screen, out of the tab order and hidden from assistive technology. */}
          <div className={styles.trap} aria-hidden="true">
            <label>
              {form.trap}
              <input name={CONSULTATION_TRAP_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
            </label>
          </div>
          <button type="submit" className={`${styles.submit} ${delivery === "off" ? "" : styles.submitLive}`} aria-disabled={submitting || undefined}>
            {submitting ? form.submitting : form.submit}
          </button>
          <p className={`${styles.formNote} ${strong ? styles.formNoteStrong : ""} ${submitting ? styles.formNoteQuiet : ""}`} role="status" aria-live="polite">
            {note}
          </p>
        </div>
      </form>
    </section>
  );
}
