import { Router } from "express";
import kioskRoutes from "../modules/kiosk/kiosk.routes.js";
import bookingRoutes from "../modules/booking/booking.routes.js";
import servingRoutes from "../modules/serving/serving.routes.js";
import systemRoutes from "../modules/system/system.routes.js";

const router = Router();

// Domain Routes mounted under /api/kiosk
router.use("/kiosk", kioskRoutes);
router.use("/kiosk", bookingRoutes);
router.use("/kiosk/counter", servingRoutes);
router.use("/kiosk/system", systemRoutes);

export default router;
