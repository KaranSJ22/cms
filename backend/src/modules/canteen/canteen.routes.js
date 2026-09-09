import express from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { getCanteens } from "./canteen.controller.js";

const router = express.Router();

router.get("/", authenticate, getCanteens);

export default router;
