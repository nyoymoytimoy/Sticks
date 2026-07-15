import { test, expect } from "@playwright/test";
import { testPool } from "../fixtures/db";

const PASSWORD = "ChangeMe123!";
let seededTicketId: number;
let seededTicketNumber: string;

test.describe("audit trail", () => {
  // Forces this file's tests onto a single worker. With the default
  // fullyParallel mode, Playwright runs beforeAll once PER WORKER, not once
  // per file -- distributing these 3 tests across 3 workers silently
  // triple-inserted the fixture ticket, which broke the "status change"
  // text assertion (it matched 3 rows instead of 1) once actually run.
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    const requestor = await testPool.query(
      "SELECT id FROM users WHERE email = 'requestor.demo@standard-insurance.com'"
    );
    const ticketType = await testPool.query(
      "SELECT id FROM ticket_types WHERE code = 'service_request'"
    );
    const status = await testPool.query("SELECT id FROM ticket_statuses WHERE code = 'new'");

    const ticket = await testPool.query(
      `INSERT INTO tickets (ticket_type_id, status_id, title, requestor_id)
       VALUES ($1, $2, $3, $4) RETURNING id, ticket_number`,
      [
        ticketType.rows[0].id,
        status.rows[0].id,
        "Audit trail e2e fixture ticket",
        requestor.rows[0].id,
      ]
    );
    seededTicketId = ticket.rows[0].id;
    seededTicketNumber = ticket.rows[0].ticket_number;

    // Mirrors exactly what recordAuditEvent() writes -- verifies the shape
    // the UI reads is the same shape the write-path produces.
    await testPool.query(
      `INSERT INTO ticket_audit_log
         (ticket_id, event_type, actor_user_id, from_value, to_value, note)
       VALUES ($1, 'status_change', $2, 'new', 'in_progress', 'e2e fixture audit note')`,
      [seededTicketId, requestor.rows[0].id]
    );
  });

  test.afterAll(async () => {
    await testPool.query("DELETE FROM ticket_audit_log WHERE ticket_id = $1", [seededTicketId]);
    await testPool.query("DELETE FROM tickets WHERE id = $1", [seededTicketId]);
    await testPool.end();
  });

  test("admin (Rudy) sees the seeded audit event in the global audit view", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("rmanlapig@standard-insurance.com");
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole("link", { name: "Audit" }).click();
    await expect(page).toHaveURL(/\/admin\/audit/);

    await expect(page.getByText(seededTicketNumber)).toBeVisible();
    await expect(page.getByText("status change")).toBeVisible();
    await expect(page.getByText("new → in_progress")).toBeVisible();
    await expect(page.getByText("e2e fixture audit note")).toBeVisible();
  });

  test("filtering to a non-matching search shows the empty state", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("rmanlapig@standard-insurance.com");
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto("/admin/audit");

    await page.getByPlaceholder("Search…").fill("no-such-ticket-number-xyz");
    await expect(page.getByText("No audit events yet")).toBeVisible();
  });

  test("a non-admin (Leiva, approver) is redirected away from /admin/audit", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("lmorente@standard-insurance.com");
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await expect(page.getByRole("link", { name: "Audit" })).toHaveCount(0);

    await page.goto("/admin/audit");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
