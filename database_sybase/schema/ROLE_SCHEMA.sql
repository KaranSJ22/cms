/* ============================================================
   FILE    : ROLE_SCHEMA.sql
   ENGINE  : SAP Sybase ASE 16.0 SP04+
   MODULE  : RBAC Role Catalog
   TABLES  : CMS_ROLE, CMS_ROLESCREEN
   ORDER   : Execute EIGHTH (after CANTEEN_SCHEMA.sql,
             before CANTEENROLE_SCHEMA.sql)
   NOTES   :
   - CMS_ROLESCREEN maps roles to permitted UI screens.
   - ISACTIVE TINYINT(1) → ISACTIVE TINYINT (Sybase).
   ============================================================ */

USE CMS_DB
GO

-- Drop in reverse dependency order
IF OBJECT_ID('dbo.CMS_ROLESCREEN') IS NOT NULL
    DROP TABLE dbo.CMS_ROLESCREEN
GO

IF OBJECT_ID('dbo.CMS_ROLE') IS NOT NULL
    DROP TABLE dbo.CMS_ROLE
GO

-- ============================================================
-- CMS_ROLE
-- RBAC role definitions: ADMIN, CANTEEN_MGR, CASHIER, etc.
-- ============================================================
CREATE TABLE dbo.CMS_ROLE (
    ROLEID   INT          IDENTITY NOT NULL,
    ROLECODE VARCHAR(50)  NOT NULL,
    ROLENAME VARCHAR(100) NOT NULL,
    DESCR    VARCHAR(255) NULL,
    ISACTIVE TINYINT      NOT NULL DEFAULT 1,
    CREATEDAT DATETIME    NOT NULL DEFAULT GETDATE(),
    UPDATEDAT DATETIME    NULL,
    PRIMARY KEY (ROLEID)
)
LOCK DATAROWS
GO

CREATE UNIQUE INDEX UQ_ROLE_CODE
    ON dbo.CMS_ROLE (ROLECODE)
GO

-- ============================================================
-- CMS_ROLESCREEN
-- Maps which UI screens a role can access (permission matrix).
-- ============================================================
CREATE TABLE dbo.CMS_ROLESCREEN (
    ROLESCREENID INT      IDENTITY NOT NULL,
    ROLEID       INT      NOT NULL,
    SCREENID     INT      NOT NULL,
    CANVIEW      TINYINT  NOT NULL DEFAULT 1,
    CANEDIT      TINYINT  NOT NULL DEFAULT 0,
    CREATEDAT    DATETIME NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (ROLESCREENID)
)
LOCK DATAROWS
GO

-- Composite unique: one permission row per role-screen pair
CREATE UNIQUE INDEX UQ_ROLESCREEN
    ON dbo.CMS_ROLESCREEN (ROLEID, SCREENID)
GO

ALTER TABLE dbo.CMS_ROLESCREEN
    ADD CONSTRAINT FK_RS_ROLE
    FOREIGN KEY (ROLEID) REFERENCES dbo.CMS_ROLE(ROLEID)
GO

ALTER TABLE dbo.CMS_ROLESCREEN
    ADD CONSTRAINT FK_RS_SCREEN
    FOREIGN KEY (SCREENID) REFERENCES dbo.CMS_SCREEN(SCREENID)
GO

PRINT 'ROLE_SCHEMA created successfully.'
GO
