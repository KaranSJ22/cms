/**
 * Booking Module SQLite Query Catalog
 * Maps raw SQL queries to semantic, descriptive dictionary keys
 */
export const BOOKING_QUERIES = {
  // Check if customer already has active pre-booking in central cache
  CHECK_ACTIVE_PREBOOKING: `
    SELECT * FROM cached_active_prebookings
    WHERE customer_id = ? AND service_id = ? AND serv_date = ?
    LIMIT 1
  `,

  // Check if customer has an in-flight booking in local outbox
  CHECK_PENDING_OUTBOX_BOOKING: `
    SELECT * FROM outbox_bookings
    WHERE customer_id = ? AND service_id = ? AND serv_date = ?
      AND sync_status NOT IN ('REJECTED', 'CANCELLED')
    LIMIT 1
  `,

  // Insert offline pre-booking record into outbox queue
  INSERT_OUTBOX_PREBOOKING: `
    INSERT INTO outbox_bookings (
      offline_uuid, kiosk_code, token_no, customer_id, service_id,
      serv_date, items_json, total_amount, payment_method, created_at, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,

  // Guard against offline double-booking for slot
  GUARD_ACTIVE_SLOT: `
    INSERT OR REPLACE INTO cached_active_prebookings (customer_id, service_id, serv_date, book_id, token_no)
    VALUES (?, ?, ?, ?, ?)
  `,

  // Deduct local wallet balance view for contract/visitor wallets
  DEDUCT_WALLET_BALANCE: `
    UPDATE cached_wallets
    SET balance = MAX(0, balance - ?)
    WHERE customer_id = ?
  `,

  // Look up outbox booking by UUID or token number
  FIND_OUTBOX_BOOKING_BY_IDENTIFIER: `
    SELECT * FROM outbox_bookings
    WHERE (offline_uuid = ? OR token_no = ?) AND customer_id = ?
  `,

  // Mark pending outbox booking as cancelled locally
  CANCEL_OUTBOX_BOOKING: `
    UPDATE outbox_bookings
    SET sync_status = 'CANCELLED', sync_error = 'Cancelled locally by user'
    WHERE offline_uuid = ?
  `,

  // Remove active pre-booking guard by date and slot
  REMOVE_ACTIVE_SLOT_GUARD: `
    DELETE FROM cached_active_prebookings
    WHERE customer_id = ? AND service_id = ? AND serv_date = ?
  `,

  // Refund wallet balance view upon outbox booking cancellation
  REFUND_WALLET_BALANCE: `
    UPDATE cached_wallets
    SET balance = balance + ?
    WHERE customer_id = ?
  `,

  // Directly cache confirmed central pre-booking in local SQLite
  CACHE_CONFIRMED_PREBOOKING: `
    INSERT INTO cached_active_prebookings (customer_id, service_id, serv_date, book_id, token_no)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(customer_id, service_id, serv_date) DO UPDATE SET
      book_id = excluded.book_id,
      token_no = excluded.token_no
  `,

  // Delete cached active pre-booking by booking ID or token number
  DELETE_CACHED_ACTIVE_NUMERIC: `
    DELETE FROM cached_active_prebookings
    WHERE customer_id = ? AND (book_id = ? OR token_no = ?)
  `,

  // Delete cached active pre-booking by token number string
  DELETE_CACHED_ACTIVE_STRING: `
    DELETE FROM cached_active_prebookings
    WHERE customer_id = ? AND token_no = ?
  `,
};
