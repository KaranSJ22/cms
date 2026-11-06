import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { pool } from "../../../db/connection.js";
import { getAuthHeader, getFutureDate, getFutureDateTime } from "../../../test/testHelpers.js";

describe("Day Menu Module: Security & RBAC Guards", () => {
  let sharedSlotId = 1;

  beforeAll(async () => {
    const [slots] = await pool.query(
      "SELECT DAYSLOTID FROM CMS_DAYSLOT ORDER BY DAYSLOTID ASC LIMIT 1"
    );
    if (slots.length > 0) {
      sharedSlotId = slots[0].DAYSLOTID;
    }
  });

  it("should reject unauthenticated request to GET /api/day-menus/slots/:daySlotId with HTTP 401", async () => {
    const res = await request(app).get(`/api/day-menus/slots/${sharedSlotId}`);

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from GET /api/day-menus/slots/:daySlotId with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .get(`/api/day-menus/slots/${sharedSlotId}`)
      .set(userAuth);

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from PUT /api/day-menus/slots/:daySlotId with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .put(`/api/day-menus/slots/${sharedSlotId}`)
      .set(userAuth)
      .send({
        ITEMSJSON: [
          {
            MENUITEMID: 1,
            ISBASE: 1,
            ISSPECIAL: 0,
            ISPREBOOK: 1,
            ISKIOSK: 1,
            MAXQTY: 10,
            BOOKUNTIL: getFutureDateTime(14, "23:59:59"),
            CANCELUNTIL: getFutureDateTime(14, "22:00:00"),
          },
        ],
      });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from POST /api/day-menus/slots/:daySlotId/submit with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .post(`/api/day-menus/slots/${sharedSlotId}/submit`)
      .set(userAuth);

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from POST /api/day-menus/slots/:daySlotId/approve with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .post(`/api/day-menus/slots/${sharedSlotId}/approve`)
      .set(userAuth)
      .send({ REMARKS: "Approved" });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from POST /api/day-menus/slots/:daySlotId/reject with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .post(`/api/day-menus/slots/${sharedSlotId}/reject`)
      .set(userAuth)
      .send({ REMARKS: "Needs work" });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from GET /api/day-menus/pending with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/day-menus/pending")
      .set(userAuth);

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from POST /api/day-menus/bulk with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .post("/api/day-menus/bulk")
      .set(userAuth)
      .send({});

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });
});

describe("Day Menu Module: Input Validation", () => {
  let sharedSlotId = 1;

  beforeAll(async () => {
    const [slots] = await pool.query(
      "SELECT DAYSLOTID FROM CMS_DAYSLOT ORDER BY DAYSLOTID ASC LIMIT 1"
    );
    if (slots.length > 0) {
      sharedSlotId = slots[0].DAYSLOTID;
    }
  });

  it("should reject GET /api/day-menus/slots/:daySlotId when daySlotId is invalid with HTTP 400", async () => {
    const managerAuth = await getAuthHeader("mgr1");

    const res = await request(app)
      .get("/api/day-menus/slots/not_a_number")
      .set(managerAuth);

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject PUT /api/day-menus/slots/:daySlotId when ITEMSJSON is empty with HTTP 400", async () => {
    const managerAuth = await getAuthHeader("mgr1");

    const res = await request(app)
      .put(`/api/day-menus/slots/${sharedSlotId}`)
      .set(managerAuth)
      .send({ ITEMSJSON: [] });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject PUT when item fields are missing or invalid with HTTP 400", async () => {
    const managerAuth = await getAuthHeader("mgr1");

    const res = await request(app)
      .put(`/api/day-menus/slots/${sharedSlotId}`)
      .set(managerAuth)
      .send({
        ITEMSJSON: [
          {
            MENUITEMID: 1,
            ISBASE: 1,
            // missing MAXQTY, BOOKUNTIL, CANCELUNTIL
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject GET /api/day-menus/published when required query params are missing with HTTP 400", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/day-menus/published")
      .set(userAuth);

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });
});

describe("Day Menu Module: Dynamic Lifecycle & Multi-Customer-Type Published Pricing", () => {
  let managerAuth;
  let permAuth;
  let contAuth;
  let oceAuth;
  let visAuth;

  let testCanteenId;
  let testServiceId;
  let testMenuItemId;
  let testDaySlotId;

  const targetDate = getFutureDate(14);
  const bookUntil = getFutureDateTime(14, "23:59:59");
  const cancelUntil = getFutureDateTime(14, "22:00:00");

  beforeAll(async () => {
    managerAuth = await getAuthHeader("mgr1");
    permAuth = await getAuthHeader("perm1"); // PRM
    contAuth = await getAuthHeader("cont1"); // CNT
    oceAuth = await getAuthHeader("oce1");   // OCE
    visAuth = await getAuthHeader("vis1");   // VIS

    // Canteen A where mgr1 has CNTMGR assignment
    testCanteenId = 1;

    // 1. Create a unique Service for this test run
    const servCode = `DM${Date.now().toString().slice(-4)}`;
    const [servRes] = await pool.query(
      `INSERT INTO CMS_SERVICE (SERVCODE, SERVNAME, DEFSTART, DEFEND, STATUSID, CREATEDBY)
       VALUES (?, 'DayMenu Lifecycle Service', '12:00:00', '14:30:00', 10, 1)`,
      [servCode]
    );
    testServiceId = servRes.insertId;

    // 2. Create a unique active Menu Item
    const menuCode = `ITM${Date.now().toString().slice(-4)}`;
    const [itemRes] = await pool.query(
      `INSERT INTO CMS_MENUITEM (MENUCODE, SHORTNAME, ITEMNAME, SERVICEID, STATUSID, CREATEDBY)
       VALUES (?, 'DML', 'Multi-Customer Thali', ?, 10, 1)`,
      [menuCode, testServiceId]
    );
    testMenuItemId = itemRes.insertId;

    // 3. Configure Price Band with rates for ALL active customer types (PRM, CNT, OCE, VIS, OFF)
    await request(app)
      .post(`/api/pricing/menu-items/${testMenuItemId}`)
      .set(managerAuth)
      .send({
        EFFFROM: "2025-01-01",
        PRICES: [
          { CTYPECODE: "PRM", PRICE: 20.00 },
          { CTYPECODE: "CNT", PRICE: 35.00 },
          { CTYPECODE: "OCE", PRICE: 25.00 },
          { CTYPECODE: "VIS", PRICE: 50.00 },
          { CTYPECODE: "OFF", PRICE: 30.00 },
        ],
      });

    // 4. Create an active Day Slot in Draft state
    const slotRes = await request(app)
      .post("/api/day-slots")
      .set(managerAuth)
      .send({
        CANTEENID: testCanteenId,
        SERVICEID: testServiceId,
        SERVICEDATE: targetDate,
        STARTTIME: "12:00",
        ENDTIME: "14:30",
      });

    testDaySlotId = slotRes.body.DATA.DAYSLOTID;
  });

  it("should allow Canteen Manager to stage menu items into the day slot with HTTP 200", async () => {
    const res = await request(app)
      .put(`/api/day-menus/slots/${testDaySlotId}`)
      .set(managerAuth)
      .send({
        ITEMSJSON: [
          {
            MENUITEMID: testMenuItemId,
            ISBASE: 1,
            ISSPECIAL: 0,
            ISPREBOOK: 1,
            ISKIOSK: 1,
            AVAILQTY: 100,
            MAXQTY: 100,
            BOOKUNTIL: bookUntil,
            CANCELUNTIL: cancelUntil,
            REMARKS: "Fresh daily lunch prep",
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(Array.isArray(res.body.DATA)).toBe(true);
    expect(res.body.DATA.length).toBe(1);
    expect(res.body.DATA[0].MENUITEMID).toBe(testMenuItemId);
    expect(res.body.DATA[0].ISBASE).toBe(1);
  });

  it("should allow Canteen Manager to query the day menu workspace with HTTP 200", async () => {
    const res = await request(app)
      .get(`/api/day-menus/slots/${testDaySlotId}`)
      .set(managerAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(Array.isArray(res.body.DATA)).toBe(true);
    expect(res.body.DATA.length).toBe(1);
    expect(res.body.DATA[0].ITEMNAME).toBe("Multi-Customer Thali");
  });

  it("should allow submitting the day menu for manager approval with HTTP 200", async () => {
    const res = await request(app)
      .post(`/api/day-menus/slots/${testDaySlotId}/submit`)
      .set(managerAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);

    // Verify slot transitioned to Pending Approval (APPRSTATUSID = 21 / PEN)
    const [rows] = await pool.query(
      "SELECT APPRSTATUSID FROM CMS_DAYSLOT WHERE DAYSLOTID = ?",
      [testDaySlotId]
    );
    expect(rows[0].APPRSTATUSID).toBe(21);
  });

  it("should show the submitted slot in the pending day menus list with HTTP 200", async () => {
    const res = await request(app)
      .get(`/api/day-menus/pending?canteenId=${testCanteenId}`)
      .set(managerAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(Array.isArray(res.body.DATA)).toBe(true);

    const pendingSlot = res.body.DATA.find((slot) => slot.DAYSLOTID === testDaySlotId);
    expect(pendingSlot).toBeDefined();
    expect(pendingSlot.APPRSTATUSID).toBe(21);
  });

  it("should allow Canteen Manager to reject a pending menu with feedback remarks with HTTP 200", async () => {
    const res = await request(app)
      .post(`/api/day-menus/slots/${testDaySlotId}/reject`)
      .set(managerAuth)
      .send({ REMARKS: "Please revise spice level and increase max quantity" });

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);

    // Verify slot transitioned to Rejected (APPRSTATUSID = 23 / REJ)
    const [rows] = await pool.query(
      "SELECT APPRSTATUSID FROM CMS_DAYSLOT WHERE DAYSLOTID = ?",
      [testDaySlotId]
    );
    expect(rows[0].APPRSTATUSID).toBe(23);
  });

  it("should allow re-submitting a rejected menu and approving it with HTTP 200", async () => {
    // 1. Re-submit menu (transitions from REJ to PEN)
    const submitRes = await request(app)
      .post(`/api/day-menus/slots/${testDaySlotId}/submit`)
      .set(managerAuth);
    expect(submitRes.status).toBe(200);

    // 2. Approve menu (transitions from PEN to APR)
    const approveRes = await request(app)
      .post(`/api/day-menus/slots/${testDaySlotId}/approve`)
      .set(managerAuth)
      .send({ REMARKS: "Looks good, approved for production" });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.SUCCESS).toBe(true);

    // Verify slot transitioned to Approved (APPRSTATUSID = 22 / APR)
    const [rows] = await pool.query(
      "SELECT APPRSTATUSID FROM CMS_DAYSLOT WHERE DAYSLOTID = ?",
      [testDaySlotId]
    );
    expect(rows[0].APPRSTATUSID).toBe(22);
  });

  describe("Published Menu Customer-Type Tiered Price Resolution", () => {
    it("should resolve Permanent Employee (PRM) rate at ₹20.00 with HTTP 200", async () => {
      const res = await request(app)
        .get(`/api/day-menus/published?canteenId=${testCanteenId}&serviceDate=${targetDate}`)
        .set(permAuth);

      expect(res.status).toBe(200);
      expect(res.body.SUCCESS).toBe(true);
      expect(Array.isArray(res.body.DATA)).toBe(true);
      expect(res.body.DATA.length).toBeGreaterThanOrEqual(1);

      const publishedItem = res.body.DATA.find((item) => item.MENUITEMID === testMenuItemId);
      expect(publishedItem).toBeDefined();
      expect(Number(publishedItem.DISPLAYPRICE)).toBe(20.00);
    });

    it("should resolve Contract Employee (CNT) rate at ₹35.00 with HTTP 200", async () => {
      const res = await request(app)
        .get(`/api/day-menus/published?canteenId=${testCanteenId}&serviceDate=${targetDate}`)
        .set(contAuth);

      expect(res.status).toBe(200);
      expect(res.body.SUCCESS).toBe(true);

      const publishedItem = res.body.DATA.find((item) => item.MENUITEMID === testMenuItemId);
      expect(publishedItem).toBeDefined();
      expect(Number(publishedItem.DISPLAYPRICE)).toBe(35.00);
    });

    it("should resolve Other Center Employee (OCE) rate at ₹25.00 with HTTP 200", async () => {
      const res = await request(app)
        .get(`/api/day-menus/published?canteenId=${testCanteenId}&serviceDate=${targetDate}`)
        .set(oceAuth);

      expect(res.status).toBe(200);
      expect(res.body.SUCCESS).toBe(true);

      const publishedItem = res.body.DATA.find((item) => item.MENUITEMID === testMenuItemId);
      expect(publishedItem).toBeDefined();
      expect(Number(publishedItem.DISPLAYPRICE)).toBe(25.00);
    });

    it("should resolve Guest Visitor (VIS) rate at ₹50.00 with HTTP 200", async () => {
      const res = await request(app)
        .get(`/api/day-menus/published?canteenId=${testCanteenId}&serviceDate=${targetDate}`)
        .set(visAuth);

      expect(res.status).toBe(200);
      expect(res.body.SUCCESS).toBe(true);

      const publishedItem = res.body.DATA.find((item) => item.MENUITEMID === testMenuItemId);
      expect(publishedItem).toBeDefined();
      expect(Number(publishedItem.DISPLAYPRICE)).toBe(50.00);
    });

    it("should allow Canteen Manager to bulk create weekly day menus with ISO-8601 timestamps (including Z) with HTTP 200", async () => {
      const bulkStartDate = getFutureDate(21);
      const res = await request(app)
        .post("/api/day-menus/bulk")
        .set(managerAuth)
        .send({
          CANTEENID: testCanteenId,
          SERVICEID: testServiceId,
          STARTDATE: bulkStartDate,
          STARTTIME: "12:00",
          ENDTIME: "14:30",
          ACTION: "PUBLISH",
          DAYS: [
            {
              DAYINDEX: 0,
              STARTTIME: "12:00",
              ENDTIME: "14:30",
              OVERRIDEHOLIDAY: true,
              ITEMS: [
                {
                  MENUITEMID: testMenuItemId,
                  ISBASE: 1,
                  ISSPECIAL: 0,
                  ISPREBOOK: 1,
                  ISKIOSK: 1,
                  MAXQTY: 5,
                  AVAILQTY: 100,
                  BOOKUNTIL: `${bulkStartDate}T06:30:00.000Z`,
                  CANCELUNTIL: `${bulkStartDate}T06:30:00.000Z`,
                },
              ],
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.SUCCESS).toBe(true);
      expect(Array.isArray(res.body.DATA)).toBe(true);
      expect(res.body.DATA.length).toBe(1);
      expect(res.body.DATA[0].itemsInserted).toBe(1);
    });

    it("should create day menus across all 7 days in a week without prematurely terminating after single day", async () => {
      const bulkStartDate = getFutureDate(28);
      const daysPayload = Array.from({ length: 7 }, (_, idx) => {
        const dayDate = getFutureDate(28 + idx);
        return {
          DAYINDEX: idx,
          STARTTIME: "12:00",
          ENDTIME: "14:30",
          OVERRIDEHOLIDAY: true,
          ITEMS: [
            {
              MENUITEMID: testMenuItemId,
              ISBASE: 1,
              ISSPECIAL: 0,
              ISPREBOOK: 1,
              ISKIOSK: 1,
              MAXQTY: 5,
              AVAILQTY: 100,
              BOOKUNTIL: `${dayDate}T06:30:00.000Z`,
              CANCELUNTIL: `${dayDate}T06:30:00.000Z`,
            },
          ],
        };
      });

      const res = await request(app)
        .post("/api/day-menus/bulk")
        .set(managerAuth)
        .send({
          CANTEENID: testCanteenId,
          SERVICEID: testServiceId,
          STARTDATE: bulkStartDate,
          STARTTIME: "12:00",
          ENDTIME: "14:30",
          ACTION: "PUBLISH",
          DAYS: daysPayload,
        });

      expect(res.status).toBe(200);
      expect(res.body.SUCCESS).toBe(true);
      expect(Array.isArray(res.body.DATA)).toBe(true);
      expect(res.body.DATA.length).toBe(7);
      expect(res.body.DATA.every((d) => d.itemsInserted === 1)).toBe(true);
    });
  });
});

describe("Day Menu Module: Business Rule Invariants", () => {
  let managerAuth;
  let testCanteenId;
  let testServiceId;
  let testSideItemId;
  let noBaseSlotId;

  const targetDate = getFutureDate(15);
  const bookUntil = getFutureDateTime(15, "23:59:59");
  const cancelUntil = getFutureDateTime(15, "22:00:00");

  beforeAll(async () => {
    managerAuth = await getAuthHeader("mgr1");
    testCanteenId = 1;

    // Service
    const servCode = `DM${Date.now().toString().slice(-4)}B`;
    const [servRes] = await pool.query(
      `INSERT INTO CMS_SERVICE (SERVCODE, SERVNAME, DEFSTART, DEFEND, STATUSID, CREATEDBY)
       VALUES (?, 'DayMenu Invariant Service', '16:00:00', '18:00:00', 10, 1)`,
      [servCode]
    );
    testServiceId = servRes.insertId;

    // Side Item
    const menuCode = `ITM${Date.now().toString().slice(-4)}B`;
    const [itemRes] = await pool.query(
      `INSERT INTO CMS_MENUITEM (MENUCODE, SHORTNAME, ITEMNAME, SERVICEID, STATUSID, CREATEDBY)
       VALUES (?, 'SD1', 'Side Item Only', ?, 10, 1)`,
      [menuCode, testServiceId]
    );
    testSideItemId = itemRes.insertId;

    // Complete price band
    await request(app)
      .post(`/api/pricing/menu-items/${testSideItemId}`)
      .set(managerAuth)
      .send({
        EFFFROM: "2025-01-01",
        PRICES: [
          { CTYPECODE: "PRM", PRICE: 5.00 },
          { CTYPECODE: "CNT", PRICE: 10.00 },
          { CTYPECODE: "OCE", PRICE: 8.00 },
          { CTYPECODE: "VIS", PRICE: 15.00 },
          { CTYPECODE: "OFF", PRICE: 10.00 },
        ],
      });

    // Create slot
    const slotRes = await request(app)
      .post("/api/day-slots")
      .set(managerAuth)
      .send({
        CANTEENID: testCanteenId,
        SERVICEID: testServiceId,
        SERVICEDATE: targetDate,
        STARTTIME: "16:00",
        ENDTIME: "18:00",
      });
    noBaseSlotId = slotRes.body.DATA.DAYSLOTID;
  });

  it("should reject submitting a day menu when NO active base item exists with HTTP 400", async () => {
    // Stage an item with ISBASE = 0
    await request(app)
      .put(`/api/day-menus/slots/${noBaseSlotId}`)
      .set(managerAuth)
      .send({
        ITEMSJSON: [
          {
            MENUITEMID: testSideItemId,
            ISBASE: 0, // No base item!
            ISSPECIAL: 0,
            ISPREBOOK: 1,
            ISKIOSK: 1,
            AVAILQTY: 50,
            MAXQTY: 50,
            BOOKUNTIL: bookUntil,
            CANCELUNTIL: cancelUntil,
          },
        ],
      });

    const res = await request(app)
      .post(`/api/day-menus/slots/${noBaseSlotId}/submit`)
      .set(managerAuth);

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
    expect(res.body.MESSAGE).toContain("At least one active base item is required");
  });

  it("should reject approving a day menu that is still in Draft state with HTTP 400", async () => {
    // Attempting to approve noBaseSlotId while still in Draft
    const res = await request(app)
      .post(`/api/day-menus/slots/${noBaseSlotId}/approve`)
      .set(managerAuth)
      .send({ REMARKS: "Direct approval attempt" });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
    expect(res.body.MESSAGE).toContain("Only Pending menus can be approved");
  });

  it("should reject rejecting a day menu without explanatory remarks with HTTP 400", async () => {
    const res = await request(app)
      .post(`/api/day-menus/slots/${noBaseSlotId}/reject`)
      .set(managerAuth)
      .send({ REMARKS: "" });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });
});
