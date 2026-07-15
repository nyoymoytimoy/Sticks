# 002 — Design System

**Status**: Implemented
**Date**: 2026-07-15

## Problem / Context

Every later page (Dashboard, Tickets, Reports, Admin) needs a consistent set
of building blocks styled with the Audit V4 token set established in spec
001. Building these once, generically, avoids each feature commit
reinventing badges/buttons/tables with slightly different markup.

## Scope

**In scope**: `Button` (primary/secondary/destructive/ghost variants),
`StatusBadge` (maps any ticket status code to a tone), `StatCard`,
`PageHeader`, `Sidebar`/`NavItem`, `DataTable` with the standardized
search/match-mode/value/page-size filter row, `Tabs` (Radix-based),
`EmptyState`, `Toast`/`ToastProvider`, `AuditTimeline`. A `/style-guide` page
exercising all of them, wired into Playwright.

**Out of scope**: role-aware filtering of Sidebar nav items (needs auth —
spec 004); wiring DataTable to real server data (needs schema — spec 003);
Dialog/DropdownMenu primitives are installed (`@radix-ui/react-dialog`,
`@radix-ui/react-dropdown-menu`) but not yet wrapped in a styled component —
deferred until a feature actually needs a modal (e.g. spec 012's attachment
upload), to avoid building unused abstractions now.

## Data model

None.

## API / routes touched

None — pure UI.

## UI / components touched

All of `src/components/ui/*` (see Scope above), plus `src/app/style-guide/page.tsx`
and `src/lib/utils.ts` (`cn()` helper combining `clsx` + `tailwind-merge`).
`ToastProvider` is mounted once in `src/app/layout.tsx` so any page can call
`useToast()`.

`DataTable`'s filter row is intentionally generic (`Column<T>[]` + a plain
`T[]` array) so it works identically whether the data comes from a Server
Component fetch (later specs) or, as in the style guide, an inline demo
array — the component itself has no opinion on data source.

## Role & permission matrix

Not applicable yet — components are presentational only.

## Acceptance criteria

- [x] `/style-guide` renders every component with no console errors.
- [x] Toast can be triggered and disappears automatically.
- [x] DataTable search narrows the visible rows.
- [x] `npm run build` and `npx eslint .` both pass.

## Test plan

`tests/e2e/002-design-system.spec.ts` — loads `/style-guide`, checks core
components render, triggers a toast, and exercises the DataTable search
filter.

## Open questions / follow-ups

- Dialog/DropdownMenu styling deferred to whichever later spec first needs a
  modal — flagged above, not a gap in this commit's scope.
