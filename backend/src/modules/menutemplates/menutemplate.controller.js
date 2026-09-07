import { sendSuccess } from "../../utils/apiResponse.js";
import * as MenuTemplateService from "./menutemplate.service.js";

export const addMenuTemplate = async (req, res, next) => {
  try {
    const data = { ...req.body, PCREATEDBY: req.user.USERID };
    const result = await MenuTemplateService.addMenuTemplate(data);
    sendSuccess(res, result, "Menu Template created successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const updateMenuTemplate = async (req, res, next) => {
  try {
    const data = { ...req.body, PMENUTPLID: parseInt(req.params.id, 10) };
    const result = await MenuTemplateService.updateMenuTemplate(data);
    sendSuccess(res, result, "Menu Template updated successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const getMenuTemplate = async (req, res, next) => {
  try {
    const result = await MenuTemplateService.getMenuTemplate(parseInt(req.params.id, 10));
    sendSuccess(res, result, "Menu Template fetched successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const listMenuTemplates = async (req, res, next) => {
  try {
    const { canteenId, serviceId } = req.query;
    const result = await MenuTemplateService.listMenuTemplates({ PCANTEENID: canteenId, PSERVICEID: serviceId });
    sendSuccess(res, result, "Menu Templates retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const deactivateMenuTemplate = async (req, res, next) => {
  try {
    const result = await MenuTemplateService.deactivateMenuTemplate(parseInt(req.params.id, 10));
    sendSuccess(res, result, "Menu Template deactivated successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const addMenuTemplateDt = async (req, res, next) => {
  try {
    const data = { ...req.body, PMENUTPLID: parseInt(req.params.id, 10) };
    const result = await MenuTemplateService.addMenuTemplateDt(data);
    sendSuccess(res, result, "Menu Template Detail added successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const removeMenuTemplateDt = async (req, res, next) => {
  try {
    const result = await MenuTemplateService.removeMenuTemplateDt(parseInt(req.params.dtId, 10));
    sendSuccess(res, result, "Menu Template Detail removed successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const listMenuTemplateDt = async (req, res, next) => {
  try {
    const result = await MenuTemplateService.listMenuTemplateDt(parseInt(req.params.id, 10));
    sendSuccess(res, result, "Menu Template Details retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
};

export const bulkGenerateMenu = async (req, res, next) => {
  try {
    const data = { ...req.body, PCREATEDBY: req.user.USERID };
    const result = await MenuTemplateService.bulkGenerateMenu(data);
    sendSuccess(res, result, "Menu bulk generation completed", 201);
  } catch (error) {
    next(error);
  }
};

export const generateDraft = async (req, res, next) => {
  try {
    const { canteenId, serviceId, count } = req.query;
    const result = await MenuTemplateService.generateDraft({
      canteenId: canteenId ? parseInt(canteenId, 10) : null,
      serviceId: parseInt(serviceId, 10),
      count: count ? parseInt(count, 10) : undefined,
    });
    sendSuccess(res, result, "Menu Template draft generated successfully", 200);
  } catch (error) {
    next(error);
  }
};
