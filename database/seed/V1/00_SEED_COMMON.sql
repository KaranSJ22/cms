/* ============================================================
   SEED DATA — MODULE 0: COMMON MASTERS
   Aligned with: 00_COMMON_SCHEMA.sql (Final)
   Minimum 4 rows per table.
   ============================================================ */

USE cms_db;


/* ---- CMS_STATUS ---- */
INSERT INTO CMS_STATUS (STATUSCODE, STATUSNAME, STATUSGRP, DESCR) VALUES
('ACT',    'Active',    'GENERAL',   'Record is active'),
('DIS',    'Disabled',  'GENERAL',   'Record is disabled'),
('PEN',    'Pending',   'APPROVAL',  'Approval is pending'),
('APP',  'Approved',  'APPROVAL',  'Approval completed'),
('REJ',  'Rejected',  'APPROVAL',  'Approval rejected'),
('EXP',  'Expired',   'ACCESS',    'Access expired'),
('CNC', 'Cancelled', 'WORKFLOW', 'Workflow was cancelled'),
('REV',  'Revoked',   'ACCESS',    'Access revoked'),
('BLK',  'Blocked',   'GENERAL',   'Access blocked');


/* ---- CMS_CUSTTYPE ---- */
INSERT INTO CMS_CUSTTYPE (CTYPECODE, CTYPENAME, DESCR) VALUES
('PRM',   'Permanent Employee',      'ISRO/HSFC permanent employee — Accounts Dept'),
('CNT',    'Contract Employee',       'Contract or vendor employee — wallet/cash'),
('VIS',     'Visitor',                 'Temporary visitor — wallet/cash'),
('OCE', 'Other Centre Employee',   'Employee from another ISRO centre — inter-centre billing'),
('OFR','Official Request','Permanent Employee but makes official request-Accounts Dept');


/* ---- CMS_SCREEN ---- */
INSERT INTO CMS_SCREEN (SCREENCODE, SCREENNAME, DESCR, ROUTEPATH) VALUES
('USERMGMT',    'User Management',         'Create and manage system users',            '/admin/users'),
('ROLEMGMT',    'Role Management',         'Manage roles and permissions',              '/admin/roles'),
('CENTERMGMT',  'Centre Management',       'Manage ISRO centres',                       '/admin/centres'),
('CANTEENMGMT', 'Canteen Management',      'Manage canteens under centres',             '/admin/canteens'),
('SERVMGMT',    'Service Management',      'Manage canteen services',                   '/manage/services'),
('MENUITEM',    'Menu Item Management',    'Manage shared menu item catalog',           '/manage/menu-items'),
('ITEMPRICE',   'Item Pricing',            'Manage menu item prices per customer type', '/manage/pricing'),
('CANMENITM',   'Canteen Menu Items',      'Map shared items to a specific canteen',    '/manage/canteen-menu'),
('DAYSLOT',     'Day Slot Management',     'Manage service day slots',                  '/manage/day-slots'),
('DAYMENU',     'Day Menu Management',     'Staff adds menu items to day slots',        '/manage/day-menu'),
('MENUTPL',     'Menu Templates',          'Create and apply reusable menu templates',  '/manage/templates'),
('MENUAPPR',    'Day Menu Approval',       'Manager approves/rejects day menus',        '/manage/menu-approval'),
('VIEWMENU',    'View Published Menu',     'Customers view approved and active menu',   '/menu'),
('BOOKING',     'Booking Management',      'Customer booking and kiosk interface',      '/booking'),
('WALLET',      'Wallet Management',       'Wallet top-up and transaction history',     '/wallet'),
('DASHBOARD',   'Dashboard',              'Analytics and operational dashboard',       '/dashboard');


/* ---- CMS_AUTONOS ---- */
INSERT INTO CMS_AUTONOS (TBLNAME, DATAITEM, ITEMLEN, FLDTYPE, PREFIXCHAR, STARTNO, STARTDATE, LASTNO, STATUS) VALUES
('CMS_USER',     'LOGINID',  20, 'CHAR', 'U',  1, CURRENT_DATE, 0, 'A'),
('CMS_MENUITEM', 'MENUCODE', 20, 'CHAR', 'M',  1, CURRENT_DATE, 0, 'A'),
('CMS_DAYMENU',  'DMENUNO',  20, 'CHAR', 'D',  1, CURRENT_DATE, 0, 'A'),
('CMS_SERVICE',  'SERVCODE', 20, 'CHAR', 'S',  1, CURRENT_DATE, 0, 'A'),
('CMS_CUSTOMER', 'CUSTNO',   20, 'CHAR', 'C',  1, CURRENT_DATE, 0, 'A'),
('CMS_CANTEEN',  'CANTEENCODE', 20, 'CHAR', 'CN', 1, CURRENT_DATE, 0, 'A');