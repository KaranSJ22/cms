/* ============================================================
   KIOSK_READ_PROCEDURES.sql  —  Sybase ASE 16
   ============================================================ */

/* ============================================================
   CMSIDENTIFYKIOSK
   Resolves physical kiosk metadata and assigned canteen by IP address
   ============================================================ */

IF OBJECT_ID('dbo.CMSIDENTIFYKIOSK') IS NOT NULL DROP PROCEDURE dbo.CMSIDENTIFYKIOSK
GO
CREATE PROCEDURE dbo.CMSIDENTIFYKIOSK
    @PIPADDRESS VARCHAR(45)
AS
BEGIN
    SET NOCOUNT ON
    DECLARE @VKIOSKID INT

    IF @PIPADDRESS IS NULL OR LTRIM(RTRIM(@PIPADDRESS)) = ''
    BEGIN
        RAISERROR('Client IP address is required', 16, 1)
        RETURN 1
    END

    /* Lookup active kiosk matching the IP */
    SELECT TOP 1 @VKIOSKID = KD.KIOSKID
    FROM   dbo.CMS_KIOSK_DEVICE KD
    WHERE  KD.IPADDRESS = LTRIM(RTRIM(@PIPADDRESS))
      AND  KD.ISACTIVE  = 1

    IF @VKIOSKID IS NOT NULL
    BEGIN
        /* Update last seen IP and heartbeat */
        UPDATE dbo.CMS_KIOSK_DEVICE
        SET    LASTHEARTBEATAT = GETDATE(),
               LASTSEENIP      = LTRIM(RTRIM(@PIPADDRESS))
        WHERE  KIOSKID = @VKIOSKID

        /* Return Kiosk + Canteen Configuration */
        SELECT KD.KIOSKID,
               KD.DEVICECODE, KD.DEVICENAME, KD.IPADDRESS, KD.MACADDRESS,
               KD.CANTEENID, C.CANTEENNAME, C.CANTEENCODE,
               C.LOCATION AS CANTEENLOCATION,
               KD.KIOSKTYPE, KD.ISACTIVE,
               ST.STATUSCODE
        FROM   dbo.CMS_KIOSK_DEVICE KD
        JOIN   dbo.CMS_CANTEEN C  ON C.CANTEENID  = KD.CANTEENID
        JOIN   dbo.CMS_STATUS  ST ON ST.STATUSID  = KD.STATUSID
        WHERE  KD.KIOSKID = @VKIOSKID
    END
    ELSE
    BEGIN
        RAISERROR('Kiosk device not registered for this IP address', 16, 1)
        RETURN 1
    END

    RETURN 0
END
GO


/* ============================================================
   CMSLISTKIOSKDEVICES
   Lists all registered kiosks, optionally scoped by canteen
   ============================================================ */

IF OBJECT_ID('dbo.CMSLISTKIOSKDEVICES') IS NOT NULL DROP PROCEDURE dbo.CMSLISTKIOSKDEVICES
GO
CREATE PROCEDURE dbo.CMSLISTKIOSKDEVICES
    @PCANTEENID INT = NULL
AS
BEGIN
    SET NOCOUNT ON
    SELECT KD.KIOSKID,
           KD.DEVICECODE, KD.DEVICENAME, KD.IPADDRESS, KD.MACADDRESS,
           KD.CANTEENID,  C.CANTEENNAME, C.CANTEENCODE,
           KD.KIOSKTYPE,  KD.ISACTIVE,
           KD.LASTHEARTBEATAT, KD.LASTSEENIP,
           ST.STATUSCODE
    FROM   dbo.CMS_KIOSK_DEVICE KD
    JOIN   dbo.CMS_CANTEEN C  ON C.CANTEENID = KD.CANTEENID
    JOIN   dbo.CMS_STATUS  ST ON ST.STATUSID = KD.STATUSID
    WHERE  (@PCANTEENID IS NULL OR KD.CANTEENID = @PCANTEENID)
    ORDER BY KD.CANTEENID ASC, KD.KIOSKTYPE ASC, KD.KIOSKID ASC
    RETURN 0
END
GO


/* ============================================================
   CMSKIOSKGETCURRENTSLOT
   Returns the meal slot currently active for the canteen based on
   clock time, or the next upcoming slot for today.

   Sybase notes:
   - CURDATE()            → CONVERT(DATE, GETDATE())
   - CURRENT_TIME()       → CONVERT(TIME, GETDATE())  [ASE 16 supports TIME type]
   - INTERVAL 15 MINUTE   → DATEADD(mi, -15, ...) / DATEADD(mi, 15, ...)
   - TIMESTAMPDIFF(MINUTE)→ DATEDIFF(mi, ...)
   - CONCAT(date,' ',time)→ DATEADD(mi, DATEDIFF(mi, CONVERT(DATETIME,servdate), CONVERT(DATETIME,endtime)), CONVERT(DATETIME,servdate))
                            simplified as: the end datetime = servdate + endtime offset
   ============================================================ */

IF OBJECT_ID('dbo.CMSKIOSKGETCURRENTSLOT') IS NOT NULL DROP PROCEDURE dbo.CMSKIOSKGETCURRENTSLOT
GO
CREATE PROCEDURE dbo.CMSKIOSKGETCURRENTSLOT
    @PCANTEENID INT = NULL,
    @PKIOSKID   INT = NULL
AS
BEGIN
    SET NOCOUNT ON
    DECLARE @VCANTEENID INT
    DECLARE @VSLOTCOUNT INT
    DECLARE @VNOW       DATETIME
    DECLARE @VTODAY     DATETIME

    SET @VNOW   = GETDATE()
    SET @VTODAY = CONVERT(DATETIME, CONVERT(VARCHAR(10), @VNOW, 120))  /* midnight today */
    SET @VCANTEENID = @PCANTEENID

    /* If CANTEENID was not passed but KIOSKID is available, resolve from Kiosk */
    IF @VCANTEENID IS NULL AND @PKIOSKID IS NOT NULL
    BEGIN
        SELECT TOP 1 @VCANTEENID = KD.CANTEENID
        FROM   dbo.CMS_KIOSK_DEVICE KD
        WHERE  KD.KIOSKID = @PKIOSKID
    END

    IF @VCANTEENID IS NULL
        SET @VCANTEENID = 1

    /*
       ASE 16: DS.STARTTIME / DS.ENDTIME stored as DATETIME (time-of-day portion).
       We build the full serving-window datetime for today by combining today's date
       with the stored time offset:
           slot_start_dt = @VTODAY + (STARTTIME - base_date_of_STARTTIME column)
       Since the column stores absolute DATETIME we just use DATEADD on today's date:
           window_open  = @VTODAY + DATEDIFF(mi, 0, STARTTIME) minutes - 15 min
           window_close = @VTODAY + DATEDIFF(mi, 0, ENDTIME)   minutes + 15 min
    */

    /* 1. Check for slot currently serving (15-min buffer either side) */
    SELECT @VSLOTCOUNT = COUNT(*)
    FROM   dbo.CMS_DAYSLOT DS
    WHERE  DS.CANTEENID = @VCANTEENID
      AND  DS.SERVDATE  = @VTODAY
      AND  DS.STATUSID  = 10
      AND  @VNOW BETWEEN DATEADD(mi, -15, DATEADD(mi, DATEDIFF(mi, 0, DS.STARTTIME), @VTODAY))
                     AND DATEADD(mi,  15, DATEADD(mi, DATEDIFF(mi, 0, DS.ENDTIME),   @VTODAY))

    IF @VSLOTCOUNT > 0
    BEGIN
        SELECT TOP 1
            DS.DAYSLOTID, DS.SLOTNO, DS.SERVICEID,
            S.SERVCODE, S.SERVNAME,
            DS.CANTEENID, C.CANTEENNAME, C.CANTEENCODE,
            DS.SERVDATE, DS.STARTTIME, DS.ENDTIME,
            1 AS ISACTIVENOW,
            /* minutes remaining = end_dt - now */
            CASE WHEN DATEDIFF(mi, @VNOW,
                               DATEADD(mi, DATEDIFF(mi, 0, DS.ENDTIME), @VTODAY)) > 0
                 THEN DATEDIFF(mi, @VNOW,
                               DATEADD(mi, DATEDIFF(mi, 0, DS.ENDTIME), @VTODAY))
                 ELSE 0 END AS MINUTESREMAINING,
            0           AS MINUTESUNTILSTART,
            'SERVING'   AS SLOTSTATE
        FROM   dbo.CMS_DAYSLOT DS
        JOIN   dbo.CMS_SERVICE S ON S.SERVICEID = DS.SERVICEID
        JOIN   dbo.CMS_CANTEEN C ON C.CANTEENID = DS.CANTEENID
        WHERE  DS.CANTEENID = @VCANTEENID
          AND  DS.SERVDATE  = @VTODAY
          AND  DS.STATUSID  = 10
          AND  @VNOW BETWEEN DATEADD(mi, -15, DATEADD(mi, DATEDIFF(mi, 0, DS.STARTTIME), @VTODAY))
                         AND DATEADD(mi,  15, DATEADD(mi, DATEDIFF(mi, 0, DS.ENDTIME),   @VTODAY))
        ORDER BY DS.STARTTIME ASC
    END
    ELSE
    BEGIN
        /* 2. Fallback: Find the nearest UPCOMING slot today */
        SELECT TOP 1
            DS.DAYSLOTID, DS.SLOTNO, DS.SERVICEID,
            S.SERVCODE, S.SERVNAME,
            DS.CANTEENID, C.CANTEENNAME, C.CANTEENCODE,
            DS.SERVDATE, DS.STARTTIME, DS.ENDTIME,
            0           AS ISACTIVENOW,
            0           AS MINUTESREMAINING,
            CASE WHEN DATEDIFF(mi, @VNOW,
                               DATEADD(mi, DATEDIFF(mi, 0, DS.STARTTIME), @VTODAY)) > 0
                 THEN DATEDIFF(mi, @VNOW,
                               DATEADD(mi, DATEDIFF(mi, 0, DS.STARTTIME), @VTODAY))
                 ELSE 0 END AS MINUTESUNTILSTART,
            'UPCOMING'  AS SLOTSTATE
        FROM   dbo.CMS_DAYSLOT DS
        JOIN   dbo.CMS_SERVICE S ON S.SERVICEID = DS.SERVICEID
        JOIN   dbo.CMS_CANTEEN C ON C.CANTEENID = DS.CANTEENID
        WHERE  DS.CANTEENID = @VCANTEENID
          AND  DS.SERVDATE  = @VTODAY
          AND  DS.STATUSID  = 10
          AND  DATEADD(mi, DATEDIFF(mi, 0, DS.STARTTIME), @VTODAY) > @VNOW
        ORDER BY DS.STARTTIME ASC
    END

    RETURN 0
END
GO


/* ============================================================
   CMSKIOSKRESOLVEBOOKING
   Dedicated Kiosk Serving resolver:
   - Priority resolution: RFID KeyCard UID → LoginID → CustomerID → BookNo
   - Slot-aware matching: prioritized to active meal slot
   - Returns 2 Result Sets: Header (with slot & out-of-window warning) + Items

   Key translations:
   - LIMIT 1           → SELECT TOP 1
   - VIDENTIFIER REGEXP '^[0-9]+$' → ISNUMERIC(@VIDENTIFIER)=1 AND PATINDEX('%[^0-9]%',@VIDENTIFIER)=0
   - CAST(x AS UNSIGNED) → CONVERT(INT, x)
   - CURDATE()         → @VTODAY
   - CURRENT_TIME()    → time portion of @VNOW
   - INTERVAL 15/30 MINUTE → DATEADD(mi, ±15/30, ...)
   ============================================================ */

IF OBJECT_ID('dbo.CMSKIOSKRESOLVEBOOKING') IS NOT NULL DROP PROCEDURE dbo.CMSKIOSKRESOLVEBOOKING
GO
CREATE PROCEDURE dbo.CMSKIOSKRESOLVEBOOKING
    @PIDENTIFIER VARCHAR(255),
    @PCANTEENID  INT         = NULL,
    @PKIOSKID    INT         = NULL,
    @PDAYSLOTID  INT         = NULL
AS
BEGIN
    SET NOCOUNT ON
    DECLARE @VBOOKID       INT
    DECLARE @VCUSTOMERID   INT
    DECLARE @VCANTEENID    INT
    DECLARE @VACTIVESLOTID INT
    DECLARE @VIDENTIFIER   VARCHAR(255)
    DECLARE @VNOW          DATETIME
    DECLARE @VTODAY        DATETIME

    SET @VNOW          = GETDATE()
    SET @VTODAY        = CONVERT(DATETIME, CONVERT(VARCHAR(10), @VNOW, 120))
    SET @VCANTEENID    = @PCANTEENID
    SET @VACTIVESLOTID = @PDAYSLOTID

    IF @PIDENTIFIER IS NULL OR LTRIM(RTRIM(@PIDENTIFIER)) = ''
    BEGIN
        RAISERROR('Identifier or Booking Number is required', 16, 1)
        RETURN 1
    END

    SET @VIDENTIFIER = LTRIM(RTRIM(@PIDENTIFIER))

    /* If CANTEENID was not provided, derive from Kiosk hardware record */
    IF @VCANTEENID IS NULL AND @PKIOSKID IS NOT NULL
    BEGIN
        SELECT TOP 1 @VCANTEENID = KD.CANTEENID
        FROM   dbo.CMS_KIOSK_DEVICE KD
        WHERE  KD.KIOSKID = @PKIOSKID
    END

    /* 1. Direct formatted Booking Number (PB... / BK...) */
    IF UPPER(@VIDENTIFIER) LIKE 'PB%' OR UPPER(@VIDENTIFIER) LIKE 'BK%'
    BEGIN
        SELECT TOP 1 @VBOOKID = B.BOOKID
        FROM   dbo.CMS_BOOKING B
        WHERE  B.BOOKNO = @VIDENTIFIER
    END
    ELSE
    BEGIN
        /* 2. Try RFID Access Key */
        SELECT TOP 1 @VCUSTOMERID = AK.CUSTOMERID
        FROM   dbo.CMS_ACCKEY AK
        JOIN   dbo.CMS_STATUS STAK ON STAK.STATUSID = AK.STATUSID
        WHERE  AK.KEYVALUE       = @VIDENTIFIER
          AND  STAK.STATUSCODE   = 'ACT'
          AND  (AK.EXPIRESAT IS NULL OR AK.EXPIRESAT > @VNOW)

        /* 3. Fallback to CMS_USER.LOGINID */
        IF @VCUSTOMERID IS NULL
        BEGIN
            SELECT TOP 1 @VCUSTOMERID = C.CUSTOMERID
            FROM   dbo.CMS_USER     U
            JOIN   dbo.CMS_CUSTOMER C ON C.USERID = U.USERID
            WHERE  U.LOGINID = @VIDENTIFIER
        END

        /* 4. Fallback to direct numeric CUSTOMERID
              REGEXP '^[0-9]+$' → ISNUMERIC + no non-digit chars */
        IF @VCUSTOMERID IS NULL
           AND ISNUMERIC(@VIDENTIFIER) = 1
           AND PATINDEX('%[^0-9]%', @VIDENTIFIER) = 0
        BEGIN
            SELECT TOP 1 @VCUSTOMERID = C.CUSTOMERID
            FROM   dbo.CMS_CUSTOMER C
            WHERE  C.CUSTOMERID = CONVERT(INT, @VIDENTIFIER)
        END

        IF @VCUSTOMERID IS NULL
        BEGIN
            RAISERROR('Employee or badge not recognized', 16, 1)
            RETURN 1
        END

        /* 5. Auto-detect active meal slot if PDAYSLOTID was not explicitly specified */
        IF @VACTIVESLOTID IS NULL AND @VCANTEENID IS NOT NULL
        BEGIN
            SELECT TOP 1 @VACTIVESLOTID = DS.DAYSLOTID
            FROM   dbo.CMS_DAYSLOT DS
            WHERE  DS.CANTEENID = @VCANTEENID
              AND  DS.SERVDATE  = @VTODAY
              AND  DS.STATUSID  = 10
              AND  @VNOW BETWEEN DATEADD(mi, -30, DATEADD(mi, DATEDIFF(mi, 0, DS.STARTTIME), @VTODAY))
                             AND DATEADD(mi,  30, DATEADD(mi, DATEDIFF(mi, 0, DS.ENDTIME),   @VTODAY))
            ORDER BY DS.STARTTIME ASC
        END

        /* 6. Slot-Aware Matching: First look for booking in the active meal slot */
        IF @VACTIVESLOTID IS NOT NULL
        BEGIN
            SELECT TOP 1 @VBOOKID = B.BOOKID
            FROM   dbo.CMS_BOOKING  B
            JOIN   dbo.CMS_STATUS   ST ON ST.STATUSID   = B.STATUSID
            JOIN   dbo.CMS_BOOKITEM BI ON BI.BOOKID     = B.BOOKID
            JOIN   dbo.CMS_DAYMENU  DM ON DM.DAYMENUID  = BI.DAYMENUID
            WHERE  B.CUSTOMERID   = @VCUSTOMERID
              AND  B.SERVICEDATE  = @VTODAY
              AND  DM.DAYSLOTID   = @VACTIVESLOTID
              AND  ST.STATUSCODE IN ('CRT', 'SRV')
            ORDER BY (CASE WHEN ST.STATUSCODE = 'CRT' THEN 0 ELSE 1 END) ASC,
                     B.BOOKID DESC
        END

        /* 7. Fallback: find ANY booking for today (prioritising CRT) */
        IF @VBOOKID IS NULL
        BEGIN
            SELECT TOP 1 @VBOOKID = B.BOOKID
            FROM   dbo.CMS_BOOKING  B
            JOIN   dbo.CMS_STATUS   ST  ON ST.STATUSID  = B.STATUSID
            LEFT JOIN dbo.CMS_BOOKITEM BI ON BI.BOOKID  = B.BOOKID
            LEFT JOIN dbo.CMS_DAYMENU  DM ON DM.DAYMENUID = BI.DAYMENUID
            LEFT JOIN dbo.CMS_DAYSLOT  DS ON DS.DAYSLOTID = DM.DAYSLOTID
            WHERE  B.CUSTOMERID   = @VCUSTOMERID
              AND  B.SERVICEDATE  = @VTODAY
              AND  ST.STATUSCODE IN ('CRT', 'SRV')
              AND  (@VCANTEENID IS NULL OR DS.CANTEENID = @VCANTEENID)
            ORDER BY (CASE WHEN ST.STATUSCODE = 'CRT' THEN 0 ELSE 1 END) ASC,
                     B.BOOKID DESC
        END
    END

    IF @VBOOKID IS NULL
    BEGIN
        RAISERROR('No active booking found for today', 16, 1)
        RETURN 1
    END

    /* Result Set 1: Booking Header with Slot Window context */
    SELECT TOP 1
        B.BOOKID, B.BOOKNO,
        BT.BOOKTYPECODE, BT.BOOKTYPENAME,
        B.CUSTOMERID, C.CTYPECODE, C.DISPNAME AS CUSTOMERNAME,
        U.LOGINID,
        B.SERVICEID, S.SERVCODE, S.SERVNAME,
        DS.DAYSLOTID, DS.SLOTNO,
        DS.STARTTIME AS SLOTSTARTTIME,
        DS.ENDTIME   AS SLOTENDTIME,
        DS.CANTEENID, CAN.CANTEENNAME,
        B.SERVICEDATE, B.STATUSID, ST.STATUSCODE,
        B.TOTALITEMS, B.TOTALQTY, B.TOTALAMOUNT,
        B.BOOKEDON, B.SERVEDBY,
        USRV.FULLNAME AS SERVEDBYNAME,
        B.SERVEDON, B.KIOSKID,
        KD.DEVICECODE AS SERVEDKIOSKCODE,
        /* ISINWINDOW: clock is within ±15 min of slot */
        CASE
            WHEN DS.STARTTIME IS NOT NULL
             AND @VNOW BETWEEN DATEADD(mi, -15, DATEADD(mi, DATEDIFF(mi, 0, DS.STARTTIME), @VTODAY))
                           AND DATEADD(mi,  15, DATEADD(mi, DATEDIFF(mi, 0, DS.ENDTIME),   @VTODAY))
            THEN 1 ELSE 0
        END AS ISINWINDOW,
        B.REMARKS
    FROM   dbo.CMS_BOOKING   B
    JOIN   dbo.CMS_BOOKTYPE  BT  ON BT.BOOKTYPEID = B.BOOKTYPEID
    JOIN   dbo.CMS_CUSTOMER  C   ON C.CUSTOMERID  = B.CUSTOMERID
    JOIN   dbo.CMS_SERVICE   S   ON S.SERVICEID   = B.SERVICEID
    JOIN   dbo.CMS_STATUS    ST  ON ST.STATUSID   = B.STATUSID
    LEFT JOIN dbo.CMS_USER      U    ON U.USERID      = C.USERID
    LEFT JOIN dbo.CMS_USER      USRV ON USRV.USERID   = B.SERVEDBY
    LEFT JOIN dbo.CMS_KIOSK_DEVICE KD ON KD.KIOSKID   = B.KIOSKID
    LEFT JOIN dbo.CMS_BOOKITEM  BI   ON BI.BOOKID      = B.BOOKID
    LEFT JOIN dbo.CMS_DAYMENU   DM   ON DM.DAYMENUID   = BI.DAYMENUID
    LEFT JOIN dbo.CMS_DAYSLOT   DS   ON DS.DAYSLOTID   = DM.DAYSLOTID
    LEFT JOIN dbo.CMS_CANTEEN   CAN  ON CAN.CANTEENID  = DS.CANTEENID
    WHERE  B.BOOKID = @VBOOKID

    /* Result Set 2: Booking Items */
    SELECT
        BI.BOOKITEMID, BI.DAYMENUID, BI.MENUITEMID,
        MI.MENUCODE, MI.SHORTNAME, MI.ITEMNAME,
        BI.QTY, BI.RATE, BI.AMOUNT,
        BI.STATUSID, ST.STATUSCODE
    FROM   dbo.CMS_BOOKITEM BI
    JOIN   dbo.CMS_MENUITEM MI ON MI.MENUITEMID = BI.MENUITEMID
    JOIN   dbo.CMS_STATUS   ST ON ST.STATUSID   = BI.STATUSID
    WHERE  BI.BOOKID = @VBOOKID
    ORDER BY BI.BOOKITEMID ASC

    RETURN 0
END
GO


/* ============================================================
   CMSKIOSKSCANSELFSERVICE
   High-performance single round-trip scan for Employee Self-Service Kiosks.
   Returns:
     RS-1: Customer Profile + Wallet Eligibility & Balance
     RS-2: Today's Bookings for current meal slots
     RS-3: Upcoming Pre-Bookings
   ============================================================ */

IF OBJECT_ID('dbo.CMSKIOSKSCANSELFSERVICE') IS NOT NULL DROP PROCEDURE dbo.CMSKIOSKSCANSELFSERVICE
GO
CREATE PROCEDURE dbo.CMSKIOSKSCANSELFSERVICE
    @PIDENTIFIER VARCHAR(255),
    @PCANTEENID  INT = NULL,
    @PKIOSKID    INT = NULL
AS
BEGIN
    SET NOCOUNT ON
    DECLARE @VCUSTOMERID INT
    DECLARE @VIDENTIFIER VARCHAR(255)
    DECLARE @VNOW        DATETIME
    DECLARE @VTODAY      DATETIME

    SET @VNOW   = GETDATE()
    SET @VTODAY = CONVERT(DATETIME, CONVERT(VARCHAR(10), @VNOW, 120))

    IF @PIDENTIFIER IS NULL OR LTRIM(RTRIM(@PIDENTIFIER)) = ''
    BEGIN
        RAISERROR('Identifier or card badge is required', 16, 1)
        RETURN 1
    END

    SET @VIDENTIFIER = LTRIM(RTRIM(@PIDENTIFIER))

    /* 1. Try RFID KeyCard */
    SELECT TOP 1 @VCUSTOMERID = AK.CUSTOMERID
    FROM   dbo.CMS_ACCKEY AK
    JOIN   dbo.CMS_STATUS STAK ON STAK.STATUSID = AK.STATUSID
    WHERE  AK.KEYVALUE       = @VIDENTIFIER
      AND  STAK.STATUSCODE   = 'ACT'
      AND  (AK.EXPIRESAT IS NULL OR AK.EXPIRESAT > @VNOW)

    /* 2. Fallback to CMS_USER.LOGINID */
    IF @VCUSTOMERID IS NULL
    BEGIN
        SELECT TOP 1 @VCUSTOMERID = C.CUSTOMERID
        FROM   dbo.CMS_USER     U
        JOIN   dbo.CMS_CUSTOMER C ON C.USERID = U.USERID
        WHERE  U.LOGINID = @VIDENTIFIER
    END

    /* 3. Fallback to direct numeric CUSTOMERID */
    IF @VCUSTOMERID IS NULL
       AND ISNUMERIC(@VIDENTIFIER) = 1
       AND PATINDEX('%[^0-9]%', @VIDENTIFIER) = 0
    BEGIN
        SELECT TOP 1 @VCUSTOMERID = C.CUSTOMERID
        FROM   dbo.CMS_CUSTOMER C
        WHERE  C.CUSTOMERID = CONVERT(INT, @VIDENTIFIER)
    END

    IF @VCUSTOMERID IS NULL
    BEGIN
        RAISERROR('Employee or badge not recognized', 16, 1)
        RETURN 1
    END

    /* Result Set 1: Customer Profile + Wallet */
    SELECT
        C.CUSTOMERID, C.DISPNAME, C.CTYPECODE,
        U.LOGINID,
        CASE WHEN C.CTYPECODE IN ('CONTEMP', 'CNT', 'VIS', 'VISITOR') THEN 1 ELSE 0 END AS ISWALLETELIGIBLE,
        COALESCE(W.BALANCE,     0.00) AS WALLETBALANCE,
        COALESCE(W.RESERVEDAMT, 0.00) AS RESERVEDAMT,
        W.STATUSID AS WALLETSTATUSID
    FROM   dbo.CMS_CUSTOMER C
    LEFT JOIN dbo.CMS_USER   U ON U.USERID     = C.USERID
    LEFT JOIN dbo.CMS_WALLET W ON W.CUSTOMERID = C.CUSTOMERID
    WHERE  C.CUSTOMERID = @VCUSTOMERID

    /* Result Set 2: Today's Bookings */
    SELECT
        B.BOOKID, B.BOOKNO,
        B.SERVICEID, S.SERVNAME,
        B.SERVICEDATE, B.STATUSID, ST.STATUSCODE,
        B.TOTALITEMS, B.TOTALQTY, B.TOTALAMOUNT,
        B.SERVEDON, B.SERVEDBY
    FROM   dbo.CMS_BOOKING B
    JOIN   dbo.CMS_SERVICE S  ON S.SERVICEID  = B.SERVICEID
    JOIN   dbo.CMS_STATUS  ST ON ST.STATUSID  = B.STATUSID
    WHERE  B.CUSTOMERID  = @VCUSTOMERID
      AND  B.SERVICEDATE = @VTODAY
    ORDER BY B.BOOKID DESC

    /* Result Set 3: Upcoming Pre-Bookings */
    SELECT
        B.BOOKID, B.BOOKNO,
        B.SERVICEID, S.SERVNAME,
        B.SERVICEDATE, B.STATUSID, ST.STATUSCODE,
        B.TOTALITEMS, B.TOTALQTY, B.TOTALAMOUNT,
        B.BOOKEDON
    FROM   dbo.CMS_BOOKING B
    JOIN   dbo.CMS_SERVICE S  ON S.SERVICEID  = B.SERVICEID
    JOIN   dbo.CMS_STATUS  ST ON ST.STATUSID  = B.STATUSID
    WHERE  B.CUSTOMERID   = @VCUSTOMERID
      AND  B.SERVICEDATE  > @VTODAY
      AND  ST.STATUSCODE  = 'CRT'
    ORDER BY B.SERVICEDATE ASC, B.BOOKID ASC

    RETURN 0
END
GO


/* ============================================================
   CMSGETKIOSKPUBLISHEDMENU
   Published Menu items enabled for Kiosks.

   Sybase correlated subquery: used directly — supported in ASE 16.
   LIMIT 1 inside subquery → TOP 1 with ORDER BY.
   ============================================================ */

IF OBJECT_ID('dbo.CMSGETKIOSKPUBLISHEDMENU') IS NOT NULL DROP PROCEDURE dbo.CMSGETKIOSKPUBLISHEDMENU
GO
CREATE PROCEDURE dbo.CMSGETKIOSKPUBLISHEDMENU
    @PCANTEENID INT,
    @PSERVDATE  DATETIME
AS
BEGIN
    SET NOCOUNT ON
    SELECT
        DM.DAYMENUID, DM.DAYSLOTID,
        DS.SERVICEID, S.SERVNAME,
        S.STARTTIME,  S.ENDTIME,
        DM.MENUITEMID,
        MI.MENUCODE, MI.SHORTNAME, MI.ITEMNAME,
        MI.ITEMDESCR AS ITEMDESC,
        COALESCE(
          (SELECT TOP 1 IPD.PRICE
           FROM   dbo.CMS_ITEMPRICE   IP
           JOIN   dbo.CMS_ITEMPRICEDT IPD ON IPD.ITEMPRICEID = IP.ITEMPRICEID
           WHERE  IP.MENUITEMID = MI.MENUITEMID
             AND  IP.STATUSID   = 10
             AND  IP.EFFFROM   <= @PSERVDATE
           ORDER BY IP.EFFFROM DESC),
          0.00
        ) AS RATE,
        DM.BOOKUNTIL, DM.CANCELUNTIL,
        DM.AVAILQTY,  DM.MAXQTY
    FROM   dbo.CMS_DAYMENU  DM
    JOIN   dbo.CMS_DAYSLOT  DS ON DS.DAYSLOTID  = DM.DAYSLOTID
    JOIN   dbo.CMS_SERVICE  S  ON S.SERVICEID   = DS.SERVICEID
    JOIN   dbo.CMS_MENUITEM MI ON MI.MENUITEMID = DM.MENUITEMID
    WHERE  DS.CANTEENID = @PCANTEENID
      AND  DS.SERVDATE  = @PSERVDATE
      AND  DM.ISKIOSK   = 1
      AND  DM.STATUSID  = 10
    ORDER BY S.STARTTIME ASC, MI.ITEMNAME ASC
    RETURN 0
END
GO


/* ============================================================
   CMSLISTTODAYMEALSLOTS
   Today's Meal Slots with Active Serving Window Flag
   ============================================================ */

IF OBJECT_ID('dbo.CMSLISTTODAYMEALSLOTS') IS NOT NULL DROP PROCEDURE dbo.CMSLISTTODAYMEALSLOTS
GO
CREATE PROCEDURE dbo.CMSLISTTODAYMEALSLOTS
    @PCANTEENID INT
AS
BEGIN
    SET NOCOUNT ON
    DECLARE @VNOW   DATETIME
    DECLARE @VTODAY DATETIME
    SET @VNOW   = GETDATE()
    SET @VTODAY = CONVERT(DATETIME, CONVERT(VARCHAR(10), @VNOW, 120))

    SELECT
        DS.DAYSLOTID, DS.SLOTNO, DS.SERVICEID,
        S.SERVCODE, S.SERVNAME,
        DS.CANTEENID, DS.SERVDATE,
        DS.STARTTIME, DS.ENDTIME,
        DS.STATUSID,
        CASE
            WHEN @VNOW BETWEEN DATEADD(mi, -15, DATEADD(mi, DATEDIFF(mi, 0, DS.STARTTIME), @VTODAY))
                           AND DATEADD(mi,  15, DATEADD(mi, DATEDIFF(mi, 0, DS.ENDTIME),   @VTODAY))
            THEN 1 ELSE 0
        END AS ISCURRENT
    FROM   dbo.CMS_DAYSLOT DS
    JOIN   dbo.CMS_SERVICE S ON S.SERVICEID = DS.SERVICEID
    WHERE  DS.CANTEENID = @PCANTEENID
      AND  DS.SERVDATE  = @VTODAY
      AND  DS.STATUSID  = 10
    ORDER BY DS.STARTTIME ASC
    RETURN 0
END
GO
