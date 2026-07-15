# 005 — Audit Trail

**Status**: Implemented
**Date**: 2026-07-15

## Problem / Context

Every ticket-type workflow (specs 007–011) needs a single, shared way to
record "who changed what, when" — built once here so those specs call into
it rather than each reimplementing logging. This lands before ticket CRUD
(006) deliberately: 006's create/update actions will call `recordAuditEvent()`
directly, so the primitive needs to exist first.

## Scope

**In scope**: `recordAuditEvent()` (writes one `ticket_audit_log` row, accepts
an optional `pg` client/transaction so callers can compose it inside their
own transaction — critical for spec 007+, where the audit write and the
status change it records must commit or roll back together), `backend`'s
audit query functions (`getRecentAuditEvents`, `getAuditEventsForTicket`),
and an Admin-only global audit view (`/admin/audit`) using the `DataTable`
+ filter row from spec 002.

**Deliberately out of scope**: there's no ticket CRUD yet (spec 006), so the
per-ticket "Activity & Audit" tab on a ticket's detail page isn't built here
— it reuses `getAuditEventsForTicket()` and the `AuditTimeline` component
(already built in spec 002) once ticket detail pages exist.

## Data model

No new migration — `ticket_audit_log` and its defense-in-depth trigger
already exist from spec 003. This spec is pure application code.

## API / routes touched

None new (`getRecentAuditEvents`/`recordAuditEvent` are plain functions, not
routes) — `/admin/audit` is a Server Component page, not a route handler.

## UI / components touched

- `frontend/src/app/(protected)/admin/audit/page.tsx` — server-fetches
  `getRecentAuditEvents()`, redirects to `/dashboard` if the session lacks
  the `adminAudit` page grant (defense in depth alongside `proxy.ts`, which
  only checks "is authenticated," not role).
- `frontend/src/app/(protected)/admin/audit/audit-data-table.tsx` — a thin
  Client Component wrapper defining `DataTable`'s columns. This split exists
  for the same reason spec 004's icon fix did: column `render` functions are
  JSX-returning closures, and closures can't be passed as props from a
  Server Component into a Client Component — they have to be defined inside
  the Client Component itself.
- `backend/src/rbac/can.ts` gained a new `adminAudit` page key (admin-only,
  same grant as `adminUsers` but tracked separately since they're
  conceptually different admin capabilities).
- Sidebar gained an "Audit" nav item (admin-only) and a new `audit` icon.

## Role & permission matrix

Same as spec 004's table, plus: Admin > Audit is admin-only (same as
Admin > Users).

## Acceptance criteria

- [x] `recordAuditEvent()`'s exact INSERT shape was verified against a real
      row read back through `getRecentAuditEvents()` and rendered in the
      actual UI (see Test plan) — not just type-checked.
- [x] Non-admin users (verified with Leiva, an approver) are redirected away
      from `/admin/audit` and don't see the nav item.
- [x] The empty state renders correctly when a filter matches nothing.
- [x] `npm run build`, `npx eslint .`, and backend `tsc --noEmit` all pass.

## Test plan

`tests/e2e/005-audit-trail.spec.ts` — seeds one real ticket + one real audit
row directly via `pg` (`tests/fixtures/db.ts`, a small pool pointed at the
same dev database, loading `frontend/.env.local`) in a `beforeAll`, verifies
it renders correctly in `/admin/audit` as Rudy (admin), verifies filtering
to a non-match shows the empty state, verifies Leiva (approver) is
redirected away, then cleans up in `afterAll`.

## Open questions / follow-ups

- **Real test-isolation bug caught by actually running the suite twice**:
  the first run failed two different ways. First, `beforeAll` ran three
  times because Playwright's default `fullyParallel` mode distributes a
  file's tests across multiple workers, and `beforeAll` runs once **per
  worker**, not once per file — this silently triple-inserted the fixture
  ticket, and "status change" then matched 3 rows instead of 1. Fixed with
  `test.describe.configure({ mode: "serial" })`. Second, one test navigated
  straight to `/admin/audit` after clicking "Sign in" without waiting for
  the redirect to `/dashboard` first, racing the session cookie being set;
  fixed by awaiting the redirect like every other test in the suite already
  does. Neither bug was visible from reading the code — both only showed up
  from running the tests, twice, and reading the actual failures.
