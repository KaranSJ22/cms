USE cms_db;

DROP PROCEDURE IF EXISTS CMSGENAUTO;

DELIMITER $$


CREATE PROCEDURE CMSGENAUTO (
    IN  PTBLNAME   VARCHAR(50),
    IN  PDATAITEM  VARCHAR(30),
    OUT PNEWNO     VARCHAR(50)
)
BEGIN
    DECLARE VPREFIXCHAR  VARCHAR(5);
    DECLARE VITEMLEN     INT;
    DECLARE VLASTNO      BIGINT;
    DECLARE VLASTGENDATE DATE;
    DECLARE VDATESTR     VARCHAR(8);
    DECLARE VNUMSTR      VARCHAR(20);
    DECLARE VCOUNT       INT DEFAULT 0;

    -- 1. Validate configuration exists
    SELECT COUNT(*) INTO VCOUNT
    FROM   CMS_AUTONOS
    WHERE  TBLNAME  = PTBLNAME
      AND  DATAITEM = PDATAITEM;

    IF VCOUNT = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Auto-number configuration not found for the requested table and column.';
    END IF;

    -- 2. Lock the row for concurrency (prevents race conditions)
    SELECT PREFIXCHAR, ITEMLEN, LASTNO, LASTGENDATE
    INTO   VPREFIXCHAR, VITEMLEN, VLASTNO, VLASTGENDATE
    FROM   CMS_AUTONOS
    WHERE  TBLNAME  = PTBLNAME
      AND  DATAITEM = PDATAITEM
    FOR UPDATE;

    -- 3. Check Daily Reset Logic
    IF VLASTGENDATE IS NULL OR VLASTGENDATE < CURRENT_DATE THEN
        SET VLASTNO = 1; -- Reset counter for a new day
    ELSE
        SET VLASTNO = VLASTNO + 1; -- Continue counter for today
    END IF;

    -- 4. Get exact date (e.g., '20260822')
    SET VDATESTR = DATE_FORMAT(CURRENT_DATE, '%Y%m%d');

    -- 5. Calculate remaining length and pad (Total Length - Prefix Length - Date Length)
    SET VNUMSTR = LPAD(VLASTNO, VITEMLEN - LENGTH(VPREFIXCHAR) - 8, '0');

    -- 6. Construct the final ID (e.g., 'SLT' + '20260822' + '0001')
    SET PNEWNO = CONCAT(VPREFIXCHAR, VDATESTR, VNUMSTR);

    -- 7. Update the configuration table
    UPDATE CMS_AUTONOS
    SET    LASTNO      = VLASTNO,
           LASTGENDATE = CURRENT_DATE,
           UPDATEDAT   = CURRENT_TIMESTAMP
    WHERE  TBLNAME     = PTBLNAME
      AND  DATAITEM    = PDATAITEM;

END$$

DELIMITER ;
