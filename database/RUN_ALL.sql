-- ============================================================
-- ISRO CMS — Master SQL Deployment Script
-- Order: Schemas (22) -> Procedures (26) -> Events (1) -> Seeds (4)
-- 
-- Usage via MySQL CLI (from cms/database directory):
--   mysql -u root -p CMS_DB < RUN_ALL.sql
-- Or from within MySQL interactive prompt:
--   SOURCE RUN_ALL.sql;
-- ============================================================

SELECT '--- PHASE 0: TEARDOWN / CLEANING EXISTING DATABASE OBJECTS ---' AS STATUS;
SOURCE DROP_ALL.sql;

SELECT '--- PHASE 1: CREATING SCHEMAS (21 FILES) ---' AS STATUS;

SOURCE schema/USER_SCHEMA.sql;
SOURCE schema/COMMON_SCHEMA.sql;
SOURCE schema/CUSTOMER_SCHEMA.sql;
SOURCE schema/ACCESSKEY_SCHEMA.sql;
SOURCE schema/SERVICE_SCHEMA.sql;
SOURCE schema/CENTER_SCHEMA.sql;
SOURCE schema/CANTEEN_SCHEMA.sql;
SOURCE schema/KIOSK_SCHEMA.sql;
SOURCE schema/DAYSLOT_SCHEMA.sql;
SOURCE schema/MENUITEM_PRICE_SCHEMA.sql;
SOURCE schema/DAYMENU_SCHEMA.sql;
SOURCE schema/BOOKING_SCHEMA.sql;
SOURCE schema/ROLE_SCHEMA.sql;
SOURCE schema/CANTEENROLE_SCHEMA.sql;
SOURCE schema/USERROLE_SCHEMA.sql;
SOURCE schema/SCRNROLE_SCHEMA.sql;
SOURCE schema/EMPLOYEES_VISITOR_SCHEMA.sql;
SOURCE schema/HOLIDAY_SCHEMA.sql;
SOURCE schema/MENUTEMPLATE_SCHEMA.sql;
SOURCE schema/WALLET_SCHEMA.sql;
SOURCE schema/OFFICIAL_REQUEST.sql;

SELECT '--- PHASE 2: CREATING STORED PROCEDURES (26 FILES) ---' AS STATUS;

-- 1. Common (GenAuto must precede all other procedures)
SOURCE procedures/common/write/COMMON_GENAUTO.sql;
SOURCE procedures/common/write/COMMON_WRITE_PROCEDURES.sql;
SOURCE procedures/common/read/COMMON_READ_PROCEDURES.sql;

-- 2. Identity
SOURCE procedures/identity/write/IDENTITY_WRITE_PROCEDURES.sql;
SOURCE procedures/identity/read/IDENTITY_READ_PROCEDURES.sql;

-- 3. Canteen & Center
SOURCE procedures/canteen/write/CANTEEN_WRITE_PROCEDURES.sql;
SOURCE procedures/canteen/read/CANTEEN_READ_PROCEDURES.sql;

-- 4. Day Slot
SOURCE procedures/dayslot/write/DAYSLOT_WRITE_PROCEDURES.sql;
SOURCE procedures/dayslot/read/DAYSLOT_READ_PROCEDURES.sql;

-- 5. Menu Items & Pricing
SOURCE procedures/menuitem/write/MENUITEM_WRITE_PROCEDURES.sql;
SOURCE procedures/menuitem/read/MENUITEM_READ_PROCEDURES.sql;

-- 6. Day Menu
SOURCE procedures/daymenu/write/DAYMENU_WRITE_PROCEDURES.sql;
SOURCE procedures/daymenu/read/DAYMENU_READ_PROCEDURES.sql;

-- 7. Menu Template
SOURCE procedures/menutemplate/write/MENUTEMPLATE_WRITE_PROCEDURES.sql;
SOURCE procedures/menutemplate/read/MENUTEMPLATE_READ_PROCEDURES.sql;

-- 8. Booking
SOURCE procedures/booking/write/BOOKING_WRITE_PROCEDURES.sql;
SOURCE procedures/booking/write/BOOKING_WEEKLY_BATCH.sql;
SOURCE procedures/booking/read/BOOKING_READ_PROCEDURES.sql;

-- 9. Wallet
SOURCE procedures/wallet/write/WALLET_WRITE_PROCEDURES.sql;
SOURCE procedures/wallet/read/WALLET_READ_PROCEDURES.sql;

-- 10. Kiosk
SOURCE procedures/kiosk/write/KIOSK_WRITE_PROCEDURES.sql;
SOURCE procedures/kiosk/read/KIOSK_READ_PROCEDURES.sql;

-- 11. Official Request
SOURCE procedures/officialrequest/write/OFFICIAL_WRITE_PROCEDURES.sql;
SOURCE procedures/officialrequest/read/OFFICIAL_READ_PROCEDURES.sql;

-- 12. Reporting
SOURCE procedures/reporting/write/REPORTING_WRITE_PROCEDURES.sql;
SOURCE procedures/reporting/read/REPORTING_READ_PROCEDURES.sql;

SELECT '--- PHASE 3: CREATING SCHEDULED EVENTS (1 FILE) ---' AS STATUS;
SOURCE events/NOSHOW_EVENT.sql;

SELECT '--- PHASE 4: LOADING SEED DATA (6 FILES) ---' AS STATUS;
SOURCE seed/SEED_STATUS.sql;
SOURCE seed/SEED_AUTONO.sql;
SOURCE seed/SEED_DATA.sql;
SOURCE seed/SEED_HOLIDAYS.sql;
SOURCE seed/SEED_SERVICE.sql;
SOURCE seed/SEED_MENUITEM.sql;

SELECT '--- COMPLETE: ALL DATABASE FILES EXECUTED SUCCESSFULLY ---' AS STATUS;
