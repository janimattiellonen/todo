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
  return `board-reorder-${stamp}@example.com`;
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

test("in-column keyboard reorder via Move up / Move down menu items", async ({
  page,
}) => {
  const email = uniqueEmail();
  exec(`INSERT INTO users (email) VALUES ('${email}');`);

  try {
    await signInAndLandOnBoard(page, email);

    // Create three tasks in "To do": A, B, C (in that order). The
    // add-task form stays open after submit (useState in the component
    // persists across the RR7 revalidation), so we open it once and
    // refill the same input for each title.
    const todo = page.getByTestId("board-column").nth(0);
    await todo.getByTestId("add-task-toggle").click();
    for (const title of ["A", "B", "C"]) {
      const input = todo.getByPlaceholder("Title");
      await input.fill("");
      await input.fill(title);
      await todo.getByTestId("add-task-submit").click();
      await expect(
        todo.getByTestId("board-task").filter({ hasText: title }),
      ).toHaveCount(1);
    }
    await expect(todo.getByTestId("board-task")).toHaveCount(3);
    const initialTitles = await todo.getByTestId("board-task").allInnerTexts();
    expect(initialTitles).toEqual(["A", "B", "C"]);

    // Open B's menu (the middle task). Tasks are clickable so use
    // the menu summary directly — that's the affordance we want to
    // test the keyboard path on.
    const bRow = todo
      .getByTestId("board-task")
      .nth(1)
      .locator("..")
      .locator("..");
    await bRow.getByTestId("move-task-toggle").click();
    await expect(bRow.getByTestId("move-task-popup")).toBeVisible();

    // Click "Move down" → B should be after C.
    await bRow.getByTestId("move-task-down").click();
    // Wait for RR7 to revalidate and the board to reorder.
    await expect(
      page.getByTestId("board-column").nth(0).getByTestId("board-task").first(),
    ).toHaveText("A");
    await expect(
      page.getByTestId("board-column").nth(0).getByTestId("board-task").nth(1),
    ).toHaveText("C");
    const afterDown = await page
      .getByTestId("board-column")
      .nth(0)
      .getByTestId("board-task")
      .allInnerTexts();
    expect(afterDown).toEqual(["A", "C", "B"]);

    // Now open B's menu (it's at the end) and use "Move up" — should
    // become middle again.
    const bRow2 = page
      .getByTestId("board-column")
      .nth(0)
      .getByTestId("board-task")
      .nth(2)
      .locator("..")
      .locator("..");
    await bRow2.getByTestId("move-task-toggle").click();
    await expect(bRow2.getByTestId("move-task-popup")).toBeVisible();
    await bRow2.getByTestId("move-task-up").click();
    // Wait for the DOM to settle to the new order.
    await expect(
      page.getByTestId("board-column").nth(0).getByTestId("board-task").nth(1),
    ).toHaveText("B");
    const afterUp = await page
      .getByTestId("board-column")
      .nth(0)
      .getByTestId("board-task")
      .allInnerTexts();
    expect(afterUp).toEqual(["A", "B", "C"]);

    // Persists across reload.
    await page.reload();
    const final = await page
      .getByTestId("board-column")
      .nth(0)
      .getByTestId("board-task")
      .allInnerTexts();
    expect(final).toEqual(["A", "B", "C"]);
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
