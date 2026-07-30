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
  authorizeRoles("ADMIN", "CTNMNG", "CTNSTF"),
  getServicesController
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "CTNMNG", "CTNSTF"),
  validate(serviceIdSchema),
  getServiceController
);

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "CTNMNG"),
  validate(createServiceSchema),
  createServiceController
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "CTNMNG"),
  validate(updateServiceSchema),
  updateServiceController
);

export default router;
