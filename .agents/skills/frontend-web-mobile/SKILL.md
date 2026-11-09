---
name: frontend-web-mobile
description: >-
  Use this skill for engineering Next.js 16 web applications, React 19 client components, real-time 60fps map animations, optimistic UI updates, and mobile client architectures.
---

# Frontend Web & Mobile Client Skill

## Overview
This skill guides the implementation of responsive, high-performance web and mobile clients for riders and drivers, ensuring fluid real-time tracking, graceful offline handling, and strict type safety.

## Best Practices

### 1. 60fps Vehicle Animation & Interpolation
- Never snap vehicle markers directly between raw GPS coordinates.
- Use spherical linear interpolation (slerp) or linear latitude/longitude interpolation with `requestAnimationFrame`.
- Calculate bearing angle between consecutive points to smoothly rotate the vehicle icon toward its direction of travel.

### 2. WebSocket Reconnection & State Reconciliation
- Use exponential backoff jitter on socket disconnects (`use-ride-realtime.ts`).
- On reconnection, immediately fetch current ride state via REST (`GET /rides/:id`) to prevent UI state desynchronization.

### 3. Progressive Web App & Native Bridge Readiness
- Support dark mode tokens (`rf-bg-dark`, `rf-gold-accent`, `rf-silver`).
- Structure UI components cleanly between web (`apps/web`) and shared components to enable future React Native / Flutter sharing.
