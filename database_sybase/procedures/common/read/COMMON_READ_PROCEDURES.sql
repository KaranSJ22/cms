/* ============================================================
   FILE    : COMMON_READ_PROCEDURES.sql
   ENGINE  : SAP Sybase ASE 16.0 SP04+
   DOMAIN  : Common / System Configuration (Read)
   PROCEDURES:
     CMSGETSTATUS     — Fetch single status by ID
     CMSLISTSTATUS    — List statuses, optionally by group
     CMSGETCUSTTYPE   — Fetch single customer type by ID
     CMSLISTCUSTTYPE  — List all customer types
     CMSGETSCREEN     — Fetch single screen by ID
     CMSLISTSCREEN    — List all screens
     CMSGETROLESCN    — Fetch role-screen permission row
     CMSLISTROLESCN   — List all permissions for a role
     CMSLISTAUTONO    — List all auto-number configs
   DIALECT CHANGES vs MySQL:
     - DELIMITER $$ / DELIMITER ; removed; use GO.
     - IN param prefix removed; @P prefix added.
     - SELECT INTO → SELECT @VAR = col FROM ...
     - No DECLARE EXIT HANDLER; @@error checked post-DML.
     - SET NOCOUNT ON mandatory in every procedure.
     - CMS_ROLESCN renamed CMS_ROLESCREEN (schema name used).
   ============================================================ */

USE CMS_DB
GO

-- ============================================================
IF OBJECT_ID('dbo.CMSGETSTATUS') IS NOT NULL DROP PROCEDURE dbo.CMSGETSTATUS
GO
CREATE PROCEDURE dbo.CMSGETSTATUS
    @PSTATUSID INT
AS
BEGIN
    SET NOCOUNT ON
    SELECT STATUSID, STATUSCODE, STATUSNAME, STATUSGRP,
           DESCR, ISACTIVE, CREATEDAT, UPDATEDAT
    FROM   dbo.CMS_STATUS
    WHERE  STATUSID = @PSTATUSID
    RETURN 0
END
GO

-- ============================================================
IF OBJECT_ID('dbo.CMSLISTSTATUS') IS NOT NULL DROP PROCEDURE dbo.CMSLISTSTATUS
GO
CREATE PROCEDURE dbo.CMSLISTSTATUS
    @PSTATUSGRP VARCHAR(30) = NULL
AS
BEGIN
    SET NOCOUNT ON
    SELECT STATUSID, STATUSCODE, STATUSNAME, STATUSGRP,
           DESCR, ISACTIVE, CREATEDAT, UPDATEDAT
    FROM   dbo.CMS_STATUS
    WHERE  (@PSTATUSGRP IS NULL OR STATUSGRP = @PSTATUSGRP)
    ORDER BY STATUSGRP, STATUSCODE
    RETURN 0
END
GO

-- ============================================================
IF OBJECT_ID('dbo.CMSGETCUSTTYPE') IS NOT NULL DROP PROCEDURE dbo.CMSGETCUSTTYPE
GO
CREATE PROCEDURE dbo.CMSGETCUSTTYPE
    @PCTYPEID INT
AS
BEGIN
    SET NOCOUNT ON
    SELECT CTYPEID, CTYPECODE, CTYPENAME, DESCR,
           ISACTIVE, CREATEDAT, UPDATEDAT
    FROM   dbo.CMS_CUSTTYPE
    WHERE  CTYPEID = @PCTYPEID
    RETURN 0
END
GO

-- ============================================================
IF OBJECT_ID('dbo.CMSLISTCUSTTYPE') IS NOT NULL DROP PROCEDURE dbo.CMSLISTCUSTTYPE
GO
CREATE PROCEDURE dbo.CMSLISTCUSTTYPE
AS
BEGIN
    SET NOCOUNT ON
    SELECT CTYPEID, CTYPECODE, CTYPENAME, DESCR,
           ISACTIVE, CREATEDAT, UPDATEDAT
    FROM   dbo.CMS_CUSTTYPE
    ORDER BY CTYPECODE
    RETURN 0
END
GO

-- ============================================================
IF OBJECT_ID('dbo.CMSGETSCREEN') IS NOT NULL DROP PROCEDURE dbo.CMSGETSCREEN
GO
CREATE PROCEDURE dbo.CMSGETSCREEN
    @PSCREENID INT
AS
BEGIN
    SET NOCOUNT ON
    SELECT SCREENID, SCREENCODE, SCREENNAME, DESCR,
           ROUTEPATH, ISACTIVE, CREATEDBY, CREATEDAT, UPDATEDAT
    FROM   dbo.CMS_SCREEN
    WHERE  SCREENID = @PSCREENID
    RETURN 0
END
GO

-- ============================================================
IF OBJECT_ID('dbo.CMSLISTSCREEN') IS NOT NULL DROP PROCEDURE dbo.CMSLISTSCREEN
GO
CREATE PROCEDURE dbo.CMSLISTSCREEN
AS
BEGIN
    SET NOCOUNT ON
    SELECT SCREENID, SCREENCODE, SCREENNAME, DESCR,
           ROUTEPATH, ISACTIVE, CREATEDBY, CREATEDAT, UPDATEDAT
    FROM   dbo.CMS_SCREEN
    ORDER BY SCREENCODE
    RETURN 0
END
GO

-- ============================================================
-- CMSGETROLESCN: fetch single role-screen permission row.
-- NOTE: Table renamed CMS_ROLESCREEN in Sybase schema.
--       MySQL source referenced CMS_ROLESCN — corrected here.
-- ============================================================
IF OBJECT_ID('dbo.CMSGETROLESCN') IS NOT NULL DROP PROCEDURE dbo.CMSGETROLESCN
GO
CREATE PROCEDURE dbo.CMSGETROLESCN
    @PROLEID   INT,
    @PSCREENID INT
AS
BEGIN
    SET NOCOUNT ON
    SELECT RS.ROLESCREENID, RS.ROLEID, R.ROLECODE, R.ROLENAME,
           RS.SCREENID, SC.SCREENCODE, SC.SCREENNAME,
           RS.CANVIEW, RS.CANEDIT,
           RS.CREATEDAT
    FROM   dbo.CMS_ROLESCREEN RS
    JOIN   dbo.CMS_ROLE   R  ON R.ROLEID    = RS.ROLEID
    JOIN   dbo.CMS_SCREEN SC ON SC.SCREENID = RS.SCREENID
    WHERE  RS.ROLEID   = @PROLEID
      AND  RS.SCREENID = @PSCREENID
    RETURN 0
END
GO

-- ============================================================
-- CMSLISTROLESCN: list all screen permissions for a role.
-- ============================================================
IF OBJECT_ID('dbo.CMSLISTROLESCN') IS NOT NULL DROP PROCEDURE dbo.CMSLISTROLESCN
GO
CREATE PROCEDURE dbo.CMSLISTROLESCN
    @PROLEID INT
AS
BEGIN
    SET NOCOUNT ON
    SELECT RS.ROLESCREENID, RS.ROLEID, R.ROLECODE, R.ROLENAME,
           RS.SCREENID, SC.SCREENCODE, SC.SCREENNAME,
           RS.CANVIEW, RS.CANEDIT,
           RS.CREATEDAT
    FROM   dbo.CMS_ROLESCREEN RS
    JOIN   dbo.CMS_ROLE   R  ON R.ROLEID    = RS.ROLEID
    JOIN   dbo.CMS_SCREEN SC ON SC.SCREENID = RS.SCREENID
    WHERE  RS.ROLEID = @PROLEID
    ORDER BY SC.SCREENCODE
    RETURN 0
END
GO

-- ============================================================
-- CMSLISTAUTONO: list all auto-number configurations.
-- NOTE: MySQL source selected non-existent column STATUS;
--       corrected to STATUSID (actual column name in schema).
-- ============================================================
IF OBJECT_ID('dbo.CMSLISTAUTONO') IS NOT NULL DROP PROCEDURE dbo.CMSLISTAUTONO
GO
CREATE PROCEDURE dbo.CMSLISTAUTONO
AS
BEGIN
    SET NOCOUNT ON
    SELECT AUTONOID, TBLNAME, DATAITEM, ITEMLEN, FLDTYPE,
           PREFIXCHAR, STARTNO, STARTDATE, LASTNO, LASTGENDATE,
           STATUSID, CREATEDBY, CREATEDAT, UPDATEDAT
    FROM   dbo.CMS_AUTONOS
    ORDER BY TBLNAME, DATAITEM
    RETURN 0
END
GO

PRINT 'COMMON_READ_PROCEDURES compiled successfully.'
GO
