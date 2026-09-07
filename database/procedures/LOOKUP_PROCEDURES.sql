USE cms_db;

/* --- Drop existing procedures --- */
DROP PROCEDURE IF EXISTS CMSGETCANTEENBYSLOT;
DROP PROCEDURE IF EXISTS CMSGETCANTEENBYDAYMENU;
DROP PROCEDURE IF EXISTS CMSGETCANTEENBYBOOKING;

DELIMITER $$

/* ============================================================
   Canteen Lookup Helpers
   Used by role middleware to resolve the owning canteen for a
   given resource — avoiding raw SQL in application code.
   ============================================================ */

/* Returns the CANTEENID that owns a given DAYSLOTID. */
CREATE PROCEDURE CMSGETCANTEENBYSLOT (IN PDAYSLOTID INT)
BEGIN
    SELECT CANTEENID
    FROM   CMS_DAYSLOT
    WHERE  DAYSLOTID = PDAYSLOTID;
END$$

/* Returns the CANTEENID that owns a given DAYMENUID
   (resolved via the parent DAYSLOT). */
CREATE PROCEDURE CMSGETCANTEENBYDAYMENU (IN PDAYMENUID INT)
BEGIN
    SELECT DS.CANTEENID
    FROM   CMS_DAYMENU DM
    JOIN   CMS_DAYSLOT DS ON DS.DAYSLOTID = DM.DAYSLOTID
    WHERE  DM.DAYMENUID = PDAYMENUID;
END$$

/* Returns the CANTEENID that owns a given BOOKID
   (resolved via BOOKITEM -> DAYMENU -> DAYSLOT). */
CREATE PROCEDURE CMSGETCANTEENBYBOOKING (IN PBOOKID INT)
BEGIN
    SELECT DS.CANTEENID
    FROM   CMS_BOOKITEM   BI
    JOIN   CMS_DAYMENU    DM ON DM.DAYMENUID  = BI.DAYMENUID
    JOIN   CMS_DAYSLOT    DS ON DS.DAYSLOTID  = DM.DAYSLOTID
    WHERE  BI.BOOKID = PBOOKID
    LIMIT  1;
END$$

DELIMITER ;