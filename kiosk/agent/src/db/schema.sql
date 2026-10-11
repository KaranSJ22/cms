-- ============================================================
-- CMS Kiosk Local SQLite Database Schema
-- Optimized for offline edge resilience on Raspberry Pi 5
-- ============================================================

-- 1. Cached Customers & Badges (Supports employees without RFID card)
CREATE TABLE IF NOT EXISTS cached_customers (
    customer_id INTEGER PRIMARY KEY,
    rfid_uid TEXT,                       -- NULLABLE for users without card
    login_id TEXT NOT NULL UNIQUE,       -- Real Employee ID (EMP1042 / ISRO-5421)
    disp_name TEXT NOT NULL,
    ctype_code TEXT NOT NULL,            -- 'REG', 'CONTEMP', 'VIS', 'PRM'
    ctype_name TEXT DEFAULT 'Employee'
);
CREATE INDEX IF NOT EXISTS ix_cust_rfid ON cached_customers(rfid_uid);
CREATE INDEX IF NOT EXISTS ix_cust_login ON cached_customers(login_id);

-- 2. Cached Contract & Visitor Wallets (For Local View & Validation)
CREATE TABLE IF NOT EXISTS cached_wallets (
    customer_id INTEGER PRIMARY KEY,
    balance REAL NOT NULL DEFAULT 0.00,
    status_id INTEGER DEFAULT 10,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 3. Upcoming Published Service Slots (Tomorrow & Future Dates)
CREATE TABLE IF NOT EXISTS cached_day_slots (
    day_slot_id INTEGER PRIMARY KEY,
    service_id INTEGER NOT NULL,
    service_name TEXT NOT NULL,
    serv_date TEXT NOT NULL,       -- 'YYYY-MM-DD'
    start_time TEXT NOT NULL,      -- 'HH:MM'
    end_time TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_slots_date ON cached_day_slots(serv_date);

-- 4. Kiosk-Enabled Dishes for Pre-booking
CREATE TABLE IF NOT EXISTS cached_menu_items (
    day_menu_id INTEGER PRIMARY KEY,
    day_slot_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    rate REAL NOT NULL,
    is_base INTEGER DEFAULT 0,
    is_special INTEGER DEFAULT 0,
    max_qty INTEGER DEFAULT 1,
    book_until TEXT,
    FOREIGN KEY(day_slot_id) REFERENCES cached_day_slots(day_slot_id)
);
CREATE INDEX IF NOT EXISTS ix_menu_slot ON cached_menu_items(day_slot_id);

-- 5. Active Pre-bookings (Prevents double-booking same slot offline)
CREATE TABLE IF NOT EXISTS cached_active_prebookings (
    customer_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    serv_date TEXT NOT NULL,
    book_id INTEGER,
    token_no TEXT,
    PRIMARY KEY(customer_id, service_id, serv_date)
);

-- 6. Deprecate local_token_seq (Queue tokens removed for pre-booking)
DROP TABLE IF EXISTS local_token_seq;

-- 7. Outbox (FIFO Queue for Central Sync)
CREATE TABLE IF NOT EXISTS outbox_bookings (
    offline_uuid TEXT PRIMARY KEY,
    kiosk_code TEXT NOT NULL,        -- 'K1'
    token_no TEXT,                   -- NULLABLE (tokens deprecated)
    customer_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    serv_date TEXT NOT NULL,
    items_json TEXT NOT NULL,        -- JSON string of [{ dayMenuId, menuItemId, qty, rate }]
    total_amount REAL NOT NULL,
    payment_method TEXT NOT NULL,    -- 'OFFICIAL' | 'WALLET'
    created_at TEXT NOT NULL,
    sync_status TEXT DEFAULT 'PENDING', -- 'PENDING', 'SYNCING', 'SYNCED', 'REJECTED', 'RETRYABLE_ERROR'
    retry_count INTEGER DEFAULT 0,
    synced_at TEXT,
    sync_error TEXT
);
CREATE INDEX IF NOT EXISTS ix_outbox_status_created ON outbox_bookings(sync_status, created_at);

-- 8. System Meta (Stores last master sync timestamp for HTTP 304 protocol)
CREATE TABLE IF NOT EXISTS system_meta (
    meta_key TEXT PRIMARY KEY,
    meta_value TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
