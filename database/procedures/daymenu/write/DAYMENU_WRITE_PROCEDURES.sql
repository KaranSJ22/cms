USE cms_db;

DROP PROCEDURE IF EXISTS CMSREPLACEDMENUITEMS;
DROP PROCEDURE IF EXISTS CMSSUBMITDMENU;
DROP PROCEDURE IF EXISTS CMSAPPROVEDMENU;
DROP PROCEDURE IF EXISTS CMSREJECTDMENU;
DROP PROCEDURE IF EXISTS CMSAPPLYMENUTEMPLATE;

DELIMITER $$

/* ============================================================
   CMSREPLACEDMENUITEMS — Batch Day Menu Replacement
   ============================================================ */
CREATE PROCEDURE CMSREPLACEDMENUITEMS (
    IN PDAYSLOTID INT,
    IN PITEMSJSON JSON,
    IN PUSERID    INT,
    IN PREMARKS   VARCHAR(255)
)
BEGIN
    DECLARE VSLOTSTATUSID INT;
    DECLARE VSERVDATE     DATE;
    DECLARE VAPPRSTATUSID INT;
    DECLARE VMISSING      VARCHAR(255);
    DECLARE VDMENUNO      VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

    IF PDAYSLOTID IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Day Slot ID is required'; END IF;
    IF PITEMSJSON IS NULL OR JSON_TYPE(PITEMSJSON) <> 'ARRAY' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Items JSON array is required';
    END IF;
    
    SELECT STATUSID, SERVDATE, APPRSTATUSID INTO VSLOTSTATUSID, VSERVDATE, VAPPRSTATUSID
    FROM CMS_DAYSLOT WHERE DAYSLOTID = PDAYSLOTID;
    
    IF VSLOTSTATUSID IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Day slot not found'; END IF;
    IF VSLOTSTATUSID <> 10 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Day slot must be active (10 = ACT)'; END IF;
    
    SELECT GROUP_CONCAT(DISTINCT CONCAT(MI.MENUITEMID, ' missing ', CT.CTYPECODE)) INTO VMISSING
    FROM JSON_TABLE(PITEMSJSON, '$[*]' COLUMNS (
        MENUITEMID INT PATH '$.MENUITEMID'
    )) JT
    JOIN CMS_MENUITEM MI ON MI.MENUITEMID = JT.MENUITEMID
    CROSS JOIN CMS_CUSTTYPE CT
    WHERE CT.ISACTIVE = 1
      AND NOT EXISTS (
          SELECT 1
          FROM CMS_ITEMPRICE IP
          JOIN CMS_ITEMPRICEDT IPD ON IP.ITEMPRICEID = IPD.ITEMPRICEID
          JOIN CMS_STATUS IPST ON IPST.STATUSID = IP.STATUSID
          WHERE IP.MENUITEMID = JT.MENUITEMID
            AND IP.EFFFROM <= VSERVDATE
            AND IPST.STATUSCODE = 'ACT'
            AND IPD.CTYPECODE = CT.CTYPECODE
            AND IP.ITEMPRICEID = (
                SELECT IP2.ITEMPRICEID
                FROM CMS_ITEMPRICE IP2
                JOIN CMS_STATUS IPST2 ON IPST2.STATUSID = IP2.STATUSID
                WHERE IP2.MENUITEMID = JT.MENUITEMID
                  AND IP2.EFFFROM <= VSERVDATE
                  AND IPST2.STATUSCODE = 'ACT'
                ORDER BY IP2.EFFFROM DESC
                LIMIT 1
            )
      );

    IF VMISSING IS NOT NULL THEN
        SET @MSG = CONCAT('Price missing for: ', VMISSING);
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = @MSG;
    END IF;

    START TRANSACTION;
    
    DELETE FROM CMS_DAYMENU WHERE DAYSLOTID = PDAYSLOTID;
    
    BEGIN
        DECLARE done INT DEFAULT FALSE;
        DECLARE v_menuitemid INT;
        DECLARE v_isbase TINYINT;
        DECLARE v_isspecial TINYINT;
        DECLARE v_isprebook TINYINT;
        DECLARE v_iskiosk TINYINT;
        DECLARE v_bookuntil DATETIME;
        DECLARE v_canceluntil DATETIME;
        DECLARE v_availqty INT;
        DECLARE v_maxqty INT;
        
        DECLARE cur CURSOR FOR 
            SELECT MENUITEMID, COALESCE(ISBASE, 1), COALESCE(ISSPECIAL, 0), 
                   COALESCE(ISPREBOOK, 1), COALESCE(ISKIOSK, 1), 
                   BOOKUNTIL, CANCELUNTIL, AVAILQTY, MAXQTY
            FROM JSON_TABLE(PITEMSJSON, '$[*]' COLUMNS (
                MENUITEMID  INT PATH '$.MENUITEMID',
                ISBASE      TINYINT PATH '$.ISBASE',
                ISSPECIAL   TINYINT PATH '$.ISSPECIAL',
                ISPREBOOK   TINYINT PATH '$.ISPREBOOK',
                ISKIOSK     TINYINT PATH '$.ISKIOSK',
                BOOKUNTIL   DATETIME PATH '$.BOOKUNTIL',
                CANCELUNTIL DATETIME PATH '$.CANCELUNTIL',
                AVAILQTY    INT PATH '$.AVAILQTY',
                MAXQTY      INT PATH '$.MAXQTY'
            )) JT;
            
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
        
        OPEN cur;
        read_loop: LOOP
            FETCH cur INTO v_menuitemid, v_isbase, v_isspecial, v_isprebook, v_iskiosk, 
                           v_bookuntil, v_canceluntil, v_availqty, v_maxqty;
            IF done THEN
                LEAVE read_loop;
            END IF;
            
            -- Generate unique DMENUNO for each item
            CALL CMSGENAUTO('CMS_DAYMENU', 'DMENUNO', VDMENUNO);
            
            INSERT INTO CMS_DAYMENU (
                DMENUNO, DAYSLOTID, MENUITEMID, ISBASE, ISSPECIAL, ISPREBOOK, ISKIOSK,
                BOOKUNTIL, CANCELUNTIL, AVAILQTY, MAXQTY, STATUSID, CREATEDBY
            ) VALUES (
                VDMENUNO, PDAYSLOTID, v_menuitemid, v_isbase, v_isspecial, v_isprebook, v_iskiosk,
                v_bookuntil, v_canceluntil, v_availqty, v_maxqty, 10, PUSERID
            );
        END LOOP;
        CLOSE cur;
    END;
    
    -- Record History (20 = DRF)
    INSERT INTO CMS_SLOTHIST (
        DAYSLOTID, SLOTNO, SERVICEID, CANTEENID, SERVDATE, STARTTIME, ENDTIME, 
        STATUSID, APPRSTATUSID, MENUSUBMITTEDBY, MENUSUBMITTEDAT, MENUAPPROVEDBY, 
        MENUAPPROVEDAT, MENUREMARKS, CHANGEDBY, CHGREASON
    )
    SELECT 
        DAYSLOTID, SLOTNO, SERVICEID, CANTEENID, SERVDATE, STARTTIME, ENDTIME, 
        STATUSID, APPRSTATUSID, MENUSUBMITTEDBY, MENUSUBMITTEDAT, MENUAPPROVEDBY, 
        MENUAPPROVEDAT, MENUREMARKS, PUSERID, 'Draft Updated'
    FROM CMS_DAYSLOT WHERE DAYSLOTID = PDAYSLOTID;

    UPDATE CMS_DAYSLOT 
    SET APPRSTATUSID = 20, -- 20 = 'DRF'
        MENUSUBMITTEDBY = NULL, 
        MENUSUBMITTEDAT = NULL,
        MENUAPPROVEDBY = NULL,
        MENUAPPROVEDAT = NULL,
        MENUREMARKS = PREMARKS,
        UPDATEDAT = CURRENT_TIMESTAMP
    WHERE DAYSLOTID = PDAYSLOTID;

    COMMIT;
    SELECT PDAYSLOTID AS DAYSLOTID;
END$$


/* ============================================================
   CMSSUBMITDMENU — Submit day menu for approval
   ============================================================ */
CREATE PROCEDURE CMSSUBMITDMENU (
    IN PDAYSLOTID INT,
    IN PUSERID    INT,
    IN PREMARKS   VARCHAR(255)
)
BEGIN
    DECLARE VAPPRSTATUSID INT;
    DECLARE VBASECOUNT INT DEFAULT 0;
    DECLARE VMISSING      VARCHAR(255);
    DECLARE VSERVDATE     DATE;
    DECLARE VISMANAGER    INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

    SELECT APPRSTATUSID, SERVDATE INTO VAPPRSTATUSID, VSERVDATE FROM CMS_DAYSLOT WHERE DAYSLOTID = PDAYSLOTID;
    IF VAPPRSTATUSID IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Day slot not found'; END IF;
    
    -- 20 = 'DRF', 23 = 'REJ'
    IF VAPPRSTATUSID NOT IN (20, 23) THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only Draft or Rejected menus can be submitted'; 
    END IF;
    
    -- 10 = 'ACT'
    SELECT COUNT(*) INTO VBASECOUNT 
    FROM CMS_DAYMENU DM 
    JOIN CMS_STATUS ST ON ST.STATUSID = DM.STATUSID
    WHERE DM.DAYSLOTID = PDAYSLOTID AND DM.ISBASE = 1 AND ST.STATUSCODE = 'ACT';
    
    IF VBASECOUNT = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'At least one active base item is required'; END IF;

    SELECT GROUP_CONCAT(DISTINCT CONCAT(MI.MENUITEMID, ' missing ', CT.CTYPECODE)) INTO VMISSING
    FROM CMS_DAYMENU DM
    JOIN CMS_MENUITEM MI ON MI.MENUITEMID = DM.MENUITEMID
    CROSS JOIN CMS_CUSTTYPE CT
    WHERE DM.DAYSLOTID = PDAYSLOTID
      AND CT.ISACTIVE = 1
      AND NOT EXISTS (
          SELECT 1
          FROM CMS_ITEMPRICE IP
          JOIN CMS_ITEMPRICEDT IPD ON IP.ITEMPRICEID = IPD.ITEMPRICEID
          JOIN CMS_STATUS IPST ON IPST.STATUSID = IP.STATUSID
          WHERE IP.MENUITEMID = DM.MENUITEMID
            AND IP.EFFFROM <= VSERVDATE
            AND IPST.STATUSCODE = 'ACT'
            AND IPD.CTYPECODE = CT.CTYPECODE
            AND IP.ITEMPRICEID = (
                SELECT IP2.ITEMPRICEID
                FROM CMS_ITEMPRICE IP2
                JOIN CMS_STATUS IPST2 ON IPST2.STATUSID = IP2.STATUSID
                WHERE IP2.MENUITEMID = DM.MENUITEMID
                  AND IP2.EFFFROM <= VSERVDATE
                  AND IPST2.STATUSCODE = 'ACT'
                ORDER BY IP2.EFFFROM DESC
                LIMIT 1
            )
      );

    IF VMISSING IS NOT NULL THEN
        SET @MSG = CONCAT('Price missing for: ', VMISSING);
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = @MSG;
    END IF;

    SELECT COUNT(*) INTO VISMANAGER
    FROM CMS_CANTEENROLE CR
    JOIN CMS_ROLE R ON R.ROLEID = CR.ROLEID
    JOIN CMS_DAYSLOT DS ON DS.CANTEENID = CR.CANTEENID
    WHERE DS.DAYSLOTID = PDAYSLOTID
      AND CR.USERID = PUSERID
      AND R.ROLECODE = 'CTNMGR';

    START TRANSACTION;

    IF VISMANAGER > 0 THEN
        INSERT INTO CMS_SLOTHIST (
            DAYSLOTID, SLOTNO, SERVICEID, CANTEENID, SERVDATE, STARTTIME, ENDTIME, 
            STATUSID, APPRSTATUSID, MENUSUBMITTEDBY, MENUSUBMITTEDAT, MENUAPPROVEDBY, 
            MENUAPPROVEDAT, MENUREMARKS, CHANGEDBY, CHGREASON
        )
        SELECT 
            DAYSLOTID, SLOTNO, SERVICEID, CANTEENID, SERVDATE, STARTTIME, ENDTIME, 
            STATUSID, 22, PUSERID, CURRENT_TIMESTAMP, PUSERID, CURRENT_TIMESTAMP, PREMARKS, PUSERID, 'Auto-Approved (Manager)'
        FROM CMS_DAYSLOT WHERE DAYSLOTID = PDAYSLOTID;

        UPDATE CMS_DAYSLOT 
        SET APPRSTATUSID = 22, -- 22 = 'APP'
            MENUSUBMITTEDBY = PUSERID, 
            MENUSUBMITTEDAT = CURRENT_TIMESTAMP,
            MENUAPPROVEDBY = PUSERID,
            MENUAPPROVEDAT = CURRENT_TIMESTAMP,
            MENUREMARKS = PREMARKS,
            UPDATEDAT = CURRENT_TIMESTAMP
        WHERE DAYSLOTID = PDAYSLOTID;
    ELSE
        INSERT INTO CMS_SLOTHIST (
            DAYSLOTID, SLOTNO, SERVICEID, CANTEENID, SERVDATE, STARTTIME, ENDTIME, 
            STATUSID, APPRSTATUSID, MENUSUBMITTEDBY, MENUSUBMITTEDAT, MENUAPPROVEDBY, 
            MENUAPPROVEDAT, MENUREMARKS, CHANGEDBY, CHGREASON
        )
        SELECT 
            DAYSLOTID, SLOTNO, SERVICEID, CANTEENID, SERVDATE, STARTTIME, ENDTIME, 
            STATUSID, 21, PUSERID, CURRENT_TIMESTAMP, MENUAPPROVEDBY, MENUAPPROVEDAT, PREMARKS, PUSERID, 'Submitted'
        FROM CMS_DAYSLOT WHERE DAYSLOTID = PDAYSLOTID;

        UPDATE CMS_DAYSLOT 
        SET APPRSTATUSID = 21, -- 21 = 'PEN'
            MENUSUBMITTEDBY = PUSERID, 
            MENUSUBMITTEDAT = CURRENT_TIMESTAMP,
            MENUREMARKS = PREMARKS,
            UPDATEDAT = CURRENT_TIMESTAMP
        WHERE DAYSLOTID = PDAYSLOTID;
    END IF;

    COMMIT;
    SELECT PDAYSLOTID AS DAYSLOTID;
END$$


/* ============================================================
   CMSAPPROVEDMENU — Approve day menu
   ============================================================ */
CREATE PROCEDURE CMSAPPROVEDMENU (
    IN PDAYSLOTID INT,
    IN PUSERID    INT,
    IN PREMARKS   VARCHAR(255)
)
BEGIN
    DECLARE VAPPRSTATUSID INT;
    DECLARE VBASECOUNT INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

    SELECT APPRSTATUSID INTO VAPPRSTATUSID FROM CMS_DAYSLOT WHERE DAYSLOTID = PDAYSLOTID;
    -- 21 = 'PEN'
    IF VAPPRSTATUSID <> 21 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only Pending menus can be approved'; END IF;
    
    -- 10 = 'ACT'
    SELECT COUNT(*) INTO VBASECOUNT 
    FROM CMS_DAYMENU DM 
    JOIN CMS_STATUS ST ON ST.STATUSID = DM.STATUSID
    WHERE DM.DAYSLOTID = PDAYSLOTID AND DM.ISBASE = 1 AND ST.STATUSCODE = 'ACT';
    
    IF VBASECOUNT = 0 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'At least one active base item is required'; END IF;

    START TRANSACTION;

    INSERT INTO CMS_SLOTHIST (
        DAYSLOTID, SLOTNO, SERVICEID, CANTEENID, SERVDATE, STARTTIME, ENDTIME, 
        STATUSID, APPRSTATUSID, MENUSUBMITTEDBY, MENUSUBMITTEDAT, MENUAPPROVEDBY, 
        MENUAPPROVEDAT, MENUREMARKS, CHANGEDBY, CHGREASON
    )
    SELECT 
        DAYSLOTID, SLOTNO, SERVICEID, CANTEENID, SERVDATE, STARTTIME, ENDTIME, 
        STATUSID, 22, MENUSUBMITTEDBY, MENUSUBMITTEDAT, PUSERID, CURRENT_TIMESTAMP, PREMARKS, PUSERID, 'Approved'
    FROM CMS_DAYSLOT WHERE DAYSLOTID = PDAYSLOTID;

    UPDATE CMS_DAYSLOT 
    SET APPRSTATUSID = 22, -- 22 = 'APR'
        MENUAPPROVEDBY = PUSERID, 
        MENUAPPROVEDAT = CURRENT_TIMESTAMP,
        MENUREMARKS = PREMARKS,
        UPDATEDAT = CURRENT_TIMESTAMP
    WHERE DAYSLOTID = PDAYSLOTID;

    COMMIT;
    SELECT PDAYSLOTID AS DAYSLOTID;
END$$


/* ============================================================
   CMSREJECTDMENU — Reject day menu
   ============================================================ */
CREATE PROCEDURE CMSREJECTDMENU (
    IN PDAYSLOTID INT,
    IN PUSERID    INT,
    IN PREMARKS   VARCHAR(255)
)
BEGIN
    DECLARE VAPPRSTATUSID INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

    IF PREMARKS IS NULL OR TRIM(PREMARKS) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rejection remarks are required';
    END IF;

    SELECT APPRSTATUSID INTO VAPPRSTATUSID FROM CMS_DAYSLOT WHERE DAYSLOTID = PDAYSLOTID;
    -- 21 = 'PEN'
    IF VAPPRSTATUSID <> 21 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only Pending menus can be rejected'; END IF;
    
    START TRANSACTION;

    INSERT INTO CMS_SLOTHIST (
        DAYSLOTID, SLOTNO, SERVICEID, CANTEENID, SERVDATE, STARTTIME, ENDTIME, 
        STATUSID, APPRSTATUSID, MENUSUBMITTEDBY, MENUSUBMITTEDAT, MENUAPPROVEDBY, 
        MENUAPPROVEDAT, MENUREMARKS, CHANGEDBY, CHGREASON
    )
    SELECT 
        DAYSLOTID, SLOTNO, SERVICEID, CANTEENID, SERVDATE, STARTTIME, ENDTIME, 
        STATUSID, 23, MENUSUBMITTEDBY, MENUSUBMITTEDAT, PUSERID, CURRENT_TIMESTAMP, PREMARKS, PUSERID, 'Rejected'
    FROM CMS_DAYSLOT WHERE DAYSLOTID = PDAYSLOTID;

    UPDATE CMS_DAYSLOT 
    SET APPRSTATUSID = 23, -- 23 = 'REJ'
        MENUAPPROVEDBY = PUSERID, 
        MENUAPPROVEDAT = CURRENT_TIMESTAMP,
        MENUREMARKS = PREMARKS,
        UPDATEDAT = CURRENT_TIMESTAMP
    WHERE DAYSLOTID = PDAYSLOTID;

    COMMIT;
    SELECT PDAYSLOTID AS DAYSLOTID;
END$$


/* ============================================================
   CMSAPPLYMENUTEMPLATE — Multi-Day Template Generation & Scheduling
   Applies day-to-day items & timings from a template array
   ============================================================ */
CREATE PROCEDURE CMSAPPLYMENUTEMPLATE (
    IN PCANTEENID   INT,
    IN PSERVICEID   INT,
    IN PSTARTDATE   DATE,
    IN PCONFIGJSON  JSON,
    IN PUSERID      INT
)
BEGIN
    DECLARE done_days INT DEFAULT FALSE;
    DECLARE v_dayindex INT;
    DECLARE v_day_starttime TIME;
    DECLARE v_day_endtime TIME;
    DECLARE v_overrideholiday INT;
    DECLARE v_itemsjson JSON;
    DECLARE v_servdate DATE;
    DECLARE v_holidayid INT;
    DECLARE v_holidayname VARCHAR(100);
    DECLARE v_dayslotid INT;
    DECLARE v_slotno VARCHAR(20);
    DECLARE v_existing_statusid INT;
    DECLARE v_existing_apprstatusid INT;
    DECLARE v_existing_start TIME;
    DECLARE v_existing_end TIME;
    DECLARE v_has_items INT;
    DECLARE v_has_bookings INT;
    DECLARE v_item_count INT;
    DECLARE v_dmenuno VARCHAR(20);

    DECLARE cur_days CURSOR FOR
        SELECT 
            DAYINDEX, 
            STARTTIME, 
            ENDTIME, 
            COALESCE(OVERRIDEHOLIDAY, 0),
            ITEMS
        FROM JSON_TABLE(PCONFIGJSON, '$[*]' COLUMNS (
            DAYINDEX INT PATH '$.DAYINDEX',
            STARTTIME TIME PATH '$.STARTTIME',
            ENDTIME TIME PATH '$.ENDTIME',
            OVERRIDEHOLIDAY INT PATH '$.OVERRIDEHOLIDAY',
            ITEMS JSON PATH '$.ITEMS'
        )) JT;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done_days = TRUE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

    IF PCANTEENID IS NULL OR PSERVICEID IS NULL OR PSTARTDATE IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Canteen, Service, and Start Date are required';
    END IF;

    IF PCONFIGJSON IS NULL OR JSON_TYPE(PCONFIGJSON) <> 'ARRAY' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Config JSON array is required';
    END IF;

    CREATE TEMPORARY TABLE IF NOT EXISTS TMP_TEMPLATE_RESULTS (
        SERVDATE DATE,
        DAYSLOTID INT,
        SLOTNO VARCHAR(20),
        ISNEWSLOT INT,
        ITEMCOUNT INT,
        TIMINGUPDATED INT,
        SKIPPED INT,
        REASON VARCHAR(255)
    );
    DELETE FROM TMP_TEMPLATE_RESULTS;

    START TRANSACTION;

    OPEN cur_days;
    days_loop: LOOP
        FETCH cur_days INTO v_dayindex, v_day_starttime, v_day_endtime, v_overrideholiday, v_itemsjson;
        IF done_days THEN
            LEAVE days_loop;
        END IF;

        SET v_servdate = DATE_ADD(PSTARTDATE, INTERVAL v_dayindex DAY);
        SET v_holidayid = NULL;
        SET v_holidayname = NULL;

        -- Check Holiday
        SELECT HOLIDAYID, HOLIDAYNAME INTO v_holidayid, v_holidayname
        FROM CMS_HOLIDAY
        WHERE STATUSID = 10
          AND (
            HOLIDAYDATE = v_servdate
            OR (ISRECURRING = 1 AND MONTH(HOLIDAYDATE) = MONTH(v_servdate) AND DAY(HOLIDAYDATE) = DAY(v_servdate))
          )
        LIMIT 1;

        IF v_holidayid IS NOT NULL AND v_overrideholiday = 0 THEN
            INSERT INTO TMP_TEMPLATE_RESULTS (SERVDATE, DAYSLOTID, SLOTNO, ISNEWSLOT, ITEMCOUNT, TIMINGUPDATED, SKIPPED, REASON)
            VALUES (v_servdate, NULL, NULL, 0, 0, 0, 1, CONCAT('Holiday: ', v_holidayname));
            ITERATE days_loop;
        END IF;

        SET v_item_count = JSON_LENGTH(v_itemsjson);
        IF v_item_count IS NULL OR v_item_count = 0 THEN
            INSERT INTO TMP_TEMPLATE_RESULTS (SERVDATE, DAYSLOTID, SLOTNO, ISNEWSLOT, ITEMCOUNT, TIMINGUPDATED, SKIPPED, REASON)
            VALUES (v_servdate, NULL, NULL, 0, 0, 0, 1, 'No items configured');
            ITERATE days_loop;
        END IF;

        -- Check existing slot
        SET v_dayslotid = NULL;
        SELECT DAYSLOTID, SLOTNO, STARTTIME, ENDTIME, STATUSID, APPRSTATUSID
          INTO v_dayslotid, v_slotno, v_existing_start, v_existing_end, v_existing_statusid, v_existing_apprstatusid
        FROM CMS_DAYSLOT
        WHERE CANTEENID = PCANTEENID AND SERVICEID = PSERVICEID AND SERVDATE = v_servdate
        LIMIT 1;

        IF v_dayslotid IS NOT NULL THEN
            SELECT COUNT(*) INTO v_has_items FROM CMS_DAYMENU WHERE DAYSLOTID = v_dayslotid;
            SELECT COUNT(*) INTO v_has_bookings
            FROM CMS_BOOKITEM BI
            JOIN CMS_DAYMENU DM ON BI.DAYMENUID = DM.DAYMENUID
            WHERE DM.DAYSLOTID = v_dayslotid;

            IF v_has_items > 0 OR v_has_bookings > 0 OR v_existing_apprstatusid = 22 THEN
                IF (v_day_starttime IS NOT NULL AND v_day_endtime IS NOT NULL) 
                   AND (v_day_starttime <> v_existing_start OR v_day_endtime <> v_existing_end) THEN
                    UPDATE CMS_DAYSLOT
                    SET STARTTIME = v_day_starttime, ENDTIME = v_day_endtime, UPDATEDBY = PUSERID, UPDATEDAT = CURRENT_TIMESTAMP
                    WHERE DAYSLOTID = v_dayslotid;

                    INSERT INTO CMS_SLOTHIST (
                        DAYSLOTID, SLOTNO, SERVICEID, CANTEENID, SERVDATE, STARTTIME, ENDTIME, 
                        STATUSID, APPRSTATUSID, CHANGEDBY, CHGREASON
                    ) VALUES (
                        v_dayslotid, v_slotno, PSERVICEID, PCANTEENID, v_servdate, v_day_starttime, v_day_endtime, 
                        v_existing_statusid, v_existing_apprstatusid, PUSERID, 'Bulk Timing Adjustment'
                    );

                    INSERT INTO TMP_TEMPLATE_RESULTS (SERVDATE, DAYSLOTID, SLOTNO, ISNEWSLOT, ITEMCOUNT, TIMINGUPDATED, SKIPPED, REASON)
                    VALUES (v_servdate, v_dayslotid, v_slotno, 0, 0, 1, 1, 'Published slot - timing updated');
                ELSE
                    INSERT INTO TMP_TEMPLATE_RESULTS (SERVDATE, DAYSLOTID, SLOTNO, ISNEWSLOT, ITEMCOUNT, TIMINGUPDATED, SKIPPED, REASON)
                    VALUES (v_servdate, v_dayslotid, v_slotno, 0, 0, 0, 1, 'Published slot locked');
                END IF;
                ITERATE days_loop;
            END IF;
        ELSE
            -- Generate new Slot
            CALL CMSGENAUTO('CMS_DAYSLOT', 'SLOTNO', v_slotno);
            INSERT INTO CMS_DAYSLOT (
                SLOTNO, CANTEENID, SERVICEID, SERVDATE, STARTTIME, ENDTIME, STATUSID, APPRSTATUSID, CREATEDBY
            ) VALUES (
                v_slotno, PCANTEENID, PSERVICEID, v_servdate, v_day_starttime, v_day_endtime, 10, 22, PUSERID
            );
            SET v_dayslotid = LAST_INSERT_ID();

            INSERT INTO CMS_SLOTHIST (
                DAYSLOTID, SLOTNO, SERVICEID, CANTEENID, SERVDATE, STARTTIME, ENDTIME, 
                STATUSID, APPRSTATUSID, CHANGEDBY, CHGREASON
            ) VALUES (
                v_dayslotid, v_slotno, PSERVICEID, PCANTEENID, v_servdate, v_day_starttime, v_day_endtime, 
                10, 22, PUSERID, 'Bulk Creation'
            );
        END IF;

        -- Insert day menu items
        BEGIN
            DECLARE done_items INT DEFAULT FALSE;
            DECLARE v_item_menuitemid INT;
            DECLARE v_item_isbase TINYINT;
            DECLARE v_item_isspecial TINYINT;
            DECLARE v_item_isprebook TINYINT;
            DECLARE v_item_iskiosk TINYINT;
            DECLARE v_item_bookuntil DATETIME;
            DECLARE v_item_canceluntil DATETIME;
            DECLARE v_item_availqty INT;
            DECLARE v_item_maxqty INT;

            DECLARE cur_items CURSOR FOR
                SELECT 
                    MENUITEMID, 
                    COALESCE(ISBASE, 1), 
                    COALESCE(ISSPECIAL, 0), 
                    COALESCE(ISPREBOOK, 1), 
                    COALESCE(ISKIOSK, 1), 
                    BOOKUNTIL, 
                    CANCELUNTIL, 
                    AVAILQTY, 
                    COALESCE(MAXQTY, 1)
                FROM JSON_TABLE(v_itemsjson, '$[*]' COLUMNS (
                    MENUITEMID INT PATH '$.MENUITEMID',
                    ISBASE TINYINT PATH '$.ISBASE',
                    ISSPECIAL TINYINT PATH '$.ISSPECIAL',
                    ISPREBOOK TINYINT PATH '$.ISPREBOOK',
                    ISKIOSK TINYINT PATH '$.ISKIOSK',
                    BOOKUNTIL DATETIME PATH '$.BOOKUNTIL',
                    CANCELUNTIL DATETIME PATH '$.CANCELUNTIL',
                    AVAILQTY INT PATH '$.AVAILQTY',
                    MAXQTY INT PATH '$.MAXQTY'
                )) JTI;

            DECLARE CONTINUE HANDLER FOR NOT FOUND SET done_items = TRUE;

            OPEN cur_items;
            items_loop: LOOP
                FETCH cur_items INTO v_item_menuitemid, v_item_isbase, v_item_isspecial, v_item_isprebook,
                                     v_item_iskiosk, v_item_bookuntil, v_item_canceluntil, v_item_availqty, v_item_maxqty;
                IF done_items THEN
                    LEAVE items_loop;
                END IF;

                CALL CMSGENAUTO('CMS_DAYMENU', 'DMENUNO', v_dmenuno);

                INSERT INTO CMS_DAYMENU (
                    DMENUNO, DAYSLOTID, MENUITEMID, ISBASE, ISSPECIAL, ISPREBOOK, ISKIOSK,
                    BOOKUNTIL, CANCELUNTIL, AVAILQTY, MAXQTY, STATUSID, CREATEDBY
                ) VALUES (
                    v_dmenuno, v_dayslotid, v_item_menuitemid, v_item_isbase, v_item_isspecial,
                    v_item_isprebook, v_item_iskiosk, v_item_bookuntil, v_item_canceluntil,
                    v_item_availqty, v_item_maxqty, 10, PUSERID
                );
            END LOOP;
            CLOSE cur_items;
        END;

        INSERT INTO TMP_TEMPLATE_RESULTS (SERVDATE, DAYSLOTID, SLOTNO, ISNEWSLOT, ITEMCOUNT, TIMINGUPDATED, SKIPPED, REASON)
        VALUES (v_servdate, v_dayslotid, v_slotno, 1, v_item_count, 0, 0, 'Configured successfully');

    END LOOP;
    CLOSE cur_days;

    COMMIT;

    SELECT * FROM TMP_TEMPLATE_RESULTS;
END$$

DELIMITER ;
