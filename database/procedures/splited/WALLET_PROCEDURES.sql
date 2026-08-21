/* ============================================================
   ISRO CANTEEN MANAGEMENT SYSTEM (CMS)
   MODULE: WALLET
   DRAFT VERSION: V1
   ============================================================

   PURPOSE
   -------
   Wallet support for:
     - Contract Employees
     - Visitors

   Current payment method:
     - CASH

   Business Rules
   --------------
   1. Wallet belongs to one CMS_CUSTOMER.
   2. Only Contract Employee / Visitor customers should have wallets.
   3. Initial wallet opening amount must be >= configured minimum
      (currently Rs.100).
   4. Rs.100 is NOT a minimum retained balance.
   5. Wallet may fall below Rs.100 and may reach Rs.0.
   6. Wallet must never become negative.
   7. Booking amount must be <= available wallet balance.
   8. Wallet transactions are immutable financial records.
   9. Wallet transaction may optionally reference a booking.
  10. Top-up and withdrawal are recorded in the transaction ledger.
  11. Withdrawal requests reserve funds so that the same money cannot
      simultaneously be spent or requested for another withdrawal.
  12. Wallet balance changes and corresponding ledger entries occur
      in the same database transaction.
  13. This draft uses CASH only, but PAYMENTMETHOD is extensible for
      future UPI/payment-gateway integration.

   IMPORTANT
   ---------
   This is a DRAFT and should be reconciled against the existing
   CMS_BOOKING schema and current customer/type/status master tables
   before being promoted to the final V1 script.
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


/* ============================================================
   PROCEDURE: CMSADDWALLET
   ------------------------------------------------------------
   Creates a wallet and records the opening credit.

   POPENAMOUNT must be >= 100.00 for the current MVP.

   NOTE:
   The procedure deliberately does not hard-code 100 in multiple
   places. Replace the local variable with the final common-system
   configuration mechanism when the existing configuration/master
   design is finalized.
   ============================================================ */

DELIMITER $$

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

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    IF POPENAMOUNT < VMINOPENING THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Initial wallet amount must be at least 100.00';
    END IF;

    SELECT C.CTYPECODE
      INTO VTYPECODE
      FROM CMS_CUSTOMER C
     WHERE C.CUSTOMERID = PCUSTOMERID;

    IF VTYPECODE IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Customer does not exist';
    END IF;

    /*
      IMPORTANT:
      Replace these type codes with the exact codes already present
      in the CMS customer-type master.
    */
    IF VTYPECODE NOT IN ('CONTEMP', 'VISITOR') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Wallet is allowed only for contract employees and visitors';
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

    INSERT INTO CMS_WALLET
    (
        CUSTOMERID,
        BALANCE,
        RESERVEDAMT,
        STATUS
    )
    VALUES
    (
        PCUSTOMERID,
        POPENAMOUNT,
        0.00,
        'A'
    );

    SET VWALLETID = LAST_INSERT_ID();

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
        W.STATUS,
        W.CREATEDAT,
        W.UPDATEDAT
    FROM CMS_WALLET W
    WHERE W.WALLETID = VWALLETID;
END$$


/* ============================================================
   PROCEDURE: CMSADDWALLETAMT
   ------------------------------------------------------------
   Adds money to an existing wallet.

   For MVP:
     PAYMENTMETHOD must be CASH.

   Subsequent top-ups may be any positive amount.
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
    DECLARE VSTATUS VARCHAR(20);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF PAMOUNT <= 0.00 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Top-up amount must be greater than zero';
    END IF;

    IF PPAYMENTMETHOD <> 'CASH' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Only CASH payment method is enabled in the MVP';
    END IF;

    START TRANSACTION;

    SELECT
        W.WALLETID,
        W.BALANCE,
        W.STATUS
    INTO
        VWALLETID,
        VBALANCE,
        VSTATUS
    FROM CMS_WALLET W
    WHERE W.CUSTOMERID = PCUSTOMERID
    FOR UPDATE;

    IF VWALLETID IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Wallet does not exist';
    END IF;

    IF VSTATUS <> 'A' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Wallet is not active';
    END IF;

    SET VNEWBALANCE = VBALANCE + PAMOUNT;

    UPDATE CMS_WALLET
       SET BALANCE = VNEWBALANCE
     WHERE WALLETID = VWALLETID;

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
        PREFNO,
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
        W.STATUS
    FROM CMS_WALLET W
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
        W.STATUS,
        W.CREATEDAT,
        W.UPDATEDAT
    FROM CMS_WALLET W
    WHERE W.CUSTOMERID = PCUSTOMERID;
END$$


/* ============================================================
   PROCEDURE: CMSLISTWALLETTRAN
   ------------------------------------------------------------
   Returns wallet statement with optional booking information.
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
        WT.CREATEDBY,
        WT.CREATEDAT,
        WT.REMARKS,

        B.SERVICEDATE,
        B.STATUS AS BOOKINGSTATUS

    FROM CMS_WALLETTRAN WT
    JOIN CMS_WALLET W
      ON W.WALLETID = WT.WALLETID

    LEFT JOIN CMS_BOOKING B
      ON B.BOOKINGID = WT.BOOKINGID

    WHERE W.CUSTOMERID = PCUSTOMERID
      AND (PFROMDATE IS NULL OR DATE(WT.CREATEDAT) >= PFROMDATE)
      AND (PTODATE IS NULL OR DATE(WT.CREATEDAT) <= PTODATE)

    ORDER BY WT.CREATEDAT, WT.WALLETTRANID;
END$$


/* ============================================================
   PROCEDURE: CMSREQWALLETWD
   ------------------------------------------------------------
   Creates a withdrawal request and reserves the requested amount.

   The actual wallet balance is NOT reduced at request time.
   AVAILABLEBALANCE is reduced because RESERVEDAMT increases.

   This prevents double spending while the request is pending.
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
    DECLARE VSTATUS VARCHAR(20);
    DECLARE VWALLETWDID INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF PAMOUNT <= 0.00 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Withdrawal amount must be greater than zero';
    END IF;

    START TRANSACTION;

    SELECT
        W.WALLETID,
        W.BALANCE,
        W.RESERVEDAMT,
        W.STATUS
    INTO
        VWALLETID,
        VBALANCE,
        VRESERVED,
        VSTATUS
    FROM CMS_WALLET W
    WHERE W.CUSTOMERID = PCUSTOMERID
    FOR UPDATE;

    IF VWALLETID IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Wallet does not exist';
    END IF;

    IF VSTATUS <> 'A' THEN
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
        STATUS,
        REQUESTEDBY,
        REMARKS
    )
    VALUES
    (
        VWALLETID,
        PAMOUNT,
        'REQ',
        PREQUESTEDBY,
        PREMARKS
    );

    SET VWALLETWDID = LAST_INSERT_ID();

    COMMIT;

    SELECT
        WD.WALLETWDID,
        WD.WALLETID,
        WD.AMOUNT,
        WD.STATUS,
        WD.REQUESTEDBY,
        WD.REQUESTEDAT
    FROM CMS_WALLETWD WD
    WHERE WD.WALLETWDID = VWALLETWDID;
END$$


/* ============================================================
   PROCEDURE: CMSAPPWALLETWD
   ------------------------------------------------------------
   Completes a pending withdrawal.

   For MVP:
     PAYMENTMETHOD must be CASH.

   At completion:
     BALANCE decreases.
     RESERVEDAMT decreases.
     WITHDRAWAL transaction is inserted.
     Request becomes COMPLETED.
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
    DECLARE VSTATUS VARCHAR(20);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF PPAYMENTMETHOD <> 'CASH' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Only CASH withdrawal is enabled in the MVP';
    END IF;

    START TRANSACTION;

    SELECT
        WD.WALLETID,
        WD.AMOUNT,
        WD.STATUS
    INTO
        VWALLETID,
        VWITHDRAWALAMOUNT,
        VSTATUS
    FROM CMS_WALLETWD WD
    WHERE WD.WALLETWDID = PWALLETWDID
    FOR UPDATE;

    IF VWALLETID IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Withdrawal request does not exist';
    END IF;

    IF VSTATUS <> 'REQ' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Only requested withdrawals can be completed';
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
            SET MESSAGE_TEXT =
                'Wallet reservation is inconsistent';
    END IF;

    SET VNEWBALANCE = VBALANCE - VWITHDRAWALAMOUNT;

    IF VNEWBALANCE < 0.00 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Wallet balance cannot become negative';
    END IF;

    UPDATE CMS_WALLET
       SET BALANCE = VNEWBALANCE,
           RESERVEDAMT = RESERVEDAMT - VWITHDRAWALAMOUNT
     WHERE WALLETID = VWALLETID;

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
        PREFNO,
        PPROCESSEDBY,
        PREMARKS
    );

    UPDATE CMS_WALLETWD
       SET STATUS = 'COM',
           PROCESSEDBY = PPROCESSEDBY,
           PROCESSEDAT = CURRENT_TIMESTAMP,
           PAYMENTMETHOD = PPAYMENTMETHOD,
           REFNO = PREFNO,
           REMARKS = COALESCE(PREMARKS, REMARKS)
     WHERE WALLETWDID = PWALLETWDID;

    COMMIT;

    SELECT
        WD.WALLETWDID,
        WD.WALLETID,
        WD.AMOUNT,
        WD.STATUS,
        WD.PROCESSEDBY,
        WD.PROCESSEDAT
    FROM CMS_WALLETWD WD
    WHERE WD.WALLETWDID = PWALLETWDID;
END$$


/* ============================================================
   PROCEDURE: CMSREJWALLETWD
   ------------------------------------------------------------
   Rejects a pending withdrawal and releases its reservation.
   No financial transaction is created because no money left the
   wallet.
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
    DECLARE VSTATUS VARCHAR(20);
    DECLARE VRESERVED DECIMAL(12,2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT
        WD.WALLETID,
        WD.AMOUNT,
        WD.STATUS
    INTO
        VWALLETID,
        VWITHDRAWALAMOUNT,
        VSTATUS
    FROM CMS_WALLETWD WD
    WHERE WD.WALLETWDID = PWALLETWDID
    FOR UPDATE;

    IF VWALLETID IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Withdrawal request does not exist';
    END IF;

    IF VSTATUS <> 'REQ' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Only requested withdrawals can be rejected';
    END IF;

    SELECT RESERVEDAMT
      INTO VRESERVED
      FROM CMS_WALLET
     WHERE WALLETID = VWALLETID
     FOR UPDATE;

    IF VRESERVED < VWITHDRAWALAMOUNT THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Wallet reservation is inconsistent';
    END IF;

    UPDATE CMS_WALLET
       SET RESERVEDAMT = RESERVEDAMT - VWITHDRAWALAMOUNT
     WHERE WALLETID = VWALLETID;

    UPDATE CMS_WALLETWD
       SET STATUS = 'REJ',
           PROCESSEDBY = PPROCESSEDBY,
           PROCESSEDAT = CURRENT_TIMESTAMP,
           REMARKS = PREMARKS
     WHERE WALLETWDID = PWALLETWDID;

    COMMIT;

    SELECT
        WD.WALLETWDID,
        WD.WALLETID,
        WD.AMOUNT,
        WD.STATUS,
        WD.PROCESSEDBY,
        WD.PROCESSEDAT
    FROM CMS_WALLETWD WD
    WHERE WD.WALLETWDID = PWALLETWDID;
END$$


/* ============================================================
   PROCEDURE: CMSLISTWALLETWD
   ------------------------------------------------------------
   Lists withdrawal requests.

   PSTATUS may be NULL to return all statuses.
   ============================================================ */

CREATE PROCEDURE CMSLISTWALLETWD
(
    IN PCUSTOMERID INT,
    IN PSTATUS VARCHAR(20)
)
BEGIN
    SELECT
        WD.WALLETWDID,
        WD.WALLETID,
        W.CUSTOMERID,
        WD.AMOUNT,
        WD.STATUS,
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
    WHERE (PCUSTOMERID IS NULL OR W.CUSTOMERID = PCUSTOMERID)
      AND (PSTATUS IS NULL OR WD.STATUS = PSTATUS)
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
