/**
 * CEO demo routes, in a plain module so server and client components share the values (a
 * constant exported from a "use client" file reaches a server component as a reference, not a value).
 */
export const DEMO_HOME = "/dev/demo";
export const DEMO_BARE_CHIC = "/dev/stays/bare-chic?view=demo";
export const DEMO_BARE_HYPHEN = "/dev/stays/bare-hyphen";
export const DEMO_BARE_DA_KAO = "/dev/stays/bare-da-kao";
export const DEMO_BARE_HAN = "/dev/stays/bare-han";
export const DEMO_THE_NANG_SUITES = "/dev/stays/the-nang-suites";
export const DEMO_PEPPER_HOUSE = "/dev/stays/pepper-house";

/** Homepage section anchors. The menu shows discover, partner, faq and contact, in that order (client review 6/11/2026). */
export const DEMO_LINKS = {
  discover: `${DEMO_HOME}#kham-pha`,
  about: `${DEMO_HOME}#ve-vnest`,
  partner: `${DEMO_HOME}#hop-tac`,
  faq: `${DEMO_HOME}#hoi-dap`,
  contact: `${DEMO_HOME}#lien-he`,
} as const;
