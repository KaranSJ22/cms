import { z } from "zod";

export const scanSelfServiceSchema = z.object({
  body: z.object({
    PIDENTIFIER: z.string().min(1, "Identifier (RFID UID or Login ID) is required"),
    PCANTEENID: z.coerce.number().int().positive().optional(),
    PSERVICEID: z.coerce.number().int().positive().optional(),
  }),
});

export const kioskNextDayMenuSchema = z.object({
  query: z.object({
    canteenId: z.coerce.number().int().positive().optional(),
  }),
});

export const kioskBookSchema = z.object({
  body: z.object({
    CUSTOMERID: z.coerce.number().int().positive("Customer ID is required"),
    SERVICEID: z.coerce.number().int().positive("Service ID is required"),
    SERVICEDATE: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Service date must be in YYYY-MM-DD format"),
    ITEMS: z.array(
      z.object({
        DAYMENUID: z.coerce.number().int().positive(),
        MENUITEMID: z.coerce.number().int().positive(),
        QTY: z.coerce.number().int().min(1).max(10),
      })
    ).min(1, "At least one menu item is required"),
  }),
});

export const kioskCancelSchema = z.object({
  body: z.object({
    BOOKINGID: z.coerce.number().int().positive("Booking ID is required"),
    CUSTOMERID: z.coerce.number().int().positive("Customer ID is required"),
    CANCELREASON: z.string().max(255).optional().default("Cancelled at Self-Service Kiosk"),
  }),
});

export const kioskHeartbeatSchema = z.object({
  body: z.object({
    KIOSKID: z.coerce.number().int().positive("Kiosk ID is required"),
  }),
});
