import * as SystemService from "./system.service.js";
import * as SyncService from "../sync/sync.service.js";
import { sendSuccess } from "../../common/responses/apiResponse.js";

export const getHealthController = async (req, res, next) => {
  try {
    const health = SystemService.getSystemHealth();
    return sendSuccess(res, health, "Kiosk terminal healthy");
  } catch (error) {
    next(error);
  }
};

export const triggerSyncController = async (req, res, next) => {
  try {
    const pushResult = await SyncService.pushOutboxBatch();
    const pullResult = await SyncService.pullBootstrapPackage();
    return sendSuccess(
      res,
      { push: pushResult, pull: pullResult },
      "Manual synchronization completed"
    );
  } catch (error) {
    next(error);
  }
};

const sseClients = new Set();

/**
 * Server-Sent Events (SSE) stream for real-time hardware RFID scans
 */
export const getRfidStreamController = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  // Initial connection acknowledgement
  res.write(`data: ${JSON.stringify({ status: "connected" })}\n\n`);

  sseClients.add(res);

  req.on("close", () => {
    sseClients.delete(res);
  });
};

/**
 * Broadcasts an RFID card tap received from the local driver daemon to all connected browser clients
 */
export const postRfidTapController = (req, res) => {
  const { rfidUid } = req.body || {};
  if (!rfidUid) {
    return res.status(400).json({ SUCCESS: false, MESSAGE: "Missing rfidUid in body" });
  }

  const cleanUid = String(rfidUid).trim().toUpperCase();
  const payload = JSON.stringify({ rfidUid: cleanUid });

  for (const client of sseClients) {
    client.write(`data: ${payload}\n\n`);
  }

  return sendSuccess(res, { broadcastCount: sseClients.size, rfidUid: cleanUid }, "RFID tap broadcasted");
};

