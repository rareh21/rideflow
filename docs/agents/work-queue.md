# RideFlow work queue

This file is the shared source of truth for agent work. IDs do not change. The
orchestrator may add or reprioritize tickets after recording the reason. A task is
claimed only when its status, owner, date, and intended verification are filled in.

## Queue rules

- Status is one of `READY`, `IN PROGRESS`, `BLOCKED`, `IN REVIEW`, or `DONE`.
- Select the highest-priority unblocked ticket that matches the agent's role.
- One implementation owner per ticket; review requests are recorded in **Hand-off**.
- If code evidence disagrees with this queue, stop and update the ticket instead of
  implementing from a stale assumption.

## Milestone: trusted ride lifecycle

| ID | Priority | Status | Owner | Work | Acceptance criteria | Verification / evidence | Hand-off |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RF-001 | P0 | READY | Platform engineer | Add focused API tests for ride creation, authorization, allowed/denied status transitions, cancellation driver release, and concurrent driver claims. | Tests prove rider/driver/admin permissions and the state machine; transaction behavior is covered without shared state. | `pnpm --filter api test -- --runInBand` | Quality reviews coverage and edge cases. |
| RF-002 | P0 | READY | Product strategist | Define the first releasable rider-to-driver journey and the operational policy for no driver, cancellation, and driver availability. | A decision record names user outcome, states, copy-level behavior, success measure, and accepted exclusions. | Product + design sign-off in ticket evidence. | Hand requirements to design and platform. |
| RF-003 | P0 | READY | Experience designer | Turn RF-002 into route-level experience contracts for rider and driver flows. | Each state has loading, empty, error, and recovery behavior; screens reuse existing RideFlow conventions and meet keyboard/contrast expectations. | Design review with product; linked implementation slices. | Platform estimates slices. |
| RF-004 | P1 | READY | Platform engineer | Reconcile documented root commands with monorepo package scripts and add non-mutating CI-friendly checks. | `pnpm build`, `pnpm lint`, and `pnpm test` execute documented workspace work or docs accurately state supported commands. | Commands run from a clean, scoped environment. | Quality verifies no unrelated writes. |
| RF-005 | P1 | READY | Quality & security | Establish the release gate for authentication, authorization, API validation, and client session expiry. | A concise checklist identifies automated checks, manual scenarios, risk severity, owner, and evidence format. | Review by platform and orchestrator. | Becomes required for feature tickets. |
| RF-006 | P1 | READY | Platform engineer | Integrate real-time ride updates only after RF-001 through RF-003 have a signed contract. | Gateway, authorization, delivery semantics, UI reconciliation, and reconnect behavior have tests and a documented event contract. | API + web tests; manual two-session scenario. | Product and quality approval required before start. |

## Completed operational work

| ID | Status | Owner | Evidence |
| --- | --- | --- | --- |
| OPS-001 | DONE | Program orchestrator | Agent roles, project context, decision rights, safe claim protocol, and ordered first milestone are established in `AGENTS.md` and `docs/agents/`. |
