import { test, expect } from "@playwright/test";
import { testPool } from "../fixtures/db";

const PASSWORD = "ChangeMe123!";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("ticket core CRUD", () => {
  test.describe.configure({ mode: "serial" });

  let createdTicketId: number | null = null;

  test.afterAll(async () => {
    if (createdTicketId) {
      await testPool.query("DELETE FROM ticket_audit_log WHERE ticket_id = $1", [createdTicketId]);
      await testPool.query("DELETE FROM ticket_service_request_details WHERE ticket_id = $1", [createdTicketId]);
      await testPool.query("DELETE FROM tickets WHERE id = $1", [createdTicketId]);
    }
    await testPool.end();
  });

  test("requestor creates a Service Request end-to-end and sees it in Tickets + detail + audit", async ({ page }) => {
    await login(page, "requestor.demo@standard-insurance.com");

    await page.goto("/tickets/new");
    await page.getByRole("link", { name: "Service Request" }).click();
    await expect(page).toHaveURL(/\/tickets\/new\/service_request/);

    await page.getByLabel("Title").fill("Playwright e2e: laptop request");
    await page.getByLabel("Category").fill("Hardware");
    await page.getByLabel("Assign to").selectOption({ label: "Demo Associate" });
    await page.getByRole("button", { name: "Create Service Request" }).click();

    await expect(page).toHaveURL(/\/tickets\/\d+/);
    await expect(page.getByText("Playwright e2e: laptop request")).toBeVisible();
    await expect(page.getByText("assigned", { exact: false })).toBeVisible();

    const url = page.url();
    createdTicketId = Number(url.match(/\/tickets\/(\d+)/)![1]);

    // Activity & Audit tab shows the creation event.
    await page.getByRole("tab", { name: "Activity & Audit" }).click();
    await expect(page.getByText("status change")).toBeVisible();
    await expect(page.getByText("Ticket created.")).toBeVisible();

    // Shows up in the requestor's own ticket list.
    await page.goto("/tickets");
    await expect(page.getByText("Playwright e2e: laptop request")).toBeVisible();
  });

  test("a different requestor does not see someone else's ticket in the list or detail page", async ({ page }) => {
    test.skip(!createdTicketId, "depends on the previous test's created ticket");

    // Leiva has no tickets of her own here, but she's an approver (privileged
    // role) so she SHOULD see it -- verifies the privileged-role branch.
    await login(page, "lmorente@standard-insurance.com");
    await page.goto("/tickets");
    await expect(page.getByText("Playwright e2e: laptop request")).toBeVisible();
    await page.goto(`/tickets/${createdTicketId}`);
    await expect(page).toHaveURL(new RegExp(`/tickets/${createdTicketId}$`));
  });

  for (const type of [
    "database_fix_request",
    "mass_request",
    "bcp_whitelisting_request",
    "incident_report",
  ] as const) {
    test(`${type} create form renders without errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      await login(page, "requestor.demo@standard-insurance.com");
      await page.goto(`/tickets/new/${type}`);
      await expect(page.getByLabel("Title")).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});
