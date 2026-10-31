import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { getAuthHeader } from "../../../test/testHelpers.js";

describe("Common Module: GET /api/common/status", () => {
  it("should reject unauthenticated request with HTTP 401", async () => {
    const res = await request(app).get("/api/common/status");

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should return 200 and full list of system statuses for authenticated user", async () => {
    const authHeader = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/common/status")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeInstanceOf(Array);
    expect(res.body.DATA.length).toBeGreaterThan(0);

    // Verify status structure
    const first = res.body.DATA[0];
    expect(first.STATUSID).toBeDefined();
    expect(first.STATUSCODE).toBeDefined();
    expect(first.STATUSNAME).toBeDefined();
  });

  it("should filter statuses by status group when statusGrp query param is provided", async () => {
    const authHeader = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/common/status?statusGrp=ORDER")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeInstanceOf(Array);

    // Verify all returned records belong to the requested group
    for (const item of res.body.DATA) {
      expect(item.STATUSGRP).toBe("ORDER");
    }
  });
});

describe("Common Module: GET /api/common/customer-types", () => {
  it("should reject unauthenticated request with HTTP 401", async () => {
    const res = await request(app).get("/api/common/customer-types");

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should return 200 and customer categories including standard ISRO types", async () => {
    const authHeader = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/common/customer-types")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeInstanceOf(Array);
    expect(res.body.DATA.length).toBeGreaterThan(0);

    const codes = res.body.DATA.map((c) => c.CTYPECODE);
    expect(codes).toContain("PRM");
    expect(codes).toContain("CNT");
    expect(codes).toContain("VIS");
  });
});

describe("Common Module: GET /api/common/autonos (Admin Protected)", () => {
  it("should reject unauthenticated request with HTTP 401", async () => {
    const res = await request(app).get("/api/common/autonos");

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject non-admin employee (perm1) with HTTP 403 Forbidden", async () => {
    const authHeader = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/common/autonos")
      .set(authHeader);

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should allow System Admin (admin) to fetch autonumber configurations with HTTP 200", async () => {
    const authHeader = await getAuthHeader("admin");

    const res = await request(app)
      .get("/api/common/autonos")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeInstanceOf(Array);
    expect(res.body.DATA.length).toBeGreaterThan(0);

    // Verify known auto-number configurations exist
    const tblNames = res.body.DATA.map((row) => row.TBLNAME);
    expect(tblNames).toContain("CMS_DAYSLOT");
  });
});
