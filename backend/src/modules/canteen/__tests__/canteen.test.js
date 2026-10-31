import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { getAuthHeader } from "../../../test/testHelpers.js";

describe("Canteen Module: GET /api/canteens", () => {
  it("should reject unauthenticated request with HTTP 401", async () => {
    const res = await request(app).get("/api/canteens");

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should return 200 and list all operational canteens for authenticated user", async () => {
    const authHeader = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/canteens")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeInstanceOf(Array);
    expect(res.body.DATA.length).toBeGreaterThanOrEqual(3);

    // Verify canteen structure and presence of seed facilities
    const codes = res.body.DATA.map((c) => c.CANTEENCODE);
    expect(codes).toContain("CAN-A");
    expect(codes).toContain("CAN-B");
    expect(codes).toContain("CAN-C");

    const first = res.body.DATA[0];
    expect(first.CANTEENID).toBeDefined();
    expect(first.CANTEENNAME).toBeDefined();
    expect(first.CENTERID).toBeDefined();
    expect(first.CENTERNAME).toBeDefined();
    expect(first.STATUSCODE).toBeDefined();
  });

  it("should filter canteens by CENTERID when query parameter is provided", async () => {
    const authHeader = await getAuthHeader("perm1");

    // Center 1 is HQ Main Campus
    const res = await request(app)
      .get("/api/canteens?CENTERID=1")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeInstanceOf(Array);
    expect(res.body.DATA.length).toBeGreaterThan(0);

    for (const canteen of res.body.DATA) {
      expect(canteen.CENTERID).toBe(1);
    }
  });

  it("should return empty list when filtering by non-existent CENTERID", async () => {
    const authHeader = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/canteens?CENTERID=99999")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toEqual([]);
  });

  it("should reject negative CENTERID with HTTP 400 validation error", async () => {
    const authHeader = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/canteens?CENTERID=-5")
      .set(authHeader);

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject non-numeric CENTERID with HTTP 400 validation error", async () => {
    const authHeader = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/canteens?CENTERID=invalid_text")
      .set(authHeader);

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });
});

describe("Canteen Module: Campus Centers Management", () => {
  it("GET /api/canteens/centers - should return list of active campus centers", async () => {
    const authHeader = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/canteens/centers")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeInstanceOf(Array);
    expect(res.body.DATA.length).toBeGreaterThan(0);

    const first = res.body.DATA[0];
    expect(first.CENTERID).toBeDefined();
    expect(first.CENTERCODE).toBeDefined();
    expect(first.CENTERNAME).toBeDefined();
  });

  it("POST /api/canteens/centers - should reject non-admin (perm1) with HTTP 403", async () => {
    const authHeader = await getAuthHeader("perm1");

    const res = await request(app)
      .post("/api/canteens/centers")
      .set(authHeader)
      .send({
        CENTERCODE: "CEN-TEST",
        CENTERNAME: "Test Center",
      });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("POST /api/canteens/centers - should allow System Admin to register new campus center with HTTP 201", async () => {
    const authHeader = await getAuthHeader("admin");

    const code = `CEN-${Date.now().toString().slice(-4)}`;
    const res = await request(app)
      .post("/api/canteens/centers")
      .set(authHeader)
      .send({
        CENTERCODE: code,
        CENTERNAME: "Advanced Propulsion Complex",
        LOCATION: "Valiamala Campus",
      });

    expect(res.status).toBe(201);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA?.CENTERID).toBeDefined();
  });
});

describe("Canteen Module: Facility Infrastructure Management (SYSADM)", () => {
  const TEST_CANTEEN_CODE = `CAN-T${Date.now().toString().slice(-3)}`;
  let createdCanteenId = null;

  it("POST /api/canteens - should reject non-admin employee (perm1) with HTTP 403", async () => {
    const authHeader = await getAuthHeader("perm1");

    const res = await request(app)
      .post("/api/canteens")
      .set(authHeader)
      .send({
        CENTERID: 1,
        CANTEENCODE: TEST_CANTEEN_CODE,
        CANTEENNAME: "Unauthorized Attempt",
      });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("POST /api/canteens - should reject Canteen Manager (mgr1) with HTTP 403 (SYSADM only)", async () => {
    const authHeader = await getAuthHeader("mgr1");

    const res = await request(app)
      .post("/api/canteens")
      .set(authHeader)
      .send({
        CENTERID: 1,
        CANTEENCODE: TEST_CANTEEN_CODE,
        CANTEENNAME: "Manager Attempt",
      });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("POST /api/canteens - should reject missing required fields with HTTP 400", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .post("/api/canteens")
      .set(authHeader)
      .send({
        CENTERID: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("POST /api/canteens - should allow System Admin to register a new canteen facility with HTTP 201", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .post("/api/canteens")
      .set(authHeader)
      .send({
        CENTERID: 1,
        CANTEENCODE: TEST_CANTEEN_CODE,
        CANTEENNAME: "ISRO Electronics Complex Canteen",
        LOCATION: "Building 12, Ground Floor",
      });

    expect(res.status).toBe(201);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA?.CANTEENID).toBeDefined();
    expect(res.body.DATA?.CANTEENCODE).toBe(TEST_CANTEEN_CODE);

    createdCanteenId = res.body.DATA.CANTEENID;
  });

  it("GET /api/canteens/:id - should fetch details of the registered canteen facility with HTTP 200", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .get(`/api/canteens/${createdCanteenId}`)
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.CANTEENID).toBe(createdCanteenId);
    expect(res.body.DATA.CANTEENCODE).toBe(TEST_CANTEEN_CODE);
    expect(res.body.DATA.CENTERNAME).toBeDefined();
  });

  it("GET /api/canteens/:id - should return HTTP 404 for non-existent canteen ID", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .get("/api/canteens/999999")
      .set(authHeader);

    expect(res.status).toBe(404);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("PUT /api/canteens/:id - should allow System Admin to update canteen details with HTTP 200", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .put(`/api/canteens/${createdCanteenId}`)
      .set(authHeader)
      .send({
        CANTEENNAME: "ISRO Electronics Complex Canteen (Updated)",
        LOCATION: "Building 12, 1st Floor",
        STATUSCODE: "ACT",
      });

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.CANTEENNAME).toBe("ISRO Electronics Complex Canteen (Updated)");
  });

  it("DELETE /api/canteens/:id - should allow System Admin to deactivate the canteen facility with HTTP 200", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .delete(`/api/canteens/${createdCanteenId}`)
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.STATUSID).toBe(11); // DIS
  });
});

