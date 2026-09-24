import { z } from "zod";

export const getCanteensSchema = z.object({
  query: z.object({
    CENTERID: z.coerce.number().int().positive().optional(),
    centerId: z.coerce.number().int().positive().optional(),
  }),
});
