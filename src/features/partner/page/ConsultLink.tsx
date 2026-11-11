"use client";

import type { ReactNode } from "react";
import { useConsultation } from "@/features/demo/Consultation";
import { isPlainClick } from "@/features/demo/OwnerJourney";
import type { ServiceId } from "@/features/demo/owner-journey";

/**
 * A consultation CTA on the partner page. A real link to the page's own form (with `?dich-vu=` for a service CTA), so it
 * works without script and in a new tab; a plain click stays on the page, chooses the service (if any) and scrolls to
 * the form, exactly as the homepage's service CTAs do.
 */
export function ConsultLink({ href, service, className, children }: { href: string; service?: ServiceId; className?: string; children: ReactNode }) {
  const { goToForm } = useConsultation();
  return (
    <a
      href={href}
      className={className}
      data-service={service}
      onClick={(event) => {
        if (!isPlainClick(event)) return;
        event.preventDefault();
        goToForm(service);
      }}
    >
      {children}
    </a>
  );
}
