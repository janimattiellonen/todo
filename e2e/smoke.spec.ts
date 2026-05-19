import { expect, test } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("New React Router App");
  await expect(
    page.getByRole("link", { name: /react router docs/i }),
  ).toBeVisible();
});

test("StyleX demo component is styled", async ({ page }) => {
  await page.goto("/");

  const card = page.getByTestId("stylex-demo");
  await expect(card).toBeVisible();
  await expect(card).toHaveCSS("background-color", "rgb(250, 250, 250)");
});
