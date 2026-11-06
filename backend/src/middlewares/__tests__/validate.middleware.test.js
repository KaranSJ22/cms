import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import { validate } from "../validate.middleware.js";
import { logger } from "../../utils/logger.js";

describe("validate Middleware", () => {
  const schema = z.object({
    body: z.object({
      username: z.string().min(3),
      password: z.string().min(6),
    }),
  });

  let req;
  let res;
  let next;
  let warnSpy;

  beforeEach(() => {
    req = {
      id: "test-corr-123",
      method: "POST",
      originalUrl: "/api/test",
      body: {},
      params: {},
      query: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
    warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
  });

  it("should call next() and populate req.validated on valid data", () => {
    req.body = { username: "alice", password: "password123" };

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.validated).toBeDefined();
    expect(req.validated.body.username).toBe("alice");
    expect(res.status).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("should respond with 400 and log structured error without leaking req.body or passwords", () => {
    req.body = { username: "al", password: "123" };

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        SUCCESS: false,
        MESSAGE: expect.any(String),
        ERRORS: expect.any(Object),
      })
    );

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const [loggedPayload, loggedMsg] = warnSpy.mock.calls[0];

    expect(loggedMsg).toMatch(/Zod validation failed/);
    expect(loggedPayload.CORRELATION_ID).toBe("test-corr-123");
    expect(loggedPayload.METHOD).toBe("POST");
    expect(loggedPayload.URL).toBe("/api/test");
    expect(loggedPayload.issues).toBeDefined();

    // Verify req.body or password is NOT present in the logged metadata
    expect(loggedPayload.body).toBeUndefined();
    expect(loggedPayload.password).toBeUndefined();
    expect(JSON.stringify(loggedPayload)).not.toContain("password123");
  });
});
