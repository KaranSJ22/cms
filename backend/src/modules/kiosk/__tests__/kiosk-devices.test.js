import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { getAuthHeader } from "../../../test/testHelpers.js";
import { pool } from "../../../db/connection.js";

describe("Kiosk Fleet Module: Security & RBAC Guards (SYSADM Only)", () => {
  it("should reject unauthenticated request to GET /api/kiosk/devices with HTTP 401", async () => {
    const res = await request(app).get("/api/kiosk/devices");

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject unauthenticated request to POST /api/kiosk/devices with HTTP 401", async () => {
    const res = await request(app)
      .post("/api/kiosk/devices")
      .send({
        DEVICECODE: "KSK-TEST-COUNTER-99",
        DEVICENAME: "Test Counter",
        IPADDRESS: "192.168.99.99",
        CANTEENID: 1,
        KIOSKTYPE: "STAFF_COUNTER",
      });

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from GET /api/kiosk/devices with HTTP 403 Forbidden", async () => {
    const authHeader = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/kiosk/devices")
      .set(authHeader);

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from POST /api/kiosk/devices with HTTP 403 Forbidden", async () => {
    const authHeader = await getAuthHeader("perm1");

    const res = await request(app)
      .post("/api/kiosk/devices")
      .set(authHeader)
      .send({
        DEVICECODE: "KSK-TEST-COUNTER-99",
        DEVICENAME: "Test Counter",
        IPADDRESS: "192.168.99.99",
        CANTEENID: 1,
        KIOSKTYPE: "STAFF_COUNTER",
      });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject Canteen Manager (mgr1) from POST /api/kiosk/devices with HTTP 403 (Hardware fleet is SYSADM only)", async () => {
    const authHeader = await getAuthHeader("mgr1");

    const res = await request(app)
      .post("/api/kiosk/devices")
      .set(authHeader)
      .send({
        DEVICECODE: "KSK-TEST-COUNTER-99",
        DEVICENAME: "Test Counter",
        IPADDRESS: "192.168.99.99",
        CANTEENID: 1,
        KIOSKTYPE: "STAFF_COUNTER",
      });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });
});

describe("Kiosk Fleet Module: Input Validation", () => {
  it("should reject POST /api/kiosk/devices when required fields are missing with HTTP 400", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .post("/api/kiosk/devices")
      .set(authHeader)
      .send({
        DEVICECODE: "KSK-TEST-01",
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject POST /api/kiosk/devices with invalid KIOSKTYPE with HTTP 400", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .post("/api/kiosk/devices")
      .set(authHeader)
      .send({
        DEVICECODE: "KSK-TEST-INVALID",
        DEVICENAME: "Invalid Terminal",
        IPADDRESS: "192.168.99.88",
        CANTEENID: 1,
        KIOSKTYPE: "MOBILE_APP", // invalid
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject GET /api/kiosk/devices/:id when ID is not a positive integer with HTTP 400", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .get("/api/kiosk/devices/not-an-id")
      .set(authHeader);

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject PUT /api/kiosk/devices/:id/status when STATUSID is not 10 or 11 with HTTP 400", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .put("/api/kiosk/devices/1/status")
      .set(authHeader)
      .send({
        STATUSID: 99,
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });
});

describe("Kiosk Fleet Module: Hardware Terminal Registry & Lifecycle", () => {
  const TEST_DEVICE_CODE = `KSK-TEST-CNT-${Date.now().toString().slice(-4)}`;
  const TEST_IP = `10.99.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}`;
  let createdKioskId = null;

  beforeAll(async () => {
    // Clean up any lingering test devices
    await pool.query("DELETE FROM CMS_KIOSK WHERE DEVICECODE LIKE 'KSK-TEST-%'");
  });

  afterAll(async () => {
    // Clean up test devices
    await pool.query("DELETE FROM CMS_KIOSK WHERE DEVICECODE LIKE 'KSK-TEST-%'");
  });

  it("POST /api/kiosk/devices - should allow System Admin to register a new serving counter terminal with HTTP 201", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .post("/api/kiosk/devices")
      .set(authHeader)
      .send({
        DEVICECODE: TEST_DEVICE_CODE,
        DEVICENAME: "Canteen A Test Serving Counter",
        IPADDRESS: TEST_IP,
        MACADDRESS: "AA:BB:CC:11:22:33",
        CANTEENID: 1,
        KIOSKTYPE: "STAFF_COUNTER",
      });

    expect(res.status).toBe(201);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA?.KIOSKID).toBeDefined();
    expect(res.body.DATA?.RESULT).toBe("SUCCESS");

    createdKioskId = res.body.DATA.KIOSKID;
  });

  it("GET /api/kiosk/devices - should list all registered kiosk terminals including the new device", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .get("/api/kiosk/devices")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeInstanceOf(Array);

    const found = res.body.DATA.find((k) => k.DEVICECODE === TEST_DEVICE_CODE);
    expect(found).toBeDefined();
    expect(found.IPADDRESS).toBe(TEST_IP);
    expect(found.CANTEENID).toBe(1);
    expect(found.KIOSKTYPE).toBe("STAFF_COUNTER");
    expect(found.ISACTIVE).toBe(1);
  });

  it("GET /api/kiosk/devices?canteenId=1 - should filter terminals by canteen facility", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .get("/api/kiosk/devices?canteenId=1")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    const found = res.body.DATA.find((k) => k.DEVICECODE === TEST_DEVICE_CODE);
    expect(found).toBeDefined();
  });

  it("GET /api/kiosk/devices?canteenId=2 - should not contain Canteen 1 terminal in Canteen 2 list", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .get("/api/kiosk/devices?canteenId=2")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    const found = res.body.DATA.find((k) => k.DEVICECODE === TEST_DEVICE_CODE);
    expect(found).toBeUndefined();
  });

  it("GET /api/kiosk/devices/:id - should fetch details of the specific registered terminal", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .get(`/api/kiosk/devices/${createdKioskId}`)
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.KIOSKID).toBe(createdKioskId);
    expect(res.body.DATA.DEVICECODE).toBe(TEST_DEVICE_CODE);
    expect(res.body.DATA.CANTEENNAME).toBeDefined();
  });

  it("GET /api/kiosk/devices/:id - should return HTTP 404 for non-existent kiosk ID", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .get("/api/kiosk/devices/999999")
      .set(authHeader);

    expect(res.status).toBe(404);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("PUT /api/kiosk/devices/:id/status - should allow System Admin to deactivate a terminal (retire device)", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .put(`/api/kiosk/devices/${createdKioskId}/status`)
      .set(authHeader)
      .send({
        STATUSID: 11, // DIS
      });

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.ISACTIVE).toBe(0);
  });

  it("PUT /api/kiosk/devices/:id/status - should allow System Admin to reactivate the terminal", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .put(`/api/kiosk/devices/${createdKioskId}/status`)
      .set(authHeader)
      .send({
        STATUSID: 10, // ACT
      });

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.ISACTIVE).toBe(1);
  });

  it("GET /api/kiosk/devices/telemetry - should return fleet health summary and online/offline status", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .get("/api/kiosk/devices/telemetry")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.TOTAL_DEVICES).toBeGreaterThan(0);
    expect(res.body.DATA.ONLINE).toBeDefined();
    expect(res.body.DATA.OFFLINE).toBeDefined();
    expect(res.body.DATA.DEVICES).toBeInstanceOf(Array);

    const testDev = res.body.DATA.DEVICES.find((d) => d.KIOSKID === createdKioskId);
    expect(testDev).toBeDefined();
    expect(["ONLINE", "STALE", "OFFLINE"]).toContain(testDev.HEALTH_STATUS);
  });
});
