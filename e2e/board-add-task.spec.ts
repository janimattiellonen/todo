import { execSync } from "node:child_process";
import { expect, test } from "@playwright/test";

/**
 * Exercises the add-task affordance end-to-end:
 *   sign in via Flow A → click "+ Add task" on a column → fill the form
 *   → submit → task appears in that column.
 * Plus: empty title submission shows an inline validation error.
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
  return `board-add-${stamp}@example.com`;
}

async function signInAndLandOnBoard(
  page: import("@playwright/test").Page,
  email: string,
) {
  await page.goto("/");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: /send magic link/i }).click();
  await expect(page).toHaveURL(/[?&]status=sent/);

  const magicLink = await pollForMagicLinkUrl(page, email);
  await page.goto(magicLink);
  await expect(page).toHaveURL(/\/setup\/workspace$/);
  await page.getByRole("button", { name: /create workspace/i }).click();
  await expect(page).toHaveURL(/\/board$/);
}

test("can add a task to a column via the form", async ({ page }) => {
  const email = uniqueEmail();
  exec(`INSERT INTO users (email) VALUES ('${email}');`);

  try {
    await signInAndLandOnBoard(page, email);

    const todoColumn = page.getByTestId("board-column").nth(0);
    await expect(todoColumn.getByTestId("board-task")).toHaveCount(0);

    await todoColumn.getByTestId("add-task-toggle").click();
    await todoColumn.getByPlaceholder("Title").fill("Write the changelog");
    await todoColumn
      .getByPlaceholder(/description/i)
      .fill("Cover the new add-task affordance.");
    await todoColumn.getByTestId("add-task-submit").click();

    await expect(todoColumn.getByTestId("board-task")).toHaveCount(1);
    await expect(todoColumn.getByTestId("board-task").first()).toHaveText(
      "Write the changelog",
    );
  } finally {
    exec(`DELETE FROM users WHERE email = '${email}';`);
  }
});

test("empty title submission shows the inline error and does not create a task", async ({
  page,
}) => {
  const email = uniqueEmail();
  exec(`INSERT INTO users (email) VALUES ('${email}');`);

  try {
    await signInAndLandOnBoard(page, email);

    const todoColumn = page.getByTestId("board-column").nth(0);
    await todoColumn.getByTestId("add-task-toggle").click();

    // Bypass HTML5 `required` so we exercise the server-side path.
    await todoColumn.getByPlaceholder("Title").evaluate((el) => {
      (el as HTMLInputElement).removeAttribute("required");
    });

    await todoColumn.getByTestId("add-task-submit").click();

    await expect(todoColumn.getByRole("alert")).toContainText(
      /title is required/i,
    );
    await expect(todoColumn.getByTestId("board-task")).toHaveCount(0);
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
  throw new Error(`Did not see a magic-link email for ${email} within 5s`);
}
