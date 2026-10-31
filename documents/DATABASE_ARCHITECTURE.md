# Database Architecture — CMS (Canteen Management System)

> **Source of Truth**: This document is derived exclusively from the normalized SQL files in `database/schema/`, `database/procedures/`, and `database/execution_order.txt`.  
> **Schema Rules**: Tables start with `CMS_` followed by an uppercase suffix of 10 characters or fewer (no underscores). Columns are uppercase alphanumeric (no underscores).

---

## 1. Database Engine

| Property       | Value            |
|---------------|------------------|
| RDBMS         | MySQL 8.0+ (InnoDB)|
| Database Name | `cms_db`         |
| Character Set | utf8mb4          |
| Collation     | utf8mb4_unicode_ci |

---

## 2. Schema Organisation

The schema is organized into 22 domain-driven SQL files executed in dependency order (specified in `database/execution_order.txt`):

| # | File | Module/Domain | Primary Tables / Views |
|---|------|---------------|------------------------|
| 1 | `STATUS_SCHEMA.sql` | Master status reference | `CMS_STATUS` |
| 2 | `AUTONO_SCHEMA.sql` | Auto-number generation | `CMS_AUTONOS` |
| 3 | `CUSTTYPE_SCHEMA.sql` | Customer type catalog | `CMS_CUSTTYPE` |
| 4 | `CENTER_SCHEMA.sql` | Centre facilities | `CMS_CENTER` |
| 5 | `USER_SCHEMA.sql` | Login accounts & credentials | `CMS_USER` |
| 6 | `ROLE_SCHEMA.sql` | Role master | `CMS_ROLE` |
| 7 | `SCREEN_SCHEMA.sql` | Screen / route definitions | `CMS_SCREEN` |
| 8 | `SCRNROLE_SCHEMA.sql` | Screen-to-Role RBAC permissions | `CMS_SCRNROLE` |
| 9 | `CANTEEN_SCHEMA.sql` | Canteen master | `CMS_CANTEEN` |
| 10 | `CANTEENROLE_SCHEMA.sql` | Canteen-scoped role assignments | `CMS_CANTEENROLE` |
| 11 | `CUSTOMER_SCHEMA.sql` | Customer base identity | `CMS_CUSTOMER` |
| 12 | `EMPLOYEES_VISITOR_SCHEMA.sql` | Profiles (Perm, Cont, OCE, Visitor) | `CMS_PERMEMP`, `CMS_CONTEMP`, `CMS_OCEEMP`, `CMS_VISITOR` |
| 13 | `ACCESSKEY_SCHEMA.sql` | RFID / QR / Kiosk access keys | `CMS_ACCKEY` |
| 14 | `SERVICE_SCHEMA.sql` | Service catalog (Breakfast, Lunch, etc.) | `CMS_SERVICE`, `CMS_SERVHIST` |
| 15 | `USERROLE_SCHEMA.sql` | System-wide user role assignments | `CMS_USERROLE` |
| 16 | `MENUITEM_PRICE_SCHEMA.sql` | Menu items & effective-date pricing | `CMS_MENUITEM`, `CMS_MENUHIST`, `CMS_ITEMPRICE`, `CMS_ITMPRICDT` |
| 17 | `DAYSLOT_SCHEMA.sql` | Daily operational meal slots | `CMS_DAYSLOT`, `CMS_SLOTHIST` |
| 18 | `DAYMENU_SCHEMA.sql` | Day-wise published menus | `CMS_DAYMENU`, `CMS_DMENUHIST` |
| 19 | `MENUTEMPLATE_SCHEMA.sql` | Recurring menu templates | `CMS_MENUTPL`, `CMS_MENUTPLDT` |
| 20 | `KIOSK_SCHEMA.sql` | Physical hardware kiosks | `CMS_KIOSK` |
| 21 | `BOOKING_SCHEMA.sql` | Pre-booking, kiosk, walk-in orders | `CMS_BOOKTYPE`, `CMS_BOOKCTR`, `CMS_BOOKING`, `CMS_BOOKITEM`, `CMS_BOOKHIST`, `CMS_BOOKITMHST`, `CMS_PBACTIVE` |
| 22 | `WALLET_SCHEMA.sql` | Customer wallet & transaction ledger | `CMS_WALLET`, `CMS_WALLETTRAN`, `CMS_WALLETWD` |
| 23 | `OFFICIAL_REQUEST_SCHEMA.sql` | Official meeting catering & approvals | `CMS_OFFSERV`, `CMS_OFFCOMBO`, `CMS_OFFCOMBDT`, `CMS_OFFBOOK`, `CMS_OFFAPPR`, `CMS_OFFBOOKCTR`, `CMS_LVLMAP` |
| 24 | `HOLIDAY_SCHEMA.sql` | Facility holiday calendar | `CMS_HOLIDAY` |
| 25 | `COMPATIBILITY_VIEWS.sql` | Zero-downtime backward-compatibility views | `CMS_CONSUMERROLE`, `CMS_KIOSK_DEVICE`, `CMS_ITEMPRICEDT`, `CMS_OFFCOMBO_ITEM`, `CMS_BOOKITMHS`, `CMS_ROLESCN` |

---

## 3. Complete Table & View Inventory

### Common & Master Config
- **`CMS_STATUS`**: System-wide status lookup table (partitioned by `STATUSGRP`).
- **`CMS_AUTONOS`**: Auto-number sequencing table with audit metadata.
- **`CMS_CUSTTYPE`**: Customer types (`PRM`, `CNT`, `OCE`, `VIS`, `OFF`).
- **`CMS_SCREEN`**: Screen/view path definitions for UI navigation and RBAC.
- **`CMS_SCRNROLE`**: Role-to-Screen permission map (with `CMS_ROLESCN` compatibility view).
- **`CMS_HOLIDAY`**: System-wide facility holidays.

### Identity & Facilities
- **`CMS_CENTER`**: Centre facility master.
- **`CMS_CANTEEN`**: Canteen master scoped under a Centre.
- **`CMS_USER`**: Authentication login identity (local/SSO).
- **`CMS_ROLE`**: System roles (`SYSADM`, `CNTMGR`, `CNTAST`, `CNTSTF`, etc.).
- **`CMS_USERROLE`**: System-wide user role assignments (with `CMS_CONSUMERROLE` compatibility view).
- **`CMS_CANTEENROLE`**: Canteen-scoped operational role assignments.
- **`CMS_CUSTOMER`**: Canteen customer identity linked to `CMS_USER`.
- **`CMS_PERMEMP`**: Permanent employee profile (`EMPLEVEL`, `DEPT`, `DESIG`).
- **`CMS_CONTEMP`**: Contract worker profile with vendor and validity dates.
- **`CMS_OCEEMP`**: Other centre employee profile.
- **`CMS_VISITOR`**: Visitor profile (`MOBILENO`, `VISORG`, `VISPURPOSE`).
- **`CMS_ACCKEY`**: Hardware credentials (RFID UID, QR tokens).
- **`CMS_KIOSK`**: Physical kiosk terminal registry (with `CMS_KIOSK_DEVICE` compatibility view).

### Menu, Pricing & Templates
- **`CMS_SERVICE`**, **`CMS_SERVHIST`**: Canteen meal service catalogue and audit log.
- **`CMS_MENUITEM`**, **`CMS_MENUHIST`**: Menu item master (`DESCR`, `ISOFFSER`) and audit log.
- **`CMS_ITEMPRICE`**, **`CMS_ITMPRICDT`**: Type-2 SCD effective-date price bands and per-customer-type rates (with `CMS_ITEMPRICEDT` compatibility view).
- **`CMS_DAYSLOT`**, **`CMS_SLOTHIST`**: Daily meal window instances (`SERVICEDATE`, `STARTTIME`, `ENDTIME`) and audit.
- **`CMS_DAYMENU`**, **`CMS_DMENUHIST`**: Published menu items for a day-slot and audit log.
- **`CMS_MENUTPL`**, **`CMS_MENUTPLDT`**: Recurring menu template headers and component dishes.

### Bookings & Concurrency
- **`CMS_BOOKTYPE`**: Booking channels (`PB` = Pre-Booking, `KS` = Kiosk, `WI` = Walk-in).
- **`CMS_BOOKCTR`**: High-performance booking number sequence generator.
- **`CMS_BOOKING`**, **`CMS_BOOKHIST`**: Header and transition audit log (`BOOKEDAT`, `SERVEDAT`, `CANCELLEDAT`, `NOSHOWAT`).
- **`CMS_BOOKITEM`**, **`CMS_BOOKITMHST`**: Line items and line audit log (with `CMS_BOOKITMHS` compatibility view).
- **`CMS_PBACTIVE`**: Concurrency guard enforcing one active booking per customer/service/date.

### Wallet Ledger
- **`CMS_WALLET`**: Account balance header for contract workers and visitors.
- **`CMS_WALLETTRAN`**: Double-entry ledger (`BOOKID`, `AMOUNT`, `BALAFTER`, `STATUSID`).
- **`CMS_WALLETWD`**: User withdrawal request lifecycle.

### Official Meeting Catering & Workflow
- **`CMS_OFFSERV`**: Specialized official service catalog (Meeting Tea, High Tea, VIP Lunch).
- **`CMS_OFFCOMBO`**: Packaged meal combo definition (`COMBOPRICE = GROSSPRICE + HANDLINGCHARGE`).
- **`CMS_OFFCOMBDT`**: Dishes bundled inside an official combo (with `CMS_OFFCOMBO_ITEM` compatibility view).
- **`CMS_OFFBOOK`**, **`CMS_OFFBOOKCTR`**: Official booking requests and sequence counter.
- **`CMS_OFFAPPR`**: Multi-tiered approval log (`ACTIONCODE`, `REMARKS`, `ACTIONAT`).
- **`CMS_LVLMAP`**: Employee level to approval tier mapping (`EMPLEVEL` -> `APPRLVL`).

---

## 4. Key Design Patterns & Normalized Rules

### 4.1 Schema Normalization Compliance
- **Table Name Length**: All tables strictly use the `CMS_` prefix followed by 10 characters or fewer without underscores (`CMS_USERROLE`, `CMS_ITMPRICDT`, `CMS_KIOSK`, `CMS_OFFCOMBDT`, `CMS_BOOKITMHST`, `CMS_SCRNROLE`).
- **No Keyword Collisions**: Columns avoid reserved MySQL keywords (e.g. `EMPLEVEL` instead of `LEVEL`, `ACTIONCODE` instead of `ACTION`).
- **Uniform Timestamps & Audit**:
  - Timestamp columns consistently use the `...AT` suffix (`CREATEDAT`, `UPDATEDAT`, `BOOKEDAT`, `SERVEDAT`, `CANCELLEDAT`, `NOSHOWAT`).
  - Standard audit columns (`CREATEDBY`, `CREATEDAT`, `UPDATEDBY`, `UPDATEDAT`) are present on all core tables.
- **Consistent Field Naming**:
  - `SERVICEDATE` is used uniformly across `CMS_DAYSLOT`, `CMS_BOOKING`, `CMS_PBACTIVE`, and `CMS_OFFBOOK`.
  - `BOOKID` is used consistently as the foreign key in `CMS_BOOKITEM`, `CMS_BOOKHIST`, `CMS_WALLETTRAN`, and `CMS_PBACTIVE`.
  - `MOBILENO` is used across both `CMS_USER` and `CMS_VISITOR`.
  - `DESCR` is standard for descriptions across `CMS_MENUITEM`, `CMS_ROLE`, `CMS_OFFCOMBO`, and `CMS_STATUS`.

### 4.2 Zero-Downtime Compatibility Layer (`COMPATIBILITY_VIEWS.sql`)
To ensure complete backward compatibility with external scripts, legacy reporting queries, and client tools, compatibility SQL views are maintained:
- `CMS_CONSUMERROLE` → mapped to `CMS_USERROLE`
- `CMS_KIOSK_DEVICE` → mapped to `CMS_KIOSK`
- `CMS_ITEMPRICEDT` → mapped to `CMS_ITMPRICDT`
- `CMS_OFFCOMBO_ITEM` → mapped to `CMS_OFFCOMBDT`
- `CMS_BOOKITMHS` → mapped to `CMS_BOOKITMHST`
- `CMS_ROLESCN` → mapped to `CMS_SCRNROLE`

### 4.3 Dual-Aliased Stored Procedures & API Layer
All stored procedures in `database/procedures/` and backend query mappers provide dual aliasing on output result sets:
- Timestamps: Returns both `BOOKEDAT` and `BOOKEDON`, `SERVEDAT` and `SERVEDON`, `CANCELLEDAT` and `CANCELLEDON`.
- Primary keys: Returns both `ITMPRICDTID` and `ITEMPRICEDTID`, `OFFCOMBDTID` and `COMBOITEMID`.
- Columns: Returns both `DESCR` and `ITEMDESCR`, `ISOFFSER` and `OFFSER`, `SERVICEDATE` and `SERVDATE`.

---

## 5. Stored Procedure Organization

Stored procedures are modularized in `database/procedures/` by domain:
- `accesskey/`: Access key generation, validation, and deactivation.
- `booking/`: Pre-booking, kiosk, cancellations, serving, no-show sweeps.
- `canteen/`: Centre and canteen management.
- `canteenrole/`: Canteen manager and staff role mappings.
- `common/`: Master status, auto-numbers, customer types.
- `customer/`: Customer lifecycle and profiles (Perm, Cont, OCE, Visitor).
- `daymenu/`: Day menu publishing, locking, and approval workflow.
- `dayslot/`: Day slot scheduling and capacity enforcement.
- `identity/`: User authentication, roles (`CMSASSIGNUSERROLE`, `CMSLISTUSERROL`).
- `kiosk/`: Kiosk device registration, heartbeat, scanning, offline sync.
- `menuitem/`: Menu item catalog and SCD Type-2 effective pricing.
- `menutemplate/`: Recurring weekly menu templates.
- `officialrequest/`: Official catering, combos, multi-tier approvals.
- `reporting/`: Serving manifests, kitchen prep sheets, consumption logs.
- `wallet/`: Ledger top-ups, debits, holds, refunds, and withdrawals.