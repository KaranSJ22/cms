import { getDb, withTransaction } from "../../db/sqlite.js";
import { OUTBOX_STATUS, SYNC_CONFIG } from "../../config/constants.js";

/**
 * Retrieves the oldest pending or retryable outbox bookings in FIFO order
 */
export const getPendingOutboxChunk = (limit = SYNC_CONFIG.DEFAULT_CHUNK_SIZE) => {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM outbox_bookings
       WHERE sync_status IN (?, ?)
         AND retry_count < ?
       ORDER BY created_at ASC
       LIMIT ?`
    )
    .all(OUTBOX_STATUS.PENDING, OUTBOX_STATUS.RETRYABLE_ERROR, SYNC_CONFIG.MAX_RETRY_COUNT, limit);
};

/**
 * Marks a batch of outbox bookings as currently SYNCING
 */
export const markChunkSyncing = (offlineUuids) => {
  if (!offlineUuids.length) return;
  const db = getDb();
  const placeholders = offlineUuids.map(() => "?").join(",");

  db.prepare(
    `UPDATE outbox_bookings
     SET sync_status = ?
     WHERE offline_uuid IN (${placeholders})`
  ).run(OUTBOX_STATUS.SYNCING, ...offlineUuids);
};

/**
 * Applies itemized sub-transaction responses from central server
 */
export const applyItemizedResults = (results = []) => {
  return withTransaction((db) => {
    const updateSuccess = db.prepare(
      `UPDATE outbox_bookings
       SET sync_status = ?, synced_at = ?
       WHERE offline_uuid = ?`
    );

    const updateRejected = db.prepare(
      `UPDATE outbox_bookings
       SET sync_status = ?, sync_error = ?
       WHERE offline_uuid = ?`
    );

    const now = new Date().toISOString();

    for (const item of results) {
      if (item.status === OUTBOX_STATUS.SYNCED) {
        updateSuccess.run(OUTBOX_STATUS.SYNCED, now, item.offlineUuid);
      } else if (item.status === OUTBOX_STATUS.REJECTED) {
        updateRejected.run(
          OUTBOX_STATUS.REJECTED,
          item.message || item.errorCode || "Rejected by central server",
          item.offlineUuid
        );
      }
    }
  });
};

/**
 * Resets a failed chunk back to RETRYABLE_ERROR with incremented retry count
 */
export const markChunkRetryable = (offlineUuids, errorMessage) => {
  if (!offlineUuids.length) return;
  const db = getDb();
  const placeholders = offlineUuids.map(() => "?").join(",");

  db.prepare(
    `UPDATE outbox_bookings
     SET sync_status = ?, retry_count = retry_count + 1, sync_error = ?
     WHERE offline_uuid IN (${placeholders})`
  ).run(OUTBOX_STATUS.RETRYABLE_ERROR, errorMessage, ...offlineUuids);
};

/**
 * Counts currently pending bookings in outbox
 */
export const getPendingOutboxCount = () => {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT COUNT(*) AS count FROM outbox_bookings WHERE sync_status IN ('PENDING', 'SYNCING', 'RETRYABLE_ERROR')"
    )
    .get();
  return row ? Number(row.count) : 0;
};

/**
 * Upserts downlink bootstrap snapshot into local SQLite cache
 */
export const upsertDownlinkSnapshot = ({
  customers = [],
  wallets = [],
  daySlots = [],
  menuItems = [],
}) => {
  return withTransaction((db) => {
    // 1. Customers
    const insertCustomer = db.prepare(
      `INSERT INTO cached_customers (customer_id, rfid_uid, login_id, disp_name, ctype_code, ctype_name)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(customer_id) DO UPDATE SET
         rfid_uid = excluded.rfid_uid,
         login_id = excluded.login_id,
         disp_name = excluded.disp_name,
         ctype_code = excluded.ctype_code,
         ctype_name = excluded.ctype_name`
    );
    for (const c of customers) {
      const rawRfid = (c.RFIDUID || c.rfidUid || "").trim();
      const rawLoginId = (c.LOGINID || c.loginId || c.CUSTOMERID || c.customerId || "").toString().trim();
      insertCustomer.run(
        c.CUSTOMERID || c.customerId,
        rawRfid ? rawRfid.toUpperCase() : null,
        rawLoginId ? rawLoginId.toUpperCase() : `CUST-${c.CUSTOMERID || c.customerId}`,
        c.DISPNAME || c.dispName || "Employee",
        c.CTYPECODE || c.ctypeCode || "PRM",
        c.CTYPENAME || c.ctypeName || "Employee"
      );
    }

    // 2. Wallets
    const insertWallet = db.prepare(
      `INSERT INTO cached_wallets (customer_id, balance, status_id, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(customer_id) DO UPDATE SET
         balance = excluded.balance,
         status_id = excluded.status_id,
         updated_at = datetime('now')`
    );
    for (const w of wallets) {
      insertWallet.run(
        w.CUSTOMERID || w.customerId,
        Number(w.BALANCE || w.balance || 0),
        w.STATUSID || w.statusId || 10
      );
    }

    // 3. Day Slots
    const insertSlot = db.prepare(
      `INSERT INTO cached_day_slots (day_slot_id, service_id, service_name, serv_date, start_time, end_time)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(day_slot_id) DO UPDATE SET
         service_id = excluded.service_id,
         service_name = excluded.service_name,
         serv_date = excluded.serv_date,
         start_time = excluded.start_time,
         end_time = excluded.end_time`
    );
    for (const s of daySlots) {
      insertSlot.run(
        s.DAYSLOTID || s.daySlotId,
        s.SERVICEID || s.serviceId,
        s.SERVNAME || s.serviceName,
        s.SERVDATE || s.servDate,
        s.STARTTIME || s.startTime,
        s.ENDTIME || s.endTime
      );
    }

    // 4. Menu Items
    const insertMenuItem = db.prepare(
      `INSERT INTO cached_menu_items (
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
         book_until = excluded.book_until`
    );
    for (const m of menuItems) {
      insertMenuItem.run(
        m.DAYMENUID || m.dayMenuId,
        m.DAYSLOTID || m.daySlotId,
        m.MENUITEMID || m.menuItemId,
        m.ITEMNAME || m.itemName,
        Number(m.RATE || m.rate || 0),
        m.ISBASE ? 1 : 0,
        m.ISSPECIAL ? 1 : 0,
        m.MAXQTY || m.maxQty || 1,
        m.BOOKUNTIL || m.bookUntil || null
      );
    }
  });
};

/**
 * Reads a metadata value from system_meta table
 */
export const getMeta = (key) => {
  const db = getDb();
  try {
    const row = db.prepare("SELECT meta_value FROM system_meta WHERE meta_key = ?").get(key);
    return row ? row.meta_value : null;
  } catch {
    return null;
  }
};

/**
 * Sets or updates a metadata value in system_meta table
 */
export const setMeta = (key, value) => {
  const db = getDb();
  try {
    db.prepare(
      `INSERT INTO system_meta (meta_key, meta_value, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(meta_key) DO UPDATE SET
         meta_value = excluded.meta_value,
         updated_at = datetime('now')`
    ).run(key, String(value));
  } catch {
    // If system_meta table not initialized yet, silently ignore
  }
};
