# Backend Architecture — CMS (Canteen Management System)

> **Source of Truth**: This document is derived exclusively from the files located in `backend/src/`.  
> **Constraint**: Schemas are the source of truth for data definitions.

---

## 1. Technology Stack

| Component       | Technology          | Version (package.json) |
|----------------|---------------------|------------------------|
| Runtime        | Node.js             | ≥ 18 (ESM modules)    |
| Framework      | Express.js          | ^4.21.2                |
| Database Driver| mysql2/promise      | ^3.14.0                |
| Auth           | jsonwebtoken (JWT)  | ^9.0.2                 |
| Password Hash  | bcryptjs            | ^3.0.2                 |
| Validation     | Zod                 | ^3.24.4                |
| Logging        | Pino + pino-pretty  | ^9.6.0 / ^13.0.0      |
| API Docs       | swagger-jsdoc + swagger-ui-express | ^6.2.8 / ^5.0.1 |
| CORS           | cors                | ^2.8.5                 |
| Env Config     | dotenv              | ^16.5.0                |

---

## 2. Application Entry Points

| File                  | Purpose                                                     |
|-----------------------|-------------------------------------------------------------|
| `server.js`           | Top-level entry. Imports `app` and calls `app.listen(PORT)` |
| `app.js`              | Express application factory. Mounts middleware and routes   |

---

## 3. Layered Architecture

The backend follows an **N-tier** layered pattern. Each request flows through the layers in this order:

```
HTTP Request
    │
    ▼
┌──────────────────────────┐
│   Express Middleware     │  (CORS, JSON parser, Logger, Swagger)
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│   Router Layer           │  routes/*.routes.js  →  Defines HTTP verb + path
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│   Middleware Layer       │  middlewares/  →  Auth, Role, Validation
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│   Controller Layer       │  modules/*/*.controller.js  →  HTTP concern only
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│   Service Layer          │  modules/*/*.service.js  →  Business logic
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│   Repository Layer       │  modules/*/*.repository.js  →  Data access
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│   MySQL Database         │  Stored Procedures via pool.execute()
└──────────────────────────┘
```

---

## 4. Directory Structure

```
backend/src/
├── config/
│   ├── env.js                    # Centralized environment config (dotenv)
│   └── swagger.config.js         # Swagger/OpenAPI spec definition
├── db/
│   └── connection.js             # MySQL connection pool (mysql2/promise)
├── middlewares/
│   ├── auth.middleware.js        # JWT Bearer token verification
│   ├── error.middleware.js       # Global error handling
│   ├── requestLogger.middleware.js # HTTP request logging using pino-http
│   ├── role.middleware.js        # Role-based access control (req.user.ROLES)
│   └── validate.middleware.js    # Zod schema validation factory
├── utils/
│   ├── apiResponse.js            # Standard API response helpers (sendSuccess, sendError)
│   ├── asyncHandler.js           # Async try/catch wrapper for controllers
│   └── logger.js                 # Pino logger instance
├── docs/
│   └── health.docs.js            # Swagger doc for health endpoints
├── routes/
│   └── index.routes.js           # Central router — mounts all module routes
└── modules/
    ├── auth/                     # Authentication & SSO
    ├── booking/                  # Booking management
    ├── canteen/                  # Center and canteen masters
    ├── common/                   # Shared lookup endpoints (Status, etc.)
    ├── daymenu/                  # Day-wise menu configuration
    ├── dayslot/                  # Time slots for operations
    ├── holidays/                 # Holiday configuration
    ├── identity/                 # User profiles, roles, permissions
    ├── kiosk/                    # Kiosk scanning (RFID/QR)
    ├── menu/                     # Core menu item master
    ├── menutemplates/            # Menu templates for repeated assignments
    ├── pricing/                  # Effective date based pricing
    ├── reports/                  # Canteen and kitchen reports
    ├── service/                  # Services offered (Breakfast, Lunch)
    └── wallet/                   # Wallet top-ups, transactions, withdrawals
```

---

## 5. Middleware Pipeline

### 5.1 Authentication — `auth.middleware.js`
- Extracts `Authorization: Bearer <token>` from request headers.
- Verifies the JWT using `JWT_SECRET` from environment config.
- On success, attaches `req.user` containing user claims.
- On failure: responds with `401 Unauthorized`.

### 5.2 Role Authorization — `role.middleware.js`
- Factory function: `authorize(...allowedRoles)`.
- Checks `req.user.ROLES` against the `allowedRoles` array.
- Responds with `403 Forbidden` if denied.

### 5.3 Validation — `validate.middleware.js`
- Accepts a Zod schema.
- Parses `req.body`, `req.query`, or `req.params`.
- On failure: responds with `400 Bad Request` and Zod error details. 

### 5.4 Error Handling — `error.middleware.js`
- Catches unhandled exceptions and errors passed to `next()`.
- Logs the error using `logger.error` along with HTTP method and URL.
- Returns a standardized JSON error response.

### 5.5 Request Logging — `requestLogger.middleware.js`
- Wraps `pino-http` to log incoming HTTP requests.
- Custom log levels based on response status codes.
- Injects `USERID` into logs.

---

## 6. Module Summaries

### 6.1 Auth Module
Authenticates users via `/auth/login` and `/auth/sso`. Emits JWTs. Contains logic to integrate with `CMSLOGININFO` DB procedure to retrieve unified roles and claims.

### 6.2 Common Module
Provides read-only lookup APIs for constants such as system statuses, customer types, screen definitions, and auto-number configurations.

### 6.3 Identity Module
Manages users (`/identity/users`), user-role assignments, and customer profiles.

### 6.4 Service Module
Manages canteen service configurations (e.g., Breakfast, Lunch) and their properties.

### 6.5 Menu Module
Manages the core catalog of menu items (`/menu-items`), excluding pricing.

### 6.6 Pricing Module
Manages effective-date-based pricing (`CMS_ITEMPRICE` & `CMS_ITEMPRICEDT`) for menu items, differentiating rates across customer types.

### 6.7 Day Slot Module
Manages dated operation windows mapping to specific services.

### 6.8 Day Menu Module
Assigns menu items to day slots (`/day-menus`) and handles the operational approval workflow (Pending → Approved/Rejected).

### 6.9 Booking Module
Core transactional module. Handles pre-booking, scanning, cancellations, no-shows, and status transitions for user orders.

### 6.10 Wallet Module
Handles user account balances, top-up actions (`/wallets/topup`), withdrawal requests, and historical transaction logs.

### 6.11 Canteen Module
Handles masters for Centers and their associated Canteens.

### 6.12 Holidays Module
Manages system-wide holiday definitions to prevent service routing on inactive days.

### 6.13 Kiosk Module
Provides specialized endpoints for kiosk-based user interactions like rapid RFID/QR code scanning and localized order validation.

### 6.14 Menu Templates Module
Facilitates bulk planning by defining and assigning repeated sets of menu items to services across multiple dates.

### 6.15 Reports Module
Data aggregation for kitchen and administration, e.g., `/reports/serving-prep` for daily kitchen prep sheets.

---

## 7. Database Connection

- **File**: `db/connection.js`
- Creates a MySQL connection pool using `mysql2/promise.createPool()`.
- Configuration sourced from `config/env.js`.
- Pool is exported as a singleton; all repository layers import and use the same pool.

---

## 8. Response Format

All API responses use a standardized format via `utils/apiResponse.js`:

**Success Response (`sendSuccess`)**:
```json
{
  "SUCCESS": true,
  "MESSAGE": "...",
  "DATA": { ... }
}
```

**Error Response (`sendError`)**:
```json
{
  "SUCCESS": false,
  "MESSAGE": "...",
  "ERRORS": null
}
```

---

## 9. Error Handling

- Controllers use `asyncHandler` to catch errors automatically.
- Database errors from stored procedures (e.g. `SQLSTATE 45000`) are caught, logged, and returned cleanly without crashing the server.
