import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { pool } from "../../../db/connection.js";
import { getAuthHeader, getFutureDate, getFutureDateTime } from "../../../test/testHelpers.js";
import { getTodayIST } from "../../../utils/dateTime.js";

describe("Booking Module: Security & RBAC Guards", () => {
  it("should reject unauthenticated request to GET /api/bookings with HTTP 401", async () => {
    const res = await request(app).get("/api/bookings");

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject unauthenticated request to POST /api/bookings with HTTP 401", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .send({
        PBOOKTYPECODE: "PB",
        PCUSTOMERID: 1,
        PSERVICEID: 1,
        PSERVICEDATE: getFutureDate(7),
        PITEMSJSON: [{ DAYMENUID: 1, QTY: 1 }],
      });

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from GET /api/bookings/kitchen-prep with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/bookings/kitchen-prep?daySlotId=1")
      .set(userAuth);

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from GET /api/bookings/resolve/:identifier with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/bookings/resolve/PB-LU001")
      .set(userAuth);

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from PATCH /api/bookings/:id/serve with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .patch("/api/bookings/1/serve")
      .set(userAuth);

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from PATCH /api/bookings/:id/no-show with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .patch("/api/bookings/1/no-show")
      .set(userAuth);

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });
});

describe("Booking Module: Input Validation", () => {
  it("should reject POST /api/bookings when required fields are missing with HTTP 400", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .post("/api/bookings")
      .set(userAuth)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject POST /api/bookings when PITEMSJSON is empty with HTTP 400", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .post("/api/bookings")
      .set(userAuth)
      .send({
        PBOOKTYPECODE: "PB",
        PCUSTOMERID: 1,
        PSERVICEID: 1,
        PSERVICEDATE: getFutureDate(7),
        PITEMSJSON: [],
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject POST /api/bookings when PSERVICEDATE is invalid with HTTP 400", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .post("/api/bookings")
      .set(userAuth)
      .send({
        PBOOKTYPECODE: "PB",
        PCUSTOMERID: 1,
        PSERVICEID: 1,
        PSERVICEDATE: "20-11-2028",
        PITEMSJSON: [{ DAYMENUID: 1, QTY: 1 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject POST /api/bookings when PBOOKTYPECODE is invalid with HTTP 400", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .post("/api/bookings")
      .set(userAuth)
      .send({
        PBOOKTYPECODE: "INVALID_TYPE",
        PCUSTOMERID: 1,
        PSERVICEID: 1,
        PSERVICEDATE: getFutureDate(7),
        PITEMSJSON: [{ DAYMENUID: 1, QTY: 1 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });
});

describe("Booking Module: End-to-End Multi-Customer Lifecycle & Billing", () => {
  let managerAuth;
  let staffAuth;
  let permAuth;
  let contAuth;

  const testCanteenId = 1;
  let futureServiceId;
  let futureDaySlotId;
  let futureDayMenuId;
  const futureDate = getFutureDate(30);

  let todayServiceId;
  let todayDaySlotId;
  let todayDayMenuId;
  const todayDate = getTodayIST();

  let permBookingId;
  let permBookingNo;

  let contBookingId;

  beforeAll(async () => {
    managerAuth = await getAuthHeader("mgr1");
    staffAuth = await getAuthHeader("staff1");
    permAuth = await getAuthHeader("perm1");
    contAuth = await getAuthHeader("cont1");

    // Clean up bookings and counters to prevent ER_DUP_ENTRY on BOOKNO
    await pool.query("DELETE FROM CMS_WALLETTRAN WHERE BOOKID IS NOT NULL");
    await pool.query("DELETE FROM CMS_PBACTIVE");
    await pool.query("DELETE FROM CMS_BOOKITMHST");
    await pool.query("DELETE FROM CMS_BOOKHIST");
    await pool.query("DELETE FROM CMS_BOOKITEM");
    await pool.query("DELETE FROM CMS_BOOKCTR");
    await pool.query("DELETE FROM CMS_BOOKING");

    // ── 1. Create Future Service (Breakfast - BF) & Approved Day Menu (for Pre-Booking) ──
    const futureServCode = `BF${Date.now().toString().slice(-4)}`;
    const [futureServ] = await pool.query(
      `INSERT INTO CMS_SERVICE (SERVCODE, SERVNAME, DEFSTART, DEFEND, STATUSID, CREATEDBY)
       VALUES (?, 'Breakfast Service', '07:30:00', '10:00:00', 10, 1)`,
      [futureServCode]
    );
    futureServiceId = futureServ.insertId;

    const futureItemCode = `ITM${Date.now().toString().slice(-4)}F`;
    const [futureItem] = await pool.query(
      `INSERT INTO CMS_MENUITEM (MENUCODE, SHORTNAME, ITEMNAME, SERVICEID, STATUSID, CREATEDBY)
       VALUES (?, 'FTH', 'South Indian Breakfast Combo', ?, 10, 1)`,
      [futureItemCode, futureServiceId]
    );
    const futureItemId = futureItem.insertId;

    // Price band for all customer types
    await request(app)
      .post(`/api/pricing/menu-items/${futureItemId}`)
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

    // Create Future Day Slot & Approve
    const futureSlotRes = await request(app)
      .post("/api/day-slots")
      .set(managerAuth)
      .send({
        CANTEENID: testCanteenId,
        SERVICEID: futureServiceId,
        SERVICEDATE: futureDate,
        STARTTIME: "07:30",
        ENDTIME: "10:00",
      });
    futureDaySlotId = futureSlotRes.body.DATA.DAYSLOTID;

    // Stage items onto slot and capture exact DAYMENUID
    const putFutureRes = await request(app)
      .put(`/api/day-menus/slots/${futureDaySlotId}`)
      .set(managerAuth)
      .send({
        ITEMSJSON: [
          {
            MENUITEMID: futureItemId,
            ISBASE: 1,
            ISSPECIAL: 0,
            ISPREBOOK: 1,
            ISKIOSK: 1,
            AVAILQTY: 100,
            MAXQTY: 5,
            BOOKUNTIL: getFutureDateTime(30, "23:59:59"),
            CANCELUNTIL: getFutureDateTime(30, "22:00:00"),
          },
        ],
      });
    // Submit & Approve
    await request(app).post(`/api/day-menus/slots/${futureDaySlotId}/submit`).set(managerAuth);
    await request(app).post(`/api/day-menus/slots/${futureDaySlotId}/approve`).set(managerAuth).send({ REMARKS: "Approved" });

    const pubFutureRes = await request(app)
      .get(`/api/day-menus/published?canteenId=${testCanteenId}&serviceDate=${futureDate}`)
      .set(permAuth);
    futureDayMenuId = pubFutureRes.body.DATA?.find((item) => item.MENUITEMID === futureItemId)?.DAYMENUID || putFutureRes.body.DATA[0]?.DAYMENUID;

    // ── 2. Create Today Service (Lunch - LU) & Approved Day Menu (for Counter Serving) ──
    const todayServCode = `LU${Date.now().toString().slice(-4)}`;
    const [todayServ] = await pool.query(
      `INSERT INTO CMS_SERVICE (SERVCODE, SERVNAME, DEFSTART, DEFEND, STATUSID, CREATEDBY)
       VALUES (?, 'Lunch Service', '12:00:00', '14:30:00', 10, 1)`,
      [todayServCode]
    );
    todayServiceId = todayServ.insertId;

    const todayItemCode = `ITM${Date.now().toString().slice(-4)}T`;
    const [todayItem] = await pool.query(
      `INSERT INTO CMS_MENUITEM (MENUCODE, SHORTNAME, ITEMNAME, SERVICEID, STATUSID, CREATEDBY)
       VALUES (?, 'TTH', 'Today Special Thali', ?, 10, 1)`,
      [todayItemCode, todayServiceId]
    );
    const todayItemId = todayItem.insertId;

    await request(app)
      .post(`/api/pricing/menu-items/${todayItemId}`)
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

    const todaySlotRes = await request(app)
      .post("/api/day-slots")
      .set(managerAuth)
      .send({
        CANTEENID: testCanteenId,
        SERVICEID: todayServiceId,
        SERVICEDATE: todayDate,
        STARTTIME: "12:00",
        ENDTIME: "14:30",
      });
    todayDaySlotId = todaySlotRes.body.DATA.DAYSLOTID;

    await request(app)
      .put(`/api/day-menus/slots/${todayDaySlotId}`)
      .set(managerAuth)
      .send({
        ITEMSJSON: [
          {
            MENUITEMID: todayItemId,
            ISBASE: 1,
            ISSPECIAL: 0,
            ISPREBOOK: 1,
            ISKIOSK: 1,
            AVAILQTY: 100,
            MAXQTY: 5,
            BOOKUNTIL: `${todayDate}T23:59:59`,
            CANCELUNTIL: `${todayDate}T22:00:00`,
          },
        ],
      });

    await request(app).post(`/api/day-menus/slots/${todayDaySlotId}/submit`).set(managerAuth);
    await request(app).post(`/api/day-menus/slots/${todayDaySlotId}/approve`).set(managerAuth).send({ REMARKS: "Approved" });

    const pubTodayRes = await request(app)
      .get(`/api/day-menus/published?canteenId=${testCanteenId}&serviceDate=${todayDate}`)
      .set(permAuth);
    todayDayMenuId = pubTodayRes.body.DATA?.find((item) => item.MENUITEMID === todayItemId)?.DAYMENUID || pubTodayRes.body.DATA?.[0]?.DAYMENUID;

    // ── 3. Fund cont1's wallet (Customer 8) with ₹500 ──
    await pool.query(
      "UPDATE CMS_WALLET SET BALANCE = 500.00, RESERVEDAMT = 0.00 WHERE CUSTOMERID = 8"
    );
  });

  it("should allow Permanent Employee (perm1) to place a pre-booking with HTTP 201 (Payroll Billed)", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .set(permAuth)
      .send({
        PBOOKTYPECODE: "PB",
        PCUSTOMERID: 1,
        PSERVICEID: futureServiceId,
        PSERVICEDATE: futureDate,
        PITEMSJSON: [{ DAYMENUID: futureDayMenuId, QTY: 1 }],
        PREMARKS: "Permanent employee advance booking",
      });

    expect(res.status).toBe(201);
    expect(res.body.SUCCESS).toBe(true);

    const bookingResult = res.body.DATA?.[0]?.[0] || res.body.DATA;
    expect(bookingResult).toBeDefined();
    expect(bookingResult).toHaveProperty("BOOKID");
    expect(bookingResult).toHaveProperty("BOOKNO");
    expect(bookingResult.BOOKNO).toMatch(/^PB-/);

    permBookingId = bookingResult.BOOKID;
    permBookingNo = bookingResult.BOOKNO;
  });

  it("should reject duplicate booking for the same service and date with HTTP 400", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .set(permAuth)
      .send({
        PBOOKTYPECODE: "PB",
        PCUSTOMERID: 1,
        PSERVICEID: futureServiceId,
        PSERVICEDATE: futureDate,
        PITEMSJSON: [{ DAYMENUID: futureDayMenuId, QTY: 1 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
    expect(res.body.MESSAGE).toContain("An active booking already exists for this service and date");
  });

  it("should allow fetching the active booking for perm1 with HTTP 200", async () => {
    const res = await request(app)
      .get(`/api/bookings/active?canteenId=${testCanteenId}&serviceId=${futureServiceId}&serviceDate=${futureDate}`)
      .set(permAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeDefined();
    expect(res.body.DATA.HEADER.BOOKID).toBe(permBookingId);
    expect(res.body.DATA.HEADER.STATUSCODE).toBe("CRT");
  });

  it("should allow Contract Employee (cont1) to book meals with wallet deduction with HTTP 201", async () => {
    await pool.query(
      "UPDATE CMS_WALLET SET BALANCE = 500.00, RESERVEDAMT = 0.00 WHERE CUSTOMERID = 8"
    );

    const res = await request(app)
      .post("/api/bookings")
      .set(contAuth)
      .send({
        PBOOKTYPECODE: "PB",
        PCUSTOMERID: 8,
        PSERVICEID: futureServiceId,
        PSERVICEDATE: futureDate,
        PITEMSJSON: [{ DAYMENUID: futureDayMenuId, QTY: 1 }],
        PREMARKS: "Contract employee wallet booking",
      });

    expect(res.status).toBe(201);
    expect(res.body.SUCCESS).toBe(true);

    const bookingResult = res.body.DATA?.[0]?.[0] || res.body.DATA;
    contBookingId = bookingResult.BOOKID;

    // Verify wallet was debited by the CNT meal rate (₹35.00): 500 - 35 = 465.00
    const [wallets] = await pool.query(
      "SELECT BALANCE FROM CMS_WALLET WHERE CUSTOMERID = 8"
    );
    expect(Number(wallets[0].BALANCE)).toBe(465.00);
  });

  it("should allow Contract Employee (cont1) to cancel booking and receive a full wallet refund with HTTP 200", async () => {
    const res = await request(app)
      .patch(`/api/bookings/${contBookingId}/cancel`)
      .set(contAuth)
      .send({ PREASON: "Plans changed" });

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);

    // Verify booking status is now Cancelled (STATUSID = 33 / CAN)
    const [bookings] = await pool.query(
      "SELECT STATUSID FROM CMS_BOOKING WHERE BOOKID = ?",
      [contBookingId]
    );
    expect(bookings[0].STATUSID).toBe(33);

    // Verify wallet balance is refunded back to ₹500.00
    const [wallets] = await pool.query(
      "SELECT BALANCE FROM CMS_WALLET WHERE CUSTOMERID = 8"
    );
    expect(Number(wallets[0].BALANCE)).toBe(500.00);
  });

  it("should reject serving a future-dated booking before its scheduled date with HTTP 400", async () => {
    const res = await request(app)
      .patch(`/api/bookings/${permBookingId}/serve`)
      .set(staffAuth);

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
    expect(res.body.MESSAGE).toContain("Cannot serve a future booking before its scheduled date");
  });

  it("should allow counter serving a booking scheduled for today with HTTP 200", async () => {
    // 1. Place booking for today
    const bookRes = await request(app)
      .post("/api/bookings")
      .set(permAuth)
      .send({
        PBOOKTYPECODE: "PB",
        PCUSTOMERID: 1,
        PSERVICEID: todayServiceId,
        PSERVICEDATE: todayDate,
        PITEMSJSON: [{ DAYMENUID: todayDayMenuId, QTY: 1 }],
      });
    expect(bookRes.status).toBe(201);

    const todayBooking = bookRes.body.DATA?.[0]?.[0] || bookRes.body.DATA;
    const todayBookingId = todayBooking.BOOKID;
    const todayBookingNo = todayBooking.BOOKNO;

    // 2. Staff resolves booking at counter by BOOKNO
    const resolveRes = await request(app)
      .get(`/api/bookings/resolve/${todayBookingNo}?canteenId=${testCanteenId}&serviceId=${todayServiceId}&daySlotId=${todayDaySlotId}`)
      .set(staffAuth);

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.SUCCESS).toBe(true);
    expect(resolveRes.body.DATA.HEADER.BOOKID).toBe(todayBookingId);

    // 3. Staff serves the meal
    const serveRes = await request(app)
      .patch(`/api/bookings/${todayBookingId}/serve`)
      .set(staffAuth);

    expect(serveRes.status).toBe(200);
    expect(serveRes.body.SUCCESS).toBe(true);

    // Verify booking status transitioned to Served (STATUSID = 32 / SRV)
    const [bookings] = await pool.query(
      "SELECT STATUSID FROM CMS_BOOKING WHERE BOOKID = ?",
      [todayBookingId]
    );
    expect(bookings[0].STATUSID).toBe(32);
  });

  it("should aggregate kitchen portion requirements in kitchen-prep with HTTP 200", async () => {
    const res = await request(app)
      .get(`/api/bookings/kitchen-prep?daySlotId=${todayDaySlotId}`)
      .set(managerAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(Array.isArray(res.body.DATA)).toBe(true);
    expect(res.body.DATA.length).toBeGreaterThanOrEqual(1);

    const prepEntry = res.body.DATA.find((entry) => entry.DAYMENUID === todayDayMenuId || entry.MENUITEMID === todayItemId);
    expect(prepEntry).toBeDefined();
    expect(Number(prepEntry.TOTAL_BOOKED || prepEntry.TOTALPORTIONS || prepEntry.PLANNED_QTY)).toBeGreaterThanOrEqual(1);
  });

  it("should fetch weekly published menu without SQL ordering errors with HTTP 200", async () => {
    const res = await request(app)
      .get(`/api/bookings/weekly-menu?canteenId=${testCanteenId}&startDate=${futureDate}&endDate=${futureDate}`)
      .set(permAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeDefined();
  });
});
