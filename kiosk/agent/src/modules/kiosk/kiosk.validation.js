import { z } from "zod";

export const scanSelfServiceSchema = z.object({
  body: z.object({
    PIDENTIFIER: z.string().min(1, "Identifier (RFID UID or Login ID) is required"),
  }),
});

export const nextDayServicesSchema = z.object({
  query: z.object({
    canteenId: z.coerce.number().optional(),
  }),
});

export const nextDayMenuSchema = z.object({
  query: z.object({
    canteenId: z.coerce.number().optional(),
    serviceId: z.coerce.number().optional(),
  }),
});
