import { execSync } from "node:child_process";
import { expect, test } from "@playwright/test";

/**
 * Verifies the /board loader's tasks-per-column path end-to-end:
 *   1. seed a user + workspace + columns + tasks via psql
 *   2. sign in via the magic-link flow (#13 + #14)
 *   3. land on /board, assert tasks render in the right columns,
 *      archived tasks excluded, position order respected
 */

function exec(sql: string): string {
  return execSync(
    `docker compose exec -T postgres psql -U todo -d todo -tA -c "${sql}"`,
    { stdio: ["pipe", "pipe", "pipe"] },
  )
    .toString()
    .trim();
}

function uniqueEmail(): string {
  const stamp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `board-tasks-${stamp}@example.com`;
}

test("board renders seeded tasks in their columns, archived excluded, in position order", async ({
  page,
}) => {
  const email = uniqueEmail();
  exec(`INSERT INTO users (email) VALUES ('${email}');`);

  try {
    // Step 1: sign in via the existing flow so we get a real session.
    await page.goto("/");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: /send magic link/i }).click();
    await expect(page).toHaveURL(/[?&]status=sent/);

    const magicLink = await pollForMagicLinkUrl(page, email);
    await page.goto(magicLink);
    await expect(page).toHaveURL(/\/setup\/workspace$/);
    await page.getByRole("button", { name: /create workspace/i }).click();
    await expect(page).toHaveURL(/\/board$/);

    // Step 2: seed tasks into the just-created workspace. Use distinct
    // positions so an out-of-order ORDER BY would surface.
    const wsId = exec(
      `SELECT w.id FROM workspaces w JOIN workspace_members m ON m.workspace_id = w.id JOIN users u ON u.id = m.user_id WHERE u.email = '${email}';`,
    );
    const todoColId = exec(
      `SELECT id FROM columns WHERE workspace_id = '${wsId}' AND name = 'To do';`,
    );
    const inProgressColId = exec(
      `SELECT id FROM columns WHERE workspace_id = '${wsId}' AND name = 'In progress';`,
    );
    exec(
      `INSERT INTO tasks (workspace_id, column_id, title, position) VALUES ('${wsId}', '${todoColId}', 'Write spec', 2048), ('${wsId}', '${todoColId}', 'Review PR', 1024), ('${wsId}', '${inProgressColId}', 'Ship 17', 1024);`,
    );
    exec(
      `INSERT INTO tasks (workspace_id, column_id, title, archived, position) VALUES ('${wsId}', '${todoColId}', 'NOT SHOWN', true, 3072);`,
    );

    // Step 3: reload /board and assert.
    await page.goto("/board");

    const columns = page.getByTestId("board-column");
    await expect(columns).toHaveCount(3);

    const todoTasks = columns.nth(0).getByTestId("board-task");
    await expect(todoTasks).toHaveCount(2);
    // Position-ordered: Review PR (1024) before Write spec (2048).
    await expect(todoTasks.nth(0)).toHaveText("Review PR");
    await expect(todoTasks.nth(1)).toHaveText("Write spec");

    const inProgressTasks = columns.nth(1).getByTestId("board-task");
    await expect(inProgressTasks).toHaveCount(1);
    await expect(inProgressTasks.nth(0)).toHaveText("Ship 17");

    const doneTasks = columns.nth(2).getByTestId("board-task");
    await expect(doneTasks).toHaveCount(0);

    // Archived task is excluded — it must not appear anywhere.
    await expect(page.getByText("NOT SHOWN")).toHaveCount(0);
  } finally {
    exec(`DELETE FROM users WHERE email = '${email}';`);
  }
});

async function pollForMagicLinkUrl(
  page: import("@playwright/test").Page,
  email: string,
): Promise<string> {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const response = await page.request.get("/test/__mock-emails");
    if (response.ok()) {
      const body = (await response.json()) as {
        messages: { to: string; body: string }[];
      };
      const match = [...body.messages].reverse().find((m) => m.to === email);
      const link = match?.body.match(/https?:\/\/[^\s"'<>]+/);
      if (link) return link[0];
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(
    `Did not see a magic-link email for ${email} within 5s — is the dev server running with EMAIL_TRANSPORT=mock?`,
  );
}
