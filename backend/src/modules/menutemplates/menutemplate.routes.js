import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorizeAnyCanteenRole } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as MenuTemplateController from "./menutemplate.controller.js";
import * as validation from "./menutemplate.validation.js";

const router = Router();

router.use(authenticate);

const managerOrAssistant = authorizeAnyCanteenRole("CNTMGR", "CNTAST");

// Template Routes
router.post(
  "/",
  managerOrAssistant,
  validate(validation.addMenuTemplateSchema),
  MenuTemplateController.addMenuTemplate
);

router.get(
  "/",
  managerOrAssistant,
  validate(validation.listMenuTemplatesSchema),
  MenuTemplateController.listMenuTemplates
);

router.get(
  "/generate-draft",
  managerOrAssistant,
  validate(validation.generateDraftSchema),
  MenuTemplateController.generateDraft
);

router.get(
  "/:id",
  managerOrAssistant,
  validate(validation.getMenuTemplateSchema),
  MenuTemplateController.getMenuTemplate
);

router.put(
  "/:id",
  managerOrAssistant,
  validate(validation.updateMenuTemplateSchema),
  MenuTemplateController.updateMenuTemplate
);

router.delete(
  "/:id",
  managerOrAssistant,
  validate(validation.getMenuTemplateSchema), // using get schema to validate id param
  MenuTemplateController.deactivateMenuTemplate
);

// Template Details Routes
router.post(
  "/:id/details",
  managerOrAssistant,
  validate(validation.addMenuTemplateDtSchema),
  MenuTemplateController.addMenuTemplateDt
);

router.delete(
  "/details/:dtId",
  managerOrAssistant,
  validate(validation.removeMenuTemplateDtSchema),
  MenuTemplateController.removeMenuTemplateDt
);

router.get(
  "/:id/details",
  managerOrAssistant,
  validate(validation.getMenuTemplateSchema), // using get schema to validate id param
  MenuTemplateController.listMenuTemplateDt
);

// Bulk Generate Route
router.post(
  "/bulk-generate",
  managerOrAssistant,
  validate(validation.bulkGenerateMenuSchema),
  MenuTemplateController.bulkGenerateMenu
);

export default router;
