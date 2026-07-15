# 007 — UI Overhaul

**Status**: Implemented
**Date**: 2026-07-15

> **Note on numbering**: this spec was inserted after 006 at the user's
> request, shifting the workflow specs from 007–017 to 008–018. Nothing
> about their scope or order changed — see `docs/specs/999-monorepo-restructure.md`
> for the project's other precedent of a mid-roadmap insertion.

## Problem / Context

The user shared a reference dashboard UI (a dark sidebar admin layout with
icon-chip stat cards, a card-based table, and a search-first top bar) and
asked for a full visual overhaul imitating that structural style, while
**keeping** the existing gold/teal/warm-neutral Audit V4 token set rather
than the reference's own navy/green colors. The login screen was called out
specifically as needing modernization — it was a plain centered card.

## Scope

**In scope**: dark sidebar (`bg-ink-900` — reusing an existing token, not a
new dark palette) with a pinned gold "New Ticket" CTA at the bottom
(mirroring the reference's bottom CTA card); a new `Topbar` component with a
real, wired search box (`?q=` navigates to `/tickets` and pre-fills its
`DataTable`, not a decorative dead-end); a new `Breadcrumbs` component wired
into every page via an optional `PageHeader` prop; `StatCard` redesigned
with an icon-chip treatment (colored rounded square + icon, matching the
reference's stat-card style); every existing page's content wrapped in
white card containers on a `surface-secondary` page background (dark
sidebar + light card-based content is the specific structural pattern being
imitated); and a full split-panel login screen redesign (dark branding
panel with a decorative dot-grid + radial glow reusing the gold/teal
tokens, feature list, collapses below `md`; light form panel with
icon-prefixed inputs).

**Deliberately out of scope**: no new data or backend behavior — this is a
pure restyle of what specs 001–006 already built. Fake/decorative elements
the reference has but that don't correspond to a real feature yet (a
notification bell with unread-count badges, a "cart" icon, a collapsible
hamburger toggle) were deliberately **not** added — building UI theater for
features that don't exist would be misleading, not a design improvement.

## Data model

None.

## API / routes touched

None — no new routes; `frontend/src/app/(protected)/tickets/page.tsx` gained
a `searchParams` prop (Next 16 async `Promise`) to read the top bar's `?q=`.

## UI / components touched

- `frontend/src/components/ui/sidebar.tsx` — dark theme, bottom CTA slot.
- `frontend/src/components/ui/topbar.tsx` (new) — replaces the old plain
  header; wired search, user initials avatar.
- `frontend/src/components/ui/breadcrumbs.tsx` (new).
- `frontend/src/components/ui/page-header.tsx` — gained an optional
  `breadcrumb` prop (backward compatible; existing calls without it are
  unaffected).
- `frontend/src/components/ui/stat-card.tsx` — icon-chip redesign. Icons are
  referenced by **name** (a string key into a lookup object inside this
  Client Component), the same pattern established in specs 004/005/006 for
  the sidebar and DataTable — this component will be used from the
  Dashboard's Server Component page (spec 016), and a component reference
  can't cross that server→client boundary.
- `frontend/src/app/(public)/login/page.tsx` — full split-panel redesign.
- Every existing page (`dashboard`, `tickets`, `tickets/[ticketId]`,
  `tickets/new/*`, `admin/audit`, `style-guide`) updated to pass
  `breadcrumb` and wrap content in a card container.

## Role & permission matrix

Unchanged from spec 006 — this is a pure restyle.

## Acceptance criteria

- [x] All 23 existing Playwright tests (specs 001–006) still pass unchanged
      — the restyle preserved every accessible name/role the suite depends
      on (`getByLabel("Email"/"Password")`, `getByRole("button", {name:
      "Sign in"/"Sign out"})`, nav links by name, "Signed in as" text).
- [x] The top bar's search is a real feature, not decorative: submitting it
      navigates to `/tickets?q=...` and the ticket list's `DataTable` opens
      pre-filtered to that query.
- [x] The login screen's branding panel is hidden below the `md` breakpoint
      (verified at both a 1280px and a 500px viewport) rather than broken or
      overflowing.
- [x] `npm run build`, `npx eslint .` both pass.

## Test plan

`tests/e2e/007-ui-overhaul.spec.ts` — 4 tests: the login screen's branding
panel renders (and a real sign-in still works through it), the branding
panel collapses on a narrow viewport, the top bar search round-trips to a
pre-filtered ticket list, and a breadcrumb link actually navigates.

## Open questions / follow-ups

- The reference's notification bell / message / cart icons were
  intentionally omitted (see Scope) — if a real notification feature lands
  in spec 015, a real (not decorative) bell icon would be a natural home
  for it then.
- Sidebar collapse (the reference's hamburger toggle) wasn't built — nothing
  in this app yet needs a collapsible sidebar; flagged as a future
  enhancement if the nav grows.
