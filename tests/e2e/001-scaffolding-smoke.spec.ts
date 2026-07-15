import { test, expect } from "@playwright/test";

test("home page loads and shows the Sticks title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Sticks/);
});
