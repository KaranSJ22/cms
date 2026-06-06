
INSERT INTO CMS_STATUS (STATUSCODE, STATUSNAME, STATUSGRP, DESCR) VALUES
('A', 'Active', 'GENERAL', 'Record is active'),
('D', 'Disabled', 'GENERAL', 'Record is disabled'),
('P', 'Pending', 'APPROVAL', 'Approval is pending'),
('APP', 'Approved', 'APPROVAL', 'Approval completed'),
('REJ', 'Rejected', 'APPROVAL', 'Approval rejected'),
('EXP', 'Expired', 'ACCESS', 'Access expired'),
('REV', 'Revoked', 'ACCESS', 'Access revoked'),
('BLK', 'Blocked', 'GENERAL', 'Access blocked');

INSERT INTO CMS_CUSTTYPE (CTYPECODE, CTYPENAME, DESCR) VALUES
('PERMANENT', 'Permanent Employee', 'ISRO/HSFC permanent employee'),
('CONTRACT', 'Contract Employee', 'Contract or vendor employee'),
('VISITOR', 'Visitor', 'Temporary visitor'),
('OTHERCENTRE', 'Other Centre Employee', 'Employee from another ISRO centre');

INSERT INTO CMS_SCREEN (SCREENCODE, SCREENNAME, DESCR, ROUTEPATH) VALUES
('USERMGMT', 'User Management', 'Create and manage users', '/admin/users'),
('ROLEMGMT', 'Role Management', 'Manage roles and permissions', '/admin/roles'),
('SERVMGMT', 'Service Management', 'Manage canteen services', '/manage/services'),
('MENUITEM', 'Menu Item Management', 'Manage menu item master', '/manage/menu-items'),
('DAYSLOT', 'Day Slot Management', 'Manage service slots for dates', '/manage/day-slots'),
('DAYMENU', 'Day Menu Management', 'Staff adds menu for day slots', '/manage/day-menu'),
('MENUAPPR', 'Day Menu Approval', 'Manager approves/rejects day menu', '/manage/menu-approval'),
('VIEWMENU', 'View Approved Menu', 'Customers view approved menu', '/menu');

INSERT INTO CMS_AUTONOS (TBLNAME, DATAITEM, ITEMLEN, FLDTYPE, PREFIXCHAR, STARTNO, STARTDATE, LASTNO, STATUS) VALUES
('CMS_USER', 'LOGINID', 20, 'CHAR', 'U', 1, CURRENT_DATE, 0, 'A'),
('CMS_MENUITEM', 'MENUCODE', 20, 'CHAR', 'M', 1, CURRENT_DATE, 0, 'A'),
('CMS_DAYMENU', 'DMENUNO', 20, 'CHAR', 'D', 1, CURRENT_DATE, 0, 'A'),
('CMS_SERVICE', 'SERVCODE', 20, 'CHAR', 'S', 1, CURRENT_DATE, 0, 'A'),
('CMS_CUSTOMER', 'CUSTNO', 20, 'CHAR', 'C', 1, CURRENT_DATE, 0, 'A');