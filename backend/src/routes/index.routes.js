import express from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import { authenticate } from "../middlwares/auth.middleware.js";
import { authorizeSystemRoles } from "../middlwares/role.middleware.js";


import commonRoutes from "../modules/common/common.routes.js";
import identityRoutes from "../modules/identity/identity.routes.js";
import serviceRoutes from "../modules/service/service.routes.js";
import canteenRoutes from "../modules/canteen/canteen.routes.js";
import menuRoutes from "../modules/menu/menu.routes.js";
import pricingRoutes from "../modules/pricing/pricing.routes.js";
import daySlotRoutes from "../modules/dayslot/dayslot.routes.js";
import dayMenuRoutes, {
  publishedMenuRoutes,
} from "../modules/daymenu/daymenu.routes.js";
import bookingRoutes from "../modules/booking/booking.routes.js";
import walletRoutes from "../modules/wallet/wallet.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/common", commonRoutes);
router.use("/identity", identityRoutes);
router.use("/services", serviceRoutes);
router.use("/canteens", canteenRoutes);
router.use("/menu-items", menuRoutes);
router.use("/", pricingRoutes);
router.use("/day-slots", daySlotRoutes);
router.use("/day-menus", dayMenuRoutes);
router.use("/menus", publishedMenuRoutes);
router.use("/bookings", bookingRoutes);
router.use("/wallets", walletRoutes);

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
  authorizeSystemRoles("ADMIN"),
  (req, res) => {
    return res.status(200).json({
      SUCCESS: true,
      MESSAGE: "Admin access granted",
      DATA: req.user,
    });
  }
);



export default router;
