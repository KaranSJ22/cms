import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../../app.js";
import { getAuthHeader } from "../../../test/testHelpers.js";

describe("Menu Item Module: Security & RBAC Guards", () => {
  it("should reject unauthenticated request to GET /api/menu-items with HTTP 401", async () => {
    const res = await request(app).get("/api/menu-items");

    expect(res.status).toBe(401);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from GET /api/menu-items with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .get("/api/menu-items")
      .set(userAuth);

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from POST /api/menu-items with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .post("/api/menu-items")
      .set(userAuth)
      .send({
        SHORTNAME: "BLOCKED",
        ITEMNAME: "Blocked Item",
      });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject regular employee (perm1) from PUT /api/menu-items/:id with HTTP 403 Forbidden", async () => {
    const userAuth = await getAuthHeader("perm1");

    const res = await request(app)
      .put("/api/menu-items/1")
      .set(userAuth)
      .send({
        SHORTNAME: "HACK",
        ITEMNAME: "Hacked Item",
      });

    expect(res.status).toBe(403);
    expect(res.body.SUCCESS).toBe(false);
  });
});

describe("Menu Item Module: Input Validation", () => {
  it("should reject POST /api/menu-items when required fields are missing with HTTP 400", async () => {
    const managerAuth = await getAuthHeader("mgr1");

    const res = await request(app)
      .post("/api/menu-items")
      .set(managerAuth)
      .send({
        SHORTNAME: "",
      });

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should reject GET /api/menu-items/:id when ID is not a positive integer with HTTP 400", async () => {
    const managerAuth = await getAuthHeader("mgr1");

    const res = await request(app)
      .get("/api/menu-items/invalid_id")
      .set(managerAuth);

    expect(res.status).toBe(400);
    expect(res.body.SUCCESS).toBe(false);
  });
});

describe("Menu Item Module: Multi-Service Dynamic CRUD Lifecycle", () => {
  let managerAuth = null;
  let breakfastServiceId = null;
  let lunchServiceId = null;

  let createdBreakfastItemId = null;
  let createdLunchItemId = null;
  let createdUniversalItemId = null;

  const dynamicSuffix = Date.now().toString().slice(-4);
  const bfItemName = `Masala Dosa ${dynamicSuffix}`;
  const bfShortName = `DOSA_${dynamicSuffix}`;

  const lunchItemName = `Special Veg Thali ${dynamicSuffix}`;
  const lunchShortName = `THL_${dynamicSuffix}`;

  const universalItemName = `Bottled Water ${dynamicSuffix}`;
  const universalShortName = `WTR_${dynamicSuffix}`;

  beforeAll(async () => {
    managerAuth = await getAuthHeader("mgr1");

    // Fetch existing services from cms_test_db
    const res = await request(app).get("/api/services").set(managerAuth);
    const existingServices = res.body?.DATA || [];

    if (existingServices.length >= 2) {
      breakfastServiceId = existingServices[0].SERVICEID;
      lunchServiceId = existingServices[1].SERVICEID;
    } else {
      // Ensure at least two distinct meal services exist dynamically
      const bfRes = await request(app)
        .post("/api/services")
        .set(managerAuth)
        .send({
          SERVCODE: `BF_${Date.now().toString().slice(-4)}`,
          SERVNAME: "Morning Breakfast",
          DEFSTART: "07:30:00",
          DEFEND: "09:30:00",
        });
      breakfastServiceId = bfRes.body.DATA.SERVICEID;

      const lnRes = await request(app)
        .post("/api/services")
        .set(managerAuth)
        .send({
          SERVCODE: `LN_${Date.now().toString().slice(-4)}`,
          SERVNAME: "Afternoon Lunch",
          DEFSTART: "12:00:00",
          DEFEND: "14:30:00",
        });
      lunchServiceId = lnRes.body.DATA.SERVICEID;
    }
  });

  it("should create a Breakfast menu item linked to the Breakfast Service with HTTP 201", async () => {
    const res = await request(app)
      .post("/api/menu-items")
      .set(managerAuth)
      .send({
        SHORTNAME: bfShortName,
        ITEMNAME: bfItemName,
        ITEMDESCR: "Crispy fermented crepe served with sambar and chutney",
        SERVICEID: breakfastServiceId,
        ISSPECIAL: 0,
        OFFSER: 0,
      });

    expect(res.status).toBe(201);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeDefined();
    expect(res.body.DATA.MENUITEMID).toBeDefined();
    expect(res.body.DATA.SERVICEID).toBe(breakfastServiceId);
    expect(res.body.DATA.ITEMNAME).toBe(bfItemName);

    createdBreakfastItemId = res.body.DATA.MENUITEMID;
  });

  it("should create a Lunch menu item linked to the Lunch Service with HTTP 201", async () => {
    const res = await request(app)
      .post("/api/menu-items")
      .set(managerAuth)
      .send({
        SHORTNAME: lunchShortName,
        ITEMNAME: lunchItemName,
        ITEMDESCR: "Full south Indian meal with rice, sambar, rasam, and poriyal",
        SERVICEID: lunchServiceId,
        ISSPECIAL: 1,
        OFFSER: 0,
      });

    expect(res.status).toBe(201);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.MENUITEMID).toBeDefined();
    expect(res.body.DATA.SERVICEID).toBe(lunchServiceId);
    expect(res.body.DATA.ITEMNAME).toBe(lunchItemName);

    createdLunchItemId = res.body.DATA.MENUITEMID;
  });

  it("should create an All-Day / Universal menu item with null SERVICEID with HTTP 201", async () => {
    const res = await request(app)
      .post("/api/menu-items")
      .set(managerAuth)
      .send({
        SHORTNAME: universalShortName,
        ITEMNAME: universalItemName,
        ITEMDESCR: "Packaged mineral drinking water 500ml",
        SERVICEID: null,
        ISSPECIAL: 0,
        OFFSER: 0,
      });

    expect(res.status).toBe(201);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.MENUITEMID).toBeDefined();
    expect(res.body.DATA.ITEMNAME).toBe(universalItemName);

    createdUniversalItemId = res.body.DATA.MENUITEMID;
  });

  it("should allow Canteen Manager to list all menu items with HTTP 200", async () => {
    const res = await request(app)
      .get("/api/menu-items")
      .set(managerAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA).toBeInstanceOf(Array);
    expect(res.body.DATA.length).toBeGreaterThanOrEqual(3);

    const names = res.body.DATA.map((item) => item.ITEMNAME);
    expect(names).toContain(bfItemName);
    expect(names).toContain(lunchItemName);
    expect(names).toContain(universalItemName);
  });

  it("should allow fetching a menu item by ID with HTTP 200", async () => {
    expect(createdLunchItemId).not.toBeNull();

    const res = await request(app)
      .get(`/api/menu-items/${createdLunchItemId}`)
      .set(managerAuth);

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.MENUITEMID).toBe(createdLunchItemId);
    expect(res.body.DATA.ITEMNAME).toBe(lunchItemName);
    expect(res.body.DATA.SERVICEID).toBe(lunchServiceId);
  });

  it("should return HTTP 404 when fetching a non-existent menu item ID", async () => {
    const res = await request(app)
      .get("/api/menu-items/999999")
      .set(managerAuth);

    expect(res.status).toBe(404);
    expect(res.body.SUCCESS).toBe(false);
  });

  it("should allow Canteen Manager to update menu item details with HTTP 200", async () => {
    expect(createdBreakfastItemId).not.toBeNull();

    const updatedName = `${bfItemName} (Special Roast)`;

    const res = await request(app)
      .put(`/api/menu-items/${createdBreakfastItemId}`)
      .set(managerAuth)
      .send({
        SHORTNAME: bfShortName,
        ITEMNAME: updatedName,
        ITEMDESCR: "Ghee roast masala dosa with extra coconut chutney",
        STATUS: "ACT",
        CHGREASON: "Recipe and name update",
      });

    expect(res.status).toBe(200);
    expect(res.body.SUCCESS).toBe(true);
    expect(res.body.DATA.ITEMNAME).toBe(updatedName);
  });
});
