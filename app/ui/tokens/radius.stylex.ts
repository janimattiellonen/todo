import * as stylex from "@stylexjs/stylex";

/**
 * Border-radius tokens.
 *
 * Every value traces to `docs/design-tokens.md` §4. `xl` is reserved for
 * slightly softer cards if needed; `full` is for avatars, count badges,
 * chip pills.
 */
export const radius = stylex.defineVars({
  sm: "4px",
  md: "6px",
  lg: "8px",
  xl: "10px",
  full: "9999px",
});
