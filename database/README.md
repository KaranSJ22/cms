# ISRO CMS — Database Deployment & Migration Guide

This directory contains the complete database scripts for the Canteen Management System (CMS), organized in strict dependency order across five phases:

0. **Teardown / Clean (DROP_ALL.sql):** Safely drops all existing compatibility views, tables, stored procedures, and scheduled events with foreign key checks disabled.
1. **Schemas (22 Files):** Table definitions, constraints, audit triggers, and backward-compatibility views.
2. **Stored Procedures (26 Files):** Read/write business logic procedures (`COMMON_GENAUTO` runs first).
3. **Scheduled Events (1 File):** Midnight no-show processor (`EVT_CMS_DAILY_NOSHOW`).
4. **Seed Data (4 Files):** Statuses, auto-number counters, initial admin/users/roles/canteen masters, and holidays.

> [!NOTE]
> By default, running **`npm run db:init`**, **`run_all.ps1`**, or **`RUN_ALL.sql`** will **automatically clean out any existing tables/views/procedures first** (Phase 0) before executing the fresh schemas and seed data.

---

## How to Run the SQL Files

You can deploy, reset, or drop the database using any of the following three methods:

### Method 1: Via Node.js / NPM (Recommended)

From the `backend` directory, run:

```bash
cd cms/backend
npm run db:init
```

Or to **only drop/delete all existing database objects** without recreating them:

```bash
cd cms/backend
npm run db:drop
```

Or run the runner script directly with custom arguments:

```bash
node scripts/run-all-sql.js --host=localhost --user=root --password=yourpassword --database=CMS_DB
```

**Supported Options:**
- `--host=<host>`: Database host (default: from `.env` or `127.0.0.1`)
- `--port=<port>`: Port (default: from `.env` or `3306`)
- `--user=<user>`: Username (default: from `.env` or `root`)
- `--password=<pwd>`: Password (default: from `.env` or empty)
- `--database=<db>`: Database name (default: from `.env` or `CMS_DB`)
- `--ssl=true|false`: Enable SSL
- `--drop-only`: Safely drop all existing views, tables, procedures, and events, then exit
- `--no-drop`: Skip Phase 0 teardown and keep existing objects
- `--schemas-only`: Run only the 22 schema files
- `--procs-only`: Run only the 26 procedure files
- `--seed-only`: Run only the 4 seed data files
- `--skip-seed`: Run schemas, procedures, and events, but skip seed data
- `--verify`: Check existing database table, procedure, and seed counts without executing changes

---

### Method 2: Via Windows PowerShell

From the `cms/database` directory:

```powershell
cd cms/database
.\run_all.ps1
```

To only drop all existing database objects:

```powershell
.\run_all.ps1 -DropOnly
```

Or with parameters:

```powershell
.\run_all.ps1 -DbHost "localhost" -DbUser "root" -DbPassword "yourpassword" -DbName "CMS_DB"
```

---

### Method 3: Via MySQL CLI Client / GUI

Using the master `RUN_ALL.sql` script:

```bash
cd cms/database
mysql -u root -p CMS_DB < RUN_ALL.sql
```

Or inside the MySQL command-line prompt:

```sql
USE CMS_DB;
SOURCE RUN_ALL.sql;
```

---

## File Execution Order Reference

### Phase 1: Schemas (`schema/`)
1. `USER_SCHEMA.sql`
2. `COMMON_SCHEMA.sql`
3. `CUSTOMER_SCHEMA.sql`
4. `ACCESSKEY_SCHEMA.sql`
5. `SERVICE_SCHEMA.sql`
6. `CENTER_SCHEMA.sql`
7. `CANTEEN_SCHEMA.sql`
8. `KIOSK_SCHEMA.sql`
9. `DAYSLOT_SCHEMA.sql`
10. `MENUITEM_PRICE_SCHEMA.sql`
11. `DAYMENU_SCHEMA.sql`
12. `BOOKING_SCHEMA.sql`
13. `ROLE_SCHEMA.sql`
14. `CANTEENROLE_SCHEMA.sql`
15. `USERROLE_SCHEMA.sql`
16. `SCRNROLE_SCHEMA.sql`
17. `EMPLOYEES_VISITOR_SCHEMA.sql`
18. `HOLIDAY_SCHEMA.sql`
19. `MENUTEMPLATE_SCHEMA.sql`
20. `WALLET_SCHEMA.sql`
21. `OFFICIAL_REQUEST.sql`
22. `COMPATIBILITY_VIEWS.sql`

### Phase 2: Stored Procedures (`procedures/`)
1. `common/write/COMMON_GENAUTO.sql` *(Must run before any SP calling CMSGENAUTO)*
2. `common/write/COMMON_WRITE_PROCEDURES.sql`
3. `common/read/COMMON_READ_PROCEDURES.sql`
4. `identity/write/IDENTITY_WRITE_PROCEDURES.sql`
5. `identity/read/IDENTITY_READ_PROCEDURES.sql`
6. `canteen/write/CANTEEN_WRITE_PROCEDURES.sql`
7. `canteen/read/CANTEEN_READ_PROCEDURES.sql`
8. `dayslot/write/DAYSLOT_WRITE_PROCEDURES.sql`
9. `dayslot/read/DAYSLOT_READ_PROCEDURES.sql`
10. `menuitem/write/MENUITEM_WRITE_PROCEDURES.sql`
11. `menuitem/read/MENUITEM_READ_PROCEDURES.sql`
12. `daymenu/write/DAYMENU_WRITE_PROCEDURES.sql`
13. `daymenu/read/DAYMENU_READ_PROCEDURES.sql`
14. `menutemplate/write/MENUTEMPLATE_WRITE_PROCEDURES.sql`
15. `menutemplate/read/MENUTEMPLATE_READ_PROCEDURES.sql`
16. `booking/write/BOOKING_WRITE_PROCEDURES.sql`
17. `booking/write/BOOKING_WEEKLY_BATCH.sql`
18. `booking/read/BOOKING_READ_PROCEDURES.sql`
19. `wallet/write/WALLET_WRITE_PROCEDURES.sql`
20. `wallet/read/WALLET_READ_PROCEDURES.sql`
21. `kiosk/write/KIOSK_WRITE_PROCEDURES.sql`
22. `kiosk/read/KIOSK_READ_PROCEDURES.sql`
23. `officialrequest/write/OFFICIAL_WRITE_PROCEDURES.sql`
24. `officialrequest/read/OFFICIAL_READ_PROCEDURES.sql`
25. `reporting/write/REPORTING_WRITE_PROCEDURES.sql`
26. `reporting/read/REPORTING_READ_PROCEDURES.sql`

### Phase 3: Events (`events/`)
1. `events/NOSHOW_EVENT.sql`

### Phase 4: Seed Data (`seed/`)
1. `seed/SEED_STATUS.sql`
2. `seed/SEED_AUTONO.sql`
3. `seed/SEED_DATA.sql`
4. `seed/SEED_HOLIDAYS.sql`
