import { expect, test } from "@playwright/test";

test("sign-in page renders", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Sign in/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign in");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /send magic link/i }),
  ).toBeVisible();
});

test("renders the invalid-email error message when ?status=invalid", async ({
  page,
}) => {
  await page.goto("/?status=invalid");

  await expect(page.getByRole("alert")).toContainText(/valid email/i);
});

test("submitting a valid email shows the neutral success message", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByRole("button", { name: /send magic link/i }).click();

  await expect(page).toHaveURL(/[?&]status=sent/);
  await expect(page.getByRole("status")).toContainText(
    /magic link is on its way/i,
  );
});
