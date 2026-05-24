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
  return `board-kb-${stamp}@example.com`;
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

test("keyboard alone: open Move-to menu, pick Done, task moves and persists", async ({
  page,
}) => {
  const email = uniqueEmail();
  exec(`INSERT INTO users (email) VALUES ('${email}');`);

  try {
    await signInAndLandOnBoard(page, email);

    // Add a task to "To do".
    const todo = page.getByTestId("board-column").nth(0);
    await todo.getByTestId("add-task-toggle").click();
    await todo.getByPlaceholder("Title").fill("Keyboard moved");
    await todo.getByTestId("add-task-submit").click();
    await expect(todo.getByTestId("board-task")).toHaveCount(1);

    // Keyboard interaction:
    //   1. Focus the move-task summary directly (simulates having Tab'd to it).
    //   2. Press Enter to expand the <details> menu.
    //   3. The first menu item ("In progress") receives focus via Tab.
    //   4. Press ArrowDown / Tab to navigate, then Enter to submit "Done".
    const summary = todo.getByTestId("move-task-toggle");
    await summary.focus();
    await page.keyboard.press("Enter");

    // The popup is visible.
    await expect(todo.getByTestId("move-task-popup")).toBeVisible();

    // Tab through the menu items: first to "In progress", second to "Done".
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");

    // The task should have moved out of To do and into Done.
    await expect(
      page.getByTestId("board-column").nth(0).getByTestId("board-task"),
    ).toHaveCount(0);
    const done = page.getByTestId("board-column").nth(2);
    await expect(done.getByTestId("board-task")).toHaveCount(1);
    await expect(done.getByTestId("board-task").first()).toHaveText(
      "Keyboard moved",
    );

    // Persists across reload.
    await page.reload();
    await expect(
      page.getByTestId("board-column").nth(0).getByTestId("board-task"),
    ).toHaveCount(0);
    await expect(
      page.getByTestId("board-column").nth(2).getByTestId("board-task"),
    ).toHaveCount(1);
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
