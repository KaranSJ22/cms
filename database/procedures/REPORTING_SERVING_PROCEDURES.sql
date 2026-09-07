USE cms_db;

DELIMITER $$

/* ============================================================
   REPORTING & SERVING PROCEDURES
   New procedures required for MVP — Gap Analysis M-1 through M-4
   ============================================================

   M-1  CMSGETBOOKFORSERVING  — Serving-counter lookup by LOGINID or BOOKNO
   M-2  CMSGETMONTHLYEXP      — Monthly expenditure summary (employee dashboard)
   M-3  CMSLISTBOOKHISTORY    — Paginated booking history with total row count
   M-4  CMSBULKBOOK           — 7/30-day bulk pre-booking
   ============================================================ */


-- ============================================================
-- M-1  CMSGETBOOKFORSERVING
--
-- Serving-counter lookup. Returns two result sets:
--   RS-1: Booking header
--   RS-2: Booking items
--
-- Lookup priority:
--   If PBOOKNO is supplied  → look up by BOOKNO (exact match).
--   If only PLOGINID is supplied → find the employee's ACTIVE (CR)
--     booking for TODAY in ANY service.
--   If both are supplied    → PBOOKNO takes precedence.
-- ============================================================

DROP PROCEDURE IF EXISTS CMSGETBOOKFORSERVING$$

CREATE PROCEDURE CMSGETBOOKFORSERVING (
    IN PLOGINID   VARCHAR(255),
    IN PBOOKNO    VARCHAR(30),
    IN PCANTEENID INT,
    IN PSERVICEID INT
)
BEGIN
    DECLARE VBOOKID     INT DEFAULT NULL;
    DECLARE VCUSTOMERID INT DEFAULT NULL;

    IF PLOGINID IS NULL AND PBOOKNO IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Either Identifier/LOGINID or BOOKNO is required';
    END IF;

    IF PBOOKNO IS NOT NULL THEN
        -- Direct lookup by formatted business booking number
        SELECT BOOKID INTO VBOOKID
        FROM CMS_BOOKING
        WHERE BOOKNO = PBOOKNO
        LIMIT 1;
    ELSE
        -- 1. Try resolving via CMS_ACCKEY (RFID / QR Card UID)
        SELECT AK.CUSTOMERID INTO VCUSTOMERID
        FROM CMS_ACCKEY AK
        JOIN CMS_STATUS STAK ON STAK.STATUSID = AK.STATUSID
        WHERE AK.KEYVALUE = TRIM(PLOGINID)
          AND STAK.STATUSCODE = 'ACT'
          AND (AK.EXPIRESAT IS NULL OR AK.EXPIRESAT > CURRENT_TIMESTAMP)
        LIMIT 1;

        -- 2. Fallback to CMS_USER.LOGINID
        IF VCUSTOMERID IS NULL THEN
            SELECT C.CUSTOMERID INTO VCUSTOMERID
            FROM CMS_USER U
            JOIN CMS_CUSTOMER C ON C.USERID = U.USERID
            WHERE U.LOGINID = TRIM(PLOGINID)
            LIMIT 1;
        END IF;

        -- 3. Fallback to direct numeric CUSTOMERID
        IF VCUSTOMERID IS NULL AND PLOGINID REGEXP '^[0-9]+$' THEN
            SELECT C.CUSTOMERID INTO VCUSTOMERID
            FROM CMS_CUSTOMER C
            WHERE C.CUSTOMERID = CAST(PLOGINID AS UNSIGNED)
            LIMIT 1;
        END IF;

        IF VCUSTOMERID IS NOT NULL THEN
            -- Lookup today's booking for this customer (prioritizing CRT, with canteen/service scoping)
            SELECT B.BOOKID INTO VBOOKID
            FROM CMS_BOOKING B
            JOIN CMS_BOOKTYPE BT ON BT.BOOKTYPEID = B.BOOKTYPEID
            JOIN CMS_STATUS ST ON ST.STATUSID = B.STATUSID
            LEFT JOIN CMS_BOOKITEM BI ON BI.BOOKID = B.BOOKID
            LEFT JOIN CMS_DAYMENU DM ON DM.DAYMENUID = BI.DAYMENUID
            LEFT JOIN CMS_DAYSLOT DS ON DS.DAYSLOTID = DM.DAYSLOTID
            WHERE B.CUSTOMERID = VCUSTOMERID
              AND B.SERVICEDATE = CURDATE()
              AND ST.STATUSCODE IN ('CRT', 'SRV')
              AND (PCANTEENID IS NULL OR DS.CANTEENID = PCANTEENID)
              AND (PSERVICEID IS NULL OR B.SERVICEID = PSERVICEID)
            ORDER BY (CASE WHEN ST.STATUSCODE = 'CRT' THEN 0 ELSE 1 END) ASC, B.BOOKID DESC
            LIMIT 1;
        END IF;
    END IF;

    IF VBOOKID IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No active booking found';
    END IF;

    -- Result Set 1: Booking header
    SELECT
        B.BOOKID,
        B.BOOKNO,
        BT.BOOKTYPECODE,
        BT.BOOKTYPENAME,
        B.CUSTOMERID,
        C.CTYPECODE,
        C.DISPNAME    AS CUSTOMERNAME,
        U.LOGINID,
        B.SERVICEID,
        S.SERVNAME,
        B.SERVICEDATE,
        B.STATUSID,
        ST.STATUSCODE AS STATUSCODE,
        B.TOTALITEMS,
        B.TOTALQTY,
        B.TOTALAMOUNT,
        B.BOOKEDON,
        B.SERVEDBY,
        USRV.FULLNAME AS SERVEDBYNAME,
        B.SERVEDON,
        B.REMARKS
    FROM CMS_BOOKING  B
    JOIN CMS_BOOKTYPE BT ON BT.BOOKTYPEID  = B.BOOKTYPEID
    JOIN CMS_CUSTOMER C  ON C.CUSTOMERID   = B.CUSTOMERID
    JOIN CMS_SERVICE  S  ON S.SERVICEID    = B.SERVICEID
    JOIN CMS_STATUS   ST ON ST.STATUSID    = B.STATUSID
    LEFT JOIN CMS_USER U ON U.USERID       = C.USERID
    LEFT JOIN CMS_USER USRV ON USRV.USERID = B.SERVEDBY
    WHERE B.BOOKID = VBOOKID;

    -- Result Set 2: Booking items
    SELECT
        BI.BOOKITEMID,
        BI.DAYMENUID,
        BI.MENUITEMID,
        MI.MENUCODE,
        MI.SHORTNAME,
        MI.ITEMNAME,
        BI.QTY,
        BI.RATE,
        BI.AMOUNT,
        BI.STATUSID,
        ST.STATUSCODE AS STATUSCODE
    FROM CMS_BOOKITEM  BI
    JOIN CMS_MENUITEM  MI ON MI.MENUITEMID = BI.MENUITEMID
    JOIN CMS_STATUS    ST ON ST.STATUSID   = BI.STATUSID
    WHERE BI.BOOKID = VBOOKID
    ORDER BY BI.BOOKITEMID;

END$$


-- ============================================================
-- M-2  CMSGETMONTHLYEXP
--
-- Monthly expenditure summary for the employee dashboard.
-- Returns one row with spend breakdown:
--   AMOUNTSPENT   — sum of TOTALAMOUNT for served (SRV) and no-show (NOS) bookings
--   AMOUNTPENDING — sum of TOTALAMOUNT for bookings still active (CR)
--   TOTALCOMMITTED — AMOUNTSPENT + AMOUNTPENDING
--   TOTALBOOKINGS  — count of all non-cancelled bookings that month
-- ============================================================

DROP PROCEDURE IF EXISTS CMSGETMONTHLYEXP$$

CREATE PROCEDURE CMSGETMONTHLYEXP (
    IN PCUSTOMERID INT,
    IN PYEAR       INT,
    IN PMONTH      INT
)
BEGIN
    IF PCUSTOMERID IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer ID is required';
    END IF;
    IF PYEAR IS NULL OR PMONTH IS NULL OR PMONTH < 1 OR PMONTH > 12 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Valid year and month (1-12) are required';
    END IF;

    SELECT
        PCUSTOMERID                                                              AS CUSTOMERID,
        PYEAR                                                                    AS EXPYEAR,
        PMONTH                                                                   AS EXPMONTH,
        COALESCE(SUM(CASE WHEN ST.STATUSCODE IN ('SRV','NOS') THEN B.TOTALAMOUNT ELSE 0 END), 0) AS AMOUNTSPENT,
        COALESCE(SUM(CASE WHEN ST.STATUSCODE = 'CRT'          THEN B.TOTALAMOUNT ELSE 0 END), 0) AS AMOUNTPENDING,
        COALESCE(SUM(CASE WHEN ST.STATUSCODE IN ('SRV','NOS','CRT') THEN B.TOTALAMOUNT ELSE 0 END), 0) AS TOTALCOMMITTED,
        COUNT(CASE WHEN ST.STATUSCODE IN ('SRV','NOS','CRT') THEN 1 END)              AS TOTALBOOKINGS
    FROM CMS_BOOKING B
    JOIN CMS_STATUS ST ON ST.STATUSID = B.STATUSID
    WHERE B.CUSTOMERID          = PCUSTOMERID
      AND YEAR(B.SERVICEDATE)   = PYEAR
      AND MONTH(B.SERVICEDATE)  = PMONTH;
END$$


-- ============================================================
-- M-3  CMSLISTBOOKHISTORY
--
-- Paginated booking history for a specific employee.
-- Returns one result set that includes pagination metadata
-- (TOTALROWS, CURRENTPAGE, PAGESIZE, TOTALPAGES) on every row
-- so the frontend has everything it needs in a single call.
--
-- All filter parameters are optional (NULL = no filter).
-- Default: page 1, page size 20. Max page size enforced at 100.
-- ============================================================

DROP PROCEDURE IF EXISTS CMSLISTBOOKHISTORY$$

CREATE PROCEDURE CMSLISTBOOKHISTORY (
    IN PCUSTOMERID INT,
    IN PSTARTDATE  DATE,
    IN PENDDATE    DATE,
    IN PSTATUSCODE VARCHAR(10),
    IN PPAGE       INT,
    IN PPAGESIZE   INT
)
BEGIN
    DECLARE VOFFSET    INT DEFAULT 0;
    DECLARE VTOTAL     INT DEFAULT 0;
    DECLARE VSTATUSID  INT DEFAULT NULL;

    IF PCUSTOMERID IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer ID is required';
    END IF;

    IF PSTATUSCODE IS NOT NULL THEN
        SELECT STATUSID INTO VSTATUSID FROM CMS_STATUS WHERE STATUSCODE = PSTATUSCODE AND STATUSGRP = 'BKG';
        IF VSTATUSID IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid status code';
        END IF;
    END IF;

    -- Sanitise pagination inputs
    SET PPAGE     = COALESCE(PPAGE, 1);
    SET PPAGESIZE = COALESCE(PPAGESIZE, 20);
    IF PPAGE < 1       THEN SET PPAGE     = 1;  END IF;
    IF PPAGESIZE < 1   THEN SET PPAGESIZE = 20; END IF;
    IF PPAGESIZE > 100 THEN SET PPAGESIZE = 100; END IF;

    SET VOFFSET = (PPAGE - 1) * PPAGESIZE;

    -- Count matching rows first
    SELECT COUNT(*) INTO VTOTAL
    FROM CMS_BOOKING B
    WHERE B.CUSTOMERID = PCUSTOMERID
      AND (PSTARTDATE IS NULL OR B.SERVICEDATE >= PSTARTDATE)
      AND (PENDDATE   IS NULL OR B.SERVICEDATE <= PENDDATE)
      AND (VSTATUSID  IS NULL OR B.STATUSID     = VSTATUSID);

    -- Return the requested page with pagination metadata
    SELECT
        B.BOOKID,
        B.BOOKNO,
        BT.BOOKTYPECODE,
        B.SERVICEID,
        S.SERVNAME,
        B.SERVICEDATE,
        B.STATUSID,
        ST.STATUSCODE AS STATUSCODE,
        B.TOTALITEMS,
        B.TOTALQTY,
        B.TOTALAMOUNT,
        B.BOOKEDON,
        B.CANCELLEDON,
        B.SERVEDON,
        B.NOSHOWON,
        VTOTAL                        AS TOTALROWS,
        PPAGE                         AS CURRENTPAGE,
        PPAGESIZE                     AS PAGESIZE,
        CEIL(VTOTAL / PPAGESIZE)      AS TOTALPAGES
    FROM CMS_BOOKING  B
    JOIN CMS_BOOKTYPE BT ON BT.BOOKTYPEID = B.BOOKTYPEID
    JOIN CMS_SERVICE  S  ON S.SERVICEID   = B.SERVICEID
    JOIN CMS_STATUS   ST ON ST.STATUSID   = B.STATUSID
    WHERE B.CUSTOMERID = PCUSTOMERID
      AND (PSTARTDATE IS NULL OR B.SERVICEDATE >= PSTARTDATE)
      AND (PENDDATE   IS NULL OR B.SERVICEDATE <= PENDDATE)
      AND (VSTATUSID  IS NULL OR B.STATUSID     = VSTATUSID)
    ORDER BY B.SERVICEDATE DESC, B.BOOKID DESC
    LIMIT PPAGESIZE OFFSET VOFFSET;
END$$


-- ============================================================
-- M-4  CMSBULKBOOK
--
-- Places pre-bookings (PB) for PDAYCOUNT consecutive days
-- (must be 7 or 30) starting from PSTARTDATE.
--
-- PITEMSJSON shape:  [{"MENUITEMID": 5, "QTY": 1}, ...]
--   Uses MENUITEMID (not DAYMENUID) because DAYMENUIDs are
--   date-specific. The procedure resolves each MENUITEMID to
--   the correct DAYMENUID for each date automatically.
--
-- Per-date skip logic (booking is skipped, not errored, when):
--   • No approved + active day menu exists for that date/service.
--   • BOOKUNTIL has already passed for that date.
--   • Customer already has an active PB for that date/service.
--   • A requested MENUITEMID is not on the menu for that date,
--     or its MAXQTY would be exceeded.
--
-- Returns two result sets:
--   RS-1: Summary row  — TOTALATTEMPTED / TOTALBOOKED / TOTALSKIPPED
--   RS-2: Per-date detail — SERVICEDATE / RESULT / BOOKID / BOOKNO / SKIPREASON
-- ============================================================

DROP PROCEDURE IF EXISTS CMSBULKBOOK$$

CREATE PROCEDURE CMSBULKBOOK (
    IN PCUSTOMERID INT,
    IN PSERVICEID  INT,
    IN PSTARTDATE  DATE,
    IN PDAYCOUNT   INT,
    IN PITEMSJSON  JSON,
    IN PBOOKEDBY   INT
)
BEGIN
    DECLARE VI            INT DEFAULT 0;
    DECLARE VCURDATE      DATE;
    DECLARE VDAYSLOTID    INT DEFAULT NULL;
    DECLARE VBOOKUNTIL    DATETIME DEFAULT NULL;
    DECLARE VEXISTINGPB   INT DEFAULT 0;
    DECLARE VBOOKTYPEID   INT DEFAULT NULL;
    DECLARE VCTYPECODE    VARCHAR(20) DEFAULT NULL;
    DECLARE VCUSTSTATUSID   INT DEFAULT NULL;
    DECLARE VSERVSTATUSID   INT DEFAULT NULL;
    DECLARE VSERVCODE     VARCHAR(20) DEFAULT NULL;
    DECLARE VSERVPFX      VARCHAR(5)  DEFAULT NULL;
    DECLARE VBOOKID       INT DEFAULT NULL;
    DECLARE VBOOKNO       VARCHAR(30) DEFAULT NULL;
    DECLARE VBOOKSEQ      BIGINT DEFAULT 0;
    DECLARE VLASTNO       BIGINT DEFAULT 0;
    DECLARE VTOTALITEMS   INT DEFAULT 0;
    DECLARE VTOTALQTY     INT DEFAULT 0;
    DECLARE VTOTALAMOUNT  DECIMAL(12,2) DEFAULT 0.00;
    DECLARE VBOOKED       INT DEFAULT 0;
    DECLARE VSKIPPED      INT DEFAULT 0;
    DECLARE VSKIPREASON   VARCHAR(255) DEFAULT NULL;
    DECLARE VCONTINUE     TINYINT DEFAULT 0;
    DECLARE VINVALIDCOUNT INT DEFAULT 0;
    DECLARE VWALLETID     INT DEFAULT NULL;
    DECLARE VWALLETBAL    DECIMAL(12,2) DEFAULT 0.00;
    DECLARE VWALLETRES    DECIMAL(12,2) DEFAULT 0.00;
    DECLARE VCRSTATUSID   INT;
    DECLARE VCANSTATUSID  INT;

    -- Lookup commonly used statuses
    SELECT STATUSID INTO VCRSTATUSID FROM CMS_STATUS WHERE STATUSCODE = 'CRT' AND STATUSGRP = 'BKG';
    SELECT STATUSID INTO VCANSTATUSID FROM CMS_STATUS WHERE STATUSCODE = 'CAN' AND STATUSGRP = 'BKG';

    -- Temporary table to accumulate per-date results
    DROP TEMPORARY TABLE IF EXISTS TMP_BULKRESULT;
    CREATE TEMPORARY TABLE TMP_BULKRESULT (
        SERVICEDATE DATE        NOT NULL,
        RESULT      VARCHAR(10) NOT NULL,
        BOOKID      INT         NULL,
        BOOKNO      VARCHAR(30) NULL,
        SKIPREASON  VARCHAR(255) NULL
    ) ENGINE = MEMORY;

    -- ── Global input validation ──────────────────────────────
    IF PCUSTOMERID IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer ID is required';
    END IF;
    IF PSERVICEID IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Service ID is required';
    END IF;
    IF PSTARTDATE IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Start date is required';
    END IF;
    IF PDAYCOUNT NOT IN (7, 30) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Day count must be 7 or 30';
    END IF;
    IF PITEMSJSON IS NULL
       OR JSON_TYPE(PITEMSJSON) <> 'ARRAY'
       OR JSON_LENGTH(PITEMSJSON) = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'At least one booking item is required in PITEMSJSON';
    END IF;

    -- Validate customer
    SELECT CTYPECODE, STATUSID
    INTO   VCTYPECODE, VCUSTSTATUSID
    FROM   CMS_CUSTOMER
    WHERE  CUSTOMERID = PCUSTOMERID;

    IF VCTYPECODE IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer not found';
    END IF;
    -- 10 = 'ACT'
    IF VCUSTSTATUSID <> 10 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer is not active';
    END IF;

    -- Validate service
    SELECT SERVCODE, STATUSID
    INTO   VSERVCODE, VSERVSTATUSID
    FROM   CMS_SERVICE
    WHERE  SERVICEID = PSERVICEID;

    IF VSERVCODE IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Service not found';
    END IF;
    IF VSERVSTATUSID <> 10 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Service is not active';
    END IF;

    -- Service code prefix used in BOOKNO generation (first 2 chars, uppercase)
    SET VSERVPFX = UPPER(LEFT(VSERVCODE, 2));

    -- Resolve PB booking type
    SELECT BOOKTYPEID
    INTO   VBOOKTYPEID
    FROM   CMS_BOOKTYPE
    JOIN   CMS_STATUS ST ON ST.STATUSID = CMS_BOOKTYPE.STATUSID
    WHERE  BOOKTYPECODE = 'PB'
      AND  ST.STATUSCODE = 'ACT';

    IF VBOOKTYPEID IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PB booking type not found or inactive';
    END IF;

    -- ── Per-day loop ─────────────────────────────────────────
    SET VI = 0;
    WHILE VI < PDAYCOUNT DO

        SET VCURDATE    = DATE_ADD(PSTARTDATE, INTERVAL VI DAY);
        SET VSKIPREASON = NULL;
        SET VCONTINUE   = 0;
        SET VDAYSLOTID  = NULL;
        SET VBOOKUNTIL  = NULL;

        -- Guard: duplicate booking
        SELECT COUNT(*) INTO VEXISTINGPB
        FROM   CMS_BOOKING
        WHERE  CUSTOMERID  = PCUSTOMERID
          AND  SERVICEID   = PSERVICEID
          AND  SERVICEDATE = VCURDATE
          AND  BOOKTYPEID  = VBOOKTYPEID
          AND  STATUSID    <> VCANSTATUSID;

        IF VEXISTINGPB > 0 THEN
            SET VSKIPREASON = 'Already has an active booking for this date';
            SET VCONTINUE   = 1;
        END IF;

        -- Guard: approved day slot + menu must exist
        -- 10 = 'ACT', 22 = 'APP' (Approved for MENUAPPRSTATUSID)
        IF VCONTINUE = 0 THEN
            SELECT DS.DAYSLOTID, MIN(DM.BOOKUNTIL)
            INTO   VDAYSLOTID, VBOOKUNTIL
            FROM   CMS_DAYSLOT DS
            JOIN   CMS_DAYMENU DM ON DM.DAYSLOTID   = DS.DAYSLOTID
            WHERE  DS.SERVICEID   = PSERVICEID
              AND  DS.SERVDATE    = VCURDATE
              AND  DS.STATUSID    = 10
              AND  DS.APPRSTATUSID = 22
              AND  DM.STATUSID    = 10
              AND  DM.ISPREBOOK   = 1
            GROUP BY DS.DAYSLOTID;

            IF VDAYSLOTID IS NULL THEN
                SET VSKIPREASON = 'No approved pre-book menu for this date';
                SET VCONTINUE   = 1;
            END IF;
        END IF;

        -- Guard: booking window open
        IF VCONTINUE = 0 AND CURRENT_TIMESTAMP > VBOOKUNTIL THEN
            SET VSKIPREASON = 'Booking window has closed for this date';
            SET VCONTINUE   = 1;
        END IF;

        -- Guard: all requested items available on this date's menu
        IF VCONTINUE = 0 THEN
            SELECT COUNT(*) INTO VINVALIDCOUNT
            FROM JSON_TABLE(PITEMSJSON, '$[*]' COLUMNS (
                MENUITEMID INT PATH '$.MENUITEMID',
                QTY        INT PATH '$.QTY'
            )) AS JT
            LEFT JOIN CMS_DAYMENU DM ON DM.DAYSLOTID  = VDAYSLOTID
                                     AND DM.MENUITEMID = JT.MENUITEMID
                                     AND DM.STATUSID     = 10
                                     AND DM.ISPREBOOK  = 1
            LEFT JOIN CMS_MENUITEM MI ON MI.MENUITEMID = JT.MENUITEMID
            WHERE JT.MENUITEMID IS NULL
               OR JT.QTY IS NULL OR JT.QTY < 1
               OR DM.DAYMENUID  IS NULL         -- item not on menu for this date
               OR JT.QTY > DM.MAXQTY
               OR MI.STATUSID <> 10;

            IF VINVALIDCOUNT > 0 THEN
                SET VSKIPREASON = 'One or more requested items not available on this date';
                SET VCONTINUE   = 1;
            END IF;
        END IF;

        -- All guards passed → place the booking
        IF VCONTINUE = 0 THEN
            BEGIN
                -- Per-booking transaction with isolated error handling.
                -- On failure the booking is skipped (not the entire batch).
                DECLARE EXIT HANDLER FOR SQLEXCEPTION
                BEGIN
                    ROLLBACK;
                    INSERT INTO TMP_BULKRESULT (SERVICEDATE, RESULT, BOOKID, BOOKNO, SKIPREASON)
                    VALUES (VCURDATE, 'SKIPPED', NULL, NULL, 'Booking failed (concurrent conflict or system error)');
                    SET VSKIPPED = VSKIPPED + 1;
                END;

                START TRANSACTION;

                -- Allocate sequence number
                CALL CMSGENAUTO('CMS_BOOKING', 'BOOKNO', VBOOKNO);
                
                -- Wait, CMSGENAUTO generates random sequence string without VSERVPFX?
                -- Since we rewrote `CMS_BOOKING` to use CMSGENAUTO but the user original script uses `BOOKCTR` with `VSERVPFX`... 
                -- Wait! The user asked: "WHY TO USE BOOKCTR INSTEAD OF AUTONOS, AND WHAT ABOUT WALLET TRANSACTION, SHOULD WE USE AUTONOS FOR IT OR SHOULD HAVE SOMETHING LIKE BOOKCTR FOR IT TOO"
                -- The plan says: we agreed to use CMSGENAUTO for BOOKING (we actually deleted BOOKCTR or changed it). Let me use `CALL CMSGENAUTO('CMS_BOOKING', 'BOOKNO', VBOOKNO)`!
                
                -- Compute booking totals
                SELECT
                    COUNT(*),
                    SUM(JT.QTY),
                    SUM(JT.QTY * COALESCE((
                        SELECT IPD.PRICE
                        FROM   CMS_ITEMPRICE    IP
                        JOIN   CMS_ITEMPRICEDT  IPD ON IPD.ITEMPRICEID = IP.ITEMPRICEID
                        JOIN   CMS_STATUS       IPST ON IPST.STATUSID = IP.STATUSID
                        WHERE  IP.MENUITEMID  = DM.MENUITEMID
                          AND  IPD.CTYPECODE  = VCTYPECODE
                          AND  IP.EFFFROM    <= VCURDATE
                          AND  IPST.STATUSCODE = 'ACT'
                        ORDER BY IP.EFFFROM DESC LIMIT 1
                    ), 0))
                INTO VTOTALITEMS, VTOTALQTY, VTOTALAMOUNT
                FROM JSON_TABLE(PITEMSJSON, '$[*]' COLUMNS (
                    MENUITEMID INT PATH '$.MENUITEMID',
                    QTY        INT PATH '$.QTY'
                )) AS JT
                JOIN CMS_DAYMENU DM ON DM.DAYSLOTID  = VDAYSLOTID
                                   AND DM.MENUITEMID = JT.MENUITEMID;

                -- Wallet reservation for wallet-based customer types
                IF VCTYPECODE IN ('CONT', 'VIS') THEN
                    SELECT WALLETID, BALANCE, RESERVEDAMT
                    INTO   VWALLETID, VWALLETBAL, VWALLETRES
                    FROM   CMS_WALLET W
                    JOIN   CMS_STATUS WST ON WST.STATUSID = W.STATUSID
                    WHERE  CUSTOMERID = PCUSTOMERID
                      AND  WST.STATUSCODE = 'ACT'
                    FOR UPDATE;

                    IF VWALLETID IS NULL THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Active wallet not found';
                    END IF;
                    IF VTOTALAMOUNT > (VWALLETBAL - VWALLETRES) THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient wallet balance';
                    END IF;

                    UPDATE CMS_WALLET
                    SET    RESERVEDAMT = RESERVEDAMT + VTOTALAMOUNT
                    WHERE  WALLETID   = VWALLETID;
                END IF;

                -- Insert booking header
                INSERT INTO CMS_BOOKING (
                    BOOKNO, BOOKTYPEID, CUSTOMERID, SERVICEID, SERVICEDATE,
                    STATUSID, TOTALITEMS, TOTALQTY, TOTALAMOUNT,
                    BOOKEDBY, BOOKEDON, CREATEDBY
                ) VALUES (
                    VBOOKNO, VBOOKTYPEID, PCUSTOMERID, PSERVICEID, VCURDATE,
                    VCRSTATUSID, VTOTALITEMS, VTOTALQTY, VTOTALAMOUNT,
                    PBOOKEDBY, CURRENT_TIMESTAMP, PBOOKEDBY
                );

                SET VBOOKID = LAST_INSERT_ID();

                -- Insert booking items (one row per requested MENUITEMID)
                INSERT INTO CMS_BOOKITEM (BOOKID, DAYMENUID, MENUITEMID, QTY, RATE, AMOUNT, STATUSID)
                SELECT
                    VBOOKID,
                    DM.DAYMENUID,
                    DM.MENUITEMID,
                    JT.QTY,
                    COALESCE((
                        SELECT IPD.PRICE
                        FROM   CMS_ITEMPRICE   IP
                        JOIN   CMS_ITEMPRICEDT IPD ON IPD.ITEMPRICEID = IP.ITEMPRICEID
                        JOIN   CMS_STATUS      IPST ON IPST.STATUSID = IP.STATUSID
                        WHERE  IP.MENUITEMID  = DM.MENUITEMID
                          AND  IPD.CTYPECODE  = VCTYPECODE
                          AND  IP.EFFFROM    <= VCURDATE
                          AND  IPST.STATUSCODE = 'ACT'
                        ORDER BY IP.EFFFROM DESC LIMIT 1
                    ), 0),
                    JT.QTY * COALESCE((
                        SELECT IPD.PRICE
                        FROM   CMS_ITEMPRICE   IP
                        JOIN   CMS_ITEMPRICEDT IPD ON IPD.ITEMPRICEID = IP.ITEMPRICEID
                        JOIN   CMS_STATUS      IPST ON IPST.STATUSID = IP.STATUSID
                        WHERE  IP.MENUITEMID  = DM.MENUITEMID
                          AND  IPD.CTYPECODE  = VCTYPECODE
                          AND  IP.EFFFROM    <= VCURDATE
                          AND  IPST.STATUSCODE = 'ACT'
                        ORDER BY IP.EFFFROM DESC LIMIT 1
                    ), 0),
                    VCRSTATUSID
                FROM JSON_TABLE(PITEMSJSON, '$[*]' COLUMNS (
                    MENUITEMID INT PATH '$.MENUITEMID',
                    QTY        INT PATH '$.QTY'
                )) AS JT
                JOIN CMS_DAYMENU DM ON DM.DAYSLOTID  = VDAYSLOTID
                                   AND DM.MENUITEMID = JT.MENUITEMID;

                -- Insert PB active guard record (prevents duplicate PB per customer/service/date)
                INSERT INTO CMS_PBACTIVE (CUSTOMERID, SERVICEID, SERVICEDATE, BOOKID)
                VALUES (PCUSTOMERID, PSERVICEID, VCURDATE, VBOOKID);

                COMMIT;

                INSERT INTO TMP_BULKRESULT (SERVICEDATE, RESULT, BOOKID, BOOKNO, SKIPREASON)
                VALUES (VCURDATE, 'BOOKED', VBOOKID, VBOOKNO, NULL);
                SET VBOOKED = VBOOKED + 1;

            END; -- per-booking transaction block

        ELSE
            -- Skip this date
            INSERT INTO TMP_BULKRESULT (SERVICEDATE, RESULT, BOOKID, BOOKNO, SKIPREASON)
            VALUES (VCURDATE, 'SKIPPED', NULL, NULL, VSKIPREASON);
            SET VSKIPPED = VSKIPPED + 1;
        END IF;

        SET VI = VI + 1;
    END WHILE;

    -- ── Result Set 1: Summary ────────────────────────────────
    SELECT
        PDAYCOUNT        AS TOTALATTEMPTED,
        VBOOKED          AS TOTALBOOKED,
        VSKIPPED         AS TOTALSKIPPED;

    -- ── Result Set 2: Per-date detail ────────────────────────
    SELECT SERVICEDATE, RESULT, BOOKID, BOOKNO, SKIPREASON
    FROM   TMP_BULKRESULT
    ORDER BY SERVICEDATE;

    DROP TEMPORARY TABLE IF EXISTS TMP_BULKRESULT;

END$$

-- ============================================================
-- M-5  CMSGETKITCHENSUMMARY
--
-- Generates a preparation report for a given DAYSLOTID.
-- Returns RS-1: Aggregated item totals.
-- Returns RS-2: Separated item totals by Customer Type.
-- ============================================================

DROP PROCEDURE IF EXISTS CMSGETKITCHENSUMMARY$$

CREATE PROCEDURE CMSGETKITCHENSUMMARY (
    IN PDAYSLOTID INT
)
BEGIN
    -- RS-1: Aggregated
    SELECT MI.MENUITEMID, MI.ITEMNAME, SUM(BI.QTY) AS TOTALQTY
    FROM CMS_BOOKITEM BI
    JOIN CMS_DAYMENU DM ON DM.DAYMENUID = BI.DAYMENUID
    JOIN CMS_BOOKING B ON B.BOOKID = BI.BOOKID
    JOIN CMS_STATUS B_ST ON B_ST.STATUSID = B.STATUSID
    JOIN CMS_MENUITEM MI ON MI.MENUITEMID = BI.MENUITEMID
    WHERE DM.DAYSLOTID = PDAYSLOTID
      AND B_ST.STATUSCODE IN ('CR', 'SRV', 'NOS')
    GROUP BY MI.MENUITEMID, MI.ITEMNAME
    ORDER BY MI.ITEMNAME;

    -- RS-2: Break down by Customer Type
    SELECT MI.MENUITEMID, MI.ITEMNAME, C.CTYPECODE, SUM(BI.QTY) AS CTYPEQTY
    FROM CMS_BOOKITEM BI
    JOIN CMS_DAYMENU DM ON DM.DAYMENUID = BI.DAYMENUID
    JOIN CMS_BOOKING B ON B.BOOKID = BI.BOOKID
    JOIN CMS_CUSTOMER C ON C.CUSTOMERID = B.CUSTOMERID
    JOIN CMS_STATUS B_ST ON B_ST.STATUSID = B.STATUSID
    JOIN CMS_MENUITEM MI ON MI.MENUITEMID = BI.MENUITEMID
    WHERE DM.DAYSLOTID = PDAYSLOTID
      AND B_ST.STATUSCODE IN ('CR', 'SRV', 'NOS')
    GROUP BY MI.MENUITEMID, MI.ITEMNAME, C.CTYPECODE
    ORDER BY MI.ITEMNAME, C.CTYPECODE;
END$$


-- ============================================================
-- M-6  CMSSERVEBOOKING
--
-- Marks a booking as Served and triggers final wallet deduction.
-- ============================================================

DROP PROCEDURE IF EXISTS CMSSERVEBOOKING$$

CREATE PROCEDURE CMSSERVEBOOKING (
    IN PBOOKID INT,
    IN PUSERID INT
)
BEGIN
    DECLARE VCUSTOMERID INT;
    DECLARE VTOTALAMOUNT DECIMAL(12,2);
    DECLARE VCTYPECODE VARCHAR(20);
    DECLARE VSTATUSCODE VARCHAR(10);
    DECLARE VWALLETID INT;
    DECLARE VSRVSTATUSID INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

    SELECT B.CUSTOMERID, B.TOTALAMOUNT, C.CTYPECODE, ST.STATUSCODE
    INTO VCUSTOMERID, VTOTALAMOUNT, VCTYPECODE, VSTATUSCODE
    FROM CMS_BOOKING B
    JOIN CMS_CUSTOMER C ON C.CUSTOMERID = B.CUSTOMERID
    JOIN CMS_STATUS ST ON ST.STATUSID = B.STATUSID
    WHERE B.BOOKID = PBOOKID;

    IF VSTATUSCODE <> 'CR' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only active/created bookings can be served';
    END IF;

    SELECT STATUSID INTO VSRVSTATUSID FROM CMS_STATUS WHERE STATUSCODE = 'SRV' AND STATUSGRP = 'BKG';

    START TRANSACTION;

    IF VCTYPECODE IN ('CONT', 'VIS') THEN
        -- Finalize Wallet deduction
        SELECT WALLETID INTO VWALLETID FROM CMS_WALLET WHERE CUSTOMERID = VCUSTOMERID FOR UPDATE;
        
        UPDATE CMS_WALLET
        SET RESERVEDAMT = RESERVEDAMT - VTOTALAMOUNT,
            BALANCE = BALANCE - VTOTALAMOUNT,
            UPDATEDAT = CURRENT_TIMESTAMP
        WHERE WALLETID = VWALLETID;

        -- Record transaction
        INSERT INTO CMS_WALLETTRAN (WALLETID, TRANTYPE, AMOUNT, REFNO, REMARKS, STATUSID, CREATEDBY)
        VALUES (VWALLETID, 'DR', VTOTALAMOUNT, CONCAT('BKG-', PBOOKID), 'Served Booking Deduction', 10, PUSERID);
    END IF;

    UPDATE CMS_BOOKING
    SET STATUSID = VSRVSTATUSID,
        SERVEDON = CURRENT_TIMESTAMP,
        UPDATEDAT = CURRENT_TIMESTAMP
    WHERE BOOKID = PBOOKID;

    UPDATE CMS_BOOKITEM
    SET STATUSID = VSRVSTATUSID
    WHERE BOOKID = PBOOKID;

    COMMIT;
END$$


-- ============================================================
-- M-7  CMSPROCESSNOSHOWS
--
-- Nightly job to mark unserved bookings as No-Show.
-- Processes wallet deductions as penalties for unserved food.
-- ============================================================

DROP PROCEDURE IF EXISTS CMSPROCESSNOSHOWS$$

CREATE PROCEDURE CMSPROCESSNOSHOWS ()
BEGIN
    DECLARE VNOSSTATUSID INT;
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_bookid INT;
    DECLARE v_customerid INT;
    DECLARE v_amount DECIMAL(12,2);
    DECLARE v_ctypecode VARCHAR(20);
    DECLARE v_walletid INT;

    DECLARE cur CURSOR FOR
        SELECT B.BOOKID, B.CUSTOMERID, B.TOTALAMOUNT, C.CTYPECODE
        FROM CMS_BOOKING B
        JOIN CMS_CUSTOMER C ON C.CUSTOMERID = B.CUSTOMERID
        JOIN CMS_STATUS ST ON ST.STATUSID = B.STATUSID
        WHERE ST.STATUSCODE = 'CRT'
          AND B.SERVICEDATE < CURDATE();
          
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    SELECT STATUSID INTO VNOSSTATUSID FROM CMS_STATUS WHERE STATUSCODE = 'NOS' AND STATUSGRP = 'BKG';

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_bookid, v_customerid, v_amount, v_ctypecode;
        IF done THEN LEAVE read_loop; END IF;
        
        START TRANSACTION;
        
        IF v_ctypecode IN ('CONT', 'VIS') THEN
            SELECT WALLETID INTO v_walletid FROM CMS_WALLET WHERE CUSTOMERID = v_customerid FOR UPDATE;
            UPDATE CMS_WALLET 
            SET RESERVEDAMT = RESERVEDAMT - v_amount,
                BALANCE = BALANCE - v_amount
            WHERE WALLETID = v_walletid;
            
            INSERT INTO CMS_WALLETTRAN (WALLETID, TRANTYPE, AMOUNT, REFNO, REMARKS, STATUSID, CREATEDBY)
            VALUES (v_walletid, 'DR', v_amount, CONCAT('NOS-', v_bookid), 'No-Show Penalty Deduction', 10, 1);
        END IF;

        UPDATE CMS_BOOKING SET STATUSID = VNOSSTATUSID, NOSHOWON = CURRENT_TIMESTAMP WHERE BOOKID = v_bookid;
        UPDATE CMS_BOOKITEM SET STATUSID = VNOSSTATUSID WHERE BOOKID = v_bookid;
        
        COMMIT;
    END LOOP;
    CLOSE cur;

END$$

DELIMITER ;
