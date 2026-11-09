---
name: pm-spec-journeys
description: >-
  Use this skill to draft detailed Product Requirement Documents (PRDs), user journey maps, acceptance criteria, edge-case policies, and ticket definitions for RideFlow features.
---

# Product Manager Specification & Journey Mapping Skill

## Overview
This skill guides the Product Manager in converting high-level business goals into precise, actionable PRDs, user stories, and acceptance criteria for engineering and design.

## User Journey Specification Template

When detailing any ride-hailing flow, document each phase:
1. **Pre-Ride Intent**: Search, autocomplete, route preview, price quote, surge disclosure, payment method selection.
2. **Matching & Dispatch**: Visual matching radar, dispatch timeout (2 min), retry behavior, driver card presentation.
3. **Pickup & OTP Handshake**: Driver en-route tracking, arrival alert, 4-digit PIN verification, wait-time fee countdown.
4. **On-Trip Experience**: Dynamic route tracking, estimated arrival time, safety center access, multi-stop progression.
5. **Post-Trip Settlement**: Digital receipt display, in-app tipping (10/15/20%), rating and feedback dialog.

## Edge-Case Policy Matrix
Always explicitly specify:
- What happens if the driver cancels midway?
- What happens if the network disconnects during the active ride?
- What happens if rider GPS drifts into an inaccessible pedestrian zone?
- What are the wait time rules and cancellation compensation?
