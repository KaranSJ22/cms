import { z } from "zod";

const dateTimeSchema = z
  .string()
  .trim()
  .datetime();

const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format");

const booleanFlagSchema = z.coerce
  .number()
  .int()
  .refine((value) => value === 0 || value === 1, "Invalid boolean value");

export const dayMenuIdSchema = z.object({
  params: z
    .object({
      id: z.coerce.number().int().positive(),
    })
    .strict(),
});

export const createDayMenuSchema = z.object({
  body: z
    .object({
      DAYSLOTID: z.coerce.number().int().positive(),
      MENUITEMID: z.coerce.number().int().positive(),
      ISSPECIAL: booleanFlagSchema.optional(),
      ISPREBOOK: booleanFlagSchema.optional(),
      ISKIOSK: booleanFlagSchema.optional(),
      AVAILQTY: z.coerce.number().int(),
      MAXQTY: z.coerce.number().int(),
      BOOKUNTIL: dateTimeSchema,
      CANCELUNTIL: dateTimeSchema,
      REMARKS: z.string().trim().max(255).nullable().optional(),
    })
    .strict(),
});

export const approveDayMenuSchema = z.object({
  params: z
    .object({
      id: z.coerce.number().int().positive(),
    })
    .strict(),
  body: z
    .object({
      REMARKS: z.string().trim().max(255).nullable().optional(),
    })
    .strict(),
});

export const publishedMenuSchema = z.object({
  query: z
    .object({
      canteenId: z.coerce.number().int().positive(),
      serviceDate: dateSchema,
    })
    .strict(),
});

export const getDayMenusSchema = z.object({
  query: z
    .object({
      CANTEENID: z.coerce.number().int().positive().optional(),
      SERVICEID: z.coerce.number().int().positive().optional(),
      DAYSLOTID: z.coerce.number().int().positive().optional(),
      SERVDATE: dateSchema.optional(),
      APPRSTATUS: z.string().trim().max(20).optional(),
    })
    .strict(),
});
