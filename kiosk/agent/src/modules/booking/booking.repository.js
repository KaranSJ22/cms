import crypto from "crypto";
import { getDb, withTransaction } from "../../db/sqlite.js";
import { OUTBOX_STATUS } from "../../config/constants.js";
import { BOOKING_QUERIES } from "./booking.queries.js";

/**
 * Checks if customer already has an active pre-booking for this service date and meal slot
 */
export const checkExistingBooking = (customerId, serviceId, servDate) => {
  const db = getDb();

  // 1. Check cached active pre-bookings
  const active = db
    .prepare(BOOKING_QUERIES.CHECK_ACTIVE_PREBOOKING)
    .get(customerId, serviceId, servDate);
  if (active) return active;

  // 2. Check pending local outbox
  const outbox = db
    .prepare(BOOKING_QUERIES.CHECK_PENDING_OUTBOX_BOOKING)
    .get(customerId, serviceId, servDate);
  return outbox || null;
};

/**
 * Atomically saves offline pre-booking into outbox, updates active slots, and deducts local wallet view
 */
export const saveOfflinePreBooking = ({
  offlineUuid = null,
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
    const finalUuid = offlineUuid || crypto.randomUUID();
    const createdAt = new Date().toISOString();

    // 1. Insert into outbox queue (token numbers are deprecated for pre-booking)
    db.prepare(BOOKING_QUERIES.INSERT_OUTBOX_PREBOOKING).run(
      finalUuid,
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
    db.prepare(BOOKING_QUERIES.GUARD_ACTIVE_SLOT).run(
      customerId,
      serviceId,
      servDate,
      null,
      ""
    );

    // 3. Deduct local balance view for contract/visitor wallets
    if (isWalletEligible && totalAmount > 0) {
      db.prepare(BOOKING_QUERIES.DEDUCT_WALLET_BALANCE).run(totalAmount, customerId);
    }

    return {
      offlineUuid: finalUuid,
      createdAt,
    };
  });
};

/**
 * Cancels a pending offline booking in the local outbox
 */
export const cancelOfflinePreBooking = (identifier, customerId) => {
  return withTransaction((db) => {
    const booking = db
      .prepare(BOOKING_QUERIES.FIND_OUTBOX_BOOKING_BY_IDENTIFIER)
      .get(identifier, identifier, customerId);

    if (!booking) return false;

    // Mark cancelled in outbox so it won't be pushed centrally
    db.prepare(BOOKING_QUERIES.CANCEL_OUTBOX_BOOKING).run(booking.offline_uuid);

    // Remove active slot guard
    db.prepare(BOOKING_QUERIES.REMOVE_ACTIVE_SLOT_GUARD).run(
      customerId,
      booking.service_id,
      booking.serv_date
    );

    // Refund local wallet balance view if wallet was used
    if (booking.payment_method === "WALLET" && booking.total_amount > 0) {
      db.prepare(BOOKING_QUERIES.REFUND_WALLET_BALANCE).run(
        booking.total_amount,
        customerId
      );
    }

    return true;
  });
};

/**
 * Directly caches a confirmed pre-booking from central server in SQLite without outbox insertion
 */
export const cacheConfirmedPreBooking = ({
  customerId,
  serviceId,
  servDate,
  bookId,
  tokenNo,
}) => {
  const db = getDb();
  db.prepare(BOOKING_QUERIES.CACHE_CONFIRMED_PREBOOKING).run(
    customerId,
    serviceId,
    servDate,
    bookId,
    tokenNo || ""
  );
};

/**
 * Removes an active pre-booking guard after confirmed cancellation
 */
export const removeCachedActivePreBooking = (customerId, bookingId) => {
  const db = getDb();
  try {
    const isNum = !isNaN(Number(bookingId));
    if (isNum) {
      db.prepare(BOOKING_QUERIES.DELETE_CACHED_ACTIVE_NUMERIC).run(
        customerId,
        Number(bookingId),
        String(bookingId)
      );
    } else {
      db.prepare(BOOKING_QUERIES.DELETE_CACHED_ACTIVE_STRING).run(
        customerId,
        String(bookingId)
      );
    }
  } catch {
    // Ignore if not present
  }
};
