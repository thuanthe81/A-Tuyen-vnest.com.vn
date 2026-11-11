/**
 * The Vietnamese name of each service choice, for the email VNest receives (the team reads Vietnamese whatever language
 * the visitor used; the email states that language). Taken from the form's own copy, so the email always names a
 * service exactly as the form showed it.
 */

import type { ConsultationService } from "@/domain/consultation";
import { CONTACT_FORM_COPY } from "@/features/demo/contact-copy";
import { SERVICES, serviceTitle } from "@/features/demo/owner-journey";

export function consultationServiceLabel(service: ConsultationService): string {
  if (service === "chua-ro") return CONTACT_FORM_COPY.serviceUnsure.vi;
  const found = SERVICES.find((s) => s.id === service);
  return found ? serviceTitle(found, "vi") : service;
}
