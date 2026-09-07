/* ============================================================
   ISRO CANTEEN MANAGEMENT SYSTEM (CMS)
   MODULE: WALLET (Refactored for CMS_STATUS & CMS_AUTONOS)
   ============================================================ */

USE cms_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP PROCEDURE IF EXISTS CMSAPPWALLETWD;
DROP PROCEDURE IF EXISTS CMSREJWALLETWD;
DROP PROCEDURE IF EXISTS CMSREQWALLETWD;
DROP PROCEDURE IF EXISTS CMSLISTWALLETTRAN;
DROP PROCEDURE IF EXISTS CMSLISTWALLETWD;
DROP PROCEDURE IF EXISTS CMSGETWALLET;
DROP PROCEDURE IF EXISTS CMSADDWALLETAMT;
DROP PROCEDURE IF EXISTS CMSADDWALLET;

SET FOREIGN_KEY_CHECKS = 1;

DELIMITER $$

/* ============================================================
   PROCEDURE: CMSADDWALLET
   ------------------------------------------------------------
   Creates a wallet and records the opening credit[cite: 3].
   ============================================================ */
CREATE PROCEDURE CMSADDWALLET
(
    IN PCUSTOMERID INT,
    IN POPENAMOUNT DECIMAL(12,2),
    IN PCREATEDBY INT,
    IN PREMARKS VARCHAR(500)
)
BEGIN
    DECLARE VWALLETID INT DEFAULT NULL;
    DECLARE VMINOPENING DECIMAL(12,2) DEFAULT 100.00;
    DECLARE VTYPECODE VARCHAR(30);
    DECLARE VREFNO VARCHAR(80);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    IF POPENAMOUNT < 0.00 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Initial wallet amount cannot be negative';
    END IF;

    IF POPENAMOUNT > 0.00 AND POPENAMOUNT < VMINOPENING THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Initial wallet deposit must be at least 100.00 if depositing opening cash';
    END IF;

    SELECT C.CTYPECODE
      INTO VTYPECODE
      FROM CMS_CUSTOMER C
     WHERE C.CUSTOMERID = PCUSTOMERID;

    IF VTYPECODE IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Customer does not exist';
    END IF;

    IF VTYPECODE NOT IN ('CNT', 'VIS') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Wallets are only allowed for Contract Employees and Visitors';
    END IF;

    IF EXISTS
    (
        SELECT 1
          FROM CMS_WALLET W
         WHERE W.CUSTOMERID = PCUSTOMERID
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Customer already has a wallet';
    END IF;

    -- 10 = 'ACT' (Active)
    INSERT INTO CMS_WALLET
    (
        CUSTOMERID,
        BALANCE,
        RESERVEDAMT,
        STATUSID
    )
    VALUES
    (
        PCUSTOMERID,
        POPENAMOUNT,
        0.00,
        10
    );

    SET VWALLETID = LAST_INSERT_ID();

    -- Only record credit transaction if opening deposit > 0
    IF POPENAMOUNT > 0.00 THEN
        -- Generate reference number using CMSGENAUTO (Prefix: TXN)
        CALL CMSGENAUTO('CMS_WALLETTRAN', 'REFNO', VREFNO);

        -- 40 = 'DEP' / Credit transaction state
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
            NULL,
            'CREDIT',
            'OPENING',
            POPENAMOUNT,
            0.00,
            POPENAMOUNT,
            'CASH',
            VREFNO,
            40,
            PCREATEDBY,
            PREMARKS
        );
    END IF;

    COMMIT;

    SELECT
        W.WALLETID,
        W.CUSTOMERID,
        W.BALANCE,
        W.RESERVEDAMT,
        (W.BALANCE - W.RESERVEDAMT) AS AVAILABLEBALANCE,
        W.STATUSID,
        ST.STATUSCODE AS STATUSCODE,
        W.CREATEDAT,
        W.UPDATEDAT
    FROM CMS_WALLET W
    JOIN CMS_STATUS ST ON ST.STATUSID = W.STATUSID
    WHERE W.WALLETID = VWALLETID;
END$$


/* ============================================================
   PROCEDURE: CMSADDWALLETAMT
   ------------------------------------------------------------
   Adds money to an existing wallet[cite: 3].
   ============================================================ */
CREATE PROCEDURE CMSADDWALLETAMT
(
    IN PCUSTOMERID INT,
    IN PAMOUNT DECIMAL(12,2),
    IN PPAYMENTMETHOD VARCHAR(20),
    IN PREFNO VARCHAR(80),
    IN PCREATEDBY INT,
    IN PREMARKS VARCHAR(500)
)
BEGIN
    DECLARE VWALLETID INT;
    DECLARE VBALANCE DECIMAL(12,2);
    DECLARE VNEWBALANCE DECIMAL(12,2);
    DECLARE VSTATUSCODE VARCHAR(20);
    DECLARE VAUTOREFNO VARCHAR(80);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF PAMOUNT < 100.00 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Top-up amount must be at least 100.00';
    END IF;

    IF PPAYMENTMETHOD IS NULL OR PPAYMENTMETHOD = '' THEN
        SET PPAYMENTMETHOD = 'CASH';
    END IF;

    IF PPAYMENTMETHOD <> 'CASH' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Only CASH payment method is enabled in the MVP';
    END IF;

    START TRANSACTION;

    SELECT
        W.WALLETID,
        W.BALANCE,
        ST.STATUSCODE
    INTO
        VWALLETID,
        VBALANCE,
        VSTATUSCODE
    FROM CMS_WALLET W
    JOIN CMS_STATUS ST ON ST.STATUSID = W.STATUSID
    WHERE W.CUSTOMERID = PCUSTOMERID
    FOR UPDATE;

    IF VWALLETID IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Wallet does not exist';
    END IF;

    IF VSTATUSCODE <> 'ACT' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Wallet is not active';
    END IF;

    SET VNEWBALANCE = VBALANCE + PAMOUNT;

    UPDATE CMS_WALLET
       SET BALANCE = VNEWBALANCE
     WHERE WALLETID = VWALLETID;

    IF PREFNO IS NULL THEN
        CALL CMSGENAUTO('CMS_WALLETTRAN', 'REFNO', VAUTOREFNO);
    ELSE
        SET VAUTOREFNO = PREFNO;
    END IF;

    -- 40 = 'DEP'
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
        NULL,
        'CREDIT',
        'TOPUP',
        PAMOUNT,
        VBALANCE,
        VNEWBALANCE,
        PPAYMENTMETHOD,
        VAUTOREFNO,
        40,
        PCREATEDBY,
        PREMARKS
    );

    COMMIT;

    SELECT
        W.WALLETID,
        W.CUSTOMERID,
        W.BALANCE,
        W.RESERVEDAMT,
        (W.BALANCE - W.RESERVEDAMT) AS AVAILABLEBALANCE,
        W.STATUSID,
        ST.STATUSCODE AS STATUSCODE
    FROM CMS_WALLET W
    JOIN CMS_STATUS ST ON ST.STATUSID = W.STATUSID
    WHERE W.WALLETID = VWALLETID;
END$$


/* ============================================================
   PROCEDURE: CMSGETWALLET
   ============================================================ */
CREATE PROCEDURE CMSGETWALLET
(
    IN PCUSTOMERID INT
)
BEGIN
    SELECT
        W.WALLETID,
        W.CUSTOMERID,
        W.BALANCE,
        W.RESERVEDAMT,
        (W.BALANCE - W.RESERVEDAMT) AS AVAILABLEBALANCE,
        W.STATUSID,
        ST.STATUSCODE AS STATUSCODE,
        W.CREATEDAT,
        W.UPDATEDAT
    FROM CMS_WALLET W
    JOIN CMS_STATUS ST ON ST.STATUSID = W.STATUSID
    WHERE W.CUSTOMERID = PCUSTOMERID;
END$$


/* ============================================================
   PROCEDURE: CMSLISTWALLETTRAN
   ------------------------------------------------------------
   Returns wallet statement with optional booking information[cite: 3].
   ============================================================ */
CREATE PROCEDURE CMSLISTWALLETTRAN
(
    IN PCUSTOMERID INT,
    IN PFROMDATE DATE,
    IN PTODATE DATE
)
BEGIN
    SELECT
        WT.WALLETTRANID,
        WT.WALLETID,
        WT.BOOKINGID,
        WT.TRANSTYPE,
        WT.SOURCECODE,
        WT.AMOUNT,
        WT.BALBEFORE,
        WT.BALAFTER,
        WT.PAYMENTMETHOD,
        WT.REFNO,
        WT.STATUSID,
        ST.STATUSCODE AS STATUSCODE,
        WT.CREATEDBY,
        WT.CREATEDAT,
        WT.REMARKS,

        B.SERVICEDATE,
        B_ST.STATUSCODE AS BOOKINGSTATUSCODE

    FROM CMS_WALLETTRAN WT
    JOIN CMS_WALLET W
      ON W.WALLETID = WT.WALLETID
    JOIN CMS_STATUS ST
      ON ST.STATUSID = WT.STATUSID

    LEFT JOIN CMS_BOOKING B
      ON B.BOOKID = WT.BOOKINGID
    LEFT JOIN CMS_STATUS B_ST
      ON B_ST.STATUSID = B.STATUSID

    WHERE W.CUSTOMERID = PCUSTOMERID
      AND (PFROMDATE IS NULL OR DATE(WT.CREATEDAT) >= PFROMDATE)
      AND (PTODATE IS NULL OR DATE(WT.CREATEDAT) <= PTODATE)

    ORDER BY WT.CREATEDAT, WT.WALLETTRANID;
END$$


/* ============================================================
   PROCEDURE: CMSREQWALLETWD
   ------------------------------------------------------------
   Creates a withdrawal request and reserves the requested amount[cite: 3].
   ============================================================ */
CREATE PROCEDURE CMSREQWALLETWD
(
    IN PCUSTOMERID INT,
    IN PAMOUNT DECIMAL(12,2),
    IN PREQUESTEDBY INT,
    IN PREMARKS VARCHAR(500)
)
BEGIN
    DECLARE VWALLETID INT;
    DECLARE VBALANCE DECIMAL(12,2);
    DECLARE VRESERVED DECIMAL(12,2);
    DECLARE VSTATUSCODE VARCHAR(20);
    DECLARE VWALLETWDID INT;
    DECLARE VWDSTATUSID INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF PAMOUNT <= 0.00 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Withdrawal amount must be greater than zero';
    END IF;

    SELECT STATUSID INTO VWDSTATUSID 
    FROM CMS_STATUS 
    WHERE STATUSCODE = 'REQ' AND STATUSGRP = 'WITHDRAW_REQ' 
    LIMIT 1;

    IF VWDSTATUSID IS NULL THEN
        SELECT STATUSID INTO VWDSTATUSID FROM CMS_STATUS WHERE STATUSCODE = 'REQ' LIMIT 1;
    END IF;
    IF VWDSTATUSID IS NULL THEN
        SET VWDSTATUSID = 50;
    END IF;

    START TRANSACTION;

    SELECT
        W.WALLETID,
        W.BALANCE,
        W.RESERVEDAMT,
        ST.STATUSCODE
    INTO
        VWALLETID,
        VBALANCE,
        VRESERVED,
        VSTATUSCODE
    FROM CMS_WALLET W
    JOIN CMS_STATUS ST ON ST.STATUSID = W.STATUSID
    WHERE W.CUSTOMERID = PCUSTOMERID
    FOR UPDATE;

    IF VWALLETID IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Wallet does not exist';
    END IF;

    IF VSTATUSCODE <> 'ACT' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Wallet is not active';
    END IF;

    IF PAMOUNT > (VBALANCE - VRESERVED) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Insufficient available wallet balance';
    END IF;

    UPDATE CMS_WALLET
       SET RESERVEDAMT = RESERVEDAMT + PAMOUNT
     WHERE WALLETID = VWALLETID;

    INSERT INTO CMS_WALLETWD
    (
        WALLETID,
        AMOUNT,
        STATUSID,
        REQUESTEDBY,
        REMARKS
    )
    VALUES
    (
        VWALLETID,
        PAMOUNT,
        VWDSTATUSID,
        PREQUESTEDBY,
        PREMARKS
    );

    SET VWALLETWDID = LAST_INSERT_ID();

    COMMIT;

    SELECT
        WD.WALLETWDID,
        WD.WALLETID,
        WD.AMOUNT,
        WD.STATUSID,
        ST.STATUSCODE AS STATUSCODE,
        WD.REQUESTEDBY,
        WD.REQUESTEDAT
    FROM CMS_WALLETWD WD
    JOIN CMS_STATUS ST ON ST.STATUSID = WD.STATUSID
    WHERE WD.WALLETWDID = VWALLETWDID;
END$$


/* ============================================================
   PROCEDURE: CMSAPPWALLETWD
   ------------------------------------------------------------
   Completes a pending withdrawal[cite: 3].
   ============================================================ */
CREATE PROCEDURE CMSAPPWALLETWD
(
    IN PWALLETWDID INT,
    IN PPROCESSEDBY INT,
    IN PPAYMENTMETHOD VARCHAR(20),
    IN PREFNO VARCHAR(80),
    IN PREMARKS VARCHAR(500)
)
BEGIN
    DECLARE VWALLETID INT;
    DECLARE VWITHDRAWALAMOUNT DECIMAL(12,2);
    DECLARE VBALANCE DECIMAL(12,2);
    DECLARE VRESERVED DECIMAL(12,2);
    DECLARE VNEWBALANCE DECIMAL(12,2);
    DECLARE VSTATUSCODE VARCHAR(20);
    DECLARE VAUTOREFNO VARCHAR(80);
    DECLARE VCOMSTATUSID INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF PPAYMENTMETHOD <> 'CASH' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Only CASH withdrawal is enabled in the MVP';
    END IF;

    SELECT STATUSID INTO VCOMSTATUSID 
    FROM CMS_STATUS 
    WHERE STATUSCODE = 'COM' AND STATUSGRP = 'WITHDRAW_REQ' 
    LIMIT 1;

    IF VCOMSTATUSID IS NULL THEN
        SELECT STATUSID INTO VCOMSTATUSID FROM CMS_STATUS WHERE STATUSCODE = 'COM' LIMIT 1;
    END IF;
    IF VCOMSTATUSID IS NULL THEN
        SET VCOMSTATUSID = 51;
    END IF;

    START TRANSACTION;

    SELECT
        WD.WALLETID,
        WD.AMOUNT,
        ST.STATUSCODE
    INTO
        VWALLETID,
        VWITHDRAWALAMOUNT,
        VSTATUSCODE
    FROM CMS_WALLETWD WD
    JOIN CMS_STATUS ST ON ST.STATUSID = WD.STATUSID
    WHERE WD.WALLETWDID = PWALLETWDID
    FOR UPDATE;

    IF VWALLETID IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Withdrawal request does not exist';
    END IF;

    -- 50 = 'REQ'
    IF VSTATUSCODE <> 'REQ' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Only requested withdrawals can be completed';
    END IF;

    SELECT
        W.BALANCE,
        W.RESERVEDAMT
    INTO
        VBALANCE,
        VRESERVED
    FROM CMS_WALLET W
    WHERE W.WALLETID = VWALLETID
    FOR UPDATE;

    IF VRESERVED < VWITHDRAWALAMOUNT THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Wallet reservation is inconsistent';
    END IF;

    SET VNEWBALANCE = VBALANCE - VWITHDRAWALAMOUNT;

    IF VNEWBALANCE < 0.00 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Wallet balance cannot become negative';
    END IF;

    UPDATE CMS_WALLET
       SET BALANCE = VNEWBALANCE,
           RESERVEDAMT = RESERVEDAMT - VWITHDRAWALAMOUNT
     WHERE WALLETID = VWALLETID;

    IF PREFNO IS NULL THEN
        CALL CMSGENAUTO('CMS_WALLETTRAN', 'REFNO', VAUTOREFNO);
    ELSE
        SET VAUTOREFNO = PREFNO;
    END IF;

    -- 41 = 'WTH' (Withdrawal transaction state)
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
        NULL,
        'WITHDRAWAL',
        'WITHDRAWAL',
        VWITHDRAWALAMOUNT,
        VBALANCE,
        VNEWBALANCE,
        PPAYMENTMETHOD,
        VAUTOREFNO,
        41,
        PPROCESSEDBY,
        PREMARKS
    );

    -- Update withdrawal request status to completed
    UPDATE CMS_WALLETWD
       SET STATUSID = VCOMSTATUSID,
           PROCESSEDBY = PPROCESSEDBY,
           PROCESSEDAT = CURRENT_TIMESTAMP,
           PAYMENTMETHOD = PPAYMENTMETHOD,
           REFNO = VAUTOREFNO,
           REMARKS = COALESCE(PREMARKS, REMARKS)
     WHERE WALLETWDID = PWALLETWDID;

    COMMIT;

    SELECT
        WD.WALLETWDID,
        WD.WALLETID,
        WD.AMOUNT,
        WD.STATUSID,
        ST.STATUSCODE AS STATUSCODE,
        WD.PROCESSEDBY,
        WD.PROCESSEDAT
    FROM CMS_WALLETWD WD
    JOIN CMS_STATUS ST ON ST.STATUSID = WD.STATUSID
    WHERE WD.WALLETWDID = PWALLETWDID;
END$$


/* ============================================================
   PROCEDURE: CMSREJWALLETWD
   ------------------------------------------------------------
   Rejects a pending withdrawal and releases its reservation[cite: 3].
   ============================================================ */
CREATE PROCEDURE CMSREJWALLETWD
(
    IN PWALLETWDID INT,
    IN PPROCESSEDBY INT,
    IN PREMARKS VARCHAR(500)
)
BEGIN
    DECLARE VWALLETID INT;
    DECLARE VWITHDRAWALAMOUNT DECIMAL(12,2);
    DECLARE VSTATUSCODE VARCHAR(20);
    DECLARE VRESERVED DECIMAL(12,2);
    DECLARE VREJSTATUSID INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SELECT STATUSID INTO VREJSTATUSID 
    FROM CMS_STATUS 
    WHERE STATUSCODE = 'REJ' AND STATUSGRP = 'WITHDRAW_REQ' 
    LIMIT 1;

    IF VREJSTATUSID IS NULL THEN
        SELECT STATUSID INTO VREJSTATUSID FROM CMS_STATUS WHERE STATUSCODE = 'REJ' LIMIT 1;
    END IF;
    IF VREJSTATUSID IS NULL THEN
        SET VREJSTATUSID = 52;
    END IF;

    START TRANSACTION;

    SELECT
        WD.WALLETID,
        WD.AMOUNT,
        ST.STATUSCODE
    INTO
        VWALLETID,
        VWITHDRAWALAMOUNT,
        VSTATUSCODE
    FROM CMS_WALLETWD WD
    JOIN CMS_STATUS ST ON ST.STATUSID = WD.STATUSID
    WHERE WD.WALLETWDID = PWALLETWDID
    FOR UPDATE;

    IF VWALLETID IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Withdrawal request does not exist';
    END IF;

    IF VSTATUSCODE <> 'REQ' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Only requested withdrawals can be rejected';
    END IF;

    SELECT RESERVEDAMT
      INTO VRESERVED
      FROM CMS_WALLET
     WHERE WALLETID = VWALLETID
     FOR UPDATE;

    IF VRESERVED < VWITHDRAWALAMOUNT THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Wallet reservation is inconsistent';
    END IF;

    UPDATE CMS_WALLET
       SET RESERVEDAMT = RESERVEDAMT - VWITHDRAWALAMOUNT
     WHERE WALLETID = VWALLETID;

    -- Update withdrawal status to Rejected
    UPDATE CMS_WALLETWD
       SET STATUSID = VREJSTATUSID,
           PROCESSEDBY = PPROCESSEDBY,
           PROCESSEDAT = CURRENT_TIMESTAMP,
           REMARKS = PREMARKS
     WHERE WALLETWDID = PWALLETWDID;

    COMMIT;

    SELECT
        WD.WALLETWDID,
        WD.WALLETID,
        WD.AMOUNT,
        WD.STATUSID,
        ST.STATUSCODE AS STATUSCODE,
        WD.PROCESSEDBY,
        WD.PROCESSEDAT
    FROM CMS_WALLETWD WD
    JOIN CMS_STATUS ST ON ST.STATUSID = WD.STATUSID
    WHERE WD.WALLETWDID = PWALLETWDID;
END$$


/* ============================================================
   PROCEDURE: CMSLISTWALLETWD
   ------------------------------------------------------------
   Lists withdrawal requests[cite: 3].
   ============================================================ */
CREATE PROCEDURE CMSLISTWALLETWD
(
    IN PCUSTOMERID INT,
    IN PSTATUSCODE VARCHAR(20)
)
BEGIN
    SELECT
        WD.WALLETWDID,
        WD.WALLETID,
        W.CUSTOMERID,
        WD.AMOUNT,
        WD.STATUSID,
        ST.STATUSCODE AS STATUSCODE,
        WD.REQUESTEDBY,
        WD.REQUESTEDAT,
        WD.PROCESSEDBY,
        WD.PROCESSEDAT,
        WD.PAYMENTMETHOD,
        WD.REFNO,
        WD.REMARKS
    FROM CMS_WALLETWD WD
    JOIN CMS_WALLET W
      ON W.WALLETID = WD.WALLETID
    JOIN CMS_STATUS ST
      ON ST.STATUSID = WD.STATUSID
    WHERE (PCUSTOMERID IS NULL OR W.CUSTOMERID = PCUSTOMERID)
      AND (PSTATUSCODE IS NULL OR ST.STATUSCODE = PSTATUSCODE)
    ORDER BY WD.REQUESTEDAT DESC, WD.WALLETWDID DESC;
END$$

DELIMITER ;

/* ============================================================
   NOTES FOR BOOKING INTEGRATION
   ============================================================

   CMSADDBOOK should NOT simply:
       1. check wallet balance in application code
       2. create booking
       3. call another procedure to deduct money.

   The final booking procedure must perform the wallet check and
   deduction atomically when the customer type uses a wallet.

   Conceptually:

       START TRANSACTION

       Validate booking

       Calculate booking amount

       If wallet customer:
           SELECT CMS_WALLET ... FOR UPDATE

           IF BOOKINGAMOUNT >
              (BALANCE - RESERVEDAMT)
               SIGNAL insufficient balance

           create booking

           UPDATE CMS_WALLET
              SET BALANCE = BALANCE - BOOKINGAMOUNT

           INSERT CMS_WALLETTRAN
               TRANSTYPE  = 'DEBIT'
               SOURCECODE = 'BOOKING'
               BOOKINGID  = newly-created booking

       Else:
           create booking normally

       COMMIT

   Permanent employee bookings therefore have no wallet transaction.

   Contract employee / visitor wallet bookings have a wallet
   transaction whose BOOKINGID points to CMS_BOOKING.

   ============================================================ */
