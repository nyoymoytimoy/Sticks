import { test, expect } from "@playwright/test";

const PASSWORD = "ChangeMe123!";

test.describe("auth & RBAC", () => {
  test("unauthenticated visitors are redirected to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("wrong password is rejected", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("lmorente@standard-insurance.com");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("Leiva Morente can sign in and sees the Approver-visible Reports page", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("lmorente@standard-insurance.com");
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("Signed in as")).toContainText("Leiva Morente");
    // Approver role -> Reports nav item should be visible (reports is
    // approver/admin-only per canAccessPage).
    await expect(page.getByRole("link", { name: "Reports" })).toBeVisible();
    // Approver is not admin -> no Admin section.
    await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);
  });

  test("the demo requestor (no stored role) does not see Reports or Admin", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("requestor.demo@standard-insurance.com");
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Tickets" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Reports" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);
  });

  test("Rudy Manlapig (admin) sees the Admin > Users nav item", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("rmanlapig@standard-insurance.com");
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
  });

  test("sign out returns to /login and re-protects /dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("rmanlapig@standard-insurance.com");
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
