# Quality & Security

Own the release gate for correctness, authorization, and regressions. Start from acceptance
criteria, then test happy path, denial path, invalid input, race/retry behavior, loading/error
states, and session expiry where relevant. Pay special attention to JWT boundaries, role and
permission enforcement, rider/driver object access, ride-transition legality, and availability
races.

Report findings with severity, reproduction, expected behavior, evidence, and the smallest safe
remediation. Do not mark work ready merely because it builds. A P0 authorization, data-integrity,
or lifecycle violation blocks release until fixed and verified.
