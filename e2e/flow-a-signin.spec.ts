import { execSync } from "node:child_process";
import { expect, test } from "@playwright/test";

/**
 * Flow A — end-to-end sign-in (project plan §4 / issue #15):
 *
 *   1. Visit /  → submit email
 *   2. Read the magic-link URL from the dev mock transport
 *   3. Visit the link  → workspace setup (first-time) or /board (existing)
 *   4. Confirm three default columns render
 *
 * The dev server runs against `.env` (dev DB). To keep these tests
 * hermetic from the user's local dev data, each run uses a fresh unique
 * email and cleans up the row afterwards. The mock transport is the
 * default in `.env.example`; `MOCK_EMAIL_LOG_PATH` is not used — instead
 * the test endpoint at /test/__mock-emails serves the captured messages.
 */

function uniqueEmail(): string {
  const stamp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `flow-a-${stamp}@example.com`;
}

function seedUser(email: string): void {
  execSync(
    `docker compose exec -T postgres psql -U todo -d todo -c "INSERT INTO users (email) VALUES ('${email}');"`,
    { stdio: "pipe" },
  );
}

function deleteUser(email: string): void {
  execSync(
    `docker compose exec -T postgres psql -U todo -d todo -c "DELETE FROM users WHERE email = '${email}';"`,
    { stdio: "pipe" },
  );
}

test("Flow A — sign in, create workspace, see three default columns", async ({
  page,
}) => {
  const email = uniqueEmail();
  seedUser(email);

  try {
    // Step 1: visit / and submit the email.
    await page.goto("/");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: /send magic link/i }).click();

    // Page redirects to /?status=sent with neutral confirmation.
    await expect(page).toHaveURL(/[?&]status=sent/);
    await expect(page.getByRole("status")).toContainText(
      /magic link is on its way/i,
    );

    // Step 2: poll the test endpoint for the captured magic-link URL.
    // The dispatch is fire-and-forget so we may need a few attempts.
    const magicLinkUrl = await pollForMagicLinkUrl(page, email);

    // Step 3: visit the magic link.
    await page.goto(magicLinkUrl);

    // First-time user → workspace setup.
    await expect(page).toHaveURL(/\/setup\/workspace$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Create your workspace",
    );

    // Default name is pre-filled with the email's localpart.
    const localpart = email.split("@")[0] ?? "";
    await expect(page.getByLabel("Workspace name")).toHaveValue(
      `${localpart}'s workspace`,
    );

    await page.getByRole("button", { name: /create workspace/i }).click();

    // Step 4: board page renders with three default columns in order.
    await expect(page).toHaveURL(/\/board$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      `${localpart}'s workspace`,
    );
    const columns = page.getByTestId("board-column");
    await expect(columns).toHaveCount(3);
    await expect(columns.nth(0).getByRole("heading")).toHaveText("To do");
    await expect(columns.nth(1).getByRole("heading")).toHaveText("In progress");
    await expect(columns.nth(2).getByRole("heading")).toHaveText("Done");

    // Sign out — back to /.
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign in");
  } finally {
    // Cleanup: row + cascade removes sessions and any workspaces/columns.
    deleteUser(email);
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
