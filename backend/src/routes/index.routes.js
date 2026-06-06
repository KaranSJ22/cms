import express from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import { authenticate } from "../middlwares/auth.middleware.js";
import { authorizeRoles } from "../middlwares/role.middleware.js";

import commonRoutes from "../modules/common/common.routes.js";
import identityRoutes from "../modules/identity/identity.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/common", commonRoutes);
router.use("/identity",identityRoutes);

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