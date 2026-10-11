import crypto from "crypto";
import { getDb, withTransaction } from "../../db/sqlite.js";
import { OUTBOX_STATUS } from "../../config/constants.js";

/**
 * Checks if customer already has an active pre-booking for this service date and meal slot
 */
export const checkExistingBooking = (customerId, serviceId, servDate) => {
  const db = getDb();

  // 1. Check cached active pre-bookings
  const active = db
    .prepare(
      "SELECT * FROM cached_active_prebookings WHERE customer_id = ? AND service_id = ? AND serv_date = ? LIMIT 1"
    )
    .get(customerId, serviceId, servDate);
  if (active) return active;

  // 2. Check pending local outbox
  const outbox = db
    .prepare(
      "SELECT * FROM outbox_bookings WHERE customer_id = ? AND service_id = ? AND serv_date = ? AND sync_status NOT IN ('REJECTED', 'CANCELLED') LIMIT 1"
    )
    .get(customerId, serviceId, servDate);
  return outbox || null;
};

/**
 * Atomically saves offline pre-booking into outbox, updates active slots, and deducts local wallet view
 */
export const saveOfflinePreBooking = ({
  kioskCode,
  customerId,
  serviceId,
  servDate,
  items,
  totalAmount,
  paymentMethod,
  isWalletEligible,
}) => {
  return withTransaction((db) => {
    const offlineUuid = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    // 1. Insert into outbox queue (token numbers are deprecated for pre-booking)
    db.prepare(
      `INSERT INTO outbox_bookings (
        offline_uuid, kiosk_code, token_no, customer_id, service_id,
        serv_date, items_json, total_amount, payment_method, created_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      offlineUuid,
      kioskCode,
      "",
      customerId,
      serviceId,
      servDate,
      JSON.stringify(items),
      totalAmount,
      paymentMethod,
      createdAt,
      OUTBOX_STATUS.PENDING
    );

    // 2. Guard against duplicate bookings
    db.prepare(
      `INSERT OR REPLACE INTO cached_active_prebookings (customer_id, service_id, serv_date, book_id, token_no)
       VALUES (?, ?, ?, ?, ?)`
    ).run(customerId, serviceId, servDate, null, "");

    // 3. Deduct local balance view for contract/visitor wallets
    if (isWalletEligible && totalAmount > 0) {
      db.prepare(
        "UPDATE cached_wallets SET balance = MAX(0, balance - ?) WHERE customer_id = ?"
      ).run(totalAmount, customerId);
    }

    return {
      offlineUuid,
      createdAt,
    };
  });
};

/**
 * Cancels a pending offline booking in the local outbox
 */
export const cancelOfflinePreBooking = (offlineUuid, customerId) => {
  return withTransaction((db) => {
    const booking = db
      .prepare("SELECT * FROM outbox_bookings WHERE offline_uuid = ? AND customer_id = ?")
      .get(offlineUuid, customerId);

    if (!booking) return false;

    // Mark cancelled in outbox so it won't be pushed centrally
    db.prepare(
      "UPDATE outbox_bookings SET sync_status = 'CANCELLED', sync_error = 'Cancelled locally by user' WHERE offline_uuid = ?"
    ).run(offlineUuid);

    // Remove active slot guard
    db.prepare(
      "DELETE FROM cached_active_prebookings WHERE customer_id = ? AND service_id = ? AND serv_date = ?"
    ).run(customerId, booking.service_id, booking.serv_date);

    // Refund local wallet balance view if wallet was used
    if (booking.payment_method === "WALLET" && booking.total_amount > 0) {
      db.prepare(
        "UPDATE cached_wallets SET balance = balance + ? WHERE customer_id = ?"
      ).run(booking.total_amount, customerId);
    }

    return true;
  });
};
