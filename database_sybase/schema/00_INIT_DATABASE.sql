/* ============================================================
   FILE    : 00_INIT_DATABASE.sql
   ENGINE  : SAP Sybase ASE 16.0 SP04+
   PURPOSE : Pre-flight server configuration assertions and
             database context selection.
   EXECUTE : Run FIRST before any schema or procedure file.
   ============================================================ */

-- Select the CMS production database
USE CMS_DB
GO

-- Verify we are on the correct database
IF DB_NAME() != 'CMS_DB'
BEGIN
    RAISERROR 20000 'FATAL: Not connected to CMS_DB. Aborting deployment.'
    RETURN
END
GO

-- Confirm page-size is 8KB (minimum recommended for CMS row widths)
-- DBA must verify: sp_configure 'default data cache size'
-- isql -S <server> -U sa -Q "sp_configure 'page size'"
PRINT 'CMS_DB context established. Proceed with schema creation.'
GO
