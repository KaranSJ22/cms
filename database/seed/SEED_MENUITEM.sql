-- ============================================================
-- SEED_MENUITEM.sql
-- Seeds standard canteen menu items and their active price bands
-- using stored procedures CMSADDMENUITEM and CMSADDITEMPRICE.
--
-- Customer Types Covered:
--   - PRM (Permanent Employee - subsidized rate)
--   - CNT (Contract Employee - semi-subsidized rate)
--   - OCE (Other Center Employee - inter-center rate)
--   - VIS (Visitor - guest rate)
--   - OFF (Official Request - official meeting rate)
--
-- Safe to run on fresh databases or rerun repeatedly (idempotent).
-- ============================================================

USE cms_db;

-- 1. Ensure auto-number configuration for CMS_MENUITEM exists
INSERT IGNORE INTO CMS_AUTONOS (TBLNAME, DATAITEM, ITEMLEN, PREFIXCHAR, LASTNO, LASTGENDATE, STATUSID)
VALUES ('CMS_MENUITEM', 'MENUCODE', 15, 'ITM', 0, CURRENT_DATE, 10);

DELIMITER $$

-- 2. Helper procedure to seed a single menu item with price band
DROP PROCEDURE IF EXISTS TMP_SEED_ONE_ITEM$$

CREATE PROCEDURE TMP_SEED_ONE_ITEM (
    IN p_shortname   VARCHAR(30),
    IN p_itemname    VARCHAR(100),
    IN p_descr       VARCHAR(255),
    IN p_isspecial   TINYINT,
    IN p_servcode    VARCHAR(20),
    IN p_isoffser    TINYINT,
    IN p_prices_json JSON,
    IN p_createdby   INT
)
BEGIN
    DECLARE v_service_id INT DEFAULT NULL;
    DECLARE v_menu_id    INT DEFAULT NULL;

    -- Resolve service ID if service code is specified
    IF p_servcode IS NOT NULL THEN
        SELECT SERVICEID INTO v_service_id 
        FROM CMS_SERVICE 
        WHERE SERVCODE = p_servcode 
        LIMIT 1;
    END IF;

    -- Create menu item via stored procedure if not already existing
    IF NOT EXISTS (SELECT 1 FROM CMS_MENUITEM WHERE ITEMNAME = p_itemname) THEN
        CALL CMSADDMENUITEM(p_shortname, p_itemname, p_descr, p_isspecial, v_service_id, p_isoffser, p_createdby);
    END IF;

    -- Look up the menu item ID
    SELECT MENUITEMID INTO v_menu_id 
    FROM CMS_MENUITEM 
    WHERE ITEMNAME = p_itemname 
    LIMIT 1;

    -- Attach complete 5-tier price band if not already configured
    IF v_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CMS_ITEMPRICE WHERE MENUITEMID = v_menu_id) THEN
        CALL CMSADDITEMPRICE(v_menu_id, '2025-01-01', p_prices_json, p_createdby);
    END IF;
END$$

-- 3. Batch seeding driver procedure
DROP PROCEDURE IF EXISTS TMP_SEED_ALL_MENUITEMS$$

CREATE PROCEDURE TMP_SEED_ALL_MENUITEMS()
BEGIN
    DECLARE v_mgr_id INT DEFAULT 2;

    -- Look up Canteen Manager ID (mgr1)
    SELECT USERID INTO v_mgr_id 
    FROM CMS_USER 
    WHERE LOGINID = 'mgr1' 
    LIMIT 1;

    IF v_mgr_id IS NULL THEN
        SET v_mgr_id = 2;
    END IF;

    -- ============================================================
    -- A. BREAKFAST SERVICE ITEMS
    -- ============================================================

    -- 1. Idli Vada with Sambar & Chutney
    CALL TMP_SEED_ONE_ITEM(
        'Idli Vada',
        'Idli Vada with Sambar & Chutney',
        'Steamed rice cakes (2 pcs) and crispy medu vada (1 pc) served with hot sambar and fresh coconut chutney.',
        0, 'BREAKFAST', 0,
        '[{"CTYPECODE":"PRM","PRICE":15.00},{"CTYPECODE":"CNT","PRICE":25.00},{"CTYPECODE":"OCE","PRICE":20.00},{"CTYPECODE":"VIS","PRICE":35.00},{"CTYPECODE":"OFF","PRICE":25.00}]',
        v_mgr_id
    );

    -- 2. Crispy Masala Dosa
    CALL TMP_SEED_ONE_ITEM(
        'Masala Dosa',
        'Masala Dosa',
        'Dosa with spiced potato masala, served with sambar and chutney.',
        0, 'BREAKFAST', 0,
        '[{"CTYPECODE":"PRM","PRICE":25.00},{"CTYPECODE":"CNT","PRICE":40.00},{"CTYPECODE":"OCE","PRICE":30.00},{"CTYPECODE":"VIS","PRICE":55.00},{"CTYPECODE":"OFF","PRICE":40.00}]',
        v_mgr_id
    );

    -- 3. Poori with Potato Sagu
    CALL TMP_SEED_ONE_ITEM(
        'Poori Sagu',
        'Poori with Spiced Potato Sagu',
        'pooris (3 pcs) served with traditional spiced potato sagu.',
        0, 'BREAKFAST', 0,
        '[{"CTYPECODE":"PRM","PRICE":20.00},{"CTYPECODE":"CNT","PRICE":35.00},{"CTYPECODE":"OCE","PRICE":25.00},{"CTYPECODE":"VIS","PRICE":45.00},{"CTYPECODE":"OFF","PRICE":35.00}]',
        v_mgr_id
    );

    -- 4. Kanda Poha
    CALL TMP_SEED_ONE_ITEM(
        'Kanda Poha',
        'Kanda Poha',
        'Flattened rice tempered with mustard, curry leaves, onions, turmeric, and roasted crunchy peanuts.',
        0, 'BREAKFAST', 0,
        '[{"CTYPECODE":"PRM","PRICE":12.00},{"CTYPECODE":"CNT","PRICE":20.00},{"CTYPECODE":"OCE","PRICE":15.00},{"CTYPECODE":"VIS","PRICE":30.00},{"CTYPECODE":"OFF","PRICE":20.00}]',
        v_mgr_id
    );

    -- ============================================================
    -- B. LUNCH SERVICE ITEMS
    -- ============================================================

    -- 5. Standard South Indian Lunch Thali (Base Meal)
    CALL TMP_SEED_ONE_ITEM(
        'South Thali',
        'South Indian Lunch Thali',
        'Steamed  rice, drumstick sambar, pepper rasam, seasonal vegetable poriyal, curd, appalam, and pickle.',
        0, 'LUNCH', 0,
        '[{"CTYPECODE":"PRM","PRICE":30.00},{"CTYPECODE":"CNT","PRICE":50.00},{"CTYPECODE":"OCE","PRICE":40.00},{"CTYPECODE":"VIS","PRICE":75.00},{"CTYPECODE":"OFF","PRICE":50.00}]',
        v_mgr_id
    );

    -- 6. Standard North Indian Lunch Thali
    CALL TMP_SEED_ONE_ITEM(
        'North Thali',
        'North Indian Lunch Thali',
        'Whole wheatchapati (3 pcs), dal tadka, paneer vegetable sabzi, steamed jeera rice, fresh curd, and salad.',
        0, 'LUNCH', 0,
        '[{"CTYPECODE":"PRM","PRICE":35.00},{"CTYPECODE":"CNT","PRICE":55.00},{"CTYPECODE":"OCE","PRICE":45.00},{"CTYPECODE":"VIS","PRICE":85.00},{"CTYPECODE":"OFF","PRICE":55.00}]',
        v_mgr_id
    );

    -- 7. Dum Vegetable Biryani (Special Item)
    CALL TMP_SEED_ONE_ITEM(
        'Veg Biryani',
        'Vegetable Biryani with Raita',
        'served with cooling onion raita.',
        1, 'LUNCH', 0,
        '[{"CTYPECODE":"PRM","PRICE":45.00},{"CTYPECODE":"CNT","PRICE":70.00},{"CTYPECODE":"OCE","PRICE":55.00},{"CTYPECODE":"VIS","PRICE":100.00},{"CTYPECODE":"OFF","PRICE":70.00}]',
        v_mgr_id
    );

    -- 8. Tempered Curd Rice
    CALL TMP_SEED_ONE_ITEM(
        'Curd Rice',
        'Tempered Curd Rice with Pickle',
        'Served with mango pickle.',
        0, 'LUNCH', 0,
        '[{"CTYPECODE":"PRM","PRICE":15.00},{"CTYPECODE":"CNT","PRICE":25.00},{"CTYPECODE":"OCE","PRICE":20.00},{"CTYPECODE":"VIS","PRICE":35.00},{"CTYPECODE":"OFF","PRICE":25.00}]',
        v_mgr_id
    );

    -- ============================================================
    -- C. EVENING SNACKS & TEA ITEMS
    -- ============================================================

    -- 9. Punjabi Samosa
    CALL TMP_SEED_ONE_ITEM(
        'Samosa',
        'Samosa',
        'Served with Chutney',
        0, 'SNACKS', 0,
        '[{"CTYPECODE":"PRM","PRICE":10.00},{"CTYPECODE":"CNT","PRICE":18.00},{"CTYPECODE":"OCE","PRICE":15.00},{"CTYPECODE":"VIS","PRICE":25.00},{"CTYPECODE":"OFF","PRICE":18.00}]',
        v_mgr_id
    );

    -- 10. Medu Vada Snack
    CALL TMP_SEED_ONE_ITEM(
        'Medu Vada',
        'Medu Vada',
        'Served with chutney.',
        0, 'SNACKS', 0,
        '[{"CTYPECODE":"PRM","PRICE":12.00},{"CTYPECODE":"CNT","PRICE":20.00},{"CTYPECODE":"OCE","PRICE":15.00},{"CTYPECODE":"VIS","PRICE":30.00},{"CTYPECODE":"OFF","PRICE":20.00}]',
        v_mgr_id
    );

    -- 11. Masala Chai
    CALL TMP_SEED_ONE_ITEM(
        'Tea',
        'Tea',
        'Tea',
        0, 'SNACKS', 0,
        '[{"CTYPECODE":"PRM","PRICE":7.00},{"CTYPECODE":"CNT","PRICE":12.00},{"CTYPECODE":"OCE","PRICE":10.00},{"CTYPECODE":"VIS","PRICE":15.00},{"CTYPECODE":"OFF","PRICE":12.00}]',
        v_mgr_id
    );
    -- 12. Coffee
    CALL TMP_SEED_ONE_ITEM(
        'Coffee',
        'Coffee',
        'Coffee',
        0, 'SNACKS', 0,
        '[{"CTYPECODE":"PRM","PRICE":7.00},{"CTYPECODE":"CNT","PRICE":12.00},{"CTYPECODE":"OCE","PRICE":10.00},{"CTYPECODE":"VIS","PRICE":15.00},{"CTYPECODE":"OFF","PRICE":12.00}]',
        v_mgr_id
    );

    -- ============================================================
    -- D. DINNER SERVICE ITEMS
    -- ============================================================

    -- 13. Dinner Chapati Meal
    CALL TMP_SEED_ONE_ITEM(
        'Chapati Meal',
        'Dinner Chapati Meal with Dal & Sabzi',
        'Fresh whole wheat chapatis (3 pcs), homestyle yellow dal fry, seasonal mixed vegetable sabzi, and green salad.',
        0, 'DINNER', 0,
        '[{"CTYPECODE":"PRM","PRICE":25.00},{"CTYPECODE":"CNT","PRICE":40.00},{"CTYPECODE":"OCE","PRICE":35.00},{"CTYPECODE":"VIS","PRICE":60.00},{"CTYPECODE":"OFF","PRICE":40.00}]',
        v_mgr_id
    );

    -- 14. Jeera Rice with Dal Tadka
    CALL TMP_SEED_ONE_ITEM(
        'Jeera Rice Dal',
        'Jeera Rice with Dal Tadka & Papad',
        'Fragrant cumin-tempered basmati rice served with double tadka arhar dal, roasted papad, and pickle.',
        0, 'DINNER', 0,
        '[{"CTYPECODE":"PRM","PRICE":25.00},{"CTYPECODE":"CNT","PRICE":40.00},{"CTYPECODE":"OCE","PRICE":35.00},{"CTYPECODE":"VIS","PRICE":60.00},{"CTYPECODE":"OFF","PRICE":40.00}]',
        v_mgr_id
    );
    SELECT 'Menu items and pricing bands seeded successfully' AS STATUS;
END$$

DELIMITER ;

CALL TMP_SEED_ALL_MENUITEMS();
DROP PROCEDURE IF EXISTS TMP_SEED_ALL_MENUITEMS;
DROP PROCEDURE IF EXISTS TMP_SEED_ONE_ITEM;

