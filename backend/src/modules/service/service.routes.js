import express from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorizeAnyCanteenRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createServiceSchema,
  updateServiceSchema,
  serviceIdSchema,
} from "./service.validation.js";

import {
  createServiceController,
  updateServiceController,
  getServicesController,
  getServiceController,
} from "./service.controller.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR", "CNTAST"),
  getServicesController
);

router.get(
  "/:id",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR", "CNTAST"),
  validate(serviceIdSchema),
  getServiceController
);

router.post(
  "/",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR", "CNTAST"),
  validate(createServiceSchema),
  createServiceController
);

router.put(
  "/:id",
  authenticate,
  authorizeAnyCanteenRole("CNTMGR", "CNTAST"),
  validate(updateServiceSchema),
  updateServiceController
);

export default router;
