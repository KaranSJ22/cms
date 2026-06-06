# ISRO Internal Canteen Management System

## Module 1 Branch: Backend Foundation, Authentication, Common Masters, and Identity Access

This repository contains the backend implementation for the first working module of the **ISRO Internal Canteen Management System (CMS)**.

The current branch focuses on the foundational backend setup and identity-related features required before implementing menu, booking, payment, wallet, kiosk, and reporting workflows.

---

## Project Overview

The ISRO Internal Canteen Management System is designed to manage canteen users, access control, service/menu configuration, day-wise menu availability, and future transactional workflows such as booking, wallet payments, kiosk ordering, salary deduction, official requests, and reports.

The system follows a modular and scalable design suitable for an organizational environment.

The database design separates:

- `CMS_USER` — login identity
- `CMS_CUSTOMER` — canteen identity
- `CMS_USRROLE` — role assignment
- Employee-specific profile tables such as `CMS_PERMEMP`, `CMS_CONTEMP`, and `CMS_OCEEMP`

This separation allows a person to be only a system user, only a canteen customer, or both.

---

## Current Branch Scope

This branch contains the implementation for:

```txt
Backend foundation
Authentication
JWT authorization
Role-based access control
Common master APIs
Identity and access read APIs
User creation
Role assignment
Customer profile creation
Permanent employee profile creation
Swagger API documentation
```

---

## Tech Stack

### Backend

```txt
Node.js
Express.js
JavaScript
MySQL
```

### Backend Libraries

```txt
express              API framework
dotenv               Environment variable management
cors                 Frontend-backend communication
helmet               Security headers
mysql2               MySQL connection and stored procedure execution
bcrypt               Password hashing
jsonwebtoken         JWT authentication
zod                  Input validation
pino                 Application logging
pino-http            HTTP request logging
pino-pretty          Development log formatting
express-rate-limit   Login/API rate limiting
dayjs                Date and time handling
swagger-ui-express   Swagger API documentation
swagger-jsdoc        OpenAPI documentation generation
```

---

## Project Structure

```txt
CMS/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js
│   │   │   └── swagger.config.js
│   │   │
│   │   ├── db/
│   │   │   └── connection.js
│   │   │
│   │   ├── docs/
│   │   │   ├── health.docs.js
│   │   │   ├── auth.docs.js
│   │   │   ├── common.docs.js
│   │   │   └── identity.docs.js
│   │   │
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   ├── role.middleware.js
│   │   │   ├── requestLogger.middleware.js
│   │   │   ├── validate.middleware.js
│   │   │   └── error.middleware.js
│   │   │
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── common/
│   │   │   └── identity/
│   │   │
│   │   ├── routes/
│   │   │   └── index.routes.js
│   │   │
│   │   ├── utils/
│   │   │   ├── apiResponse.js
│   │   │   ├── asyncHandler.js
│   │   │   └── logger.js
│   │   │
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── database/
│   ├── schema/
│   ├── procedures/
│   └── seed/
│
├── CLAUDE.md
├── README.md
└── .gitignore
```

---

## Backend Features Implemented

### 1. Backend Foundation

The backend server is configured with:

```txt
Express application setup
Environment configuration
Global error handling
404 route handling
Request logging using Pino
Security headers using Helmet
CORS configuration
Rate limiting for login route
MySQL connection pool
Health check APIs
```

### 2. Logging

The backend uses **Pino** for structured application logging.

Implemented logging features:

```txt
Application startup logs
HTTP request logs
Response status logs
Database connection logs
Error logs
User context in logs when available
```

Sensitive fields such as password, password hash, token, cookies, and authorization headers are redacted.

### 3. Authentication

Implemented API:

```txt
POST /api/auth/login
```

Login flow:

```txt
Validate LOGINID and PASSWORD using Zod
Fetch user information using CMSLOGININFO stored procedure
Check whether user is active
Verify password using bcrypt
Fetch assigned roles
Fetch linked customer profile if available
Generate JWT token
Return user, roles, and customer information
```

### 4. JWT Authentication Middleware

Implemented middleware:

```txt
auth.middleware.js
```

Purpose:

```txt
Reads Bearer token from Authorization header
Verifies JWT token
Attaches decoded user details to req.user
Protects private APIs
```

### 5. Role-Based Access Control

Implemented middleware:

```txt
role.middleware.js
```

Purpose:

```txt
Checks whether logged-in user has required role
Restricts admin-only APIs
Prevents unauthorized access
```

---

## Database Connection

The backend connects to MySQL using `mysql2/promise`.

Implemented file:

```txt
backend/src/db/connection.js
```

Features:

```txt
MySQL connection pool
Async/await support
Database health test function
Stored procedure execution support
Prepared query support
```

---

## Database Setup

The database scripts are organized into:

```txt
database/schema/
database/procedures/
database/seed/
```

Recommended execution order:

```txt
1. schema/00_COMMON_SCHEMA.sql
2. schema/01_IDENTITY_ACCESS_SCHEMA.sql
3. schema/02_MENU_SERVICE_SCHEMA.sql

4. procedures/03_COMMON_PROCEDURES.sql
5. procedures/04_IDENTITY_ACCESS_PROCEDURES.sql
6. procedures/05_MENU_SERVICE_PROCEDURES.sql

7. seed/00_SEED_COMMON.sql
8. seed/01_SEED_IDENTITY_ACCESS.sql
9. seed/02_SEED_MENU_SERVICE.sql
```

---

## Environment Variables

Create a `.env` file inside the `backend/` folder.

Use `.env.example` as reference:

```env
NODE_ENV=development
PORT=8080
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=debug

DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=
JWT_EXPIRES_IN=1d
```

For WSL Ubuntu connecting to MySQL installed on Windows, `DB_HOST` may need to be the Windows host IP visible from WSL.

Example:

```env
DB_HOST=10.255.255.254
```

---

## API Documentation

Swagger UI is configured for interactive API documentation.

After starting the backend, open:

```txt
http://localhost:8080/api-docs
```

Swagger documentation currently includes:

```txt
Health APIs
Auth APIs
Common Master APIs
Identity and Access APIs
```

---

## Implemented APIs

### Health APIs

```txt
GET /health
GET /health/db
```

### Auth APIs

```txt
POST /api/auth/login
GET  /api/me
```

### Common Master APIs

```txt
GET /api/common/status
GET /api/common/customer-types
GET /api/common/screens
GET /api/common/autonos
```

### Identity APIs

```txt
GET  /api/identity/users
POST /api/identity/users

GET  /api/identity/roles
POST /api/identity/user-roles

GET  /api/identity/customers
POST /api/identity/customers

GET  /api/identity/approval-levels

POST /api/identity/permanent-employees
```

---

## Implemented Stored Procedures Used

The backend currently uses the following stored procedures:

```txt
CMSLOGININFO    Login user information
CMSADDUSER      Create user
CMSASSIGNROL    Assign role to user
CMSADDCUST      Create customer profile
CMSADDPERM      Create permanent employee profile
```

---

## Current Tested Flow

The following flow has been successfully tested:

```txt
1. Admin login using ADMIN01
2. JWT token generated successfully
3. Protected routes accessed using Bearer token
4. Admin creates a new user TEST001
5. Admin assigns FRONTOFF role to TEST001
6. TEST001 logs in successfully
7. Admin creates CMS_CUSTOMER profile for TEST001
8. Admin creates CMS_PERMEMP profile for TEST001
9. TEST001 login response returns user, role, and customer details
```

This confirms that the separation between `CMS_USER`, `CMS_USRROLE`, `CMS_CUSTOMER`, and `CMS_PERMEMP` is working.

---

## Sample Login Request

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "LOGINID": "ADMIN01",
    "PASSWORD": "Admin@123"
  }'
```

---

## Sample Protected API Request

```bash
curl http://localhost:8080/api/identity/users \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## Running the Backend

Move into backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Backend runs on:

```txt
http://localhost:8080
```

---

## Current Branch Status

```txt
Branch name: module1
Status: Backend Module 1 completed and tested
```

Completed:

```txt
Backend foundation
Database connection
Authentication
Authorization
Common master APIs
Identity APIs
Swagger documentation
```

---

## Pending Modules

The following modules are planned for future branches:

```txt
Menu and Service Management
Day Menu Submission
Day Menu Approval
Approved Menu View
Booking and Prebooking
Kiosk / Spot Orders
Wallet and Top-up
Payment Settlement
Salary Deduction
Official Request Workflow
Reports
Frontend Dashboards
```

---

## Next Planned Module

The next planned backend module is:

```txt
Module 2: Canteen Menu and Service Management
```

Planned APIs:

```txt
GET  /api/menu/services
GET  /api/menu/menu-items
GET  /api/menu/day-slots
GET  /api/menu/day-menus
GET  /api/menu/day-menus/pending

POST /api/menu/day-menus
PATCH /api/menu/day-menus/:id/approve
PATCH /api/menu/day-menus/:id/reject
GET /api/menu/approved?date=YYYY-MM-DD
```

---

## Security Notes

The project currently implements:

```txt
Password hashing using bcrypt
JWT-based authentication
Role-based authorization
Zod input validation
Helmet security headers
CORS configuration
Login rate limiting
Prepared SQL queries and stored procedure calls
Sensitive log redaction
Environment variable protection
```

The `.env` file must not be committed to GitHub.

---

## Git Branching Note

This branch represents the first backend module:

```txt
module1
```
next branch:

```txt
module2-menu-service
```

---

## Author

Developed as part of the ISRO Internal Canteen Management System backend implementation.
