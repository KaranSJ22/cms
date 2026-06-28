import express from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import { authenticate } from "../middlwares/auth.middleware.js";
import { authorizeRoles } from "../middlwares/role.middleware.js";

import commonRoutes from "../modules/common/common.routes.js";
import identityRoutes from "../modules/identity/identity.routes.js";
import serviceRoutes from "../modules/service/service.routes.js";
import menuRoutes from "../modules/menu/menu.routes.js";
import daySlotRoutes from "../modules/dayslot/dayslot.routes.js";
import dayMenuRoutes, {
  publishedMenuRoutes,
} from "../modules/daymenu/daymenu.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/common", commonRoutes);
router.use("/identity",identityRoutes);
router.use("/services", serviceRoutes);
router.use("/menu-items", menuRoutes);
router.use("/day-slots", daySlotRoutes);
router.use("/day-menus", dayMenuRoutes);
router.use("/menus", publishedMenuRoutes);

router.get("/me", authenticate, (req, res) => {
  return res.status(200).json({
    SUCCESS: true,
    MESSAGE: "Authenticated user details",
    DATA: req.user,
  });
});

router.get(
  "/admin/test",
  authenticate,
  authorizeRoles("ADMIN"),
  (req, res) => {
    return res.status(200).json({
      SUCCESS: true,
      MESSAGE: "Admin access granted",
      DATA: req.user,
    });
  }
);



export default router;
