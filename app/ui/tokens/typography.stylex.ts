import * as stylex from "@stylexjs/stylex";

/**
 * Typography tokens — light theme baseline.
 *
 * Every value traces to `docs/design-tokens.md` §2. The title and body
 * scales are intentionally separate (per §2A): `<Heading>` consumes
 * titleSm/Md/Lg; `<Text>` consumes bodyXxs/Xs/Sm/Md. Direct application
 * of font-size outside those typography components is disallowed.
 */
export const fontFamily = stylex.defineVars({
  text: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
});

export const fontSize = stylex.defineVars({
  // Title scale — for <Heading> and <PageHeading>
  titleSm: "16px",
  titleMd: "20px",
  titleLg: "24px",

  // Body scale — for <Text>
  bodyXxs: "11px",
  bodyXs: "12px",
  bodySm: "13px",
  bodyMd: "14px",
});

export const fontWeight = stylex.defineVars({
  normal: "400",
  medium: "500",
  semiBold: "600",
  bold: "700",
});

export const lineHeight = stylex.defineVars({
  heading: "1.2",
  body: "1.5",
});

export const letterSpacing = stylex.defineVars({
  // Tight — headings (design-tokens §2 Heading defaults)
  tight: "-0.02em",
  // Wide — uppercase table headers (design-tokens §7 Tables)
  wide: "0.04em",
});
