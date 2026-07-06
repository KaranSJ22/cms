# CMS Backend and Database Architecture Context

Generated on: 2026-07-05

## 1. System Overview

The ISRO Canteen Management System backend is a Node.js, Express.js, and MySQL application. It is organized around modular backend domains and a stored-procedure-backed relational database.

The currently implemented backend covers:

- Module 0: Common masters and system configuration
- Module 1: Authentication, identity, access, users, roles, and customers
- Module 2: Canteen service, menu item, day slot, and day menu management

The backend follows this request lifecycle:

```text
HTTP Request
-> Express app middleware
-> /api route registry
-> Module route
-> Authentication middleware
-> Role authorization middleware
-> Zod validation middleware
-> Controller
-> Service
-> Repository
-> MySQL query or stored procedure
-> Repository result
-> Service orchestration
-> Controller response
-> JSON response
```

Controllers remain thin. Services orchestrate application behavior. Repositories perform database access. Business rules for Module 2 write operations are intentionally enforced inside MySQL stored procedures.

## 2. Backend Architecture

### Runtime Entry Points

- `backend/src/server.js`
  - Starts the HTTP server.
  - Uses `env.PORT`.
  - Handles `SIGINT` and `SIGTERM` graceful shutdown.

- `backend/src/app.js`
  - Creates the Express app.
  - Adds security and request parsing middleware.
  - Registers Swagger UI.
  - Defines health routes.
  - Mounts `/api` routes.
  - Registers 404 and global error handlers.

### Main Middleware Stack

The app-level middleware order is:

```text
helmet()
cors()
express.json()
express.urlencoded()
requestLogger
login rate limiter
swagger UI
health routes
/api routes
404 handler
errorHandler
```

### Shared Utilities

- `asyncHandler(fn)`
  - Wraps async controllers.
  - Passes thrown errors to `next()`.

- `sendSuccess(res, data, message, statusCode)`
  - Sends the standard success response shape.

- `sendError(...)`
  - Exists as a shared utility, but current controllers mainly use `sendSuccess` and throw errors for failures.

- `logger`
  - Uses Pino.
  - Redacts sensitive request data such as authorization headers, cookies, passwords, and tokens.

### Standard Response Format

Success:

```json
{
  "SUCCESS": true,
  "MESSAGE": "Operation successful",
  "DATA": {}
}
```

Failure:

```json
{
  "SUCCESS": false,
  "MESSAGE": "Error message"
}
```

Validation failure:

```json
{
  "SUCCESS": false,
  "MESSAGE": "Validation failed",
  "ERRORS": {}
}
```

### Error Handling

The global error handler is `backend/src/middlwares/error.middleware.js`.

It:

- Logs the error with method and URL.
- Uses `err.statusCode` when present.
- Defaults to HTTP 500.
- Sends the standard failure response.

MySQL stored procedure business validation errors are expected to bubble through repository/service/controller into this global handler.

## 3. Authentication and Authorization

### Authentication

Authentication is JWT-based.

Login route:

```text
POST /api/auth/login
```

Flow:

```text
Validate LOGINID and PASSWORD
-> CMSLOGININFO stored procedure
-> bcrypt password comparison
-> build role list
-> generate JWT
-> return TOKEN, USER, CUSTOMER
```

The JWT payload includes:

- `USERID`
- `LOGINID`
- `ROLES`
- `CUSTOMERID`
- `CTYPECODE`

### Authorization

Authorization uses `authorizeRoles(...allowedRoles)`.

The middleware checks `req.user.ROLES` from the decoded JWT.

Currently used roles include:

- `ADMIN`
- `CANTEENMAN`
- `CANTEENSTF`
- `FRONTOFF`
- `APPROVER`

## 4. Validation Architecture

Validation uses Zod.

Each module has a `*.validation.js` file.

The validation middleware passes this object to the schema:

```js
{
  body: req.body,
  params: req.params,
  query: req.query
}
```

Validated data is attached to:

```js
req.validated
```

Write request bodies use `.strict()` to reject unknown fields.

Module 2 validation intentionally performs API-level checks only:

- Required fields
- String lengths
- Integer types
- Date format
- Time format
- Datetime format
- Boolean-style `0/1` flags

Business validation remains inside MySQL stored procedures.

## 5. Route Architecture

All API routes are mounted in:

```text
backend/src/routes/index.routes.js
```

Current route mounts:

```text
/api/auth          -> auth routes
/api/common        -> common master routes
/api/identity      -> identity/access routes
/api/services      -> Module 2 service routes
/api/menu-items    -> Module 2 menu item routes
/api/day-slots     -> Module 2 day slot routes
/api/day-menus     -> Module 2 day menu admin/approval routes
/api/menus         -> published menu customer view
```

Middleware order inside protected routes follows this pattern:

```text
authenticate
-> authorizeRoles(...)
-> validate(...)
-> controller
```

Routes that only require authentication omit role authorization.

## 6. Module Architecture

Each implemented module follows the same shape:

```text
module/
  module.routes.js
  module.validation.js
  module.controller.js
  module.service.js
  module.repository.js
```

### Controller Responsibilities

Controllers:

- Use `asyncHandler`.
- Read from `req.validated`.
- Read user context from `req.user` when required.
- Call service functions.
- Return via `sendSuccess`.

Controllers do not contain database logic.

### Service Responsibilities

Services:

- Orchestrate repository calls.
- Pass authenticated user IDs into write operations.
- Throw application errors when a requested read entity is missing.
- Return database-backed records to controllers.

Services do not perform Module 2 stored-procedure business rules.

### Repository Responsibilities

Repositories:

- Import the MySQL pool.
- Execute SQL queries and stored procedures.
- Convert `mysql2` stored procedure result-set shape into simple objects.
- Return rows or a single row.

Repositories do not contain HTTP logic.

## 7. Database Connection Architecture

Database connection file:

```text
backend/src/db/connection.js
```

Library:

```text
mysql2/promise
```

Connection configuration:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

The backend uses a MySQL connection pool:

```js
mysql.createPool({
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})
```

Stored procedures are called with:

```js
const [resultSets] = await pool.execute("CALL PROCEDURE_NAME(?, ?)", params);
const rows = resultSets[0];
return rows?.[0] || null;
```

Read queries currently use:

```js
const [rows] = await pool.execute("SELECT ...");
```

For Module 2 read APIs, repository-only `SELECT` queries include TODO comments indicating they should be replaced by read stored procedures in a future version.

## 8. Database Architecture

Database scripts are under:

```text
database/schema/V1/
database/procedures/V1/
database/seed/V1/
```

Recommended execution order:

```text
1. schema/V1/00_COMMON_SCHEMA.sql
2. schema/V1/01_IDENTITY_ACCESS_SCHEMA.sql
3. schema/V1/02_MENU_SERVICE_SCHEMA.sql
4. procedures/V1/03_COMMON_PROCEDURES.sql
5. procedures/V1/04_IDENTITY_ACCESS_PROCEDURES.sql
6. procedures/V1/05_MENU_SERVICE_PROCEDURES.sql
7. seed/V1/00_SEED_COMMON.sql
8. seed/V1/01_SEED_IDENTITY_ACCESS.sql
9. seed/V1/02_SEED_MENU_SERVICE.sql
```

### Module 0: Common Masters

Tables:

- `CMS_STATUS`
- `CMS_AUTONOS`
- `CMS_CUSTTYPE`
- `CMS_SCREEN`

Purpose:

- Common status values
- Auto-number configuration
- Customer type definitions
- Application screen configuration

Procedures:

- `CMSGENAUTO`
- `CMSADDSTATUS`
- `CMSADDSCREEN`
- `CMSSETROLESCN`

`CMSGENAUTO` supports generated business numbers such as day menu numbers.

### Module 1: Identity and Access

Core tables:

- `CMS_USER`
- `CMS_ROLE`
- `CMS_USRROLE`
- `CMS_ROLESCN`
- `CMS_CUSTOMER`
- `CMS_PERMEMP`
- `CMS_CONTEMP`
- `CMS_OCEEMP`
- `CMS_VISITOR`
- `CMS_ACCKEY`
- `CMS_APPLVL`

Important design principle:

```text
CMS_USER is the login identity.
CMS_CUSTOMER is the canteen/customer identity.
```

A person can be:

- Only a system user
- Only a customer
- Both a user and a customer

Specialized customer profile tables extend `CMS_CUSTOMER`:

- Permanent employee: `CMS_PERMEMP`
- Contract employee: `CMS_CONTEMP`
- Other centre employee: `CMS_OCEEMP`
- Visitor: `CMS_VISITOR`

Important procedures:

- `CMSLOGININFO`
- `CMSADDUSER`
- `CMSADDROLE`
- `CMSASSIGNROL`
- `CMSADDCUST`
- `CMSADDPERM`
- `CMSADDCONT`
- `CMSADDOCE`
- `CMSADDVIS`
- `CMSADDACCKEY`
- `CMSADDAPPLVL`

Module 1 procedures include validation and transaction/error handling improvements.

### Module 2: Menu and Service Management

Tables:

- `CMS_SERVICE`
- `CMS_SERVHIST`
- `CMS_MENUITEM`
- `CMS_MENUHIST`
- `CMS_DAYSLOT`
- `CMS_SLOTHIST`
- `CMS_DAYMENU`
- `CMS_DMENUHIS`

Purpose:

- Define canteen services such as breakfast, lunch, and evening snacks.
- Define menu items and customer-type-specific prices.
- Create date-specific day slots for services.
- Assign menu items to day slots.
- Submit and approve/reject day menus.
- Publish approved menus to authenticated users.

History tables:

- `CMS_SERVHIST`
- `CMS_MENUHIST`
- `CMS_SLOTHIST`
- `CMS_DMENUHIS`

These capture previous values, changed user, changed time, and change reason before updates.

Module 2 procedures:

- `CMSADDSERV`
- `CMSUPDSERV`
- `CMSADDMENU`
- `CMSUPDMENU`
- `CMSADDSLOT`
- `CMSUPDSLOT`
- `CMSADDDMENU`
- `CMSAPPDMENU`
- `CMSVIEWMENU`

Module 2 stored procedures enforce business rules such as:

- Required service/menu/slot/day-menu data
- Active service validation
- Active menu item validation
- Active day slot validation
- Time range checks
- Date range checks
- Duplicate day menu prevention
- Approval status validation
- Reapproval prevention
- Published menu filtering

## 9. Implemented Backend Modules

### Auth Module

Path:

```text
backend/src/modules/auth/
```

Route:

```text
POST /api/auth/login
```

Stored procedure:

```text
CMSLOGININFO
```

Responsibilities:

- Validate login input.
- Fetch login information.
- Verify password.
- Generate JWT.
- Return user, roles, token, and customer info.

### Common Module

Path:

```text
backend/src/modules/common/
```

Routes:

```text
GET /api/common/status
GET /api/common/customer-types
GET /api/common/screens
GET /api/common/autonos
```

Responsibilities:

- Return master/configuration records.
- Protect admin-only records with role middleware.

### Identity Module

Path:

```text
backend/src/modules/identity/
```

Routes:

```text
GET  /api/identity/users
POST /api/identity/users
GET  /api/identity/roles
POST /api/identity/user-roles
GET  /api/identity/customers
POST /api/identity/customers
GET  /api/identity/approval-levels
POST /api/identity/permanent-employees
```

Responsibilities:

- User creation
- Role assignment
- Customer creation
- Permanent employee profile creation
- Identity/access lookups

### Service Module

Path:

```text
backend/src/modules/service/
```

Routes:

```text
GET  /api/services
GET  /api/services/:id
POST /api/services
PUT  /api/services/:id
```

Stored procedures:

```text
CMSADDSERV
CMSUPDSERV
```

Read APIs use repository-only `SELECT` queries with TODO markers for future read stored procedures.

### Menu Module

Path:

```text
backend/src/modules/menu/
```

Routes:

```text
GET  /api/menu-items
GET  /api/menu-items/:id
POST /api/menu-items
PUT  /api/menu-items/:id
```

Stored procedures:

```text
CMSADDMENU
CMSUPDMENU
```

Read APIs use repository-only `SELECT` queries with TODO markers for future read stored procedures.

### Day Slot Module

Path:

```text
backend/src/modules/dayslot/
```

Routes:

```text
GET  /api/day-slots
GET  /api/day-slots/:id
POST /api/day-slots
PUT  /api/day-slots/:id
```

Stored procedures:

```text
CMSADDSLOT
CMSUPDSLOT
```

Read APIs use repository-only `SELECT` queries with TODO markers for future read stored procedures.

### Day Menu Module

Path:

```text
backend/src/modules/daymenu/
```

Administrative routes:

```text
GET   /api/day-menus
GET   /api/day-menus/:id
POST  /api/day-menus
PATCH /api/day-menus/:id/approve
PATCH /api/day-menus/:id/reject
```

Customer route:

```text
GET /api/menus?serviceDate=YYYY-MM-DD
```

Stored procedures:

```text
CMSADDDMENU
CMSAPPDMENU
CMSVIEWMENU
```

Read admin APIs use repository-only `SELECT` queries with TODO markers for future read stored procedures.

Published menu view uses `CMSVIEWMENU` and passes:

- `serviceDate` from query string
- `req.user.CTYPECODE`, defaulting to `VISITOR` if missing

## 10. Module 2 Workflow Details

### Service Workflow

Create service:

```text
POST /api/services
-> validate service payload
-> createServiceController
-> createService service
-> createService repository
-> CALL CMSADDSERV
-> getServiceById SELECT
-> return created service
```

Update service:

```text
PUT /api/services/:id
-> validate id and full update payload
-> updateServiceController
-> updateService service
-> updateService repository
-> CALL CMSUPDSERV
-> getServiceById SELECT
-> return updated service
```

### Menu Workflow

Create menu item:

```text
POST /api/menu-items
-> validate menu payload
-> createMenuController
-> createMenu service
-> createMenu repository
-> CALL CMSADDMENU
-> getMenuById SELECT
-> return created menu item
```

Update menu item:

```text
PUT /api/menu-items/:id
-> validate id and full update payload
-> updateMenuController
-> updateMenu service
-> updateMenu repository
-> CALL CMSUPDMENU
-> getMenuById SELECT
-> return updated menu item
```

### Day Slot Workflow

Create day slot:

```text
POST /api/day-slots
-> validate day slot payload
-> createDaySlotController
-> createDaySlot service
-> createDaySlot repository
-> CALL CMSADDSLOT
-> getDaySlotById SELECT
-> return created day slot
```

Update day slot:

```text
PUT /api/day-slots/:id
-> validate id and update payload
-> updateDaySlotController
-> updateDaySlot service
-> updateDaySlot repository
-> CALL CMSUPDSLOT
-> getDaySlotById SELECT
-> return updated day slot
```

### Day Menu Workflow

Create day menu:

```text
POST /api/day-menus
-> validate day menu payload
-> createDayMenuController
-> createDayMenu service
-> createDayMenu repository
-> CALL CMSADDDMENU
-> getDayMenuById SELECT
-> return created day menu
```

Approve day menu:

```text
PATCH /api/day-menus/:id/approve
-> validate id and remarks
-> approveDayMenuController
-> approveDayMenu service
-> approveDayMenu repository
-> CALL CMSAPPDMENU with APP
-> getDayMenuById SELECT
-> return approved day menu
```

Reject day menu:

```text
PATCH /api/day-menus/:id/reject
-> validate id and remarks
-> rejectDayMenuController
-> rejectDayMenu service
-> rejectDayMenu repository
-> CALL CMSAPPDMENU with REJ
-> getDayMenuById SELECT
-> return rejected day menu
```

View published menu:

```text
GET /api/menus?serviceDate=YYYY-MM-DD
-> authenticate user
-> validate serviceDate query
-> viewPublishedMenuController
-> fetchPublishedMenu service
-> viewPublishedMenu repository
-> CALL CMSVIEWMENU(serviceDate, CTYPECODE)
-> return published menu rows
```

## 11. Authorization Matrix

### Auth

```text
POST /api/auth/login              public
GET  /api/me                      authenticated
```

### Common

```text
GET /api/common/status            authenticated
GET /api/common/customer-types    authenticated
GET /api/common/screens           ADMIN
GET /api/common/autonos           ADMIN
```

### Identity

Identity management routes are currently `ADMIN` only.

### Module 2

Service:

```text
GET  /api/services                ADMIN, CANTEENMAN, CANTEENSTF
GET  /api/services/:id            ADMIN, CANTEENMAN, CANTEENSTF
POST /api/services                ADMIN, CANTEENMAN
PUT  /api/services/:id            ADMIN, CANTEENMAN
```

Menu:

```text
GET  /api/menu-items              ADMIN, CANTEENMAN, CANTEENSTF
GET  /api/menu-items/:id          ADMIN, CANTEENMAN, CANTEENSTF
POST /api/menu-items              ADMIN, CANTEENMAN
PUT  /api/menu-items/:id          ADMIN, CANTEENMAN
```

Day Slot:

```text
GET  /api/day-slots               ADMIN, CANTEENMAN, CANTEENSTF
GET  /api/day-slots/:id           ADMIN, CANTEENMAN, CANTEENSTF
POST /api/day-slots               ADMIN, CANTEENMAN
PUT  /api/day-slots/:id           ADMIN, CANTEENMAN
```

Day Menu:

```text
GET   /api/day-menus              ADMIN, CANTEENMAN
GET   /api/day-menus/:id          ADMIN, CANTEENMAN
POST  /api/day-menus              ADMIN, CANTEENMAN, CANTEENSTF
PATCH /api/day-menus/:id/approve  ADMIN, CANTEENMAN
PATCH /api/day-menus/:id/reject   ADMIN, CANTEENMAN
GET   /api/menus                  authenticated
```

## 12. Swagger Documentation

Swagger UI is mounted at:

```text
GET /api-docs
```

Swagger config:

```text
backend/src/config/swagger.config.js
```

Docs are organized in:

```text
backend/src/docs/
```

Current docs:

- `health.docs.js`
- `auth.docs.js`
- `common.docs.js`
- `identity.docs.js`
- `service.docs.js`
- `menu.docs.js`
- `dayslot.docs.js`
- `daymenu.docs.js`

Swagger tags:

- Health
- Auth
- Common
- Identity
- Service
- Menu
- Day Slot
- Day Menu

## 13. Important Current Conventions

### Naming

The API uses uppercase database-style request and response field names, such as:

- `SERVICEID`
- `SERVCODE`
- `MENUITEMID`
- `DAYSLOTID`
- `DAYMENUID`
- `BOOKSTART`
- `APPRSTATUS`

### Date and Time Fields

Current validation patterns:

- Date: `YYYY-MM-DD`
- Time: `HH:mm` or `HH:mm:ss`
- Datetime: Zod `.datetime()`

### Stored Procedure Write Pattern

Create procedures return an ID row:

```text
SERVICEID
MENUITEMID
DAYSLOTID
DAYMENUID + DMENUNO
```

Services use the returned ID to fetch and return the created entity.

Update/approval procedures generally do not return a row. Services call the procedure, then fetch the updated entity.

### Business Rule Ownership

Module 2 business rules are owned by MySQL procedures.

Node.js validation must not duplicate rules such as:

- Active service checks
- Active menu item checks
- Active day slot checks
- Time ordering
- Booking window validation
- Cancellation deadline validation
- Duplicate day menu assignment
- Approval state transitions
- Quantity business rules

## 14. Known Inconsistencies and Notes

- The folder name `middlwares` is misspelled but used consistently by the project.
- Existing Module 2 request fields follow database-style uppercase names rather than lower camel case.
- Some Module 2 read endpoints use direct `SELECT` queries because read stored procedures do not yet exist.
- `JWT_SECRET` is read directly from `process.env` in auth middleware/service rather than through `env.js`.
- There is currently no automated test framework or CI workflow in the backend package.
- The database scripts use the V1 directory structure under `database/schema/V1`, `database/procedures/V1`, and `database/seed/V1`.

## 15. High-Level Data Relationships

```text
CMS_USER
  -> CMS_USRROLE
  -> CMS_CUSTOMER

CMS_ROLE
  -> CMS_USRROLE
  -> CMS_ROLESCN
  -> CMS_APPLVL

CMS_CUSTOMER
  -> CMS_PERMEMP
  -> CMS_CONTEMP
  -> CMS_OCEEMP
  -> CMS_VISITOR
  -> CMS_ACCKEY

CMS_SERVICE
  -> CMS_DAYSLOT
  -> CMS_DAYMENU

CMS_MENUITEM
  -> CMS_DAYMENU

CMS_DAYMENU
  -> CMS_DMENUHIS
```

## 16. Future Integration Readiness

The current Module 2 design prepares for later modules:

- Booking and prebooking can consume approved `CMS_DAYMENU` records.
- Order flows can use `DAYSLOTID`, `MENUITEMID`, `DAYMENUID`, and customer type pricing.
- Quantity tracking starts with `AVAILQTY` and `MAXQTY`.
- Approval workflows are represented by `APPRSTATUS`, `APPROVEDBY`, and `APPROVEDAT`.
- Reporting can use history tables and audit timestamps.
- Customer-specific pricing is exposed through `CMSVIEWMENU`.

Future recommended improvements:

- Add read stored procedures for Module 2 list/detail endpoints.
- Add automated tests for validation, route authorization, and repository procedure calls.
- Add CI workflow and SonarQube/SonarCloud analysis.
- Move all environment variables, including JWT settings, through a validated config layer.
