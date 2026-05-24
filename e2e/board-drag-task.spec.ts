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
  return `board-drag-${stamp}@example.com`;
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

async function dragWithPointer(
  page: import("@playwright/test").Page,
  source: import("@playwright/test").Locator,
  target: import("@playwright/test").Locator,
) {
  // dnd-kit's PointerSensor needs a real sequence of pointer events with
  // movement past the activation distance (8px). Playwright's .dragTo()
  // uses HTML5 drag events which dnd-kit ignores. Drive pointer events
  // manually.
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) throw new Error("missing bounding box");

  const sx = sourceBox.x + sourceBox.width / 2;
  const sy = sourceBox.y + sourceBox.height / 2;
  const tx = targetBox.x + targetBox.width / 2;
  const ty = targetBox.y + targetBox.height / 2;

  await page.mouse.move(sx, sy);
  await page.mouse.down();
  // First nudge past the 8px activation threshold.
  await page.mouse.move(sx + 12, sy + 12, { steps: 5 });
  // Wait one frame so dnd-kit sees the pointer movement and starts the drag.
  await page.waitForTimeout(50);
  // Then towards the target in several steps so dnd-kit can react.
  await page.mouse.move(tx, ty, { steps: 20 });
  await page.waitForTimeout(50);
  await page.mouse.up();
  // After up, let RR7 fetch the updated loader.
  await page.waitForTimeout(100);
}

test("drag a task from To do to Done — persists across reload", async ({
  page,
}) => {
  const email = uniqueEmail();
  exec(`INSERT INTO users (email) VALUES ('${email}');`);

  try {
    await signInAndLandOnBoard(page, email);

    // Seed one task in "To do".
    const todo = page.getByTestId("board-column").nth(0);
    await todo.getByTestId("add-task-toggle").click();
    await todo.getByPlaceholder("Title").fill("Moving");
    await todo.getByTestId("add-task-submit").click();
    await expect(todo.getByTestId("board-task")).toHaveCount(1);

    const source = todo.getByTestId("board-task").first();
    const done = page.getByTestId("board-column").nth(2);

    await dragWithPointer(page, source, done);

    // The task should have moved out of To do and into Done.
    await expect(
      page.getByTestId("board-column").nth(0).getByTestId("board-task"),
    ).toHaveCount(0);
    await expect(
      page.getByTestId("board-column").nth(2).getByTestId("board-task"),
    ).toHaveCount(1);
    await expect(
      page.getByTestId("board-column").nth(2).getByTestId("board-task").first(),
    ).toHaveText("Moving");

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

test("a click without a drag distance opens the edit modal (no accidental move)", async ({
  page,
}) => {
  const email = uniqueEmail();
  exec(`INSERT INTO users (email) VALUES ('${email}');`);

  try {
    await signInAndLandOnBoard(page, email);

    const todo = page.getByTestId("board-column").nth(0);
    await todo.getByTestId("add-task-toggle").click();
    await todo.getByPlaceholder("Title").fill("Click me");
    await todo.getByTestId("add-task-submit").click();
    await expect(todo.getByTestId("board-task")).toHaveCount(1);

    // Plain click — pointer doesn't move past the 8px activation
    // distance, so it should open the edit modal, NOT initiate a drag.
    await todo.getByTestId("board-task").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(
      "Edit task",
    );

    // Task is still in its original column.
    await expect(todo.getByTestId("board-task")).toHaveCount(1);
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
