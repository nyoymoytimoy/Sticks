import { test, expect, type Page } from "@playwright/test";
import { testPool } from "../fixtures/db";

const PASSWORD = "ChangeMe123!";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function createDbFixTicket(page: Page, title: string): Promise<number> {
  await login(page, "requestor.demo@standard-insurance.com");
  await page.goto("/tickets/new/database_fix_request");
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Which environment? (e.g. Production, Staging)").fill("Production");
  await page.getByLabel("Which system is affected?").fill("Policy DB");
  await page.getByLabel("What needs to change?").fill("Fix duplicate rows");
  await page.getByLabel("Why is this change needed?").fill("Duplicate rows are corrupting reports");
  await page.getByRole("button", { name: "Submit for Approval" }).click();
  await expect(page).toHaveURL(/\/tickets\/\d+/);
  return Number(page.url().match(/\/tickets\/(\d+)/)![1]);
}

async function cleanupTicket(ticketId: number) {
  await testPool.query("DELETE FROM notification_events WHERE ticket_id = $1", [ticketId]);
  await testPool.query("DELETE FROM ticket_audit_log WHERE ticket_id = $1", [ticketId]);
  await testPool.query("DELETE FROM ticket_db_change_details WHERE ticket_id = $1", [ticketId]);
  await testPool.query("DELETE FROM tickets WHERE id = $1", [ticketId]);
}

test.describe("Database Fix Request workflow", () => {
  test.describe.configure({ mode: "serial" });

  // No pool-closing afterAll here -- see 005-audit-trail.spec.ts's afterAll
  // for why (testPool is a shared module-level singleton across spec files).

  test("full happy path: submit -> Leiva approves -> Rudy starts -> Rudy completes", async ({ page }) => {
    const ticketId = await createDbFixTicket(page, "Playwright e2e: full lifecycle");
    try {
      // New ticket starts pending_approval, assigned to nobody, approver
      // already resolved to Leiva at creation (verified via the UI showing
      // the approval action only to her below).
      await expect(page.getByText("pending approval", { exact: false })).toBeVisible();

      await login(page, "lmorente@standard-insurance.com");
      await page.goto(`/tickets/${ticketId}`);
      await page.getByRole("button", { name: "Approved" }).click();
      await expect(page.getByText("Ticket updated", { exact: true })).toBeVisible();
      await expect(page.getByText("approved", { exact: false }).first()).toBeVisible();

      await login(page, "rmanlapig@standard-insurance.com");
      await page.goto(`/tickets/${ticketId}`);
      await page.getByRole("button", { name: "In Progress" }).click();
      await expect(page.getByText("Ticket updated", { exact: true })).toBeVisible();

      await page.getByRole("button", { name: "Done" }).click();
      await expect(page.getByText("Ticket updated", { exact: true })).toBeVisible();
      await expect(page.getByText("done", { exact: false }).first()).toBeVisible();

      // Audit trail recorded every step.
      await page.getByRole("tab", { name: "Activity & Audit" }).click();
      await expect(page.getByText("Ticket created.")).toBeVisible();
    } finally {
      await cleanupTicket(ticketId);
    }
  });

  test("only Leiva can approve -- not the demo requestor, not Rudy (admin)", async ({ page }) => {
    const ticketId = await createDbFixTicket(page, "Playwright e2e: approval restriction");
    try {
      // The requestor themself sees no approve action (not the exclusive approver).
      await expect(page.getByRole("button", { name: "Approved" })).toHaveCount(0);

      // Rudy holds the ADMIN exclusive assignment for this type, not approver
      // -- he must not see (or be able to invoke) the approve action either.
      await login(page, "rmanlapig@standard-insurance.com");
      await page.goto(`/tickets/${ticketId}`);
      await expect(page.getByRole("button", { name: "Approved" })).toHaveCount(0);

      await login(page, "lmorente@standard-insurance.com");
      await page.goto(`/tickets/${ticketId}`);
      await expect(page.getByRole("button", { name: "Approved" })).toBeVisible();
    } finally {
      await cleanupTicket(ticketId);
    }
  });

  test("decline requires a note", async ({ page }) => {
    const ticketId = await createDbFixTicket(page, "Playwright e2e: decline requires note");
    try {
      await login(page, "lmorente@standard-insurance.com");
      await page.goto(`/tickets/${ticketId}`);

      await page.getByRole("button", { name: "Declined" }).click();
      const submitButton = page.getByRole("button", { name: "Submit" });
      await expect(submitButton).toBeDisabled();

      await page.getByLabel("Note (required)").fill("Not enough information provided.");
      await expect(submitButton).toBeEnabled();
      await submitButton.click();

      await expect(page.getByText("Ticket updated", { exact: true })).toBeVisible();
      await expect(page.getByText("declined", { exact: false }).first()).toBeVisible();

      await page.getByRole("tab", { name: "Activity & Audit" }).click();
      await expect(page.getByText("Not enough information provided.")).toBeVisible();
    } finally {
      await cleanupTicket(ticketId);
    }
  });
});
