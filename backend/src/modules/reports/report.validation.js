import { z } from "zod";

export const getKitchenSummarySchema = z.object({
  query: z.object({
    daySlotId: z.coerce.number().int().positive("Day Slot ID must be a positive integer"),
  }),
});
