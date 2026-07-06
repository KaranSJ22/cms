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
  authorizeRoles("ADMIN", "CANTEENMAN", "CANTEENSTF"),
  getServicesController
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "CANTEENMAN", "CANTEENSTF"),
  validate(serviceIdSchema),
  getServiceController
);

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "CANTEENMAN"),
  validate(createServiceSchema),
  createServiceController
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "CANTEENMAN"),
  validate(updateServiceSchema),
  updateServiceController
);

export default router;
