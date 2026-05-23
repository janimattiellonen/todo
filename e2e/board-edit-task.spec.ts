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
  return `board-edit-${stamp}@example.com`;
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

test("clicking a task opens the edit modal and saving updates it across reload", async ({
  page,
}) => {
  const email = uniqueEmail();
  exec(`INSERT INTO users (email) VALUES ('${email}');`);

  try {
    await signInAndLandOnBoard(page, email);

    // Add a task via the existing form (re-use the create path).
    const todo = page.getByTestId("board-column").nth(0);
    await todo.getByTestId("add-task-toggle").click();
    await todo.getByPlaceholder("Title").fill("Original");
    await todo.getByTestId("add-task-submit").click();
    await expect(todo.getByTestId("board-task")).toHaveCount(1);

    // Open the edit modal.
    await todo.getByTestId("board-task").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(
      "Edit task",
    );

    // Edit title, description, due date; move to "Done".
    await dialog.getByLabel("Title").fill("Renamed");
    await dialog.getByLabel("Description").fill("Filled in via the edit modal");
    await dialog.getByLabel("Column").selectOption({ label: "Done" });
    await dialog.getByLabel("Due date").fill("2026-08-15");

    await dialog.getByTestId("edit-task-submit").click();

    // Modal closes, task appears in Done.
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const done = page.getByTestId("board-column").nth(2);
    await expect(done.getByTestId("board-task")).toHaveCount(1);
    await expect(done.getByTestId("board-task").first()).toHaveText("Renamed");
    await expect(todo.getByTestId("board-task")).toHaveCount(0);

    // Persists across a reload.
    await page.reload();
    const doneAfter = page.getByTestId("board-column").nth(2);
    await expect(doneAfter.getByTestId("board-task").first()).toHaveText(
      "Renamed",
    );
  } finally {
    exec(`DELETE FROM users WHERE email = '${email}';`);
  }
});

test("empty title shows inline error and preserves the user's other edits", async ({
  page,
}) => {
  const email = uniqueEmail();
  exec(`INSERT INTO users (email) VALUES ('${email}');`);

  try {
    await signInAndLandOnBoard(page, email);

    const todo = page.getByTestId("board-column").nth(0);
    await todo.getByTestId("add-task-toggle").click();
    await todo.getByPlaceholder("Title").fill("Initial title");
    await todo.getByTestId("add-task-submit").click();
    await expect(todo.getByTestId("board-task")).toHaveCount(1);

    await todo.getByTestId("board-task").first().click();
    const dialog = page.getByRole("dialog");

    await dialog.getByLabel("Description").fill("Edited description");
    await dialog.getByLabel("Title").fill("");

    // Bypass HTML5 `required` so we hit the server-side validator.
    await dialog.getByLabel("Title").evaluate((el) => {
      (el as HTMLInputElement).removeAttribute("required");
    });

    await dialog.getByTestId("edit-task-submit").click();

    // Modal stays open with the error visible and the description preserved.
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("alert")).toContainText(/title is required/i);
    await expect(
      page.getByRole("dialog").getByLabel("Description"),
    ).toHaveValue("Edited description");
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
