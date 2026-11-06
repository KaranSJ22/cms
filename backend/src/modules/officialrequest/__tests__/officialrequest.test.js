import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

import app from "../../../app.js";
import { pool } from "../../../db/connection.js";
import { getAuthHeader } from "../../../test/testHelpers.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE_IST = "Asia/Kolkata";

describe("Official Request Module: Security & RBAC Guards", () => {
  let sharedServiceId = 1;
  let testItem = 1;

  beforeAll(async () => {
    // Ensure an official service exists for Canteen 1 via Stored Procedure
    const [svcRes] = await pool.query("CALL CMSOFFLISTSERVICES(?, ?)", [1, null]);
    const services = svcRes[0] || [];
    if (services.length > 0) {
      sharedServiceId = services[0].OFFSERVID;
    } else {
      const [insSvc] = await pool.query(
        "CALL CMSOFFCREATESERVICE(?, ?, ?, ?, ?, ?)",
        [1, "Baseline Catering Service", "Catering service for tests", 24, "L1", 1]
      );
      sharedServiceId = insSvc[0]?.[0]?.OFFSERVID || 1;
    }

    const [itemRes] = await pool.query("CALL CMSOFFLISTMENUITEMS(?)", [1]);
    const items = itemRes[0] || [];
    if (items.length > 0) {
      testItem = items[0].MENUITEMID;
    }
  });

  it("should reject unauthenticated request to GET /api/official-requests/services with HTTP 401", async () => {
    const res = await request(app).get("/api/official-requests/services?canteenId=1");

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from POST /api/official-requests/services with HTTP 403 Forbidden", async () => {
    const permAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .post("/api/official-requests/services")
      .set(permAuth)
      .send({
        CANTEENID: 1,
        SERVNAME: "Unauthorized Service",
        CUTOFFHOURS: 24,
        REQAPPRLVL: "L1",
      });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from POST /api/official-requests/combos with HTTP 403 Forbidden", async () => {
    const permAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .post("/api/official-requests/combos")
      .set(permAuth)
      .send({
        OFFSERVID: sharedServiceId,
        COMBONAME: "Unauthorized Combo",
        GROSSPRICE: 100,
        HANDLINGCHARGE: 10,
        COMBOPRICE: 110,
        ITEMS: [{ MENUITEMID: testItem, QTY: 1 }],
      });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from POST /api/official-requests/level-mappings with HTTP 403 Forbidden", async () => {
    const permAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .post("/api/official-requests/level-mappings")
      .set(permAuth)
      .send({
        EMPLEVEL: 1,
        APPRLVL: "L1",
        ISACTIVE: 1,
      });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from GET /api/official-requests/manager/pending with HTTP 403 Forbidden", async () => {
    const permAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/official-requests/manager/pending?canteenId=1")
      .set(permAuth);

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from GET /api/official-requests/kitchen-prep/confirmed with HTTP 403 Forbidden", async () => {
    const permAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/official-requests/kitchen-prep/confirmed?canteenId=1")
      .set(permAuth);

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });
});

describe("Official Request Module: Complete End-to-End Lifecycle", () => {
  let adminAuth;
  let mgrAuth;
  let perm1Auth;
  let perm2Auth;
  let contAuth;

  let perm1UserId;
  let perm2UserId;
  let testMenuItemId;
  let testServiceId;
  let testComboId;
  let testBookingId;
  let futureEventDateTime;
  let futureEventDate;

  beforeAll(async () => {
    adminAuth = await getAuthHeader("admin");
    mgrAuth = await getAuthHeader("mgr1");
    perm1Auth = await getAuthHeader("perm1");
    perm2Auth = await getAuthHeader("perm2");
    contAuth = await getAuthHeader("cont1");

    // Resolve user IDs using Stored Procedure
    const [p1Res] = await pool.query("CALL CMSLOGININFO(?)", ["perm1"]);
    perm1UserId = p1Res[0]?.[0]?.USERID || 9;
    const [p2Res] = await pool.query("CALL CMSLOGININFO(?)", ["perm2"]);
    perm2UserId = p2Res[0]?.[0]?.USERID || 10;

    // Ensure level mappings exist for approvers via Stored Procedure
    await pool.query("CALL CMSOFFUPSERTLEVELMAP(?, ?, ?, ?)", [1, "L1", 1, 1]);
    await pool.query("CALL CMSOFFUPSERTLEVELMAP(?, ?, ?, ?)", [2, "L2", 1, 1]);
    await pool.query("CALL CMSOFFUPSERTLEVELMAP(?, ?, ?, ?)", [13, "L1", 1, 1]);
    await pool.query("CALL CMSOFFUPSERTLEVELMAP(?, ?, ?, ?)", [14, "L1", 1, 1]);

    // Resolve active menu item using Stored Procedure
    const [itemRes] = await pool.query("CALL CMSOFFLISTMENUITEMS(?)", [1]);
    const items = itemRes[0] || [];
    testMenuItemId = items[0]?.MENUITEMID || 1;

    // Future event date 72 hours in advance (satisfies 24-hour cutoff)
    const futureTime = dayjs().tz(TIMEZONE_IST).add(72, "hour");
    futureEventDateTime = futureTime.format("YYYY-MM-DD HH:mm:ss");
    futureEventDate = futureTime.format("YYYY-MM-DD");
  });

  // ── 1. Level Mappings & Approvers ──
  it("should allow System Admin to upsert level mappings", async () => {
    const res = await request(app)
      .post("/api/official-requests/level-mappings")
      .set(adminAuth)
      .send({
        EMPLEVEL: 1,
        APPRLVL: "L1",
        ISACTIVE: 1,
      });

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(Array.isArray(res.body.DATA)).toBe(true);
  });

  it("should list level mappings for authenticated user", async () => {
    const res = await request(app)
      .get("/api/official-requests/level-mappings")
      .set(perm1Auth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.some((m) => m.EMPLEVEL === 1 && m.APPRLVL === "L1")).toBe(true);
  });

  it("should retrieve eligible approvers excluding the requester", async () => {
    const res = await request(app)
      .get("/api/official-requests/approvers?level=L1")
      .set(perm1Auth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(Array.isArray(res.body.DATA)).toBe(true);
    // perm1 should not be in the list of eligible approvers for themselves
    expect(res.body.DATA.some((a) => a.USERID === perm1UserId)).toBe(false);
    expect(res.body.DATA.some((a) => a.USERID === perm2UserId)).toBe(true);
  });

  // ── 2. Services & Combos Configuration ──
  it("should list available official menu items", async () => {
    const res = await request(app)
      .get("/api/official-requests/services/menu-items?canteenId=1")
      .set(mgrAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(Array.isArray(res.body.DATA)).toBe(true);
    expect(res.body.DATA.length).toBeGreaterThan(0);
  });

  it("should allow Canteen Manager to create an official catering service", async () => {
    const res = await request(app)
      .post("/api/official-requests/services")
      .set(mgrAuth)
      .send({
        CANTEENID: 1,
        SERVNAME: "Executive Boardroom Catering",
        DESCR: "Full-service banquet for board meetings",
        CUTOFFHOURS: 24,
        REQAPPRLVL: "L1",
      });

    expect(res.status).toBe(201);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.OFFSERVID).toBeDefined();
    expect(res.body.DATA.SERVNAME).toBe("Executive Boardroom Catering");
    testServiceId = res.body.DATA.OFFSERVID;
  });

  it("should get official service details with combos", async () => {
    const res = await request(app)
      .get(`/api/official-requests/services/${testServiceId}`)
      .set(perm1Auth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.OFFSERVID).toBe(testServiceId);
    expect(Array.isArray(res.body.DATA.COMBOS)).toBe(true);
  });

  it("should allow Canteen Manager to update official service details", async () => {
    const res = await request(app)
      .put(`/api/official-requests/services/${testServiceId}`)
      .set(mgrAuth)
      .send({
        DESCR: "Updated banquet description with VIP hospitality",
      });

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.DESCR).toBe("Updated banquet description with VIP hospitality");
  });

  it("should allow Canteen Manager to create a combo under the service", async () => {
    const res = await request(app)
      .post("/api/official-requests/combos")
      .set(mgrAuth)
      .send({
        OFFSERVID: testServiceId,
        COMBONAME: "Executive High Tea Combo",
        DESCR: "Assorted pastries, gourmet tea, and finger food",
        GROSSPRICE: 120.0,
        HANDLINGCHARGE: 30.0,
        COMBOPRICE: 150.0,
        ITEMS: [{ MENUITEMID: testMenuItemId, QTY: 2 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.OFFCOMBOID).toBeDefined();
    testComboId = res.body.DATA.OFFCOMBOID;
  });

  it("should allow Canteen Manager to update the combo", async () => {
    const res = await request(app)
      .put(`/api/official-requests/combos/${testComboId}`)
      .set(mgrAuth)
      .send({
        COMBONAME: "Premium High Tea & Snacks Combo",
        GROSSPRICE: 130.0,
        HANDLINGCHARGE: 30.0,
        COMBOPRICE: 160.0,
      });

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
  });

  it("should list services for the canteen including newly created service and combos", async () => {
    const res = await request(app)
      .get("/api/official-requests/services?canteenId=1")
      .set(perm1Auth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    const createdService = res.body.DATA.find((s) => s.OFFSERVID === testServiceId);
    expect(createdService).toBeDefined();
    expect(createdService.COMBOS.some((c) => c.OFFCOMBOID === testComboId)).toBe(true);
  });

  // ── 3. Booking Validations & Creation ──
  it("should reject booking from non-permanent employee (cont1) with HTTP 403", async () => {
    const res = await request(app)
      .post("/api/official-requests/bookings")
      .set(contAuth)
      .send({
        CANTEENID: 1,
        OFFSERVID: testServiceId,
        OFFCOMBOID: testComboId,
        PURPOSE: "Department Sync",
        VENUE: "Conference Room 101",
        EVENTDATETIME: futureEventDateTime,
        QUANTITY: 10,
        NOOFPEOPLE: 10,
        APPRLVL: "L1",
        APPROVERID: perm2UserId,
      });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject booking when requester selects themselves as approver with HTTP 400", async () => {
    const res = await request(app)
      .post("/api/official-requests/bookings")
      .set(perm1Auth)
      .send({
        CANTEENID: 1,
        OFFSERVID: testServiceId,
        OFFCOMBOID: testComboId,
        PURPOSE: "Self approval attempt",
        VENUE: "Boardroom",
        EVENTDATETIME: futureEventDateTime,
        QUANTITY: 5,
        NOOFPEOPLE: 5,
        APPRLVL: "L1",
        APPROVERID: perm1UserId,
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject booking when event violates notice cutoff hours with HTTP 400", async () => {
    // 2 hours in the future (violates 24-hour cutoff)
    const tooSoon = dayjs().tz(TIMEZONE_IST).add(2, "hour").format("YYYY-MM-DD HH:mm:ss");

    const res = await request(app)
      .post("/api/official-requests/bookings")
      .set(perm1Auth)
      .send({
        CANTEENID: 1,
        OFFSERVID: testServiceId,
        OFFCOMBOID: testComboId,
        PURPOSE: "Urgent catering",
        VENUE: "Room 202",
        EVENTDATETIME: tooSoon,
        QUANTITY: 5,
        NOOFPEOPLE: 5,
        APPRLVL: "L1",
        APPROVERID: perm2UserId,
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should allow permanent employee to submit official booking with valid details", async () => {
    const res = await request(app)
      .post("/api/official-requests/bookings")
      .set(perm1Auth)
      .send({
        CANTEENID: 1,
        OFFSERVID: testServiceId,
        OFFCOMBOID: testComboId,
        PURPOSE: "Quarterly Strategy Review Meeting",
        VENUE: "Executive Conference Hall A",
        EVENTDATETIME: futureEventDateTime,
        QUANTITY: 10,
        NOOFPEOPLE: 10,
        APPRLVL: "L1",
        APPROVERID: perm2UserId,
      });

    expect(res.status).toBe(201);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.OFFBOOKID).toBeDefined();
    expect(res.body.DATA.BOOKNO).toMatch(/^OBK-CAN-A-/);
    expect(res.body.DATA.STATUS).toBe("Submitted");
    expect(Number(res.body.DATA.TOTALAMOUNT)).toBeGreaterThan(0);
    testBookingId = res.body.DATA.OFFBOOKID;
  });

  it("should fetch official booking details by ID including items and audit trail", async () => {
    const res = await request(app)
      .get(`/api/official-requests/bookings/${testBookingId}`)
      .set(perm1Auth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.OFFBOOKID).toBe(testBookingId);
    expect(res.body.DATA.STATUSID).toBe(35); // SUBMITTED
    expect(Array.isArray(res.body.DATA.ITEMS)).toBe(true);
    expect(Array.isArray(res.body.DATA.HISTORY)).toBe(true);
    expect(res.body.DATA.HISTORY.some((h) => h.ACTIONCODE === "SUBMITTED")).toBe(true);
  });

  it("should list employee's official bookings via GET /api/official-requests/bookings/my", async () => {
    const res = await request(app)
      .get("/api/official-requests/bookings/my")
      .set(perm1Auth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(Array.isArray(res.body.DATA)).toBe(true);
    expect(res.body.DATA.some((b) => b.OFFBOOKID === testBookingId)).toBe(true);
  });

  // ── 4. Approver Workflow ──
  it("should list assigned requests in approver queue (perm2)", async () => {
    const res = await request(app)
      .get("/api/official-requests/approvals/assigned")
      .set(perm2Auth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(Array.isArray(res.body.DATA)).toBe(true);
    expect(res.body.DATA.some((b) => b.OFFBOOKID === testBookingId)).toBe(true);
  });

  it("should reject non-assigned approver from approving booking with HTTP 403", async () => {
    // Admin is not the designated approver
    const res = await request(app)
      .post(`/api/official-requests/approvals/${testBookingId}/action`)
      .set(adminAuth)
      .send({
        ACTION: "APPROVE",
      });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should allow designated approver (perm2) to approve booking", async () => {
    const res = await request(app)
      .post(`/api/official-requests/approvals/${testBookingId}/action`)
      .set(perm2Auth)
      .send({
        ACTION: "APPROVE",
      });

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.STATUSID).toBe(36); // PENDING_MANAGER
  });

  // ── 5. Canteen Manager Workflow ──
  it("should list pending requests in Canteen Manager queue", async () => {
    const res = await request(app)
      .get("/api/official-requests/manager/pending?canteenId=1")
      .set(mgrAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(Array.isArray(res.body.DATA)).toBe(true);
    expect(res.body.DATA.some((b) => b.OFFBOOKID === testBookingId)).toBe(true);
  });

  it("should allow Canteen Manager to accept and confirm the official booking", async () => {
    const res = await request(app)
      .post(`/api/official-requests/manager/${testBookingId}/action`)
      .set(mgrAuth)
      .send({
        ACTION: "ACCEPT",
      });

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.STATUSID).toBe(37); // CONFIRMED
  });

  // ── 6. Kitchen Preparation & Reports ──
  it("should list confirmed bookings for event schedule", async () => {
    const res = await request(app)
      .get(`/api/official-requests/kitchen-prep/confirmed?canteenId=1&date=${futureEventDate}`)
      .set(mgrAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(Array.isArray(res.body.DATA)).toBe(true);
    const confirmed = res.body.DATA.find((b) => b.OFFBOOKID === testBookingId);
    expect(confirmed).toBeDefined();
    expect(confirmed.ITEMS.length).toBeGreaterThan(0);
    expect(confirmed.ITEMS[0].TOTAL_PREP_QTY).toBeDefined();
  });

  it("should retrieve daily kitchen prep summary with aggregated dish quantities", async () => {
    const res = await request(app)
      .get(`/api/official-requests/kitchen-prep/summary?canteenId=1&date=${futureEventDate}`)
      .set(mgrAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.TOTAL_BOOKINGS).toBeGreaterThanOrEqual(1);
    expect(res.body.DATA.TOTAL_PAX).toBeGreaterThanOrEqual(10);
    expect(Array.isArray(res.body.DATA.DISHES)).toBe(true);
    expect(res.body.DATA.DISHES.length).toBeGreaterThan(0);
  });

  // ── 7. Rejection & Resubmission Workflow ──
  it("should support rejection by approver and resubmission by requester", async () => {
    // 1. Submit a second booking
    const bookRes = await request(app)
      .post("/api/official-requests/bookings")
      .set(perm1Auth)
      .send({
        CANTEENID: 1,
        OFFSERVID: testServiceId,
        OFFCOMBOID: testComboId,
        PURPOSE: "Ad-hoc Review for Rejection Test",
        VENUE: "Room 303",
        EVENTDATETIME: futureEventDateTime,
        QUANTITY: 8,
        NOOFPEOPLE: 8,
        APPRLVL: "L1",
        APPROVERID: perm2UserId,
      });

    expect(bookRes.status).toBe(201);
    const secondBookingId = bookRes.body.DATA.OFFBOOKID;

    // 2. Reject with reason
    const rejRes = await request(app)
      .post(`/api/official-requests/approvals/${secondBookingId}/action`)
      .set(perm2Auth)
      .send({
        ACTION: "REJECT",
        REJREASON: "Exceeds approved budget for this quarter",
      });

    expect(rejRes.status).toBe(200);
    expect(rejRes.body.DATA.STATUSID).toBe(38); // REJECTED

    // 3. Employee resubmits with reduced quantity
    const resubmitRes = await request(app)
      .put(`/api/official-requests/bookings/${secondBookingId}/resubmit`)
      .set(perm1Auth)
      .send({
        QUANTITY: 4,
        NOOFPEOPLE: 4,
        PURPOSE: "Revised Review with scaled down headcount",
      });

    expect(resubmitRes.status).toBe(200);
    expect(resubmitRes.body.SUCCESS).toBe(true);
    expect(resubmitRes.body.DATA.OFFBOOKID).toBe(secondBookingId);
    expect(resubmitRes.body.DATA.STATUSID).toBe(35); // SUBMITTED again
    expect(resubmitRes.body.DATA.QUANTITY).toBe(4);
    expect(
      resubmitRes.body.DATA.HISTORY.some((h) => h.ACTIONCODE === "RESUBMITTED")
    ).toBe(true);
  });

  // ── 8. Kitchen Fulfillment & Dish Prep Tracking ──
  it("should update booking fulfillment status and persist audit trail", async () => {
    // 1. Unauthorized user cannot update fulfillment
    const unauthRes = await request(app)
      .put(`/api/official-requests/kitchen-prep/bookings/${testBookingId}/fulfillment`)
      .set(perm1Auth)
      .send({ STATUS: "READY" });

    expect(unauthRes.status).toBe(403);

    // 2. Kitchen Manager updates to READY
    const readyRes = await request(app)
      .put(`/api/official-requests/kitchen-prep/bookings/${testBookingId}/fulfillment`)
      .set(mgrAuth)
      .send({ STATUS: "READY" });

    expect(readyRes.status).toBe(200);
    expect(readyRes.body.SUCCESS).toBe(true);
    expect(readyRes.body.DATA.STATUSID).toBe(61); // READY

    // 3. Update to DISPATCHED
    const dispRes = await request(app)
      .put(`/api/official-requests/kitchen-prep/bookings/${testBookingId}/fulfillment`)
      .set(mgrAuth)
      .send({ STATUS: "DISPATCHED" });

    expect(dispRes.status).toBe(200);
    expect(dispRes.body.DATA.STATUSID).toBe(62); // DISPATCHED

    // 4. Update to DELIVERED
    const delvRes = await request(app)
      .put(`/api/official-requests/kitchen-prep/bookings/${testBookingId}/fulfillment`)
      .set(mgrAuth)
      .send({ STATUS: "DELIVERED" });

    expect(delvRes.status).toBe(200);
    expect(delvRes.body.DATA.STATUSID).toBe(63); // DELIVERED
  });

  it("should update daily dish cooking batch status", async () => {
    const dishRes = await request(app)
      .put("/api/official-requests/kitchen-prep/dishes/prep-status")
      .set(mgrAuth)
      .send({
        CANTEENID: 1,
        DATE: futureEventDate,
        MENUITEMID: testMenuItemId,
        STATUS: "COOKING",
      });

    expect(dishRes.status).toBe(200);
    expect(dishRes.body.SUCCESS).toBe(true);
    expect(dishRes.body.DATA.STATUS).toBe("COOKING");

    // Check summary includes the updated dish prep status
    const summaryRes = await request(app)
      .get(`/api/official-requests/kitchen-prep/summary?canteenId=1&date=${futureEventDate}`)
      .set(mgrAuth);

    expect(summaryRes.status).toBe(200);
    const dish = summaryRes.body.DATA.DISHES.find((d) => d.MENUITEMID === testMenuItemId);
    if (dish) {
      expect(dish.PREP_STATUS).toBe("COOKING");
    }
  });
});

