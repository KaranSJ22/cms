-- ============================================================
-- SEED_SERVICE.sql
-- Seeds standard canteen meal services via stored procedure CMSADDSERV.
-- Safe to run on fresh databases or rerun repeatedly (idempotent).
-- ============================================================

USE cms_db;

DELIMITER $$

DROP PROCEDURE IF EXISTS TMP_SEED_SERVICES$$

CREATE PROCEDURE TMP_SEED_SERVICES()
BEGIN
    DECLARE v_mgr_id INT DEFAULT 2;

    -- Look up Canteen Manager ID (mgr1, fallback to 2 if not found)
    SELECT USERID INTO v_mgr_id 
    FROM CMS_USER 
    WHERE LOGINID = 'mgr1' 
    LIMIT 1;

    IF v_mgr_id IS NULL THEN
        SET v_mgr_id = 2;
    END IF;

    -- 1. Breakfast Service (07:30 - 09:30)
    IF NOT EXISTS (SELECT 1 FROM CMS_SERVICE WHERE SERVCODE = 'BREAKFAST') THEN
        CALL CMSADDSERV('BREAKFAST', 'Breakfast', '07:30:00', '09:30:00', v_mgr_id);
    END IF;

    -- 2. Lunch Service (12:00 - 14:30)
    IF NOT EXISTS (SELECT 1 FROM CMS_SERVICE WHERE SERVCODE = 'LUNCH') THEN
        CALL CMSADDSERV('LUNCH', 'Lunch', '12:00:00', '14:30:00', v_mgr_id);
    END IF;

    -- 3. Evening Snacks & Tea Service (16:00 - 18:00)
    IF NOT EXISTS (SELECT 1 FROM CMS_SERVICE WHERE SERVCODE = 'SNACKS') THEN
        CALL CMSADDSERV('SNACKS', 'Evening Snacks & Tea', '16:00:00', '18:00:00', v_mgr_id);
    END IF;

    -- 4. Dinner Service (19:30 - 21:30)
    IF NOT EXISTS (SELECT 1 FROM CMS_SERVICE WHERE SERVCODE = 'DINNER') THEN
        CALL CMSADDSERV('DINNER', 'Dinner', '19:30:00', '21:30:00', v_mgr_id);
    END IF;

    SELECT 'Standard meal services seeded successfully' AS STATUS;
END$$

DELIMITER ;

CALL TMP_SEED_SERVICES();
DROP PROCEDURE IF EXISTS TMP_SEED_SERVICES;

