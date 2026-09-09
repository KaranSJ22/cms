import express from "express";

import { validate } from "../../middlewares/validate.middleware.js";
import { loginSchema, ssoLoginSchema } from "./auth.validation.js";
import { login, ssoLogin } from "./auth.controller.js";

const router = express.Router();

router.post("/login", validate(loginSchema), login);
router.post("/sso", validate(ssoLoginSchema), ssoLogin);

export default router;