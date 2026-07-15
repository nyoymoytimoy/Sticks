# 010 — Workflow: Database Fix Request

**Status**: Implemented
**Date**: 2026-07-15

## Problem / Context

This is the spec the entire plan has been building toward: the shared
workflow state-machine engine, and the concrete restriction that only Leiva
Morente can approve a Database Fix Request (and only Rudy Manlapig ever
receives one for execution), enforced data-driven rather than as a
hardcoded name check anywhere in application code.

## Scope

**In scope**: `backend/src/workflows/stateMachine.ts` — one generic
`applyTicketTransition()` used by every ticket type (not five separate
implementations), plus a read-only `getAvailableActions()` that runs the
exact same authorization check to decide which action buttons a viewer
should see. `createTicket()` (spec 006) updated to resolve and set
`approver_id` at creation time for any type with `has_approval_step`, data-
driven via `workflow_assignments` — and to write an initial
`notification_events` row notifying that exclusive approver. A new
migration seeds Database Fix Request's full transition graph (10
transitions covering submit → approve/decline/send-back → in-progress →
done/discussion/decline → reopen) and the two `workflow_assignments` rows
that are the actual mechanism restricting approval to Leiva and execution
to Rudy. `TicketActions`, a Client Component rendering one button per
available action (with an inline note textarea for actions that
`requires_note`), and `applyTicketTransitionAction`, its Server Action.

**Deliberately out of scope**: Mass Request, BCP, Incident Report, and
Service Request don't have their own seeded transitions yet — each gets
its own spec (011–014). `approver_delegations` is checked by the
authorization logic already (an active delegate can act in place of the
exclusive assignee), but no UI exists yet to *create* a delegation — that's
spec 016.

## Data model

`backend/migrations/20260715120009_add-transition-assignment-and-seed-db-fix-workflow.sql`:
adds `ticket_type_workflow_transitions.assigns_to_step` (so a transition
can hand a ticket to whoever holds a different workflow step — approving
hands it to the admin step's holder); seeds the two `workflow_assignments`
rows (Leiva = approver, Rudy = admin, both `is_exclusive`); seeds all 10
transitions for `database_fix_request`.

## API / routes touched

- `frontend/src/app/actions/ticketTransitions.ts` —
  `applyTicketTransitionAction()`, a Server Action returning a plain result
  object (same pattern as spec 006's `createTicketAction`, for the same
  reason: avoids relying on Next's internal redirect-signaling exception).

## UI / components touched

- `frontend/src/components/tickets/ticket-actions.tsx` — renders the
  available actions on a ticket's detail page; actions requiring a note
  expand an inline textarea with a disabled Submit button until text is
  entered.
- `frontend/src/app/(protected)/tickets/[ticketId]/page.tsx` — now fetches
  `getAvailableActions()` alongside the ticket and audit events, and
  renders `TicketActions` above the Details/Activity tabs.

## Role & permission matrix

| Action | Leiva (approver) | Rudy (admin) | Any other approver/admin | Requestor |
|---|---|---|---|---|
| Approve / Decline / Send back (from `pending_approval`) | **yes, exclusively** | no | no | no |
| Start / Complete / Request discussion / Decline (from `approved`/`in_progress`) | no | **yes, exclusively** | no | no |
| Resubmit (from `sent_back`) | no | no | no | yes (own ticket) |
| Reopen (from `done`, within 7 days) | no | yes | no | yes (own ticket) |

The "Any other approver/admin" column is the point of this spec: holding
the `approver` or `admin` role alone is **not** sufficient once an
exclusive `workflow_assignments` row exists for that type+step — verified
directly in the test plan by having Rudy (a real admin) attempt the
approve action and confirming it's neither visible nor invocable.

## Acceptance criteria

- [x] A demo requestor can submit a Database Fix Request and it lands in
      `pending_approval` with `approver_id` already resolved to Leiva.
- [x] Leiva sees and can invoke Approve/Decline/Send back; a real admin
      (Rudy) — who is *not* the exclusive approver — sees neither the
      button nor can invoke the action if attempted directly.
- [x] Approving hands the ticket to Rudy (the exclusive admin), who can
      then move it through in-progress → done.
- [x] Decline requires a note; the Submit button stays disabled until one
      is entered, and the note is recorded in the audit trail.
- [x] `npm run build`, `npx eslint .`, and backend `tsc --noEmit` all pass.

## Test plan

`tests/e2e/010-workflow-database-fix-request.spec.ts` — 3 tests against a
real Postgres instance: the full happy-path lifecycle, the Leiva-only
restriction (checked against both the requestor and a real admin), and the
decline-requires-a-note UI behavior.

## Open questions / follow-ups

- **Real, load-related test flakiness, not a code bug**: running the full
  25-test suite with 8 parallel Playwright workers against a single
  dev-mode Next.js server intermittently failed 2 login tests (bcrypt
  hashing under heavy concurrent load appears to have caused request
  queuing past the default timeout). Both tests passed cleanly every time
  when run in isolation or with reduced worker concurrency (`--workers=3`).
  Not a regression — flagged so a future CI setup either runs against a
  production build (not dev mode) or caps worker concurrency.
- **Real test-infrastructure bug, found and fixed in this spec**:
  `tests/fixtures/db.ts` exports one shared `pg.Pool` singleton, but specs
  005, 006, and this one each independently called `testPool.end()` in
  their own `afterAll`. When Playwright scheduled more than one of those
  files onto the same worker process, whichever file's teardown ran first
  closed the pool out from under every other file still using it
  (`Cannot use a pool after calling end on the pool`). Fixed by removing
  every per-file `.end()` call — the pool now just lives for the test
  process's lifetime, which is fine since the process exits after the run.
- **Real test-isolation bug, found and fixed in this spec**: spec 005's
  audit-trail assertion searched the *entire* admin audit page for the text
  "status change" — but that view is global across every ticket, and any
  other concurrently-running test that creates a ticket (which always
  writes an initial `status_change` audit event) can produce a second
  match, failing Playwright's strict-mode uniqueness check. Fixed by
  scoping the assertion to the specific table row containing that test's
  own seeded ticket number.
- **One assertion in this spec's own first draft was simply wrong**: it
  asserted `getByText("in progress")` had zero matches before clicking the
  "In Progress" button — but that button's own label *is* "In Progress",
  so the assertion could never pass. Removed; it wasn't testing anything
  meaningful.
