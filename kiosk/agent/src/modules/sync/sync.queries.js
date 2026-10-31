/**
 * Sync Module SQLite Query Catalog
 * Maps raw SQL queries to semantic, descriptive dictionary keys
 */
export const SYNC_QUERIES = {
  // 1. Uplink Booking Outbox Queries
  GET_PENDING_OUTBOX_CHUNK: `
    SELECT * FROM outbox_bookings
    WHERE sync_status IN (?, ?)
      AND retry_count < ?
    ORDER BY created_at ASC
    LIMIT ?
  `,

  BUILD_MARK_SYNCING_SQL: (placeholders) => `
    UPDATE outbox_bookings
    SET sync_status = ?
    WHERE offline_uuid IN (${placeholders})
  `,

  MARK_BOOKING_SYNCED: `
    UPDATE outbox_bookings
    SET sync_status = ?, synced_at = ?
    WHERE offline_uuid = ?
  `,

  MARK_BOOKING_REJECTED: `
    UPDATE outbox_bookings
    SET sync_status = ?, sync_error = ?
    WHERE offline_uuid = ?
  `,

  FIND_BOOKING_FOR_ROLLBACK: `
    SELECT customer_id, service_id, serv_date, total_amount, payment_method
    FROM outbox_bookings
    WHERE offline_uuid = ?
  `,

  DELETE_ACTIVE_GUARD: `
    DELETE FROM cached_active_prebookings
    WHERE customer_id = ? AND service_id = ? AND serv_date = ?
  `,

  REFUND_WALLET: `
    UPDATE cached_wallets
    SET balance = balance + ?
    WHERE customer_id = ?
  `,

  BUILD_MARK_RETRYABLE_SQL: (placeholders) => `
    UPDATE outbox_bookings
    SET sync_status = ?, retry_count = retry_count + 1, sync_error = ?
    WHERE offline_uuid IN (${placeholders})
  `,

  GET_PENDING_OUTBOX_COUNT: `
    SELECT COUNT(*) AS count
    FROM outbox_bookings
    WHERE sync_status IN ('PENDING', 'SYNCING', 'RETRYABLE_ERROR')
  `,

  PURGE_HISTORICAL_OUTBOX: `
    DELETE FROM outbox_bookings
    WHERE sync_status IN ('SYNCED', 'CANCELLED')
      AND created_at < datetime('now', '-' || ? || ' days')
  `,

  // 2. Downlink Ingestion Queries
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

  GET_PENDING_WALLET_DEDUCTIONS: `
    SELECT COALESCE(SUM(total_amount), 0) AS total
    FROM outbox_bookings
    WHERE customer_id = ?
      AND sync_status IN ('PENDING', 'SYNCING')
      AND payment_method = 'WALLET'
  `,

  UPSERT_WALLET: `
    INSERT INTO cached_wallets (customer_id, balance, status_id, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(customer_id) DO UPDATE SET
      balance = excluded.balance,
      status_id = excluded.status_id,
      updated_at = datetime('now')
  `,

  UPSERT_DAY_SLOT: `
    INSERT INTO cached_day_slots (day_slot_id, canteen_id, service_id, service_name, serv_date, start_time, end_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(day_slot_id) DO UPDATE SET
      canteen_id = excluded.canteen_id,
      service_id = excluded.service_id,
      service_name = excluded.service_name,
      serv_date = excluded.serv_date,
      start_time = excluded.start_time,
      end_time = excluded.end_time
  `,

  PRUNE_FOREIGN_MENU_ITEMS: `
    DELETE FROM cached_menu_items
    WHERE day_slot_id IN (SELECT day_slot_id FROM cached_day_slots WHERE canteen_id != ?)
  `,

  PRUNE_FOREIGN_DAY_SLOTS: `
    DELETE FROM cached_day_slots
    WHERE canteen_id != ?
  `,

  CHECK_DAY_SLOT_EXISTS: `
    SELECT 1 FROM cached_day_slots
    WHERE day_slot_id = ?
  `,

  UPSERT_MENU_ITEM: `
    INSERT INTO cached_menu_items (
      day_menu_id, day_slot_id, menu_item_id, item_name, rate, is_base, is_special, max_qty, book_until
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(day_menu_id) DO UPDATE SET
      day_slot_id = excluded.day_slot_id,
      menu_item_id = excluded.menu_item_id,
      item_name = excluded.item_name,
      rate = excluded.rate,
      is_base = excluded.is_base,
      is_special = excluded.is_special,
      max_qty = excluded.max_qty,
      book_until = excluded.book_until
  `,

  UPSERT_ACTIVE_PREBOOKING: `
    INSERT INTO cached_active_prebookings (customer_id, service_id, serv_date, book_id, token_no)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(customer_id, service_id, serv_date) DO UPDATE SET
      book_id = excluded.book_id,
      token_no = excluded.token_no
  `,

  UPSERT_TODAY_BOOKING: `
    INSERT INTO cached_today_bookings (
      book_id, book_no, customer_id, login_id, rfid_uid, disp_name, ctype_code,
      service_id, day_slot_id, slot_name, status_code, served_by, served_on, total_amount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(book_id) DO UPDATE SET
      status_code = excluded.status_code,
      served_by = excluded.served_by,
      served_on = excluded.served_on,
      total_amount = excluded.total_amount
  `,

  CHECK_TODAY_BOOKING_EXISTS: `
    SELECT 1 FROM cached_today_bookings
    WHERE book_id = ?
  `,

  UPSERT_TODAY_BOOK_ITEM: `
    INSERT INTO cached_today_bookitems (
      book_item_id, book_id, menu_item_id, item_name, qty, rate
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(book_item_id) DO UPDATE SET
      qty = excluded.qty,
      rate = excluded.rate
  `,

  PRUNE_ORPHAN_TODAY_BOOK_ITEMS: `
    DELETE FROM cached_today_bookitems
    WHERE book_id NOT IN (SELECT book_id FROM cached_today_bookings)
  `,

  // 3. System Metadata Queries
  GET_SYSTEM_META: `
    SELECT meta_value FROM system_meta
    WHERE meta_key = ?
  `,

  SET_SYSTEM_META: `
    INSERT INTO system_meta (meta_key, meta_value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(meta_key) DO UPDATE SET
      meta_value = excluded.meta_value,
      updated_at = datetime('now')
  `,

  // 4. Uplink Serving Outbox Queries
  GET_PENDING_SERVING_EVENTS: `
    SELECT * FROM outbox_serving_events
    WHERE sync_status IN ('PENDING', 'ERROR')
    ORDER BY event_id ASC
    LIMIT ?
  `,

  BUILD_MARK_SERVING_SYNCING_SQL: (placeholders) => `
    UPDATE outbox_serving_events
    SET sync_status = 'SYNCING'
    WHERE event_uuid IN (${placeholders})
  `,

  MARK_SERVING_EVENT_SYNCED: `
    UPDATE outbox_serving_events
    SET sync_status = 'SYNCED', synced_at = datetime('now')
    WHERE event_uuid = ?
  `,

  MARK_SERVING_EVENT_ERROR: `
    UPDATE outbox_serving_events
    SET sync_status = 'ERROR', error_message = ?
    WHERE event_uuid = ?
  `,

  BUILD_MARK_SERVING_ERROR_SQL: (placeholders) => `
    UPDATE outbox_serving_events
    SET sync_status = 'ERROR', error_message = ?
    WHERE event_uuid IN (${placeholders})
  `,

  PURGE_HISTORICAL_SERVING_OUTBOX: `
    DELETE FROM outbox_serving_events
    WHERE sync_status = 'SYNCED'
      AND created_at < datetime('now', '-' || ? || ' days')
  `,
};
