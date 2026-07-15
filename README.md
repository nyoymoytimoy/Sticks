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

This is an npm-workspaces monorepo — `frontend/` is the Next.js app (App
Router requires its `app/` folder to live at a project root or under a `src/`
folder within it, so the whole Next.js project lives inside `frontend/`);
`backend/` is a sibling workspace package holding everything that isn't
Next.js-coupled, imported into `frontend` as the `backend` dependency.

- `frontend/src/app` — routes (App Router)
- `frontend/src/components/{ui,tickets,dashboard,reports}` — shared design
  system and feature components
- `frontend/src/lib/auth` — next-auth wiring (must live inside the Next.js
  app; the framework's auth routes/proxy run in its own process)
- `backend/src/{db,workflows,notifications,audit,validation}` — data access,
  the workflow state machine, and supporting business logic, framework-agnostic
- `backend/migrations/` — hand-written SQL migrations (`pg` +
  `node-pg-migrate`, no ORM)
- `docs/specs/` — one granular spec per feature commit, numbered in
  dependency order (see below)
- `tests/e2e/` — Playwright, one spec file per feature commit, run against
  the built `frontend` app

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
7. UI overhaul (visual redesign, same gold/teal token set, modernized login)
8. UI adjustments round 2 (no dark backgrounds, plain-language field labels)
9. Workflow — Database Fix Request
10. Workflow — Mass Request
11. Workflow — BCP Whitelisting
12. Workflow — Incident Report
13. Workflow — Service Request
14. Comments, watchers & attachments
15. Approver delegation & escalation
16. Notifications
17. Dashboard & reporting
18. Reports export
19. Cross-cutting Playwright e2e

## Testing

```bash
npx playwright test
```
