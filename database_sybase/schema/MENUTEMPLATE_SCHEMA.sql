/* ============================================================
   FILE    : MENUTEMPLATE_SCHEMA.sql
   ENGINE  : SAP Sybase ASE 16.0 SP04+
   MODULE  : Weekly Rotational Menu Templates
   TABLES  : CMS_MENUTPL, CMS_MENUTPLDT
   ORDER   : Execute FOURTEENTH (after MENUITEM_PRICE_SCHEMA.sql,
             before DAYMENU_SCHEMA.sql)
   NOTES   :
   - Templates allow canteen managers to define a named
     weekly meal plan and materialise it into CMS_DAYMENU
     rows via CMSGENWEEKLYMENU_BATCH.
   - WEEKDAY: 1=Mon..7=Sun (matching DATEPART(weekday) adjusted
     per @@DATEFIRST=1). NULL = ad-hoc / festival-day template.
   - CRITICAL: MySQL WEEKDAY() vs Sybase DATEPART(weekday,...):
     See migration plan §4.8. All WEEKDAY comparisons in SPs
     must use: DATEPART(weekday, date) - 1 when @@DATEFIRST=2
     (Monday start). Confirm @@DATEFIRST at SP execution time.
   - ISSPECIAL / ISPREBOOK / ISKIOSK: TINYINT(1) → TINYINT.
   - CHECK constraint on WEEKDAY and MAXQTY preserved.
   - Composite unique on (CANTEENID, SERVICEID, TPLNAME).
   ============================================================ */

USE CMS_DB
GO

-- Drop in reverse dependency order
IF OBJECT_ID('dbo.CMS_MENUTPLDT') IS NOT NULL
    DROP TABLE dbo.CMS_MENUTPLDT
GO

IF OBJECT_ID('dbo.CMS_MENUTPL') IS NOT NULL
    DROP TABLE dbo.CMS_MENUTPL
GO

-- ============================================================
-- CMS_MENUTPL (Template Header)
-- Named template scoped to a canteen + service combination.
-- ============================================================
CREATE TABLE dbo.CMS_MENUTPL (
    MENUTPLID INT          IDENTITY NOT NULL,
    CANTEENID INT          NOT NULL,
    SERVICEID INT          NOT NULL,
    TPLNAME   VARCHAR(80)  NOT NULL,
    WEEKDAY   TINYINT      NULL,
    STATUSID  INT          NOT NULL DEFAULT 10,
    CREATEDBY INT          NOT NULL,
    CREATEDAT DATETIME     NOT NULL DEFAULT GETDATE(),
    UPDATEDAT DATETIME     NULL,
    PRIMARY KEY (MENUTPLID),
    CONSTRAINT CK_MTPL_WEEKDAY CHECK (WEEKDAY IS NULL OR (WEEKDAY >= 1 AND WEEKDAY <= 7))
)
LOCK DATAROWS
GO

-- Composite unique: one template name per canteen-service pair
CREATE UNIQUE INDEX UQ_MENUTPL
    ON dbo.CMS_MENUTPL (CANTEENID, SERVICEID, TPLNAME)
GO

ALTER TABLE dbo.CMS_MENUTPL
    ADD CONSTRAINT FK_MTPL_CAN
    FOREIGN KEY (CANTEENID) REFERENCES dbo.CMS_CANTEEN(CANTEENID)
GO

ALTER TABLE dbo.CMS_MENUTPL
    ADD CONSTRAINT FK_MTPL_SERV
    FOREIGN KEY (SERVICEID) REFERENCES dbo.CMS_SERVICE(SERVICEID)
GO

ALTER TABLE dbo.CMS_MENUTPL
    ADD CONSTRAINT FK_MTPL_BY
    FOREIGN KEY (CREATEDBY) REFERENCES dbo.CMS_USER(USERID)
GO

ALTER TABLE dbo.CMS_MENUTPL
    ADD CONSTRAINT FK_MTPL_STATUS
    FOREIGN KEY (STATUSID) REFERENCES dbo.CMS_STATUS(STATUSID)
GO

-- ============================================================
-- CMS_MENUTPLDT (Template Line Items)
-- Each row is one food item in the template, with its
-- prebook / kiosk flags and default available quantity.
-- ============================================================
CREATE TABLE dbo.CMS_MENUTPLDT (
    MENUTPLDTID INT     IDENTITY NOT NULL,
    MENUTPLID   INT     NOT NULL,
    MENUITEMID  INT     NOT NULL,
    ISSPECIAL   TINYINT NOT NULL DEFAULT 0,
    ISPREBOOK   TINYINT NOT NULL DEFAULT 1,
    ISKIOSK     TINYINT NOT NULL DEFAULT 1,
    MAXQTY      INT     NOT NULL DEFAULT 1,
    DEFAVAILQTY INT     NOT NULL DEFAULT 0,
    PRIMARY KEY (MENUTPLDTID),
    CONSTRAINT CK_MTPLDT_QTY CHECK (MAXQTY >= 1 AND DEFAVAILQTY >= 0)
)
LOCK DATAROWS
GO

-- Composite unique: one item entry per template
CREATE UNIQUE INDEX UQ_MTPLDT
    ON dbo.CMS_MENUTPLDT (MENUTPLID, MENUITEMID)
GO

ALTER TABLE dbo.CMS_MENUTPLDT
    ADD CONSTRAINT FK_MTPLDT_TPL
    FOREIGN KEY (MENUTPLID) REFERENCES dbo.CMS_MENUTPL(MENUTPLID)
GO

ALTER TABLE dbo.CMS_MENUTPLDT
    ADD CONSTRAINT FK_MTPLDT_ITEM
    FOREIGN KEY (MENUITEMID) REFERENCES dbo.CMS_MENUITEM(MENUITEMID)
GO

PRINT 'MENUTEMPLATE_SCHEMA created successfully.'
GO
