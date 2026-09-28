USE cms_db;

DROP PROCEDURE IF EXISTS CMSOFFLISTSERVICES;
DROP PROCEDURE IF EXISTS CMSOFFGETSERVICE;
DROP PROCEDURE IF EXISTS CMSOFFLISTMENUITEMS;
DROP PROCEDURE IF EXISTS CMSOFFLISTLEVELMAPS;
DROP PROCEDURE IF EXISTS CMSOFFGETAPPROVERS;
DROP PROCEDURE IF EXISTS CMSOFFGETBOOKING;
DROP PROCEDURE IF EXISTS CMSOFFLISTMYBOOKINGS;
DROP PROCEDURE IF EXISTS CMSOFFLISTASSIGNEDAPPR;
DROP PROCEDURE IF EXISTS CMSOFFLISTMGRPENDING;
DROP PROCEDURE IF EXISTS CMSOFFLISTCONFIRMED;
DROP PROCEDURE IF EXISTS CMSOFFGETKITCHENPREP;
DROP PROCEDURE IF EXISTS CMSOFFGETBOOKINGHEADER;
DROP PROCEDURE IF EXISTS CMSOFFGETSERVICEHEADER;
DROP PROCEDURE IF EXISTS CMSOFFGETCOMBOHEADER;

DELIMITER $$

/* ============================================================
   1. CMSOFFLISTSERVICES — List Official Services for Canteen
   Returns 3 result sets:
     1. Service headers
     2. Active combos for these services
     3. Combo dish items with official price
   ============================================================ */
CREATE PROCEDURE CMSOFFLISTSERVICES (
    IN PCANTEENID INT,
    IN PSTATUSID  INT
)
BEGIN
    -- Result Set 1: Services
    SELECT 
        os.OFFSERVID,
        os.CANTEENID,
        c.CANTEENNAME,
        os.SERVNAME,
        os.DESCR,
        os.CUTOFFHOURS,
        os.REQAPPRLVL,
        os.STATUSID,
        st.STATUSNAME,
        os.CREATEDAT
    FROM CMS_OFFSERV os
    JOIN CMS_CANTEEN c ON c.CANTEENID = os.CANTEENID
    JOIN CMS_STATUS st ON st.STATUSID = os.STATUSID
    WHERE os.CANTEENID = PCANTEENID
      AND (PSTATUSID IS NULL OR os.STATUSID = PSTATUSID)
    ORDER BY os.OFFSERVID DESC;

    -- Result Set 2: Combos
    SELECT 
        oc.OFFCOMBOID,
        oc.OFFSERVID,
        oc.COMBONAME,
        oc.DESCR,
        oc.GROSSPRICE,
        oc.HANDLINGCHARGE,
        oc.COMBOPRICE,
        oc.STATUSID,
        st.STATUSNAME
    FROM CMS_OFFCOMBO oc
    JOIN CMS_STATUS st ON st.STATUSID = oc.STATUSID
    JOIN CMS_OFFSERV os ON os.OFFSERVID = oc.OFFSERVID
    WHERE os.CANTEENID = PCANTEENID
      AND (PSTATUSID IS NULL OR os.STATUSID = PSTATUSID)
      AND oc.STATUSID = 10
    ORDER BY oc.OFFCOMBOID ASC;

    -- Result Set 3: Combo Items
    SELECT 
        oci.OFFCOMBOID,
        oci.COMBOITEMID,
        oci.MENUITEMID,
        mi.ITEMNAME AS MENUNAME,
        mi.ITEMNAME,
        mi.SHORTNAME,
        COALESCE(s.SERVNAME, mi.SHORTNAME, 'Item') AS CATCODE,
        oci.QTY,
        COALESCE(
          (SELECT d.PRICE 
           FROM CMS_ITEMPRICE p
           JOIN CMS_ITEMPRICEDT d ON d.ITEMPRICEID = p.ITEMPRICEID
           WHERE p.MENUITEMID = mi.MENUITEMID 
             AND d.CTYPECODE = 'OFF'
             AND p.STATUSID = 10
           ORDER BY p.EFFFROM DESC LIMIT 1), 
          0.00
        ) AS OFFPRICE
    FROM CMS_OFFCOMBO_ITEM oci
    JOIN CMS_MENUITEM mi ON mi.MENUITEMID = oci.MENUITEMID
    LEFT JOIN CMS_SERVICE s ON s.SERVICEID = mi.SERVICEID
    JOIN CMS_OFFCOMBO oc ON oc.OFFCOMBOID = oci.OFFCOMBOID
    JOIN CMS_OFFSERV os ON os.OFFSERVID = oc.OFFSERVID
    WHERE os.CANTEENID = PCANTEENID
      AND (PSTATUSID IS NULL OR os.STATUSID = PSTATUSID)
      AND oc.STATUSID = 10
    ORDER BY mi.ITEMNAME ASC;
END$$


/* ============================================================
   2. CMSOFFGETSERVICE — Service Details by ID
   Returns 3 result sets:
     1. Service header
     2. Combos for this service
     3. Dish items for all combos of this service
   ============================================================ */
CREATE PROCEDURE CMSOFFGETSERVICE (
    IN POFFSERVID INT
)
BEGIN
    -- Result Set 1: Service Header
    SELECT 
        os.OFFSERVID,
        os.CANTEENID,
        c.CANTEENNAME,
        os.SERVNAME,
        os.DESCR,
        os.CUTOFFHOURS,
        os.REQAPPRLVL,
        os.STATUSID,
        st.STATUSNAME,
        os.CREATEDAT
    FROM CMS_OFFSERV os
    JOIN CMS_CANTEEN c ON c.CANTEENID = os.CANTEENID
    JOIN CMS_STATUS st ON st.STATUSID = os.STATUSID
    WHERE os.OFFSERVID = POFFSERVID;

    -- Result Set 2: Combos
    SELECT 
        oc.OFFCOMBOID,
        oc.OFFSERVID,
        oc.COMBONAME,
        oc.DESCR,
        oc.GROSSPRICE,
        oc.HANDLINGCHARGE,
        oc.COMBOPRICE,
        oc.STATUSID,
        st.STATUSNAME
    FROM CMS_OFFCOMBO oc
    JOIN CMS_STATUS st ON st.STATUSID = oc.STATUSID
    WHERE oc.OFFSERVID = POFFSERVID;

    -- Result Set 3: Combo Items
    SELECT 
        oci.OFFCOMBOID,
        oci.COMBOITEMID,
        oci.MENUITEMID,
        mi.ITEMNAME AS MENUNAME,
        mi.ITEMNAME,
        mi.SHORTNAME,
        COALESCE(s.SERVNAME, mi.SHORTNAME, 'Item') AS CATCODE,
        oci.QTY,
        COALESCE(
          (SELECT d.PRICE 
           FROM CMS_ITEMPRICE p
           JOIN CMS_ITEMPRICEDT d ON d.ITEMPRICEID = p.ITEMPRICEID
           WHERE p.MENUITEMID = mi.MENUITEMID 
             AND d.CTYPECODE = 'OFF'
             AND p.STATUSID = 10
           ORDER BY p.EFFFROM DESC LIMIT 1), 
          0.00
        ) AS OFFPRICE
    FROM CMS_OFFCOMBO_ITEM oci
    JOIN CMS_MENUITEM mi ON mi.MENUITEMID = oci.MENUITEMID
    LEFT JOIN CMS_SERVICE s ON s.SERVICEID = mi.SERVICEID
    WHERE oci.OFFCOMBOID IN (SELECT OFFCOMBOID FROM CMS_OFFCOMBO WHERE OFFSERVID = POFFSERVID)
    ORDER BY mi.ITEMNAME ASC;
END$$


/* ============================================================
   3. CMSOFFLISTMENUITEMS — Active Menu Items with Official Pricing
   ============================================================ */
CREATE PROCEDURE CMSOFFLISTMENUITEMS (
    IN PCANTEENID INT
)
BEGIN
    SELECT 
        mi.MENUITEMID,
        mi.MENUCODE,
        mi.ITEMNAME AS MENUNAME,
        mi.ITEMNAME,
        mi.SHORTNAME,
        s.SERVICEID,
        s.SERVNAME,
        COALESCE(s.SERVNAME, mi.SHORTNAME, 'Item') AS CATCODE,
        mi.OFFSER,
        mi.STATUSID,
        COALESCE(
          (SELECT d.PRICE 
           FROM CMS_ITEMPRICE p
           JOIN CMS_ITEMPRICEDT d ON d.ITEMPRICEID = p.ITEMPRICEID
           WHERE p.MENUITEMID = mi.MENUITEMID 
             AND d.CTYPECODE = 'OFF'
             AND p.STATUSID = 10
           ORDER BY p.EFFFROM DESC LIMIT 1), 
          0.00
        ) AS OFFPRICE,
        COALESCE(
          (SELECT d.PRICE 
           FROM CMS_ITEMPRICE p
           JOIN CMS_ITEMPRICEDT d ON d.ITEMPRICEID = p.ITEMPRICEID
           WHERE p.MENUITEMID = mi.MENUITEMID 
             AND d.CTYPECODE = 'OFF'
             AND p.STATUSID = 10
           ORDER BY p.EFFFROM DESC LIMIT 1), 
          0.00
        ) AS UNITPRICE
    FROM CMS_MENUITEM mi
    LEFT JOIN CMS_SERVICE s ON s.SERVICEID = mi.SERVICEID
    WHERE mi.STATUSID = 10 
      AND mi.OFFSER = 1
    HAVING OFFPRICE > 0
    ORDER BY mi.ITEMNAME ASC;
END$$


/* ============================================================
   4. CMSOFFLISTLEVELMAPS — List Employee Level to Tier Mappings
   ============================================================ */
CREATE PROCEDURE CMSOFFLISTLEVELMAPS ()
BEGIN
    SELECT 
        LVLMAPID,
        EMPLEVEL,
        APPRLVL,
        ISACTIVE,
        UPDATEDAT
    FROM CMS_LVLMAP
    ORDER BY EMPLEVEL ASC;
END$$


/* ============================================================
   5. CMSOFFGETAPPROVERS — Eligible Approvers for Tier Level
   ============================================================ */
CREATE PROCEDURE CMSOFFGETAPPROVERS (
    IN PAPPRLVL          VARCHAR(10),
    IN PREQUESTERUSERID  INT
)
BEGIN
    SELECT 
        u.USERID,
        u.FULLNAME,
        pe.EMPCODE,
        pe.DEPT,
        pe.DESIG,
        pe.LEVEL,
        lm.APPRLVL
    FROM CMS_USER u
    JOIN CMS_CUSTOMER c ON c.USERID = u.USERID
    JOIN CMS_PERMEMP pe ON pe.CUSTOMERID = c.CUSTOMERID
    JOIN CMS_LVLMAP lm ON lm.EMPLEVEL = pe.LEVEL AND lm.ISACTIVE = 1
    WHERE u.ISACTIVE = 1
      AND c.STATUSID = 10
      AND (PREQUESTERUSERID IS NULL OR u.USERID != PREQUESTERUSERID)
      AND (
          PAPPRLVL IS NULL 
          OR (PAPPRLVL = 'L1' AND lm.APPRLVL IN ('L1', 'L2'))
          OR (PAPPRLVL = 'L2' AND lm.APPRLVL = 'L2')
      )
    ORDER BY u.FULLNAME ASC;
END$$


/* ============================================================
   6. CMSOFFGETBOOKING — Complete Official Booking Details
   Returns 3 result sets:
     1. Booking header with user & approver metadata
     2. Combo dish items
     3. Audit trail history
   ============================================================ */
CREATE PROCEDURE CMSOFFGETBOOKING (
    IN PBOOKINGID INT
)
BEGIN
    -- Result Set 1: Header
    SELECT 
        ob.OFFBOOKID,
        ob.BOOKNO,
        ob.CANTEENID,
        c.CANTEENNAME,
        ob.OFFSERVID,
        os.SERVNAME,
        os.REQAPPRLVL,
        ob.OFFCOMBOID,
        oc.COMBONAME,
        oc.GROSSPRICE,
        oc.HANDLINGCHARGE AS COMBO_HANDLINGCHARGE,
        ob.CUSTOMERID,
        u_emp.FULLNAME AS REQUESTER_NAME,
        pe.EMPCODE AS REQUESTER_EMPCODE,
        pe.DEPT AS REQUESTER_DEPT,
        pe.DESIG AS REQUESTER_DESIG,
        ob.BOOKEDBY,
        ob.PURPOSE,
        ob.VENUE,
        ob.EVENTDATETIME,
        ob.QUANTITY,
        ob.NOOFPEOPLE,
        ob.UNITPRICE,
        ob.HANDLINGCHARGE,
        ob.TOTALAMOUNT,
        ob.APPRLVL,
        ob.APPROVERID,
        u_appr.FULLNAME AS APPROVER_NAME,
        pe_appr.DESIG AS APPROVER_DESIG,
        pe_appr.DEPT AS APPROVER_DEPT,
        ob.STATUSID,
        st.STATUSNAME,
        st.STATUSCODE,
        ob.BOOKEDAT
    FROM CMS_OFFBOOK ob
    JOIN CMS_CANTEEN c ON c.CANTEENID = ob.CANTEENID
    JOIN CMS_OFFSERV os ON os.OFFSERVID = ob.OFFSERVID
    JOIN CMS_OFFCOMBO oc ON oc.OFFCOMBOID = ob.OFFCOMBOID
    JOIN CMS_USER u_emp ON u_emp.USERID = ob.BOOKEDBY
    JOIN CMS_CUSTOMER cust ON cust.CUSTOMERID = ob.CUSTOMERID
    LEFT JOIN CMS_PERMEMP pe ON pe.CUSTOMERID = cust.CUSTOMERID
    JOIN CMS_USER u_appr ON u_appr.USERID = ob.APPROVERID
    JOIN CMS_CUSTOMER cust_appr ON cust_appr.USERID = u_appr.USERID
    LEFT JOIN CMS_PERMEMP pe_appr ON pe_appr.CUSTOMERID = cust_appr.CUSTOMERID
    JOIN CMS_STATUS st ON st.STATUSID = ob.STATUSID
    WHERE ob.OFFBOOKID = PBOOKINGID;

    -- Result Set 2: Combo Items
    SELECT 
        oci.COMBOITEMID,
        oci.MENUITEMID,
        mi.ITEMNAME AS MENUNAME,
        mi.ITEMNAME,
        mi.SHORTNAME,
        COALESCE(s.SERVNAME, mi.SHORTNAME, 'Item') AS CATCODE,
        oci.QTY,
        COALESCE(
          (SELECT d.PRICE 
           FROM CMS_ITEMPRICE p
           JOIN CMS_ITEMPRICEDT d ON d.ITEMPRICEID = p.ITEMPRICEID
           WHERE p.MENUITEMID = mi.MENUITEMID 
             AND d.CTYPECODE = 'OFF'
             AND p.STATUSID = 10
           ORDER BY p.EFFFROM DESC LIMIT 1), 
          0.00
        ) AS OFFPRICE
    FROM CMS_OFFCOMBO_ITEM oci
    JOIN CMS_MENUITEM mi ON mi.MENUITEMID = oci.MENUITEMID
    LEFT JOIN CMS_SERVICE s ON s.SERVICEID = mi.SERVICEID
    WHERE oci.OFFCOMBOID = (SELECT OFFCOMBOID FROM CMS_OFFBOOK WHERE OFFBOOKID = PBOOKINGID)
    ORDER BY mi.ITEMNAME ASC;

    -- Result Set 3: Approval Audit History
    SELECT 
        oa.OFFAPPRID,
        oa.ACTIONBY,
        u.FULLNAME AS ACTIONBY_NAME,
        oa.ACTIONROLE,
        oa.ACTION,
        oa.REJREASON,
        oa.ACTIONAT
    FROM CMS_OFFAPPR oa
    JOIN CMS_USER u ON u.USERID = oa.ACTIONBY
    WHERE oa.OFFBOOKID = PBOOKINGID
    ORDER BY oa.OFFAPPRID ASC;
END$$


/* ============================================================
   7. CMSOFFLISTMYBOOKINGS — Customer's Official Bookings
   ============================================================ */
CREATE PROCEDURE CMSOFFLISTMYBOOKINGS (
    IN PCUSTOMERID INT
)
BEGIN
    SELECT 
        ob.OFFBOOKID,
        ob.BOOKNO,
        c.CANTEENNAME,
        os.SERVNAME,
        os.REQAPPRLVL,
        oc.COMBONAME,
        ob.PURPOSE,
        ob.VENUE,
        ob.EVENTDATETIME,
        ob.QUANTITY,
        ob.NOOFPEOPLE,
        ob.UNITPRICE,
        ob.HANDLINGCHARGE,
        ob.TOTALAMOUNT,
        u_appr.FULLNAME AS APPROVER_NAME,
        ob.STATUSID,
        st.STATUSNAME,
        st.STATUSCODE,
        ob.BOOKEDAT
    FROM CMS_OFFBOOK ob
    JOIN CMS_CANTEEN c ON c.CANTEENID = ob.CANTEENID
    JOIN CMS_OFFSERV os ON os.OFFSERVID = ob.OFFSERVID
    JOIN CMS_OFFCOMBO oc ON oc.OFFCOMBOID = ob.OFFCOMBOID
    JOIN CMS_USER u_appr ON u_appr.USERID = ob.APPROVERID
    JOIN CMS_STATUS st ON st.STATUSID = ob.STATUSID
    WHERE ob.CUSTOMERID = PCUSTOMERID
    ORDER BY ob.OFFBOOKID DESC;
END$$


/* ============================================================
   8. CMSOFFLISTASSIGNEDAPPR — Pending Approver Queue
   ============================================================ */
CREATE PROCEDURE CMSOFFLISTASSIGNEDAPPR (
    IN PAPPROVERUSERID INT
)
BEGIN
    SELECT 
        ob.OFFBOOKID,
        ob.BOOKNO,
        c.CANTEENNAME,
        os.SERVNAME,
        os.REQAPPRLVL,
        oc.COMBONAME,
        ob.PURPOSE,
        ob.VENUE,
        ob.EVENTDATETIME,
        ob.QUANTITY,
        ob.NOOFPEOPLE,
        ob.UNITPRICE,
        ob.HANDLINGCHARGE,
        ob.TOTALAMOUNT,
        u_emp.FULLNAME AS REQUESTER_NAME,
        pe.DEPT AS REQUESTER_DEPT,
        pe.DESIG AS REQUESTER_DESIG,
        ob.STATUSID,
        st.STATUSNAME,
        st.STATUSCODE,
        ob.BOOKEDAT
    FROM CMS_OFFBOOK ob
    JOIN CMS_CANTEEN c ON c.CANTEENID = ob.CANTEENID
    JOIN CMS_OFFSERV os ON os.OFFSERVID = ob.OFFSERVID
    JOIN CMS_OFFCOMBO oc ON oc.OFFCOMBOID = ob.OFFCOMBOID
    JOIN CMS_USER u_emp ON u_emp.USERID = ob.BOOKEDBY
    JOIN CMS_CUSTOMER cust ON cust.CUSTOMERID = ob.CUSTOMERID
    LEFT JOIN CMS_PERMEMP pe ON pe.CUSTOMERID = cust.CUSTOMERID
    JOIN CMS_STATUS st ON st.STATUSID = ob.STATUSID
    WHERE ob.APPROVERID = PAPPROVERUSERID
      AND ob.STATUSID = 35 -- SUBMITTED
    ORDER BY ob.OFFBOOKID ASC;
END$$


/* ============================================================
   9. CMSOFFLISTMGRPENDING — Canteen Manager Queue
   ============================================================ */
CREATE PROCEDURE CMSOFFLISTMGRPENDING (
    IN PCANTEENID INT
)
BEGIN
    SELECT 
        ob.OFFBOOKID,
        ob.BOOKNO,
        c.CANTEENNAME,
        os.SERVNAME,
        os.REQAPPRLVL,
        oc.COMBONAME,
        ob.PURPOSE,
        ob.VENUE,
        ob.EVENTDATETIME,
        ob.QUANTITY,
        ob.NOOFPEOPLE,
        ob.UNITPRICE,
        ob.HANDLINGCHARGE,
        ob.TOTALAMOUNT,
        u_emp.FULLNAME AS REQUESTER_NAME,
        pe.DEPT AS REQUESTER_DEPT,
        u_appr.FULLNAME AS APPROVER_NAME,
        ob.STATUSID,
        st.STATUSNAME,
        st.STATUSCODE,
        ob.BOOKEDAT
    FROM CMS_OFFBOOK ob
    JOIN CMS_CANTEEN c ON c.CANTEENID = ob.CANTEENID
    JOIN CMS_OFFSERV os ON os.OFFSERVID = ob.OFFSERVID
    JOIN CMS_OFFCOMBO oc ON oc.OFFCOMBOID = ob.OFFCOMBOID
    JOIN CMS_USER u_emp ON u_emp.USERID = ob.BOOKEDBY
    JOIN CMS_CUSTOMER cust ON cust.CUSTOMERID = ob.CUSTOMERID
    LEFT JOIN CMS_PERMEMP pe ON pe.CUSTOMERID = cust.CUSTOMERID
    JOIN CMS_USER u_appr ON u_appr.USERID = ob.APPROVERID
    JOIN CMS_STATUS st ON st.STATUSID = ob.STATUSID
    WHERE ob.CANTEENID = PCANTEENID
      AND ob.STATUSID = 36 -- PENDING_MANAGER
    ORDER BY ob.EVENTDATETIME ASC;
END$$


/* ============================================================
   10. CMSOFFLISTCONFIRMED — Confirmed Orders for Event Schedule
   Returns 2 result sets:
     1. Confirmed booking headers
     2. Combo dish items for packing & preparation
   ============================================================ */
CREATE PROCEDURE CMSOFFLISTCONFIRMED (
    IN PCANTEENID INT,
    IN PSTARTDATE DATE,
    IN PENDDATE   DATE
)
BEGIN
    -- Result Set 1: Confirmed Bookings
    SELECT 
        ob.OFFBOOKID,
        ob.BOOKNO,
        ob.CANTEENID,
        c.CANTEENNAME,
        ob.OFFSERVID,
        os.SERVNAME,
        os.REQAPPRLVL,
        ob.OFFCOMBOID,
        oc.COMBONAME,
        oc.GROSSPRICE,
        oc.HANDLINGCHARGE AS COMBO_HANDLINGCHARGE,
        ob.CUSTOMERID,
        u_emp.FULLNAME AS REQUESTER_NAME,
        u_emp.FULLNAME AS REQ_NAME,
        u_emp.MOBILENO AS REQUESTER_PHONE,
        u_emp.MOBILENO AS REQ_PHONE,
        pe.EMPCODE AS REQUESTER_EMPCODE,
        pe.DEPT AS REQUESTER_DEPT,
        pe.DEPT AS DEPTNAME,
        pe.DESIG AS REQUESTER_DESIG,
        ob.BOOKEDBY,
        ob.PURPOSE,
        ob.VENUE,
        ob.EVENTDATETIME,
        ob.QUANTITY,
        ob.NOOFPEOPLE,
        ob.UNITPRICE,
        ob.HANDLINGCHARGE,
        ob.TOTALAMOUNT,
        ob.APPRLVL,
        ob.APPROVERID,
        u_appr.FULLNAME AS APPROVER_NAME,
        pe_appr.DESIG AS APPROVER_DESIG,
        ob.STATUSID,
        st.STATUSNAME,
        st.STATUSCODE,
        ob.BOOKEDAT
    FROM CMS_OFFBOOK ob
    JOIN CMS_CANTEEN c ON c.CANTEENID = ob.CANTEENID
    JOIN CMS_OFFSERV os ON os.OFFSERVID = ob.OFFSERVID
    JOIN CMS_OFFCOMBO oc ON oc.OFFCOMBOID = ob.OFFCOMBOID
    JOIN CMS_USER u_emp ON u_emp.USERID = ob.BOOKEDBY
    JOIN CMS_CUSTOMER cust ON cust.CUSTOMERID = ob.CUSTOMERID
    LEFT JOIN CMS_PERMEMP pe ON pe.CUSTOMERID = cust.CUSTOMERID
    JOIN CMS_USER u_appr ON u_appr.USERID = ob.APPROVERID
    LEFT JOIN CMS_CUSTOMER cust_appr ON cust_appr.USERID = u_appr.USERID
    LEFT JOIN CMS_PERMEMP pe_appr ON pe_appr.CUSTOMERID = cust_appr.CUSTOMERID
    JOIN CMS_STATUS st ON st.STATUSID = ob.STATUSID
    WHERE ob.CANTEENID = PCANTEENID
      AND ob.STATUSID = 37 -- CONFIRMED
      AND (
          (PSTARTDATE IS NOT NULL AND PENDDATE IS NOT NULL AND DATE(ob.EVENTDATETIME) BETWEEN PSTARTDATE AND PENDDATE)
          OR (PSTARTDATE IS NOT NULL AND PENDDATE IS NULL AND DATE(ob.EVENTDATETIME) = PSTARTDATE)
          OR (PSTARTDATE IS NULL AND PENDDATE IS NULL)
      )
    ORDER BY ob.EVENTDATETIME ASC;

    -- Result Set 2: Combo Items for These Bookings
    SELECT 
        oci.OFFCOMBOID,
        oci.COMBOITEMID,
        oci.MENUITEMID,
        mi.ITEMNAME AS MENUNAME,
        mi.ITEMNAME,
        mi.SHORTNAME,
        COALESCE(s.SERVNAME, mi.SHORTNAME, 'Item') AS CATCODE,
        oci.QTY,
        COALESCE(
          (SELECT d.PRICE 
           FROM CMS_ITEMPRICE p
           JOIN CMS_ITEMPRICEDT d ON d.ITEMPRICEID = p.ITEMPRICEID
           WHERE p.MENUITEMID = mi.MENUITEMID 
             AND d.CTYPECODE = 'OFF'
             AND p.STATUSID = 10
           ORDER BY p.EFFFROM DESC LIMIT 1), 
          0.00
        ) AS OFFPRICE
    FROM CMS_OFFCOMBO_ITEM oci
    JOIN CMS_MENUITEM mi ON mi.MENUITEMID = oci.MENUITEMID
    LEFT JOIN CMS_SERVICE s ON s.SERVICEID = mi.SERVICEID
    WHERE oci.OFFCOMBOID IN (
        SELECT DISTINCT ob.OFFCOMBOID
        FROM CMS_OFFBOOK ob
        WHERE ob.CANTEENID = PCANTEENID
          AND ob.STATUSID = 37
          AND (
              (PSTARTDATE IS NOT NULL AND PENDDATE IS NOT NULL AND DATE(ob.EVENTDATETIME) BETWEEN PSTARTDATE AND PENDDATE)
              OR (PSTARTDATE IS NOT NULL AND PENDDATE IS NULL AND DATE(ob.EVENTDATETIME) = PSTARTDATE)
              OR (PSTARTDATE IS NULL AND PENDDATE IS NULL)
          )
    )
    ORDER BY mi.ITEMNAME ASC;
END$$


/* ============================================================
   11. CMSOFFGETKITCHENPREP — Daily Kitchen Preparation Aggregates
   Returns 3 result sets:
     1. Aggregated dishes with total prep quantities
     2. Individual order breakdowns per dish
     3. Day summary statistics
   ============================================================ */
CREATE PROCEDURE CMSOFFGETKITCHENPREP (
    IN PCANTEENID   INT,
    IN PTARGETDATE  DATE
)
BEGIN
    -- Result Set 1: Aggregated Dishes
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
        COUNT(DISTINCT ob.OFFBOOKID) AS TOTAL_ORDERS_COUNT
    FROM CMS_OFFBOOK ob
    JOIN CMS_OFFCOMBO_ITEM oci ON oci.OFFCOMBOID = ob.OFFCOMBOID
    JOIN CMS_MENUITEM mi ON mi.MENUITEMID = oci.MENUITEMID
    LEFT JOIN CMS_SERVICE s ON s.SERVICEID = mi.SERVICEID
    WHERE ob.CANTEENID = PCANTEENID
      AND ob.STATUSID = 37 -- CONFIRMED
      AND DATE(ob.EVENTDATETIME) = PTARGETDATE
    GROUP BY mi.MENUITEMID, mi.ITEMNAME, mi.SHORTNAME, s.SERVNAME
    ORDER BY CATCODE ASC, mi.ITEMNAME ASC;

    -- Result Set 2: Order Breakdown Per Dish
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
    JOIN CMS_OFFCOMBO_ITEM oci ON oci.OFFCOMBOID = ob.OFFCOMBOID
    JOIN CMS_USER u_emp ON u_emp.USERID = ob.BOOKEDBY
    JOIN CMS_CUSTOMER cust ON cust.CUSTOMERID = ob.CUSTOMERID
    LEFT JOIN CMS_PERMEMP pe ON pe.CUSTOMERID = cust.CUSTOMERID
    WHERE ob.CANTEENID = PCANTEENID
      AND ob.STATUSID = 37 -- CONFIRMED
      AND DATE(ob.EVENTDATETIME) = PTARGETDATE
    ORDER BY ob.EVENTDATETIME ASC;

    -- Result Set 3: Day Summary Statistics
    SELECT 
        COUNT(DISTINCT ob.OFFBOOKID) AS TOTAL_EVENTS,
        COALESCE(SUM(ob.QUANTITY), 0) AS TOTAL_SERVINGS,
        COALESCE(SUM(ob.NOOFPEOPLE), 0) AS TOTAL_ATTENDEES,
        MIN(ob.EVENTDATETIME) AS EARLIEST_EVENT
    FROM CMS_OFFBOOK ob
    WHERE ob.CANTEENID = PCANTEENID
      AND ob.STATUSID = 37 -- CONFIRMED
      AND DATE(ob.EVENTDATETIME) = PTARGETDATE;
END$$


/* ============================================================
   12. CMSOFFGETBOOKINGHEADER — Booking Header for RBAC & Validation
   ============================================================ */
CREATE PROCEDURE CMSOFFGETBOOKINGHEADER (
    IN POFFBOOKID INT
)
BEGIN
    SELECT 
        b.OFFBOOKID,
        b.BOOKNO,
        b.CANTEENID,
        c.CANTEENNAME,
        b.OFFSERVID,
        os.SERVNAME,
        b.OFFCOMBOID,
        b.CUSTOMERID,
        b.BOOKEDBY,
        b.PURPOSE,
        b.VENUE,
        b.EVENTDATETIME,
        b.QUANTITY,
        b.NOOFPEOPLE,
        b.UNITPRICE,
        b.HANDLINGCHARGE,
        b.TOTALAMOUNT,
        b.APPRLVL,
        b.APPROVERID,
        b.STATUSID,
        st.STATUSCODE,
        st.STATUSNAME,
        b.BOOKEDAT,
        b.UPDATEDBY,
        b.UPDATEDAT
    FROM CMS_OFFBOOK b
    JOIN CMS_STATUS st ON st.STATUSID = b.STATUSID
    JOIN CMS_CANTEEN c ON c.CANTEENID = b.CANTEENID
    JOIN CMS_OFFSERV os ON os.OFFSERVID = b.OFFSERVID
    WHERE b.OFFBOOKID = POFFBOOKID;
END$$


/* ============================================================
   13. CMSOFFGETSERVICEHEADER — Service Header for RBAC & Validation
   ============================================================ */
CREATE PROCEDURE CMSOFFGETSERVICEHEADER (
    IN POFFSERVID INT
)
BEGIN
    SELECT 
        os.OFFSERVID,
        os.CANTEENID,
        c.CANTEENNAME,
        os.SERVNAME,
        os.DESCR,
        os.CUTOFFHOURS,
        os.REQAPPRLVL,
        os.STATUSID,
        st.STATUSNAME,
        os.CREATEDBY,
        os.CREATEDAT,
        os.UPDATEDBY,
        os.UPDATEDAT
    FROM CMS_OFFSERV os
    JOIN CMS_CANTEEN c ON c.CANTEENID = os.CANTEENID
    JOIN CMS_STATUS st ON st.STATUSID = os.STATUSID
    WHERE os.OFFSERVID = POFFSERVID;
END$$


/* ============================================================
   14. CMSOFFGETCOMBOHEADER — Combo Header for RBAC & Validation
   ============================================================ */
CREATE PROCEDURE CMSOFFGETCOMBOHEADER (
    IN POFFCOMBOID INT
)
BEGIN
    SELECT 
        oc.OFFCOMBOID,
        oc.OFFSERVID,
        os.CANTEENID,
        oc.COMBONAME,
        oc.DESCR,
        oc.GROSSPRICE,
        oc.HANDLINGCHARGE,
        oc.COMBOPRICE,
        oc.STATUSID,
        st.STATUSNAME,
        oc.CREATEDBY,
        oc.CREATEDAT,
        oc.UPDATEDBY,
        oc.UPDATEDAT
    FROM CMS_OFFCOMBO oc
    JOIN CMS_OFFSERV os ON os.OFFSERVID = oc.OFFSERVID
    JOIN CMS_STATUS st ON st.STATUSID = oc.STATUSID
    WHERE oc.OFFCOMBOID = POFFCOMBOID;
END$$

DELIMITER ;
