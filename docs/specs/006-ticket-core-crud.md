# 006 — Ticket Core CRUD

**Status**: Implemented
**Date**: 2026-07-15

## Problem / Context

The 5 ticket-type workflows (specs 007–011) each need a working
create/list/detail shell to attach their approval logic to. This spec builds
that shell for all 5 types now — real, working create forms with the full
field set each type actually needs (not stubs) — and deliberately stops
short of any status *transition* logic (approve/decline/assign buttons),
which is specs 007–011's job.

## Scope

**In scope**: `createTicket()` (one generic function, not five — inserts the
core `tickets` row + the correct extension-table row + an initial
`ticket_created` audit event, all in one transaction), Zod validation
schemas per type, `listTicketsForViewer()` (role-scoped: a plain requestor
sees only their own tickets; approver/admin/associate see all — matches the
plan's RBAC table), `getTicketById()`, the type-picker page, 5 working
create-form pages (Database Fix Request and Mass Request share one form
component, since their fields are identical), the tickets list page, and a
ticket detail page (Details + Activity & Audit tabs — reuses `AuditTimeline`
from spec 002 and `getAuditEventsForTicket()` from spec 005).

**Deliberately out of scope**: no status-transition buttons anywhere yet —
every ticket is created and then just... sits in its initial status. That's
correct: transitions, role-gated action buttons, and the Leiva/Rudy
exclusive-approval gate are specs 007–011's job, one per ticket type.
Comments/attachments tabs are spec 012.

## Data model

No new migration. Initial status per type (encoded in
`INITIAL_STATUS_BY_TYPE` in `backend/src/db/queries/tickets.ts`): Database
Fix Request / Mass Request → `pending_approval`; BCP Whitelisting / Service
Request → `assigned` (no approval step; Service Request's assignee is
chosen by the requestor at creation); Incident Report → `new`.

## API / routes touched

- `frontend/src/app/actions/tickets.ts` — `createTicketAction()`, a Server
  Action. Returns a plain `{ ok, ... }` result object rather than calling
  `redirect()` itself (see Open Questions).

## UI / components touched

- `frontend/src/app/(protected)/tickets/{page.tsx,new/*,[ticketId]/page.tsx}`
- `frontend/src/components/tickets/{form-fields,tickets-data-table,
  db-change-create-form,bcp-create-form,incident-report-create-form}.tsx`
- **New package boundary**: `backend/src/client.ts` (exported as
  `backend/client` via `package.json`'s `exports` map) — a client-safe
  subset of `backend`'s API. See Open Questions for why this exists.

## Role & permission matrix

| Action | requestor | approver | admin | associate |
|---|---|---|---|---|
| Create any ticket type | yes | yes | yes | yes |
| View own tickets | yes | yes | yes | yes |
| View all tickets | no | yes | yes | yes |
| View ticket detail (not own, not privileged) | redirected to `/tickets` | — | — | — |

## Acceptance criteria

- [x] A requestor can create a Service Request end-to-end (form → DB rows
      → redirect to detail page → visible in their ticket list → audit
      event recorded), verified against a real Postgres instance, not mocked.
- [x] A privileged user (approver) can see a ticket they didn't create; a
      second plain requestor cannot (verified in spec 007+ once two
      non-privileged demo accounts exist — today's test uses the approver
      to verify the *privileged* branch, since only one requestor account
      is seeded).
- [x] All 5 create-form pages render without console errors.
- [x] `npm run build`, `npx eslint .`, and backend `tsc --noEmit` all pass.

## Test plan

`tests/e2e/006-ticket-core-crud.spec.ts` — full create-to-detail-to-audit
round trip for Service Request against a real Postgres instance (cleaned up
in `afterAll`), a cross-user visibility check, and a render-smoke test for
the other 4 create forms.

## Open questions / follow-ups

- **Real architectural bug, caught by actually building, not just writing
  code**: the first implementation had client-side create-form components
  import Zod schemas directly from the main `backend` package. That barrel
  also re-exports `db/pool.ts` (which imports the real `pg` driver), and
  Next.js's bundler pulls a module's *entire* graph into the client bundle
  for any import from it — even a type-only one mixed into the same import
  statement as a value import — which dragged `pg` into the browser bundle
  and failed on Node builtins (`net`, `tls`, `util/types`) the browser
  doesn't have. Fixed by splitting `backend` into two entry points: the main
  one (server-only: db access, `pool`, queries) and `backend/client` (pure,
  dependency-free: Zod schemas, plain types) — Client Components must import
  from `backend/client`, never the main barrel. This is a permanent
  architectural rule for every future spec, not a one-off fix.
- **Real type-system bug**: `zod`'s `.default()` (and, it turns out,
  `.transform()`) makes a schema's input type and output type diverge,
  which conflicts with `react-hook-form`'s `useForm<T>` generic (it wants
  one consistent type for a field). Fixed by keeping `priority` a plain
  required enum (letting each form's `defaultValues` supply the default)
  and, for the empty-string-date bug below, normalizing outside the schema
  instead of inside it.
- **Real data bug, caught only by running the test against a real database,
  not by type-checking**: an empty HTML `<input type="date">` submits `""`,
  not `undefined`. `.optional()` doesn't catch `""`, so it reached Postgres
  as a literal empty string for a `DATE` column and threw
  `invalid input syntax for type date`. The server action's generic
  `catch` block silently swallowed this until a `console.error` was added
  and the *actual* Postgres error was read from the dev server's log — the
  UI's generic "something went wrong" message alone didn't say what broke.
  Fixed with `stripEmptyStrings()`, called on raw form data before
  `.safeParse()`.
- **Playwright test infra**: `playwright.config.ts` now supports a
  `PLAYWRIGHT_BASE_URL` env var. Next.js 16's dev-server lockfile blocks a
  second `next dev` on the same project *regardless of port*, so if a dev
  server is already running (e.g. someone browsing the app manually),
  Playwright's own `webServer` can no longer just pick a different port —
  it has to either reuse what's there or not spawn anything at all. Setting
  `PLAYWRIGHT_BASE_URL` skips spawning entirely and points tests at
  whatever's already running.
