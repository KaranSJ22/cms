import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { TEST_USERS, getAuthHeader } from "../../../test/testHelpers.js";

describe("Health Check Endpoints", () => {
  it("GET /health - should return 200 and server running message", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.MESSAGE).toMatch(/running/i);
    expect(res.body.ENVIRONMENT).toBeDefined();
  });

  it("GET /health/db - should return 200 and verify database connection", async () => {
    const res = await request(app).get("/health/db");

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA?.RESULT).toBe(1);
  });
});

describe("Auth Module: POST /api/auth/login", () => {
  it("should successfully log in a permanent employee and return JWT token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        LOGINID: TEST_USERS.PERMANENT.LOGINID,
        PASSWORD: TEST_USERS.PERMANENT.PASSWORD,
      });

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.MESSAGE).toMatch(/login successful/i);

    // Validate token
    expect(res.body.DATA?.TOKEN).toBeTypeOf("string");

    // Validate user identity
    const user = res.body.DATA?.USER;
    expect(user).toBeDefined();
    expect(user.LOGINID).toBe("perm1");
    expect(user.EMAIL).toBe("perm1@isro.gov.in");

    // Validate customer profile
    const customer = res.body.DATA?.CUSTOMER;
    expect(customer).toBeDefined();
    expect(customer.CTYPECODE).toBe("PRM");
  });

  it("should successfully log in a Canteen Manager with CANTEENROLES", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        LOGINID: TEST_USERS.MANAGER.LOGINID,
        PASSWORD: TEST_USERS.MANAGER.PASSWORD,
      });

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA?.TOKEN).toBeTypeOf("string");

    const user = res.body.DATA?.USER;
    expect(user.LOGINID).toBe("mgr1");
    expect(user.CANTEENROLES).toBeInstanceOf(Array);
  });

  it("should reject an invalid password with HTTP 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        LOGINID: "perm1",
        PASSWORD: "IncorrectPassword123!",
      });

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
    expect(res.body.MESSAGE).toMatch(/invalid login id or password/i);
  });

  it("should reject a non-existent login ID with HTTP 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        LOGINID: "non_existent_user_9999",
        PASSWORD: "Password@123",
      });

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
    expect(res.body.MESSAGE).toMatch(/invalid login id or password/i);
  });

  it("should reject empty LOGINID with HTTP 400 validation error", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        LOGINID: "",
        PASSWORD: "admin123",
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject missing PASSWORD with HTTP 400 validation error", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        LOGINID: "perm1",
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });
});

describe("Auth Module: GET /api/me (Protected Route)", () => {
  it("should reject request when Authorization header is missing with HTTP 401", async () => {
    const res = await request(app).get("/api/me");

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
    expect(res.body.MESSAGE).toMatch(/token missing/i);
  });

  it("should reject request when token is malformed with HTTP 401", async () => {
    const res = await request(app)
      .get("/api/me")
      .set("Authorization", "Bearer invalid.malformed.token");

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
    expect(res.body.MESSAGE).toMatch(/invalid or expired token/i);
  });

  it("should return authenticated user profile when valid Bearer token is provided", async () => {
    const authHeader = await getAuthHeader(TEST_USERS.PERMANENT.LOGINID);

    const res = await request(app)
      .get("/api/me")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeDefined();
    expect(res.body.DATA.LOGINID).toBe("perm1");
    expect(res.body.DATA.CTYPECODE).toBe("PRM");
  });
});
