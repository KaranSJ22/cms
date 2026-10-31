import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { pool } from "../../../db/connection.js";
import { getAuthHeader } from "../../../test/testHelpers.js";

describe("Pricing Module: Security & RBAC Guards", () => {
  it("should reject unauthenticated request to POST /api/pricing/menu-items/:id with HTTP 401", async () => {
    const res = await request(app)
      .post("/api/pricing/menu-items/1")
      .send({
        EFFFROM: "2025-01-01",
        PRICES: [{ CTYPECODE: "PRM", PRICE: 20 }],
      });

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject unauthenticated request to GET /api/pricing/menu-items/:id with HTTP 401", async () => {
    const res = await request(app).get("/api/pricing/menu-items/1");

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from POST /api/pricing/menu-items/:id with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .post("/api/pricing/menu-items/1")
      .set(userAuth)
      .send({
        EFFFROM: "2025-01-01",
        PRICES: [{ CTYPECODE: "PRM", PRICE: 20 }],
      });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from GET /api/pricing/menu-items/:id with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/pricing/menu-items/1")
      .set(userAuth);

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from PATCH /api/pricing/item-prices/:id/deactivate with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .patch("/api/pricing/item-prices/1/deactivate")
      .set(userAuth);

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });
});

describe("Pricing Module: Input Validation", () => {
  it("should reject POST /api/pricing/menu-items/:id when body is missing required fields with HTTP 400", async () => {
    const managerAuth = await getAuthHeader("mgr1");

    const res = await request(app)
      .post("/api/pricing/menu-items/1")
      .set(managerAuth)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject POST when EFFFROM has an invalid date format with HTTP 400", async () => {
    const managerAuth = await getAuthHeader("mgr1");

    const res = await request(app)
      .post("/api/pricing/menu-items/1")
      .set(managerAuth)
      .send({
        EFFFROM: "01-01-2025",
        PRICES: [{ CTYPECODE: "PRM", PRICE: 25 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject POST when PRICES array is empty with HTTP 400", async () => {
    const managerAuth = await getAuthHeader("mgr1");

    const res = await request(app)
      .post("/api/pricing/menu-items/1")
      .set(managerAuth)
      .send({
        EFFFROM: "2025-01-01",
        PRICES: [],
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject POST when PRICES array has duplicate customer types with HTTP 400", async () => {
    const managerAuth = await getAuthHeader("mgr1");

    const res = await request(app)
      .post("/api/pricing/menu-items/1")
      .set(managerAuth)
      .send({
        EFFFROM: "2025-01-01",
        PRICES: [
          { CTYPECODE: "PRM", PRICE: 20 },
          { CTYPECODE: "PRM", PRICE: 30 },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject POST when menuItemId is not a positive integer with HTTP 400", async () => {
    const managerAuth = await getAuthHeader("mgr1");

    const res = await request(app)
      .post("/api/pricing/menu-items/invalid_id")
      .set(managerAuth)
      .send({
        EFFFROM: "2025-01-01",
        PRICES: [{ CTYPECODE: "PRM", PRICE: 20 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject GET /effective/:customerTypeCode when customerTypeCode is not a valid enum value with HTTP 400", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/pricing/menu-items/1/effective/INVALID_TYPE?serviceDate=2025-06-01")
      .set(userAuth);

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });
});

describe("Pricing Module: Multi-Tier Pricing Lifecycle & Rate Resolution", () => {
  let testMenuItemId;
  let managerAuth;
  let userAuth;
  let createdPriceBandId;

  beforeAll(async () => {
    managerAuth = await getAuthHeader("mgr1");
    userAuth = await getAuthHeader("perm1");

    // Always create a fresh, dedicated test Menu Item to avoid collisions across test runs
    const code = `ITMP${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
    const [res] = await pool.query(
      `INSERT INTO CMS_MENUITEM (MENUCODE, SHORTNAME, ITEMNAME, SERVICEID, STATUSID, CREATEDBY)
       VALUES (?, 'TST', 'Pricing Lifecycle Item', 1, 10, 2)`,
      [code]
    );
    testMenuItemId = res.insertId;
  });

  afterAll(async () => {
    if (testMenuItemId) {
      await pool.query(
        "DELETE FROM CMS_ITMPRICDT WHERE ITEMPRICEID IN (SELECT ITEMPRICEID FROM CMS_ITEMPRICE WHERE MENUITEMID = ?)",
        [testMenuItemId]
      );
      await pool.query("DELETE FROM CMS_ITEMPRICE WHERE MENUITEMID = ?", [testMenuItemId]);
      await pool.query("DELETE FROM CMS_MENUITEM WHERE MENUITEMID = ?", [testMenuItemId]);
    }
  });

  it("should allow Canteen Manager to create a tiered price band with HTTP 201", async () => {
    const res = await request(app)
      .post(`/api/pricing/menu-items/${testMenuItemId}`)
      .set(managerAuth)
      .send({
        EFFFROM: "2025-01-01",
        PRICES: [
          { CTYPECODE: "PRM", PRICE: 20.0 },
          { CTYPECODE: "CNT", PRICE: 35.0 },
          { CTYPECODE: "VIS", PRICE: 50.0 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toHaveProperty("ITEMPRICEID");
    expect(res.body.DATA.ITEMPRICEID).toBeGreaterThan(0);

    createdPriceBandId = res.body.DATA.ITEMPRICEID;
  });

  it("should allow regular employee (perm1) to fetch all effective prices on a date with HTTP 200", async () => {
    const res = await request(app)
      .get(`/api/pricing/menu-items/${testMenuItemId}/effective?serviceDate=2025-06-01`)
      .set(userAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(Array.isArray(res.body.DATA)).toBe(true);
    expect(res.body.DATA.length).toBeGreaterThanOrEqual(3);

    const prmEntry = res.body.DATA.find((item) => item.CTYPECODE === "PRM");
    const cntEntry = res.body.DATA.find((item) => item.CTYPECODE === "CNT");
    const visEntry = res.body.DATA.find((item) => item.CTYPECODE === "VIS");

    expect(prmEntry).toBeDefined();
    expect(Number(prmEntry.PRICE)).toBe(20.0);
    expect(cntEntry).toBeDefined();
    expect(Number(cntEntry.PRICE)).toBe(35.0);
    expect(visEntry).toBeDefined();
    expect(Number(visEntry.PRICE)).toBe(50.0);
  });

  it("should allow regular employee (perm1) to fetch specific effective price for PRM with HTTP 200", async () => {
    const res = await request(app)
      .get(`/api/pricing/menu-items/${testMenuItemId}/effective/PRM?serviceDate=2025-06-01`)
      .set(userAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(Number(res.body.DATA.PRICE)).toBe(20.0);
  });

  it("should allow regular employee (perm1) to fetch specific effective price for VIS with HTTP 200", async () => {
    const res = await request(app)
      .get(`/api/pricing/menu-items/${testMenuItemId}/effective/VIS?serviceDate=2025-06-01`)
      .set(userAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(Number(res.body.DATA.PRICE)).toBe(50.0);
  });

  it("should return HTTP 404 when querying effective price for a date prior to EFFFROM", async () => {
    const res = await request(app)
      .get(`/api/pricing/menu-items/${testMenuItemId}/effective/PRM?serviceDate=2020-01-01`)
      .set(userAuth);

    expect(res.status).toBe(404);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should allow Canteen Manager to view full item price revision history with HTTP 200", async () => {
    const res = await request(app)
      .get(`/api/pricing/menu-items/${testMenuItemId}`)
      .set(managerAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(Array.isArray(res.body.DATA)).toBe(true);
    expect(res.body.DATA.length).toBeGreaterThan(0);

    const priceBand = res.body.DATA.find((band) => band.ITEMPRICEID === createdPriceBandId);
    expect(priceBand).toBeDefined();
    expect(priceBand.PRICES.length).toBe(3);
  });
});

describe("Pricing Module: Business Rule Invariants & Deactivation", () => {
  let testMenuItemId;
  let managerAuth;
  let activePriceBandId;
  let futurePriceBandId;

  beforeAll(async () => {
    managerAuth = await getAuthHeader("mgr1");

    // Always create a fresh, dedicated test Menu Item to avoid duplicate (MENUITEMID, EFFFROM) collisions
    const code = `ITMI${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
    const [res] = await pool.query(
      `INSERT INTO CMS_MENUITEM (MENUCODE, SHORTNAME, ITEMNAME, SERVICEID, STATUSID, CREATEDBY)
       VALUES (?, 'TST', 'Pricing Invariants Item', 1, 10, 2)`,
      [code]
    );
    testMenuItemId = res.insertId;

    // Create an active price band effective in the past
    const activeRes = await request(app)
      .post(`/api/pricing/menu-items/${testMenuItemId}`)
      .set(managerAuth)
      .send({
        EFFFROM: "2024-01-01",
        PRICES: [{ CTYPECODE: "PRM", PRICE: 15.0 }],
      });
    activePriceBandId = activeRes.body.DATA.ITEMPRICEID;

    // Create a future scheduled price band
    const futureRes = await request(app)
      .post(`/api/pricing/menu-items/${testMenuItemId}`)
      .set(managerAuth)
      .send({
        EFFFROM: "2099-01-01",
        PRICES: [{ CTYPECODE: "PRM", PRICE: 30.0 }],
      });
    futurePriceBandId = futureRes.body.DATA.ITEMPRICEID;
  });

  afterAll(async () => {
    if (testMenuItemId) {
      await pool.query(
        "DELETE FROM CMS_ITMPRICDT WHERE ITEMPRICEID IN (SELECT ITEMPRICEID FROM CMS_ITEMPRICE WHERE MENUITEMID = ?)",
        [testMenuItemId]
      );
      await pool.query("DELETE FROM CMS_ITEMPRICE WHERE MENUITEMID = ?", [testMenuItemId]);
      await pool.query("DELETE FROM CMS_MENUITEM WHERE MENUITEMID = ?", [testMenuItemId]);
    }
  });

  it("should reject deactivating an already effective price band with HTTP 400", async () => {
    const res = await request(app)
      .patch(`/api/pricing/item-prices/${activePriceBandId}/deactivate`)
      .set(managerAuth);

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
    expect(res.body.MESSAGE).toContain("Cannot withdraw a price band that is already effective");
  });

  it("should allow Canteen Manager to deactivate a future scheduled price band with HTTP 200", async () => {
    const res = await request(app)
      .patch(`/api/pricing/item-prices/${futurePriceBandId}/deactivate`)
      .set(managerAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toHaveProperty("ITEMPRICEID", futurePriceBandId);
  });
});
