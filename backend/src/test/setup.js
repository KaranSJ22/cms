import { beforeAll, afterAll } from "vitest";
import bcrypt from "bcrypt";
import { pool } from "../db/connection.js";

// Ensure seed users have a valid bcrypt hash for 'admin123' before running tests
beforeAll(async () => {
  const hash = await bcrypt.hash("admin123", 10);
  await pool.query(
    `UPDATE CMS_USER 
     SET PWDHASH = ? 
     WHERE LOGINID IN (
       'admin', 'mgr1', 'mgr2', 'asst1', 'asst2', 
       'staff1', 'staff2', 'staff3', 
       'perm1', 'perm2', 'perm3', 'perm4', 'perm5', 'perm6', 'perm7', 
       'cont1', 'cont2', 'cont3', 'cont4', 'cont5', 
       'oce1', 'oce2', 'vis1'
     )`,
    [hash]
  );

  // Ensure user 1 (admin) has SYSADM role (roleid 1) in CMS_USERROLE
  await pool.query(
    `INSERT INTO CMS_USERROLE (USERID, ROLEID, ISACTIVE)
     VALUES (1, 1, 1)
     ON DUPLICATE KEY UPDATE ISACTIVE = 1`
  );

  // Ensure SSO_SECRET_KEY is defined in test environment
  if (!process.env.SSO_SECRET_KEY || Buffer.from(process.env.SSO_SECRET_KEY, "utf8").length !== 16) {
    process.env.SSO_SECRET_KEY = "0123456789abcdef";
  }

  // Ensure CMSLISTAUTONO has corrected column aliases (STATUSID AS STATUS)
  try {
    await pool.query(`DROP PROCEDURE IF EXISTS CMSLISTAUTONO`);
    await pool.query(`
      CREATE PROCEDURE CMSLISTAUTONO ()
      BEGIN
          SELECT AUTONOID, TBLNAME, DATAITEM, ITEMLEN, FLDTYPE,
                 PREFIXCHAR, STARTNO, STARTDATE, LASTNO, STATUSID AS STATUS, STATUSID,
                 CREATEDBY, CREATEDAT, UPDATEDAT
          FROM   CMS_AUTONOS
          ORDER BY TBLNAME, DATAITEM;
      END
    `);
  } catch (err) {
    // Ignore if privileges prevent procedure replacement
  }

  // Ensure CMSGETRESOURCECANTEEN exists in test database
  try {
    await pool.query(`DROP PROCEDURE IF EXISTS CMSGETRESOURCECANTEEN`);
    await pool.query(`
      CREATE PROCEDURE CMSGETRESOURCECANTEEN (
          IN PRESOURCETYPE VARCHAR(20),
          IN PRESOURCEID   INT
      )
      BEGIN
          IF PRESOURCETYPE = 'DAYSLOT' THEN
              SELECT DS.CANTEENID
              FROM CMS_DAYSLOT DS
              WHERE DS.DAYSLOTID = PRESOURCEID
              LIMIT 1;
          ELSEIF PRESOURCETYPE = 'DAYMENU' THEN
              SELECT DS.CANTEENID
              FROM CMS_DAYMENU DM
              JOIN CMS_DAYSLOT DS ON DS.DAYSLOTID = DM.DAYSLOTID
              WHERE DM.DAYMENUID = PRESOURCEID
              LIMIT 1;
          ELSEIF PRESOURCETYPE = 'BOOKING' THEN
              SELECT DS.CANTEENID
              FROM CMS_BOOKITEM BI
              JOIN CMS_DAYMENU DM ON DM.DAYMENUID = BI.DAYMENUID
              JOIN CMS_DAYSLOT DS ON DS.DAYSLOTID = DM.DAYSLOTID
              WHERE BI.BOOKID = PRESOURCEID
              LIMIT 1;
          ELSEIF PRESOURCETYPE = 'OFFSERV' THEN
              SELECT os.CANTEENID
              FROM CMS_OFFSERV os
              WHERE os.OFFSERVID = PRESOURCEID
              LIMIT 1;
          ELSEIF PRESOURCETYPE = 'OFFCOMBO' THEN
              SELECT os.CANTEENID
              FROM CMS_OFFCOMBO oc
              JOIN CMS_OFFSERV os ON os.OFFSERVID = oc.OFFSERVID
              WHERE oc.OFFCOMBOID = PRESOURCEID
              LIMIT 1;
          ELSEIF PRESOURCETYPE = 'OFFBOOK' THEN
              SELECT ob.CANTEENID
              FROM CMS_OFFBOOK ob
              WHERE ob.OFFBOOKID = PRESOURCEID
              LIMIT 1;
          ELSE
              SELECT NULL AS CANTEENID WHERE 1 = 0;
          END IF;
      END
    `);
  } catch (err) {
    // Ignore if privileges prevent procedure replacement
  }

  // Ensure CMSUPDATEKIOSKSTATUS exists in test database
  try {
    await pool.query(`DROP PROCEDURE IF EXISTS CMSUPDATEKIOSKSTATUS`);
    await pool.query(`
      CREATE PROCEDURE CMSUPDATEKIOSKSTATUS (
          IN PKIOSKID  INT,
          IN PSTATUSID INT,
          IN PUSERID   INT
      )
      BEGIN
          UPDATE CMS_KIOSK
          SET STATUSID = PSTATUSID,
              UPDATEDBY = PUSERID,
              UPDATEDAT = CURRENT_TIMESTAMP
          WHERE KIOSKID = PKIOSKID;

          SELECT PKIOSKID AS KIOSKID, PSTATUSID AS STATUSID, 'SUCCESS' AS RESULT;
      END
    `);
  } catch (err) {
    // Ignore if privileges prevent procedure replacement
  }

  // Ensure CMSOFFPROCESSAPPROVER supports both APPROVE and FORWARD
  try {
    await pool.query(`DROP PROCEDURE IF EXISTS CMSOFFPROCESSAPPROVER`);
    await pool.query(`
      CREATE PROCEDURE CMSOFFPROCESSAPPROVER (
          IN PBOOKINGID        INT,
          IN PACTION           VARCHAR(20),
          IN PREJREASON        VARCHAR(500),
          IN PAPPROVERUSERID   INT
      )
      BEGIN
          DECLARE VCURRSTATUS  INT;
          DECLARE VNEXTSTATUS  INT;
          DECLARE VACTIONLABEL VARCHAR(20);

          DECLARE EXIT HANDLER FOR SQLEXCEPTION
          BEGIN
              ROLLBACK;
              RESIGNAL;
          END;

          START TRANSACTION;

          SELECT STATUSID INTO VCURRSTATUS
          FROM CMS_OFFBOOK
          WHERE OFFBOOKID = PBOOKINGID
          FOR UPDATE;

          IF VCURRSTATUS IS NULL THEN
              SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Official Booking not found';
          END IF;

          IF VCURRSTATUS != 35 THEN
              SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'This booking is not in a pending approver state';
          END IF;

          IF UPPER(PACTION) IN ('FORWARD', 'APPROVE') THEN
              SET VNEXTSTATUS = 36;
              SET VACTIONLABEL = IF(UPPER(PACTION) = 'APPROVE', 'APPROVED', 'FORWARDED');
          ELSEIF UPPER(PACTION) = 'REJECT' THEN
              SET VNEXTSTATUS = 38;
              SET VACTIONLABEL = 'REJECTED';
          ELSE
              SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Invalid approver action. Expected APPROVE, FORWARD, or REJECT';
          END IF;

          UPDATE CMS_OFFBOOK
          SET STATUSID = VNEXTSTATUS,
              UPDATEDBY = PAPPROVERUSERID,
              UPDATEDAT = CURRENT_TIMESTAMP
          WHERE OFFBOOKID = PBOOKINGID;

          INSERT INTO CMS_OFFAPPR (OFFBOOKID, ACTIONBY, ACTIONROLE, ACTIONCODE, REJREASON)
          VALUES (PBOOKINGID, PAPPROVERUSERID, 'APPROVER', VACTIONLABEL, PREJREASON);

          COMMIT;

          SELECT 
              PBOOKINGID AS OFFBOOKID,
              VACTIONLABEL AS ACTIONCODE,
              VACTIONLABEL AS ACTION,
              VNEXTSTATUS AS STATUSID;
      END
    `);
  } catch (err) {
    // Ignore if privileges prevent procedure replacement
  }

  // Ensure CMSOFFPROCESSMANAGER supports both ACCEPT and CONFIRM
  try {
    await pool.query(`DROP PROCEDURE IF EXISTS CMSOFFPROCESSMANAGER`);
    await pool.query(`
      CREATE PROCEDURE CMSOFFPROCESSMANAGER (
          IN PBOOKINGID      INT,
          IN PACTION         VARCHAR(20),
          IN PREJREASON      VARCHAR(500),
          IN PMANAGERUSERID  INT
      )
      BEGIN
          DECLARE VCANTEENID   INT;
          DECLARE VCURRSTATUS  INT;
          DECLARE VNEXTSTATUS  INT;
          DECLARE VACTIONLABEL VARCHAR(20);

          DECLARE EXIT HANDLER FOR SQLEXCEPTION
          BEGIN
              ROLLBACK;
              RESIGNAL;
          END;

          START TRANSACTION;

          SELECT CANTEENID, STATUSID
          INTO VCANTEENID, VCURRSTATUS
          FROM CMS_OFFBOOK
          WHERE OFFBOOKID = PBOOKINGID
          FOR UPDATE;

          IF VCANTEENID IS NULL THEN
              SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Official Booking not found';
          END IF;

          IF VCURRSTATUS != 36 THEN
              SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'This booking is not awaiting Canteen Manager confirmation';
          END IF;

          IF UPPER(PACTION) IN ('ACCEPT', 'CONFIRM') THEN
              SET VNEXTSTATUS = 37;
              SET VACTIONLABEL = 'CONFIRMED';
          ELSEIF UPPER(PACTION) = 'REJECT' THEN
              SET VNEXTSTATUS = 38;
              SET VACTIONLABEL = 'REJECTED';
          ELSE
              SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Invalid manager action. Expected ACCEPT, CONFIRM, or REJECT';
          END IF;

          UPDATE CMS_OFFBOOK
          SET STATUSID = VNEXTSTATUS,
              UPDATEDBY = PMANAGERUSERID,
              UPDATEDAT = CURRENT_TIMESTAMP
          WHERE OFFBOOKID = PBOOKINGID;

          INSERT INTO CMS_OFFAPPR (OFFBOOKID, ACTIONBY, ACTIONROLE, ACTIONCODE, REJREASON)
          VALUES (PBOOKINGID, PMANAGERUSERID, 'CANTEEN_MANAGER', VACTIONLABEL, PREJREASON);

          COMMIT;

          SELECT 
              PBOOKINGID AS OFFBOOKID,
              VACTIONLABEL AS ACTIONCODE,
              VACTIONLABEL AS ACTION,
              VNEXTSTATUS AS STATUSID;
      END
    `);
  } catch (err) {
    // Ignore if privileges prevent procedure replacement
  }

  // Ensure Official Booking fulfillment statuses (61, 62, 63) exist
  try {
    await pool.query(`
      INSERT INTO CMS_STATUS (STATUSID, STATUSCODE, STATUSNAME, STATUSGRP, DESCR)
      VALUES 
        (61, 'RDY', 'Ready for Dispatch', 'OFF_BOOK', 'Packed and ready for delivery runner'),
        (62, 'DISP', 'Dispatched', 'OFF_BOOK', 'Dispatched / In transit to event venue'),
        (63, 'DELV', 'Delivered', 'OFF_BOOK', 'Delivered and fulfilled at event venue')
      ON DUPLICATE KEY UPDATE STATUSNAME = VALUES(STATUSNAME), STATUSCODE = VALUES(STATUSCODE), STATUSGRP = VALUES(STATUSGRP)
    `);
  } catch (err) {
    // Ignore if already present
  }

  // Ensure CMS_OFFPREP table exists
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS CMS_OFFPREP (
          CANTEENID INT NOT NULL,
          PREPDATE DATE NOT NULL,
          MENUITEMID INT NOT NULL,
          STATUS VARCHAR(20) NOT NULL DEFAULT 'PENDING',
          UPDATEDBY INT NOT NULL,
          UPDATEDAT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (CANTEENID, PREPDATE, MENUITEMID),
          CONSTRAINT FK_OFFPREP_CANTEENID FOREIGN KEY (CANTEENID) REFERENCES CMS_CANTEEN(CANTEENID),
          CONSTRAINT FK_OFFPREP_MENUITEMID FOREIGN KEY (MENUITEMID) REFERENCES CMS_MENUITEM(MENUITEMID),
          CONSTRAINT FK_OFFPREP_UPDATEDBY FOREIGN KEY (UPDATEDBY) REFERENCES CMS_USER(USERID),
          CONSTRAINT CK_OFFPREP_STATUS CHECK (STATUS IN ('PENDING', 'COOKING', 'READY'))
      ) ENGINE=InnoDB
    `);
  } catch (err) {
    // Ignore if table exists
  }

  // Ensure CMSOFFUPDATEFULFILLMENT exists in test database
  try {
    await pool.query(`DROP PROCEDURE IF EXISTS CMSOFFUPDATEFULFILLMENT`);
    await pool.query(`
      CREATE PROCEDURE CMSOFFUPDATEFULFILLMENT (
          IN PBOOKINGID INT,
          IN PNEWSTATUS VARCHAR(20),
          IN PUSERID    INT
      )
      BEGIN
          DECLARE VCURRSTATUS INT;
          DECLARE VNEXTSTATUS INT;
          DECLARE VACTIONLABEL VARCHAR(20);

          DECLARE EXIT HANDLER FOR SQLEXCEPTION
          BEGIN
              ROLLBACK;
              RESIGNAL;
          END;

          START TRANSACTION;

          SELECT STATUSID
          INTO VCURRSTATUS
          FROM CMS_OFFBOOK
          WHERE OFFBOOKID = PBOOKINGID
          FOR UPDATE;

          IF VCURRSTATUS IS NULL THEN
              SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Official Booking not found';
          END IF;

          IF UPPER(PNEWSTATUS) IN ('PACKING', 'CONFIRMED', 'CNF') THEN
              SET VNEXTSTATUS = 37;
              SET VACTIONLABEL = 'CONFIRMED';
          ELSEIF UPPER(PNEWSTATUS) IN ('READY', 'RDY') THEN
              SET VNEXTSTATUS = 61;
              SET VACTIONLABEL = 'READY';
          ELSEIF UPPER(PNEWSTATUS) IN ('DISPATCHED', 'DISP') THEN
              SET VNEXTSTATUS = 62;
              SET VACTIONLABEL = 'DISPATCHED';
          ELSEIF UPPER(PNEWSTATUS) IN ('DELIVERED', 'DELV') THEN
              SET VNEXTSTATUS = 63;
              SET VACTIONLABEL = 'DELIVERED';
          ELSE
              SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Invalid fulfillment status. Expected PACKING/CONFIRMED, READY, DISPATCHED, or DELIVERED';
          END IF;

          IF VCURRSTATUS NOT IN (37, 61, 62, 63) THEN
              SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Booking must be Confirmed before updating kitchen fulfillment status';
          END IF;

          UPDATE CMS_OFFBOOK
          SET STATUSID = VNEXTSTATUS,
              UPDATEDBY = PUSERID,
              UPDATEDAT = CURRENT_TIMESTAMP
          WHERE OFFBOOKID = PBOOKINGID;

          INSERT INTO CMS_OFFAPPR (OFFBOOKID, ACTIONBY, ACTIONROLE, ACTIONCODE, REJREASON)
          VALUES (PBOOKINGID, PUSERID, 'KITCHEN_STAFF', VACTIONLABEL, NULL);

          COMMIT;

          SELECT 
              ob.OFFBOOKID,
              ob.BOOKNO,
              ob.STATUSID,
              st.STATUSCODE,
              st.STATUSNAME
          FROM CMS_OFFBOOK ob
          JOIN CMS_STATUS st ON st.STATUSID = ob.STATUSID
          WHERE ob.OFFBOOKID = PBOOKINGID;
      END
    `);
  } catch (err) {
    // Ignore if privileges prevent procedure replacement
  }

  // Ensure CMSOFFUPDATEDISHPREP exists in test database
  try {
    await pool.query(`DROP PROCEDURE IF EXISTS CMSOFFUPDATEDISHPREP`);
    await pool.query(`
      CREATE PROCEDURE CMSOFFUPDATEDISHPREP (
          IN PCANTEENID INT,
          IN PPREPDATE  DATE,
          IN PMENUITEMID INT,
          IN PSTATUS    VARCHAR(20),
          IN PUSERID    INT
      )
      BEGIN
          DECLARE VUPPERSTATUS VARCHAR(20);

          DECLARE EXIT HANDLER FOR SQLEXCEPTION
          BEGIN
              ROLLBACK;
              RESIGNAL;
          END;

          SET VUPPERSTATUS = UPPER(PSTATUS);
          IF VUPPERSTATUS NOT IN ('PENDING', 'COOKING', 'READY') THEN
              SIGNAL SQLSTATE '45000'
                  SET MESSAGE_TEXT = 'Invalid dish prep status. Expected PENDING, COOKING, or READY';
          END IF;

          START TRANSACTION;

          INSERT INTO CMS_OFFPREP (CANTEENID, PREPDATE, MENUITEMID, STATUS, UPDATEDBY, UPDATEDAT)
          VALUES (PCANTEENID, PPREPDATE, PMENUITEMID, VUPPERSTATUS, PUSERID, CURRENT_TIMESTAMP)
          ON DUPLICATE KEY UPDATE 
              STATUS = VUPPERSTATUS,
              UPDATEDBY = PUSERID,
              UPDATEDAT = CURRENT_TIMESTAMP;

          COMMIT;

          SELECT 
              PCANTEENID AS CANTEENID,
              PPREPDATE AS PREPDATE,
              PMENUITEMID AS MENUITEMID,
              VUPPERSTATUS AS STATUS,
              CURRENT_TIMESTAMP AS UPDATEDAT;
      END
    `);
  } catch (err) {
    // Ignore if privileges prevent procedure replacement
  }

  // Ensure CMSOFFGETKITCHENPREP exists in test database
  try {
    await pool.query(`DROP PROCEDURE IF EXISTS CMSOFFGETKITCHENPREP`);
    await pool.query(`
      CREATE PROCEDURE CMSOFFGETKITCHENPREP (
          IN PCANTEENID   INT,
          IN PTARGETDATE  DATE
      )
      BEGIN
          SELECT 
              mi.MENUITEMID,
              mi.MENUITEMID AS ITEMID,
              mi.ITEMNAME AS MENUNAME,
              mi.ITEMNAME,
              mi.SHORTNAME,
              COALESCE(s.SERVNAME, mi.SHORTNAME, 'General') AS CATCODE,
              COALESCE(s.SERVNAME, 'General') AS CATNAME,
              SUM(oci.QTY * ob.QUANTITY) AS TOTAL_PREP_QTY,
              COUNT(DISTINCT ob.OFFBOOKID) AS ORDER_COUNT,
              COUNT(DISTINCT ob.OFFBOOKID) AS TOTAL_ORDERS_COUNT,
              COALESCE(op.STATUS, 'PENDING') AS PREP_STATUS,
              op.UPDATEDAT AS PREP_UPDATEDAT
          FROM CMS_OFFBOOK ob
          JOIN CMS_OFFCOMBDT oci ON oci.OFFCOMBOID = ob.OFFCOMBOID
          JOIN CMS_MENUITEM mi ON mi.MENUITEMID = oci.MENUITEMID
          LEFT JOIN CMS_SERVICE s ON s.SERVICEID = mi.SERVICEID
          LEFT JOIN CMS_OFFPREP op ON op.CANTEENID = PCANTEENID 
                                  AND op.PREPDATE = PTARGETDATE 
                                  AND op.MENUITEMID = mi.MENUITEMID
          WHERE ob.CANTEENID = PCANTEENID
            AND ob.STATUSID IN (37, 61, 62, 63)
            AND DATE(ob.EVENTDATETIME) = PTARGETDATE
          GROUP BY 
              mi.MENUITEMID, 
              mi.ITEMNAME, 
              mi.SHORTNAME, 
              s.SERVNAME, 
              op.STATUS, 
              op.UPDATEDAT,
              COALESCE(s.SERVNAME, mi.SHORTNAME, 'General'),
              COALESCE(s.SERVNAME, 'General')
          ORDER BY CATCODE ASC, mi.ITEMNAME ASC;

          SELECT 
              oci.MENUITEMID,
              ob.OFFBOOKID,
              ob.BOOKNO,
              ob.PURPOSE,
              ob.VENUE,
              ob.EVENTDATETIME,
              ob.QUANTITY AS BOOKING_SERVINGS,
              oci.QTY AS COMBO_ITEM_QTY,
              (oci.QTY * ob.QUANTITY) AS PREP_QTY,
              u_emp.FULLNAME AS REQUESTER_NAME,
              u_emp.MOBILENO AS REQUESTER_PHONE,
              pe.EMPCODE AS REQUESTER_EMPCODE,
              pe.DEPT AS REQUESTER_DEPT,
              pe.DESIG AS REQUESTER_DESIG
          FROM CMS_OFFBOOK ob
          JOIN CMS_OFFCOMBDT oci ON oci.OFFCOMBOID = ob.OFFCOMBOID
          JOIN CMS_USER u_emp ON u_emp.USERID = ob.BOOKEDBY
          JOIN CMS_CUSTOMER cust ON cust.CUSTOMERID = ob.CUSTOMERID
          LEFT JOIN CMS_PERMEMP pe ON pe.CUSTOMERID = cust.CUSTOMERID
          WHERE ob.CANTEENID = PCANTEENID
            AND ob.STATUSID IN (37, 61, 62, 63)
            AND DATE(ob.EVENTDATETIME) = PTARGETDATE
          ORDER BY ob.EVENTDATETIME ASC;

          SELECT 
              COUNT(DISTINCT ob.OFFBOOKID) AS TOTAL_EVENTS,
              COALESCE(SUM(ob.QUANTITY), 0) AS TOTAL_SERVINGS,
              COALESCE(SUM(ob.NOOFPEOPLE), 0) AS TOTAL_ATTENDEES,
              MIN(ob.EVENTDATETIME) AS EARLIEST_EVENT
          FROM CMS_OFFBOOK ob
          WHERE ob.CANTEENID = PCANTEENID
            AND ob.STATUSID IN (37, 61, 62, 63)
            AND DATE(ob.EVENTDATETIME) = PTARGETDATE;
      END
    `);
  } catch (err) {
    // Ignore if privileges prevent procedure replacement
  }

  // Ensure CMSOFFGETAPPROVERLEVEL exists in test database
  try {
    await pool.query(`DROP PROCEDURE IF EXISTS CMSOFFGETAPPROVERLEVEL`);
    await pool.query(`
      CREATE PROCEDURE CMSOFFGETAPPROVERLEVEL (
          IN PUSERID INT
      )
      BEGIN
          SELECT 
              u.USERID,
              u.FULLNAME,
              pe.EMPCODE,
              pe.DEPT,
              pe.DESIG,
              pe.EMPLEVEL,
              pe.EMPLEVEL AS LEVEL,
              lm.APPRLVL
          FROM CMS_USER u
          JOIN CMS_CUSTOMER c ON c.USERID = u.USERID
          JOIN CMS_PERMEMP pe ON pe.CUSTOMERID = c.CUSTOMERID
          JOIN CMS_LVLMAP lm ON lm.EMPLEVEL = pe.EMPLEVEL AND lm.ISACTIVE = 1
          WHERE u.USERID = PUSERID
            AND u.ISACTIVE = 1
            AND c.STATUSID = 10;
      END
    `);
  } catch (err) {
    // Ignore if privileges prevent procedure replacement
  }
});

// Ensure MySQL connection pool is cleanly closed after tests finish
afterAll(async () => {
  try {
    await pool.end();
  } catch (err) {
    // Ignore if already ended
  }
});
