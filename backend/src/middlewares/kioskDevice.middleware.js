import * as KioskRepository from "../modules/kiosk/kiosk.repository.js";
import { ForbiddenError, NotFoundError } from "../common/errors/appError.js";
import { logger } from "../utils/logger.js";

// Cache for resolved kiosk devices to avoid hitting the DB on every millisecond scan
const kioskCache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Extracts normalized client IP address
 */
export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const rawIp = forwarded.split(",")[0].trim();
    return rawIp.startsWith("::ffff:") ? rawIp.substring(7) : rawIp;
  }
  let ip = req.socket?.remoteAddress || req.ip || "";
  if (ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }
  // Local development normalization
  if (ip === "::1") {
    return "127.0.0.1";
  }
  return ip;
}

/**
 * Resolves kiosk device from IP address using database or cache
 */
export async function resolveKioskFromIp(ip) {
  const now = Date.now();
  const cached = kioskCache.get(ip);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  try {
    const device = await KioskRepository.identifyKioskDevice(ip);
    if (device) {
      const data = {
        kioskId: device.KIOSKID,
        deviceCode: device.DEVICECODE,
        deviceName: device.DEVICENAME,
        ipAddress: device.IPADDRESS,
        canteenId: device.CANTEENID,
        canteenName: device.CANTEENNAME,
        canteenCode: device.CANTEENCODE,
        kioskType: device.KIOSKTYPE,
        isActive: device.ISACTIVE === 1,
      };
      kioskCache.set(ip, { data, expiresAt: now + CACHE_TTL_MS });
      return data;
    }
    return null;
  } catch (err) {
    // If not found in DB procedure, return null rather than 500
    if (err.sqlState === "45000") {
      return null;
    }
    logger.warn({ ip, err: err.message }, "Error identifying kiosk device from IP");
    return null;
  }
}

/**
 * Optional middleware: attaches req.kiosk if detected, but does not reject if not
 */
export const detectKiosk = async (req, res, next) => {
  try {
    const ip = getClientIp(req);
    const kiosk = await resolveKioskFromIp(ip);
    if (kiosk) {
      req.kiosk = kiosk;
    }
    next();
  } catch (err) {
    next();
  }
};

/**
 * Strict middleware: requires request to originate from a registered kiosk
 * @param {string[]} allowedTypes - optional array of allowed types: ['STAFF_COUNTER', 'EMP_SELF_SERVICE']
 */
export const requireKiosk = (allowedTypes = []) => {
  return async (req, res, next) => {
    try {
      const ip = getClientIp(req);
      const kiosk = await resolveKioskFromIp(ip);

      if (!kiosk || !kiosk.isActive) {
        throw new ForbiddenError(
          `Access Denied: Terminal at IP [${ip}] is not a registered or active kiosk device.`
        );
      }

      if (allowedTypes.length > 0 && !allowedTypes.includes(kiosk.kioskType)) {
        throw new ForbiddenError(
          `Access Denied: This kiosk terminal (${kiosk.deviceCode} - ${kiosk.kioskType}) is not authorized for this operation.`
        );
      }

      req.kiosk = kiosk;
      next();
    } catch (err) {
      next(err);
    }
  };
};
