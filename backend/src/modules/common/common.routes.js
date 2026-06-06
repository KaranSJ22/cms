import express from "express";

import { authenticate } from "../../middlwares/auth.middleware.js";
import { authorizeRoles } from "../../middlwares/role.middleware.js";

import {
  getStatus,
  getCustomerTypes,
  getScreens,
  getAutonos,
} from "./common.controller.js";

const router = express.Router();

router.get("/status", authenticate, getStatus);
router.get("/customer-types", authenticate, getCustomerTypes);
router.get("/screens", authenticate, authorizeRoles("ADMIN"), getScreens);
router.get("/autonos", authenticate, authorizeRoles("ADMIN"), getAutonos);

export default router;