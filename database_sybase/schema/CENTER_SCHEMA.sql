/* ============================================================
   FILE    : CENTER_SCHEMA.sql
   ENGINE  : SAP Sybase ASE 16.0 SP04+
   MODULE  : ISRO Center / Campus Registry
   TABLES  : CMS_CENTER
   ORDER   : Execute SIXTH (after SERVICE_SCHEMA.sql)
   NOTES   :
   - Simple lookup table for ISRO center locations.
   - UNIQUE index on CENTERCODE enforces one code per campus.
   ============================================================ */

USE CMS_DB
GO

IF OBJECT_ID('dbo.CMS_CENTER') IS NOT NULL
    DROP TABLE dbo.CMS_CENTER
GO

CREATE TABLE dbo.CMS_CENTER (
    CENTERID   INT          IDENTITY NOT NULL,
    CENTERCODE VARCHAR(20)  NOT NULL,
    CENTERNAME VARCHAR(120) NOT NULL,
    LOCATION   VARCHAR(150) NULL,
    STATUSID   INT          NOT NULL DEFAULT 10,
    CREATEDAT  DATETIME     NOT NULL DEFAULT GETDATE(),
    UPDATEDAT  DATETIME     NULL,
    PRIMARY KEY (CENTERID)
)
LOCK DATAROWS
GO

CREATE UNIQUE INDEX UQ_CENTER_CODE
    ON dbo.CMS_CENTER (CENTERCODE)
GO

ALTER TABLE dbo.CMS_CENTER
    ADD CONSTRAINT FK_CENT_STATUS
    FOREIGN KEY (STATUSID) REFERENCES dbo.CMS_STATUS(STATUSID)
GO

PRINT 'CENTER_SCHEMA created successfully.'
GO
