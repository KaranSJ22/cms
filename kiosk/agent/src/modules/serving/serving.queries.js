/**
 * Serving Module SQLite Query Catalog
 * Maps raw SQL queries to semantic, descriptive dictionary keys
 */
export const SERVING_QUERIES = {
  // Look up today's meal booking by RFID UID, Employee Code/Login ID, or Book No
  FIND_TODAY_BOOKING: `
    SELECT * FROM cached_today_bookings
    WHERE (UPPER(rfid_uid) = ? OR UPPER(login_id) = ? OR UPPER(book_no) = ?)
    ORDER BY CASE WHEN status_code = 'CRT' THEN 0 ELSE 1 END ASC, book_id DESC
    LIMIT 1
  `,

  // Fetch line items and totals for a specific booking from local cache
  GET_BOOKING_ITEMS: `
    SELECT book_item_id AS BOOKITEMID, menu_item_id AS MENUITEMID, item_name AS ITEMNAME,
           qty AS QTY, rate AS RATE, (qty * rate) AS AMOUNT
    FROM cached_today_bookitems
    WHERE book_id = ?
  `,

  // Mark local booking status as served
  MARK_BOOKING_SERVED: `
    UPDATE cached_today_bookings
    SET status_code = 'SRV', served_by = ?, served_on = datetime('now')
    WHERE book_id = ?
  `,

  // Queue offline meal serving event into outbox
  INSERT_SERVING_OUTBOX_EVENT: `
    INSERT INTO outbox_serving_events (event_uuid, event_type, payload_json, created_at, sync_status)
    VALUES (?, 'SERVE', ?, datetime('now'), 'PENDING')
  `,

  // Mark local booking status as cancelled
  MARK_BOOKING_CANCELLED: `
    UPDATE cached_today_bookings
    SET status_code = 'CAN'
    WHERE book_id = ?
  `,

  // Resolve walk-in customer profile and cached wallet balance
  FIND_WALKIN_CUSTOMER_WALLET: `
    SELECT c.*, COALESCE(w.balance, 0.0) AS wallet_balance
    FROM cached_customers c
    LEFT JOIN cached_wallets w ON w.customer_id = c.customer_id
    WHERE UPPER(c.rfid_uid) = ? OR UPPER(c.login_id) = ? OR c.customer_id = ?
    LIMIT 1
  `,

  // Query available meal slot items for counter walk-in
  GET_WALKIN_MENU_ITEMS: `
    SELECT m.*, s.service_id, s.service_name
    FROM cached_menu_items m
    JOIN cached_day_slots s ON s.day_slot_id = m.day_slot_id
    LIMIT 30
  `,

  // Queue offline walk-in serving event into outbox
  INSERT_WALKIN_OUTBOX_EVENT: `
    INSERT INTO outbox_serving_events (event_uuid, event_type, payload_json, created_at, sync_status)
    VALUES (?, 'WALKIN_SERVE', ?, datetime('now'), 'PENDING')
  `,
};
