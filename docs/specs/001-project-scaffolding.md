# 001 — Project Scaffolding

**Status**: Implemented
**Date**: 2026-07-15

## Problem / Context

Sticks is a brand-new internal ticketing system for Standard Insurance (see the
[project plan](../../README.md) for the full product picture). Before any
feature work can land, the project needs a Next.js/TypeScript/Tailwind
foundation styled to match the Audit V4 project's visual identity, plus the
folder skeleton and tooling (Docker, Playwright) that every later feature
commit builds on.

## Scope

**In scope**: Next.js 16 (App Router, TypeScript, ESLint) scaffold; Tailwind
v4 theme carrying the Audit V4 design tokens (gold/teal/surface/ink palette,
Inter font, pill radius); root layout and a placeholder home page; the full
`src/{components,lib,types}`, `docs/specs`, `migrations`, `scripts`,
`tests/e2e` folder skeleton; Dockerfile + `.dockerignore`; Playwright
installed with a smoke test; `.env.example`.

**Out of scope** (later specs): the actual design-system components (002),
database schema (003), auth (004), and everything workflow-related.

## Data model

None yet — `migrations/` exists as an empty, tracked folder for spec 003.

## API / routes touched

None yet.

## UI / components touched

- `src/app/layout.tsx` — root layout, loads Inter via `next/font/google`,
  sets page metadata (title "Sticks", no description-heavy SEO needed for an
  internal tool).
- `src/app/globals.css` — Tailwind v4 `@theme` block defining every Audit V4
  token as a first-class Tailwind color/radius/font, so components can use
  `bg-gold`, `text-teal`, `rounded-pill`, etc. directly instead of raw hex.
- `src/app/icon.tsx` — generates a 🎫 emoji favicon via `next/og`
  `ImageResponse`, mirroring Audit V4's own text-only/emoji-favicon branding
  (no image logo asset).
- `src/app/page.tsx` — placeholder landing page proving the token set renders
  correctly; will be replaced once auth (004) can redirect to `/dashboard`.

## Role & permission matrix

Not applicable — no auth exists yet.

## Acceptance criteria

- [x] `npm run dev` serves the app and the home page renders with the Audit
      V4 color/font tokens applied (verified visually below).
- [x] `npx playwright test` passes the scaffolding smoke test.
- [x] `npm run build` produces a production build with no type errors.
- [x] Folder skeleton for every future spec (002–017) exists and is tracked
      by git (via `.gitkeep` placeholders where still empty).

## Test plan

`tests/e2e/001-scaffolding-smoke.spec.ts` — loads `/` and asserts the page
title is "Sticks". This is intentionally minimal; it exists to prove the
Playwright + dev-server wiring works end-to-end, not to test product logic.

## Open questions / follow-ups

- **Next.js 16 breaking changes**: this project was scaffolded directly on
  Next 16.2.10, which renames `middleware.ts`/`middleware()` to
  `proxy.ts`/`proxy()` and makes `params`/`searchParams` always
  `Promise`-typed. Spec 004 (Auth & RBAC) must use `src/proxy.ts`, not
  `middleware.ts`, for route guards.
- Real Postgres connection details and Gmail MCP authorization are external
  dependencies for specs 003 and 014 respectively — not blocking for this
  commit.
