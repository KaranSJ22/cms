# ISRO Internal Canteen Management System

## Modules: Backend Foundation, Identity, Menu & Service, Booking, and Wallet

This repository contains the backend implementation for the **ISRO Internal Canteen Management System (CMS)**.

The current branch includes the foundational backend setup along with identity management, menu & service management, bookings, and wallet payments.

---

## Project Overview

The ISRO Internal Canteen Management System is designed to manage canteen users, access control, service/menu configuration, day-wise menu availability, bookings, and wallet transactions.

The system follows a modular and scalable design suitable for an organizational environment.

The database design separates:

- `CMS_USER` — login identity
- `CMS_CUSTOMER` — canteen identity
- `CMS_USRROLE` — role assignment
- Employee-specific profile tables such as `CMS_PERMEMP`, `CMS_CONTEMP`, and `CMS_OCEEMP`

This separation allows a person to be only a system user, only a canteen customer, or both.

---

## Current Scope

This backend implementation includes:

```txt
Backend foundation
Authentication & JWT authorization
Role-based access control
Common master APIs
Identity and access read/write APIs
User and Profile creation
Menu and Service Management
Day Slot and Day Menu Management
Booking and Prebooking APIs
Wallet and Top-up APIs
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
│   │   ├── db/
│   │   ├── docs/
│   │   ├── middlewares/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── booking/
│   │   │   ├── common/
│   │   │   ├── daymenu/
│   │   │   ├── dayslot/
│   │   │   ├── identity/
│   │   │   ├── menu/
│   │   │   ├── pricing/
│   │   │   ├── service/
│   │   │   └── wallet/
│   │   ├── routes/
│   │   │   └── index.routes.js
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── database/
│   ├── schema/
│   ├── procedures/V1/
│   └── seed/
│
├── frontend/
├── Document/
├── ERD/
└── README.md
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

---

## Database Setup

The database scripts are organized into:

```txt
database/schema/
database/procedures/V1/
database/seed/
```

Recommended execution order for procedures (after schemas):

```txt
1. 00_COMMON_PROCEDURES.sql
2. 01_IDENTITY_ACCESS_PROCEDURES.sql
3. 02_MENU_SERVICE_PROCEDURES.sql
4. 03_BOOKING_PROCEDURES.sql
5. 04_WALLET_PROCEDURES.sql
```

---

## Implemented APIs

The backend has functional routes for the following domains (view complete endpoints in Swagger at `/api-docs`):

### Core & Identity
- **Health:** System health and DB checks
- **Auth:** Login (`/api/auth/login`) and current user (`/api/me`)
- **Common:** Master data, screens, status, customer types
- **Identity:** Users, roles, customers, and employee profiles

### Menu & Services
- **Services:** Manage canteen services
- **Menu Items:** Manage individual menu items
- **Pricing:** Dynamic pricing rules
- **Day Slots:** Manage operating slots per day
- **Day Menus:** Day-wise menu assignments and approvals

### Bookings & Wallet
- **Bookings:** Make bookings, fetch booking history
- **Wallets:** Topups, wallet balance, and transactions

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
