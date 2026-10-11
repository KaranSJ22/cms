import { getDb } from "../../db/sqlite.js";

/**
 * Resolves a customer profile from local SQLite cache by RFID UID, Login ID / Employee Code, or Customer ID
 */
export const findCustomerByIdentifier = (identifier) => {
  const db = getDb();
  const clean = String(identifier).trim().toUpperCase();

  const isNumeric = /^\d+$/.test(clean);
  const query = `
    SELECT * FROM cached_customers
    WHERE UPPER(rfid_uid) = ?
       OR UPPER(login_id) = ?
       ${isNumeric ? "OR customer_id = ?" : ""}
    LIMIT 1
  `;
  const params = isNumeric ? [clean, clean, Number(clean)] : [clean, clean];

  return db.prepare(query).get(...params) || null;
};

/**
 * Retrieves cached wallet balance for contract workers or visitors
 */
export const getCustomerWallet = (customerId) => {
  const db = getDb();
  return db
    .prepare("SELECT * FROM cached_wallets WHERE customer_id = ? LIMIT 1")
    .get(customerId);
};

/**
 * Retrieves active pre-bookings from both cached active table and local outbox
 */
export const getCustomerActiveBookings = (customerId, targetDate) => {
  const db = getDb();

  // Active bookings from central cache + locally queued outbox bookings
  const cachedRows = db
    .prepare(
      `SELECT cap.customer_id, cap.service_id, cap.serv_date, cap.book_id, cap.token_no,
              cds.service_name, cds.start_time, cds.end_time
       FROM cached_active_prebookings cap
       LEFT JOIN cached_day_slots cds ON cds.service_id = cap.service_id AND cds.serv_date = cap.serv_date
       WHERE cap.customer_id = ? AND cap.serv_date >= ?`
    )
    .all(customerId, targetDate);

  const outboxRows = db
    .prepare(
      `SELECT ob.offline_uuid, ob.token_no, ob.customer_id, ob.service_id, ob.serv_date,
              ob.items_json, ob.total_amount, ob.sync_status,
              cds.service_name, cds.start_time, cds.end_time
       FROM outbox_bookings ob
       LEFT JOIN cached_day_slots cds ON cds.service_id = ob.service_id AND cds.serv_date = ob.serv_date
       WHERE ob.customer_id = ? AND ob.serv_date >= ? AND ob.sync_status != 'REJECTED'`
    )
    .all(customerId, targetDate);

  return { cachedRows, outboxRows };
};

/**
 * Gets tomorrow's available meal service slots
 */
export const getNextDaySlots = (servDate) => {
  const db = getDb();
  return db
    .prepare(
      `SELECT cds.*, COUNT(cmi.day_menu_id) AS total_items
       FROM cached_day_slots cds
       LEFT JOIN cached_menu_items cmi ON cmi.day_slot_id = cds.day_slot_id
       WHERE cds.serv_date = ?
       GROUP BY cds.day_slot_id
       ORDER BY cds.start_time ASC`
    )
    .all(servDate);
};

/**
 * Gets tomorrow's dishes grouped by service
 */
export const getNextDayMenuItems = (servDate, serviceId = null) => {
  const db = getDb();

  let query = `
    SELECT cmi.*, cds.service_id, cds.service_name, cds.start_time, cds.end_time
    FROM cached_menu_items cmi
    JOIN cached_day_slots cds ON cds.day_slot_id = cmi.day_slot_id
    WHERE cds.serv_date = ?
  `;
  const params = [servDate];

  if (serviceId) {
    query += " AND cds.service_id = ?";
    params.push(Number(serviceId));
  }

  query += " ORDER BY cds.start_time ASC, cmi.item_name ASC";
  return db.prepare(query).all(...params);
};
