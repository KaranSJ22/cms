import express from "express";

import { validate } from "../../middlwares/validate.middleware.js";
import { loginSchema } from "./auth.validation.js";
import { login } from "./auth.controller.js";

const router = express.Router();

router.post("/login", validate(loginSchema), login);

export default router;