import dayjs from "dayjs";
import { z } from "zod";

export const createBookingSchema = z.object({
  body: z.object({
    PBOOKTYPECODE: z.enum(["PB", "KS"]),
    PCUSTOMERID: z.number().int().positive(),
    PSERVICEID: z.number().int().positive(),
    PSERVICEDATE: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    PITEMSJSON: z
      .array(
        z.object({
          DAYMENUID: z.number().int().positive(),
          QTY: z.number().int().positive(),
        })
      )
      .min(1, "At least one booking item is required"),
    PREMARKS: z.string().max(255).optional().nullable(),
  }).strict(),
}).superRefine((data, ctx) => {
  if (data.body.PBOOKTYPECODE === "KS") {
    // Exact next day logic or future day logic
    const today = dayjs().format("YYYY-MM-DD");
    if (data.body.PSERVICEDATE <= today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Kiosk bookings are only allowed for pre-booking next day or later.",
        path: ["body", "PSERVICEDATE"],
      });
    }
  }
});

export const updateBookingItemSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Booking ID must be a positive integer"),
    itemId: z.string().regex(/^\d+$/, "Booking Item ID must be a positive integer"),
  }),
  body: z.object({
    PQTY: z.number().int().positive(),
    PSTATUS: z.enum(["CR", "SRV", "CAN", "NOS"]),
    PCHGREASON: z.string().max(255).optional().nullable(),
  }).strict(),
});

export const cancelBookingSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Booking ID must be a positive integer"),
  }),
  body: z.object({
    PCANCELREASON: z.string().max(255).optional().nullable(),
  }).strict(),
});

export const serveBookingSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Booking ID must be a positive integer"),
  }),
  body: z.object({
    PSERVEREASON: z.string().max(255).optional().nullable(),
  }).strict(),
});

export const noShowBookingSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Booking ID must be a positive integer"),
  }),
  body: z.object({
    PCHGREASON: z.string().max(255).optional().nullable(),
  }).strict(),
});

export const toggleKioskSchema = z.object({
  params: z.object({
    dayMenuId: z.string().regex(/^\d+$/, "Day Menu ID must be a positive integer"),
  }),
  body: z.object({
    PISKIOSK: z.number().int().min(0).max(1),
  }).strict(),
});
