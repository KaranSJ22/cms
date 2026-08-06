# Schema: 00_COMMON_SCHEMA.sql — Common Master & System Configuration

> **Source File**: `database/schema/V1/00_COMMON_SCHEMA.sql`  
> **Module**: 0 — Common Master & System Configuration

---

## Overview

This schema defines system-wide lookup/configuration tables that are referenced across all other modules. These are foundational master tables with no dependency on other CMS modules.

---

## Tables

### CMS_STATUS

| Column      | Type          | Nullable | Default             | Constraints                |
|-------------|---------------|----------|---------------------|----------------------------|
| STATUSID    | INT AI        | NO       | —                   | PRIMARY KEY                |
| STATUSCODE  | VARCHAR(10)   | NO       | —                   | UNIQUE                     |
| STATUSNAME  | VARCHAR(50)   | NO       | —                   |                            |
| STATUSGRP   | VARCHAR(30)   | NO       | —                   |                            |
| DESCR       | VARCHAR(255)  | YES      | NULL                |                            |
| ISACTIVE    | TINYINT(1)    | NO       | 1                   | CHECK (ISACTIVE IN (0,1))  |
| CREATEDAT   | DATETIME      | NO       | CURRENT_TIMESTAMP   |                            |
| UPDATEDAT   | DATETIME      | YES      | ON UPDATE           |                            |

**Purpose**: System-wide status lookup table grouped by `STATUSGRP`. Extensible without DDL changes.

---

### CMS_CUSTTYPE

| Column     | Type          | Nullable | Default             | Constraints                    |
|------------|---------------|----------|---------------------|--------------------------------|
| CTYPEID    | INT AI        | NO       | —                   | PRIMARY KEY                    |
| CTYPECODE  | VARCHAR(20)   | NO       | —                   | UNIQUE                         |
| CTYPENAME  | VARCHAR(80)   | NO       | —                   |                                |
| DESCR      | VARCHAR(255)  | YES      | NULL                |                                |
| ISACTIVE   | TINYINT(1)    | NO       | 1                   | CHECK (ISACTIVE IN (0,1))      |
| CREATEDAT  | DATETIME      | NO       | CURRENT_TIMESTAMP   |                                |
| UPDATEDAT  | DATETIME      | YES      | ON UPDATE           |                                |

**Purpose**: Customer type master. Known codes: `PERMANENT`, `CONTRACT`, `OTHERCENTRE`, `VISITOR`, `OFFICIAL`. Referenced by `CMS_CUSTOMER.CTYPECODE` and `CMS_ITEMPRICEDT.CTYPECODE`.

---
### CMS_AUTONOS

| Column     | Type        | Nullable | Default           | Constraints                    |
| ---------- | ----------- | -------- | ----------------- | ------------------------------ |
| AUTONOID   | INT AI      | NO       | —                 | PRIMARY KEY                    |
| TBLNAME    | VARCHAR(50) | NO       | —                 | UNIQUE KEY (TBLNAME, DATAITEM) |
| DATAITEM   | VARCHAR(30) | NO       | —                 |                                |
| ITEMLEN    | INT         | NO       | 10                |                                |
| FLDTYPE    | VARCHAR(10) | NO       | 'CHAR'            |                                |
| PREFIXCHAR | VARCHAR(5)  | NO       | —                 |                                |
| STARTNO    | BIGINT      | NO       | 1                 |                                |
| STARTDATE  | DATE        | YES      | NULL              |                                |
| LASTNO     | BIGINT      | NO       | 0                 |                                |
| STATUS     | VARCHAR(10) | NO       | 'A'               | CHECK (STATUS IN ('A','D'))    |
| CREATEDBY  | INT         | YES      | NULL              | FK → CMS_USER(USERID)          |
| CREATEDAT  | DATETIME    | NO       | CURRENT_TIMESTAMP |                                |
| UPDATEDAT  | DATETIME    | YES      | ON UPDATE         |                                |

**Purpose**: Auto-number generation configuration. The `CMSGENAUTO` procedure reads and increments `LASTNO` under a `FOR UPDATE` lock to generate formatted business numbers (e.g., `DM20250001`).

---

## Dependencies
- `CMS_AUTONOS.CREATEDBY` → `CMS_USER(USERID)` (Module 1 dependency)
- No other cross-module table dependencies.
