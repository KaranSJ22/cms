import { pool } from "../../db/connection.js";

/**
 * Searches employee (Permanent, Contract, OCE) by code, login ID, or RFID card.
 */
export const employeeLookup = async (queryStr) => {
  const cleanQuery = (queryStr || "").trim();
  if (!cleanQuery) return null;

  const [resultSets] = await pool.query("CALL CMSWALKINLOOKUPEMP(?)", [cleanQuery]);
  const rows = resultSets[0] || [];
  return rows[0] || null;
};

/**
 * Searches visitors by mobile number, visitor name, or visitor RFID.
 */
export const visitorLookup = async (queryStr) => {
  const cleanQuery = (queryStr || "").trim();
  if (!cleanQuery) return [];

  const [resultSets] = await pool.query("CALL CMSWALKINLOOKUPVISITOR(?)", [cleanQuery]);
  return resultSets[0] || [];
};

/**
 * Atomically onboards a walk-in visitor with Customer, Visitor profile, ₹0.00 Wallet, and optional RFID pass.
 */
export const registerVisitor = async (
  { VISNAME, VISMOBILE, VISORG = null, VISPURPOSE = null, KEYVALUE = null },
  staffUserId
) => {
  const [resultSets] = await pool.query(
    "CALL CMSWALKINREGISTERVISITOR(?, ?, ?, ?, ?, ?)",
    [
      (VISNAME || "").trim(),
      (VISMOBILE || "").trim(),
      VISORG ? VISORG.trim() : null,
      VISPURPOSE ? VISPURPOSE.trim() : null,
      KEYVALUE && KEYVALUE.trim() ? KEYVALUE.trim() : null,
      staffUserId,
    ]
  );
  const rows = resultSets[0] || [];
  return rows[0] || null;
};

/**
 * Fetches today's active menu items with customer-type-specific pricing for the walk-in counter.
 */
export const getActiveMenu = async (canteenId, ctypeCode = "PRM") => {
  const [resultSets] = await pool.query("CALL CMSWALKINGETACTIVEMENU(?, ?)", [
    parseInt(canteenId, 10),
    ctypeCode || "PRM",
  ]);
  return resultSets[0] || [];
};

/**
 * Executes direct atomic walk-in serving, item pricing, wallet payment (if contract/visitor),
 * booking counter increment, booking header, items, wallet transaction, and immutable history.
 */
export const serveWalkin = async (
  { customerId, canteenId, serviceId, items },
  staffUserId
) => {
  const [resultSets] = await pool.query(
    "CALL CMSWALKINSERVE(?, ?, ?, ?, ?)",
    [
      parseInt(customerId, 10),
      parseInt(canteenId, 10),
      parseInt(serviceId, 10),
      JSON.stringify(items || []),
      staffUserId,
    ]
  );

  const header = resultSets[0]?.[0];
  if (!header) {
    throw new Error("Failed to serve walk-in booking");
  }

  const itemsList = resultSets[1] || [];

  return {
    bookingId: header.BOOKINGID,
    bookNo: header.BOOKNO,
    statusCode: header.STATUSCODE,
    statusText: header.STATUSTEXT,
    customer: {
      customerId: header.CUSTOMERID,
      dispName: header.DISPNAME,
      ctypeCode: header.CTYPECODE,
    },
    totalQty: Number(header.TOTALQTY),
    totalAmount: Number(header.TOTALAMOUNT),
    walletBalance: header.WALLETBALANCE !== null ? Number(header.WALLETBALANCE) : null,
    items: itemsList.map((i) => ({
      dayMenuId: i.dayMenuId,
      menuItemId: i.menuItemId,
      itemName: i.itemName,
      qty: Number(i.qty),
      rate: Number(i.rate),
      amount: Number(i.amount),
    })),
  };
};

