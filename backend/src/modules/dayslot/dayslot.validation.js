import { z } from "zod";

const timeSchema = z
  .string()
  .trim()
  .regex(/^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Invalid time format");

const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format");

export const daySlotIdSchema = z.object({
  params: z
    .object({
      id: z.coerce.number().int().positive(),
    })
    .strict(),
});

export const createDaySlotSchema = z.object({
  body: z
    .object({
      CANTEENID: z.coerce.number().int().positive(),
      SERVICEID: z.coerce.number().int().positive(),
      SERVDATE: dateSchema,
      STARTTIME: timeSchema,
      ENDTIME: timeSchema,
    })
    .strict(),
});

export const updateDaySlotSchema = z.object({
  params: z
    .object({
      id: z.coerce.number().int().positive(),
    })
    .strict(),
  body: z
    .object({
      STARTTIME: timeSchema,
      ENDTIME: timeSchema,
      STATUS: z.string().trim().min(1).max(20),
      CHGREASON: z.string().trim().max(255).nullable().optional(),
    })
    .strict(),
});
