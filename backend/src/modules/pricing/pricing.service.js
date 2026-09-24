import { pool } from "../../db/connection.js";
import {
  addItemPrice as addItemPriceRepository,
  deactivateItemPrice as deactivateItemPriceRepository,
  getEffectiveItemPrice,
  getEffectiveItemPrices,
  getItemPriceHistory,
} from "./pricing.repository.js";
import { NotFoundError, DatabaseError } from "../../common/errors/appError.js";

export const createItemPrice = async (menuItemId, priceData, createdByUserId) => {
  const created = await addItemPriceRepository({
    MENUITEMID: menuItemId,
    EFFFROM: priceData.EFFFROM,
    PRICEJSON: priceData.PRICES,
    CREATEDBY: createdByUserId,
  });

  if (!created?.ITEMPRICEID) {
    throw new DatabaseError("Item price creation failed");
  }

  return created;
};

export const fetchItemPriceHistory = async (menuItemId) => {
  const [rows] = await pool.query(
    `SELECT 
       IP.ITEMPRICEID, 
       IP.MENUITEMID, 
       MI.MENUCODE, 
       MI.ITEMNAME,
       IP.EFFFROM, 
       IP.STATUSID, 
       ST.STATUSCODE, 
       IP.CREATEDBY, 
       IP.CREATEDAT,
       IPD.ITEMPRICEDTID,
       IPD.CTYPECODE,
       CT.CTYPENAME,
       IPD.PRICE
     FROM CMS_ITEMPRICE IP
     JOIN CMS_STATUS ST ON ST.STATUSID = IP.STATUSID
     JOIN CMS_MENUITEM MI ON MI.MENUITEMID = IP.MENUITEMID
     LEFT JOIN CMS_ITEMPRICEDT IPD ON IPD.ITEMPRICEID = IP.ITEMPRICEID
     LEFT JOIN CMS_CUSTTYPE CT ON CT.CTYPECODE = IPD.CTYPECODE
     WHERE IP.MENUITEMID = ?
     ORDER BY IP.EFFFROM DESC, CT.CTYPENAME ASC`,
    [Number(menuItemId)]
  );

  const historyMap = new Map();
  for (const row of rows) {
    if (!historyMap.has(row.ITEMPRICEID)) {
      historyMap.set(row.ITEMPRICEID, {
        ITEMPRICEID: row.ITEMPRICEID,
        MENUITEMID: row.MENUITEMID,
        MENUCODE: row.MENUCODE,
        ITEMNAME: row.ITEMNAME,
        EFFFROM: row.EFFFROM,
        STATUSID: row.STATUSID,
        STATUSCODE: row.STATUSCODE,
        CREATEDBY: row.CREATEDBY,
        CREATEDAT: row.CREATEDAT,
        PRICES: [],
      });
    }

    if (row.CTYPECODE) {
      historyMap.get(row.ITEMPRICEID).PRICES.push({
        ITEMPRICEDTID: row.ITEMPRICEDTID,
        CTYPECODE: row.CTYPECODE,
        CTYPENAME: row.CTYPENAME,
        PRICE: Number(row.PRICE),
      });
    }
  }

  return Array.from(historyMap.values());
};

export const fetchEffectiveItemPrices = async (menuItemId, serviceDate) =>
  getEffectiveItemPrices(menuItemId, serviceDate);

export const fetchEffectiveItemPrice = async (
  menuItemId,
  customerTypeCode,
  serviceDate
) => {
  const price = await getEffectiveItemPrice(
    menuItemId,
    customerTypeCode,
    serviceDate
  );

  if (!price) {
    throw new NotFoundError("No effective price found for this customer type");
  }

  return price;
};

export const deactivateItemPrice = async (itemPriceId) => {
  const result = await deactivateItemPriceRepository(itemPriceId);

  if (!result?.ITEMPRICEID) {
    throw new DatabaseError("Item price deactivation failed");
  }

  return result;
};

