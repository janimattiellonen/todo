import { execSync } from "node:child_process";
import { expect, test } from "@playwright/test";

/**
 * Flow C — task lifecycle (project plan §4 / issue #23):
 *
 *   Signed-in user creates a task, drags it across columns, archives it.
 *
 * Archive lands in Phase 4 (#24+). For now the spec asserts up to the
 * end of the drag step and stubs the archive assertion with a comment.
 * #26 (Phase 4 finalize) will complete this spec.
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
  return `flow-c-${stamp}@example.com`;
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
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) throw new Error("missing bounding box");
  const sx = sourceBox.x + sourceBox.width / 2;
  const sy = sourceBox.y + sourceBox.height / 2;
  const tx = targetBox.x + targetBox.width / 2;
  const ty = targetBox.y + targetBox.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx + 12, sy + 12, { steps: 5 });
  await page.waitForTimeout(50);
  await page.mouse.move(tx, ty, { steps: 20 });
  await page.waitForTimeout(50);
  await page.mouse.up();
  await page.waitForTimeout(100);
}

test("Flow C: sign in → create task → drag across columns → (archive stubbed for Phase 4)", async ({
  page,
}) => {
  const email = uniqueEmail();
  exec(`INSERT INTO users (email) VALUES ('${email}');`);

  try {
    await signInAndLandOnBoard(page, email);

    // Step 1: create a task in "To do".
    const todo = page.getByTestId("board-column").nth(0);
    await todo.getByTestId("add-task-toggle").click();
    await todo.getByPlaceholder("Title").fill("Lifecycle subject");
    await todo.getByTestId("add-task-submit").click();
    await expect(todo.getByTestId("board-task")).toHaveCount(1);

    // Step 2: drag it from To do to Done.
    const source = todo.getByTestId("board-task").first();
    const done = page.getByTestId("board-column").nth(2);
    await dragWithPointer(page, source, done);

    await expect(todo.getByTestId("board-task")).toHaveCount(0);
    await expect(done.getByTestId("board-task")).toHaveCount(1);
    await expect(done.getByTestId("board-task").first()).toHaveText(
      "Lifecycle subject",
    );

    // Persists across reload.
    await page.reload();
    await expect(
      page.getByTestId("board-column").nth(2).getByTestId("board-task"),
    ).toHaveCount(1);

    // Step 3: archive the task.
    //
    // Stubbed for Phase 4 (#24 introduces the `archived` flag on the UI;
    // #26 completes this spec end-to-end). The schema already supports
    // it (tasks.archived defaults to false; #17's loader filters out
    // archived rows). At that point this section will:
    //
    //   await openTaskModal(page, "Lifecycle subject");
    //   await page.getByTestId("archive-task-toggle").click();
    //   await page.getByTestId("archive-task-confirm").click();
    //   await expect(page.getByTestId("board-task")).toHaveCount(0);
    //
    // For now, leave the task in Done — the test passes here and #26
    // will extend it.
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
