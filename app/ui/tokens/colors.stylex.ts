import * as stylex from "@stylexjs/stylex";

/**
 * Colour tokens — light theme only.
 *
 * Every value here traces to `docs/design-tokens.md` §1. Dark theme is
 * deliberately deferred (see design-tokens §8 / §9); when added, override
 * via `stylex.createTheme(colors, {...})` without renaming any tokens.
 */
export const colors = stylex.defineVars({
  // Surfaces (design-tokens §1 Surfaces)
  surface0: "#fafafa",
  surface1: "#ffffff",
  surface2: "#f4f4f5",
  surface3: "#ebebed",

  // Borders (design-tokens §1 Borders)
  borderSubtle: "#e4e4e7",
  borderDefault: "#d4d4d8",
  borderStrong: "#a1a1aa",

  // Text (design-tokens §1 Text)
  textDefault: "#18181b",
  textMuted: "#71717a",
  textFaint: "#a1a1aa",
  textInverse: "#fafafa",

  // Accent — deep teal, used sparingly (design-tokens §1 Accent)
  accent: "#1f5862",
  accentHover: "#2a6b70",
  accentActive: "#18484f",
  accentBg: "#e6eef0",

  // Semantic — low saturation, never primary (design-tokens §1 Semantic)
  success: "#2f6f4f",
  successBg: "#e8f1ec",
  warning: "#b07a2c",
  warningBg: "#f7ecdc",
  danger: "#9b2c2c",
  dangerBg: "#f4e3e3",
  info: "#3b5c7a",
  infoBg: "#e6ecf2",
});
