import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { getAuthHeader } from "../../../test/testHelpers.js";

describe("Identity Module: Security & RBAC Guards", () => {
  it("should reject unauthenticated request to /api/identity/users with HTTP 401", async () => {
    const res = await request(app).get("/api/identity/users");

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject non-admin employee (perm1) from /api/identity/users with HTTP 403", async () => {
    const authHeader = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/identity/users")
      .set(authHeader);

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject Canteen Manager (mgr1) from /api/identity/users with HTTP 403", async () => {
    const authHeader = await getAuthHeader("mgr1");

    const res = await request(app)
      .get("/api/identity/users")
      .set(authHeader);

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject non-admin from /api/identity/roles with HTTP 403", async () => {
    const authHeader = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/identity/roles")
      .set(authHeader);

    expect(res.status).toBe(403);
  });

  it("should reject non-admin from /api/identity/customers with HTTP 403", async () => {
    const authHeader = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/identity/customers")
      .set(authHeader);

    expect(res.status).toBe(403);
  });
});

describe("Identity Module: Read Master Data (Admin Access)", () => {
  it("GET /api/identity/users - should allow System Admin to fetch user list", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .get("/api/identity/users")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeInstanceOf(Array);
    expect(res.body.DATA.length).toBeGreaterThan(0);

    const loginIds = res.body.DATA.map((u) => u.LOGINID);
    expect(loginIds).toContain("admin");
    expect(loginIds).toContain("perm1");
    expect(loginIds).toContain("mgr1");
  });

  it("GET /api/identity/roles - should allow System Admin to fetch role directory", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .get("/api/identity/roles")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeInstanceOf(Array);

    const roleCodes = res.body.DATA.map((r) => r.ROLECODE);
    expect(roleCodes).toContain("SYSADM");
  });

  it("GET /api/identity/customers - should allow System Admin to fetch customer eater directory", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .get("/api/identity/customers")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeInstanceOf(Array);
    expect(res.body.DATA.length).toBeGreaterThan(0);

    const first = res.body.DATA[0];
    expect(first.CUSTOMERID).toBeDefined();
    expect(first.CTYPECODE).toBeDefined();
  });

  it("GET /api/identity/canteen-roles/:userId - should return canteen assignments for a manager", async () => {
    const authHeader = await getAuthHeader("admin");

    // User ID 2 corresponds to mgr1 in seed data
    const res = await request(app)
      .get("/api/identity/canteen-roles/2")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeInstanceOf(Array);
  });
});

describe("Identity Module: Role Governance & Provisioning (Admin Access)", () => {
  it("POST /api/identity/user-roles - should reject non-admin from assigning system roles with HTTP 403", async () => {
    const authHeader = await getAuthHeader("perm1");

    const res = await request(app)
      .post("/api/identity/user-roles")
      .set(authHeader)
      .send({
        USERID: 10,
        ROLEID: 1,
      });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("POST /api/identity/user-roles - should reject missing required fields with HTTP 400", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .post("/api/identity/user-roles")
      .set(authHeader)
      .send({
        USERID: "not-a-number",
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("POST /api/identity/canteen-roles - should reject non-admin from assigning canteen roles with HTTP 403", async () => {
    const authHeader = await getAuthHeader("perm1");

    const res = await request(app)
      .post("/api/identity/canteen-roles")
      .set(authHeader)
      .send({
        USERID: 10,
        ROLEID: 4,
        CANTEENID: 2,
      });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("POST /api/identity/canteen-roles - should allow System Admin to assign Canteen Staff role with HTTP 201", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .post("/api/identity/canteen-roles")
      .set(authHeader)
      .send({
        USERID: 10,
        ROLEID: 4, // CNTSTF
        CANTEENID: 2,
        ISDEFAULT: 0,
      });

    expect(res.status).toBe(201);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeInstanceOf(Array);

    const hasAssignedRole = res.body.DATA.some(
      (r) => r.CANTEENID === 2 && (r.ROLECODE === "CNTSTF" || r.ROLEID === 4)
    );
    expect(hasAssignedRole).toBe(true);
  });

  it("GET /api/identity/canteen-roles/:userId - should verify the assigned canteen role is present", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .get("/api/identity/canteen-roles/10")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    const hasAssignedRole = res.body.DATA.some(
      (r) => r.CANTEENID === 2 && (r.ROLECODE === "CNTSTF" || r.ROLEID === 4)
    );
    expect(hasAssignedRole).toBe(true);
  });

  it("DELETE /api/identity/canteen-roles - should allow System Admin to revoke the assigned canteen role with HTTP 200", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .delete("/api/identity/canteen-roles")
      .set(authHeader)
      .send({
        USERID: 10,
        ROLEID: 4,
        CANTEENID: 2,
      });

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);

    const rolesAfter = res.body.DATA || [];
    const stillActive = rolesAfter.some(
      (r) => r.CANTEENID === 2 && (r.ROLECODE === "CNTSTF" || r.ROLEID === 4) && r.ISACTIVE === 1
    );
    expect(stillActive).toBe(false);
  });
});
