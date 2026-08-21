import express from "express";
const router = express.Router();
import { authenticate } from "../../middlwares/auth.middleware.js";
import { authorizeAnyCanteenRole } from "../../middlwares/role.middleware.js";
import { validate } from "../../middlwares/validate.middleware.js";
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


const canManagePrices = authorizeAnyCanteenRole("CTNMNG", "CTNAST");
router.post(
  "/menu-items/:menuItemId/prices",
  authenticate,
  canManagePrices,
  validate(createItemPriceSchema),
  createItemPriceController
);
router.get(
  "/menu-items/:menuItemId/prices",
  authenticate,
  canManagePrices,
  validate(itemPriceHistorySchema),
  getItemPriceHistoryController
);
router.get(
  "/menu-items/:menuItemId/prices/effective",
  authenticate,
  validate(effectiveItemPricesSchema),
  getEffectiveItemPricesController
);
router.get(
  "/menu-items/:menuItemId/prices/effective/:customerTypeCode",
  authenticate,
  validate(effectiveItemPriceSchema),
  getEffectiveItemPriceController
);
router.patch(
  "/item-prices/:itemPriceId/deactivate",
  authenticate,
  canManagePrices,
  validate(itemPriceIdSchema),
  deactivateItemPriceController
);

export default router;
