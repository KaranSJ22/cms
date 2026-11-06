import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { pool } from "../../../db/connection.js";
import { getAuthHeader, getFutureDate } from "../../../test/testHelpers.js";

describe("Day Slot Module: Security & RBAC Guards", () => {
  it("should reject unauthenticated request to GET /api/day-slots with HTTP 401", async () => {
    const res = await request(app).get("/api/day-slots");

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject unauthenticated request to POST /api/day-slots with HTTP 401", async () => {
    const res = await request(app)
      .post("/api/day-slots")
      .send({
        CANTEENID: 1,
        SERVICEID: 1,
        SERVICEDATE: getFutureDate(7),
        STARTTIME: "12:00",
        ENDTIME: "14:30",
      });

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from GET /api/day-slots with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/day-slots")
      .set(userAuth);

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from POST /api/day-slots with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .post("/api/day-slots")
      .set(userAuth)
      .send({
        CANTEENID: 1,
        SERVICEID: 1,
        SERVICEDATE: getFutureDate(7),
        STARTTIME: "12:00",
        ENDTIME: "14:30",
      });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from PUT /api/day-slots/:id with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .put("/api/day-slots/1")
      .set(userAuth)
      .send({
        STARTTIME: "12:15",
        ENDTIME: "14:30",
        STATUS: "ACT",
      });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });
});

describe("Day Slot Module: Input Validation", () => {
  it("should reject POST /api/day-slots when required fields are missing with HTTP 400", async () => {
    const managerAuth = await getAuthHeader("mgr1");

    const res = await request(app)
      .post("/api/day-slots")
      .set(managerAuth)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject POST when time format is invalid with HTTP 400", async () => {
    const managerAuth = await getAuthHeader("mgr1");

    const res = await request(app)
      .post("/api/day-slots")
      .set(managerAuth)
      .send({
        CANTEENID: 1,
        SERVICEID: 1,
        SERVICEDATE: getFutureDate(7),
        STARTTIME: "25:70",
        ENDTIME: "14:30",
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject POST when date format is invalid with HTTP 400", async () => {
    const managerAuth = await getAuthHeader("mgr1");

    const res = await request(app)
      .post("/api/day-slots")
      .set(managerAuth)
      .send({
        CANTEENID: 1,
        SERVICEID: 1,
        SERVICEDATE: "01-11-2026",
        STARTTIME: "12:00",
        ENDTIME: "14:30",
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject GET /api/day-slots/:id when id is not a positive integer with HTTP 400", async () => {
    const managerAuth = await getAuthHeader("mgr1");

    const res = await request(app)
      .get("/api/day-slots/not_an_id")
      .set(managerAuth);

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject PUT /api/day-slots/:id when body is missing required status with HTTP 400", async () => {
    const managerAuth = await getAuthHeader("mgr1");

    const res = await request(app)
      .put("/api/day-slots/1")
      .set(managerAuth)
      .send({
        STARTTIME: "12:00",
        ENDTIME: "14:00",
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });
});

describe("Day Slot Module: Dynamic CRUD Lifecycle & Filtering", () => {
  let managerAuth;
  let testCanteenId;
  let testServiceId;
  let createdSlotId;
  const targetDate = getFutureDate(14);

  beforeAll(async () => {
    managerAuth = await getAuthHeader("mgr1");

    // Fetch an active canteen
    const [canteens] = await pool.query(
      "SELECT CANTEENID FROM CMS_CANTEEN WHERE STATUSID = 10 ORDER BY CANTEENID ASC LIMIT 1"
    );
    testCanteenId = canteens[0]?.CANTEENID || 1;

    // Dynamically create a unique Service for this test suite to guarantee collision-free idempotency
    const servCode = `DS${Date.now().toString().slice(-4)}`;
    const [servRes] = await pool.query(
      `INSERT INTO CMS_SERVICE (SERVCODE, SERVNAME, DEFSTART, DEFEND, STATUSID, CREATEDBY)
       VALUES (?, 'DaySlot Lifecycle Service', '12:00:00', '14:30:00', 10, 1)`,
      [servCode]
    );
    testServiceId = servRes.insertId;
  });

  it("should allow Canteen Manager to create a new Day Slot with HTTP 201", async () => {
    const res = await request(app)
      .post("/api/day-slots")
      .set(managerAuth)
      .send({
        CANTEENID: testCanteenId,
        SERVICEID: testServiceId,
        SERVICEDATE: targetDate,
        STARTTIME: "12:00",
        ENDTIME: "14:30",
      });

    expect(res.status).toBe(201);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeDefined();
    expect(res.body.DATA).toHaveProperty("DAYSLOTID");
    expect(res.body.DATA.DAYSLOTID).toBeGreaterThan(0);
    expect(res.body.DATA.SLOTNO).toMatch(/^SLT/);
    expect(res.body.DATA.STATUSID).toBe(10); // Active
    expect(res.body.DATA.APPRSTATUSID).toBe(20); // Draft approval status

    createdSlotId = res.body.DATA.DAYSLOTID;
  });

  it("should reject duplicate day slot creation for same canteen, service, and date with HTTP 409 Conflict", async () => {
    const res = await request(app)
      .post("/api/day-slots")
      .set(managerAuth)
      .send({
        CANTEENID: testCanteenId,
        SERVICEID: testServiceId,
        SERVICEDATE: targetDate,
        STARTTIME: "12:00",
        ENDTIME: "14:30",
      });

    expect(res.status).toBe(409);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should allow Canteen Manager to list day slots with filters with HTTP 200", async () => {
    const res = await request(app)
      .get(`/api/day-slots?canteenId=${testCanteenId}&serviceId=${testServiceId}&dateFrom=${targetDate}&dateTo=${targetDate}`)
      .set(managerAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(Array.isArray(res.body.DATA)).toBe(true);
    expect(res.body.DATA.length).toBe(1);
    expect(res.body.DATA[0].DAYSLOTID).toBe(createdSlotId);
  });

  it("should allow Canteen Manager to fetch a single day slot by ID with HTTP 200", async () => {
    const res = await request(app)
      .get(`/api/day-slots/${createdSlotId}`)
      .set(managerAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.DAYSLOTID).toBe(createdSlotId);
    expect(res.body.DATA.CANTEENID).toBe(testCanteenId);
    expect(res.body.DATA.SERVICEID).toBe(testServiceId);
  });

  it("should return HTTP 404 when querying a non-existent day slot ID", async () => {
    const res = await request(app)
      .get("/api/day-slots/999999")
      .set(managerAuth);

    expect(res.status).toBe(404);
    expect(res.body.SUCCESS).toBe(false);
    expect(res.body.MESSAGE).toContain("Day slot not found");
  });

  it("should allow Canteen Manager to update day slot operating times with HTTP 200", async () => {
    const res = await request(app)
      .put(`/api/day-slots/${createdSlotId}`)
      .set(managerAuth)
      .send({
        STARTTIME: "12:15:00",
        ENDTIME: "14:45:00",
        STATUS: "ACT",
        CHGREASON: "Extended lunch window for VIP delegation",
      });

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.STARTTIME).toBe("12:15:00");
    expect(res.body.DATA.ENDTIME).toBe("14:45:00");
  });
});

describe("Day Slot Module: Business Rule Invariants", () => {
  let managerAuth;
  let testCanteenId;
  let testServiceId;

  beforeAll(async () => {
    managerAuth = await getAuthHeader("mgr1");

    const [canteens] = await pool.query(
      "SELECT CANTEENID FROM CMS_CANTEEN WHERE STATUSID = 10 LIMIT 1"
    );
    testCanteenId = canteens[0]?.CANTEENID || 1;

    const servCode = `DS${Date.now().toString().slice(-4)}B`;
    const [servRes] = await pool.query(
      `INSERT INTO CMS_SERVICE (SERVCODE, SERVNAME, DEFSTART, DEFEND, STATUSID, CREATEDBY)
       VALUES (?, 'DaySlot Invariant Service', '16:00:00', '18:00:00', 10, 1)`,
      [servCode]
    );
    testServiceId = servRes.insertId;
  });

  it("should reject slot creation when ENDTIME is before or equal to STARTTIME with HTTP 400", async () => {
    const res = await request(app)
      .post("/api/day-slots")
      .set(managerAuth)
      .send({
        CANTEENID: testCanteenId,
        SERVICEID: testServiceId,
        SERVICEDATE: getFutureDate(21),
        STARTTIME: "14:00",
        ENDTIME: "13:00",
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
    expect(res.body.MESSAGE).toContain("Slot end time must be after start time");
  });
});
