USE cms_db;

DROP PROCEDURE IF EXISTS CMSBULKBOOK;

DELIMITER $$

-- ============================================================
-- CMSBULKBOOK
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
    DECLARE VCUSTSTATUSID INT DEFAULT NULL;
    DECLARE VSERVSTATUSID INT DEFAULT NULL;
    DECLARE VSERVCODE     VARCHAR(20) DEFAULT NULL;
    DECLARE VSERVPFX      VARCHAR(5)  DEFAULT NULL;
    DECLARE VBOOKID       INT DEFAULT NULL;
    DECLARE VBOOKNO       VARCHAR(30) DEFAULT NULL;
    DECLARE VAUTOREFNO    VARCHAR(30) DEFAULT NULL;
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
    SELECT STATUSID INTO VCRSTATUSID FROM CMS_STATUS WHERE STATUSCODE = 'CRT' AND STATUSGRP = 'BOOKING';
    SELECT STATUSID INTO VCANSTATUSID FROM CMS_STATUS WHERE STATUSCODE = 'CAN' AND STATUSGRP = 'BOOKING';

    -- Temporary table to accumulate per-date results
    DROP TEMPORARY TABLE IF EXISTS TMP_BULKRESULT;
    CREATE TEMPORARY TABLE TMP_BULKRESULT (
        SERVICEDATE DATE        NOT NULL,
        RESULT      VARCHAR(10) NOT NULL,
        BOOKID      INT         NULL,
        BOOKNO      VARCHAR(30) NULL,
        SKIPREASON  VARCHAR(255) NULL
    ) ENGINE = MEMORY;

    -- Global input validation
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

    -- Per-day loop
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

                -- Wallet debit for wallet-based customer types
                IF VCTYPECODE IN ('CNT', 'VIS', 'CONT', 'CONTEMP', 'VISITOR') THEN
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
                    SET    BALANCE = BALANCE - VTOTALAMOUNT
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

                IF VCTYPECODE IN ('CNT', 'VIS', 'CONT', 'CONTEMP', 'VISITOR') THEN
                    CALL CMSGENAUTO('CMS_WALLETTRAN', 'REFNO', VAUTOREFNO);

                    INSERT INTO CMS_WALLETTRAN
                    (
                        WALLETID,
                        BOOKINGID,
                        TRANSTYPE,
                        SOURCECODE,
                        AMOUNT,
                        BALBEFORE,
                        BALAFTER,
                        PAYMENTMETHOD,
                        REFNO,
                        STATUSID,
                        CREATEDBY,
                        REMARKS
                    )
                    VALUES
                    (
                        VWALLETID,
                        VBOOKID,
                        'DEBIT',
                        'BOOKING',
                        VTOTALAMOUNT,
                        VWALLETBAL,
                        VWALLETBAL - VTOTALAMOUNT,
                        'WALLET',
                        VAUTOREFNO,
                        44,
                        PBOOKEDBY,
                        CONCAT('Bulk pre-booking #', VBOOKNO)
                    );
                END IF;

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

    -- Result Set 1: Summary
    SELECT
        PDAYCOUNT        AS TOTALATTEMPTED,
        VBOOKED          AS TOTALBOOKED,
        VSKIPPED         AS TOTALSKIPPED;

    -- Result Set 2: Per-date detail
    SELECT SERVICEDATE, RESULT, BOOKID, BOOKNO, SKIPREASON
    FROM   TMP_BULKRESULT
    ORDER BY SERVICEDATE;

    DROP TEMPORARY TABLE IF EXISTS TMP_BULKRESULT;

END$$

DELIMITER ;
