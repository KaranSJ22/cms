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
│   Middleware Layer        │  middlwares/  →  Auth, Role, Validation
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




### Layer Responsibilities

| Layer          | File Pattern                 | Responsibility                                                                                                             |
| -------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Router**     | `modules/*/*.routes.js`      | Maps HTTP verbs and URL paths to controller functions. Applies middleware (auth, role, validation) inline.                 |
| **Middleware** | `middlwares/*.middleware.js` | Cross-cutting concerns: Request logging, JWT token verification, role-based access, Zod schema validation, error handling. |
| **Controller** | `modules/*/*.controller.js`  | Extracts data from `req`, delegates to service, formats `res`. No business logic.                                          |
| **Service**    | `modules/*/*.service.js`     | Business logic orchestration. Calls repository methods. May call multiple repositories in a single operation.              |
| **Repository** | `modules/*/*.repository.js`  | Direct database interaction via `pool.execute()`. Calls stored procedures or executes raw SQL SELECT queries.              |

---

## 4. Directory Structure

```
backend/src/
├── config/
│   ├── env.js                    # Centralized environment config (dotenv)
│   └── swagger.config.js         # Swagger/OpenAPI spec definition
├── db/
│   └── connection.js             # MySQL connection pool (mysql2/promise)
├── middlwares/
│   ├── auth.middleware.js         # JWT Bearer token verification
│   ├── error.middleware.js        # Global error handling
│   ├── requestLogger.middleware.js# HTTP request logging using pino-http
│   ├── role.middleware.js         # Role-based access control (req.user.ROLES)
│   └── validate.middleware.js     # Zod schema validation factory
├── utils/
│   ├── apiResponse.js            # Standardized API response helpers (sendSuccess, sendError)
│   ├── asyncHandler.js           # Async try/catch wrapper for Express controllers
│   └── logger.js                 # Pino logger instance
├── docs/
│   └── health.docs.js            # Swagger doc for health endpoints
├── routes/
│   └── index.routes.js           # Central router — mounts all module routes
└── modules/
    ├── auth/
    │   ├── auth.controller.js
    │   ├── auth.service.js
    │   ├── auth.repository.js
    │   ├── auth.routes.js
    │   └── auth.validation.js
    ├── common/
    │   ├── common.controller.js
    │   ├── common.service.js
    │   ├── common.repository.js
    │   ├── common.routes.js
    │   └── common.validation.js
    ├── identity/
    │   ├── identity.controller.js
    │   ├── identity.service.js
    │   ├── identity.repository.js
    │   ├── identity.routes.js
    │   └── identity.validation.js
    ├── service/
    │   ├── service.controller.js
    │   ├── service.service.js
    │   ├── service.repository.js
    │   ├── service.routes.js
    │   └── service.validation.js
    ├── menu/
    │   ├── menu.controller.js
    │   ├── menu.service.js
    │   ├── menu.repository.js
    │   ├── menu.routes.js
    │   └── menu.validation.js
    ├── dayslot/
    │   ├── dayslot.controller.js
    │   ├── dayslot.service.js
    │   ├── dayslot.repository.js
    │   ├── dayslot.routes.js
    │   └── dayslot.validation.js
    ├── pricing/
    │   ├── pricing.controller.js
    │   ├── pricing.repository.js
    │   ├── pricing.routes.js
    │   ├── pricing.service.js
    │   └── pricing.validation.js
    └── daymenu/
        ├── daymenu.controller.js
        ├── daymenu.service.js
        ├── daymenu.repository.js
        ├── daymenu.routes.js
        └── daymenu.validation.js
```

---

## 5. Middleware Pipeline

### 5.1 Authentication — `auth.middleware.js`

- Extracts `Authorization: Bearer <token>` from request headers.
- Verifies the JWT using `JWT_SECRET` from environment config.
- On success, attaches `req.user` containing: `USERID`, `LOGINID`, `FULLNAME`, `ROLES` (array of role codes), `CUSTOMERID`, `CTYPECODE`.
- On failure: responds with `401 Unauthorized`.

### 5.2 Role Authorization — `role.middleware.js`

- Factory function: `authorize(...allowedRoles)`.
- Checks `req.user.ROLES` (set by auth middleware) against the `allowedRoles` array.
- If no overlap: responds with `403 Forbidden`.

### 5.3 Validation — `validate.middleware.js`

- Factory function: `validate(schema)`.
- Accepts a Zod schema.
- Parses `req.body` against the schema.
- On failure: responds with `400 Bad Request` including Zod error details. 

### 5.4 Error Handling — `error.middleware.js`

- Catches unhandled exceptions and errors passed to `next()`.
- Logs the error using `logger.error` along with HTTP method and URL.
- Returns a standardized JSON error response (defaults to 500 Internal Server Error).

### 5.5 Request Logging — `requestLogger.middleware.js`

- Wraps `pino-http` to log incoming HTTP requests.
- Custom log levels based on response status codes (error for >=500, warn for >=400, info otherwise).
- Injects `USERID` and `LOGINID` into logs if authentication middleware has populated `req.user`.

---

## 6. Module Summary

### 6.1 Auth Module

| Endpoint       | Method | Auth | Description                              |
|---------------|--------|------|------------------------------------------|
| `/auth/login` | POST   | No   | Authenticates user, returns JWT + profile |

- **Flow**: Controller → Service (password verification via bcrypt, JWT generation) → Repository (`CMSLOGININFO` procedure).
- The procedure returns three result sets: (1) user profile , (2)consumer role , (3) canteen role assignments.

### 6.2 Common Module

| Endpoint            | Method | Auth | Description                  |
| ------------------- | ------ | ---- | ---------------------------- |
| `/common/statuses`  | GET    | Yes  | List all system statuses     |
| `/common/custtypes` | GET    | Yes  | List all customer types      |
| `/common/screens`   | GET    | Yes  | List all screens             |
| `/common/rolescn`   | GET    | Yes  | List role-screen permissions |

- Uses raw SQL SELECT queries (no stored procedures for reads).
- No write endpoints implemented.

### 6.3 Identity Module

| Endpoint                    | Method | Auth | Description                    |
| --------------------------- | ------ | ---- | ------------------------------ |
| `/identity/users`           | GET    | Yes  | List all users                 |
| `/identity/users`           | POST   | Yes  | Create user (`CMSADDUSER`)     |
| `/identity/users/:id`       | GET    | Yes  | Get user by ID                 |
| `/identity/roles`           | GET    | Yes  | List all roles                 |
| `/identity/roles/assign`    | POST   | Yes  | Assign role (`CMSASSIGNROL`)   |
| `/identity/users/:id/roles` | GET    | Yes  | Get user's roles               |
| `/identity/customers`       | GET    | Yes  | List all customers             |
| `/identity/customers`       | POST   | Yes  | Create customer (`CMSADDCUST`) |
| `/identity/customers/:id`   | GET    | Yes  | Get customer by ID             |
| `/identity/permemp`         | POST   | Yes  | Create perm emp (`CMSADDPERM`) |
| `/identity/permemp/:id`     | GET    | Yes  | Get perm emp by ID             |
| `/identity/approvallevels`  | GET    | Yes  | List approval levels           |

### 6.4 Service Module

| Endpoint        | Method | Auth | Description                   |
| --------------- | ------ | ---- | ----------------------------- |
| `/services`     | GET    | Yes  | List all services             |
| `/services`     | POST   | Yes  | Create service (`CMSADDSERV`) |
| `/services/:id` | GET    | Yes  | Get service by ID             |
| `/services/:id` | PUT    | Yes  | Update service (`CMSUPDSERV`) |

### 6.5 Menu Module

| Endpoint           | Method | Auth | Description                     |
| ------------------ | ------ | ---- | ------------------------------- |
| `/menu-items`      | GET    | Yes  | List all menu items             |
| `/menu-items`      | POST   | Yes  | Create menu item (`CMSADDMENU`) |
| `/menu-items/:id`  | GET    | Yes  | Get menu item by ID             |
| `/menu-items/:id`  | PUT    | Yes  | Update menu item (`CMSUPDMENU`) |

### 6.6 Day Slot Module

| Endpoint          | Method | Auth | Description                    |
| ----------------- | ------ | ---- | ------------------------------ |
| `/day-slots`      | GET    | Yes  | List all day slots             |
| `/day-slots`      | POST   | Yes  | Create day slot (`CMSADDSLOT`) |
| `/day-slots/:id`  | GET    | Yes  | Get day slot by ID             |
| `/day-slots/:id`  | PUT    | Yes  | Update day slot (`CMSUPDSLOT`) |

### 6.7 Day Menu Module

| Endpoint                  | Method | Auth | Description                         |
| ------------------------- | ------ | ---- | ----------------------------------- |
| `/day-menus`              | GET    | Yes  | List all day menus                  |
| `/day-menus`              | POST   | Yes  | Create day menu (`CMSADDDMENU`)     |
| `/day-menus/:id`          | GET    | Yes  | Get day menu by ID                  |
| `/day-menus/:id/approve`  | PATCH  | Yes  | Approve day menu (`CMSAPPDMENU`)    |
| `/day-menus/:id/reject`   | PATCH  | Yes  | Reject day menu (`CMSAPPDMENU`)     |
| `/menus`                  | GET    | Yes  | View published menu (`CMSVIEWMENU`) |

### 6.8 Pricing Module

| Endpoint                                                     | Method | Auth | Description                               |
| ------------------------------------------------------------ | ------ | ---- | ----------------------------------------- |
| `/menu-items/:menuItemId/prices`                             | GET    | Yes  | Get item price history                    |
| `/menu-items/:menuItemId/prices`                             | POST   | Yes  | Create item price                         |
| `/menu-items/:menuItemId/prices/effective`                   | GET    | Yes  | Get effective prices for an item          |
| `/menu-items/:menuItemId/prices/effective/:customerTypeCode` | GET    | Yes  | Get effective price for specific customer |
| `/item-prices/:itemPriceId/deactivate`                       | PATCH  | Yes  | Deactivate an item price                  |

### 6.9 Admin Module

- Currently scaffolded with subdirectories: `canteen`, `center`, `consumer`, and `user`.
- Endpoints and logic are pending implementation.

### 6.10 Booking Module

| Endpoint                           | Method | Auth | Description                                |
|------------------------------------|--------|------|--------------------------------------------|
| `/bookings`                        | GET    | Yes  | List all bookings (`CMSLISTBOOK`)          |
| `/bookings`                        | POST   | Yes  | Create new booking (`CMSADDBOOK`)          |
| `/bookings/:id`                    | GET    | Yes  | Get booking details (`CMSGETBOOK`)         |
| `/bookings/:id/items/:itemId`      | PUT    | Yes  | Update booking item (`CMSUPDBOOKITEM`)     |
| `/bookings/:id/cancel`             | PATCH  | Yes  | Cancel booking (`CMSCANCELBOOK`)           |
| `/bookings/:id/serve`              | PATCH  | Yes  | Serve booking (`CMSSERVEBOOK`)             |
| `/bookings/:id/no-show`            | PATCH  | Yes  | Mark booking as no-show (`CMSNOSHOWBOOK`)  |
| `/bookings/kiosk-toggle/:dayMenuId`| PATCH  | Yes  | Toggle Kiosk availability (`CMSTOGGLEKIOSK`)|

---

## 7. Database Connection

- **File**: `db/connection.js`
- Creates a MySQL connection pool using `mysql2/promise.createPool()`.
- Configuration sourced from `config/env.js` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
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

- Controllers use `asyncHandler` to automatically catch errors and forward them to Express error-handling middleware via `next(err)`.
- Database errors from stored procedures (SQLSTATE 45000) are caught and re-thrown.
- `error.middleware.js` globally processes these errors, logging them via Pino and returning a standardized HTTP response format.
