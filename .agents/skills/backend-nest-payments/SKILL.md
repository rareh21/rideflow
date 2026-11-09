---
name: backend-nest-payments
description: >-
  Use this skill for engineering NestJS 11 backend services, Prisma database transactions, Stripe PaymentIntents, Stripe Connect instant driver payouts, and surge pricing calculations.
---

# Backend NestJS & Payment Integration Skill

## Overview
This skill provides implementation patterns for backend financial transactions, payment gateway integrations, surge pricing algorithms, and high-concurrency state transitions.

## Key Implementation Patterns

### 1. Two-Phase Payment Lifecycle
1. **Ride Confirmation / Match**: Create a Stripe `PaymentIntent` with `capture_method: 'manual'` (authorize / hold funds on rider's card for estimated fare + 20% cushion).
2. **Ride Completion**: Calculate final fare based on actual elapsed time and GPS distance; capture the authorized payment intent.
3. **Cancellation**: Cancel the payment intent authorization immediately if eligible for zero fee; or capture the cancellation fee and release the remainder.

### 2. Driver Payout via Stripe Connect
- Onboard approved drivers to Stripe Custom Connect.
- Implement `transfer_data` to atomically route the driver's earnings share (e.g. 75-80%) directly to their connected account upon trip completion.
- Provide `/drivers/payouts/instant` endpoint to initiate on-demand payout to driver debit cards via Stripe Instant Payouts.

### 3. Dynamic Surge Pricing Formula
$$\text{Surge Multiplier} = \min\left(M_{\max}, \max\left(1.0, 1.0 + k \cdot \left(\frac{D}{S} - T\right)\right)\right)$$
Where:
- $D$ = Active ride requests in H3 hexagon over rolling 15 minutes.
- $S$ = Available active drivers in H3 hexagon.
- $T$ = Threshold ratio (e.g., 1.2 requests per driver).
- $k$ = Surge sensitivity factor.
- $M_{\max}$ = Maximum surge cap (e.g. 3.5x).
