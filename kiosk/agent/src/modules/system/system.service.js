import fs from "fs";
import path from "path";
import os from "os";
import { getPendingOutboxCount } from "../sync/sync.repository.js";
import { env } from "../../config/env.js";

/**
 * Reads Raspberry Pi CPU temperature in Celsius
 */
export const getCpuTemperature = () => {
  try {
    const tempFile = "/sys/class/thermal/thermal_zone0/temp";
    if (fs.existsSync(tempFile)) {
      const raw = fs.readFileSync(tempFile, "utf-8");
      return parseFloat((parseInt(raw.trim(), 10) / 1000).toFixed(1));
    }
  } catch {
    // Non-Linux or development fallback
  }
  return null;
};

/**
 * Retrieves local terminal diagnostic snapshot
 */
export const getSystemHealth = () => {
  const pendingOutbox = getPendingOutboxCount();
  const cpuTemp = getCpuTemperature();
  const dbPath = path.resolve(env.DB_PATH);

  let dbSizeBytes = 0;
  if (fs.existsSync(dbPath)) {
    dbSizeBytes = fs.statSync(dbPath).size;
  }

  return {
    kioskCode: env.KIOSK_CODE,
    canteenId: env.CANTEEN_ID,
    status: "READY",
    uptimeSec: Math.floor(process.uptime()),
    system: {
      platform: os.platform(),
      cpuTempC: cpuTemp,
      loadAvg: os.loadavg(),
      freeMemMb: Math.round(os.freemem() / 1024 / 1024),
      totalMemMb: Math.round(os.totalmem() / 1024 / 1024),
    },
    database: {
      dbPath: env.DB_PATH,
      sizeKb: Math.round(dbSizeBytes / 1024),
    },
    outbox: {
      pendingBookings: pendingOutbox,
    },
  };
};
