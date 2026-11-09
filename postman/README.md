# RideFlow Postman API Testing Collection

This directory contains the official Postman collection and environment for testing all RideFlow backend APIs.

## Files Included

1. **`RideFlow.postman_collection.json`** — Complete Postman Collection (v2.1.0) with all endpoints, organized into 8 functional folders with sample request bodies and automated test scripts.
2. **`RideFlow.postman_environment.json`** — Postman Environment containing all pre-configured variables (`baseUrl`, auth tokens, test IDs, and OTPs).

---

## Folders & API Endpoints Covered

| Folder | Endpoints Included | Description |
|---|---|---|
| **01. Health & System** | `GET /health`<br>`GET /users/count` | Health checks and DB connectivity. |
| **02. Authentication** | `POST /auth/register` (Rider, Driver, Admin)<br>`POST /auth/login` (Rider, Driver, Admin)<br>`GET /auth/me`<br>`GET /auth/driver-test`<br>`GET /auth/admin-test`<br>`POST /auth/logout` | Full user authentication. Login/Register tests **automatically capture and store JWT tokens** into the environment. |
| **03. Users & Profile** | `GET /users/me`<br>`PATCH /users/me`<br>`GET /users/me/preferences`<br>`PATCH /users/me/preferences`<br>`GET /users/me/saved-places`<br>`POST /users/me/saved-places`<br>`PATCH /users/me/saved-places/:placeId`<br>`DELETE /users/me/saved-places/:placeId`<br>`PATCH /users/me/security/password`<br>`GET /users/:id/rating` | Profile management, favorite places, notification preferences, and rating summaries. |
| **04. Locations & Routing** | `GET /locations/autocomplete?q=...`<br>`POST /locations/resolve`<br>`POST /locations/reverse-geocode` | Google Places autocomplete, place ID resolution, and GPS reverse geocoding. |
| **05. Driver Application & Management** | `POST /drivers/application`<br>`GET /drivers/application`<br>`GET /drivers/applications`<br>`GET /drivers/applications/:id`<br>`PATCH /drivers/applications/:id/review`<br>`POST /drivers`<br>`GET /drivers/me`<br>`GET /drivers/me/status`<br>`PATCH /drivers/me/status`<br>`PATCH /drivers/me/location` | Rider to driver application lifecycle, admin verification/approval, driver availability, and live GPS broadcast ticks. |
| **06. Vehicles** | `POST /vehicles`<br>`GET /vehicles/me`<br>`PATCH /vehicles/me` | Driver vehicle registration and tier mapping (GO, PLUS, XL). |
| **07. Rides Lifecycle** | `POST /rides/route-preview`<br>`POST /rides/quote`<br>`POST /rides`<br>`GET /rides/me`<br>`GET /rides/my/history`<br>`GET /rides/driver`<br>`GET /rides/driver/requests`<br>`GET /rides/driver/current`<br>`GET /rides/driver/my/history`<br>`GET /rides/:id`<br>`POST /rides/:id/accept`<br>`POST /rides/:id/match-driver`<br>`GET /rides/:id/driver-location`<br>`PATCH /rides/:id/status` (Arriving, Arrived, In Progress, Completed)<br>`POST /rides/:id/cancel`<br>`GET /rides/:id/receipt`<br>`POST /rides/:id/review`<br>`GET /rides/:id/review`<br>`GET /rides/:id/refund` | End-to-end ride lifecycle with **4-digit pickup PIN verification** before starting trip. |
| **08. Payments & Refunds** | `POST /payments/ride/:rideId`<br>`GET /payments/ride/:rideId`<br>`GET /payments/ride/:rideId/refund`<br>`GET /payments/me`<br>`GET /payments/:id`<br>`POST /payments/:id/process`<br>`GET /payments/:id/refund` | Post-trip settlement, mock payment gateway simulation, and cancellation refund tracking. |

---

## How to Import & Use in Postman

1. Open **Postman**.
2. Click **Import** (top left).
3. Drag and drop both files:
   - `postman/RideFlow.postman_collection.json`
   - `postman/RideFlow.postman_environment.json`
4. In the top-right environment dropdown, select **RideFlow Local Environment**.
5. Ensure your RideFlow API is running:
   ```bash
   pnpm --filter api start:dev
   ```
   (Default base URL is `http://localhost:3001`).

---

## Automated Token & Variable Chaining

You do **not** need to manually copy and paste tokens or IDs between requests:
- Running **`Login - Rider`** automatically populates `{{token}}` and `{{riderToken}}`.
- Running **`Login - Driver`** automatically populates `{{driverToken}}`.
- Running **`Login - Admin`** automatically populates `{{adminToken}}`.
- Running **`Create Ride Request`** automatically populates `{{rideId}}`.
- Running **`Get Ride by ID`** automatically extracts `{{pickupOtp}}` for the rider so the driver can verify it at pickup!
- Running **`Submit Driver Application`** automatically populates `{{applicationId}}`.

---

## Recommended End-to-End Test Flow

1. **Health Check**: Run `01. Health & System > Health Check` (verify PostgreSQL is connected).
2. **Auth Setup**: Run `02. Authentication > Login - Rider`, `Login - Driver`, and `Login - Admin`.
3. **Driver Status**: Run `05. Driver Management > Update Driver Status (Set AVAILABLE)`.
4. **Driver Vehicle**: Run `06. Vehicles > Register Driver Vehicle` (ensures driver can accept requests).
5. **Resolve Location**: Run `04. Locations & Routing > Resolve Location` (sets `{{pickupLocationId}}`).
6. **Book Trip**: Run `07. Rides Lifecycle > Create Ride Request` (sets `{{rideId}}`).
7. **Accept Trip**: Run `07. Rides Lifecycle > Driver - Accept Ride` (generates pickup PIN).
8. **Get PIN**: Run `07. Rides Lifecycle > Get Ride by ID (Includes Pickup PIN for Rider)` (captures `{{pickupOtp}}`).
9. **Driver Arrives**: Run `07. Rides Lifecycle > Status: Driver Arrived`.
10. **Verify PIN & Start**: Run `07. Rides Lifecycle > Status: Start Ride (With 4-Digit PIN Verification)` (verifies OTP).
11. **Complete & Receipt**: Run `07. Rides Lifecycle > Status: Complete Ride` and `Get Trip Receipt`.
