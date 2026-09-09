# RideFlow project context

## Product intent

RideFlow is a role-based ride-hailing platform. A rider requests a trip, an eligible
driver accepts it, both parties follow the ride lifecycle, and an administrator
oversees the platform. The immediate product focus is a trustworthy end-to-end ride
flow before payments, live location, notifications, or production-scale dispatch.

## Repository map

| Area | Location | Responsibility |
| --- | --- | --- |
| Web client | `apps/web` | Next.js 16 App Router, React 19, Tailwind CSS 4 |
| API | `apps/api` | NestJS 11 REST API, JWT auth, role guards, Prisma services |
| Data | `apps/api/prisma` | PostgreSQL schema, migrations, and seed configuration |
| Shared packages | `packages` | Reserved workspace area; no shared domain package is established |
| Local infrastructure | `docker-compose.yml` | PostgreSQL 18 at `localhost:5432` |

## Implemented domain

The Prisma schema includes users, driver profiles, vehicles, refresh tokens, saved
places, preferences, driver applications, locations, and rides. Roles are `RIDER`,
`DRIVER`, and `ADMIN`; driver availability is `OFFLINE`, `AVAILABLE`, or `BUSY`.

The API exposes authentication, users, drivers, vehicles, authorization, and rides.
Ride creation requires rider authentication. A ride moves through:

```text
REQUESTED -> SEARCHING_DRIVER -> DRIVER_ASSIGNED -> DRIVER_ARRIVING
         -> IN_PROGRESS -> COMPLETED
                         \-> CANCELLED
```

Riders may cancel their own permitted ride; an assigned driver progresses the active
ride. Matching and direct acceptance use transactions to claim driver availability.
These flows are business-critical and need API plus UI verification when changed.

## Web routes and conventions

The web app has role-specific routes under `app/rider`, `app/driver`, and `app/admin`,
plus profile routes. Authentication is stored in `sessionStorage`; `AppShell` redirects
unauthenticated non-public routes to login. The API helper attaches the access token
and clears it following a `401` response.

Use the existing `rf-*` Tailwind tokens and app form primitives. Always specify loading,
empty, success, recoverable-error, and unauthorized/session-expired states. A route or
navigation item does not itself prove the underlying capability is complete.

## Current delivery facts

- API unit specs exist for main modules, but the ride lifecycle needs stronger transition,
  authorization, and concurrency coverage.
- Web route coverage is broader than verified API completion; inspect a route and its
  backing API before calling it released.
- Root commands documented in `README.md` are not configured in root `package.json`;
  use filtered app commands until that is reconciled.
- Existing working-tree edits may belong to another task. Preserve and report them.

## Baseline commands

```powershell
pnpm --filter api test -- --runInBand
pnpm --filter api build
pnpm --filter web lint
pnpm --filter web build
pnpm --filter api exec prisma validate
```

Database-backed work also needs local PostgreSQL, valid API variables, and a migration
plan. Validate before a migration; never run destructive database actions against an
unknown environment.
