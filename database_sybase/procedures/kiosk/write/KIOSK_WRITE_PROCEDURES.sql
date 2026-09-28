/* ============================================================
   KIOSK_WRITE_PROCEDURES.sql  —  Sybase ASE 16
   ============================================================ */

/* ============================================================
   CMSREGISTERKIOSKDEVICE
   Upserts hardware kiosk record for physical terminals.

   MySQL ON DUPLICATE KEY UPDATE → Sybase pattern:
     IF EXISTS (HOLDLOCK UPDLOCK) ... UPDATE ... ELSE ... INSERT
   ============================================================ */

IF OBJECT_ID('dbo.CMSREGISTERKIOSKDEVICE') IS NOT NULL DROP PROCEDURE dbo.CMSREGISTERKIOSKDEVICE
GO
CREATE PROCEDURE dbo.CMSREGISTERKIOSKDEVICE
    @PDEVICECODE VARCHAR(30),
    @PDEVICENAME VARCHAR(100),
    @PIPADDRESS  VARCHAR(45),
    @PMACADDRESS VARCHAR(17),
    @PCANTEENID  INT,
    @PKIOSKTYPE  VARCHAR(30),
    @PUSERID     INT
AS
BEGIN
    SET NOCOUNT ON
    DECLARE @VCANTEENSTATUSID INT
    DECLARE @VKIOSKID         INT
    DECLARE @VERR             INT

    IF @PDEVICECODE IS NULL OR LTRIM(RTRIM(@PDEVICECODE)) = ''
    BEGIN
        RAISERROR('Device code is required', 16, 1)
        RETURN 1
    END
    IF @PIPADDRESS IS NULL OR LTRIM(RTRIM(@PIPADDRESS)) = ''
    BEGIN
        RAISERROR('Static IP address is required', 16, 1)
        RETURN 1
    END
    IF @PCANTEENID IS NULL
    BEGIN
        RAISERROR('Canteen facility ID is required', 16, 1)
        RETURN 1
    END
    IF @PKIOSKTYPE NOT IN ('STAFF_COUNTER', 'EMP_SELF_SERVICE')
    BEGIN
        RAISERROR('Invalid Kiosk Type. Must be STAFF_COUNTER or EMP_SELF_SERVICE', 16, 1)
        RETURN 1
    END

    SELECT @VCANTEENSTATUSID = STATUSID FROM dbo.CMS_CANTEEN WHERE CANTEENID = @PCANTEENID
    IF @VCANTEENSTATUSID IS NULL
    BEGIN
        RAISERROR('Target canteen facility not found', 16, 1)
        RETURN 1
    END

    BEGIN TRANSACTION

    /* Atomic upsert: HOLDLOCK UPDLOCK prevents phantom insert between check and write */
    IF EXISTS (
        SELECT 1 FROM dbo.CMS_KIOSK_DEVICE (HOLDLOCK UPDLOCK)
        WHERE  DEVICECODE = LTRIM(RTRIM(@PDEVICECODE))
    )
    BEGIN
        UPDATE dbo.CMS_KIOSK_DEVICE
        SET    DEVICENAME  = LTRIM(RTRIM(@PDEVICENAME)),
               IPADDRESS   = LTRIM(RTRIM(@PIPADDRESS)),
               MACADDRESS  = LTRIM(RTRIM(@PMACADDRESS)),
               CANTEENID   = @PCANTEENID,
               KIOSKTYPE   = @PKIOSKTYPE,
               UPDATEDBY   = @PUSERID,
               UPDATEDAT   = GETDATE()
        WHERE  DEVICECODE  = LTRIM(RTRIM(@PDEVICECODE))

        SELECT @VERR = @@error
        IF @VERR <> 0
        BEGIN
            ROLLBACK TRANSACTION
            RAISERROR('Failed to update kiosk device', 16, 1)
            RETURN 1
        END
    END
    ELSE
    BEGIN
        INSERT INTO dbo.CMS_KIOSK_DEVICE
               (DEVICECODE, DEVICENAME, IPADDRESS, MACADDRESS,
                CANTEENID, KIOSKTYPE, STATUSID, ISACTIVE, CREATEDBY)
        VALUES (LTRIM(RTRIM(@PDEVICECODE)),
                LTRIM(RTRIM(@PDEVICENAME)),
                LTRIM(RTRIM(@PIPADDRESS)),
                LTRIM(RTRIM(@PMACADDRESS)),
                @PCANTEENID, @PKIOSKTYPE, 10, 1, @PUSERID)

        SELECT @VERR = @@error
        IF @VERR <> 0
        BEGIN
            ROLLBACK TRANSACTION
            RAISERROR('Failed to insert kiosk device', 16, 1)
            RETURN 1
        END
    END

    SELECT @VKIOSKID = KIOSKID FROM dbo.CMS_KIOSK_DEVICE
    WHERE  DEVICECODE = LTRIM(RTRIM(@PDEVICECODE))

    COMMIT TRANSACTION
    SELECT @VKIOSKID AS KIOSKID, 'SUCCESS' AS RESULT
    RETURN 0
END
GO


/* ============================================================
   CMSHEARTBEATKIOSK
   Updates telemetry timestamp and last seen IP for a kiosk.
   Simple fire-and-forget; no transaction needed for a single UPDATE.
   ============================================================ */

IF OBJECT_ID('dbo.CMSHEARTBEATKIOSK') IS NOT NULL DROP PROCEDURE dbo.CMSHEARTBEATKIOSK
GO
CREATE PROCEDURE dbo.CMSHEARTBEATKIOSK
    @PKIOSKID   INT,
    @PIPADDRESS VARCHAR(45) = NULL
AS
BEGIN
    SET NOCOUNT ON
    UPDATE dbo.CMS_KIOSK_DEVICE
    SET    LASTHEARTBEATAT = GETDATE(),
           LASTSEENIP      = COALESCE(@PIPADDRESS, LASTSEENIP)
    WHERE  KIOSKID = @PKIOSKID

    SELECT @PKIOSKID AS KIOSKID, 'HEARTBEAT_ACK' AS STATUS
    RETURN 0
END
GO


/* ============================================================
   CMSKIOSKSERVEBOOKING
   Atomically marks booking as served, attributing staff user & physical kiosk.
   Includes built-in idempotency (returns ALREADY_SERVED = 1).

   Key translations:
   - ELSEIF            → sequential IF / ELSE IF blocks
   - CURRENT_TIMESTAMP → GETDATE()
   - CURDATE()         → today midnight DATETIME
   - LAST_INSERT_ID()  → @@IDENTITY captured immediately after INSERT
   - DELETE FROM CMS_PBACTIVE: retained as-is (standard SQL)
   ============================================================ */

IF OBJECT_ID('dbo.CMSKIOSKSERVEBOOKING') IS NOT NULL DROP PROCEDURE dbo.CMSKIOSKSERVEBOOKING
GO
CREATE PROCEDURE dbo.CMSKIOSKSERVEBOOKING
    @PBOOKID  INT,
    @PUSERID  INT,
    @PKIOSKID INT
AS
BEGIN
    SET NOCOUNT ON
    DECLARE @VSTATUSID    INT
    DECLARE @VBOOKHISTID  INT
    DECLARE @VCUSTOMERID  INT
    DECLARE @VCTYPECODE   VARCHAR(10)
    DECLARE @VTOTALAMOUNT DECIMAL(12,2)
    DECLARE @VSERVICEDATE DATETIME
    DECLARE @VERR         INT
    DECLARE @VTODAY       DATETIME

    SET @VTODAY = CONVERT(DATETIME, CONVERT(VARCHAR(10), GETDATE(), 120))

    IF @PBOOKID IS NULL
    BEGIN
        RAISERROR('Booking ID is required', 16, 1)
        RETURN 1
    END

    /* Check current booking status */
    SELECT @VSTATUSID    = B.STATUSID,
           @VCUSTOMERID  = B.CUSTOMERID,
           @VCTYPECODE   = C.CTYPECODE,
           @VTOTALAMOUNT = B.TOTALAMOUNT,
           @VSERVICEDATE = B.SERVICEDATE
    FROM   dbo.CMS_BOOKING  B
    JOIN   dbo.CMS_CUSTOMER C ON C.CUSTOMERID = B.CUSTOMERID
    WHERE  B.BOOKID = @PBOOKID

    IF @VSTATUSID IS NULL
    BEGIN
        RAISERROR('Booking not found', 16, 1)
        RETURN 1
    END

    /* Idempotent check: if already served (32 = SRV), acknowledge cleanly */
    IF @VSTATUSID = 32
    BEGIN
        SELECT @PBOOKID AS BOOKID, 32 AS STATUSID, 'SRV' AS STATUSCODE, 1 AS ALREADY_SERVED
        RETURN 0
    END

    IF @VSTATUSID = 33
    BEGIN
        RAISERROR('Cannot serve a cancelled booking', 16, 1)
        RETURN 1
    END

    IF @VSERVICEDATE > @VTODAY
    BEGIN
        RAISERROR('Cannot serve a future booking before its scheduled service date', 16, 1)
        RETURN 1
    END

    BEGIN TRANSACTION

    /* Record Audit History — archive current booking row */
    INSERT INTO dbo.CMS_BOOKHIST (
        BOOKID, BOOKNO, BOOKTYPEID, CUSTOMERID, SERVICEID, SERVICEDATE,
        STATUSID, BOOKSEQNO, TOTALITEMS, TOTALQTY, TOTALAMOUNT,
        BOOKEDBY, BOOKEDON, CANCELLEDBY, CANCELLEDON, SERVEDBY, SERVEDON, NOSHOWON,
        KIOSKID,
        REMARKS, CREATEDBY, CREATEDAT, UPDATEDBY, UPDATEDAT, CHANGEDBY, CHGREASON
    )
    SELECT
        BOOKID, BOOKNO, BOOKTYPEID, CUSTOMERID, SERVICEID, SERVICEDATE,
        STATUSID, BOOKSEQNO, TOTALITEMS, TOTALQTY, TOTALAMOUNT,
        BOOKEDBY, BOOKEDON, CANCELLEDBY, CANCELLEDON, SERVEDBY, SERVEDON, NOSHOWON,
        @PKIOSKID,
        REMARKS, CREATEDBY, CREATEDAT, UPDATEDBY, UPDATEDAT, @PUSERID, 'Served at Kiosk'
    FROM   dbo.CMS_BOOKING
    WHERE  BOOKID = @PBOOKID

    SELECT @VERR = @@error, @VBOOKHISTID = @@IDENTITY
    IF @VERR <> 0
    BEGIN
        ROLLBACK TRANSACTION
        RAISERROR('Failed to archive booking history', 16, 1)
        RETURN 1
    END

    /* Archive booking items under same history record */
    INSERT INTO dbo.CMS_BOOKITMHS
           (BOOKHISTID, BOOKITEMID, DAYMENUID, MENUITEMID, QTY, RATE, AMOUNT, REMARKS, STATUSID)
    SELECT  @VBOOKHISTID, BOOKITEMID, DAYMENUID, MENUITEMID, QTY, RATE, AMOUNT, REMARKS, STATUSID
    FROM    dbo.CMS_BOOKITEM
    WHERE   BOOKID = @PBOOKID

    SELECT @VERR = @@error
    IF @VERR <> 0
    BEGIN
        ROLLBACK TRANSACTION
        RAISERROR('Failed to archive booking items', 16, 1)
        RETURN 1
    END

    /* Mark booking as Served (STATUSID 32 = SRV) */
    UPDATE dbo.CMS_BOOKING
    SET    STATUSID  = 32,
           SERVEDBY  = @PUSERID,
           SERVEDON  = GETDATE(),
           KIOSKID   = COALESCE(@PKIOSKID, KIOSKID),
           UPDATEDBY = @PUSERID,
           UPDATEDAT = GETDATE()
    WHERE  BOOKID = @PBOOKID

    SELECT @VERR = @@error
    IF @VERR <> 0
    BEGIN
        ROLLBACK TRANSACTION
        RAISERROR('Failed to mark booking as served', 16, 1)
        RETURN 1
    END

    /* Mark all pending items as served */
    UPDATE dbo.CMS_BOOKITEM
    SET    STATUSID  = 32,
           UPDATEDAT = GETDATE()
    WHERE  BOOKID   = @PBOOKID
      AND  STATUSID = 30

    SELECT @VERR = @@error
    IF @VERR <> 0
    BEGIN
        ROLLBACK TRANSACTION
        RAISERROR('Failed to mark booking items as served', 16, 1)
        RETURN 1
    END

    /* Remove from active pre-booking cache */
    DELETE FROM dbo.CMS_PBACTIVE WHERE BOOKID = @PBOOKID

    SELECT @VERR = @@error
    IF @VERR <> 0
    BEGIN
        ROLLBACK TRANSACTION
        RAISERROR('Failed to clear pre-booking active record', 16, 1)
        RETURN 1
    END

    COMMIT TRANSACTION
    SELECT @PBOOKID AS BOOKID, 32 AS STATUSID, 'SRV' AS STATUSCODE, 0 AS ALREADY_SERVED
    RETURN 0
END
GO
