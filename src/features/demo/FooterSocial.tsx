import type { ReactNode } from "react";
import type { SiteCopy } from "./site-copy";
import { VNEST_CONTACT } from "./vnest-contact";
import styles from "./OwnerJourney.module.css";

/**
 * FOOTER SOCIAL ICONS (owner, 10/11/2026; design approved 11/11/2026): Instagram, LinkedIn, TikTok and Facebook, before
 * "Về đầu trang ↑".
 * - A network with an official URL (`href`, read from VNEST_CONTACT, never copied here) is a real link that opens in a
 *   new tab, named "Facebook VNest (mở trong tab mới)". Facebook is the only one (verified on the page itself 11/11/2026).
 * - The others are placeholders until VNest gives their URLs: NOT links, not focusable, each an image named
 *   "<network> – sắp cập nhật" with a small "Sắp cập nhật" tooltip on hover. To activate one, give it an `href` from
 *   vnest-contact.ts.
 *
 * Line icons from Tabler Icons (MIT, tabler.io/icons), drawn at a 1.5 stroke to match the footer's light type.
 */
const NETWORKS: readonly { id: string; name: string; href?: string; icon: ReactNode }[] = [
  {
    id: "instagram",
    name: "Instagram",
    icon: (
      <>
        <path d="M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
        <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0-6 0" />
        <path d="M16.5 7.5v.01" />
      </>
    ),
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: (
      <>
        <path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" />
        <path d="M8.5 11v5" />
        <path d="M8.5 8v.01" />
        <path d="M12 16v-5" />
        <path d="M15.5 16v-3a1.75 1.75 0 0 0-3.5 0" />
      </>
    ),
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: <path d="M20 7.917v4.034a9.948 9.948 0 0 1-5-1.951v4.5a6.5 6.5 0 1 1-8-6.326v4.326a2.5 2.5 0 1 0 4 2V3h4.083A6.005 6.005 0 0 0 20 7.917z" />,
  },
  {
    id: "facebook",
    name: "Facebook",
    href: VNEST_CONTACT.facebook.href,
    icon: <path d="M7 10v4h3v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3V3h-3a5 5 0 0 0-5 5v2H7" />,
  },
];

export function FooterSocial({ copy }: { copy: SiteCopy }) {
  return (
    <ul className={styles.footerSocial} aria-label={copy.socialLabel}>
      {NETWORKS.map((network) => {
        const artwork = (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {network.icon}
          </svg>
        );
        return (
          <li key={network.id}>
            {network.href ? (
              <a
                href={network.href}
                className={styles.socialIcon}
                data-social={network.id}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={copy.socialOpen(network.name)}
              >
                {artwork}
              </a>
            ) : (
              <span role="img" className={styles.socialIcon} data-social={network.id} data-tip={copy.socialTip} aria-label={copy.socialPending(network.name)}>
                {artwork}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
