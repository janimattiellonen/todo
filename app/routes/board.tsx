import * as stylex from "@stylexjs/stylex";
import { Form } from "react-router";
import { getServerConfig } from "~/config/serverConfig.server";
import { getPool } from "~/database/pool.server";
import { requireSession } from "~/features/auth/requireSession.server";
import { queryListColumnsForWorkspace } from "~/features/columns/queryListColumnsForWorkspace.server";
import { queryFindWorkspaceById } from "~/features/workspaces/queryFindWorkspaceById.server";
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

export async function loader({ request }: Route.LoaderArgs) {
  const config = getServerConfig();
  const session = await requireSession(config, request);

  const pool = await getPool(config);

  const [workspace, columns] = await Promise.all([
    queryFindWorkspaceById(pool, session.workspaceId),
    queryListColumnsForWorkspace(pool, session.workspaceId),
  ]);

  return {
    workspaceName: workspace?.name ?? "Workspace",
    columns: columns.map((c) => ({ id: c.id, name: c.name })),
  };
}

export default function Board({ loaderData }: Route.ComponentProps) {
  return (
    <main {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <h1 {...stylex.props(styles.workspaceName)}>
          {loaderData.workspaceName}
        </h1>
        <Form method="post" action="/auth/signout">
          <button type="submit" {...stylex.props(styles.signOutButton)}>
            Sign out
          </button>
        </Form>
      </header>

      <section {...stylex.props(styles.board)} aria-label="Board">
        {loaderData.columns.map((column) => (
          <div
            key={column.id}
            {...stylex.props(styles.column)}
            data-testid="board-column"
          >
            <h2 {...stylex.props(styles.columnTitle)}>{column.name}</h2>
            <p {...stylex.props(styles.columnEmpty)}>No tasks yet.</p>
          </div>
        ))}
      </section>
    </main>
  );
}

const styles = stylex.create({
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: colors.surface0,
    fontFamily: fontFamily.text,
    color: colors.textDefault,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `${spacing.x4} ${spacing.x6}`,
    backgroundColor: colors.surface1,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.borderSubtle,
  },
  workspaceName: {
    margin: 0,
    fontSize: fontSize.titleMd,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.tight,
  },
  signOutButton: {
    padding: `${spacing.x2} ${spacing.x4}`,
    fontFamily: fontFamily.text,
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.medium,
    color: colors.textDefault,
    backgroundColor: {
      default: colors.surface1,
      ":hover": colors.surface2,
    },
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    cursor: "pointer",
  },
  board: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: spacing.x4,
    padding: spacing.x6,
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.x3,
    padding: spacing.x4,
    backgroundColor: colors.surface2,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    minHeight: "200px",
  },
  columnTitle: {
    margin: 0,
    fontSize: fontSize.bodyXxs,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.body,
    letterSpacing: letterSpacing.wide,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  columnEmpty: {
    margin: 0,
    fontSize: fontSize.bodyXs,
    color: colors.textFaint,
  },
});
