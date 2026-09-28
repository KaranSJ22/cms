/* ============================================================
    STORED PROCEDURE: CMSADDBOOKWEEKLY
    ISRO Canteen Management System (CMS)
    ------------------------------------------------------------
    Purpose:
      Atomically pre-books meals for multiple days / an entire
      5-day working week (Monday–Friday) in a single transaction.

    Features:
      1. Role-Aware Billing:
         - Permanent ('PRM'/'PERMEMP') & Other Center ('OCE'/'OCEEMP'):
           Zero upfront deduction; records bookings for Monthly Payroll recovery.
         - Contractors ('CNT'/'CONTEMP') & Visitors ('VIS'/'VISITOR'):
           Calculates total cumulative weekly amount across all days,
           verifies against active wallet balance (BALANCE - RESERVEDAMT),
           and debits wallet with linked CMS_WALLETTRAN audit entries.
      2. Comprehensive Pre-Validations:
         - Prevents duplicate active bookings for any requested (date, service).
         - Checks cutoff times (CURRENT_TIMESTAMP <= DM.BOOKUNTIL).
         - Enforces per-item maximum quantity (QTY <= DM.MAXQTY).
         - Validates counter capacity (DM.AVAILQTY).
         - Verifies day slot approval (APR) and menu status (ACT).
      3. Atomic Execution:
         - All requested days succeed together, or all roll back with
           a descriptive error message. No partial/broken bookings.
   ============================================================ */

USE cms_db;

DROP PROCEDURE IF EXISTS CMSADDBOOKWEEKLY;

DELIMITER $$

CREATE PROCEDURE CMSADDBOOKWEEKLY (
    IN PBOOKTYPECODE VARCHAR(10),  -- 'PB' (Pre-Booking)
    IN PCUSTOMERID   INT,          -- ID of customer placing the booking
    IN PBOOKINGSJSON JSON,         -- Array of day-service bookings with their items
    IN PBOOKEDBY     INT,          -- USERID of the logged-in user
    IN PREMARKS      VARCHAR(255)  -- Optional remark (e.g. '5-Day Weekly Pass')
)
BEGIN
    -- Metadata variables
    DECLARE VBOOKTYPEID        INT;
    DECLARE VBOOKTYPESTATUSID  INT;
    DECLARE VCTYPECODE         VARCHAR(20);
    DECLARE VCUSTSTATUSID      INT;
    DECLARE VNUMDAYS           INT DEFAULT 0;
    DECLARE VI                 INT DEFAULT 0;
    
    -- Validation counts
    DECLARE VEXISTING_COUNT    INT DEFAULT 0;
    DECLARE VINVALID_COUNT     INT DEFAULT 0;
    DECLARE VCAPACITY_EXCEEDED INT DEFAULT 0;
    DECLARE VDUPLICATE_SERVICES INT DEFAULT 0;

    -- Financial variables
    DECLARE VTOTAL_WEEK_AMOUNT DECIMAL(12,2) DEFAULT 0.00;
    DECLARE VWALLETID          INT DEFAULT NULL;
    DECLARE VWALLETBALANCE     DECIMAL(12,2) DEFAULT 0.00;
    DECLARE VWALLETRESERVED    DECIMAL(12,2) DEFAULT 0.00;
    DECLARE VRUNNING_BAL       DECIMAL(12,2) DEFAULT 0.00;
    DECLARE VAUTOREFNO         VARCHAR(80);

    -- Loop iteration variables per day
    DECLARE VDAYJSON           JSON;
    DECLARE VSERVICEDATE       DATE;
    DECLARE VSERVICEID         INT;
    DECLARE VSERVPFX           VARCHAR(5);
    DECLARE VITEMSJSON         JSON;
    DECLARE VDAYITEMS          INT DEFAULT 0;
    DECLARE VDAYQTY            INT DEFAULT 0;
    DECLARE VDAYAMOUNT         DECIMAL(12,2) DEFAULT 0.00;
    DECLARE VBOOKID            INT;
    DECLARE VBOOKNO            VARCHAR(30);
    DECLARE VBOOKSEQ           BIGINT;
    DECLARE VLASTNO            BIGINT;

    -- Rollback on any unhandled SQL exception
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        DROP TEMPORARY TABLE IF EXISTS TMP_CREATED_BOOKINGS;
        RESIGNAL;
    END;

    -- ─────────────────────────────────────────────────────────────
    -- 1. BASIC PARAMETER VALIDATION
    -- ─────────────────────────────────────────────────────────────
    IF PBOOKTYPECODE IS NULL OR PBOOKTYPECODE NOT IN ('PB', 'KS') THEN
        SET PBOOKTYPECODE = 'PB';
    END IF;

    IF PCUSTOMERID IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer ID is required';
    END IF;

    IF PBOOKINGSJSON IS NULL OR JSON_TYPE(PBOOKINGSJSON) <> 'ARRAY' OR JSON_LENGTH(PBOOKINGSJSON) = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'At least one day booking must be provided in PBOOKINGSJSON';
    END IF;

    -- Resolve and validate booking type
    SELECT BT.BOOKTYPEID, BT.STATUSID INTO VBOOKTYPEID, VBOOKTYPESTATUSID
    FROM CMS_BOOKTYPE BT WHERE BT.BOOKTYPECODE = PBOOKTYPECODE;

    IF VBOOKTYPEID IS NULL OR VBOOKTYPESTATUSID <> 10 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking type is invalid or inactive';
    END IF;

    -- Resolve and validate customer
    SELECT C.CTYPECODE, C.STATUSID INTO VCTYPECODE, VCUSTSTATUSID
    FROM CMS_CUSTOMER C WHERE C.CUSTOMERID = PCUSTOMERID;

    IF VCTYPECODE IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer not found';
    END IF;

    IF VCUSTSTATUSID <> 10 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Customer is not active';
    END IF;

    -- ─────────────────────────────────────────────────────────────
    -- 2. DUPLICATE CHECK WITHIN THE REQUEST PAYLOAD
    -- ─────────────────────────────────────────────────────────────
    SELECT COUNT(*) - COUNT(DISTINCT CONCAT(SERVICEDATE, '-', SERVICEID))
    INTO VDUPLICATE_SERVICES
    FROM JSON_TABLE(
        PBOOKINGSJSON,
        '$[*]' COLUMNS (
            SERVICEDATE DATE PATH '$.SERVICEDATE',
            SERVICEID   INT  PATH '$.SERVICEID'
        )
    ) AS JD;

    IF VDUPLICATE_SERVICES > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Duplicate (date, service) entry detected within the weekly booking request';
    END IF;

    -- ─────────────────────────────────────────────────────────────
    -- 3. EXISTING ACTIVE BOOKING CONFLICT CHECK
    -- ─────────────────────────────────────────────────────────────
    SELECT COUNT(*) INTO VEXISTING_COUNT
    FROM JSON_TABLE(
        PBOOKINGSJSON,
        '$[*]' COLUMNS (
            SERVICEDATE DATE PATH '$.SERVICEDATE',
            SERVICEID   INT  PATH '$.SERVICEID'
        )
    ) AS JD
    JOIN CMS_BOOKING B ON B.CUSTOMERID = PCUSTOMERID
                      AND B.SERVICEID  = JD.SERVICEID
                      AND B.SERVICEDATE = JD.SERVICEDATE
                      AND B.BOOKTYPEID = VBOOKTYPEID
    JOIN CMS_STATUS ST ON ST.STATUSID = B.STATUSID
    WHERE ST.STATUSCODE <> 'CAN';

    IF VEXISTING_COUNT > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'An active pre-booking already exists for one or more requested dates. Please review existing bookings.';
    END IF;

    -- ─────────────────────────────────────────────────────────────
    -- 4. ITEM INTEGRITY, CUTOFF, AND MAXQTY VALIDATION
    -- ─────────────────────────────────────────────────────────────
    SELECT COUNT(*) INTO VINVALID_COUNT
    FROM JSON_TABLE(
        PBOOKINGSJSON,
        '$[*]' COLUMNS (
            SERVICEDATE DATE PATH '$.SERVICEDATE',
            SERVICEID   INT  PATH '$.SERVICEID',
            NESTED PATH '$.ITEMS[*]' COLUMNS (
                DAYMENUID INT PATH '$.DAYMENUID',
                QTY       INT PATH '$.QTY'
            )
        )
    ) AS JT
    LEFT JOIN CMS_DAYMENU DM ON DM.DAYMENUID = JT.DAYMENUID
    LEFT JOIN CMS_DAYSLOT DS ON DS.DAYSLOTID = DM.DAYSLOTID
    LEFT JOIN CMS_MENUITEM MI ON MI.MENUITEMID = DM.MENUITEMID
    LEFT JOIN CMS_STATUS DS_AST ON DS_AST.STATUSID = DS.APPRSTATUSID
    LEFT JOIN CMS_STATUS DS_ST  ON DS_ST.STATUSID  = DS.STATUSID
    LEFT JOIN CMS_STATUS MI_ST  ON MI_ST.STATUSID  = MI.STATUSID
    WHERE JT.DAYMENUID IS NULL
       OR JT.QTY IS NULL OR JT.QTY < 1
       OR DM.DAYMENUID IS NULL
       OR DS_AST.STATUSCODE <> 'APR'
       OR DS.SERVICEID <> JT.SERVICEID
       OR DS.SERVDATE  <> JT.SERVICEDATE
       OR DS_ST.STATUSCODE  <> 'ACT'
       OR MI_ST.STATUSCODE  <> 'ACT'
       OR CURRENT_TIMESTAMP > DM.BOOKUNTIL
       OR (PBOOKTYPECODE = 'PB' AND (DM.ISPREBOOK <> 1 OR JT.QTY > DM.MAXQTY))
       OR (PBOOKTYPECODE = 'KS' AND DM.ISKIOSK <> 1);

    IF VINVALID_COUNT > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'One or more items are invalid, inactive, past cutoff time, or exceed allowable MAXQTY';
    END IF;

    -- ─────────────────────────────────────────────────────────────
    -- 5. COUNTER CAPACITY CHECK (AVAILQTY)
    -- ─────────────────────────────────────────────────────────────
    SELECT COUNT(*) INTO VCAPACITY_EXCEEDED
    FROM JSON_TABLE(
        PBOOKINGSJSON,
        '$[*]' COLUMNS (
            NESTED PATH '$.ITEMS[*]' COLUMNS (
                DAYMENUID INT PATH '$.DAYMENUID',
                QTY       INT PATH '$.QTY'
            )
        )
    ) AS JT
    JOIN CMS_DAYMENU DM ON DM.DAYMENUID = JT.DAYMENUID
    WHERE DM.AVAILQTY IS NOT NULL
      AND (
          SELECT COALESCE(SUM(BI.QTY), 0)
          FROM CMS_BOOKITEM BI
          JOIN CMS_BOOKING B ON B.BOOKID = BI.BOOKID
          JOIN CMS_STATUS B_ST ON B_ST.STATUSID = B.STATUSID
          WHERE BI.DAYMENUID = JT.DAYMENUID
            AND B_ST.STATUSCODE IN ('CRT', 'SRV', 'NOS')
      ) + JT.QTY > DM.AVAILQTY;

    IF VCAPACITY_EXCEEDED > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'One or more menu items have insufficient capacity available for booking';
    END IF;

    -- ─────────────────────────────────────────────────────────────
    -- 6. COMPUTE TOTAL CUMULATIVE WEEKLY AMOUNT
    -- ─────────────────────────────────────────────────────────────
    SELECT COALESCE(SUM(JT.QTY * COALESCE(
        (SELECT IPD.PRICE
         FROM CMS_ITEMPRICE IP
         JOIN CMS_STATUS IP_ST ON IP_ST.STATUSID = IP.STATUSID
         JOIN CMS_ITEMPRICEDT IPD ON IPD.ITEMPRICEID = IP.ITEMPRICEID
         WHERE IP.MENUITEMID = DM.MENUITEMID
           AND IP.EFFFROM <= JT.SERVICEDATE
           AND IP_ST.STATUSCODE = 'ACT'
           AND (IPD.CTYPECODE = VCTYPECODE OR IPD.CTYPECODE = 'VIS')
         ORDER BY IP.EFFFROM DESC,
                  CASE WHEN IPD.CTYPECODE = VCTYPECODE THEN 1 ELSE 2 END
         LIMIT 1),
        0.00)), 0.00)
    INTO VTOTAL_WEEK_AMOUNT
    FROM JSON_TABLE(
        PBOOKINGSJSON,
        '$[*]' COLUMNS (
            SERVICEDATE DATE PATH '$.SERVICEDATE',
            NESTED PATH '$.ITEMS[*]' COLUMNS (
                DAYMENUID INT PATH '$.DAYMENUID',
                QTY       INT PATH '$.QTY'
            )
        )
    ) AS JT
    JOIN CMS_DAYMENU DM ON DM.DAYMENUID = JT.DAYMENUID;

    -- ─────────────────────────────────────────────────────────────
    -- 7. TRANSACTION & WALLET PRE-CHECK (CONTRACTORS / VISITORS)
    -- ─────────────────────────────────────────────────────────────
    START TRANSACTION;

    IF VCTYPECODE IN ('CNT', 'CONTEMP', 'VIS', 'VISITOR') THEN
        SELECT W.WALLETID, W.BALANCE, W.RESERVEDAMT
        INTO VWALLETID, VWALLETBALANCE, VWALLETRESERVED
        FROM CMS_WALLET W
        JOIN CMS_STATUS W_ST ON W_ST.STATUSID = W.STATUSID
        WHERE W.CUSTOMERID = PCUSTOMERID AND W_ST.STATUSCODE = 'ACT'
        FOR UPDATE;

        IF VWALLETID IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Active wallet not found for contract employee / visitor';
        END IF;

        IF VTOTAL_WEEK_AMOUNT > (VWALLETBALANCE - VWALLETRESERVED) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient available wallet balance to cover the 5-day booking total';
        END IF;

        -- Deduct total cumulative amount from wallet upfront
        UPDATE CMS_WALLET
        SET BALANCE = BALANCE - VTOTAL_WEEK_AMOUNT
        WHERE WALLETID = VWALLETID;

        SET VRUNNING_BAL = VWALLETBALANCE;
    END IF;

    -- Temporary table to collect created booking IDs for output
    CREATE TEMPORARY TABLE IF NOT EXISTS TMP_CREATED_BOOKINGS (
        BOOKID INT PRIMARY KEY
    );
    TRUNCATE TABLE TMP_CREATED_BOOKINGS;

    -- ─────────────────────────────────────────────────────────────
    -- 8. LOOP THROUGH EACH DAY TO CREATE BOOKINGS AND ITEMS
    -- ─────────────────────────────────────────────────────────────
    SET VNUMDAYS = JSON_LENGTH(PBOOKINGSJSON);
    SET VI = 0;

    WHILE VI < VNUMDAYS DO
        SET VDAYJSON     = JSON_EXTRACT(PBOOKINGSJSON, CONCAT('$[', VI, ']'));
        SET VSERVICEDATE = JSON_UNQUOTE(JSON_EXTRACT(VDAYJSON, '$.SERVICEDATE'));
        SET VSERVICEID   = CAST(JSON_EXTRACT(VDAYJSON, '$.SERVICEID') AS UNSIGNED);
        SET VITEMSJSON   = JSON_EXTRACT(VDAYJSON, '$.ITEMS');

        -- Resolve service code prefix (e.g. 'LU', 'BR')
        SELECT UPPER(LEFT(S.SERVCODE, 2)) INTO VSERVPFX
        FROM CMS_SERVICE S WHERE S.SERVICEID = VSERVICEID;

        IF VSERVPFX IS NULL THEN
            SET VSERVPFX = 'ME';
        END IF;

        -- Generate sequential booking number per service
        INSERT INTO CMS_BOOKCTR (BOOKTYPEID, SERVICEID, LASTNO)
        VALUES (VBOOKTYPEID, VSERVICEID, 0)
        ON DUPLICATE KEY UPDATE LASTNO = LASTNO;

        SELECT LASTNO INTO VLASTNO
        FROM CMS_BOOKCTR
        WHERE BOOKTYPEID = VBOOKTYPEID AND SERVICEID = VSERVICEID
        FOR UPDATE;

        SET VBOOKSEQ = VLASTNO + 1;

        UPDATE CMS_BOOKCTR SET LASTNO = VBOOKSEQ
        WHERE BOOKTYPEID = VBOOKTYPEID AND SERVICEID = VSERVICEID;

        SET VBOOKNO = CONCAT(PBOOKTYPECODE, '-', VSERVPFX, LPAD(VBOOKSEQ, 3, '0'));

        -- Calculate total items, total quantity, and amount for this specific day
        SELECT 
            COUNT(*),
            COALESCE(SUM(JT.QTY), 0),
            COALESCE(SUM(JT.QTY * COALESCE(
                (SELECT IPD.PRICE
                 FROM CMS_ITEMPRICE IP
                 JOIN CMS_STATUS IP_ST ON IP_ST.STATUSID = IP.STATUSID
                 JOIN CMS_ITEMPRICEDT IPD ON IPD.ITEMPRICEID = IP.ITEMPRICEID
                 WHERE IP.MENUITEMID = DM.MENUITEMID
                   AND IP.EFFFROM <= VSERVICEDATE
                   AND IP_ST.STATUSCODE = 'ACT'
                   AND (IPD.CTYPECODE = VCTYPECODE OR IPD.CTYPECODE = 'VIS')
                 ORDER BY IP.EFFFROM DESC,
                          CASE WHEN IPD.CTYPECODE = VCTYPECODE THEN 1 ELSE 2 END
                 LIMIT 1),
                0.00)), 0.00)
        INTO VDAYITEMS, VDAYQTY, VDAYAMOUNT
        FROM JSON_TABLE(VITEMSJSON, '$[*]' COLUMNS (
            DAYMENUID INT PATH '$.DAYMENUID',
            QTY       INT PATH '$.QTY'
        )) AS JT
        JOIN CMS_DAYMENU DM ON DM.DAYMENUID = JT.DAYMENUID;

        -- Insert Booking Header (30 = 'CRT' Created)
        INSERT INTO CMS_BOOKING (
            BOOKNO, BOOKTYPEID, CUSTOMERID, SERVICEID, SERVICEDATE, STATUSID,
            BOOKSEQNO, TOTALITEMS, TOTALQTY, TOTALAMOUNT,
            BOOKEDBY, BOOKEDON, REMARKS, CREATEDBY
        )
        VALUES (
            VBOOKNO, VBOOKTYPEID, PCUSTOMERID, VSERVICEID, VSERVICEDATE, 30,
            VBOOKSEQ, VDAYITEMS, VDAYQTY, VDAYAMOUNT,
            PBOOKEDBY, CURRENT_TIMESTAMP, PREMARKS, PBOOKEDBY
        );

        SET VBOOKID = LAST_INSERT_ID();
        INSERT INTO TMP_CREATED_BOOKINGS (BOOKID) VALUES (VBOOKID);

        -- Insert Booking Items
        INSERT INTO CMS_BOOKITEM (BOOKID, DAYMENUID, MENUITEMID, QTY, RATE, AMOUNT, STATUSID)
        SELECT
            VBOOKID,
            DM.DAYMENUID,
            DM.MENUITEMID,
            JT.QTY,
            COALESCE(
                (SELECT IPD.PRICE
                 FROM CMS_ITEMPRICE IP
                 JOIN CMS_STATUS IP_ST ON IP_ST.STATUSID = IP.STATUSID
                 JOIN CMS_ITEMPRICEDT IPD ON IPD.ITEMPRICEID = IP.ITEMPRICEID
                 WHERE IP.MENUITEMID = DM.MENUITEMID
                   AND IP.EFFFROM <= VSERVICEDATE
                   AND IP_ST.STATUSCODE = 'ACT'
                   AND (IPD.CTYPECODE = VCTYPECODE OR IPD.CTYPECODE = 'VIS')
                 ORDER BY IP.EFFFROM DESC,
                          CASE WHEN IPD.CTYPECODE = VCTYPECODE THEN 1 ELSE 2 END
                 LIMIT 1),
                0.00),
            JT.QTY * COALESCE(
                (SELECT IPD.PRICE
                 FROM CMS_ITEMPRICE IP
                 JOIN CMS_STATUS IP_ST ON IP_ST.STATUSID = IP.STATUSID
                 JOIN CMS_ITEMPRICEDT IPD ON IPD.ITEMPRICEID = IP.ITEMPRICEID
                 WHERE IP.MENUITEMID = DM.MENUITEMID
                   AND IP.EFFFROM <= VSERVICEDATE
                   AND IP_ST.STATUSCODE = 'ACT'
                   AND (IPD.CTYPECODE = VCTYPECODE OR IPD.CTYPECODE = 'VIS')
                 ORDER BY IP.EFFFROM DESC,
                          CASE WHEN IPD.CTYPECODE = VCTYPECODE THEN 1 ELSE 2 END
                 LIMIT 1),
                0.00),
            30
        FROM JSON_TABLE(VITEMSJSON, '$[*]' COLUMNS (
            DAYMENUID INT PATH '$.DAYMENUID',
            QTY       INT PATH '$.QTY'
        )) AS JT
        JOIN CMS_DAYMENU DM ON DM.DAYMENUID = JT.DAYMENUID;

        -- Fast pre-booking active lookup table
        IF PBOOKTYPECODE = 'PB' THEN
            INSERT INTO CMS_PBACTIVE (CUSTOMERID, SERVICEID, SERVICEDATE, BOOKID)
            VALUES (PCUSTOMERID, VSERVICEID, VSERVICEDATE, VBOOKID);
        END IF;

        -- For contract employees / visitors: Record wallet transaction per booking
        IF VCTYPECODE IN ('CNT', 'CONTEMP', 'VIS', 'VISITOR') AND VDAYAMOUNT > 0 THEN
            CALL CMSGENAUTO('CMS_WALLETTRAN', 'REFNO', VAUTOREFNO);

            -- 44 = DBT (Debit)
            INSERT INTO CMS_WALLETTRAN
            (
                WALLETID, BOOKINGID, TRANSTYPE, SOURCECODE, AMOUNT,
                BALBEFORE, BALAFTER, PAYMENTMETHOD, REFNO, STATUSID, CREATEDBY, REMARKS
            )
            VALUES
            (
                VWALLETID, VBOOKID, 'DEBIT', 'BOOKING', VDAYAMOUNT,
                VRUNNING_BAL, VRUNNING_BAL - VDAYAMOUNT, 'WALLET', VAUTOREFNO, 44, PBOOKEDBY,
                CONCAT('Weekly Pass Pre-booking #', VBOOKNO)
            );

            SET VRUNNING_BAL = VRUNNING_BAL - VDAYAMOUNT;
        END IF;

        SET VI = VI + 1;
    END WHILE;

    COMMIT;

    -- ─────────────────────────────────────────────────────────────
    -- 9. RETURN CREATED BOOKINGS SUMMARY TO CALLER
    -- ─────────────────────────────────────────────────────────────
    SELECT 
        B.BOOKID,
        B.BOOKNO,
        B.SERVICEID,
        S.SERVNAME,
        B.SERVICEDATE,
        B.TOTALITEMS,
        B.TOTALQTY,
        B.TOTALAMOUNT,
        ST.STATUSNAME AS STATUS
    FROM CMS_BOOKING B
    JOIN CMS_SERVICE S  ON S.SERVICEID = B.SERVICEID
    JOIN CMS_STATUS  ST ON ST.STATUSID = B.STATUSID
    JOIN TMP_CREATED_BOOKINGS T ON T.BOOKID = B.BOOKID
    ORDER BY B.SERVICEDATE, S.SERVNAME;

    DROP TEMPORARY TABLE IF EXISTS TMP_CREATED_BOOKINGS;

END$$

DELIMITER ;
