"use client";

import type { MouseEvent } from "react";
import type { ConsultationMode } from "@/domain/consultation";
import { resolveLocalized, type Locale } from "@/domain/locale";
import { ServiceAccordion } from "@/features/partner/ServiceAccordion";
import { PARTNER_PAGE_LINK } from "@/features/partner/partner-page-content";
import { partnerPageHref } from "@/features/partner/routes";
import type { ServicePhoto } from "@/features/partner/service-visuals";
import { ConsultationForm, ConsultationProvider, ContactSection, useConsultation } from "./Consultation";
import { OwnerFaq } from "./OwnerFaq";
import type { ServiceId } from "./owner-journey";

/**
 * HOMEPAGE SERVICES → FAQ → CONTACT → CONSULTATION FORM (section order and contact after the client review of 6/11/2026
 * and the owner's review of 7/11/2026).
 *
 * - Services (`#hop-tac`): the Visual Accordion (features/partner/ServiceAccordion.tsx), Concept B of the 8/11/2026
 *   exploration, approved by the client on 9/11/2026 in place of the three cards ("Ba thẻ, một chi tiết", 24/10/2026).
 *   Every row starts closed (10/11/2026). Each open row's CTA chooses its service in the form, keeps it in the address
 *   (`?dich-vu=`) and scrolls there. A closing footer row after the rows leads to the dedicated partner page
 *   (/dev/demo/hop-tac).
 * - FAQ (`#hoi-dap`): one-open-at-a-time disclosures, all closed on arrival, the client's six owner/B2B questions in
 *   order (OwnerFaq.tsx).
 * - Contact (`#lien-he`) and the consultation form (`#tu-van`): Consultation.tsx, shared with the partner page. Whether the
 *   form sends is `delivery`, decided by the server's configuration (off by default: it validates and sends nothing).
 * Service and FAQ copy is the client's (owner-journey.ts, 05.11 Final). Everything follows `locale` (private `?lang=en`).
 */
export function OwnerJourney({ locale = "vi", photo = null, delivery = "off" }: { locale?: Locale; photo?: ServicePhoto | null; delivery?: ConsultationMode }) {
  return (
    <ConsultationProvider delivery={delivery}>
      <PartnerServices locale={locale} photo={photo} />
      <OwnerFaq locale={locale} />
      <ContactSection locale={locale} />
      <ConsultationForm locale={locale} />
    </ConsultationProvider>
  );
}

/** A plain click stays on the page; a modified one (new tab, new window) follows the CTA's real address. */
export const isPlainClick = (event: MouseEvent) => !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0);

function PartnerServices({ locale, photo }: { locale: Locale; photo: ServicePhoto | null }) {
  const { goToForm } = useConsultation();
  const onCta = (service: ServiceId, event: MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    goToForm(service);
  };
  return (
    <ServiceAccordion
      locale={locale}
      photo={photo}
      onCta={onCta}
      more={{ href: partnerPageHref(locale), label: resolveLocalized(PARTNER_PAGE_LINK, locale) }}
    />
  );
}
