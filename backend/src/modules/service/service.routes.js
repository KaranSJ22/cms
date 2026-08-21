import express from "express";

import { authenticate } from "../../middlwares/auth.middleware.js";
import { authorizeRoles } from "../../middlwares/role.middleware.js";
import { validate } from "../../middlwares/validate.middleware.js";
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
  authorizeRoles("CTNMNG", "CTNAST"),
  getServicesController
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("CTNMNG", "CTNAST"),
  validate(serviceIdSchema),
  getServiceController
);

router.post(
  "/",
  authenticate,
  authorizeRoles("CTNMNG", "CTNAST"),
  validate(createServiceSchema),
  createServiceController
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("CTNMNG", "CTNAST"),
  validate(updateServiceSchema),
  updateServiceController
);

export default router;
