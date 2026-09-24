import express from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { getCanteensSchema } from "./canteen.validation.js";
import { getCanteens } from "./canteen.controller.js";

const router = express.Router();

router.get("/", authenticate, validate(getCanteensSchema), getCanteens);

export default router;
