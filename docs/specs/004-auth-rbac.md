# 004 — Auth & RBAC

**Status**: Implemented
**Date**: 2026-07-15

## Problem / Context

Every protected page (Dashboard, Tickets, Reports, Admin) needs to know who
is logged in and what they're allowed to see. This spec wires up
authentication (the user chose email + password over Google SSO or magic
links, to avoid an external OAuth app registration or the still-unauthorized
Gmail MCP dependency) and page-level RBAC — nav visibility keyed off stored
roles.

## Scope

**In scope**: `next-auth` v4 with a `CredentialsProvider` (JWT session
strategy — required for Credentials-based sign-in), a `password_hash` column
added to `users`, the 4 preconfigured users named in the project brief
seeded with bcrypt-hashed dev passwords, a login page, a `(protected)`
route-group layout that fetches the session server-side and redirects
unauthenticated visitors, `frontend/src/proxy.ts` as a second layer of route
protection (Next.js 16's renamed `middleware.ts`/`middleware()` convention),
and `backend`'s `canAccessPage()` — a page-level RBAC predicate keyed off
stored role codes.

**Deliberately out of scope** (see `docs/specs/003-database-schema-migrations.md`'s
own scope note, and the plan's confirmed design): the exclusive-assignment
predicate that will enforce "only Leiva Morente can approve Database Fix
Requests" is NOT built here. That logic depends on real
`workflow_assignments` rows and a real ticket-transition action to
authorize — neither exists yet. Building it against empty tables would be
unverifiable, so it's correctly deferred to spec 007 (Database Fix Request
workflow), which is also where `workflow_assignments` gets seeded with
Leiva's and Rudy's exclusive rows. `canAccessPage()` here only decides page
*visibility*, not per-ticket transition authorization.

## Data model

One migration (`20260715120008_add-password-and-seed-users.sql`): adds
`pgcrypto` (for seeding bcrypt hashes directly in SQL via `crypt()`), a
`password_hash` column on `users`, and seeds 4 users — Leiva Morente
(`approver` role), Rudy Manlapig (`admin` role), a demo associate
(`associate` role), and a demo requestor (no stored role, since `requestor`
is implicit).

## API / routes touched

- `frontend/src/app/api/auth/[...nextauth]/route.ts` — the next-auth route
  handler.
- `frontend/src/proxy.ts` — `withAuth()`-wrapped route guard matching
  `/dashboard`, `/tickets`, `/reports`, `/admin` — Next 16 requires this
  file be named `proxy.ts` with a function named `proxy`, not the old
  `middleware.ts`/`middleware()` convention.

## UI / components touched

- `frontend/src/app/(public)/login/page.tsx` — email/password form (wrapped
  in `<Suspense>` because it reads `useSearchParams()` for a `callbackUrl`,
  which Next.js requires to not block static prerendering of the rest of
  the route tree).
- `frontend/src/app/(protected)/layout.tsx` — server-fetches the session,
  redirects to `/login` if absent (defense in depth alongside `proxy.ts`),
  builds the Sidebar's nav sections filtered through `canAccessPage()`.
- `frontend/src/app/providers.tsx` — wraps the app in next-auth's
  `SessionProvider` (needed for the client-side `signIn`/`signOut`/`useSession`
  hooks) alongside the existing `ToastProvider`.
- `frontend/src/components/ui/sidebar.tsx` — icons are now referenced by
  **name** (a string key into a lookup object inside this Client Component),
  not passed as component references from the server. See Open Questions.
- `frontend/src/components/ui/sign-out-button.tsx` — thin `signOut()` wrapper.

## Role & permission matrix

| Page | requestor | approver | admin | associate |
|---|---|---|---|---|
| Dashboard | yes | yes | yes | yes |
| Tickets | yes | yes | yes | yes |
| Reports | no | yes | yes | no |
| Admin > Users | no | no | yes | no |

(Role-scoping of *data* within Dashboard/Tickets/Reports — e.g. a requestor
only seeing their own tickets — lands with those pages themselves, specs
006/015/016.)

## Acceptance criteria

- [x] Migration applied against the real dev Postgres instance.
- [x] `npm run build` produces a clean production build; the route table
      shows `ƒ Proxy (Middleware)` confirming the route guard is wired.
- [x] `npx eslint .` and `tsc --noEmit` (backend) both pass.
- [x] Playwright exercises real login against the real seeded users —
      wrong password rejected, unauthenticated `/dashboard` redirects to
      `/login`, Leiva (approver) sees Reports but not Admin, Rudy (admin)
      sees Admin > Users, the demo requestor (no role) sees neither, and
      sign-out re-protects `/dashboard`.

## Test plan

`tests/e2e/004-auth-rbac.spec.ts` — 6 tests covering the acceptance criteria
above, run against real seeded users and a real Postgres instance, not
mocked auth state.

## Open questions / follow-ups

- **Real RSC bug caught by actually running Playwright, not just building**:
  the initial implementation passed lucide-react icon *components* as props
  from the `(protected)/layout.tsx` Server Component into the `Sidebar`
  Client Component. This compiles and type-checks fine, but fails at runtime
  — React Server Components cannot serialize function/component references
  across the server→client boundary, which crashed the entire protected
  layout with an RSC serialization error on every request. Fixed by having
  the layout pass a serializable icon *name* string, with `Sidebar` mapping
  names to components internally via its own lucide-react imports. This
  class of bug is invisible to `npm run build` and `tsc --noEmit` — it only
  surfaces when a page is actually rendered, which is exactly why the
  Playwright run (not just the build) was the acceptance gate here.
- **Placeholder emails/password**: `lmorente@…`, `rmanlapig@…`, and the two
  demo accounts, all with dev password `ChangeMe123!`, are placeholders —
  the project brief didn't provide real corporate email addresses. These
  must be replaced (and the dev password rotated/removed) before any
  non-local deployment.
- Password reset / forgot-password flow is not built — would need working
  email delivery (the same Gmail MCP dependency spec 014 needs), so it's a
  natural fast-follow once that's authorized, not part of this spec.
