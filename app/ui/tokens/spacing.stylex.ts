import * as stylex from "@stylexjs/stylex";

/**
 * Spacing tokens — 4 px grid.
 *
 * Every value traces to `docs/design-tokens.md` §3. Values above 64 px
 * are intentionally absent; if a layout demands them, the design is
 * reconsidered before the scale is extended.
 *
 * The `x` prefix is shorthand for "step" — readable in stylex.create:
 *   padding: spacing.x4   →  16px
 *   gap:     spacing.x2   →  8px
 */
export const spacing = stylex.defineVars({
  x1: "4px",
  x2: "8px",
  x3: "12px",
  x4: "16px",
  x5: "20px",
  x6: "24px",
  x8: "32px",
  x10: "40px",
  x12: "48px",
  x16: "64px",
});
