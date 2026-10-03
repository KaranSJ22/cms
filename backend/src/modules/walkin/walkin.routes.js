import { Router } from "express";
import { WalkinController } from "./walkin.controller.js";
import { walkinValidation } from "./walkin.validation.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorizeAnyCanteenRole } from "../../middlewares/role.middleware.js";

const router = Router();

// Require authenticated Canteen Staff or Manager
router.use(authenticate);
router.use(authorizeAnyCanteenRole("CNTSTF", "CNTMGR", "CNTAST"));

// 1. Employee Lookup (Permanent & Contract)
router.get(
    "/employee-lookup",
    validate(walkinValidation.employeeLookup),
    WalkinController.employeeLookup
);

// 2. Visitor Lookup (Phone, Name, or Card)
router.get(
    "/visitor-lookup",
    validate(walkinValidation.visitorLookup),
    WalkinController.visitorLookup
);

// 3. Quick Register Walk-In Visitor
router.post(
    "/register-visitor",
    validate(walkinValidation.registerVisitor),
    WalkinController.registerVisitor
);

// 4. Get Active Slot Menu Items for Counter
router.get(
    "/active-menu",
    validate(walkinValidation.activeMenu),
    WalkinController.activeMenu
);

// 5. Atomic Direct-to-Served Order Submission
router.post(
    "/serve",
    validate(walkinValidation.serveWalkin),
    WalkinController.serveWalkin
);

export default router;
