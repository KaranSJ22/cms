# Schema: 03_BOOKING_SCHEMA.sql — Booking & Serving

> **Source File**: `database/schema/V1/03_BOOKING_SCHEMA.sql`  
> **Module**: 3 — Booking & Serving

---

## Overview

This schema defines the tables for managing bookings (Pre-bookings and Kiosk) and the serving workflow. It tracks booking headers, items, and their respective audit history.

---

## Tables

### CMS_BOOKTYPE

| Column      | Type          | Nullable | Default             | Constraints                |
|-------------|---------------|----------|---------------------|----------------------------|
| BOOKTYPEID  | INT AI        | NO       | —                   | PRIMARY KEY                |
| BOOKTYPECODE| VARCHAR(10)   | NO       | —                   | UNIQUE                     |
| BOOKTYPENAME| VARCHAR(50)   | NO       | —                   |                            |
| STATUS      | VARCHAR(20)   | NO       | 'A'                 | CHECK (STATUS IN ('A','D'))|
| CREATEDBY   | INT           | YES      | NULL                | FK → CMS_USER(USERID)      |
| CREATEDAT   | DATETIME      | NO       | CURRENT_TIMESTAMP   |                            |
| UPDATEDBY   | INT           | YES      | NULL                | FK → CMS_USER(USERID)      |
| UPDATEDAT   | DATETIME      | YES      | ON UPDATE           |                            |

**Purpose**: Booking type master. Known codes: `PB` (Pre-Booking), `KS` (Kiosk). 

---

### CMS_BOOKCTR

| Column      | Type          | Nullable | Default             | Constraints                |
|-------------|---------------|----------|---------------------|----------------------------|
| BOOKTYPEID  | INT           | NO       | —                   | PRIMARY KEY (Part 1), FK → CMS_BOOKTYPE(BOOKTYPEID) |
| SERVICEID   | INT           | NO       | —                   | PRIMARY KEY (Part 2), FK → CMS_SERVICE(SERVICEID)   |
| LASTNO      | BIGINT        | NO       | 0                   |                            |
| UPDATEDAT   | DATETIME      | YES      | ON UPDATE           |                            |

**Purpose**: Lifetime booking-number counter, scoped per booking type and service. Used for auto-generating booking numbers (e.g., `PB-BR001`).

---

### CMS_BOOKING

| Column      | Type          | Nullable | Default             | Constraints                |
|-------------|---------------|----------|---------------------|----------------------------|
| BOOKID      | INT AI        | NO       | —                   | PRIMARY KEY                |
| BOOKNO      | VARCHAR(30)   | NO       | —                   | UNIQUE                     |
| BOOKTYPEID  | INT           | NO       | —                   | FK → CMS_BOOKTYPE(BOOKTYPEID) |
| CUSTOMERID  | INT           | NO       | —                   | FK → CMS_CUSTOMER(CUSTOMERID) |
| SERVICEID   | INT           | NO       | —                   | FK → CMS_SERVICE(SERVICEID)   |
| SERVICEDATE | DATE          | NO       | —                   |                            |
| STATUS      | VARCHAR(10)   | NO       | 'CR'                | CHECK (STATUS IN ('CR','SRV','CAN','NOS','PRT')) |
| BOOKSEQNO   | BIGINT        | NO       | —                   |                            |
| TOTALITEMS  | INT           | NO       | 0                   | CHECK (TOTALITEMS >= 0)    |
| TOTALQTY    | INT           | NO       | 0                   | CHECK (TOTALQTY >= 0)      |
| TOTALAMOUNT | DECIMAL(12,2) | NO       | 0.00                | CHECK (TOTALAMOUNT >= 0)   |
| BOOKEDBY    | INT           | NO       | —                   | FK → CMS_USER(USERID)      |
| BOOKEDON    | DATETIME      | NO       | CURRENT_TIMESTAMP   |                            |
| CANCELLEDBY | INT           | YES      | NULL                | FK → CMS_USER(USERID)      |
| CANCELLEDON | DATETIME      | YES      | NULL                |                            |
| SERVEDBY    | INT           | YES      | NULL                | FK → CMS_USER(USERID)      |
| SERVEDON    | DATETIME      | YES      | NULL                |                            |
| NOSHOWON    | DATETIME      | YES      | NULL                |                            |
| REMARKS     | VARCHAR(255)  | YES      | NULL                |                            |
| CREATEDBY   | INT           | NO       | —                   | FK → CMS_USER(USERID)      |
| CREATEDAT   | DATETIME      | NO       | CURRENT_TIMESTAMP   |                            |
| UPDATEDBY   | INT           | YES      | NULL                | FK → CMS_USER(USERID)      |
| UPDATEDAT   | DATETIME      | YES      | ON UPDATE           |                            |

**Purpose**: Booking header table tracking overall status, totals, and timeline transitions. 

---

### CMS_BOOKITEM

| Column      | Type          | Nullable | Default             | Constraints                |
|-------------|---------------|----------|---------------------|----------------------------|
| BOOKITEMID  | INT AI        | NO       | —                   | PRIMARY KEY                |
| BOOKID      | INT           | NO       | —                   | UNIQUE KEY (BOOKID, DAYMENUID), FK → CMS_BOOKING(BOOKID) |
| DAYMENUID   | INT           | NO       | —                   | UNIQUE KEY (BOOKID, DAYMENUID), FK → CMS_DAYMENU(DAYMENUID) |
| MENUITEMID  | INT           | NO       | —                   | FK → CMS_MENUITEM(MENUITEMID)|
| QTY         | INT           | NO       | —                   | CHECK (QTY >= 1)           |
| RATE        | DECIMAL(10,2) | NO       | —                   | CHECK (RATE >= 0)          |
| AMOUNT      | DECIMAL(12,2) | NO       | —                   | CHECK (AMOUNT >= 0)        |
| REMARKS     | VARCHAR(255)  | YES      | NULL                |                            |
| CREATEDAT   | DATETIME      | NO       | CURRENT_TIMESTAMP   |                            |
| UPDATEDAT   | DATETIME      | YES      | ON UPDATE           |                            |
| STATUS      | VARCHAR(10)   | NO       | 'CR'                | CHECK (STATUS IN ('CR','SRV','CAN','NOS')) |

**Purpose**: Booking line items detailing which menu items were booked, their quantities, and their individual service statuses.

---

### CMS_PBACTIVE

| Column      | Type          | Nullable | Default             | Constraints                |
|-------------|---------------|----------|---------------------|----------------------------|
| CUSTOMERID  | INT           | NO       | —                   | PRIMARY KEY (Part 1), FK → CMS_CUSTOMER(CUSTOMERID) |
| SERVICEID   | INT           | NO       | —                   | PRIMARY KEY (Part 2), FK → CMS_SERVICE(SERVICEID)   |
| SERVICEDATE | DATE          | NO       | —                   | PRIMARY KEY (Part 3)       |
| BOOKID      | INT           | NO       | —                   | UNIQUE, FK → CMS_BOOKING(BOOKID) |
| CREATEDAT   | DATETIME      | NO       | CURRENT_TIMESTAMP   |                            |

**Purpose**: Concurrency guard table to enforce exactly one active pre-booking per customer/service/date.

---

### CMS_BOOKHIST

| Column      | Type          | Nullable | Default             | Constraints                |
|-------------|---------------|----------|---------------------|----------------------------|
| BOOKHISTID  | INT AI        | NO       | —                   | PRIMARY KEY                |
| BOOKID      | INT           | NO       | —                   | FK → CMS_BOOKING(BOOKID)   |
| BOOKNO      | VARCHAR(30)   | NO       | —                   |                            |
| BOOKTYPEID  | INT           | NO       | —                   |                            |
| CUSTOMERID  | INT           | NO       | —                   |                            |
| SERVICEID   | INT           | NO       | —                   |                            |
| SERVICEDATE | DATE          | NO       | —                   |                            |
| STATUS      | VARCHAR(10)   | NO       | —                   |                            |
| BOOKSEQNO   | BIGINT        | NO       | —                   |                            |
| TOTALITEMS  | INT           | NO       | —                   |                            |
| TOTALQTY    | INT           | NO       | —                   |                            |
| TOTALAMOUNT | DECIMAL(12,2) | NO       | —                   |                            |
| BOOKEDBY    | INT           | NO       | —                   |                            |
| BOOKEDON    | DATETIME      | NO       | —                   |                            |
| CANCELLEDBY | INT           | YES      | NULL                |                            |
| CANCELLEDON | DATETIME      | YES      | NULL                |                            |
| SERVEDBY    | INT           | YES      | NULL                |                            |
| SERVEDON    | DATETIME      | YES      | NULL                |                            |
| NOSHOWON    | DATETIME      | YES      | NULL                |                            |
| REMARKS     | VARCHAR(255)  | YES      | NULL                |                            |
| CREATEDBY   | INT           | NO       | —                   |                            |
| CREATEDAT   | DATETIME      | NO       | —                   |                            |
| UPDATEDBY   | INT           | YES      | NULL                |                            |
| UPDATEDAT   | DATETIME      | YES      | NULL                |                            |
| CHANGEDBY   | INT           | NO       | —                   | FK → CMS_USER(USERID)      |
| CHGREASON   | VARCHAR(255)  | YES      | NULL                |                            |
| CHANGEDAT   | DATETIME      | NO       | CURRENT_TIMESTAMP   |                            |

**Purpose**: Audit trail for booking headers. Records terminal state transitions (Cancel/Serve/No-Show/Partial Serve).

---

### CMS_BOOKITMHS

| Column      | Type          | Nullable | Default             | Constraints                |
|-------------|---------------|----------|---------------------|----------------------------|
| BOOKITMHSID | INT AI        | NO       | —                   | PRIMARY KEY                |
| BOOKHISTID  | INT           | NO       | —                   | FK → CMS_BOOKHIST(BOOKHISTID)|
| BOOKITEMID  | INT           | NO       | —                   |                            |
| DAYMENUID   | INT           | NO       | —                   | FK → CMS_DAYMENU(DAYMENUID)|
| MENUITEMID  | INT           | NO       | —                   | FK → CMS_MENUITEM(MENUITEMID)|
| QTY         | INT           | NO       | —                   |                            |
| RATE        | DECIMAL(10,2) | NO       | —                   |                            |
| AMOUNT      | DECIMAL(12,2) | NO       | —                   |                            |
| REMARKS     | VARCHAR(255)  | YES      | NULL                |                            |
| CHANGEDAT   | DATETIME      | NO       | CURRENT_TIMESTAMP   |                            |
| STATUS      | VARCHAR(10)   | NO       | 'CR'                | CHECK (STATUS IN ('CR','SRV','CAN','NOS')) |

**Purpose**: Audit trail for booking items. Finalized snapshot taken during terminal transitions.

---

## Dependencies

- Cross-module dependencies on Module 1 (`CMS_USER`, `CMS_CUSTOMER`).
- Cross-module dependencies on Module 2 (`CMS_SERVICE`, `CMS_DAYMENU`, `CMS_MENUITEM`).
