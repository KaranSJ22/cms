import { z } from "zod";

export const addHolidaySchema = z.object({
  body: z.object({
    PHOLIDAYDATE: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    PHOLIDAYNAME: z.string().trim().min(1).max(100),
    PHOLIDAYTYPE: z.string().trim().max(20).default("NATIONAL"),
    PISRECURRING: z.number().int().min(0).max(1).default(0),
  }),
});

export const updateHolidaySchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Holiday ID must be a positive integer"),
  }),
  body: z.object({
    PHOLIDAYDATE: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    PHOLIDAYNAME: z.string().trim().min(1).max(100),
    PHOLIDAYTYPE: z.string().trim().max(20).default("NATIONAL"),
    PISRECURRING: z.number().int().min(0).max(1).default(0),
    PSTATUSCODE: z.enum(["ACT", "DIS"]).default("ACT"),
  }),
});

export const getHolidaySchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Holiday ID must be a positive integer"),
  }),
});

export const listHolidaysSchema = z.object({
  query: z.object({
    year: z.coerce.number().int().positive().optional(),
  }),
});
