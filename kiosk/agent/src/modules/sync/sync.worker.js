import * as SyncService from "./sync.service.js";
import { logger } from "../../utils/logger.js";
import { env } from "../../config/env.js";

let uplinkTimeoutHandle = null;
let downlinkTimeoutHandle = null;
let isUplinkRunning = false;
let isDownlinkRunning = false;
let isStopped = false;

const UPLINK_BASE_MS = env.SYNC_INTERVAL_MS || 15000;
const DOWNLINK_BASE_MS = 300 * 1000; // 5 minutes
const MAX_DOWNLINK_BACKOFF_MS = 600 * 1000; // 10 minutes max backoff
let currentDownlinkIntervalMs = DOWNLINK_BASE_MS;

/**
 * Calculates a jittered interval (+/- 2000ms) to prevent multi-kiosk synchronized storming
 */
const getJitteredUplinkInterval = () => {
  const jitter = Math.floor(Math.random() * 4000) - 2000; // -2000ms to +2000ms
  return Math.max(5000, UPLINK_BASE_MS + jitter);
};

/**
 * Recursive Uplink loop: Outbox push + Heartbeat telemetry
 */
const runUplinkCycle = async () => {
  if (isStopped) return;
  if (!isUplinkRunning) {
    isUplinkRunning = true;
    try {
      // 1. Flush queued outbox bookings
      await SyncService.pushOutboxBatch();

      // 2. Emit hardware heartbeat
      await SyncService.sendHeartbeatTelemetry({
        uptimeSec: Math.floor(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      });
    } catch (err) {
      logger.debug({ err: err.message }, "Uplink sync iteration caught error");
    } finally {
      isUplinkRunning = false;
    }
  }

  if (!isStopped) {
    const nextInterval = getJitteredUplinkInterval();
    uplinkTimeoutHandle = setTimeout(runUplinkCycle, nextInterval);
  }
};

/**
 * Recursive Downlink loop: Master data refresh with HTTP 304 & Exponential Backoff
 */
const runDownlinkCycle = async () => {
  if (isStopped) return;
  if (!isDownlinkRunning) {
    isDownlinkRunning = true;
    try {
      const result = await SyncService.pullBootstrapPackage();
      if (result.success) {
        // Reset backoff on successful communication (either 200 or 304)
        currentDownlinkIntervalMs = DOWNLINK_BASE_MS;
      } else {
        // Apply backoff on network failure
        currentDownlinkIntervalMs = Math.min(
          MAX_DOWNLINK_BACKOFF_MS,
          Math.round(currentDownlinkIntervalMs * 1.5)
        );
        logger.warn(
          { nextAttemptInSec: Math.round(currentDownlinkIntervalMs / 1000) },
          "Downlink pull failed; applying backoff interval"
        );
      }
    } catch (err) {
      logger.debug({ err: err.message }, "Downlink pull error");
      currentDownlinkIntervalMs = Math.min(
        MAX_DOWNLINK_BACKOFF_MS,
        Math.round(currentDownlinkIntervalMs * 1.5)
      );
    } finally {
      isDownlinkRunning = false;
    }
  }

  if (!isStopped) {
    downlinkTimeoutHandle = setTimeout(runDownlinkCycle, currentDownlinkIntervalMs);
  }
};

export const startSyncWorker = () => {
  isStopped = false;
  logger.info(
    {
      uplinkIntervalMs: UPLINK_BASE_MS,
      downlinkIntervalMs: DOWNLINK_BASE_MS,
    },
    "Starting split background sync workers (15s uplink / 5m downlink)..."
  );

  // 1. Trigger initial bootstrap package pull on boot
  SyncService.pullBootstrapPackage().catch((err) => {
    logger.warn({ err: err.message }, "Initial bootstrap pull deferred until online");
  });

  // 2. Start recursive uplink runner
  uplinkTimeoutHandle = setTimeout(runUplinkCycle, getJitteredUplinkInterval());

  // 3. Start recursive downlink runner (first scheduled run after 5 minutes)
  downlinkTimeoutHandle = setTimeout(runDownlinkCycle, DOWNLINK_BASE_MS);
};

export const stopSyncWorker = () => {
  isStopped = true;
  if (uplinkTimeoutHandle) {
    clearTimeout(uplinkTimeoutHandle);
    uplinkTimeoutHandle = null;
  }
  if (downlinkTimeoutHandle) {
    clearTimeout(downlinkTimeoutHandle);
    downlinkTimeoutHandle = null;
  }
  logger.info("Background sync workers stopped");
};
