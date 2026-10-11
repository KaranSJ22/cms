import { centralClient } from "./sync.client.js";
import * as SyncRepository from "./sync.repository.js";
import { logger } from "../../utils/logger.js";
import { env } from "../../config/env.js";
import { SYNC_CONFIG } from "../../config/constants.js";

/**
 * Pushes a batch of 25-50 queued outbox bookings to the central server
 */
export const pushOutboxBatch = async () => {
  const chunk = SyncRepository.getPendingOutboxChunk(SYNC_CONFIG.DEFAULT_CHUNK_SIZE);
  if (!chunk.length) return { processedCount: 0 };

  const offlineUuids = chunk.map((c) => c.offline_uuid);
  SyncRepository.markChunkSyncing(offlineUuids);

  try {
    const payload = {
      kioskCode: env.KIOSK_CODE,
      batchId: `BATCH-${env.KIOSK_CODE}-${Date.now()}`,
      items: chunk.map((c) => ({
        offlineUuid: c.offline_uuid,
        tokenNo: c.token_no,
        customerId: c.customer_id,
        serviceId: c.service_id,
        servDate: c.serv_date,
        items: JSON.parse(c.items_json),
        totalAmount: c.total_amount,
        paymentMethod: c.payment_method,
        createdAt: c.created_at,
      })),
    };

    const res = await centralClient.post("/kiosk/sync-offline", payload);
    const results = res.data?.DATA?.results || res.data?.results || [];

    SyncRepository.applyItemizedResults(results);
    logger.info(
      { batchSize: chunk.length, syncedResults: results.length },
      "Successfully synced offline outbox batch to central server"
    );

    return { processedCount: chunk.length, results };
  } catch (error) {
    const errMsg = error.response?.data?.MESSAGE || error.message || "Network sync failure";
    logger.warn({ err: errMsg, batchSize: chunk.length }, "Outbox push failed, marked for backoff retry");
    SyncRepository.markChunkRetryable(offlineUuids, errMsg);
    return { processedCount: 0, error: errMsg };
  }
};

/**
 * Pulls master data snapshot from central server to populate local SQLite cache
 */
export const pullBootstrapPackage = async () => {
  try {
    const lastSync = SyncRepository.getMeta("last_master_sync_at");
    const params = {
      kioskCode: env.KIOSK_CODE,
      canteenId: env.CANTEEN_ID,
    };
    if (lastSync) {
      params.since = lastSync;
    }

    const res = await centralClient.get("/kiosk/bootstrap-package", {
      params,
      validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
    });

    if (res.status === 304) {
      logger.debug("Master data unchanged (HTTP 304). Skipping SQLite writes.");
      return { success: true, notModified: true };
    }

    const data = res.data?.DATA || res.data || {};
    SyncRepository.upsertDownlinkSnapshot({
      customers: data.customers || [],
      wallets: data.wallets || [],
      daySlots: data.daySlots || [],
      menuItems: data.menuItems || [],
    });

    const newLastModified =
      res.headers?.["x-last-modified"] || data.lastModified || data.syncedAt || new Date().toISOString();
    SyncRepository.setMeta("last_master_sync_at", newLastModified);

    logger.info(
      {
        customers: data.customers?.length || 0,
        wallets: data.wallets?.length || 0,
        slots: data.daySlots?.length || 0,
        dishes: data.menuItems?.length || 0,
      },
      "Downlink bootstrap sync completed successfully"
    );

    return { success: true, notModified: false };
  } catch (error) {
    const errMsg = error.response?.data?.MESSAGE || error.message || "Bootstrap sync failed";
    logger.warn({ err: errMsg }, "Central server unreachable during downlink pull");
    return { success: false, error: errMsg };
  }
};

/**
 * Sends heartbeat telemetry snapshot to central server
 */
export const sendHeartbeatTelemetry = async (telemetryData = {}) => {
  try {
    const pendingCount = SyncRepository.getPendingOutboxCount();
    const payload = {
      kioskCode: env.KIOSK_CODE,
      status: "ONLINE",
      outboxPending: pendingCount,
      lastSyncTime: new Date().toISOString(),
      hardware: telemetryData,
    };

    await centralClient.post("/kiosk/heartbeat", payload);
    return { success: true };
  } catch (error) {
    // Suppress chatter if server is down; worker will retry silently
    logger.debug({ err: error.message }, "Heartbeat ping failed");
    return { success: false, error: error.message };
  }
};
