import { z } from "zod";

const timeSchema = z
  .string()
  .trim()
  .regex(/^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Invalid time format");

const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
  .nullable()
  .optional();

export const serviceIdSchema = z.object({
  params: z
    .object({
      id: z.coerce.number().int().positive(),
    })
    ,
});

export const createServiceSchema = z.object({
  body: z
    .object({
      SERVCODE: z.string().trim().min(1).max(20).optional(),
      SERVNAME: z.string().trim().min(1).max(80),
      DEFSTART: timeSchema,
      DEFEND: timeSchema,
    }),
});

export const updateServiceSchema = z.object({
  params: z
    .object({
      id: z.coerce.number().int().positive(),
    })
    ,
  body: z
    .object({
      SERVNAME: z.string().trim().min(1).max(80),
      DEFSTART: timeSchema,
      DEFEND: timeSchema,
      STATUS: z.enum(["ACT", "DIS"]).default("ACT"),
      CHGREASON: z.string().trim().max(255).nullable().optional(),
    }),
});
