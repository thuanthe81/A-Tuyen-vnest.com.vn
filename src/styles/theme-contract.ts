/**
 * The design tokens a property may override to carry its own character (see tokens.css).
 * Anything not listed here is shared structure and stays the same across the site.
 */
export const THEMEABLE_TOKENS = [
  "--vn-surface",
  "--vn-surface-muted",
  "--vn-surface-raised",
  "--vn-ink",
  "--vn-ink-muted",
  "--vn-line",
  "--vn-action",
  "--vn-action-hover",
  "--vn-on-action",
  "--vn-font-display",
  "--vn-font-body",
  "--vn-radius",
] as const;
