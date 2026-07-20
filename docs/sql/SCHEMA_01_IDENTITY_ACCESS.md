# Schema: 01_IDENTITY_ACCESS_SCHEMA.sql — Identity & Access Management

> **Source File**: `database/schema/V1/01_IDENTITY_ACCESS_SCHEMA.sql`  
> **Module**: 1 — Identity & Access Management

---

## Overview

This schema defines user accounts, organizational hierarchy (centres/canteens), role-based access control, customer identity profiles (permanent, contract, other-centre, visitor), access credentials, and approval level configuration.

---

## Tables

### CMS_CENTER

| Column     | Type          | Nullable | Default             | Constraints         |
|------------|---------------|----------|---------------------|---------------------|
| CENTERID   | INT AI        | NO       | —                   | PRIMARY KEY         |
| CENTERCODE | VARCHAR(20)   | NO       | —                   | UNIQUE              |
| CENTERNAME | VARCHAR(120)  | NO       | —                   |                     |
| LOCATION   | VARCHAR(150)  | YES      | NULL                |                     |
| STATUS     | VARCHAR(20)   | NO       | 'A'                 | CHECK ('A','D')     |
| CREATEDAT  | DATETIME      | NO       | CURRENT_TIMESTAMP   |                     |
| UPDATEDAT  | DATETIME      | YES      | ON UPDATE           |                     |

**Purpose**: ISRO centre master. Parent entity for canteens.

---

### CMS_CANTEEN

| Column      | Type          | Nullable | Default             | Constraints                      |
|-------------|---------------|----------|---------------------|----------------------------------|
| CANTEENID   | INT AI        | NO       | —                   | PRIMARY KEY                      |
| CENTERID    | INT           | NO       | —                   | FK → CMS_CENTER(CENTERID)        |
| CANTEENCODE | VARCHAR(20)   | NO       | —                   | UNIQUE (CENTERID, CANTEENCODE)   |
| CANTEENNAME | VARCHAR(120)  | NO       | —                   |                                  |
| LOCATION    | VARCHAR(150)  | YES      | NULL                |                                  |
| STATUS      | VARCHAR(20)   | NO       | 'A'                 | CHECK ('A','D')                  |
| CREATEDAT   | DATETIME      | NO       | CURRENT_TIMESTAMP   |                                  |
| UPDATEDAT   | DATETIME      | YES      | ON UPDATE           |                                  |

**Purpose**: Canteen master. Scoped under a centre. Primary organizational unit for services, menus, and role assignments.

---

### CMS_USER

| Column    | Type          | Nullable | Default             | Constraints                 |
|-----------|---------------|----------|---------------------|-----------------------------|
| USERID    | INT AI        | NO       | —                   | PRIMARY KEY                 |
| LOGINID   | VARCHAR(50)   | NO       | —                   | UNIQUE                      |
| FULLNAME  | VARCHAR(120)  | NO       | —                   |                             |
| EMAIL     | VARCHAR(120)  | YES      | NULL                | UNIQUE (when not NULL)      |
| MOBILENO  | VARCHAR(20)   | YES      | NULL                |                             |
| PWDHASH   | VARCHAR(255)  | NO       | —                   |                             |
| AUTHPROV  | VARCHAR(20)   | NO       | 'LOCAL'             | CHECK ('LOCAL','SSO','LDAP')|
| AUTHID    | VARCHAR(120)  | YES      | NULL                |                             |
| ISACTIVE  | TINYINT(1)    | NO       | 1                   | CHECK (0,1)                 |
| CREATEDAT | DATETIME      | NO       | CURRENT_TIMESTAMP   |                             |
| UPDATEDAT | DATETIME      | YES      | ON UPDATE           |                             |

**Purpose**: System user accounts. Stores login credentials and authentication method.

---

### CMS_ROLE

| Column    | Type          | Nullable | Default             | Constraints   |
|-----------|---------------|----------|---------------------|---------------|
| ROLEID    | INT AI        | NO       | —                   | PRIMARY KEY   |
| ROLECODE  | VARCHAR(50)   | NO       | —                   | UNIQUE        |
| ROLENAME  | VARCHAR(100)  | NO       | —                   |               |
| DESCR     | VARCHAR(255)  | YES      | NULL                |               |
| ISACTIVE  | TINYINT(1)    | NO       | 1                   | CHECK (0,1)   |
| CREATEDAT | DATETIME      | NO       | CURRENT_TIMESTAMP   |               |
| UPDATEDAT | DATETIME      | YES      | ON UPDATE           |               |

**Purpose**: Role master. Known codes: `SUPERADMIN`, `CENTADMIN`, `CANADMIN`, `CANMANAGER`, `CANSTAFF`, `CONSUMER`.

---

### CMS_CONSUMERROLE

| Column     | Type       | Nullable | Default             | Constraints                               |
|------------|------------|----------|---------------------|-------------------------------------------|
| USRROLEID  | INT AI     | NO       | —                   | PRIMARY KEY                               |
| USERID     | INT        | NO       | —                   | FK → CMS_USER, UNIQUE (USERID, ROLEID)    |
| ROLEID     | INT        | NO       | —                   | FK → CMS_ROLE                             |
| ASSIGNEDBY | INT        | YES      | NULL                | FK → CMS_USER                             |
| ASSIGNEDAT | DATETIME   | NO       | CURRENT_TIMESTAMP   |                                           |
| VALIDFROM  | DATETIME   | YES      | NULL                |                                           |
| VALIDUNTIL | DATETIME   | YES      | NULL                |                                           |
| ISACTIVE   | TINYINT(1) | NO       | 1                   | CHECK (0,1)                               |

**Purpose**: System-wide (consumer) role assignments. Replaces the old `CMS_USRROLE` table from v1.

---

### CMS_CANTEENROLE

| Column       | Type       | Nullable | Default             | Constraints                                          |
|-------------|------------|----------|---------------------|------------------------------------------------------|
| USRCANROLEID| INT AI     | NO       | —                   | PRIMARY KEY                                          |
| USERID      | INT        | NO       | —                   | FK → CMS_USER, UNIQUE (USERID, ROLEID, CANTEENID)   |
| ROLEID      | INT        | NO       | —                   | FK → CMS_ROLE                                        |
| CANTEENID   | INT        | NO       | —                   | FK → CMS_CANTEEN                                     |
| ISDEFAULT   | TINYINT(1) | NO       | 0                   | CHECK (0,1)                                          |
| VALIDFROM   | DATETIME   | YES      | NULL                |                                                      |
| VALIDUNTIL  | DATETIME   | YES      | NULL                |                                                      |
| ISACTIVE    | TINYINT(1) | NO       | 1                   | CHECK (0,1)                                          |
| ASSIGNEDBY  | INT        | YES      | NULL                | FK → CMS_USER                                        |
| ASSIGNEDAT  | DATETIME   | NO       | CURRENT_TIMESTAMP   |                                                      |
| UPDATEDAT   | DATETIME   | YES      | ON UPDATE           |                                                      |

**Purpose**: Canteen-scoped role assignments. Allows a user to have different roles at different canteens. `ISDEFAULT` marks the user's primary canteen.

---

### CMS_ROLESCN

| Column    | Type       | Nullable | Default             | Constraints                                  |
|-----------|------------|----------|---------------------|----------------------------------------------|
| ROLESCNID | INT AI     | NO       | —                   | PRIMARY KEY                                  |
| ROLEID    | INT        | NO       | —                   | FK → CMS_ROLE, UNIQUE (ROLEID, SCREENID)     |
| SCREENID  | INT        | NO       | —                   | FK → CMS_SCREEN                              |
| CANVIEW   | TINYINT(1) | NO       | 0                   |                                              |
| CANCREATE | TINYINT(1) | NO       | 0                   |                                              |
| CANUPDATE | TINYINT(1) | NO       | 0                   |                                              |
| CANDELETE | TINYINT(1) | NO       | 0                   |                                              |
| ISACTIVE  | TINYINT(1) | NO       | 1                   |                                              |
| CREATEDAT | DATETIME   | NO       | CURRENT_TIMESTAMP   |                                              |
| UPDATEDAT | DATETIME   | YES      | ON UPDATE           |                                              |

**Purpose**: Maps roles to screens with CRUD permissions. Used for frontend permission checks.

---

### CMS_CUSTOMER

| Column     | Type          | Nullable | Default             | Constraints                                |
|------------|---------------|----------|---------------------|--------------------------------------------|
| CUSTOMERID | INT AI        | NO       | —                   | PRIMARY KEY                                |
| USERID     | INT           | YES      | NULL                | FK → CMS_USER (NULL for visitors)          |
| CTYPECODE  | VARCHAR(20)   | NO       | —                   | FK → CMS_CUSTTYPE(CTYPECODE)               |
| DISPNAME   | VARCHAR(120)  | NO       | —                   |                                            |
| STATUS     | VARCHAR(20)   | NO       | 'A'                 | CHECK ('A','D')                            |
| VALIDFROM  | DATETIME      | YES      | NULL                |                                            |
| VALIDUNTIL | DATETIME      | YES      | NULL                |                                            |
| CREATEDAT  | DATETIME      | NO       | CURRENT_TIMESTAMP   |                                            |
| UPDATEDAT  | DATETIME      | YES      | ON UPDATE           |                                            |

**Purpose**: Central customer identity. Each customer has a type (PERMANENT/CONTRACT/OTHERCENTRE/VISITOR) and an optional link to a CMS_USER account.

---

### CMS_PERMEMP

| Column     | Type          | Nullable | Default             | Constraints                      |
|------------|---------------|----------|---------------------|----------------------------------|
| PERMEMPID  | INT AI        | NO       | —                   | PRIMARY KEY                      |
| CUSTOMERID | INT           | NO       | —                   | FK → CMS_CUSTOMER, UNIQUE        |
| EMPCODE    | VARCHAR(50)   | NO       | —                   | UNIQUE                           |
| DEPT       | VARCHAR(100)  | NO       | —                   |                                  |
| DESIG      | VARCHAR(100)  | NO       | —                   |                                  |
| CREATEDAT  | DATETIME      | NO       | CURRENT_TIMESTAMP   |                                  |
| UPDATEDAT  | DATETIME      | YES      | ON UPDATE           |                                  |

**Purpose**: Permanent employee profile. 1:1 with CMS_CUSTOMER where CTYPECODE = 'PERMANENT'.

---

### CMS_CONTEMP

| Column     | Type          | Nullable | Default             | Constraints                |
|------------|---------------|----------|---------------------|----------------------------|
| CONTEMPID  | INT AI        | NO       | —                   | PRIMARY KEY                |
| CUSTOMERID | INT           | NO       | —                   | FK → CMS_CUSTOMER, UNIQUE  |
| CONTCODE   | VARCHAR(50)   | NO       | —                   | UNIQUE                     |
| VENDORNAME | VARCHAR(150)  | NO       | —                   |                            |
| CONTSTART  | DATE          | NO       | —                   |                            |
| CONTEND    | DATE          | NO       | —                   | CHECK (CONTEND >= CONTSTART)|
| CREATEDAT  | DATETIME      | NO       | CURRENT_TIMESTAMP   |                            |
| UPDATEDAT  | DATETIME      | YES      | ON UPDATE           |                            |

**Purpose**: Contract employee profile. 1:1 with CMS_CUSTOMER where CTYPECODE = 'CONTRACT'.

---

### CMS_OCEEMP

| Column     | Type          | Nullable | Default             | Constraints                |
|------------|---------------|----------|---------------------|----------------------------|
| OCEEMPID   | INT AI        | NO       | —                   | PRIMARY KEY                |
| CUSTOMERID | INT           | NO       | —                   | FK → CMS_CUSTOMER, UNIQUE  |
| EMPCODE    | VARCHAR(50)   | NO       | —                   | UNIQUE                     |
| CENTERNAME | VARCHAR(120)  | NO       | —                   |                            |
| DEPT       | VARCHAR(100)  | YES      | NULL                |                            |
| DESIG      | VARCHAR(100)  | YES      | NULL                |                            |
| VALIDFROM  | DATETIME      | YES      | NULL                |                            |
| VALIDUNTIL | DATETIME      | YES      | NULL                |                            |
| CREATEDAT  | DATETIME      | NO       | CURRENT_TIMESTAMP   |                            |
| UPDATEDAT  | DATETIME      | YES      | ON UPDATE           |                            |

**Purpose**: Other centre employee profile. 1:1 with CMS_CUSTOMER where CTYPECODE = 'OTHERCENTRE'.

---

### CMS_VISITOR

| Column     | Type          | Nullable | Default             | Constraints                      |
|------------|---------------|----------|---------------------|----------------------------------|
| VISITORID  | INT AI        | NO       | —                   | PRIMARY KEY                      |
| CUSTOMERID | INT           | NO       | —                   | FK → CMS_CUSTOMER, UNIQUE        |
| VISNAME    | VARCHAR(120)  | NO       | —                   |                                  |
| VISMOBILE  | VARCHAR(20)   | YES      | NULL                |                                  |
| VISORG     | VARCHAR(150)  | YES      | NULL                |                                  |
| VISPURPOSE | VARCHAR(255)  | YES      | NULL                |                                  |
| VISDATE    | DATE          | NO       | —                   |                                  |
| VALIDUNTIL | DATETIME      | NO       | —                   |                                  |
| CREATEDBY  | INT           | NO       | —                   | FK → CMS_USER                    |
| STATUS     | VARCHAR(20)   | NO       | 'A'                 | CHECK ('A','D','EXP')            |
| CREATEDAT  | DATETIME      | NO       | CURRENT_TIMESTAMP   |                                  |
| UPDATEDAT  | DATETIME      | YES      | ON UPDATE           |                                  |

**Purpose**: Visitor profile. 1:1 with CMS_CUSTOMER where CTYPECODE = 'VISITOR'. Visitors may NOT have a linked CMS_USER (USERID is NULL on CMS_CUSTOMER).

---

### CMS_ACCKEY

| Column     | Type          | Nullable | Default             | Constraints                           |
|------------|---------------|----------|---------------------|---------------------------------------|
| ACCKEYID   | INT AI        | NO       | —                   | PRIMARY KEY                           |
| CUSTOMERID | INT           | NO       | —                   | FK → CMS_CUSTOMER                     |
| KEYTYPE    | VARCHAR(30)   | NO       | —                   | CHECK ('QR','RFID','EMPCARD','VISPASS','TEMPTOKEN') |
| KEYVALUE   | VARCHAR(255)  | NO       | —                   | UNIQUE                                |
| EXPIRESAT  | DATETIME      | YES      | NULL                |                                       |
| STATUS     | VARCHAR(20)   | NO       | 'A'                 | CHECK ('A','D','REVOKED')             |
| LASTUSEDAT | DATETIME      | YES      | NULL                |                                       |
| CREATEDBY  | INT           | NO       | —                   | FK → CMS_USER                         |
| CREATEDAT  | DATETIME      | NO       | CURRENT_TIMESTAMP   |                                       |
| UPDATEDAT  | DATETIME      | YES      | ON UPDATE           |                                       |

**Purpose**: Access credential for kiosk/QR/RFID identification. Validated by `CMSVALIDATEACCKEY` procedure.

---

### CMS_APPLVL

| Column    | Type          | Nullable | Default             | Constraints                          |
|-----------|---------------|----------|---------------------|--------------------------------------|
| APPLVLID  | INT AI        | NO       | —                   | PRIMARY KEY                          |
| LEVELNO   | INT           | NO       | —                   | UNIQUE                               |
| LEVELNAME | VARCHAR(100)  | NO       | —                   |                                      |
| ROLEID    | INT           | NO       | —                   | FK → CMS_ROLE                        |
| DESCR     | VARCHAR(255)  | YES      | NULL                |                                      |
| ISACTIVE  | TINYINT(1)    | NO       | 1                   | CHECK (0,1)                          |
| CREATEDAT | DATETIME      | NO       | CURRENT_TIMESTAMP   |                                      |
| UPDATEDAT | DATETIME      | YES      | ON UPDATE           |                                      |

**Purpose**: Approval level configuration. Maps an approval level number to a role. Used by the generic approval engine (CMS_APPRINST/CMS_APPRSTEP in Module 2 procedures).
