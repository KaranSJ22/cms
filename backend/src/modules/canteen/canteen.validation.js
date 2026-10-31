import { z } from "zod";

export const getCanteensSchema = z.object({
  query: z.object({
    CENTERID: z.coerce.number().int().positive().optional(),
    centerId: z.coerce.number().int().positive().optional(),
  }),
});

export const canteenIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Invalid Canteen ID"),
  }),
});

export const createCanteenSchema = z.object({
  body: z.object({
    CENTERID: z.coerce.number().int().positive("Center ID is required"),
    CANTEENCODE: z.string().trim().min(2, "Canteen code is required").max(20),
    CANTEENNAME: z.string().trim().min(2, "Canteen name is required").max(120),
    LOCATION: z.string().trim().max(150).nullable().optional(),
  }),
});

export const updateCanteenSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Invalid Canteen ID"),
  }),
  body: z.object({
    CANTEENNAME: z.string().trim().min(2, "Canteen name is required").max(120),
    LOCATION: z.string().trim().max(150).nullable().optional(),
    STATUSCODE: z.enum(["ACT", "DIS"]).optional().default("ACT"),
  }),
});

export const createCenterSchema = z.object({
  body: z.object({
    CENTERCODE: z.string().trim().min(2, "Center code is required").max(20),
    CENTERNAME: z.string().trim().min(2, "Center name is required").max(120),
    LOCATION: z.string().trim().max(150).nullable().optional(),
  }),
});

