import * as stylex from "@stylexjs/stylex";
import { Form } from "react-router";
import { colors } from "~/ui/tokens/colors.stylex";
import { radius } from "~/ui/tokens/radius.stylex";
import { spacing } from "~/ui/tokens/spacing.stylex";
import {
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
} from "~/ui/tokens/typography.stylex";
import type { Route } from "./+types/home";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Sign in · Todo" },
    {
      name: "description",
      content: "Sign in to your workspace with a magic link.",
    },
  ];
}

type Status = "sent" | "invalid";

export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("status");
  const status: Status | null =
    raw === "sent" || raw === "invalid" ? raw : null;
  return { status };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <main {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.card)}>
        <h1 {...stylex.props(styles.heading)}>Sign in</h1>
        <p {...stylex.props(styles.lede)}>
          Enter your email and we'll send a magic link.
        </p>

        <Form
          method="post"
          action="/auth/request"
          {...stylex.props(styles.form)}
        >
          <label htmlFor="email" {...stylex.props(styles.label)}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="email@example.com"
            {...stylex.props(styles.input)}
          />
          <button type="submit" {...stylex.props(styles.button)}>
            Send magic link
          </button>
        </Form>

        {loaderData.status === "sent" && (
          <p {...stylex.props(styles.status, styles.statusInfo)} role="status">
            If that email matches an account, a magic link is on its way.
          </p>
        )}
        {loaderData.status === "invalid" && (
          <p {...stylex.props(styles.status, styles.statusError)} role="alert">
            That doesn't look like a valid email.
          </p>
        )}
      </div>
    </main>
  );
}

const styles = stylex.create({
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.x6,
    backgroundColor: colors.surface0,
    fontFamily: fontFamily.text,
    color: colors.textDefault,
  },
  card: {
    width: "100%",
    maxWidth: "380px",
    padding: spacing.x6,
    backgroundColor: colors.surface1,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    boxSizing: "border-box",
  },
  heading: {
    margin: 0,
    fontSize: fontSize.titleLg,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.tight,
  },
  lede: {
    marginTop: spacing.x2,
    marginBottom: spacing.x5,
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.body,
    color: colors.textMuted,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.x2,
  },
  label: {
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.medium,
    color: colors.textDefault,
  },
  input: {
    padding: `${spacing.x3} ${spacing.x3}`,
    fontFamily: fontFamily.text,
    fontSize: fontSize.bodyMd,
    color: colors.textDefault,
    backgroundColor: colors.surface1,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    outline: "none",
  },
  button: {
    marginTop: spacing.x3,
    padding: `${spacing.x3} ${spacing.x4}`,
    fontFamily: fontFamily.text,
    fontSize: fontSize.bodyMd,
    fontWeight: fontWeight.medium,
    color: colors.textInverse,
    backgroundColor: { default: colors.accent, ":hover": colors.accentHover },
    borderWidth: 0,
    borderRadius: radius.md,
    cursor: "pointer",
  },
  status: {
    marginTop: spacing.x4,
    marginBottom: 0,
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.body,
  },
  statusInfo: {
    color: colors.info,
  },
  statusError: {
    color: colors.danger,
  },
});
