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

DROP TABLE IF EXISTS CMS_WALLET;
DROP TABLE IF EXISTS CMS_WALLETTRAN;
DROP TABLE IF EXISTS CMS_WALLETWD;


SET FOREIGN_KEY_CHECKS = 1;



/* ============================================================
   TABLE: CMS_WALLET
   ------------------------------------------------------------
   One wallet per eligible customer.
   BALANCE       = actual wallet balance.
   RESERVEDAMT   = amount reserved by pending withdrawal requests.
   AVAILABLE     = BALANCE - RESERVEDAMT.
   ============================================================ */

CREATE TABLE CMS_WALLET
(
    WALLETID       INT AUTO_INCREMENT PRIMARY KEY,
    CUSTOMERID     INT NOT NULL UNIQUE,
    BALANCE        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    RESERVEDAMT    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    STATUS         VARCHAR(20) NOT NULL DEFAULT 'A',
    CREATEDAT      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UPDATEDAT      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                   ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT CK_WAL_BALANCE
        CHECK (BALANCE >= 0.00),

    CONSTRAINT CK_WAL_RESERVED
        CHECK (RESERVEDAMT >= 0.00),

    CONSTRAINT CK_WAL_RES_BAL
        CHECK (RESERVEDAMT <= BALANCE),

    CONSTRAINT FK_WAL_CUST
        FOREIGN KEY (CUSTOMERID)
        REFERENCES CMS_CUSTOMER (CUSTOMERID),

    INDEX IX_WAL_CUST (CUSTOMERID),
    INDEX IX_WAL_STATUS (STATUS)
) ENGINE=InnoDB;


/* ============================================================
   TABLE: CMS_WALLETTRAN
   ------------------------------------------------------------
   Immutable wallet ledger.

   TRANSTYPE examples:
     CREDIT     - cash/payment top-up
     DEBIT      - booking consumption
     REFUND     - booking cancellation/refund
     WITHDRAWAL - completed wallet withdrawal

   SOURCECODE examples:
     OPENING
     TOPUP
     BOOKING
     BOOKINGREFUND
     WITHDRAWAL

   BOOKINGID is intentionally nullable:
     - Permanent employee bookings: no wallet transaction.
     - Cash top-up: no booking.
     - Withdrawal: no booking.
     - Contract/Visitor booking: booking reference exists.
   ============================================================ */

CREATE TABLE CMS_WALLETTRAN
(
    WALLETTRANID    INT AUTO_INCREMENT PRIMARY KEY,
    WALLETID        INT NOT NULL,
    BOOKINGID       INT NULL,

    TRANSTYPE       VARCHAR(20) NOT NULL,
    SOURCECODE      VARCHAR(30) NOT NULL,

    AMOUNT          DECIMAL(12,2) NOT NULL,
    BALBEFORE       DECIMAL(12,2) NOT NULL,
    BALAFTER        DECIMAL(12,2) NOT NULL,

    PAYMENTMETHOD   VARCHAR(20) NULL,
    REFNO           VARCHAR(80) NULL,

    CREATEDBY       INT NOT NULL,
    CREATEDAT       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    REMARKS         VARCHAR(500) NULL,

    CONSTRAINT FK_WT_WALLET
        FOREIGN KEY (WALLETID)
        REFERENCES CMS_WALLET (WALLETID),

    CONSTRAINT FK_WT_BOOKING
        FOREIGN KEY (BOOKINGID)
        REFERENCES CMS_BOOKING (BOOKINGID),

    CONSTRAINT FK_WT_USER
        FOREIGN KEY (CREATEDBY)
        REFERENCES CMS_USER (USERID),

    CONSTRAINT CK_WT_AMOUNT
        CHECK (AMOUNT > 0.00),

    CONSTRAINT CK_WT_BALBEFORE
        CHECK (BALBEFORE >= 0.00),

    CONSTRAINT CK_WT_BALAFTER
        CHECK (BALAFTER >= 0.00),

    INDEX IX_WT_WALLET (WALLETID, CREATEDAT),
    INDEX IX_WT_BOOKING (BOOKINGID),
    INDEX IX_WT_CREATEDBY (CREATEDBY),
    INDEX IX_WT_REFNO (REFNO)
) ENGINE=InnoDB;


/* ============================================================
   TABLE: CMS_WALLETWD
   ------------------------------------------------------------
   Withdrawal request.

   The requested amount is RESERVED immediately.
   This prevents the same money from being used by another
   booking or withdrawal while the request is pending.

   STATUS:
     REQUESTED
     COMPLETED
     REJECTED
     CANCELLED

   A COMPLETED request creates a CMS_WALLETTRAN row with
   TRANSTYPE = WITHDRAWAL and releases the reservation.

   A REJECTED request only releases the reservation.
   ============================================================ */

CREATE TABLE CMS_WALLETWD
(
    WALLETWDID      INT AUTO_INCREMENT PRIMARY KEY,
    WALLETID        INT NOT NULL,
    AMOUNT          DECIMAL(12,2) NOT NULL,

    STATUS          VARCHAR(20) NOT NULL DEFAULT 'REQ',

    REQUESTEDBY     INT NOT NULL,
    REQUESTEDAT     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PROCESSEDBY     INT NULL,
    PROCESSEDAT     DATETIME NULL,

    PAYMENTMETHOD   VARCHAR(20) NULL,
    REFNO           VARCHAR(80) NULL,
    REMARKS         VARCHAR(500) NULL,

    CONSTRAINT FK_WD_WALLET
        FOREIGN KEY (WALLETID)
        REFERENCES CMS_WALLET (WALLETID),

    CONSTRAINT FK_WD_REQUSER
        FOREIGN KEY (REQUESTEDBY)
        REFERENCES CMS_USER (USERID),

    CONSTRAINT FK_WD_PROCUSER
        FOREIGN KEY (PROCESSEDBY)
        REFERENCES CMS_USER (USERID),

    CONSTRAINT CK_WD_AMOUNT
        CHECK (AMOUNT > 0.00),

    INDEX IX_WD_WALLET (WALLETID, STATUS),
    INDEX IX_WD_STATUS (STATUS),
    INDEX IX_WD_REQUESTEDAT (REQUESTEDAT)
) ENGINE=InnoDB;
