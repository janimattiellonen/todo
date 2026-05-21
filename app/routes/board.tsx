import * as stylex from "@stylexjs/stylex";
import { getServerConfig } from "~/config/serverConfig.server";
import { requireSession } from "~/features/auth/requireSession.server";
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
import type { Route } from "./+types/board";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Board · Todo" }];
}

/**
 * Placeholder board page — uses requireSession so unauthenticated
 * requests redirect to `/`. #15 replaces this with the real three-column
 * layout.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const config = getServerConfig();
  const session = await requireSession(config, request);
  return { role: session.role };
}

export default function Board({ loaderData }: Route.ComponentProps) {
  return (
    <main {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.card)}>
        <h1 {...stylex.props(styles.heading)}>You're signed in.</h1>
        <p {...stylex.props(styles.lede)}>
          Role: <strong>{loaderData.role}</strong>. The real board UI lands in
          #15.
        </p>
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
    maxWidth: "480px",
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
    marginTop: spacing.x3,
    marginBottom: 0,
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.body,
    color: colors.textMuted,
  },
});
