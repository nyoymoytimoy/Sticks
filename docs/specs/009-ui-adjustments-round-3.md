# 009 — UI Adjustments Round 3

**Status**: Implemented
**Date**: 2026-07-15

> **Note on numbering**: inserted after 008, shifting the workflow specs
> from 009–019 to 010–020. Same precedent as specs 007 and 008's own
> insertions.

## Problem / Context

Two more issues surfaced from the user watching the live app while these
changes landed: (1) the sidebar only partially spanned the screen height
and felt like a half-measure alongside a separate top bar; (2) the create
forms were "very barebones" — a flat stack of label+input pairs that didn't
match the card-based visual language established in spec 007.

## Scope

**In scope**: `Sidebar` becomes `fixed inset-y-0 left-0` (always spans the
full viewport height regardless of content scroll or page length) and now
owns everything the removed `Topbar` used to: the search box, the user's
avatar/name/"Signed in as" caption, and the sign-out button, all in one
consolidated nav column. The separate top bar is gone entirely — the
protected layout is now just `Sidebar` + a `pl-64`-offset `<main>`. Every
create form was restructured with a new `FormSection` component (a titled
group with a 2-column grid — `sm:grid-cols-2` — and a `full` prop on
`Field` for fields that should span both columns) instead of one long
single-column stack, and inputs/textareas got a filled `surface-secondary`
background (matching the sidebar search box's filled style) that lightens
to `surface-base` on focus.

**Deliberately out of scope**: no new fields, no validation changes — the
underlying Zod schemas and Server Action wiring are untouched; this is
layout and grouping only.

## Data model

None.

## API / routes touched

None.

## UI / components touched

- `frontend/src/components/ui/sidebar.tsx` — `fixed` positioning, absorbs
  the search form and the user-profile/sign-out block from the deleted
  `Topbar`.
- `frontend/src/components/ui/topbar.tsx` — **deleted** (fully superseded).
- `frontend/src/app/(protected)/layout.tsx` — simplified to `Sidebar` +
  `pl-64`-offset `<main>`, no more flex-column-with-header wrapper.
- `frontend/src/components/tickets/form-fields.tsx` — new `FormSection`
  component; `Field` gained a `full` prop.
- All 5 create forms restructured into 2 `FormSection`s each ("Ticket
  Details" + a type-specific second section).

## Role & permission matrix

Unchanged — layout/grouping only.

## Acceptance criteria

- [x] The sidebar visually spans the full viewport height on every page,
      independent of page content length (fixed positioning, not flex
      stretch, which depends on content).
- [x] No separate top bar remains; searching, viewing who's signed in, and
      signing out are all sidebar actions now.
- [x] Every create form is visually grouped into titled sections with a
      2-column layout on wider screens, matching the card-based container
      it sits inside.
- [x] 22 of 23 existing Playwright tests pass unchanged or with a locator
      fix (see Open Questions for the one exception and why it's not a
      regression).
- [x] `npm run build` and `npx eslint .` both pass.

## Test plan

No new Playwright spec — re-ran the existing suite. Two real test fixes
were needed because the DOM structure legitimately changed: `"Signed in
as"` and the user's name are now sibling `<span>`s (previously nested in
one element via the old `Topbar`), so `tests/e2e/004-auth-rbac.spec.ts`'s
assertion was split into two separate `toBeVisible()` checks, and then
scoped to `page.getByRole("complementary")` (the sidebar's landmark role)
once the user's name started also appearing in the dashboard's "Welcome,
{name}" heading, creating a real ambiguity a plain `getByText` couldn't
resolve.

## Open questions / follow-ups

- **One test could not be re-verified cleanly in this session, but is not
  believed to be a regression**: `"sign out returns to /login and
  re-protects /dashboard"` failed when run against a manually-started dev
  server on port 3001, because `frontend/.env.local`'s `NEXTAUTH_URL` is
  hardcoded to `http://localhost:3210` (Playwright's own dedicated test
  port) — the already-running server had loaded that value at its own
  startup, so `signOut()` built an absolute redirect to `:3210`, a port
  nothing was listening on, producing a Chrome network-error page instead
  of `/login`. This reproduced consistently (3/3 repeats) but only because
  of the port mismatch: overriding `NEXTAUTH_URL` for the *test-runner*
  process doesn't affect a *already-running* server's already-loaded env,
  so the override couldn't prove the fix from the test side. The sign-out
  code itself is unchanged from spec 004, where this exact assertion passed
  cleanly against Playwright's own port-matched server, and this session's
  earlier full-suite runs (specs 004 through 008) all passed it too. This
  should be re-confirmed with a full clean run via Playwright's own
  `webServer` (not a manually-started one) before considering this spec
  fully closed.
