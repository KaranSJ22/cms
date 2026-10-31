/**
 * Kiosk Module SQLite Query Catalog
 * Maps raw SQL queries to semantic, descriptive dictionary keys
 */
export const KIOSK_QUERIES = {
  // Look up customer by RFID UID or Login ID
  FIND_CUSTOMER_BY_IDENTIFIER: `
    SELECT * FROM cached_customers
    WHERE UPPER(rfid_uid) = ?
       OR UPPER(login_id) = ?
    LIMIT 1
  `,

  // Look up customer by RFID UID, Login ID, or numeric Customer ID
  FIND_CUSTOMER_BY_ID_OR_IDENTIFIER: `
    SELECT * FROM cached_customers
    WHERE UPPER(rfid_uid) = ?
       OR UPPER(login_id) = ?
       OR customer_id = ?
    LIMIT 1
  `,

  // Get customer cached wallet
  GET_CUSTOMER_WALLET: `
    SELECT * FROM cached_wallets
    WHERE customer_id = ?
    LIMIT 1
  `,

  // Get active pre-bookings from local central cache joined with slots
  GET_ACTIVE_PREBOOKINGS: `
    SELECT cap.customer_id, cap.service_id, cap.serv_date, cap.book_id, cap.token_no,
           cds.service_name, cds.start_time, cds.end_time
    FROM cached_active_prebookings cap
    LEFT JOIN cached_day_slots cds ON cds.service_id = cap.service_id AND cds.serv_date = cap.serv_date
    WHERE cap.customer_id = ? AND cap.serv_date >= ?
  `,

  // Get pending outbox bookings for customer joined with slots
  GET_PENDING_OUTBOX_BOOKINGS: `
    SELECT ob.offline_uuid, ob.token_no, ob.customer_id, ob.service_id, ob.serv_date,
           ob.items_json, ob.total_amount, ob.sync_status,
           cds.service_name, cds.start_time, cds.end_time
    FROM outbox_bookings ob
    LEFT JOIN cached_day_slots cds ON cds.service_id = ob.service_id AND cds.serv_date = ob.serv_date
    WHERE ob.customer_id = ? AND ob.serv_date >= ? AND ob.sync_status IN ('PENDING', 'SYNCING')
  `,

  // Get recent rejected outbox bookings to alert customer on badge scan
  GET_RECENT_DECLINED_BOOKINGS: `
    SELECT ob.offline_uuid, ob.token_no, ob.customer_id, ob.service_id, ob.serv_date,
           ob.items_json, ob.total_amount, ob.sync_error, ob.created_at,
           cds.service_name, cds.start_time, cds.end_time
    FROM outbox_bookings ob
    LEFT JOIN cached_day_slots cds ON cds.service_id = ob.service_id AND cds.serv_date = ob.serv_date
    WHERE ob.customer_id = ? AND ob.serv_date >= ? AND ob.sync_status = 'REJECTED'
    ORDER BY ob.created_at DESC
    LIMIT 3
  `,

  // Get upcoming published slots with meal counts for date & canteen
  GET_NEXT_DAY_SLOTS: `
    SELECT cds.*, COUNT(cmi.day_menu_id) AS total_items
    FROM cached_day_slots cds
    LEFT JOIN cached_menu_items cmi ON cmi.day_slot_id = cds.day_slot_id
    WHERE cds.serv_date = ? AND cds.canteen_id = ?
    GROUP BY cds.day_slot_id
    ORDER BY cds.start_time ASC
  `,

  // Base query for dishes for upcoming date & canteen
  GET_NEXT_DAY_MENU_ITEMS: `
    SELECT cmi.*, cds.service_id, cds.service_name, cds.start_time, cds.end_time
    FROM cached_menu_items cmi
    JOIN cached_day_slots cds ON cds.day_slot_id = cmi.day_slot_id
    WHERE cds.serv_date = ? AND cds.canteen_id = ?
  `,

  // Upsert or update cached wallet balance
  UPSERT_WALLET_BALANCE: `
    INSERT INTO cached_wallets (customer_id, balance, status_id, updated_at)
    VALUES (?, ?, 10, datetime('now'))
    ON CONFLICT(customer_id) DO UPDATE SET
      balance = excluded.balance,
      updated_at = datetime('now')
  `,

  // Upsert customer profile into cache
  UPSERT_CUSTOMER: `
    INSERT INTO cached_customers (customer_id, rfid_uid, login_id, disp_name, ctype_code, ctype_name)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(customer_id) DO UPDATE SET
      rfid_uid = excluded.rfid_uid,
      login_id = excluded.login_id,
      disp_name = excluded.disp_name,
      ctype_code = excluded.ctype_code,
      ctype_name = excluded.ctype_name
  `,

  // Upsert customer wallet into cache
  UPSERT_WALLET: `
    INSERT INTO cached_wallets (customer_id, balance, status_id, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(customer_id) DO UPDATE SET
      balance = excluded.balance,
      status_id = excluded.status_id,
      updated_at = datetime('now')
  `,
};
