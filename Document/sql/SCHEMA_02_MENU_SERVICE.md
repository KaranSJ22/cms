# Schema: 02_MENU_SERVICE_SCHEMA.sql — Canteen Menu & Service

> **Source File**: `database/schema/V1/02_MENU_SERVICE_SCHEMA.sql`  
> **Module**: 2 — Canteen Menu & Service

---

## Overview

This schema defines the canteen service catalog, shared menu item catalog, effective-date pricing, dated service instances (day slots), day menu offerings with dual-status (operational + approval), and reusable menu templates.

---

## Tables

### CMS_SERVICE

| Column    | Type          | Nullable | Default             | Constraints                                        |
|-----------|---------------|----------|---------------------|----------------------------------------------------|
| SERVICEID | INT AI        | NO       | —                   | PRIMARY KEY                                        |
| CANTEENID | INT           | NO       | —                   | FK → CMS_CANTEEN, UNIQUE (CANTEENID, SERVCODE)    |
| SERVCODE  | VARCHAR(20)   | NO       | —                   |                                                    |
| SERVNAME  | VARCHAR(80)   | NO       | —                   |                                                    |
| DEFSTART  | TIME          | NO       | —                   |                                                    |
| DEFEND    | TIME          | NO       | —                   | CHECK (DEFEND > DEFSTART)                          |
| STATUS    | VARCHAR(20)   | NO       | 'A'                 | CHECK ('A','D')                                    |
| CREATEDBY | INT           | NO       | —                   | FK → CMS_USER                                      |
| CREATEDAT | DATETIME      | NO       | CURRENT_TIMESTAMP   |                                                    |
| UPDATEDAT | DATETIME      | YES      | ON UPDATE           |                                                    |

**Purpose**: Canteen-scoped service catalog (e.g., Breakfast, Lunch, Snacks). Default time window is copied onto day slots when created.

**Note**: The schema has `CK_SERV_VALIDITY` constraint referencing `VALIDFROM`/`VALIDUNTIL` columns, but these columns do NOT exist in the `CREATE TABLE` statement. This is a **schema inconsistency**.

---

### CMS_SERVHIST

| Column     | Type          | Nullable | Default             | Constraints                   |
|------------|---------------|----------|---------------------|-------------------------------|
| SERVHISTID | INT AI        | NO       | —                   | PRIMARY KEY                   |
| SERVICEID  | INT           | NO       | —                   | FK → CMS_SERVICE              |
| CANTEENID  | INT           | NO       | —                   |                               |
| SERVCODE   | VARCHAR(20)   | NO       | —                   |                               |
| SERVNAME   | VARCHAR(80)   | NO       | —                   |                               |
| DEFSTART   | TIME          | NO       | —                   |                               |
| DEFEND     | TIME          | NO       | —                   |                               |
| VALIDFROM  | DATE          | YES      | NULL                |                               |
| VALIDUNTIL | DATE          | YES      | NULL                |                               |
| STATUS     | VARCHAR(20)   | NO       | —                   |                               |
| CHANGEDBY  | INT           | NO       | —                   | FK → CMS_USER                 |
| CHANGEDAT  | DATETIME      | NO       | CURRENT_TIMESTAMP   |                               |
| CHGREASON  | VARCHAR(255)  | YES      | NULL                |                               |

**Purpose**: Audit trail for service changes. Stores full snapshot before each update/activate/deactivate.

---

### CMS_MENUITEM

| Column     | Type          | Nullable | Default             | Constraints                 |
|------------|---------------|----------|---------------------|-----------------------------|
| MENUITEMID | INT AI        | NO       | —                   | PRIMARY KEY                 |
| MENUCODE   | VARCHAR(20)   | NO       | —                   | UNIQUE                      |
| SHORTNAME  | VARCHAR(30)   | NO       | —                   |                             |
| ITEMNAME   | VARCHAR(100)  | NO       | —                   |                             |
| ITEMDESCR  | VARCHAR(255)  | YES      | NULL                |                             |
| ISSPECIAL  | TINYINT(1)    | NO       | 0                   | CHECK (0,1)                 |
| STATUS     | VARCHAR(20)   | NO       | 'A'                 | CHECK ('A','D')             |
| CREATEDBY  | INT           | NO       | —                   | FK → CMS_USER               |
| CREATEDAT  | DATETIME      | NO       | CURRENT_TIMESTAMP   |                             |
| UPDATEDAT  | DATETIME      | YES      | ON UPDATE           |                             |

**Purpose**: Shared menu item catalog. **No price columns** — prices are managed separately via `CMS_ITEMPRICE` + `CMS_ITEMPRICEDT`.

---

### CMS_MENUHIST

| Column     | Type          | Nullable | Default             | Constraints          |
|------------|---------------|----------|---------------------|----------------------|
| MENUHISTID | INT AI        | NO       | —                   | PRIMARY KEY          |
| MENUITEMID | INT           | NO       | —                   | FK → CMS_MENUITEM    |
| MENUCODE   | VARCHAR(20)   | NO       | —                   |                      |
| SHORTNAME  | VARCHAR(30)   | NO       | —                   |                      |
| ITEMNAME   | VARCHAR(100)  | NO       | —                   |                      |
| ITEMDESCR  | VARCHAR(255)  | YES      | NULL                |                      |
| ISSPECIAL  | TINYINT(1)    | NO       | —                   |                      |
| STATUS     | VARCHAR(20)   | NO       | —                   |                      |
| CHANGEDBY  | INT           | NO       | —                   | FK → CMS_USER        |
| CHANGEDAT  | DATETIME      | NO       | CURRENT_TIMESTAMP   |                      |
| CHGREASON  | VARCHAR(255)  | YES      | NULL                |                      |

**Purpose**: Menu item change history (audit trail).

---

### CMS_ITEMPRICE

| Column      | Type          | Nullable | Default             | Constraints                                    |
|-------------|---------------|----------|---------------------|------------------------------------------------|
| ITEMPRICEID | INT AI        | NO       | —                   | PRIMARY KEY                                    |
| MENUITEMID  | INT           | NO       | —                   | FK → CMS_MENUITEM, UNIQUE (MENUITEMID, EFFFROM)|
| EFFFROM     | DATE          | NO       | —                   |                                                |
| STATUS      | VARCHAR(20)   | NO       | 'A'                 | CHECK ('A','D')                                |
| CREATEDBY   | INT           | NO       | —                   | FK → CMS_USER                                  |
| CREATEDAT   | DATETIME      | NO       | CURRENT_TIMESTAMP   |                                                |
| UPDATEDAT   | DATETIME      | YES      | ON UPDATE           |                                                |

**Purpose**: Price band header. Uses Type-2 SCD (Slowly Changing Dimension) pattern. No EFFUNTIL column — the end is implied by the next row's EFFFROM.

---

### CMS_ITEMPRICEDT

| Column        | Type          | Nullable | Default | Constraints                                       |
|---------------|---------------|----------|---------|---------------------------------------------------|
| ITEMPRICEDTID | INT AI        | NO       | —       | PRIMARY KEY                                       |
| ITEMPRICEID   | INT           | NO       | —       | FK → CMS_ITEMPRICE, UNIQUE (ITEMPRICEID, CTYPECODE)|
| CTYPECODE     | VARCHAR(20)   | NO       | —       | FK → CMS_CUSTTYPE(CTYPECODE)                      |
| PRICE         | DECIMAL(10,2) | NO       | —       | CHECK (PRICE >= 0)                                |

**Purpose**: Per-customer-type price within a price band. One row per (ITEMPRICEID, CTYPECODE) combination.

---

### CMS_DAYSLOT

| Column    | Type          | Nullable | Default             | Constraints                                        |
|-----------|---------------|----------|---------------------|----------------------------------------------------|
| DAYSLOTID | INT AI        | NO       | —                   | PRIMARY KEY                                        |
| SERVICEID | INT           | NO       | —                   | FK → CMS_SERVICE, UNIQUE (SERVICEID, SERVDATE)     |
| SERVDATE  | DATE          | NO       | —                   |                                                    |
| STARTTIME | TIME          | NO       | —                   |                                                    |
| ENDTIME   | TIME          | NO       | —                   | CHECK (ENDTIME > STARTTIME)                        |
| STATUS    | VARCHAR(20)   | NO       | 'A'                 | CHECK ('A','D')                                    |
| CREATEDBY | INT           | NO       | —                   | FK → CMS_USER                                      |
| CREATEDAT | DATETIME      | NO       | CURRENT_TIMESTAMP   |                                                    |
| UPDATEDAT | DATETIME      | YES      | ON UPDATE           |                                                    |

**Purpose**: Dated instance of a service. Canteen scoping falls through via SERVICEID → CMS_SERVICE.CANTEENID.

---

### CMS_SLOTHIST

Audit trail for CMS_DAYSLOT. Columns mirror the parent + CHANGEDBY/CHANGEDAT/CHGREASON.

---

### CMS_DAYMENU

| Column      | Type          | Nullable | Default             | Constraints                                           |
|-------------|---------------|----------|---------------------|-------------------------------------------------------|
| DAYMENUID   | INT AI        | NO       | —                   | PRIMARY KEY                                           |
| DMENUNO     | VARCHAR(20)   | YES      | NULL                | UNIQUE                                                |
| DAYSLOTID   | INT           | NO       | —                   | FK → CMS_DAYSLOT, UNIQUE (DAYSLOTID, MENUITEMID)      |
| MENUITEMID  | INT           | NO       | —                   | FK → CMS_MENUITEM                                     |
| ISSPECIAL   | TINYINT(1)    | NO       | 0                   | CHECK (0,1)                                           |
| ISPREBOOK   | TINYINT(1)    | NO       | 1                   | CHECK (0,1)                                           |
| ISKIOSK     | TINYINT(1)    | NO       | 1                   | CHECK (0,1)                                           |
| BOOKUNTIL   | DATETIME      | NO       | —                   |                                                       |
| CANCELUNTIL | DATETIME      | NO       | —                   | CHECK (CANCELUNTIL <= BOOKUNTIL)                      |
| AVAILQTY    | INT           | NO       | 0                   | CHECK (AVAILQTY >= 0)                                 |
| MAXQTY      | INT           | NO       | 1                   | CHECK (MAXQTY >= 1)                                   |
| STATUS      | VARCHAR(20)   | NO       | 'A'                 | CHECK ('A','D')                                       |
| APPRSTATUS  | VARCHAR(20)   | NO       | 'PEN'               | CHECK ('PEN','APP','REJ')                             |
| APPROVEDBY  | INT           | YES      | NULL                | FK → CMS_USER                                         |
| APPROVEDAT  | DATETIME      | YES      | NULL                |                                                       |
| REMARKS     | VARCHAR(255)  | YES      | NULL                |                                                       |
| CREATEDBY   | INT           | NO       | —                   | FK → CMS_USER                                         |
| CREATEDAT   | DATETIME      | NO       | CURRENT_TIMESTAMP   |                                                       |
| UPDATEDAT   | DATETIME      | YES      | ON UPDATE           |                                                       |

**Purpose**: Menu item offered on a specific day-slot. Dual status: `STATUS` = operational (A/D), `APPRSTATUS` = approval workflow (PEN/APP/REJ). Includes booking window (`BOOKUNTIL`, `CANCELUNTIL`).

---

### CMS_DMENUHIST

Audit trail for CMS_DAYMENU. Columns mirror the parent + CHANGEDBY/CHANGEDAT/CHGREASON/REMARKS. **Does NOT include BOOKUNTIL/CANCELUNTIL** columns.

---

### CMS_MENUTPL

| Column    | Type          | Nullable | Default             | Constraints                                            |
|-----------|---------------|----------|---------------------|--------------------------------------------------------|
| MENUTPLID | INT AI        | NO       | —                   | PRIMARY KEY                                            |
| CANTEENID | INT           | NO       | —                   | FK → CMS_CANTEEN, UNIQUE (CANTEENID, SERVICEID, TPLNAME)|
| SERVICEID | INT           | NO       | —                   | FK → CMS_SERVICE                                       |
| TPLNAME   | VARCHAR(80)   | NO       | —                   |                                                        |
| WEEKDAY   | TINYINT       | YES      | NULL                | CHECK (NULL OR 1-7, Mon-Sun)                           |
| STATUS    | VARCHAR(20)   | NO       | 'A'                 | CHECK ('A','D')                                        |
| CREATEDBY | INT           | NO       | —                   | FK → CMS_USER                                          |
| CREATEDAT | DATETIME      | NO       | CURRENT_TIMESTAMP   |                                                        |
| UPDATEDAT | DATETIME      | YES      | ON UPDATE           |                                                        |

### CMS_MENUTPLDT

| Column      | Type       | Nullable | Default | Constraints                                    |
|-------------|------------|----------|---------|------------------------------------------------|
| MENUTPLDTID | INT AI     | NO       | —       | PRIMARY KEY                                    |
| MENUTPLID   | INT        | NO       | —       | FK → CMS_MENUTPL, UNIQUE (MENUTPLID, MENUITEMID)|
| MENUITEMID  | INT        | NO       | —       | FK → CMS_MENUITEM                              |
| ISSPECIAL   | TINYINT(1) | NO       | 0       |                                                |
| ISPREBOOK   | TINYINT(1) | NO       | 1       |                                                |
| ISKIOSK     | TINYINT(1) | NO       | 1       |                                                |
| MAXQTY      | INT        | NO       | 1       | CHECK (MAXQTY >= 1)                            |
| DEFAVAILQTY | INT        | NO       | 0       | CHECK (DEFAVAILQTY >= 0)                       |

**Purpose**: Reusable menu templates for "copy previous day/week/month menu". `WEEKDAY` ties the template to a specific day (NULL = ad-hoc/reusable).

---

## Triggers

### TRG_DAYMENU_APPR_RESET

- **Table**: `CMS_DAYMENU`
- **Event**: `BEFORE UPDATE`
- **Logic**: If the row was previously `APPRSTATUS = 'APP'` and any of `AVAILQTY`, `MAXQTY`, `ISSPECIAL`, `ISPREBOOK`, `ISKIOSK` changes, then:
  - Sets `APPRSTATUS = 'PEN'`
  - Clears `APPROVEDBY = NULL`
  - Clears `APPROVEDAT = NULL`
- **Rationale**: Editing a published/approved menu item forces it back through the approval workflow.
