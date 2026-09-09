import express from "express";
const router = express.Router();
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorizeAnyCanteenRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createItemPriceController,
  deactivateItemPriceController,
  getEffectiveItemPriceController,
  getEffectiveItemPricesController,
  getItemPriceHistoryController,
} from "./pricing.controller.js";
import {
  createItemPriceSchema,
  effectiveItemPriceSchema,
  effectiveItemPricesSchema,
  itemPriceHistorySchema,
  itemPriceIdSchema,
} from "./pricing.validation.js";


const canManagePrices = authorizeAnyCanteenRole("CNTMGR", "CNTAST");

// POST /pricing/menu-items/:menuItemId
router.post(
  "/menu-items/:menuItemId",
  authenticate,
  canManagePrices,
  validate(createItemPriceSchema),
  createItemPriceController
);

// GET /pricing/menu-items/:menuItemId
router.get(
  "/menu-items/:menuItemId",
  authenticate,
  canManagePrices,
  validate(itemPriceHistorySchema),
  getItemPriceHistoryController
);

// GET /pricing/menu-items/:menuItemId/effective
router.get(
  "/menu-items/:menuItemId/effective",
  authenticate,
  validate(effectiveItemPricesSchema),
  getEffectiveItemPricesController
);

// GET /pricing/menu-items/:menuItemId/effective/:customerTypeCode
router.get(
  "/menu-items/:menuItemId/effective/:customerTypeCode",
  authenticate,
  validate(effectiveItemPriceSchema),
  getEffectiveItemPriceController
);

// PATCH /pricing/item-prices/:itemPriceId/deactivate
router.patch(
  "/item-prices/:itemPriceId/deactivate",
  authenticate,
  canManagePrices,
  validate(itemPriceIdSchema),
  deactivateItemPriceController
);

export default router;
