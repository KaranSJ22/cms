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
    IN PLOGINID  VARCHAR(50),
    IN PBOOKNO   VARCHAR(30)
)
BEGIN
    DECLARE VBOOKID INT DEFAULT NULL;

    IF PLOGINID IS NULL AND PBOOKNO IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Either LOGINID or BOOKNO is required';
    END IF;

    IF PBOOKNO IS NOT NULL THEN
        -- Direct lookup by formatted business booking number
        SELECT BOOKID INTO VBOOKID
        FROM CMS_BOOKING
        WHERE BOOKNO = PBOOKNO
        LIMIT 1;
    ELSE
        -- Lookup today's active pre-booking for this employee via LOGINID
        SELECT B.BOOKID INTO VBOOKID
        FROM CMS_USER U
        JOIN CMS_CUSTOMER C  ON C.USERID     = U.USERID
        JOIN CMS_BOOKING  B  ON B.CUSTOMERID = C.CUSTOMERID
        JOIN CMS_BOOKTYPE BT ON BT.BOOKTYPEID = B.BOOKTYPEID
        WHERE U.LOGINID      = PLOGINID
          AND BT.BOOKTYPECODE = 'PB'
          AND B.SERVICEDATE   = CURDATE()
          AND B.STATUS        = 'CR'
        ORDER BY B.BOOKID DESC
        LIMIT 1;
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
        B.STATUS,
        B.TOTALITEMS,
        B.TOTALQTY,
        B.TOTALAMOUNT,
        B.BOOKEDON,
        B.REMARKS
    FROM CMS_BOOKING  B
    JOIN CMS_BOOKTYPE BT ON BT.BOOKTYPEID  = B.BOOKTYPEID
    JOIN CMS_CUSTOMER C  ON C.CUSTOMERID   = B.CUSTOMERID
    JOIN CMS_SERVICE  S  ON S.SERVICEID    = B.SERVICEID
    LEFT JOIN CMS_USER U ON U.USERID       = C.USERID
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
        BI.STATUS
    FROM CMS_BOOKITEM  BI
    JOIN CMS_MENUITEM  MI ON MI.MENUITEMID = BI.MENUITEMID
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
        COALESCE(SUM(CASE WHEN B.STATUS IN ('SRV','NOS') THEN B.TOTALAMOUNT ELSE 0 END), 0) AS AMOUNTSPENT,
        COALESCE(SUM(CASE WHEN B.STATUS = 'CR'           THEN B.TOTALAMOUNT ELSE 0 END), 0) AS AMOUNTPENDING,
        COALESCE(SUM(CASE WHEN B.STATUS IN ('SRV','NOS','CR') THEN B.TOTALAMOUNT ELSE 0 END), 0) AS TOTALCOMMITTED,
        COUNT(CASE WHEN B.STATUS IN ('SRV','NOS','CR') THEN 1 END)              AS TOTALBOOKINGS
    FROM CMS_BOOKING B
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
    IN PSTATUS     VARCHAR(10),
    IN PPAGE       INT,
    IN PPAGESIZE   INT
)
BEGIN
    DECLARE VOFFSET    INT DEFAULT 0;
    DECLARE VTOTAL     INT DEFAULT 0;

    IF PCUSTOMERID IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer ID is required';
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
      AND (PSTATUS    IS NULL OR B.STATUS       = PSTATUS);

    -- Return the requested page with pagination metadata
    SELECT
        B.BOOKID,
        B.BOOKNO,
        BT.BOOKTYPECODE,
        B.SERVICEID,
        S.SERVNAME,
        B.SERVICEDATE,
        B.STATUS,
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
    WHERE B.CUSTOMERID = PCUSTOMERID
      AND (PSTARTDATE IS NULL OR B.SERVICEDATE >= PSTARTDATE)
      AND (PENDDATE   IS NULL OR B.SERVICEDATE <= PENDDATE)
      AND (PSTATUS    IS NULL OR B.STATUS       = PSTATUS)
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
    DECLARE VCUSTSTATUS   VARCHAR(20) DEFAULT NULL;
    DECLARE VSERVSTATUS   VARCHAR(20) DEFAULT NULL;
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
    SELECT CTYPECODE, STATUS
    INTO   VCTYPECODE, VCUSTSTATUS
    FROM   CMS_CUSTOMER
    WHERE  CUSTOMERID = PCUSTOMERID;

    IF VCTYPECODE IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer not found';
    END IF;
    IF VCUSTSTATUS <> 'A' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer is not active';
    END IF;

    -- Validate service
    SELECT SERVCODE, STATUS
    INTO   VSERVCODE, VSERVSTATUS
    FROM   CMS_SERVICE
    WHERE  SERVICEID = PSERVICEID;

    IF VSERVCODE IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Service not found';
    END IF;
    IF VSERVSTATUS <> 'A' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Service is not active';
    END IF;

    -- Service code prefix used in BOOKNO generation (first 2 chars, uppercase)
    SET VSERVPFX = UPPER(LEFT(VSERVCODE, 2));

    -- Resolve PB booking type
    SELECT BOOKTYPEID
    INTO   VBOOKTYPEID
    FROM   CMS_BOOKTYPE
    WHERE  BOOKTYPECODE = 'PB'
      AND  STATUS       = 'A';

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
          AND  STATUS     <> 'CAN';

        IF VEXISTINGPB > 0 THEN
            SET VSKIPREASON = 'Already has an active booking for this date';
            SET VCONTINUE   = 1;
        END IF;

        -- Guard: approved day slot + menu must exist
        IF VCONTINUE = 0 THEN
            SELECT DS.DAYSLOTID, MIN(DM.BOOKUNTIL)
            INTO   VDAYSLOTID, VBOOKUNTIL
            FROM   CMS_DAYSLOT DS
            JOIN   CMS_DAYMENU DM ON DM.DAYSLOTID   = DS.DAYSLOTID
            WHERE  DS.SERVICEID   = PSERVICEID
              AND  DS.SERVDATE    = VCURDATE
              AND  DS.STATUS      = 'A'
              AND  DM.APPRSTATUS  = 'APP'
              AND  DM.STATUS      = 'A'
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
                                     AND DM.APPRSTATUS = 'APP'
                                     AND DM.STATUS     = 'A'
                                     AND DM.ISPREBOOK  = 1
            LEFT JOIN CMS_MENUITEM MI ON MI.MENUITEMID = JT.MENUITEMID
            WHERE JT.MENUITEMID IS NULL
               OR JT.QTY IS NULL OR JT.QTY < 1
               OR DM.DAYMENUID  IS NULL         -- item not on menu for this date
               OR JT.QTY > DM.MAXQTY
               OR MI.STATUS <> 'A';

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
                INSERT INTO CMS_BOOKCTR (BOOKTYPEID, SERVICEID, LASTNO)
                VALUES (VBOOKTYPEID, PSERVICEID, 0)
                ON DUPLICATE KEY UPDATE LASTNO = LASTNO;

                SELECT LASTNO INTO VLASTNO
                FROM   CMS_BOOKCTR
                WHERE  BOOKTYPEID = VBOOKTYPEID
                  AND  SERVICEID  = PSERVICEID
                FOR UPDATE;

                SET VBOOKSEQ = VLASTNO + 1;

                UPDATE CMS_BOOKCTR
                SET    LASTNO = VBOOKSEQ
                WHERE  BOOKTYPEID = VBOOKTYPEID
                  AND  SERVICEID  = PSERVICEID;

                SET VBOOKNO = CONCAT('PB-', VSERVPFX, LPAD(VBOOKSEQ, 3, '0'));

                -- Compute booking totals
                SELECT
                    COUNT(*),
                    SUM(JT.QTY),
                    SUM(JT.QTY * COALESCE((
                        SELECT IPD.PRICE
                        FROM   CMS_ITEMPRICE    IP
                        JOIN   CMS_ITEMPRICEDT  IPD ON IPD.ITEMPRICEID = IP.ITEMPRICEID
                        WHERE  IP.MENUITEMID  = DM.MENUITEMID
                          AND  IPD.CTYPECODE  = VCTYPECODE
                          AND  IP.EFFFROM    <= VCURDATE
                          AND  IP.STATUS      = 'A'
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
                    FROM   CMS_WALLET
                    WHERE  CUSTOMERID = PCUSTOMERID
                      AND  STATUS     = 'A'
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
                    STATUS, BOOKSEQNO, TOTALITEMS, TOTALQTY, TOTALAMOUNT,
                    BOOKEDBY, BOOKEDON, CREATEDBY
                ) VALUES (
                    VBOOKNO, VBOOKTYPEID, PCUSTOMERID, PSERVICEID, VCURDATE,
                    'CR', VBOOKSEQ, VTOTALITEMS, VTOTALQTY, VTOTALAMOUNT,
                    PBOOKEDBY, CURRENT_TIMESTAMP, PBOOKEDBY
                );

                SET VBOOKID = LAST_INSERT_ID();

                -- Insert booking items (one row per requested MENUITEMID)
                INSERT INTO CMS_BOOKITEM (BOOKID, DAYMENUID, MENUITEMID, QTY, RATE, AMOUNT, STATUS)
                SELECT
                    VBOOKID,
                    DM.DAYMENUID,
                    DM.MENUITEMID,
                    JT.QTY,
                    COALESCE((
                        SELECT IPD.PRICE
                        FROM   CMS_ITEMPRICE   IP
                        JOIN   CMS_ITEMPRICEDT IPD ON IPD.ITEMPRICEID = IP.ITEMPRICEID
                        WHERE  IP.MENUITEMID  = DM.MENUITEMID
                          AND  IPD.CTYPECODE  = VCTYPECODE
                          AND  IP.EFFFROM    <= VCURDATE
                          AND  IP.STATUS      = 'A'
                        ORDER BY IP.EFFFROM DESC LIMIT 1
                    ), 0),
                    JT.QTY * COALESCE((
                        SELECT IPD.PRICE
                        FROM   CMS_ITEMPRICE   IP
                        JOIN   CMS_ITEMPRICEDT IPD ON IPD.ITEMPRICEID = IP.ITEMPRICEID
                        WHERE  IP.MENUITEMID  = DM.MENUITEMID
                          AND  IPD.CTYPECODE  = VCTYPECODE
                          AND  IP.EFFFROM    <= VCURDATE
                          AND  IP.STATUS      = 'A'
                        ORDER BY IP.EFFFROM DESC LIMIT 1
                    ), 0),
                    'CR'
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

DELIMITER ;
