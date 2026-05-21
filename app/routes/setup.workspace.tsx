import * as stylex from "@stylexjs/stylex";
import { Form, redirect } from "react-router";
import { getServerConfig } from "~/config/serverConfig.server";
import { getPool } from "~/database/pool.server";
import { completeFirstTimeSetup } from "~/features/auth/consumeMagicLink.server";
import {
  clearSetupCookieHeader,
  readSetupCookie,
  serializeSessionCookie,
} from "~/features/auth/sessionCookie.server";
import { toUserId } from "~/features/users/usersTypes";
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
import type { Route } from "./+types/setup.workspace";

const MAX_NAME_LEN = 80;

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Create your workspace · Todo" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const config = getServerConfig();
  const setup = await readSetupCookie(config, request);
  if (setup === null) {
    return redirect("/");
  }
  return { suggestedName: `${setup.emailLocalpart}'s workspace` };
}

export async function action({ request }: Route.ActionArgs) {
  const config = getServerConfig();
  const setup = await readSetupCookie(config, request);
  if (setup === null) {
    return redirect("/");
  }

  const formData = await request.formData();
  const rawName = formData.get("workspace_name");
  const name = typeof rawName === "string" ? rawName.trim() : "";

  if (name.length === 0 || name.length > MAX_NAME_LEN) {
    return { error: "Workspace name must be between 1 and 80 characters." };
  }

  const pool = await getPool(config);
  const { sessionToken } = await completeFirstTimeSetup(pool, {
    userId: toUserId(setup.userId),
    workspaceName: name,
  });

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    await serializeSessionCookie(config, sessionToken),
  );
  headers.append("Set-Cookie", await clearSetupCookieHeader(config));
  return redirect("/board", { headers });
}

export default function SetupWorkspace({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  return (
    <main {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.card)}>
        <h1 {...stylex.props(styles.heading)}>Create your workspace</h1>
        <p {...stylex.props(styles.lede)}>
          What should we call your workspace? You can change this later.
        </p>

        <Form method="post" {...stylex.props(styles.form)}>
          <label htmlFor="workspace_name" {...stylex.props(styles.label)}>
            Workspace name
          </label>
          <input
            id="workspace_name"
            name="workspace_name"
            type="text"
            required
            maxLength={MAX_NAME_LEN}
            defaultValue={loaderData.suggestedName}
            {...stylex.props(styles.input)}
          />
          <button type="submit" {...stylex.props(styles.button)}>
            Create workspace
          </button>
        </Form>

        {actionData?.error && (
          <p {...stylex.props(styles.error)} role="alert">
            {actionData.error}
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
  error: {
    marginTop: spacing.x4,
    marginBottom: 0,
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.body,
    color: colors.danger,
  },
});
