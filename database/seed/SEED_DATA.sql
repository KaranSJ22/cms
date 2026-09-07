USE cms_db;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

-- Clean up existing data to avoid duplicate key errors on rerun
DELETE FROM CMS_HOLIDAY;
DELETE FROM CMS_VISITOR;
DELETE FROM CMS_OCEEMP;
DELETE FROM CMS_CONTEMP;
DELETE FROM CMS_CUSTOMER;
DELETE FROM CMS_CONSUMERROLE;
DELETE FROM CMS_CANTEENROLE;
DELETE FROM CMS_USER;
DELETE FROM CMS_CANTEEN;
DELETE FROM CMS_CENTER;
DELETE FROM CMS_BOOKTYPE;
DELETE FROM CMS_CUSTTYPE;
DELETE FROM CMS_ROLE;

-- ============================================================
-- 1. SEED ROLES
-- ============================================================
INSERT INTO CMS_ROLE (ROLEID, ROLECODE, ROLENAME, DESCR) VALUES 
(1, 'SYSADM', 'System Administrator', 'Full system access'),
(2, 'CNTMGR', 'Canteen Manager', 'Manages canteen operations, menus, and approvals'),
(3, 'CNTAST', 'Canteen Assistant', 'Assists manager with templates and reporting'),
(4, 'CNTSTF', 'Canteen Staff', 'Serving counter kiosk operator');

-- ============================================================
-- 2. SEED CUSTOMER TYPES
-- ============================================================
INSERT INTO CMS_CUSTTYPE (CTYPEID, CTYPECODE, CTYPENAME) VALUES 
(1, 'PRM', 'Permanent Employee'),
(2, 'CNT', 'Contract Employee'),
(3, 'OCE', 'Other Center Employee'),
(4, 'VIS', 'Visitor');

-- ============================================================
-- 3. SEED BOOKING TYPES
-- ============================================================
INSERT INTO CMS_BOOKTYPE (BOOKTYPEID, BOOKTYPECODE, BOOKTYPENAME, STATUSID) VALUES 
(1, 'PB', 'Pre-Booking', 10),
(2, 'KS', 'Kiosk Booking', 10);

-- ============================================================
-- 4. SEED CENTERS & CANTEENS
-- ============================================================
INSERT INTO CMS_CENTER (CENTERID, CENTERCODE, CENTERNAME, LOCATION, STATUSID) VALUES 
(1, 'HQ', 'Headquarters', 'Main Campus', 10);

INSERT INTO CMS_CANTEEN (CANTEENID, CENTERID, CANTEENCODE, CANTEENNAME, LOCATION, STATUSID, CREATEDBY) VALUES 
(1, 1, 'CAN-01', 'Main Canteen', 'Building A', 10, 1),
(2, 1, 'CAN-02', 'Mini Canteen', 'Building B', 10, 1),
(3, 1, 'CAN-03', 'Guest Canteen', 'Building C', 10, 1);

-- ============================================================
-- 5. SEED USERS 
-- Password hash: Using a dummy hash for testing 'password123'
-- ============================================================
INSERT INTO CMS_USER (USERID, LOGINID, FULLNAME, EMAIL, MOBILENO, PWDHASH, ISACTIVE) VALUES 
(1, 'admin', 'System Admin', 'admin@isro.gov.in', '9999999999', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(2, 'mgr1', 'Manager One', 'mgr1@isro.gov.in', '9999999901', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(3, 'mgr2', 'Manager Two', 'mgr2@isro.gov.in', '9999999902', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(4, 'asst1', 'Assistant One', 'asst1@isro.gov.in', '9999999903', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(5, 'asst2', 'Assistant Two', 'asst2@isro.gov.in', '9999999904', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(6, 'staff1', 'Staff One', 'staff1@isro.gov.in', '9999999905', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(7, 'staff2', 'Staff Two', 'staff2@isro.gov.in', '9999999906', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(8, 'staff3', 'Staff Three', 'staff3@isro.gov.in', '9999999907', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(9, 'perm1', 'Perm Emp 1', 'perm1@isro.gov.in', '9999999101', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(10, 'perm2', 'Perm Emp 2', 'perm2@isro.gov.in', '9999999102', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(11, 'perm3', 'Perm Emp 3', 'perm3@isro.gov.in', '9999999103', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(12, 'perm4', 'Perm Emp 4', 'perm4@isro.gov.in', '9999999104', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(13, 'perm5', 'Perm Emp 5', 'perm5@isro.gov.in', '9999999105', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(14, 'perm6', 'Perm Emp 6', 'perm6@isro.gov.in', '9999999106', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(15, 'perm7', 'Perm Emp 7', 'perm7@isro.gov.in', '9999999107', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(16, 'cont1', 'Cont Emp 1', 'cont1@isro.gov.in', '9999999201', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(17, 'cont2', 'Cont Emp 2', 'cont2@isro.gov.in', '9999999202', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(18, 'cont3', 'Cont Emp 3', 'cont3@isro.gov.in', '9999999203', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(19, 'cont4', 'Cont Emp 4', 'cont4@isro.gov.in', '9999999204', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(20, 'cont5', 'Cont Emp 5', 'cont5@isro.gov.in', '9999999205', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(21, 'oce1', 'OCE Emp 1', 'oce1@external.com', '9999999301', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(22, 'oce2', 'OCE Emp 2', 'oce2@external.com', '9999999302', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1),
(23, 'vis1', 'Visitor 1', 'vis1@guest.com', '9999999401', '$2b$10$Aiy6UGHkmFyVghhQpZM3JO.8g3GCeFXwk8B21ZGnlNOGJACP66zRG', 1);

-- ============================================================
-- 6. CANTEEN ROLE MAPPING
-- Manager 1 has Canteen 1 & 2. Manager 2 has Canteen 3.
-- ============================================================
INSERT INTO CMS_CANTEENROLE (USERID, ROLEID, CANTEENID, ISDEFAULT, ISACTIVE) VALUES 
(2, 2, 1, 1, 1), -- mgr1 -> Canteen 1 (default)
(2, 2, 2, 0, 1), -- mgr1 -> Canteen 2
(3, 2, 3, 1, 1), -- mgr2 -> Canteen 3
(4, 3, 1, 1, 1), -- asst1 -> Canteen 1
(5, 3, 2, 1, 1), -- asst2 -> Canteen 2
(6, 4, 1, 1, 1), -- staff1 -> Canteen 1
(7, 4, 2, 1, 1), -- staff2 -> Canteen 2
(8, 4, 3, 1, 1); -- staff3 -> Canteen 3

-- ============================================================
-- 7. CUSTOMERS & EMPLOYEES
-- ============================================================
-- Create CMS_CUSTOMER entries for the eaters (Perm, Cont, OCE, Vis)
INSERT INTO CMS_CUSTOMER (CUSTOMERID, USERID, CTYPECODE, DISPNAME, STATUSID) VALUES 
(1, 9, 'PRM', 'Perm Emp 1', 10),
(2, 10, 'PRM', 'Perm Emp 2', 10),
(3, 11, 'PRM', 'Perm Emp 3', 10),
(4, 12, 'PRM', 'Perm Emp 4', 10),
(5, 13, 'PRM', 'Perm Emp 5', 10),
(6, 14, 'PRM', 'Perm Emp 6', 10),
(7, 15, 'PRM', 'Perm Emp 7', 10),
(8, 16, 'CNT', 'Cont Emp 1', 10),
(9, 17, 'CNT', 'Cont Emp 2', 10),
(10, 18, 'CNT', 'Cont Emp 3', 10),
(11, 19, 'CNT', 'Cont Emp 4', 10),
(12, 20, 'CNT', 'Cont Emp 5', 10),
(13, 21, 'OCE', 'OCE Emp 1', 10),
(14, 22, 'OCE', 'OCE Emp 2', 10),
(15, 23, 'VIS', 'Visitor 1', 10);

-- Permanent Employees
INSERT INTO CMS_PERMEMP (CUSTOMERID, EMPCODE, DEPT, DESIG) VALUES 
(1, 'P001', 'Propulsion', 'Engineer SE'),
(2, 'P002', 'Propulsion', 'Engineer SD'),
(3, 'P003', 'Avionics', 'Scientist SC'),
(4, 'P004', 'Avionics', 'Technician B'),
(5, 'P005', 'Admin', 'Admin Officer'),
(6, 'P006', 'Accounts', 'Accounts Officer'),
(7, 'P007', 'Directorate', 'Director');

-- Contract Employees
INSERT INTO CMS_CONTEMP (CUSTOMERID, CONTCODE, VENDORNAME, CONTSTART, CONTEND) VALUES 
(8, 'C001', 'Vendor A', '2026-01-01', '2026-12-31'),
(9, 'C002', 'Vendor A', '2026-01-01', '2026-12-31'),
(10, 'C003', 'Vendor B', '2026-06-01', '2026-12-31'),
(11, 'C004', 'Vendor B', '2026-06-01', '2026-12-31'),
(12, 'C005', 'Vendor C', '2026-01-01', '2027-01-01');

-- Other Center Employees
INSERT INTO CMS_OCEEMP (CUSTOMERID, EMPCODE, CENTERNAME, DEPT, DESIG) VALUES 
(13, 'O001', 'SAC', 'Payload', 'Engineer SD'),
(14, 'O002', 'URSC', 'Satellite', 'Scientist SC');

-- Visitors
INSERT INTO CMS_VISITOR (CUSTOMERID, VISNAME, VISORG, VISPURPOSE, VISDATE, VALIDUNTIL, CREATEDBY, STATUSID) VALUES 
(15, 'Visitor One', 'Tech Corp', 'Meeting', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 DAY), 1, 10);

-- ============================================================
-- 8. SEED WALLETS (0-Balance for Contract Employees & Visitors)
-- ============================================================
INSERT INTO CMS_WALLET (WALLETID, CUSTOMERID, BALANCE, RESERVEDAMT, STATUSID) VALUES 
(1, 8, 0.00, 0.00, 10),
(2, 9, 0.00, 0.00, 10),
(3, 10, 0.00, 0.00, 10),
(4, 11, 0.00, 0.00, 10),
(5, 12, 0.00, 0.00, 10),
(6, 15, 0.00, 0.00, 10)
ON DUPLICATE KEY UPDATE BALANCE = VALUES(BALANCE);

INSERT INTO CMS_HOLIDAY (HOLIDAYDATE, HOLIDAYNAME, ISRECURRING, STATUSID, CREATEDBY) VALUES 
('2026-08-15', 'Independence Day', 1, 10, 1);

SET FOREIGN_KEY_CHECKS = 1;
