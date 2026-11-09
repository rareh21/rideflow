---
name: safety-ops-dispatch
description: >-
  Use this skill for designing In-Ride Safety Centers, 24/7 SOS dispatch relay, RideCheck anomaly telematics, driver biometric identity checks, and incident response workflows.
---

# Safety, Trust & Operations Skill

## Overview
This skill governs safety protocols, real-time threat detection, emergency dispatch integration, and operational driver compliance for RideFlow.

## Safety Architecture Guidelines

### 1. In-Ride Safety Center & 1-Tap SOS
- Prominent floating safety badge during active trips.
- Emergency SOS button triggering:
  1. Direct dial / web-relay to local emergency dispatch (911 / 112).
  2. High-priority silent WebSocket event to RideFlow Safety Operations Center.
  3. Automated SMS with live GPS tracking URL dispatched to rider's emergency contacts.

### 2. RideCheck Anomaly Detection
- Telematics service monitoring active trips:
  - **Stationary Vehicle Anomaly**: Vehicle stops moving for >3 minutes away from traffic lights or destination.
  - **Route Deviation Anomaly**: Vehicle deviates >500m from suggested polyline without rider destination change.
  - **Action**: App pushes an interactive safety check: "Everything OK? We noticed your ride was delayed." If no response within 60 seconds, escalates to safety team.

### 3. Pre-Shift Biometric Verification
- When a driver taps "Go Online", trigger a quick random facial selfie prompt.
- Compare selfie embedding against registered driver license photo using facial similarity model.
- Prevents account sharing and fraudulent driver substitution.
