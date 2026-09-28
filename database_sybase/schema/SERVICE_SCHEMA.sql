/* ============================================================
   FILE    : SERVICE_SCHEMA.sql
   ENGINE  : SAP Sybase ASE 16.0 SP04+
   MODULE  : Service Catalog (Breakfast / Lunch / Dinner)
   TABLES  : CMS_SERVICE, CMS_SERVHIST
   ORDER   : Execute FIFTH (after CUSTOMER_SCHEMA.sql,
             before CENTER_SCHEMA.sql)
   NOTES   :
   - TIME type supported in ASE 15.7+. If ODBC driver issues
     arise, replace with VARCHAR(8) 'HH:MM:SS'.
   - CHECK constraint on DEFEND > DEFSTART preserved.
   - CMS_SERVHIST is an audit trail; uses composite PK
     (no IDENTITY) to avoid @@IDENTITY trigger hazard.
   ============================================================ */

USE CMS_DB
GO

-- Drop in reverse dependency order
IF OBJECT_ID('dbo.CMS_SERVHIST') IS NOT NULL
    DROP TABLE dbo.CMS_SERVHIST
GO

IF OBJECT_ID('dbo.CMS_SERVICE') IS NOT NULL
    DROP TABLE dbo.CMS_SERVICE
GO

-- ============================================================
-- CMS_SERVICE
-- Global service catalog: Breakfast, Lunch, Dinner, etc.
-- Canteen scoping is done at CMS_DAYSLOT level.
-- ============================================================
CREATE TABLE dbo.CMS_SERVICE (
    SERVICEID INT          IDENTITY NOT NULL,
    SERVCODE  VARCHAR(20)  NOT NULL,
    SERVNAME  VARCHAR(80)  NOT NULL,
    DEFSTART  TIME         NOT NULL,
    DEFEND    TIME         NOT NULL,
    STATUSID  INT          NOT NULL DEFAULT 10,
    CREATEDBY INT          NOT NULL,
    CREATEDAT DATETIME     NOT NULL DEFAULT GETDATE(),
    UPDATEDAT DATETIME     NULL,
    PRIMARY KEY (SERVICEID),
    CONSTRAINT CK_SERV_TIME CHECK (DEFEND > DEFSTART)
)
LOCK DATAROWS
GO

CREATE UNIQUE INDEX UQ_SERV_CODE
    ON dbo.CMS_SERVICE (SERVCODE)
GO

ALTER TABLE dbo.CMS_SERVICE
    ADD CONSTRAINT FK_SERV_BY
    FOREIGN KEY (CREATEDBY) REFERENCES dbo.CMS_USER(USERID)
GO

ALTER TABLE dbo.CMS_SERVICE
    ADD CONSTRAINT FK_SERV_STATUS
    FOREIGN KEY (STATUSID) REFERENCES dbo.CMS_STATUS(STATUSID)
GO

-- ============================================================
-- CMS_SERVHIST
-- Audit trail for service changes.
-- NOTE: No IDENTITY PK — audit tables must not use IDENTITY
-- to prevent @@IDENTITY overwrite in stored procedures.
-- ============================================================
CREATE TABLE dbo.CMS_SERVHIST (
    SERVHISTID INT          NOT NULL,
    SERVICEID  INT          NOT NULL,
    SERVCODE   VARCHAR(20)  NOT NULL,
    SERVNAME   VARCHAR(80)  NOT NULL,
    DEFSTART   TIME         NOT NULL,
    DEFEND     TIME         NOT NULL,
    VALIDFROM  DATETIME     NULL,
    VALIDUNTIL DATETIME     NULL,
    STATUSID   INT          NOT NULL,
    CHANGEDBY  INT          NOT NULL,
    CHANGEDAT  DATETIME     NOT NULL DEFAULT GETDATE(),
    CHGREASON  VARCHAR(255) NULL,
    PRIMARY KEY (SERVHISTID)
)
LOCK DATAROWS
GO

ALTER TABLE dbo.CMS_SERVHIST
    ADD CONSTRAINT FK_SH_SERV
    FOREIGN KEY (SERVICEID) REFERENCES dbo.CMS_SERVICE(SERVICEID)
GO

ALTER TABLE dbo.CMS_SERVHIST
    ADD CONSTRAINT FK_SH_BY
    FOREIGN KEY (CHANGEDBY) REFERENCES dbo.CMS_USER(USERID)
GO

ALTER TABLE dbo.CMS_SERVHIST
    ADD CONSTRAINT FK_SH_STATUS
    FOREIGN KEY (STATUSID) REFERENCES dbo.CMS_STATUS(STATUSID)
GO

PRINT 'SERVICE_SCHEMA created successfully.'
GO
