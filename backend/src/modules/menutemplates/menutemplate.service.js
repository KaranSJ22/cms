import * as MenuTemplateRepository from "./menutemplate.repository.js";
import { BadRequestError, NotFoundError } from "../../common/errors/appError.js";

export const addMenuTemplate = async (data) => {
  const result = await MenuTemplateRepository.addMenuTemplate(data);
  return result;
};

export const updateMenuTemplate = async (data) => {
  const result = await MenuTemplateRepository.updateMenuTemplate(data);
  return result;
};

export const getMenuTemplate = async (id) => {
  const result = await MenuTemplateRepository.getMenuTemplate(id);
  if (!result || !result.HEADER) {
    throw new NotFoundError(`Menu Template with ID ${id} not found.`);
  }
  return result;
};

export const listMenuTemplates = async (filters) => {
  const result = await MenuTemplateRepository.listMenuTemplates(filters);
  return result;
};

export const deactivateMenuTemplate = async (id) => {
  const result = await MenuTemplateRepository.deactivateMenuTemplate(id);
  return result;
};

export const addMenuTemplateDt = async (data) => {
  // Validate template exists and is active
  const tpl = await MenuTemplateRepository.getMenuTemplate(data.PMENUTPLID);
  if (!tpl || !tpl.HEADER) {
    throw new NotFoundError(`Menu Template with ID ${data.PMENUTPLID} not found.`);
  }
  if (tpl.HEADER.STATUSID !== 10) {
    throw new BadRequestError(`Cannot add details to an inactive template.`);
  }
  
  const result = await MenuTemplateRepository.addMenuTemplateDt(data);
  return result;
};

export const removeMenuTemplateDt = async (dtId) => {
  const result = await MenuTemplateRepository.removeMenuTemplateDt(dtId);
  return result;
};

export const listMenuTemplateDt = async (id) => {
  const result = await MenuTemplateRepository.listMenuTemplateDt(id);
  return result;
};

export const bulkGenerateMenu = async (data) => {
  // Add any custom business logic rules before calling the DB proc
  if (new Date(data.PSTARTDATE) > new Date(data.PENDDATE)) {
    throw new BadRequestError("Start date cannot be after end date.");
  }

  const result = await MenuTemplateRepository.bulkGenerateMenu(data);
  return result;
};

export const generateDraft = async ({ canteenId, serviceId, count }) => {
  if (!serviceId) {
    throw new BadRequestError("Service ID is required for generating a template draft.");
  }
  const result = await MenuTemplateRepository.draftMenuTemplate({
    PCANTEENID: canteenId || null,
    PSERVICEID: serviceId,
    PCOUNT: count || 6,
  });
  return result;
};
