import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { pool } from "../../../db/connection.js";
import { getAuthHeader } from "../../../test/testHelpers.js";

describe("Wallet Module: Security & RBAC Guards", () => {
  it("should reject unauthenticated request to GET /api/wallets/customer/:customerId with HTTP 401", async () => {
    const res = await request(app).get("/api/wallets/customer/8");

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject unauthenticated request to POST /api/wallets/topup with HTTP 401", async () => {
    const res = await request(app)
      .post("/api/wallets/topup")
      .send({ customerId: 8, amount: 200, paymentMethod: "CASH" });

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject unauthenticated request to POST /api/wallets with HTTP 401", async () => {
    const res = await request(app)
      .post("/api/wallets")
      .send({ customerId: 8, openAmount: 100 });

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from GET /api/wallets/customer-lookup/:identifier with HTTP 403 Forbidden", async () => {
    const permAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/wallets/customer-lookup/C001")
      .set(permAuth);

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from POST /api/wallets with HTTP 403 Forbidden", async () => {
    const permAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .post("/api/wallets")
      .set(permAuth)
      .send({ customerId: 8, openAmount: 100 });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from POST /api/wallets/topup with HTTP 403 Forbidden", async () => {
    const permAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .post("/api/wallets/topup")
      .set(permAuth)
      .send({ customerId: 8, amount: 200, paymentMethod: "CASH", canteenId: 1 });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject Canteen Staff (staff1) without manager privileges from POST /api/wallets/topup with HTTP 403 Forbidden", async () => {
    const staffAuth = await getAuthHeader("staff1");

    const res = await request(app)
      .post("/api/wallets/topup")
      .set(staffAuth)
      .send({ customerId: 8, amount: 200, paymentMethod: "CASH", canteenId: 1 });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject Canteen Staff (staff1) from POST /api/wallets/withdraw/:id/approve with HTTP 403 Forbidden", async () => {
    const staffAuth = await getAuthHeader("staff1");

    const res = await request(app)
      .post("/api/wallets/withdraw/1/approve")
      .set(staffAuth)
      .send({ paymentMethod: "CASH" });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject Contract Employee (cont1) from viewing another customer's wallet with HTTP 403 Forbidden", async () => {
    const cont1Auth = await getAuthHeader("cont1");

    const res = await request(app)
      .get("/api/wallets/customer/15") // Customer 15 is vis1
      .set(cont1Auth);

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
    expect(res.body.MESSAGE).toContain("You do not have permission to view this wallet");
  });

  it("should reject Visitor (vis1) from viewing another customer's wallet with HTTP 403 Forbidden", async () => {
    const visAuth = await getAuthHeader("vis1");

    const res = await request(app)
      .get("/api/wallets/customer/8") // Customer 8 is cont1
      .set(visAuth);

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
    expect(res.body.MESSAGE).toContain("You do not have permission to view this wallet");
  });

  it("should reject Contract Employee (cont1) from requesting withdrawal for another customer with HTTP 403 Forbidden", async () => {
    const cont1Auth = await getAuthHeader("cont1");

    const res = await request(app)
      .post("/api/wallets/withdraw/request")
      .set(cont1Auth)
      .send({ customerId: 15, amount: 100 });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
    expect(res.body.MESSAGE).toContain("Withdrawal requests can only be submitted for your own wallet");
  });
});

describe("Wallet Module: Input Validation", () => {
  let managerAuth;
  let cont1Auth;

  beforeAll(async () => {
    managerAuth = await getAuthHeader("mgr1");
    cont1Auth = await getAuthHeader("cont1");
  });

  it("should reject POST /api/wallets/topup when amount is less than 100 with HTTP 400", async () => {
    const res = await request(app)
      .post("/api/wallets/topup")
      .set(managerAuth)
      .send({ customerId: 8, amount: 50, paymentMethod: "CASH", canteenId: 1 });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject POST /api/wallets/topup when required fields are missing with HTTP 400", async () => {
    const res = await request(app)
      .post("/api/wallets/topup")
      .set(managerAuth)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject POST /api/wallets when openAmount is between 1 and 99 with HTTP 400", async () => {
    const res = await request(app)
      .post("/api/wallets")
      .set(managerAuth)
      .send({ customerId: 8, openAmount: 50 });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject POST /api/wallets when openAmount is negative with HTTP 400", async () => {
    const res = await request(app)
      .post("/api/wallets")
      .set(managerAuth)
      .send({ customerId: 8, openAmount: -100 });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject POST /api/wallets/withdraw/request when amount is zero or negative with HTTP 400", async () => {
    const res = await request(app)
      .post("/api/wallets/withdraw/request")
      .set(cont1Auth)
      .send({ customerId: 8, amount: 0 });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject GET /api/wallets/customer/:customerId when customerId is not a number with HTTP 400", async () => {
    const res = await request(app)
      .get("/api/wallets/customer/not-a-number")
      .set(managerAuth);

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });
});

describe("Wallet Module: Customer Lookup & Wallet Creation Lifecycle", () => {
  let managerAuth;
  let freshCustomerId;

  beforeAll(async () => {
    managerAuth = await getAuthHeader("mgr1");

    // Insert a fresh contract worker without a wallet for creation tests
    const [custRes] = await pool.query(
      `INSERT INTO CMS_CUSTOMER (CTYPEID, DISPNAME, STATUSID)
       VALUES (2, 'New Contract Worker', 10)`
    );
    freshCustomerId = custRes.insertId;
  });

  afterAll(async () => {
    if (freshCustomerId) {
      await pool.query("DELETE FROM CMS_WALLETTRAN WHERE WALLETID IN (SELECT WALLETID FROM CMS_WALLET WHERE CUSTOMERID = ?)", [freshCustomerId]);
      await pool.query("DELETE FROM CMS_WALLET WHERE CUSTOMERID = ?", [freshCustomerId]);
      await pool.query("DELETE FROM CMS_CUSTOMER WHERE CUSTOMERID = ?", [freshCustomerId]);
    }
  });

  it("should resolve Contract Employee (cont1) by login ID and show wallet eligibility with HTTP 200", async () => {
    const res = await request(app)
      .get("/api/wallets/customer-lookup/cont1")
      .set(managerAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeDefined();
    expect(res.body.DATA.customer.CTYPECODE).toBe("CNT");
    expect(res.body.DATA.isEligible).toBe(true);
    expect(res.body.DATA.isPermanent).toBe(false);
    expect(res.body.DATA.hasWallet).toBe(true);
  });

  it("should resolve Visitor (vis1) by login ID and show wallet eligibility with HTTP 200", async () => {
    const res = await request(app)
      .get("/api/wallets/customer-lookup/vis1")
      .set(managerAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeDefined();
    expect(res.body.DATA.customer.CTYPECODE).toBe("VIS");
    expect(res.body.DATA.isEligible).toBe(true);
    expect(res.body.DATA.isPermanent).toBe(false);
    expect(res.body.DATA.hasWallet).toBe(true);
  });

  it("should resolve Permanent Employee (perm1) and show wallet INELIGIBILITY with HTTP 200", async () => {
    const res = await request(app)
      .get("/api/wallets/customer-lookup/perm1")
      .set(managerAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.customer.CTYPECODE).toBe("PRM");
    expect(res.body.DATA.isEligible).toBe(false);
    expect(res.body.DATA.isPermanent).toBe(true);
    expect(res.body.DATA.hasWallet).toBe(false);
  });

  it("should reject creating a wallet for Permanent Employee (perm1 / Customer 1) with HTTP 400", async () => {
    const res = await request(app)
      .post("/api/wallets")
      .set(managerAuth)
      .send({ customerId: 1, openAmount: 0 });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
    expect(res.body.MESSAGE).toContain("Wallets are only allowed for Contract Employees and Visitors");
  });

  it("should reject creating a duplicate wallet for customer who already has one with HTTP 400", async () => {
    const res = await request(app)
      .post("/api/wallets")
      .set(managerAuth)
      .send({ customerId: 8, openAmount: 0 }); // Customer 8 already has Wallet 1

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
    expect(res.body.MESSAGE).toContain("Customer already has a wallet");
  });

  it("should allow Canteen Manager to create a new wallet with initial deposit for fresh contract customer with HTTP 201", async () => {
    const res = await request(app)
      .post("/api/wallets")
      .set(managerAuth)
      .send({ customerId: freshCustomerId, openAmount: 100, remarks: "New joiner opening deposit" });

    expect(res.status).toBe(201);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeDefined();

    // Verify wallet was created with ₹100.00
    const [rows] = await pool.query("SELECT BALANCE FROM CMS_WALLET WHERE CUSTOMERID = ?", [freshCustomerId]);
    expect(Number(rows[0].BALANCE)).toBe(100.00);
  });
});

describe("Wallet Module: Cash Top-Up & Transaction History (Contract & Visitor)", () => {
  let managerAuth;
  let cont1Auth;
  let visAuth;

  beforeAll(async () => {
    managerAuth = await getAuthHeader("mgr1");
    cont1Auth = await getAuthHeader("cont1");
    visAuth = await getAuthHeader("vis1");

    // Clean up test transactions/withdrawals and re-initialize known test balances
    await pool.query("DELETE FROM CMS_WALLETWD WHERE WALLETID IN (SELECT WALLETID FROM CMS_WALLET WHERE CUSTOMERID IN (8, 15))");
    await pool.query("DELETE FROM CMS_WALLETTRAN WHERE WALLETID IN (SELECT WALLETID FROM CMS_WALLET WHERE CUSTOMERID IN (8, 15))");

    // cont1 (Customer 8): ₹500.00 baseline
    await pool.query(
      "UPDATE CMS_WALLET SET BALANCE = 500.00, RESERVEDAMT = 0.00, STATUSID = 10 WHERE CUSTOMERID = 8"
    );

    // vis1 (Customer 15): ₹250.00 baseline
    await pool.query(
      "UPDATE CMS_WALLET SET BALANCE = 250.00, RESERVEDAMT = 0.00, STATUSID = 10 WHERE CUSTOMERID = 15"
    );
  });

  it("should allow Canteen Manager to top up Contract Employee (cont1) wallet with ₹200.00 cash with HTTP 200", async () => {
    const res = await request(app)
      .post("/api/wallets/topup")
      .set(managerAuth)
      .send({
        customerId: 8,
        amount: 200.00,
        paymentMethod: "CASH",
        canteenId: 1,
        remarks: "Monthly topup",
      });

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.customerId).toBe(8);
    expect(Number(res.body.DATA.balBefore)).toBe(500.00);
    expect(Number(res.body.DATA.balAfter)).toBe(700.00);
    expect(Number(res.body.DATA.amount)).toBe(200.00);

    // Verify DB balance updated
    const [wallets] = await pool.query("SELECT BALANCE FROM CMS_WALLET WHERE CUSTOMERID = 8");
    expect(Number(wallets[0].BALANCE)).toBe(700.00);
  });

  it("should allow Canteen Manager to top up Visitor (vis1) wallet with ₹150.00 cash with HTTP 200", async () => {
    const res = await request(app)
      .post("/api/wallets/topup")
      .set(managerAuth)
      .send({
        customerId: 15,
        amount: 150.00,
        paymentMethod: "CASH",
        canteenId: 1,
        remarks: "Visitor meal topup",
      });

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.customerId).toBe(15);
    expect(Number(res.body.DATA.balBefore)).toBe(250.00);
    expect(Number(res.body.DATA.balAfter)).toBe(400.00);
    expect(Number(res.body.DATA.amount)).toBe(150.00);

    // Verify DB balance updated
    const [wallets] = await pool.query("SELECT BALANCE FROM CMS_WALLET WHERE CUSTOMERID = 15");
    expect(Number(wallets[0].BALANCE)).toBe(400.00);
  });

  it("should allow Contract Employee (cont1) to query own wallet balance with HTTP 200", async () => {
    const res = await request(app)
      .get("/api/wallets/customer/8")
      .set(cont1Auth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(Number(res.body.DATA.BALANCE)).toBe(700.00);
    expect(Number(res.body.DATA.RESERVEDAMT)).toBe(0.00);
  });

  it("should allow Visitor (vis1) to query own wallet balance with HTTP 200", async () => {
    const res = await request(app)
      .get("/api/wallets/customer/15")
      .set(visAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(Number(res.body.DATA.BALANCE)).toBe(400.00);
    expect(Number(res.body.DATA.RESERVEDAMT)).toBe(0.00);
  });

  it("should query transaction ledger history with pagination for cont1 with HTTP 200", async () => {
    const res = await request(app)
      .get("/api/wallets/customer/8/transactions?page=1&pageSize=5")
      .set(cont1Auth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(Array.isArray(res.body.DATA)).toBe(true);
    expect(res.body.DATA.length).toBeGreaterThanOrEqual(1);

    const topupEntry = res.body.DATA.find((t) => t.TRANSTYPE === "CREDIT" || t.SOURCECODE === "TOPUP");
    expect(topupEntry).toBeDefined();
    expect(Number(topupEntry.AMOUNT)).toBe(200.00);
  });
});

describe("Wallet Module: Multi-Customer Withdrawal Lifecycle (Request, Cancel, Approve, Reject)", () => {
  let managerAuth;
  let cont1Auth;
  let visAuth;

  let contWithdrawalId;
  let visWithdrawalId;

  beforeAll(async () => {
    managerAuth = await getAuthHeader("mgr1");
    cont1Auth = await getAuthHeader("cont1");
    visAuth = await getAuthHeader("vis1");

    // Clean up previous withdrawals and transactions
    await pool.query("DELETE FROM CMS_WALLETWD WHERE WALLETID IN (SELECT WALLETID FROM CMS_WALLET WHERE CUSTOMERID IN (8, 15))");
    await pool.query("DELETE FROM CMS_WALLETTRAN WHERE WALLETID IN (SELECT WALLETID FROM CMS_WALLET WHERE CUSTOMERID IN (8, 15))");

    // Set known starting balances
    await pool.query(
      "UPDATE CMS_WALLET SET BALANCE = 500.00, RESERVEDAMT = 0.00, STATUSID = 10 WHERE CUSTOMERID = 8"
    );
    await pool.query(
      "UPDATE CMS_WALLET SET BALANCE = 300.00, RESERVEDAMT = 0.00, STATUSID = 10 WHERE CUSTOMERID = 15"
    );
  });

  it("should reject withdrawal request exceeding available balance with HTTP 400", async () => {
    const res = await request(app)
      .post("/api/wallets/withdraw/request")
      .set(cont1Auth)
      .send({ customerId: 8, amount: 9999.00, remarks: "Too much cash" });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
    expect(res.body.MESSAGE).toContain("Insufficient available wallet balance");
  });

  it("should allow Contract Employee (cont1) to request ₹100.00 cash withdrawal with HTTP 201 (reserves funds)", async () => {
    const res = await request(app)
      .post("/api/wallets/withdraw/request")
      .set(cont1Auth)
      .send({ customerId: 8, amount: 100.00, remarks: "Need cash for transit" });

    expect(res.status).toBe(201);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeDefined();
    expect(res.body.DATA).toHaveProperty("WALLETWDID");

    contWithdrawalId = res.body.DATA.WALLETWDID;

    // Verify wallet reserved amount is now ₹100.00 while balance is still ₹500.00
    const [wallets] = await pool.query("SELECT BALANCE, RESERVEDAMT FROM CMS_WALLET WHERE CUSTOMERID = 8");
    expect(Number(wallets[0].BALANCE)).toBe(500.00);
    expect(Number(wallets[0].RESERVEDAMT)).toBe(100.00);
  });

  it("should reject duplicate withdrawal request while one is pending with HTTP 400", async () => {
    const res = await request(app)
      .post("/api/wallets/withdraw/request")
      .set(cont1Auth)
      .send({ customerId: 8, amount: 50.00, remarks: "Second request" });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
    expect(res.body.MESSAGE).toContain("A pending withdrawal request already exists for this wallet");
  });

  it("should query withdrawal requests for cont1 with HTTP 200", async () => {
    const res = await request(app)
      .get("/api/wallets/withdraw/requests?customerId=8")
      .set(cont1Auth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(Array.isArray(res.body.DATA)).toBe(true);

    const pendingReq = res.body.DATA.find((w) => w.WALLETWDID === contWithdrawalId);
    expect(pendingReq).toBeDefined();
    expect(Number(pendingReq.AMOUNT)).toBe(100.00);
    expect(pendingReq.STATUSCODE).toBe("REQ");
  });

  it("should allow Contract Employee (cont1) to cancel pending withdrawal request with HTTP 200 (releases reserved funds)", async () => {
    const res = await request(app)
      .post(`/api/wallets/withdraw/${contWithdrawalId}/cancel`)
      .set(cont1Auth)
      .send({ remarks: "Changed mind, canceling withdrawal" });

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);

    // Verify reserved amount was released back to ₹0.00
    const [wallets] = await pool.query("SELECT BALANCE, RESERVEDAMT FROM CMS_WALLET WHERE CUSTOMERID = 8");
    expect(Number(wallets[0].BALANCE)).toBe(500.00);
    expect(Number(wallets[0].RESERVEDAMT)).toBe(0.00);
  });

  it("should allow Visitor (vis1) to request ₹100.00 withdrawal and Canteen Manager to reject it with HTTP 200", async () => {
    // 1. Visitor submits withdrawal request
    const reqRes = await request(app)
      .post("/api/wallets/withdraw/request")
      .set(visAuth)
      .send({ customerId: 15, amount: 100.00, remarks: "Visitor payout" });

    expect(reqRes.status).toBe(201);
    visWithdrawalId = reqRes.body.DATA.WALLETWDID;

    // Verify funds reserved
    const [wReserved] = await pool.query("SELECT RESERVEDAMT FROM CMS_WALLET WHERE CUSTOMERID = 15");
    expect(Number(wReserved[0].RESERVEDAMT)).toBe(100.00);

    // 2. Manager rejects the withdrawal request
    const rejRes = await request(app)
      .post(`/api/wallets/withdraw/${visWithdrawalId}/reject`)
      .set(managerAuth)
      .send({ remarks: "Invalid visitor withdrawal documentation" });

    expect(rejRes.status).toBe(200);
    expect(rejRes.body.SUCCESS).toBe(true);

    // Verify reserved amount released back to 0.00 and balance intact at 300.00
    const [wAfter] = await pool.query("SELECT BALANCE, RESERVEDAMT FROM CMS_WALLET WHERE CUSTOMERID = 15");
    expect(Number(wAfter[0].BALANCE)).toBe(300.00);
    expect(Number(wAfter[0].RESERVEDAMT)).toBe(0.00);
  });

  it("should allow Contract Employee (cont1) to submit a fresh withdrawal for ₹150.00 and Canteen Manager to approve it with HTTP 200", async () => {
    // 1. Submit fresh withdrawal request for ₹150.00
    const reqRes = await request(app)
      .post("/api/wallets/withdraw/request")
      .set(cont1Auth)
      .send({ customerId: 8, amount: 150.00, remarks: "Approved payout request" });

    expect(reqRes.status).toBe(201);
    const newWithdrawalId = reqRes.body.DATA.WALLETWDID;

    // 2. Canteen Manager approves withdrawal and pays out cash
    const appRes = await request(app)
      .post(`/api/wallets/withdraw/${newWithdrawalId}/approve`)
      .set(managerAuth)
      .send({ paymentMethod: "CASH", remarks: "Cash disbursed at main counter" });

    expect(appRes.status).toBe(200);
    expect(appRes.body.SUCCESS).toBe(true);

    // 3. Verify balance debited: 500 - 150 = 350.00, and RESERVEDAMT = 0.00
    const [wallets] = await pool.query("SELECT BALANCE, RESERVEDAMT FROM CMS_WALLET WHERE CUSTOMERID = 8");
    expect(Number(wallets[0].BALANCE)).toBe(350.00);
    expect(Number(wallets[0].RESERVEDAMT)).toBe(0.00);

    // 4. Verify WITHDRAWAL ledger record created with correct CANTEENID
    const [txns] = await pool.query(
      `SELECT TRANSTYPE, SOURCECODE, AMOUNT, CANTEENID 
       FROM CMS_WALLETTRAN 
       WHERE WALLETID IN (SELECT WALLETID FROM CMS_WALLET WHERE CUSTOMERID = 8)
         AND (TRANSTYPE = 'WITHDRAWAL' OR SOURCECODE = 'WITHDRAWAL')
       ORDER BY CREATEDAT DESC LIMIT 1`
    );
    expect(txns.length).toBe(1);
    expect(Number(txns[0].AMOUNT)).toBe(150.00);
    expect(Number(txns[0].CANTEENID)).toBe(1);
  });

  it("should reject Manager of another canteen (mgr2, Canteen 3) from approving Canteen 1 request with HTTP 403 Forbidden", async () => {
    const mgr2Auth = await getAuthHeader("mgr2");

    // 1. Submit fresh withdrawal for cont1 (Canteen 1)
    const reqRes = await request(app)
      .post("/api/wallets/withdraw/request")
      .set(cont1Auth)
      .send({ customerId: 8, amount: 50.00, remarks: "Cross-canteen test request" });

    expect(reqRes.status).toBe(201);
    const testWdId = reqRes.body.DATA.WALLETWDID;

    // 2. mgr2 (assigned only to Canteen 3) attempts to approve request for Canteen 1
    const appRes = await request(app)
      .post(`/api/wallets/withdraw/${testWdId}/approve`)
      .set(mgr2Auth)
      .send({ paymentMethod: "CASH" });

    expect(appRes.status).toBe(403);
    expect(appRes.body.SUCCESS).toBe(false);

    // 3. Clean up by cancelling request
    await request(app)
      .post(`/api/wallets/withdraw/${testWdId}/cancel`)
      .set(cont1Auth);
  });

  it("should isolate withdrawal queues so mgr2 (Canteen 3) does not see requests belonging to Canteen 1", async () => {
    const mgr2Auth = await getAuthHeader("mgr2");

    // 1. Submit fresh withdrawal for cont1 (Canteen 1)
    const reqRes = await request(app)
      .post("/api/wallets/withdraw/request")
      .set(cont1Auth)
      .send({ customerId: 8, amount: 50.00, remarks: "Queue isolation test" });

    expect(reqRes.status).toBe(201);
    const testWdId = reqRes.body.DATA.WALLETWDID;

    // 2. mgr2 fetches withdrawal requests for Canteen 3
    const listRes = await request(app)
      .get("/api/wallets/withdraw/requests?canteenId=3&status=REQ")
      .set(mgr2Auth);

    expect(listRes.status).toBe(200);
    expect(listRes.body.SUCCESS).toBe(true);
    const found = listRes.body.DATA.find((w) => w.WALLETWDID === testWdId);
    expect(found).toBeUndefined();

    // 3. Clean up by cancelling request
    await request(app)
      .post(`/api/wallets/withdraw/${testWdId}/cancel`)
      .set(cont1Auth);
  });

  afterAll(async () => {
    // Restore baseline wallet state for cont1 (8) and vis1 (15)
    await pool.query(
      "UPDATE CMS_WALLET SET BALANCE = 500.00, RESERVEDAMT = 0.00, STATUSID = 10 WHERE CUSTOMERID = 8"
    );
    await pool.query(
      "UPDATE CMS_WALLET SET BALANCE = 250.00, RESERVEDAMT = 0.00, STATUSID = 10 WHERE CUSTOMERID = 15"
    );
  });
});
