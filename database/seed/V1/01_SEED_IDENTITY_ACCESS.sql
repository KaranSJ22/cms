INSERT INTO CMS_USER (LOGINID, FULLNAME, EMAIL, MOBILENO, PWDHASH, AUTHPROV) VALUES
('ADMIN01', 'System Admin', 'admin.cms@isro.gov.in', '9000000001', '$2b$10$dummyadminhash', 'LOCAL'),
('EMP1001', 'Ravi Kumar', 'ravi.kumar@isro.gov.in', '9000000002', '$2b$10$dummyemphash', 'LOCAL'),
('CON2001', 'Suresh B', 'suresh.vendor@example.com', '9000000003', '$2b$10$dummyconhash', 'LOCAL'),
('OCEVSSC01', 'Anil Nair', 'anil.nair@vssc.gov.in', '9000000004', '$2b$10$dummyocehash', 'LOCAL'),
('CAN001', 'Mahesh Staff', 'mahesh.canteen@example.com', '9000000005', '$2b$10$dummycanhash', 'LOCAL'),
('FOC001', 'Front Office User', 'frontoffice@isro.gov.in', '9000000006', '$2b$10$dummyfochash', 'LOCAL');

INSERT INTO CMS_ROLE (ROLECODE, ROLENAME, DESCR) VALUES
('ADMIN', 'System Administrator', 'Can manage system users and configuration'),
('CANTEENMAN', 'Canteen Manager', 'Can approve menu and manage canteen operations'),
('CANTEENSTF', 'Canteen Staff', 'Can add menu and handle canteen operations'),
('FRONTOFF', 'Front Office', 'Can assist and book on behalf of customers'),
('APPROVER', 'Approver', 'Can approve requests based on approval level');

INSERT INTO CMS_USRROLE (USERID, ROLEID, ASSIGNEDBY, VALIDFROM) VALUES
(1, 1, NULL, CURRENT_TIMESTAMP),
(5, 2, 1, CURRENT_TIMESTAMP),
(5, 3, 1, CURRENT_TIMESTAMP),
(6, 4, 1, CURRENT_TIMESTAMP),
(2, 5, 1, CURRENT_TIMESTAMP);

INSERT INTO CMS_CUSTOMER (USERID, CTYPECODE, DISPNAME, STATUS, VALIDFROM) VALUES
(2, 'PERMANENT', 'Ravi Kumar', 'A', CURRENT_TIMESTAMP),
(3, 'CONTRACT', 'Suresh B - ABC Facility Services', 'A', CURRENT_TIMESTAMP),
(4, 'OTHERCENTRE', 'Anil Nair - VSSC', 'A', CURRENT_TIMESTAMP),
(5, 'CONTRACT', 'Mahesh Staff - Canteen', 'A', CURRENT_TIMESTAMP),
(NULL, 'VISITOR', 'Visitor - XYZ Vendor', 'A', CURRENT_TIMESTAMP);

INSERT INTO CMS_PERMEMP (CUSTOMERID, EMPCODE, DEPT, DESIG) VALUES
(1, 'EMP1001', 'Administration', 'Section Officer');

INSERT INTO CMS_CONTEMP (CUSTOMERID, CONTCODE, VENDORNAME, CONTSTART, CONTEND) VALUES
(2, 'CON2001', 'ABC Facility Services', '2026-01-01', '2026-12-31'),
(4, 'CAN001', 'Canteen Vendor Services', '2026-01-01', '2026-12-31');

INSERT INTO CMS_OCEEMP (CUSTOMERID, EMPCODE, CENTRENAME, DEPT, DESIG, VALIDFROM, VALIDUNTIL) VALUES
(3, 'VSSC1001', 'VSSC', 'Systems', 'Scientist Engineer', CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY));

INSERT INTO CMS_VISITOR (CUSTOMERID, VISNAME, VISMOBILE, VISORG, VISPURPOSE, VISDATE, VALIDUNTIL, CREATEDBY, STATUS) VALUES
(5, 'Arun Sharma', '9000000007', 'XYZ Vendor Pvt Ltd', 'Meeting', CURRENT_DATE, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 6, 'A');

INSERT INTO CMS_ACCKEY (CUSTOMERID, KEYTYPE, KEYVALUE, EXPIRESAT, STATUS, CREATEDBY) VALUES
(1, 'EMPCARD', 'EMP_CARD_HASH_1001', NULL, 'A', 1),
(2, 'QR', 'CONTRACT_QR_HASH_2001', '2026-12-31 23:59:59', 'A', 1),
(3, 'TEMPTOKEN', 'OCE_TEMP_HASH_1001', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY), 'A', 6),
(5, 'VISPASS', 'VISITOR_PASS_HASH_0001', DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 'A', 6);

INSERT INTO CMS_APPLVL (LEVELNO, LEVELNAME, ROLEID, DESCR) VALUES
(1, 'Level 1 Approval', 5, 'First approval level'),
(2, 'Level 2 Approval', 5, 'Second approval level');

INSERT INTO CMS_ROLESCN (ROLEID, SCREENID, CANVIEW, CANCREATE, CANUPDATE, CANDELETE) VALUES
(1, 1, 1, 1, 1, 1),
(1, 2, 1, 1, 1, 1),
(2, 3, 1, 1, 1, 0),
(2, 4, 1, 1, 1, 0),
(2, 7, 1, 0, 1, 0),
(3, 6, 1, 1, 1, 0),
(4, 8, 1, 1, 0, 0),
(5, 7, 1, 0, 1, 0);
