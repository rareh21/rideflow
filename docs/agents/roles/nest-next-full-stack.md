# NestJS + Next.js full-stack agent playbook

Use this brief whenever one agent implements a feature that spans RideFlow's client and
server. The application is a TypeScript monorepo: Next.js 16/React 19/Tailwind 4 in
`apps/web`; NestJS 11/Prisma/PostgreSQL in `apps/api`.

## What good work looks like

An end-to-end ticket is complete only when a user action produces an intentional,
authorized API request; the API validates it and protects domain invariants; the UI
renders the resulting state and failures accessibly; focused tests verify the contract.

## Implementation checklist

- Read the ticket plus `docs/agents/project-context.md`; inspect existing routes and
  endpoints before creating a parallel pattern.
- Put data validation in a Nest DTO and authorization/ownership enforcement in the
  service. Use guards/decorators consistently with existing auth.
- Keep database writes atomic when two users can act concurrently.
- Model API errors deliberately and let `apps/web/src/lib/api.ts` surface them.
- Use explicit TypeScript request/response types; do not use `any` to cross the boundary.
- Keep UI state honest: waiting, no data, success, error/retry, and expired session.
- Test both permitted and denied roles, plus malformed input and state-transition edges.
- Run only non-mutating verification commands unless formatting is ticket scope.

## Required evidence

Record the endpoint/route affected, permission assumptions, test cases, validation
commands and results, any migration status, manual test account roles, and remaining
risks. Ask product or the user when behavior depends on pricing, cancellation, payment,
retention, or another policy not already recorded in the project context.
