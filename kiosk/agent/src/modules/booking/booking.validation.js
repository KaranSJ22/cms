import { z } from "zod";

export const bookNextDaySchema = z.object({
  body: z.object({
    CUSTOMERID: z.coerce.number().positive("Customer ID is required"),
    SERVICEID: z.coerce.number().positive("Service ID is required"),
    SERVICEDATE: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Service date must be in YYYY-MM-DD format"),
    ITEMS: z
      .array(
        z.object({
          dayMenuId: z.coerce.number().optional(),
          DAYMENUID: z.coerce.number().optional(),
          menuItemId: z.coerce.number().optional(),
          MENUITEMID: z.coerce.number().optional(),
          qty: z.coerce.number().optional(),
          QTY: z.coerce.number().optional(),
        })
      )
      .min(1, "At least one dish must be selected"),
  }),
});

export const cancelBookingSchema = z.object({
  body: z.object({
    BOOKINGID: z.string().min(1, "Booking reference is required"),
    CUSTOMERID: z.coerce.number().positive("Customer ID is required"),
    CANCELREASON: z.string().optional(),
  }),
});
