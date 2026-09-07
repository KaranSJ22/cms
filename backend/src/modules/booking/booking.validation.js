import dayjs from "dayjs";
import { z } from "zod";

export const getKitchenPrepSchema = z.object({
  query: z.object({
    daySlotId: z.coerce.number().int().positive("Day Slot ID must be a positive integer"),
  }),
});

export const getActiveBookingSchema = z.object({
  query: z.object({
    canteenId: z.coerce.number().int().positive("Canteen ID must be a positive integer"),
    serviceId: z.coerce.number().int().positive("Service ID must be a positive integer"),
    serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    customerId: z.coerce.number().int().positive().optional(),
  }),
});

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
  }),
}).superRefine((data, ctx) => {
  if (data.body.PBOOKTYPECODE === "KS") {
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

export const addBookingItemSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Booking ID must be a positive integer"),
  }),
  body: z.object({
    DAYMENUID: z.number().int().positive("Day Menu ID must be a positive integer"),
    QTY: z.number().int().positive("Quantity must be a positive integer"),
  }),
});

export const updateBookingItemSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Booking ID must be a positive integer"),
    itemId: z.string().regex(/^\d+$/, "Booking Item ID must be a positive integer"),
  }),
  body: z.object({
    QTY: z.number().int().positive("Quantity must be a positive integer").optional(),
    PQTY: z.number().int().positive("Quantity must be a positive integer").optional(),
    PSTATUS: z.enum(["CRT", "SRV", "CAN", "NOS"]).optional(),
    PCHGREASON: z.string().max(255).optional().nullable(),
  }),
}).refine((data) => data.body.QTY !== undefined || data.body.PQTY !== undefined, {
  message: "Quantity (QTY or PQTY) is required",
  path: ["body", "QTY"],
});

export const cancelBookingItemSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Booking ID must be a positive integer"),
    itemId: z.string().regex(/^\d+$/, "Booking Item ID must be a positive integer"),
  }),
  body: z.object({
    PCANCELREASON: z.string().max(255).optional().nullable(),
  }).optional().default({}),
});

export const cancelBookingSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Booking ID must be a positive integer"),
  }),
  body: z.object({
    PCANCELREASON: z.string().max(255).optional().nullable(),
  }).optional().default({}),
});

export const serveBookingSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Booking ID must be a positive integer"),
  }),
  body: z.object({
    PSERVEREASON: z.string().max(255).optional().nullable(),
  }).optional().default({}),
});

export const noShowBookingSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Booking ID must be a positive integer"),
  }),
  body: z.object({
    PCHGREASON: z.string().max(255).optional().nullable(),
  }).optional().default({}),
});

export const toggleKioskSchema = z.object({
  params: z.object({
    dayMenuId: z.string().regex(/^\d+$/, "Day Menu ID must be a positive integer"),
  }),
  body: z.object({
    PISKIOSK: z.number().int().min(0).max(1),
  }),
});

export const scanRfidSchema = z.object({
  body: z.object({
    PRFIDHASH: z.string().min(1, "RFID hash is required"),
    PSERVICEID: z.number().int().positive("Service ID must be positive"),
  }),
});
