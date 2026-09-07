import { z } from "zod";

const dateTimeSchema = z
  .string()
  .trim()
  .refine(
    (val) => /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/.test(val),
    { message: "Invalid ISO datetime" }
  );

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
    ,
});

export const replaceDayMenuSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    ITEMSJSON: z.array(
      z.object({
        MENUITEMID: z.coerce.number().int().positive(),
        ISBASE: booleanFlagSchema,
        ISSPECIAL: booleanFlagSchema,
        ISPREBOOK: booleanFlagSchema,
        ISKIOSK: booleanFlagSchema,
        AVAILQTY: z.coerce.number().int().nullable().optional(),
        MAXQTY: z.coerce.number().int(),
        BOOKUNTIL: dateTimeSchema,
        CANCELUNTIL: dateTimeSchema,
        REMARKS: z.string().trim().max(255).nullable().optional(),
      })
    ).min(1, "At least one item is required in the menu"),
  }),
});

export const approveDayMenuSchema = z.object({
  params: z
    .object({
      id: z.coerce.number().int().positive(),
    })
    ,
  body: z
    .object({
      REMARKS: z.string().trim().max(255).nullable().optional(),
    })
    ,
});

export const publishedMenuSchema = z.object({
  query: z
    .object({
      canteenId: z.coerce.number().int().positive(),
      serviceDate: dateSchema,
    })
    ,
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
    ,
});

const timeSchema = z
  .string()
  .trim()
  .regex(/^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Invalid time format (expected HH:MM or HH:MM:SS)");

const bulkMenuItemSchema = z.object({
  MENUITEMID: z.coerce.number().int().positive(),
  ISBASE: booleanFlagSchema,
  ISSPECIAL: booleanFlagSchema,
  ISPREBOOK: booleanFlagSchema,
  ISKIOSK: booleanFlagSchema,
  MAXQTY: z.coerce.number().int().min(1, "MAXQTY must be at least 1"),
  AVAILQTY: z.coerce.number().int().nullable().optional(),
  BOOKUNTIL: dateTimeSchema,
  CANCELUNTIL: dateTimeSchema,
});

const bulkDaySchema = z.object({
  // dayIndex represents Day 0 to Day 4 (Monday to Friday, or up to 6)
  DAYINDEX: z.coerce.number().int().min(0).max(6),
  ITEMS: z.array(bulkMenuItemSchema).min(0), // allow empty = skip that day
});

export const bulkCreateDayMenuSchema = z.object({
  body: z.object({
    CANTEENID:  z.coerce.number().int().positive(),
    SERVICEID:  z.coerce.number().int().positive(),
    STARTDATE:  dateSchema,
    STARTTIME:  timeSchema,
    ENDTIME:    timeSchema,
    // 5 day configs (Monday to Friday). Days with empty ITEMS or holidays are skipped.
    DAYS: z.array(bulkDaySchema).min(1).max(7),
  }),
});
