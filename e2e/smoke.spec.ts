import { expect, test } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("New React Router App");
  await expect(
    page.getByRole("link", { name: /react router docs/i }),
  ).toBeVisible();
});
