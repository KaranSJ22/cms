import express from "express";

import { validate } from "../../middlewares/validate.middleware.js";
import { loginSchema, ssoLoginSchema, rfidLoginSchema } from "./auth.validation.js";
import { login, ssoLogin, rfidLogin } from "./auth.controller.js";

const router = express.Router();

router.post("/login", validate(loginSchema), login);
router.post("/sso", validate(ssoLoginSchema), ssoLogin);
router.post("/rfid", validate(rfidLoginSchema), rfidLogin);

export default router;