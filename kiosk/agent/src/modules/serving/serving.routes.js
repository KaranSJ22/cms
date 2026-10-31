import { Router } from "express";
import * as ServingController from "./serving.controller.js";

const router = Router();

// 1. Shift & Operator Session
router.post("/login", ServingController.staffLoginController);

// 2. Pre-Booked Order Serving
router.get("/resolve/:identifier", ServingController.resolveServingController);
router.post("/serve", ServingController.serveBookingController);
router.post("/cancel", ServingController.cancelCounterBookingController);

// 3. On-Spot Surplus Food (Walk-In)
router.get("/walkin/customer", ServingController.lookupWalkinCustomerController);
router.get("/walkin/menu", ServingController.getWalkinMenuController);
router.post("/walkin/serve", ServingController.serveWalkinController);

// 4. Canteen Facility & Slot Discovery
router.get("/canteens", ServingController.getActiveCanteensController);
router.get("/today-slots", ServingController.getTodaySlotsController);

export default router;
