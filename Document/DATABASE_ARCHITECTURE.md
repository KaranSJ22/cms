# Database Architecture — CMS (Canteen Management System)

> **Source of Truth**: This document is derived exclusively from the SQL files in `database/schema/V1/` and `database/procedures/V1/`.  
> **Constraint**: No assumptions have been made. All information is taken from the schema definitions.

---

## 1. Database Engine

| Property       | Value            |
|---------------|------------------|
| RDBMS         | MySQL (InnoDB)   |
| Database Name | `cms_db`         |
| Character Set | Server default   |
| Versioning    | Flyway-style `V1/` prefix directories |

---

## 2. Schema Organisation

The schema is organized into **four modules**, each in a separate SQL file:

| File                                | Module | Tables Created |
|------------------------------------|--------|----------------|
| `00_COMMON_SCHEMA.sql`             | 0 — Common Master & System Config | 4 tables |
| `01_IDENTITY_ACCESS_SCHEMA.sql`    | 1 — Identity & Access Management | 14 tables |
| `02_MENU_SERVICE_SCHEMA.sql`       | 2 — Canteen Menu & Service | 10 tables + 1 trigger |
| `03_BOOKING_SCHEMA.sql`            | 3 — Booking & Serving | 7 tables |

---

## 3. Complete Table Inventory

### Module 0 — Common Master & System Config

| Table           | PK             | Purpose                                       |
|----------------|----------------|-----------------------------------------------|
| `CMS_STATUS`   | `STATUSID`     | System-wide status lookup (code + group)       |
| `CMS_CUSTTYPE` | `CTYPEID`      | Customer type master (PERMANENT, CONTRACT, etc.) |
| `CMS_SCREEN`   | `SCREENID`     | Application screen/route configuration         |
| `CMS_AUTONOS`  | `AUTONOID`     | Auto-number generation configuration           |

### Module 1 — Identity & Access Management

| Table              | PK              | Purpose                                              |
|-------------------|-----------------|------------------------------------------------------|
| `CMS_CENTER`      | `CENTERID`      | ISRO centre master                                    |
| `CMS_CANTEEN`     | `CANTEENID`     | Canteen master, scoped under a centre                 |
| `CMS_USER`        | `USERID`        | System user accounts (login credentials)              |
| `CMS_ROLE`        | `ROLEID`        | Role master (ADMIN, MANAGER, STAFF, etc.)             |
| `CMS_CONSUMERROLE`| `USRROLEID`     | System-wide (consumer) user–role assignments          |
| `CMS_CANTEENROLE` | `USRCANROLEID`  | Canteen-scoped user–role assignments                  |
| `CMS_ROLESCN`     | `ROLESCNID`     | Role-to-screen permission mapping (CRUD permissions)  |
| `CMS_CUSTOMER`    | `CUSTOMERID`    | Customer identity (linked to user, typed by CTYPECODE)|
| `CMS_PERMEMP`     | `PERMEMPID`     | Permanent employee profile                            |
| `CMS_CONTEMP`     | `CONTEMPID`     | Contract employee profile                             |
| `CMS_OCEEMP`      | `OCEEMPID`      | Other centre employee profile                         |
| `CMS_VISITOR`     | `VISITORID`     | Visitor profile                                       |
| `CMS_ACCKEY`      | `ACCKEYID`      | Access key/credential for kiosk/QR/RFID               |
| `CMS_APPLVL`      | `APPLVLID`      | Approval level configuration                          |

### Module 2 — Canteen Menu & Service

| Table             | PK              | Purpose                                              |
|------------------|-----------------|------------------------------------------------------|
| `CMS_SERVICE`    | `SERVICEID`     | Canteen-scoped service catalog (Breakfast, Lunch)     |
| `CMS_SERVHIST`   | `SERVHISTID`    | Service change history (audit trail)                  |
| `CMS_MENUITEM`   | `MENUITEMID`    | Shared menu item catalog (no price columns)           |
| `CMS_MENUHIST`   | `MENUHISTID`    | Menu item change history                              |
| `CMS_ITEMPRICE`  | `ITEMPRICEID`   | Price band header (effective-date SCD style)          |
| `CMS_ITEMPRICEDT`| `ITEMPRICEDTID` | Price per customer type within a price band           |
| `CMS_DAYSLOT`    | `DAYSLOTID`     | Dated service instance (specific day + time window)   |
| `CMS_SLOTHIST`   | `SLOTHISTID`    | Day slot change history                               |
| `CMS_DAYMENU`    | `DAYMENUID`     | Menu item offered on a specific day-slot              |
| `CMS_DMENUHIST`  | `DMENUHISTID`   | Day menu change history                               |
| `CMS_MENUTPL`    | `MENUTPLID`     | Recurring menu template header                        |
| `CMS_MENUTPLDT`  | `MENUTPLDTID`   | Template detail (item defaults)                       |

### Module 3 — Booking & Serving

| Table             | PK              | Purpose                                              |
|------------------|-----------------|------------------------------------------------------|
| `CMS_BOOKTYPE`   | `BOOKTYPEID`    | Booking type master (PB = Pre-Book, KS = Kiosk)      |
| `CMS_BOOKCTR`    | `(BOOKTYPEID, SERVICEID)` | Lifetime booking number counter          |
| `CMS_BOOKING`    | `BOOKID`        | Booking header                                        |
| `CMS_BOOKITEM`   | `BOOKITEMID`    | Booking line items (day menu + qty + rate)             |
| `CMS_PBACTIVE`   | `(CUSTOMERID, SERVICEID, SERVICEDATE)` | Concurrency guard for one active PB per customer/service/date |
| `CMS_BOOKHIST`   | `BOOKHISTID`    | Booking header history (terminal transitions)         |
| `CMS_BOOKITMHS`  | `BOOKITMHSID`   | Booking item history                                  |

---

## 4. Key Design Patterns

### 4.1 History/Audit Tables (`*HIST` suffix)

Most entity tables have a companion `*HIST` table that stores a full snapshot of the row before each change. This pattern is used for:
- `CMS_SERVHIST` (service changes)
- `CMS_MENUHIST` (menu item changes)
- `CMS_SLOTHIST` (day slot changes)
- `CMS_DMENUHIST` (day menu changes)
- `CMS_BOOKHIST` / `CMS_BOOKITMHS` (booking terminal transitions)

History rows include `CHANGEDBY`, `CHANGEDAT`, and `CHGREASON` columns.

### 4.2 Effective-Date Pricing (Type-2 SCD)

Menu item pricing uses a **Slowly Changing Dimension Type-2** pattern:
- `CMS_ITEMPRICE` stores the header with `MENUITEMID` and `EFFFROM` (effective date).
- `CMS_ITEMPRICEDT` stores per-customer-type prices within each price band.
- No `EFFUNTIL` column — the end of a price band is implied by the `EFFFROM` of the next active row.
- Price resolution: find the latest active `EFFFROM <= serviceDate` for a given `(MENUITEMID, CTYPECODE)`.

### 4.3 Auto-Number Generation

`CMS_AUTONOS` stores auto-number configuration (prefix, length, last number). The `CMSGENAUTO` stored procedure increments the counter under a `FOR UPDATE` lock within the caller's transaction.

### 4.4 Status Pattern

Most tables use a `STATUS` column with check constraints:
- `'A'` = Active, `'D'` = Deactivated/Disabled
- Some tables use `ISACTIVE` (TINYINT 0/1) instead
- `CMS_DAYMENU` has dual status: `STATUS` (operational A/D) + `APPRSTATUS` (approval PEN/APP/REJ)
- `CMS_BOOKING`: `'CR'` (Created), `'SRV'` (Served), `'CAN'` (Cancelled), `'NOS'` (No-Show), `'PRT'` (Partially Served)

### 4.5 Concurrency Guard — `CMS_PBACTIVE`

MySQL lacks partial unique indexes. To enforce "one active pre-booking per customer/service/date", the system uses a separate `CMS_PBACTIVE` table. A row is inserted atomically during `CMSADDBOOK` (PB type), and deleted during `CMSCANCELBOOK`.

---

## 5. Foreign Key Relationships (Major)

```
CMS_CENTER ──┬── CMS_CANTEEN ──┬── CMS_SERVICE ──── CMS_DAYSLOT ──── CMS_DAYMENU
              │                  │                                        │
              │                  └── CMS_CANTEENROLE                     │
              │                                                          │
CMS_USER ────┼── CMS_CONSUMERROLE                                       │
              │                                                          │
              └── CMS_CUSTOMER ──┬── CMS_PERMEMP                   CMS_BOOKING
                                  ├── CMS_CONTEMP                       │
                                  ├── CMS_OCEEMP                   CMS_BOOKITEM
                                  ├── CMS_VISITOR
                                  └── CMS_ACCKEY

CMS_MENUITEM ──┬── CMS_ITEMPRICE ── CMS_ITEMPRICEDT
                ├── CMS_DAYMENU
                ├── CMS_MENUTPLDT
                └── CMS_BOOKITEM

CMS_ROLE ──┬── CMS_CONSUMERROLE
            ├── CMS_CANTEENROLE
            ├── CMS_ROLESCN
            └── CMS_APPLVL

CMS_CUSTTYPE ──── CMS_CUSTOMER
                   CMS_ITEMPRICEDT
```

---

## 6. Trigger Inventory

| Trigger                    | Table          | Event          | Purpose                                                           |
|---------------------------|----------------|----------------|-------------------------------------------------------------------|
| `TRG_DAYMENU_APPR_RESET` | `CMS_DAYMENU`  | `BEFORE UPDATE`| If an approved row's AVAILQTY/MAXQTY/ISSPECIAL/ISPREBOOK/ISKIOSK changes, resets APPRSTATUS back to 'PEN' and clears APPROVEDBY/APPROVEDAT |

---

## 7. Stored Procedure Organization

| File                                   | Module | Procedure Count | Coverage                              |
|---------------------------------------|--------|-----------------|---------------------------------------|
| `03_COMMON_PROCEDURES.sql`            | 0      | 20              | Status, CustType, Screen, RoleSCN, AutoNo |
| `04_IDENTITY_ACCESS_PROCEDURES.sql`   | 1      | 55+             | Center, Canteen, User, Role, ConsumerRole, CanteenRole, Customer, PermEmp, ContEmp, OceEmp, Visitor, AccKey, ApplvLevel, LoginInfo, Composite Registration |
| `05_MENU_SERVICE_PROCEDURES.sql`      | 2      | 40+             | Service, MenuItem, ItemPrice, DaySlot, DayMenu, MenuTemplate, ApprInst/ApprStep, ViewMenu |
| `06_BOOKING_PROCEDURES.sql`           | 3      | 6               | AddBook, UpdBookItem, CancelBook, ServeBook, NoShowBook, ToggleKiosk |

---

## 8. Seed Data

| File                                 | Contents                                                      |
|-------------------------------------|---------------------------------------------------------------|
| `00_SEED_COMMON.sql`               | Statuses, customer types, screens, auto-number configs         |
| `01_SEED_IDENTITY_ACCESS.sql`       | Centres, canteens, users, roles, role assignments, customers   |
| `02_SEED_MENU_SERVICE.sql`          | Services, menu items, day slots, day menus                     |

---

## 9. ERD

An ERD directory exists at `database/ERD/` for visual entity-relationship diagrams.
