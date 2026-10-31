import { getDb, withTransaction } from "../../db/sqlite.js";
import { OUTBOX_STATUS, SYNC_CONFIG } from "../../config/constants.js";
import { env } from "../../config/env.js";
import { SYNC_QUERIES } from "./sync.queries.js";

/**
 * Retrieves the oldest pending or retryable outbox bookings in FIFO order
 */
export const getPendingOutboxChunk = (limit = SYNC_CONFIG.DEFAULT_CHUNK_SIZE) => {
  const db = getDb();
  return db
    .prepare(SYNC_QUERIES.GET_PENDING_OUTBOX_CHUNK)
    .all(OUTBOX_STATUS.PENDING, OUTBOX_STATUS.RETRYABLE_ERROR, SYNC_CONFIG.MAX_RETRY_COUNT, limit);
};

/**
 * Marks a batch of outbox bookings as currently SYNCING
 */
export const markChunkSyncing = (offlineUuids) => {
  if (!offlineUuids.length) return;
  const db = getDb();
  const placeholders = offlineUuids.map(() => "?").join(",");
  db.prepare(SYNC_QUERIES.BUILD_MARK_SYNCING_SQL(placeholders)).run(OUTBOX_STATUS.SYNCING, ...offlineUuids);
};

/**
 * Applies itemized sub-transaction responses from central server
 */
export const applyItemizedResults = (results = []) => {
  return withTransaction((db) => {
    const updateSuccess = db.prepare(SYNC_QUERIES.MARK_BOOKING_SYNCED);
    const updateRejected = db.prepare(SYNC_QUERIES.MARK_BOOKING_REJECTED);
    const findBooking = db.prepare(SYNC_QUERIES.FIND_BOOKING_FOR_ROLLBACK);
    const deleteActiveGuard = db.prepare(SYNC_QUERIES.DELETE_ACTIVE_GUARD);
    const refundWallet = db.prepare(SYNC_QUERIES.REFUND_WALLET);

    const now = new Date().toISOString();

    for (const item of results) {
      if (item.status === OUTBOX_STATUS.SYNCED) {
        updateSuccess.run(OUTBOX_STATUS.SYNCED, now, item.offlineUuid);
      } else if (item.status === OUTBOX_STATUS.REJECTED) {
        const errorMsg = item.message || item.errorCode || "Rejected by central server";
        updateRejected.run(OUTBOX_STATUS.REJECTED, errorMsg, item.offlineUuid);

        // Retrieve booking details to clean up locks & local wallet state
        const booking = findBooking.get(item.offlineUuid);
        if (booking) {
          // 1. Release active slot lock so user can try again
          deleteActiveGuard.run(booking.customer_id, booking.service_id, booking.serv_date);

          // 2. If rejected for reasons other than insufficient balance, refund local wallet view
          const isInsufficientBal =
            (item.errorCode || "").toUpperCase() === "INSUFFICIENT_WALLET_BALANCE" ||
            errorMsg.toLowerCase().includes("insufficient");

          if (booking.payment_method === "WALLET" && booking.total_amount > 0 && !isInsufficientBal) {
            refundWallet.run(booking.total_amount, booking.customer_id);
          }
        }
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

  db.prepare(SYNC_QUERIES.BUILD_MARK_RETRYABLE_SQL(placeholders)).run(
    OUTBOX_STATUS.RETRYABLE_ERROR,
    errorMessage,
    ...offlineUuids
  );
};

/**
 * Counts currently pending bookings in outbox
 */
export const getPendingOutboxCount = () => {
  const db = getDb();
  const row = db.prepare(SYNC_QUERIES.GET_PENDING_OUTBOX_COUNT).get();
  return row ? Number(row.count) : 0;
};

// ------------------------------------------------------------
// Private Step Functions for Downlink Snapshot Ingestion
// ------------------------------------------------------------

const ingestCustomers = (db, customers = []) => {
  const insertCustomer = db.prepare(SYNC_QUERIES.UPSERT_CUSTOMER);
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
};

const ingestWallets = (db, wallets = []) => {
  const getPendingDeductions = db.prepare(SYNC_QUERIES.GET_PENDING_WALLET_DEDUCTIONS);
  const insertWallet = db.prepare(SYNC_QUERIES.UPSERT_WALLET);

  for (const w of wallets) {
    const custId = w.CUSTOMERID || w.customerId;
    const centralBal = Number(w.BALANCE || w.balance || 0);
    const pendingRow = getPendingDeductions.get(custId);
    const pendingAmt = pendingRow ? Number(pendingRow.total) : 0;
    const effectiveBal = Math.max(0, centralBal - pendingAmt);

    insertWallet.run(custId, effectiveBal, w.STATUSID || w.statusId || 10);
  }
};

const ingestDaySlots = (db, daySlots = [], canteenId = 1) => {
  const insertSlot = db.prepare(SYNC_QUERIES.UPSERT_DAY_SLOT);
  for (const s of daySlots) {
    insertSlot.run(
      s.DAYSLOTID || s.daySlotId,
      s.CANTEENID || s.canteenId || canteenId,
      s.SERVICEID || s.serviceId,
      s.SERVNAME || s.serviceName,
      s.SERVICEDATE || s.SERVDATE || s.servDate,
      s.STARTTIME || s.startTime,
      s.ENDTIME || s.endTime
    );
  }

  // Prune any slots that don't belong to this canteen facility (clean menu items first to satisfy FK)
  db.prepare(SYNC_QUERIES.PRUNE_FOREIGN_MENU_ITEMS).run(canteenId);
  db.prepare(SYNC_QUERIES.PRUNE_FOREIGN_DAY_SLOTS).run(canteenId);
};

const ingestMenuItems = (db, menuItems = []) => {
  const validSlotStmt = db.prepare(SYNC_QUERIES.CHECK_DAY_SLOT_EXISTS);
  const insertMenuItem = db.prepare(SYNC_QUERIES.UPSERT_MENU_ITEM);

  for (const m of menuItems) {
    const slotId = m.DAYSLOTID || m.daySlotId;
    if (!validSlotStmt.get(slotId)) continue; // Ensure slot exists in local cache

    insertMenuItem.run(
      m.DAYMENUID || m.dayMenuId,
      slotId,
      m.MENUITEMID || m.menuItemId,
      m.ITEMNAME || m.itemName,
      Number(m.RATE || m.rate || 0),
      m.ISBASE ? 1 : 0,
      m.ISSPECIAL ? 1 : 0,
      m.MAXQTY || m.maxQty || 1,
      m.BOOKUNTIL || m.bookUntil || null
    );
  }
};

const ingestActivePrebookings = (db, activeBookings = []) => {
  const insertActive = db.prepare(SYNC_QUERIES.UPSERT_ACTIVE_PREBOOKING);
  for (const b of activeBookings) {
    insertActive.run(
      b.CUSTOMERID || b.customerId,
      b.SERVICEID || b.serviceId,
      b.SERVICEDATE || b.SERVDATE || b.servDate,
      b.BOOKID || b.bookId || null,
      b.TOKENNO || b.tokenNo || b.BOOKNO || b.bookNo || ""
    );
  }
};

const ingestTodayManifest = (db, todayBookings = [], todayBookItems = []) => {
  if (todayBookings && todayBookings.length) {
    const insertToday = db.prepare(SYNC_QUERIES.UPSERT_TODAY_BOOKING);
    for (const tb of todayBookings) {
      insertToday.run(
        tb.bookId || tb.BOOKID,
        tb.bookNo || tb.BOOKNO,
        tb.customerId || tb.CUSTOMERID,
        (tb.loginId || tb.LOGINID || "").toUpperCase(),
        (tb.rfidUid || tb.RFIDUID || "") ? (tb.rfidUid || tb.RFIDUID).toUpperCase() : null,
        tb.dispName || tb.DISPNAME || "Employee",
        tb.ctypeCode || tb.CTYPECODE || "PRM",
        tb.serviceId || tb.SERVICEID,
        tb.daySlotId || tb.DAYSLOTID,
        tb.slotName || tb.SLOTNAME || "Meal Slot",
        tb.statusCode || tb.STATUSCODE || "CRT",
        tb.servedBy || tb.SERVEDBY || null,
        tb.servedOn || tb.SERVEDAT || tb.SERVEDON || null,
        Number(tb.totalAmount || tb.TOTALAMOUNT || 0)
      );
    }
  }

  if (todayBookItems && todayBookItems.length) {
    const validBookingStmt = db.prepare(SYNC_QUERIES.CHECK_TODAY_BOOKING_EXISTS);
    const insertItem = db.prepare(SYNC_QUERIES.UPSERT_TODAY_BOOK_ITEM);

    for (const bi of todayBookItems) {
      const bId = bi.bookId || bi.BOOKID;
      if (!validBookingStmt.get(bId)) {
        continue; // Skip line items whose parent booking is cancelled/not cached
      }
      insertItem.run(
        bi.bookItemId || bi.BOOKITEMID,
        bId,
        bi.menuItemId || bi.MENUITEMID,
        bi.itemName || bi.ITEMNAME || "Dish",
        bi.qty || bi.QTY || 1,
        Number(bi.rate || bi.RATE || 0)
      );
    }
  }

  // Clean up any orphaned today items whose parent bookings were cancelled or removed
  db.prepare(SYNC_QUERIES.PRUNE_ORPHAN_TODAY_BOOK_ITEMS).run();
};

/**
 * Upserts downlink bootstrap snapshot into local SQLite cache
 */
export const upsertDownlinkSnapshot = ({
  customers = [],
  wallets = [],
  daySlots = [],
  menuItems = [],
  activeBookings = [],
  todayBookings = [],
  todayBookItems = [],
}) => {
  return withTransaction((db) => {
    const canteenId = Number(env.CANTEEN_ID || 1);
    ingestCustomers(db, customers);
    ingestWallets(db, wallets);
    ingestDaySlots(db, daySlots, canteenId);
    ingestMenuItems(db, menuItems);
    ingestActivePrebookings(db, activeBookings);
    ingestTodayManifest(db, todayBookings, todayBookItems);
  });
};

/**
 * Reads a metadata value from system_meta table
 */
export const getMeta = (key) => {
  const db = getDb();
  try {
    const row = db.prepare(SYNC_QUERIES.GET_SYSTEM_META).get(key);
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
    db.prepare(SYNC_QUERIES.SET_SYSTEM_META).run(key, String(value));
  } catch {
    // If system_meta table not initialized yet, silently ignore
  }
};

/**
 * Purges synced and cancelled outbox bookings older than the retention window
 */
export const purgeHistoricalOutbox = (retentionDays = 7) => {
  const db = getDb();
  try {
    const result = db.prepare(SYNC_QUERIES.PURGE_HISTORICAL_OUTBOX).run(retentionDays);
    return result.changes;
  } catch {
    return 0;
  }
};

/**
 * Retrieves the oldest pending or retryable outbox serving events in FIFO order
 */
export const getPendingServingEventsChunk = (limit = 50) => {
  const db = getDb();
  return db.prepare(SYNC_QUERIES.GET_PENDING_SERVING_EVENTS).all(limit);
};

/**
 * Marks a batch of outbox serving events as currently SYNCING
 */
export const markServingEventsSyncing = (eventUuids = []) => {
  if (!eventUuids.length) return;
  const db = getDb();
  const placeholders = eventUuids.map(() => "?").join(",");
  db.prepare(SYNC_QUERIES.BUILD_MARK_SERVING_SYNCING_SQL(placeholders)).run(...eventUuids);
};

/**
 * Applies itemized serving event responses from central server
 */
export const applyServingSyncResults = (results = []) => {
  return withTransaction((db) => {
    const updateSuccess = db.prepare(SYNC_QUERIES.MARK_SERVING_EVENT_SYNCED);
    const updateError = db.prepare(SYNC_QUERIES.MARK_SERVING_EVENT_ERROR);

    for (const res of results) {
      if (res.status === "SYNCED") {
        updateSuccess.run(res.eventUuid);
      } else {
        updateError.run(res.message || res.errorMessage || "Server sync error", res.eventUuid);
      }
    }
  });
};

/**
 * Resets a failed chunk of serving events to ERROR
 */
export const markServingEventsError = (eventUuids = [], errorMessage = "Sync network error") => {
  if (!eventUuids.length) return;
  const db = getDb();
  const placeholders = eventUuids.map(() => "?").join(",");
  db.prepare(SYNC_QUERIES.BUILD_MARK_SERVING_ERROR_SQL(placeholders)).run(errorMessage, ...eventUuids);
};

/**
 * Purges historical synced serving events older than retention window
 */
export const purgeHistoricalServingOutbox = (retentionDays = 7) => {
  const db = getDb();
  try {
    const result = db.prepare(SYNC_QUERIES.PURGE_HISTORICAL_SERVING_OUTBOX).run(retentionDays);
    return result.changes;
  } catch {
    return 0;
  }
};
