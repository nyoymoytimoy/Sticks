import { test, expect } from "@playwright/test";

test.describe("design system style guide", () => {
  test("renders every base component without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/style-guide");

    await expect(page.getByRole("heading", { name: /style guide/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Primary" })).toBeVisible();
    await expect(page.getByText("pending approval").first()).toBeVisible();
    await expect(page.getByPlaceholder("Search…")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("toast appears after triggering an action", async ({ page }) => {
    await page.goto("/style-guide");
    await page.getByRole("button", { name: "Trigger toast" }).click();
    await expect(page.getByText("Ticket updated", { exact: true })).toBeVisible();
  });

  test("data table search filters rows", async ({ page }) => {
    await page.goto("/style-guide");
    await page.getByPlaceholder("Search…").fill("Incident");
    await expect(page.getByText("Portal outage this morning")).toBeVisible();
    await expect(page.getByText("Fix duplicate policy rows")).toHaveCount(0);
  });
});
