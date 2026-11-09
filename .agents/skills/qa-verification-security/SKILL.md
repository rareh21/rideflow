---
name: qa-verification-security
description: >-
  Use this skill for automated test design, state machine fuzzing, geofence edge-case testing, OWASP security audits, PCI-DSS compliance verification, and release gating.
---

# QA Verification, Automation & Security Skill

## Overview
This skill governs verification procedures, test automation strategies, security vulnerability scanning, and release gates for RideFlow.

## Test Strategy & Gate Requirements

### 1. State Machine & Race-Condition Fuzzing
- Test concurrent driver claims: Run parallel requests attempting to accept the same ride simultaneously; verify exactly one succeeds with HTTP 200 and all others receive HTTP 409 Conflict.
- Test invalid state transitions: Verify that attempting to skip directly from `REQUESTED` to `IN_PROGRESS` or `COMPLETED` throws `BadRequestException`.
- Verify OTP security: Verify that incorrect OTP entry throws HTTP 400 and preserves `DRIVER_ARRIVED` status; verify that the OTP is never exposed in driver-facing API responses or socket payloads.

### 2. Geofence & Location Spoofing Verification
- Telemetry validation: Test rejection of impossible speeds (>200 km/h) or teleportation jumps between consecutive pings.
- Geofence triggering: Verify that arrival events only fire when driver coordinates enter a 50m radius of the pickup location.

### 3. Pre-Release Checklist
- [ ] `pnpm --filter api test -- --runInBand` passes with 100% success on domain suites.
- [ ] `pnpm --filter web build` compiles cleanly with zero TypeScript errors.
- [ ] No secret keys or credentials committed to repository.
- [ ] Idempotency keys verified on all payment and refund endpoints.
