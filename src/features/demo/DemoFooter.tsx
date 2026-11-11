"use client";

import { useLocale } from "@/features/locale/LocaleProvider";
import { FooterSocial } from "./FooterSocial";
import { DEMO_HOME } from "./links";
import { SectionLink } from "./SectionLink";
import { siteCopyFor } from "./site-copy";
import { VNestBrand, VNestContactBlock } from "./VNestContactBlock";
import styles from "./OwnerJourney.module.css";

/**
 * VNEST FOOTER (redesigned 25/10/2026; homepage variant after the client review of 6/11/2026).
 *
 * - `full` (property pages, results, booking step): VNest's contact composition (VNestContactBlock.tsx: identity left,
 *   Dark Olive contact card right) with one CTA to the homepage consultation form (`#tu-van`).
 * - `minimal` (homepage): the same composition is the homepage contact section, so the footer keeps only the artwork,
 *   essential navigation, © and back to top. No contact block is repeated.
 * - Both end with one row: navigation, ©, and on the right the social placeholders (no official links yet, 10/11/2026)
 *   before "Về đầu trang ↑".
 *
 * Legal entity, tax code and policy pages are not published yet (tracked in docs/handoff/BACKEND-HANDOFF.md), so no legal
 * link is drawn.
 */
const NAV = [
  { href: `${DEMO_HOME}#ve-vnest`, label: "footerNavAbout" },
  { href: `${DEMO_HOME}#thuong-hieu`, label: "footerNavBrands" },
  { href: `${DEMO_HOME}#hop-tac`, label: "footerNavServices" },
  { href: `${DEMO_HOME}#hoi-dap`, label: "footerNavFaq" },
] as const;

export function DemoFooter({ variant = "full" }: { variant?: "full" | "minimal" }) {
  const copy = siteCopyFor(useLocale());
  return (
    <footer className={styles.footer} data-variant={variant} aria-label={copy.footerLabel}>
      <div className={styles.footerInner}>
        {variant === "full" ? (
          <VNestContactBlock
            titleId="footer-contact-title"
            cardSection
            cta={
              <SectionLink section="tu-van" className={styles.footerCta}>
                {copy.footerCta}
                <span aria-hidden="true">→</span>
              </SectionLink>
            }
          />
        ) : (
          <VNestBrand compact />
        )}

        <div className={styles.footerBottom}>
          <nav aria-label={copy.footerLinks}>
            <ul className={styles.footerNav}>
              {NAV.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{copy[link.label]}</a>
                </li>
              ))}
            </ul>
          </nav>
          <p className={styles.footerLegal}>© 2026 VNest</p>
          {/* Right-hand group: the social placeholders (FooterSocial.tsx), then back to top. */}
          <div className={styles.footerEnd}>
            <FooterSocial copy={copy} />
            <a href="#top" className={styles.footerTop2}>
              {copy.backToTop}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
