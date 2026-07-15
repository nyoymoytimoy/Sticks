# Sticks

Internal ticketing system for Standard Insurance — 5 request types (Database
Fix Request, Mass Request, BCP/Whitelisting Request, Incident Report, Service
Request), each with its own approval/status workflow, unified under one
dashboard, audit trail, and reporting layer.

Built with Next.js (App Router) + React + PostgreSQL, styled to match the
Audit V4 project's visual identity.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `src/app` — routes (App Router)
- `src/components/{ui,tickets,dashboard,reports}` — shared design system and
  feature components
- `src/lib/{db,auth,workflows,notifications,audit,validation}` — data access,
  auth/RBAC, the workflow state machine, and supporting logic
- `migrations/` — hand-written SQL migrations (`pg` + `node-pg-migrate`, no
  ORM)
- `docs/specs/` — one granular spec per feature commit, numbered in
  dependency order (see below)
- `tests/e2e/` — Playwright, one spec file per feature commit

## Feature roadmap (docs/specs, in dependency order)

Each commit lands with its own `docs/specs/NNN-*.md` and its own
`tests/e2e/*.spec.ts`. See `docs/specs/` for the full, current list; the
canonical roadmap this project follows is:

1. Project scaffolding
2. Design system
3. Database schema & migrations
4. Auth & RBAC
5. Audit trail
6. Ticket core CRUD
7. Workflow — Database Fix Request
8. Workflow — Mass Request
9. Workflow — BCP Whitelisting
10. Workflow — Incident Report
11. Workflow — Service Request
12. Comments, watchers & attachments
13. Approver delegation & escalation
14. Notifications
15. Dashboard & reporting
16. Reports export
17. Cross-cutting Playwright e2e

## Testing

```bash
npx playwright test
```
