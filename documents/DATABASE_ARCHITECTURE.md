# Database Architecture — CMS (Canteen Management System)

> **Source of Truth**: This document is derived exclusively from the SQL files in `database/schema/` and `database/procedures/`.  
> **Constraint**: No assumptions have been made. All information is taken from the schema definitions.

---

## 1. Database Engine

| Property       | Value            |
|---------------|------------------|
| RDBMS         | MySQL (InnoDB)   |
| Database Name | `cms_db`         |
| Character Set | Server default   |

---

## 2. Schema Organisation

The schema is now modularised into specific domain-driven SQL files located in `database/schema/`:

| File | Module/Domain |
|------|---------------|
| `ACCESSKEY_SCHEMA.sql` | Access Keys (RFID/QR/Kiosk) |
| `BOOKING_SCHEMA.sql` | Booking management (Pre-book, Kiosk) |
| `CANTEENROLE_SCHEMA.sql` | Canteen-scoped roles |
| `CANTEEN_SCHEMA.sql` | Canteen master |
| `CENTER_SCHEMA.sql` | Center master |
| `COMMON_SCHEMA.sql` | Master statuses, auto numbers, customer types, screens |
| `CONSUMERROLE_SCHEMA.sql` | System-wide consumer roles |
| `CUSTOMER_SCHEMA.sql` | Customer base identity |
| `DAYMENU_SCHEMA.sql` | Day-wise menu assignments |
| `DAYSLOT_SCHEMA.sql` | Operating slots per day |
| `EMPLOYEES_VISITOR_SCHEMA.sql` | Employee (Perm, Cont, OCE) and Visitor profiles |
| `HOLIDAY_SCHEMA.sql` | System-wide holidays |
| `MENUITEM_PRICE_SCHEMA.sql` | Menu items and effective-date pricing |
| `MENUTEMPLATE_SCHEMA.sql` | Recurring menu templates |
| `ROLE_SCHEMA.sql` | Role master |
| `SERVICE_SCHEMA.sql` | Canteen service catalogue (Breakfast, Lunch, etc.) |
| `USER_SCHEMA.sql` | Login identity |
| `WALLET_SCHEMA.sql` | Wallet transactions and withdrawals |

---

## 3. Complete Table Inventory

### Common & Master Config
- **`CMS_STATUS`**: System-wide status lookup.
- **`CMS_AUTONOS`**: Auto-number generation configuration.
- **`CMS_CUSTTYPE`**: Customer type master.
- **`CMS_SCREEN`**: Screen and route path configuration for RBAC.
- **`CMS_HOLIDAY`**: System-wide holidays.

### Identity & Access
- **`CMS_CENTER`**: ISRO centre master.
- **`CMS_CANTEEN`**: Canteen master (scoped under centre).
- **`CMS_USER`**: System user accounts (login).
- **`CMS_ROLE`**: Role master.
- **`CMS_CONSUMERROLE`**: System-wide user–role assignments.
- **`CMS_CANTEENROLE`**: Canteen-scoped user–role assignments.
- **`CMS_CUSTOMER`**: Customer identity (linked to user).
- **`CMS_PERMEMP`**: Permanent employee profile.
- **`CMS_CONTEMP`**: Contract employee profile.
- **`CMS_OCEEMP`**: Other centre employee profile.
- **`CMS_VISITOR`**: Visitor profile.
- **`CMS_ACCKEY`**: Access key/credential for kiosk/QR/RFID.

### Menu & Service
- **`CMS_SERVICE`**, **`CMS_SERVHIST`**: Canteen service catalog and audit.
- **`CMS_MENUITEM`**, **`CMS_MENUHIST`**: Shared menu item catalog and audit.
- **`CMS_ITEMPRICE`**, **`CMS_ITEMPRICEDT`**: Price bands and per-customer-type prices.
- **`CMS_DAYSLOT`**, **`CMS_SLOTHIST`**: Dated service instances (day + time window) and audit.
- **`CMS_DAYMENU`**, **`CMS_DMENUHIST`**: Menu items assigned to a day-slot and audit.
- **`CMS_MENUTPL`**, **`CMS_MENUTPLDT`**: Recurring menu template headers and details.

### Booking
- **`CMS_BOOKTYPE`**: Booking type master.
- **`CMS_BOOKCTR`**: Booking number counter.
- **`CMS_BOOKING`**, **`CMS_BOOKHIST`**: Booking header and audit transitions.
- **`CMS_BOOKITEM`**, **`CMS_BOOKITMHS`**: Booking line items and audit.
- **`CMS_PBACTIVE`**: Concurrency guard for pre-bookings.

### Wallet
- **`CMS_WALLET`**: Wallet header (balance).
- **`CMS_WALLETTRAN`**: Transaction ledger.
- **`CMS_WALLETWD`**: Withdrawal requests.

---

## 4. Key Design Patterns

### 4.1 History/Audit Tables (`*HIST` suffix)
Most entity tables have a companion `*HIST` table that stores a full snapshot of the row before each change. History rows include `CHANGEDBY`, `CHANGEDAT`, and `CHGREASON` columns.

### 4.2 Effective-Date Pricing (Type-2 SCD)
Menu item pricing uses a **Slowly Changing Dimension Type-2** pattern:
- `CMS_ITEMPRICE` stores the header with `EFFFROM`.
- `CMS_ITEMPRICEDT` stores per-customer-type prices within that price band.
- Price resolution finds the latest active `EFFFROM <= serviceDate`.

### 4.3 Auto-Number Generation
`CMS_AUTONOS` stores auto-number configuration. The `CMSGENAUTO` stored procedure increments the counter under a `FOR UPDATE` lock within the caller's transaction.

### 4.4 Status Pattern
Most tables use a `STATUSID` (referencing `CMS_STATUS`) or a `STATUSCODE`. `CMS_DAYMENU` also utilizes an `APPRSTATUS` for approval tracking (PEN, APP, REJ).

### 4.5 Concurrency Guard — `CMS_PBACTIVE`
To enforce "one active pre-booking per customer/service/date", a row is inserted atomically during booking (`CMS_PBACTIVE`) and deleted upon cancellation.

---

## 5. Stored Procedure Organization

The stored procedures are logically split into corresponding domain files in `database/procedures/`:
- `ACCESSKEY_PROCEDURES.sql`
- `BOOKING_PROCEDURES.sql`
- `CANTEENROLE_PROCEDURES.sql`
- `CANTEEN_PROCEDURES.sql`
- `CENTER_PROCEDURES.sql`
- `COMMON_PROCEDURES.sql`
- `CONSUMERROLE_PROCEDURES.sql`
- `CUSTOMER_PROCEDURES.sql`
- `DAYMENU_PROCEDURES.sql`
- `DAYSLOT_PROCEDURES.sql`
- `EMPLOYEES_VISITOR_PROCEDURES.sql`
- `HOLIDAY_PROCEDURES.sql`
- `LOOKUP_PROCEDURES.sql`
- `MENUITEM_PRICE_PROCEDURES.sql`
- `MENUTEMPLATE_PROCEDURES.sql`
- `REPORTING_SERVING_PROCEDURES.sql`
- `ROLE_PROCEDURES.sql`
- `SERVICE_PROCEDURES.sql`
- `USER_PROCEDURES.sql`
- `WALLET_PROCEDURES.sql`

Each procedure handles CRUD and specific domain logic while preserving historical data.