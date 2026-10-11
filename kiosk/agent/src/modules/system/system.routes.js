import { Router } from "express";
import * as SystemController from "./system.controller.js";

const router = Router();

router.get("/health", SystemController.getHealthController);
router.post("/sync/trigger", SystemController.triggerSyncController);

export default router;
