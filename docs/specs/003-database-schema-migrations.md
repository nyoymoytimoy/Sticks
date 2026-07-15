# 003 — Database Schema & Migrations

**Status**: Implemented
**Date**: 2026-07-15

## Problem / Context

Every feature from here on (auth, the 5 ticket workflows, audit trail,
dashboard, reports) needs a real schema to build against. This spec creates
the full table set up front, using a class-table-inheritance shape (one
shared `tickets` core table + one 1:1 extension table per ticket type)
chosen over three alternatives: a single wide nullable table (unmaintainable
as more types are added), five fully independent tables (breaks the shared
audit/dashboard/export queries every later spec needs), and a pure JSONB
blob (loses column-level constraints for known fields).

## Scope

**In scope**: all tables from the plan's data model section — next-auth
adapter tables (`users` extended with `employee_id`/`department`/`is_active`,
`accounts`, `sessions`, `verification_token`), `roles`/`user_roles`,
`ticket_types`/`ticket_statuses`/`tickets`, the four per-type extension
tables (`ticket_db_change_details` shared by Database Fix Request *and* Mass
Request, `ticket_bcp_whitelist_details`, `ticket_incident_report_details`,
`ticket_service_request_details`), the workflow engine tables
(`workflow_assignments`, `approver_delegations`,
`ticket_type_workflow_transitions`), the audit trail (`ticket_audit_log` +
a defense-in-depth trigger), `tags`/`ticket_tags`, and the
comments/watchers/attachments/notifications tables from the industry-pattern
research (internal-vs-public comments, manual watchers, attachments,
write-only notification queue). A `pg` connection pool
(`backend/src/db/pool.ts`) and `node-pg-migrate` wiring.

**Deliberately out of scope** (belongs to later specs, not this one): seeding
specific *user* accounts including Leiva Morente and Rudy Manlapig (spec
004 — Auth & RBAC, since these are fundamentally auth/user-management
concerns and spec 004's own Playwright tests need a full set of role
identities anyway); seeding `workflow_assignments` rows (spec 007, since
that's what actually turns on the Leiva-only DB Fix approval gate) and
`ticket_type_workflow_transitions` rows (specs 007–011, one per ticket
type's own workflow spec). Spec 003 only seeds ticket-type-agnostic lookup
data: `roles` (3 rows), `ticket_types` (5 rows), `ticket_statuses` (the full
shared vocabulary).

## Data model

7 migrations in `backend/migrations/`, in order: next-auth + roles → ticket
lookup + core `tickets` table (with a `ticket_number` trigger formatting
`TCK-<year>-<seq>`, and an `updated_at` trigger) → per-type extension
tables → workflow engine tables → audit log + tags (+ fallback audit
trigger) → comments/watchers/attachments/notifications → seed data.

## API / routes touched

None yet — `backend/src/db/pool.ts` exists (a `pg.Pool` singleton stashed on
`global` to survive Next.js dev-mode hot reloads) but nothing queries it yet;
that starts in spec 006 (Ticket core CRUD).

## UI / components touched

None.

## Role & permission matrix

Not applicable yet (no auth) — though `roles` is seeded with the 3 stored
roles (`approver`, `admin`, `associate`); `requestor` is deliberately not a
row, since it's the implicit floor capability every authenticated user has.

## Acceptance criteria

- [x] All 7 migrations run cleanly against a real Postgres 16 instance
      (a dedicated dev container on port 5433, not port 5432, to avoid
      colliding with another project's Postgres container already running
      locally).
- [x] All 7 down-migrations roll back cleanly to an empty database (verified
      by rolling back all 7, confirming zero tables remained besides
      `pgmigrations`, then re-applying).
- [x] The `ticket_number` and `updated_at` triggers were verified against
      real inserts/updates, not just read from the SQL — `updated_at` was
      confirmed to actually change across separate transactions (it
      correctly does *not* change within a single transaction, since
      Postgres's `now()` is frozen per-transaction; that's expected
      behavior, not a bug).

## Test plan

No Playwright spec for this commit — there's no UI or API surface yet to
drive end-to-end. Verification was done directly against Postgres (see
Acceptance Criteria); this is the same "exercise it for real, don't just
read the code" standard, applied to the tool that fits the layer.

## Open questions / follow-ups

- **`node-pg-migrate`'s SQL up/down marker format**: the tool requires the
  literal comment `-- Up Migration` / `-- Down Migration` (the word
  "Migration" is mandatory) to split a `.sql` file's up and down sections —
  a plain `-- Up` / `-- Down` marker is not recognized, and node-pg-migrate
  silently treats the *entire file* (both sections concatenated) as the "up"
  SQL, which then also runs the down-section's `DROP TABLE` statements
  immediately after creating them, silently undoing the whole migration with
  no error. All 7 migration files were written with the correct marker
  after this was caught by actually running the migrations rather than
  trusting they were correct from reading the SQL.
- **`node-pg-migrate`'s `--envPath` flag is a silent no-op** without the
  optional `dotenv` package installed (it does a soft `tryImport("dotenv")`
  and does nothing if that fails) — `dotenv` was added as a `backend`
  devDependency specifically so `--envPath ../frontend/.env.local` actually
  works.
- Real Postgres connection details for staging/production are still an
  external dependency (dev now runs its own disposable container).
