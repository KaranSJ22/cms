import express from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorizeAnyCanteenRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createMenuSchema,
  updateMenuSchema,
  menuIdSchema,
  priceReadinessSchema,
} from "./menu.validation.js";

import {
  createMenuController,
  updateMenuController,
  getMenusController,
  getMenuController,
  checkPriceReadinessController,
} from "./menu.controller.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR", "CNTAST"),
  getMenusController
);

router.get(
  "/:id",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR", "CNTAST"),
  validate(menuIdSchema),
  getMenuController
);

router.get(
  "/:id/price-readiness",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR", "CNTAST"),
  validate(priceReadinessSchema),
  checkPriceReadinessController
);

router.post(
  "/",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR", "CNTAST"),
  validate(createMenuSchema),
  createMenuController
);

router.put(
  "/:id",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR", "CNTAST"),
  validate(updateMenuSchema),
  updateMenuController
);

export default router;
