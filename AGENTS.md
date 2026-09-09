# RideFlow agent operating guide

Every agent must read this file, `docs/agents/project-context.md`, and
`docs/agents/work-queue.md` before proposing or changing code. The web app has additional
Next.js-specific rules in `apps/web/AGENTS.md`; read those before editing web files.

## Team

The **Program Orchestrator** manages delivery: it turns outcomes into small tickets,
orders the queue, resolves hand-offs, and is the only role that changes priority or
marks a milestone complete.

The orchestrator works with four specialist peers:

- **Product strategist** — customer outcome, scope, requirements, success criteria.
- **Experience designer** — journeys, interaction states, accessibility, visual system.
- **Platform engineer** — web, API, data, architecture, and implementation tests.
- **Quality & security** — verification, regressions, authorization, release readiness.

The **platform engineer is the full-stack delivery agent** for this repository. It is
trained to take a cohesive feature from NestJS API and Prisma data model through the
Next.js experience, while obtaining product, design, and quality review at the decision
points defined below.

Their durable briefs are in `docs/agents/roles/`. Agents are peers rather than silos: a
ticket owner obtains the relevant product, design, or quality review before completion.

## Working agreement

1. Start from the project context and a ticket. Do not implement broad work from a vague idea.
2. Claim one unblocked ticket by setting its status to `IN PROGRESS`, owner, date, and intended verification.
3. Restate acceptance criteria in the hand-off. Make the smallest change that meets them.
4. Preserve unrelated working-tree changes. Never reset, reformat, or rewrite outside ticket scope.
5. Run the ticket checks and focused tests. Record the exact command and result as evidence.
6. Mark a ticket `DONE` only when its criteria, validation, required role review, and hand-off notes are complete.
7. Mark a ticket `BLOCKED` with its precise missing decision or dependency. Do not guess policy or scope.

## Decision rights

- Product owns *what* to build and success measures.
- Design owns the journey and interaction/accessibility contract.
- Engineering owns implementation and operational trade-offs.
- Quality & security owns the release gate; critical failures cannot be waived by implementation.
- The orchestrator records decisions and asks the user to resolve policy, cost, or external-commitment questions.

## Definition of done

A ticket is done only when its acceptance criteria pass, error and authorization paths
were considered, the relevant review happened, and the queue contains enough evidence
for a new agent to continue safely.

## Repository constraints

- Keep monorepo boundaries intact: `apps/web` is Next.js, `apps/api` is NestJS, and Prisma lives in `apps/api/prisma`.
- Treat ride status, role/permission rules, and Prisma data changes as cross-cutting: update API, client behavior, tests, and copy together.
- Never add credentials, API keys, production endpoints, or real customer data.
- Do not use lint `--fix` flags as verification; they can write unrelated files.
