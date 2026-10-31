import { getDb } from "../../db/sqlite.js";
import { env } from "../../config/env.js";
import { KIOSK_QUERIES } from "./kiosk.queries.js";

/**
 * Resolves a customer profile from local SQLite cache by RFID UID, Login ID / Employee Code, or Customer ID
 */
export const findCustomerByIdentifier = (identifier) => {
  const db = getDb();
  const clean = String(identifier).trim().toUpperCase();
  const isNumeric = /^\d+$/.test(clean);

  if (isNumeric) {
    return (
      db.prepare(KIOSK_QUERIES.FIND_CUSTOMER_BY_ID_OR_IDENTIFIER).get(clean, clean, Number(clean)) || null
    );
  }

  return db.prepare(KIOSK_QUERIES.FIND_CUSTOMER_BY_IDENTIFIER).get(clean, clean) || null;
};

/**
 * Retrieves cached wallet balance for contract workers or visitors
 */
export const getCustomerWallet = (customerId) => {
  const db = getDb();
  return db.prepare(KIOSK_QUERIES.GET_CUSTOMER_WALLET).get(customerId);
};

/**
 * Retrieves active pre-bookings from both cached active table and local outbox
 */
export const getCustomerActiveBookings = (customerId, targetDate) => {
  const db = getDb();
  const cachedRows = db.prepare(KIOSK_QUERIES.GET_ACTIVE_PREBOOKINGS).all(customerId, targetDate);
  const outboxRows = db.prepare(KIOSK_QUERIES.GET_PENDING_OUTBOX_BOOKINGS).all(customerId, targetDate);
  return { cachedRows, outboxRows };
};

/**
 * Retrieves recent declined/rejected bookings for a customer to alert them on card tap
 */
export const getRecentDeclinedBookings = (customerId, targetDate) => {
  const db = getDb();
  return db.prepare(KIOSK_QUERIES.GET_RECENT_DECLINED_BOOKINGS).all(customerId, targetDate);
};

/**
 * Gets tomorrow's available meal service slots for the terminal's configured canteen
 */
export const getNextDaySlots = (servDate) => {
  const db = getDb();
  return db.prepare(KIOSK_QUERIES.GET_NEXT_DAY_SLOTS).all(servDate, Number(env.CANTEEN_ID || 1));
};

/**
 * Gets tomorrow's dishes grouped by service for the terminal's configured canteen
 */
export const getNextDayMenuItems = (servDate, serviceId = null) => {
  const db = getDb();
  let query = KIOSK_QUERIES.GET_NEXT_DAY_MENU_ITEMS;
  const params = [servDate, Number(env.CANTEEN_ID || 1)];

  if (serviceId) {
    query += " AND cds.service_id = ?";
    params.push(Number(serviceId));
  }

  query += " ORDER BY cds.start_time ASC, cmi.item_name ASC";
  return db.prepare(query).all(...params);
};

/**
 * Updates cached wallet balance for a customer
 */
export const updateWalletBalance = (customerId, balance) => {
  const db = getDb();
  db.prepare(KIOSK_QUERIES.UPSERT_WALLET_BALANCE).run(Number(customerId), Number(balance));
};

/**
 * Upserts customer profile into local SQLite cache
 */
export const upsertCustomerCache = (customer) => {
  if (!customer) return;
  const db = getDb();
  const rawRfid = (customer.rfidUid || customer.RFIDUID || "").trim();
  const rawLoginId = (
    customer.loginId ||
    customer.LOGINID ||
    customer.customerId ||
    customer.CUSTOMERID ||
    ""
  ).toString().trim();

  db.prepare(KIOSK_QUERIES.UPSERT_CUSTOMER).run(
    customer.customerId || customer.CUSTOMERID,
    rawRfid ? rawRfid.toUpperCase() : null,
    rawLoginId ? rawLoginId.toUpperCase() : `CUST-${customer.customerId || customer.CUSTOMERID}`,
    customer.displayName || customer.DISPNAME || "Employee",
    customer.customerTypeCode || customer.CTYPECODE || "PRM",
    customer.customerTypeName || customer.CTYPENAME || "Employee"
  );
};

/**
 * Upserts customer wallet into local SQLite cache
 */
export const upsertWalletCache = (customerId, wallet) => {
  if (!wallet) return;
  const db = getDb();
  db.prepare(KIOSK_QUERIES.UPSERT_WALLET).run(
    Number(customerId),
    Number(wallet.balance ?? wallet.BALANCE ?? 0),
    Number(wallet.statusId ?? wallet.STATUSID ?? 10)
  );
};
