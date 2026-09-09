import crypto from "crypto";
import pinoHttp from "pino-http";
import { logger } from "../utils/logger.js";

export const requestLogger = pinoHttp({
  logger,

  genReqId: (req, res) => {
    const existing =
      req.headers["x-correlation-id"] ||
      req.headers["x-request-id"];
    const id = existing ? String(existing).trim() : `cms-${crypto.randomUUID()}`;
    res.setHeader("X-Correlation-ID", id);
    return id;
  },

  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pinoHttp.stdSerializers.err,
  },

  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },

  customProps: (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    const clientIp = forwarded
      ? forwarded.split(",")[0].trim()
      : req.socket?.remoteAddress || req.ip || null;
    return {
      CORRELATION_ID: req.id,
      CLIENT_IP: clientIp,
      KIOSK_ID: req.kiosk?.kioskId || null,
      DEVICE_CODE: req.kiosk?.deviceCode || null,
      CANTEEN_ID: req.kiosk?.canteenId || req.query?.canteenId || null,
      USERID: req.user?.USERID || null,
      LOGINID: req.user?.LOGINID || null,
    };
  },
});