/* ============================================================
   SEED DATA — MODULE 1: IDENTITY & ACCESS MANAGEMENT
   Aligned with: 01_IDENTITY_ACCESS_SCHEMA.sql (Revised)

   KEY CHANGES:
   - CMS_USRROLE → CMS_CONSUMERROLE
   - New CMS_CENTER (4 rows)
   - New CMS_CANTEEN (4 rows)
   - New CMS_CANTEENROLE (4 rows)
   - CMS_OCEEMP uses CENTERNAME (not CENTRENAME)
   - Minimum 4 rows per table
   ============================================================ */

USE cms_db;


/* ---- CMS_CENTER (NEW) ---- */
-- CENTERID: 1=HSFC, 2=VSSC, 3=SAC, 4=ISAC
INSERT INTO CMS_CENTER (CENTERCODE, CENTERNAME, LOCATION) VALUES
('HSFC',  'HSFC - Headquarters',      'Bengaluru, Karnataka'),
('VSSC',  'VSSC',                     'Thiruvananthapuram, Kerala'),
('SAC',   'Space Applications Centre', 'Ahmedabad, Gujarat'),
('ISAC',  'ISAC',                     'Bengaluru, Karnataka');


/* ---- CMS_CANTEEN (NEW) ---- */
-- CANTEENID: 1=HSFC-Main, 2=HSFC-Annexe, 3=VSSC-Central, 4=SAC-Block5
INSERT INTO CMS_CANTEEN (CENTERID, CANTEENCODE, CANTEENNAME, LOCATION) VALUES
(1, 'HSFCMAIN',   'HSFC Main Canteen',     'Ground Floor, Admin Block'),
(1, 'HSFCANNEX',  'HSFC Annexe Canteen',   'Annexe Building, 2nd Floor'),
(2, 'VSSCCEN',    'VSSC Central Canteen',  'Main Campus, Building A'),
(3, 'SACBLK5',    'SAC Block 5 Canteen',   'Block 5, Ground Floor');


/* ---- CMS_USER (6 users — system admin + operational staff + employees) ---- */
-- USERID: 1=Admin, 2=RaviPerm, 3=SureshCont, 4=AnilOCE, 5=MaheshCanMgr, 6=FrontOffice, 7=CanteenStaff, 8=Approver
INSERT INTO CMS_USER (LOGINID, FULLNAME, EMAIL, MOBILENO, PWDHASH, AUTHPROV) VALUES
('ADMIN01',     'System Admin',       'admin.cms@isro.gov.in',          '9000000001', '$2b$10$dummyadminhashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'LOCAL'),
('EMP1001',     'Ravi Kumar',         'ravi.kumar@isro.gov.in',         '9000000002', '$2b$10$dummyemphashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'LOCAL'),
('CON2001',     'Suresh B',           'suresh.vendor@example.com',      '9000000003', '$2b$10$dummyconhashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'LOCAL'),
('OCEVSSC01',   'Anil Nair',          'anil.nair@vssc.gov.in',          '9000000004', '$2b$10$dummyocehashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'LOCAL'),
('CAN001',      'Mahesh Staff',       'mahesh.canteen@example.com',     '9000000005', '$2b$10$dummycanhashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'LOCAL'),
('FOC001',      'Front Office User',  'frontoffice@isro.gov.in',        '9000000006', '$2b$10$dummyfochashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'LOCAL'),
('STF001',      'Priya Kitchen',      'priya.kitchen@example.com',      '9000000007', '$2b$10$dummystfhashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'LOCAL'),
('APR001',      'Rajesh Approver',    'rajesh.approver@isro.gov.in',    '9000000008', '$2b$10$dummyaprhashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'LOCAL');


/* ---- CMS_ROLE (5 roles) ---- */
-- ROLEID: 1=ADMIN, 2=CANTEENMAN, 3=CANTEENSTF, 4=FRONTOFF, 5=APPROVER
INSERT INTO CMS_ROLE (ROLECODE, ROLENAME, DESCR) VALUES
('ADMIN',       'System Administrator', 'Full system access — user and configuration management'),
('CANTEENMAN',  'Canteen Manager',      'Approve menus, manage canteen operations and staff'),
('CANTEENSTF',  'Canteen Staff',        'Add menu items, manage day-to-day canteen operations'),
('FRONTOFF',    'Front Office',         'Visitor registration, booking assistance'),
('APPROVER',    'Approver',             'Approval authority for official requests');


/* ---- CMS_CONSUMERROLE (was CMS_USRROLE — system-wide roles) ---- */
INSERT INTO CMS_CONSUMERROLE (USERID, ROLEID, ASSIGNEDBY, VALIDFROM) VALUES
(1, 1, NULL, CURRENT_TIMESTAMP),   -- Admin gets ADMIN role
(5, 2, 1,    CURRENT_TIMESTAMP),   -- Mahesh gets CANTEENMAN (system-wide)
(7, 3, 1,    CURRENT_TIMESTAMP),   -- Priya gets CANTEENSTF (system-wide)
(6, 4, 1,    CURRENT_TIMESTAMP),   -- Front Office gets FRONTOFF
(8, 5, 1,    CURRENT_TIMESTAMP),   -- Rajesh gets APPROVER
(2, 5, 1,    CURRENT_TIMESTAMP);   -- Ravi also has APPROVER (for multi-level)


/* ---- CMS_CANTEENROLE (NEW — canteen-scoped roles) ---- */
INSERT INTO CMS_CANTEENROLE (USERID, ROLEID, CANTEENID, ISDEFAULT, VALIDFROM, ASSIGNEDBY) VALUES
(5, 2, 1, 1, CURRENT_TIMESTAMP, 1),   -- Mahesh is CANTEENMAN at HSFC Main (default canteen)
(5, 2, 2, 0, CURRENT_TIMESTAMP, 1),   -- Mahesh is also CANTEENMAN at HSFC Annexe
(7, 3, 1, 1, CURRENT_TIMESTAMP, 1),   -- Priya is CANTEENSTF at HSFC Main (default)
(7, 3, 2, 0, CURRENT_TIMESTAMP, 1);   -- Priya is also CANTEENSTF at HSFC Annexe


/* ---- CMS_CUSTOMER (6 customers: permanent, contract, OCE, visitors) ---- */
-- CUSTOMERID: 1=Ravi, 2=Suresh, 3=Anil, 4=Mahesh, 5=VisitorArun, 6=VisitorPreeti
INSERT INTO CMS_CUSTOMER (USERID, CTYPECODE, DISPNAME, STATUS, VALIDFROM) VALUES
(2,    'PERMANENT',   'Ravi Kumar',                  'A', CURRENT_TIMESTAMP),
(3,    'CONTRACT',    'Suresh B - ABC Facility',     'A', CURRENT_TIMESTAMP),
(4,    'OTHERCENTRE', 'Anil Nair - VSSC',            'A', CURRENT_TIMESTAMP),
(5,    'CONTRACT',    'Mahesh Staff - Canteen Vendor','A', CURRENT_TIMESTAMP),
(NULL, 'VISITOR',     'Arun Sharma',                 'A', CURRENT_TIMESTAMP),
(NULL, 'VISITOR',     'Preeti Verma',                'A', CURRENT_TIMESTAMP);


/* ---- CMS_PERMEMP (4 rows) ---- */
INSERT INTO CMS_PERMEMP (CUSTOMERID, EMPCODE, DEPT, DESIG) VALUES
(1, 'EMP1001', 'Administration',     'Section Officer');

-- Inserting 3 more permanent employees requires 3 more users + customers first.
-- To avoid over-complicating, we add users 9-11 inline:

INSERT INTO CMS_USER (LOGINID, FULLNAME, EMAIL, MOBILENO, PWDHASH, AUTHPROV) VALUES
('EMP1002', 'Deepa Sharma',  'deepa.sharma@isro.gov.in',  '9000000009', '$2b$10$dummyemp2hashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'LOCAL'),
('EMP1003', 'Karthik R',     'karthik.r@isro.gov.in',     '9000000010', '$2b$10$dummyemp3hashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'LOCAL'),
('EMP1004', 'Meena Nair',    'meena.nair@isro.gov.in',    '9000000011', '$2b$10$dummyemp4hashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'LOCAL');

INSERT INTO CMS_CUSTOMER (USERID, CTYPECODE, DISPNAME, STATUS, VALIDFROM) VALUES
(9,  'PERMANENT', 'Deepa Sharma',  'A', CURRENT_TIMESTAMP),
(10, 'PERMANENT', 'Karthik R',     'A', CURRENT_TIMESTAMP),
(11, 'PERMANENT', 'Meena Nair',    'A', CURRENT_TIMESTAMP);

INSERT INTO CMS_PERMEMP (CUSTOMERID, EMPCODE, DEPT, DESIG) VALUES
(7,  'EMP1002', 'Engineering',       'Scientist-C'),
(8,  'EMP1003', 'IT Division',       'Technical Officer'),
(9,  'EMP1004', 'Quality Assurance', 'Section Officer');


/* ---- CMS_CONTEMP (4 rows) ---- */
INSERT INTO CMS_CONTEMP (CUSTOMERID, CONTCODE, VENDORNAME, CONTSTART, CONTEND) VALUES
(2, 'CON2001', 'ABC Facility Services',      '2026-01-01', '2026-12-31'),
(4, 'CAN001',  'Canteen Vendor Services',    '2026-01-01', '2026-12-31');

INSERT INTO CMS_USER (LOGINID, FULLNAME, EMAIL, MOBILENO, PWDHASH, AUTHPROV) VALUES
('CON2002', 'Ramesh G',     'ramesh.g@vendor.com',    '9000000012', '$2b$10$dummycon2hashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'LOCAL'),
('CON2003', 'Lakshmi P',    'lakshmi.p@vendor.com',   '9000000013', '$2b$10$dummycon3hashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'LOCAL');

INSERT INTO CMS_CUSTOMER (USERID, CTYPECODE, DISPNAME, STATUS, VALIDFROM) VALUES
(12, 'CONTRACT', 'Ramesh G - DEF Services',    'A', CURRENT_TIMESTAMP),
(13, 'CONTRACT', 'Lakshmi P - GHI Catering',   'A', CURRENT_TIMESTAMP);

INSERT INTO CMS_CONTEMP (CUSTOMERID, CONTCODE, VENDORNAME, CONTSTART, CONTEND) VALUES
(10, 'CON2002', 'DEF Maintenance Services',   '2026-04-01', '2027-03-31'),
(11, 'CON2003', 'GHI Catering Support',       '2026-06-01', '2027-05-31');


/* ---- CMS_OCEEMP (4 rows) ---- */
INSERT INTO CMS_OCEEMP (CUSTOMERID, EMPCODE, CENTERNAME, DEPT, DESIG, VALIDFROM, VALIDUNTIL) VALUES
(3, 'VSSC1001', 'VSSC', 'Systems',    'Scientist Engineer',  CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY));

INSERT INTO CMS_USER (LOGINID, FULLNAME, EMAIL, MOBILENO, PWDHASH, AUTHPROV) VALUES
('OCESAC01', 'Vikram Patel',   'vikram.patel@sac.gov.in',   '9000000014', '$2b$10$dummyoce2hashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'LOCAL'),
('OCEISAC01','Sunita Rao',     'sunita.rao@isac.gov.in',    '9000000015', '$2b$10$dummyoce3hashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'LOCAL'),
('OCEVSSC02','Mohan Das',      'mohan.das@vssc.gov.in',     '9000000016', '$2b$10$dummyoce4hashxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'LOCAL');

INSERT INTO CMS_CUSTOMER (USERID, CTYPECODE, DISPNAME, STATUS, VALIDFROM) VALUES
(14, 'OTHERCENTRE', 'Vikram Patel - SAC',   'A', CURRENT_TIMESTAMP),
(15, 'OTHERCENTRE', 'Sunita Rao - ISAC',    'A', CURRENT_TIMESTAMP),
(16, 'OTHERCENTRE', 'Mohan Das - VSSC',     'A', CURRENT_TIMESTAMP);

INSERT INTO CMS_OCEEMP (CUSTOMERID, EMPCODE, CENTERNAME, DEPT, DESIG, VALIDFROM, VALIDUNTIL) VALUES
(12, 'SAC3001',  'SAC',  'Remote Sensing',   'Scientist-D',        CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 14 DAY)),
(13, 'ISAC4001', 'ISAC', 'Navigation',       'Scientist-C',        CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY)),
(14, 'VSSC1002', 'VSSC', 'Propulsion',       'Technical Assistant', CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 21 DAY));


/* ---- CMS_VISITOR (4 rows) ---- */
INSERT INTO CMS_VISITOR (CUSTOMERID, VISNAME, VISMOBILE, VISORG, VISPURPOSE, VISDATE, VALIDUNTIL, CREATEDBY, STATUS) VALUES
(5,  'Arun Sharma',   '9000000017', 'XYZ Vendor Pvt Ltd',    'Equipment Installation',    CURRENT_DATE, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 DAY),  6, 'A'),
(6,  'Preeti Verma',  '9000000018', 'PQR Consulting',        'Audit Meeting',             CURRENT_DATE, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 DAY),  6, 'A');

INSERT INTO CMS_CUSTOMER (USERID, CTYPECODE, DISPNAME, STATUS, VALIDFROM, VALIDUNTIL) VALUES
(NULL, 'VISITOR', 'Ganesh Iyer',      'A', CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 2 DAY)),
(NULL, 'VISITOR', 'Shalini Mehta',    'A', CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 DAY));

INSERT INTO CMS_VISITOR (CUSTOMERID, VISNAME, VISMOBILE, VISORG, VISPURPOSE, VISDATE, VALIDUNTIL, CREATEDBY, STATUS) VALUES
(15, 'Ganesh Iyer',    '9000000019', 'LMN Technologies',     'Site Inspection',           CURRENT_DATE, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 2 DAY),  6, 'A'),
(16, 'Shalini Mehta',  '9000000020', 'Freelance Consultant', 'Canteen Assessment Review', CURRENT_DATE, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 DAY),  6, 'A');


/* ---- CMS_ACCKEY (8 rows — covers all customer types) ---- */
INSERT INTO CMS_ACCKEY (CUSTOMERID, KEYTYPE, KEYVALUE, EXPIRESAT, STATUS, CREATEDBY) VALUES
(1,  'EMPCARD',   'EMP_CARD_HASH_1001',      NULL,                                              'A', 1),
(7,  'EMPCARD',   'EMP_CARD_HASH_1002',      NULL,                                              'A', 1),
(8,  'EMPCARD',   'EMP_CARD_HASH_1003',      NULL,                                              'A', 1),
(9,  'EMPCARD',   'EMP_CARD_HASH_1004',      NULL,                                              'A', 1),
(2,  'QR',        'CONTRACT_QR_HASH_2001',   '2026-12-31 23:59:59',                             'A', 1),
(3,  'TEMPTOKEN', 'OCE_TEMP_HASH_1001',      DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY),      'A', 6),
(5,  'VISPASS',   'VISITOR_PASS_HASH_0001',  DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 DAY),       'A', 6),
(6,  'VISPASS',   'VISITOR_PASS_HASH_0002',  DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 DAY),       'A', 6);


/* ---- CMS_APPLVL (4 rows) ---- */
INSERT INTO CMS_APPLVL (LEVELNO, LEVELNAME, ROLEID, DESCR) VALUES
(1, 'Level 1 — Canteen Manager Approval',  2, 'First approval by canteen manager'),
(2, 'Level 2 — Admin Approval',            1, 'Second approval by system administrator'),
(3, 'Level 3 — Committee Approval',        5, 'Third approval by authorised committee approver'),
(4, 'Level 4 — Director Approval',         5, 'Final approval by director office');


/* ---- CMS_ROLESCN (12 rows — comprehensive role-screen permissions) ---- */
INSERT INTO CMS_ROLESCN (ROLEID, SCREENID, CANVIEW, CANCREATE, CANUPDATE, CANDELETE) VALUES
-- ADMIN has full access to administrative screens
(1, 1,  1, 1, 1, 1),   -- User Management
(1, 2,  1, 1, 1, 1),   -- Role Management
(1, 3,  1, 1, 1, 1),   -- Centre Management
(1, 4,  1, 1, 1, 1),   -- Canteen Management
-- CANTEENMAN can manage menu operations
(2, 5,  1, 1, 1, 0),   -- Service Management
(2, 6,  1, 1, 1, 0),   -- Menu Item Management
(2, 7,  1, 1, 1, 0),   -- Item Pricing
(2, 8,  1, 1, 1, 0),   -- Canteen Menu Items
(2, 12, 1, 0, 1, 0),   -- Menu Approval (view + approve/reject)
-- CANTEENSTF can prepare daily menus
(3, 10, 1, 1, 1, 0),   -- Day Menu Management
(3, 11, 1, 1, 1, 0),   -- Menu Templates
-- FRONTOFF can view menu
(4, 13, 1, 1, 0, 0);   -- View Published Menu + assist bookings
