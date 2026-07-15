import { test, expect } from "@playwright/test";

const PASSWORD = "ChangeMe123!";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("UI overhaul", () => {
  test("modernized login screen shows the branding panel and still signs in", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByText(/built for how Standard/)).toBeVisible();

    // Login itself still works with the same accessible labels the rest of
    // the suite depends on.
    await page.getByLabel("Email").fill("requestor.demo@standard-insurance.com");
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("login screen collapses the branding panel on a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 500, height: 800 });
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByText(/built for how Standard/)).toBeHidden();
  });

  test("top bar search navigates to Tickets and pre-filters the list", async ({ page }) => {
    await login(page, "lmorente@standard-insurance.com");

    await page.getByPlaceholder("Search tickets…").fill("no-such-ticket-xyz");
    await page.getByPlaceholder("Search tickets…").press("Enter");

    await expect(page).toHaveURL(/\/tickets\?q=no-such-ticket-xyz/);
    await expect(page.getByText("No tickets yet")).toBeVisible();
  });

  test("breadcrumb on the new-ticket picker links back to Tickets", async ({ page }) => {
    await login(page, "lmorente@standard-insurance.com");
    await page.goto("/tickets/new");

    const crumb = page.getByRole("main").getByRole("link", { name: "Tickets" });
    await expect(crumb).toBeVisible();
    await crumb.click();
    await expect(page).toHaveURL(/\/tickets$/);
  });
});
