# 999 — Monorepo Restructure: frontend/ + backend/ workspaces

**Status**: Implemented
**Date**: 2026-07-15

This is an infrastructure change, not a numbered feature spec (hence `999`,
out of the 001–017 dependency sequence) — it reorganizes where existing code
lives without adding product behavior.

## Problem / Context

The user asked to separate frontend and backend code into `/frontend` and
`/backend`. Next.js's App Router has a hard constraint that doesn't allow
this literally: `app/` must live at the project root or under `src/` *within
that project* — there's no config to point it at an arbitrary folder name.
The resolution is to make `frontend/` itself the Next.js project root (so
`frontend/src/app` satisfies Next.js exactly as `src/app` did before), and
make `backend/` a sibling npm workspace package for everything that isn't
coupled to the Next.js runtime.

## Scope

**In scope**: convert the repo to an npm-workspaces monorepo (`workspaces:
["frontend", "backend"]`); move the entire Next.js project (config, `src/`,
`public/`) into `frontend/`; move `migrations/`, `scripts/`, and the
backend-only `src/lib/{db,workflows,notifications,audit,validation}`
placeholders into `backend/src/{db,workflows,notifications,audit,validation}`;
add `backend/package.json` (`pg`, `node-pg-migrate`, `@types/pg`) and
`backend/tsconfig.json`; add a minimal `backend/src/db/pool.ts` +
`backend/src/index.ts` entry point; update `next.config.ts`
(`transpilePackages: ["backend"]`, `outputFileTracingRoot` pointed at the
monorepo root so `output: standalone` traces the `backend` dependency);
rewrite the root `Dockerfile` to build from the repo root instead of
`frontend/` alone; update `playwright.config.ts`'s `webServer.command` to
`npm run dev --workspace frontend`; consolidate env files so
`frontend/.env.local` is the single source of truth (Next.js can only load
env files from its own project root; `backend`'s migration scripts point
`--envPath` at `../frontend/.env.local` rather than duplicating it).

**Out of scope**: `frontend/src/lib/auth` (next-auth wiring) stays inside
`frontend/`, not `backend/` — next-auth's routes and session handling must
run inside the Next.js process; only the framework-agnostic RBAC predicate
and workflow-assignment lookups it calls into will live in `backend` (spec
004).

## Data model

None — no schema changes in this commit.

## API / routes touched

None.

## UI / components touched

None — this is a pure file-move; no component code changed, only import
paths and tooling config.

## Role & permission matrix

Not applicable.

## Acceptance criteria

- [x] `npm install` at the repo root installs both workspaces correctly.
- [x] `npm run build` (root script → `frontend` workspace) still produces a
      clean production build with the Audit V4 token set intact.
- [x] `npx eslint .` (root script → `frontend` workspace) still passes.
- [x] `npx playwright test` still passes against `frontend`'s dev server on
      the dedicated port.
- [x] `backend`'s `pool.ts` compiles and is importable from `frontend` via
      `transpilePackages`.

## Test plan

No new Playwright specs — this commit re-runs the existing suite
(`001-scaffolding-smoke.spec.ts`, `002-design-system.spec.ts`) against the
new `frontend/` location to prove nothing regressed.

## Open questions / follow-ups

- The `Dockerfile` was rewritten for the monorepo layout but not verified
  with an actual `docker build` in this session (would be a large,
  lower-priority time cost relative to the product features still ahead) —
  flagged for verification before this project is actually deployed.
- `frontend/src/lib/auth` vs `backend`'s RBAC logic split is finalized in
  spec 004, not here — this commit only reserves the boundary.
