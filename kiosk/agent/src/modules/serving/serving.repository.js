import { getDb } from "../../db/sqlite.js";
import { SERVING_QUERIES } from "./serving.queries.js";
import { logger } from "../../utils/logger.js";

/**
 * Looks up today's meal booking in local SQLite manifest by RFID UID, Employee Code/Login ID, or Book No
 */
export const findTodayBookingByIdentifier = (identifier) => {
  const db = getDb();
  const upper = String(identifier).trim().toUpperCase();
  return db.prepare(SERVING_QUERIES.FIND_TODAY_BOOKING).get(upper, upper, upper) || null;
};

/**
 * Retrieves line items and rates for a given booking ID from local cache
 */
export const getBookingLineItems = (bookId) => {
  const db = getDb();
  return db.prepare(SERVING_QUERIES.GET_BOOKING_ITEMS).all(Number(bookId));
};

/**
 * Updates local booking status to 'SRV' (Served)
 */
export const markBookingServedLocally = (bookId, staffUserId = 1) => {
  try {
    const db = getDb();
    db.prepare(SERVING_QUERIES.MARK_BOOKING_SERVED).run(Number(staffUserId || 1), Number(bookId));
  } catch (err) {
    logger.warn({ err: err.message, bookId }, "Failed to update local booking status to SRV");
  }
};

/**
 * Queues a counter serving event into outbox_serving_events for uplink sync
 */
export const queueServingOutboxEvent = (eventUuid, payload) => {
  const db = getDb();
  db.prepare(SERVING_QUERIES.INSERT_SERVING_OUTBOX_EVENT).run(
    eventUuid,
    typeof payload === "string" ? payload : JSON.stringify(payload)
  );
};

/**
 * Updates local booking status to 'CAN' (Cancelled)
 */
export const markBookingCancelledLocally = (bookId) => {
  try {
    const db = getDb();
    db.prepare(SERVING_QUERIES.MARK_BOOKING_CANCELLED).run(Number(bookId));
  } catch (err) {
    logger.warn({ err: err.message, bookId }, "Failed to update local booking status to CAN");
  }
};

/**
 * Resolves customer profile and cached wallet for walk-in meal order
 */
export const findWalkinCustomerProfile = (identifier) => {
  const db = getDb();
  const clean = String(identifier).trim();
  const upper = clean.toUpperCase();
  const numericId = isNaN(Number(clean)) ? -1 : Number(clean);
  return db.prepare(SERVING_QUERIES.FIND_WALKIN_CUSTOMER_WALLET).get(upper, upper, numericId) || null;
};

/**
 * Retrieves today's available meal slot menu items from local cache
 */
export const getWalkinSlotMenuItems = () => {
  const db = getDb();
  return db.prepare(SERVING_QUERIES.GET_WALKIN_MENU_ITEMS).all();
};

/**
 * Queues a walk-in serving event into outbox_serving_events for uplink sync
 */
export const queueWalkinOutboxEvent = (eventUuid, payload) => {
  const db = getDb();
  db.prepare(SERVING_QUERIES.INSERT_WALKIN_OUTBOX_EVENT).run(
    eventUuid,
    typeof payload === "string" ? payload : JSON.stringify(payload)
  );
};
