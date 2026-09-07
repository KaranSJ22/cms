import { z } from "zod";

export const addMenuTemplateSchema = z.object({
  body: z.object({
    PCANTEENID: z.number().int().positive(),
    PSERVICEID: z.number().int().positive(),
    PTPLNAME: z.string().trim().min(1).max(80),
    PWEEKDAY: z.number().int().min(1).max(7),
  }),
});

export const updateMenuTemplateSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Template ID must be a positive integer"),
  }),
  body: z.object({
    PTPLNAME: z.string().trim().min(1).max(80),
    PWEEKDAY: z.number().int().min(1).max(7),
    PSTATUSCODE: z.enum(["ACT", "DIS"]).default("ACT"),
  }),
});

export const getMenuTemplateSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Template ID must be a positive integer"),
  }),
});

export const listMenuTemplatesSchema = z.object({
  query: z.object({
    canteenId: z.coerce.number().int().positive().optional(),
    serviceId: z.coerce.number().int().positive().optional(),
  }),
});

export const addMenuTemplateDtSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Template ID must be a positive integer"),
  }),
  body: z.object({
    PMENUITEMID: z.number().int().positive(),
    PISSPECIAL: z.number().int().min(0).max(1).default(0),
    PISPREBOOK: z.number().int().min(0).max(1).default(0),
    PISKIOSK: z.number().int().min(0).max(1).default(0),
    PMAXQTY: z.number().int().min(0).default(0),
    PDEFAVAILQTY: z.number().int().min(0).default(0),
  }),
});

export const removeMenuTemplateDtSchema = z.object({
  params: z.object({
    dtId: z.string().regex(/^\d+$/, "Template Detail ID must be a positive integer"),
  }),
});

export const bulkGenerateMenuSchema = z.object({
  body: z.object({
    PCANTEENID: z.number().int().positive(),
    PSERVICEID: z.number().int().positive(),
    PSTARTDATE: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    PENDDATE: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  }),
});

export const generateDraftSchema = z.object({
  query: z.object({
    canteenId: z.coerce.number().int().positive().optional(),
    serviceId: z.coerce.number().int().positive(),
    count: z.coerce.number().int().min(1).max(30).optional(),
  }),
});
