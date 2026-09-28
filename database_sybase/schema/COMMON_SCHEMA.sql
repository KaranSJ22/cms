/* ============================================================
   FILE    : COMMON_SCHEMA.sql
   ENGINE  : SAP Sybase ASE 16.0 SP04+
   MODULE  : Common Master / System Configuration
   TABLES  : CMS_STATUS, CMS_AUTONOS, CMS_CUSTTYPE, CMS_SCREEN
   ORDER   : Execute SECOND (after 00_INIT_DATABASE.sql)
   NOTES   :
   - All tables use LOCK DATAROWS for row-level locking.
   - AUTO_INCREMENT replaced with IDENTITY.
   - ENGINE=InnoDB removed.
   - ON UPDATE CURRENT_TIMESTAMP removed; handled in procedures.
   - TINYINT(1) replaced with TINYINT.
   ============================================================ */

USE CMS_DB
GO

-- ============================================================
-- DROP EXISTING OBJECTS (reverse FK order)
-- ============================================================

IF OBJECT_ID('dbo.CMS_SCREEN') IS NOT NULL
    DROP TABLE dbo.CMS_SCREEN
GO

IF OBJECT_ID('dbo.CMS_AUTONOS') IS NOT NULL
    DROP TABLE dbo.CMS_AUTONOS
GO

IF OBJECT_ID('dbo.CMS_CUSTTYPE') IS NOT NULL
    DROP TABLE dbo.CMS_CUSTTYPE
GO

IF OBJECT_ID('dbo.CMS_STATUS') IS NOT NULL
    DROP TABLE dbo.CMS_STATUS
GO

-- ============================================================
-- CMS_STATUS
-- Master status/state dictionary referenced across all modules.
-- ============================================================
CREATE TABLE dbo.CMS_STATUS (
    STATUSID   INT          IDENTITY NOT NULL,
    STATUSCODE VARCHAR(10)  NOT NULL,
    STATUSNAME VARCHAR(50)  NOT NULL,
    STATUSGRP  VARCHAR(30)  NOT NULL,
    DESCR      VARCHAR(255) NULL,
    ISACTIVE   TINYINT      NOT NULL DEFAULT 1,
    CREATEDAT  DATETIME     NOT NULL DEFAULT GETDATE(),
    UPDATEDAT  DATETIME     NULL,
    PRIMARY KEY (STATUSID)
)
LOCK DATAROWS
GO

-- Unique constraint on (STATUSCODE, STATUSGRP)
CREATE UNIQUE INDEX UQ_STATUS_CODE_GRP
    ON dbo.CMS_STATUS (STATUSCODE, STATUSGRP)
GO

-- ============================================================
-- CMS_AUTONOS
-- Sequential auto-number generator for booking numbers,
-- slot numbers, etc. Locked with HOLDLOCK UPDLOCK in CMSGENAUTO.
-- ============================================================
CREATE TABLE dbo.CMS_AUTONOS (
    AUTONOID    INT          IDENTITY NOT NULL,
    TBLNAME     VARCHAR(50)  NOT NULL,
    DATAITEM    VARCHAR(30)  NOT NULL,
    ITEMLEN     INT          NOT NULL,
    FLDTYPE     VARCHAR(10)  NOT NULL DEFAULT 'CHAR',
    PREFIXCHAR  VARCHAR(5)   NOT NULL,
    STARTNO     BIGINT       NOT NULL DEFAULT 1,
    STARTDATE   DATETIME     NULL,
    LASTNO      BIGINT       NOT NULL DEFAULT 0,
    LASTGENDATE DATETIME     NULL,
    STATUSID    INT          NOT NULL DEFAULT 10,
    CREATEDBY   INT          NULL,
    CREATEDAT   DATETIME     NOT NULL DEFAULT GETDATE(),
    UPDATEDAT   DATETIME     NULL,
    PRIMARY KEY (AUTONOID)
)
LOCK DATAROWS
GO

CREATE UNIQUE INDEX UQ_AUTONOS
    ON dbo.CMS_AUTONOS (TBLNAME, DATAITEM)
GO

ALTER TABLE dbo.CMS_AUTONOS
    ADD CONSTRAINT FK_AUTONOS_STATUS
    FOREIGN KEY (STATUSID) REFERENCES dbo.CMS_STATUS(STATUSID)
GO

-- ============================================================
-- CMS_CUSTTYPE
-- Lookup table for customer classification:
-- PRM (Permanent Employee), CNT (Contractor), VIS (Visitor),
-- OCE (Official-Catering Employee), OFF (Cost-Center).
-- ============================================================
CREATE TABLE dbo.CMS_CUSTTYPE (
    CTYPEID   INT          IDENTITY NOT NULL,
    CTYPECODE VARCHAR(20)  NOT NULL,
    CTYPENAME VARCHAR(80)  NOT NULL,
    DESCR     VARCHAR(255) NULL,
    ISACTIVE  TINYINT      NOT NULL DEFAULT 1,
    CREATEDAT DATETIME     NOT NULL DEFAULT GETDATE(),
    UPDATEDAT DATETIME     NULL,
    PRIMARY KEY (CTYPEID)
)
LOCK DATAROWS
GO

CREATE UNIQUE INDEX UQ_CUSTTYPE_CODE
    ON dbo.CMS_CUSTTYPE (CTYPECODE)
GO

-- ============================================================
-- CMS_SCREEN
-- UI screen registry for RBAC permission mapping.
-- ============================================================
CREATE TABLE dbo.CMS_SCREEN (
    SCREENID   INT          IDENTITY NOT NULL,
    SCREENCODE VARCHAR(50)  NOT NULL,
    SCREENNAME VARCHAR(100) NOT NULL,
    DESCR      VARCHAR(255) NULL,
    ROUTEPATH  VARCHAR(150) NULL,
    ISACTIVE   TINYINT      NOT NULL DEFAULT 1,
    CREATEDBY  INT          NULL,
    CREATEDAT  DATETIME     NOT NULL DEFAULT GETDATE(),
    UPDATEDAT  DATETIME     NULL,
    PRIMARY KEY (SCREENID)
)
LOCK DATAROWS
GO

CREATE UNIQUE INDEX UQ_SCREEN_CODE
    ON dbo.CMS_SCREEN (SCREENCODE)
GO

PRINT 'COMMON_SCHEMA created successfully.'
GO
