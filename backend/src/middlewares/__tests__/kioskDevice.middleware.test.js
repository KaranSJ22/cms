import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveKioskFromIp, requireKiosk, detectKiosk, getClientIp } from "../kioskDevice.middleware.js";
import * as KioskRepository from "../../modules/kiosk/kiosk.repository.js";
import { ForbiddenError } from "../../common/errors/appError.js";
import { logger } from "../../utils/logger.js";

describe("kioskDevice Middleware", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(logger, "error").mockImplementation(() => {});
    vi.spyOn(logger, "warn").mockImplementation(() => {});
  });

  describe("resolveKioskFromIp", () => {
    it("should return null for loopback and localhost IPs without querying DB", async () => {
      const repoSpy = vi.spyOn(KioskRepository, "identifyKioskDevice");

      expect(await resolveKioskFromIp("127.0.0.1")).toBeNull();
      expect(await resolveKioskFromIp("::1")).toBeNull();
      expect(await resolveKioskFromIp("localhost")).toBeNull();
      expect(await resolveKioskFromIp("")).toBeNull();

      expect(repoSpy).not.toHaveBeenCalled();
    });

    it("should return null when device is not found in database", async () => {
      vi.spyOn(KioskRepository, "identifyKioskDevice").mockResolvedValue(null);

      const result = await resolveKioskFromIp("192.168.1.100");
      expect(result).toBeNull();
    });

    it("should re-throw genuine database operational errors", async () => {
      const dbError = new Error("Connection lost: ECONNREFUSED");
      dbError.code = "ECONNREFUSED";
      vi.spyOn(KioskRepository, "identifyKioskDevice").mockRejectedValue(dbError);

      await expect(resolveKioskFromIp("192.168.1.200")).rejects.toThrow(
        "Connection lost: ECONNREFUSED"
      );
      expect(logger.error).toHaveBeenCalled();
    });

    it("should return null when procedure raises SQLSTATE 45000", async () => {
      const spSignal = new Error("Client IP address is required");
      spSignal.sqlState = "45000";
      vi.spyOn(KioskRepository, "identifyKioskDevice").mockRejectedValue(spSignal);

      const result = await resolveKioskFromIp("192.168.1.201");
      expect(result).toBeNull();
    });
  });

  describe("requireKiosk", () => {
    it("should reject unrecognised IP with 403 ForbiddenError", async () => {
      vi.spyOn(KioskRepository, "identifyKioskDevice").mockResolvedValue(null);

      const req = { headers: {}, ip: "192.168.1.50" };
      const res = {};
      const next = vi.fn();

      const middleware = requireKiosk();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(ForbiddenError);
      expect(err.message).toMatch(/not a registered or active kiosk device/i);
    });

    it("should pass operational DB errors to next(err) instead of masking as 403", async () => {
      const dbError = new Error("ER_LOCK_WAIT_TIMEOUT");
      vi.spyOn(KioskRepository, "identifyKioskDevice").mockRejectedValue(dbError);

      const req = { headers: {}, ip: "192.168.1.50" };
      const res = {};
      const next = vi.fn();

      const middleware = requireKiosk();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = next.mock.calls[0][0];
      expect(err).toBe(dbError);
      expect(err).not.toBeInstanceOf(ForbiddenError);
    });
  });

  describe("detectKiosk", () => {
    it("should log unexpected errors without throwing or blocking request", async () => {
      const dbError = new Error("Fatal DB Error");
      vi.spyOn(KioskRepository, "identifyKioskDevice").mockRejectedValue(dbError);

      const req = { headers: {}, ip: "192.168.1.50", originalUrl: "/api/menu" };
      const res = {};
      const next = vi.fn();

      await detectKiosk(req, res, next);

      expect(logger.error).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(); // called with no error arguments
    });
  });
});
