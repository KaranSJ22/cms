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

| Layer        | File Pattern                 | Responsibility                                                                                                |
|-------------|------------------------------|---------------------------------------------------------------------------------------------------------------|
| **Router**  | `modules/*/*.routes.js`      | Maps HTTP verbs and URL paths to controller functions. Applies middleware (auth, role, validation) inline.      |
| **Middleware** | `middlwares/*.middleware.js` | Cross-cutting concerns: JWT token verification, role-based access, Zod schema validation.                      |
| **Controller** | `modules/*/*.controller.js` | Extracts data from `req`, delegates to service, formats `res`. No business logic.                              |
| **Service** | `modules/*/*.service.js`      | Business logic orchestration. Calls repository methods. May call multiple repositories in a single operation.   |
| **Repository** | `modules/*/*.repository.js` | Direct database interaction via `pool.execute()`. Calls stored procedures or executes raw SQL SELECT queries.   |

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
│   ├── role.middleware.js         # Role-based access control (req.user.ROLES)
│   └── validation.middleware.js   # Zod schema validation factory
├── utils/
│   ├── logger.js                 # Pino logger instance
│   ├── sendResponse.js           # Standardized API response helper
│   └── AppError.js               # Custom error class (statusCode + message)
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

### 5.3 Validation — `validation.middleware.js`

- Factory function: `validate(schema)`.
- Accepts a Zod schema.
- Parses `req.body` against the schema.
- On failure: responds with `400 Bad Request` including Zod error details.

---

## 6. Module Summary

### 6.1 Auth Module

| Endpoint       | Method | Auth | Description                              |
|---------------|--------|------|------------------------------------------|
| `/auth/login` | POST   | No   | Authenticates user, returns JWT + profile |

- **Flow**: Controller → Service (password verification via bcrypt, JWT generation) → Repository (`CMSLOGININFO` procedure).
- The procedure returns two result sets: (1) user profile with consumer roles, (2) canteen role assignments.

### 6.2 Common Module

| Endpoint           | Method  | Auth | Description                    |
|-------------------|---------|------|--------------------------------|
| `/common/statuses`| GET     | Yes  | List all system statuses        |
| `/common/custtypes`| GET    | Yes  | List all customer types         |
| `/common/screens` | GET     | Yes  | List all screens                |
| `/common/rolescn` | GET     | Yes  | List role-screen permissions    |

- Uses raw SQL SELECT queries (no stored procedures for reads).
- No write endpoints implemented.

### 6.3 Identity Module

| Endpoint                    | Method  | Auth | Description                     |
|----------------------------|---------|------|---------------------------------|
| `/identity/users`          | GET     | Yes  | List all users                   |
| `/identity/users`          | POST    | Yes  | Create user (`CMSADDUSER`)       |
| `/identity/users/:id`      | GET     | Yes  | Get user by ID                   |
| `/identity/roles`          | GET     | Yes  | List all roles                   |
| `/identity/roles/assign`   | POST    | Yes  | Assign role (`CMSASSIGNROL`)     |
| `/identity/users/:id/roles`| GET     | Yes  | Get user's roles                 |
| `/identity/customers`      | GET     | Yes  | List all customers               |
| `/identity/customers`      | POST    | Yes  | Create customer (`CMSADDCUST`)   |
| `/identity/customers/:id`  | GET     | Yes  | Get customer by ID               |
| `/identity/permemp`        | POST    | Yes  | Create perm emp (`CMSADDPERM`)   |
| `/identity/permemp/:id`    | GET     | Yes  | Get perm emp by ID               |
| `/identity/approvallevels` | GET     | Yes  | List approval levels             |

### 6.4 Service Module

| Endpoint            | Method  | Auth | Description                         |
|--------------------|---------|------|-------------------------------------|
| `/services`        | GET     | Yes  | List all services                    |
| `/services`        | POST    | Yes  | Create service (`CMSADDSERV`)        |
| `/services/:id`    | GET     | Yes  | Get service by ID                    |
| `/services/:id`    | PUT     | Yes  | Update service (`CMSUPDSERV`)        |

### 6.5 Menu Module

| Endpoint           | Method  | Auth | Description                         |
|-------------------|---------|------|-------------------------------------|
| `/menus`          | GET     | Yes  | List all menu items                  |
| `/menus`          | POST    | Yes  | Create menu item (`CMSADDMENU`)      |
| `/menus/:id`      | GET     | Yes  | Get menu item by ID                  |
| `/menus/:id`      | PUT     | Yes  | Update menu item (`CMSUPDMENU`)      |

### 6.6 Day Slot Module

| Endpoint             | Method  | Auth | Description                       |
|---------------------|---------|------|-----------------------------------|
| `/dayslots`         | GET     | Yes  | List all day slots                 |
| `/dayslots`         | POST    | Yes  | Create day slot (`CMSADDSLOT`)     |
| `/dayslots/:id`     | GET     | Yes  | Get day slot by ID                 |
| `/dayslots/:id`     | PUT     | Yes  | Update day slot (`CMSUPDSLOT`)     |

### 6.7 Day Menu Module

| Endpoint                | Method  | Auth | Description                          |
|------------------------|---------|------|--------------------------------------|
| `/daymenus`            | GET     | Yes  | List all day menus                    |
| `/daymenus`            | POST    | Yes  | Create day menu (`CMSADDDMENU`)       |
| `/daymenus/:id`        | GET     | Yes  | Get day menu by ID                    |
| `/daymenus/:id/approve`| PUT    | Yes  | Approve day menu (`CMSAPPDMENU`)      |
| `/daymenus/:id/reject` | PUT    | Yes  | Reject day menu (`CMSAPPDMENU`)       |
| `/daymenus/published`  | GET     | Yes  | View published menu (`CMSVIEWMENU`)   |

---

## 7. Database Connection

- **File**: `db/connection.js`
- Creates a MySQL connection pool using `mysql2/promise.createPool()`.
- Configuration sourced from `config/env.js` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
- Pool is exported as a singleton; all repository layers import and use the same pool.

---

## 8. Response Format

All API responses use a standardized format via `utils/sendResponse.js`:

```json
{
  "status": "success" | "error",
  "statusCode": 200,
  "message": "...",
  "data": { ... }
}
```

---

## 9. Error Handling

- `AppError` class extends `Error` with a `statusCode` property.
- Services throw `AppError` instances for business rule violations (e.g., "User not found", "Duplicate login ID").
- Controllers catch errors and forward to Express error-handling middleware.
- Database errors from stored procedures (SQLSTATE 45000) are caught and re-thrown with appropriate HTTP status codes.
