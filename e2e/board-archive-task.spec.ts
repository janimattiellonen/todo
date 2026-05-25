import { execSync } from "node:child_process";
import { expect, test } from "@playwright/test";

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
  return `board-archive-${stamp}@example.com`;
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

test("archive removes the task from the board; idempotent at the data level", async ({
  page,
}) => {
  const email = uniqueEmail();
  exec(`INSERT INTO users (email) VALUES ('${email}');`);

  try {
    await signInAndLandOnBoard(page, email);

    const todo = page.getByTestId("board-column").nth(0);
    await todo.getByTestId("add-task-toggle").click();
    await todo.getByPlaceholder("Title").fill("Archive me");
    await todo.getByTestId("add-task-submit").click();
    await expect(todo.getByTestId("board-task")).toHaveCount(1);

    // Open the edit modal and click Archive.
    await todo.getByTestId("board-task").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByTestId("archive-task-button").click();

    // Modal closes; task gone from board.
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(todo.getByTestId("board-task")).toHaveCount(0);

    // Persists across reload.
    await page.reload();
    await expect(
      page.getByTestId("board-column").nth(0).getByTestId("board-task"),
    ).toHaveCount(0);
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
