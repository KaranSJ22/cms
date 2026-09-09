import express from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";

import {
  getStatus,
  getCustomerTypes,
  getScreens,
  getAutonos,
} from "./common.controller.js";

const router = express.Router();

router.get("/status", authenticate, getStatus);
router.get("/customer-types", authenticate, getCustomerTypes);
router.get("/screens", authenticate, authorizeRoles("SYSADM"), getScreens);
router.get("/autonos", authenticate, authorizeRoles("SYSADM"), getAutonos);

export default router;