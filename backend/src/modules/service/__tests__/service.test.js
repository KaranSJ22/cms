import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { getAuthHeader } from "../../../test/testHelpers.js";

describe("Service Module: Security & RBAC Guards", () => {
  it("should reject unauthenticated request to POST /api/services with HTTP 401", async () => {
    const res = await request(app)
      .post("/api/services")
      .send({
        SERVCODE: "UNAUTH_TEST",
        SERVNAME: "Unauthorized Service",
        DEFSTART: "08:00:00",
        DEFEND: "10:00:00",
      });

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from creating a service with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .post("/api/services")
      .set(userAuth)
      .send({
        SERVCODE: "PERM_TEST",
        SERVNAME: "Employee Blocked Service",
        DEFSTART: "08:00:00",
        DEFEND: "10:00:00",
      });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from updating a service with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .put("/api/services/1")
      .set(userAuth)
      .send({
        SERVNAME: "Hacked Service Name",
        DEFSTART: "09:00:00",
        DEFEND: "11:00:00",
        STATUS: "ACT",
      });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });
});

describe("Service Module: Input Validation", () => {
  it("should reject POST /api/services when required fields are missing with HTTP 400", async () => {
    const managerAuth = await getAuthHeader("mgr1");

    const res = await request(app)
      .post("/api/services")
      .set(managerAuth)
      .send({
        SERVCODE: "",
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject POST /api/services when time format is invalid with HTTP 400", async () => {
    const managerAuth = await getAuthHeader("mgr1");

    const res = await request(app)
      .post("/api/services")
      .set(managerAuth)
      .send({
        SERVCODE: "INVALID_TIME",
        SERVNAME: "Bad Time Service",
        DEFSTART: "25:99:99",
        DEFEND: "99:00:00",
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject GET /api/services/:id when id is not a positive integer with HTTP 400", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/services/non_numeric_id")
      .set(userAuth);

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });
});

describe("Service Module: CRUD Operations & Dynamic Lifecycle", () => {
  let createdServiceId = null;
  const dynamicSuffix = Date.now().toString().slice(-5);
  const uniqueServCode = `SRV_${dynamicSuffix}`;
  const uniqueServName = `Dynamic Service ${dynamicSuffix}`;

  it("should allow Canteen Manager (mgr1) to create a new service with HTTP 201", async () => {
    const managerAuth = await getAuthHeader("mgr1");

    const res = await request(app)
      .post("/api/services")
      .set(managerAuth)
      .send({
        SERVCODE: uniqueServCode,
        SERVNAME: uniqueServName,
        DEFSTART: "11:30:00",
        DEFEND: "14:30:00",
      });

    expect(res.status).toBe(201);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeDefined();
    expect(res.body.DATA.SERVICEID).toBeDefined();
    expect(res.body.DATA.SERVCODE).toBe(uniqueServCode);
    expect(res.body.DATA.SERVNAME).toBe(uniqueServName);

    createdServiceId = res.body.DATA.SERVICEID;
  });

  it("should allow authenticated users to list all services with HTTP 200", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/services")
      .set(userAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeInstanceOf(Array);
    expect(res.body.DATA.length).toBeGreaterThan(0);

    // Verify our dynamically created service is in the directory
    const codes = res.body.DATA.map((s) => s.SERVCODE);
    expect(codes).toContain(uniqueServCode);
  });

  it("should allow fetching an existing service by ID with HTTP 200", async () => {
    expect(createdServiceId).not.toBeNull();

    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .get(`/api/services/${createdServiceId}`)
      .set(userAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.SERVICEID).toBe(createdServiceId);
    expect(res.body.DATA.SERVCODE).toBe(uniqueServCode);
  });

  it("should return HTTP 404 when fetching a non-existent service ID", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/services/999999")
      .set(userAuth);

    expect(res.status).toBe(404);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should allow Canteen Manager (mgr1) to update service details with HTTP 200", async () => {
    expect(createdServiceId).not.toBeNull();

    const managerAuth = await getAuthHeader("mgr1");
    const updatedName = `${uniqueServName} (Updated)`;

    const res = await request(app)
      .put(`/api/services/${createdServiceId}`)
      .set(managerAuth)
      .send({
        SERVNAME: updatedName,
        DEFSTART: "12:00:00",
        DEFEND: "15:00:00",
        STATUS: "ACT",
        CHGREASON: "Timing adjustment for test suite",
      });

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.SERVNAME).toBe(updatedName);
  });
});
