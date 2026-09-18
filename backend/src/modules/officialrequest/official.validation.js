import { z } from "zod";

export const idParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Invalid ID"),
  }),
});

export const listServicesQuerySchema = z.object({
  query: z.object({
    canteenId: z.coerce.number().int().positive("Canteen ID is required"),
    statusId: z.coerce.number().int().optional(),
  }),
});

export const createServiceSchema = z.object({
  body: z.object({
    CANTEENID: z.coerce.number().int().positive("Canteen ID is required"),
    SERVNAME: z.string().trim().min(2, "Service name must be at least 2 characters").max(100),
    DESCR: z.string().trim().max(500).optional().nullable(),
    CUTOFFHOURS: z.coerce.number().int().min(1, "Cutoff must be at least 1 hour").default(24),
    REQAPPRLVL: z.enum(["L1", "L2"], {
      errorMap: () => ({ message: "Required approval level must be L1 or L2" }),
    }).default("L1"),
  }),
});

export const updateServiceSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Invalid Service ID"),
  }),
  body: z.object({
    SERVNAME: z.string().trim().min(2).max(100).optional(),
    DESCR: z.string().trim().max(500).optional().nullable(),
    CUTOFFHOURS: z.coerce.number().int().min(1).optional(),
    REQAPPRLVL: z.enum(["L1", "L2"]).optional(),
    STATUSID: z.coerce.number().int().optional(),
  }),
});

export const createComboSchema = z.object({
  body: z.object({
    OFFSERVID: z.coerce.number().int().positive("Official Service ID is required"),
    COMBONAME: z.string().trim().min(2, "Combo name must be at least 2 characters").max(100),
    DESCR: z.string().trim().max(255).optional().nullable(),
    GROSSPRICE: z.coerce.number().min(0, "Gross price cannot be negative").optional(),
    HANDLINGCHARGE: z.coerce.number().min(0, "Handling charge cannot be negative").default(0),
    COMBOPRICE: z.coerce.number().min(0, "Combo price cannot be negative"),
    ITEMS: z
      .array(
        z.object({
          MENUITEMID: z.coerce.number().int().positive("Valid menu item ID required"),
          QTY: z.coerce.number().int().min(1, "Quantity must be at least 1").default(1),
        })
      )
      .min(1, "Combo must contain at least one menu item"),
  }),
});

export const updateComboSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Invalid Combo ID"),
  }),
  body: z.object({
    COMBONAME: z.string().trim().min(2).max(100).optional(),
    DESCR: z.string().trim().max(255).optional().nullable(),
    GROSSPRICE: z.coerce.number().min(0).optional(),
    HANDLINGCHARGE: z.coerce.number().min(0).optional(),
    COMBOPRICE: z.coerce.number().min(0).optional(),
    STATUSID: z.coerce.number().int().optional(),
    ITEMS: z
      .array(
        z.object({
          MENUITEMID: z.coerce.number().int().positive(),
          QTY: z.coerce.number().int().min(1).default(1),
        })
      )
      .optional(),
  }),
});

export const createBookingSchema = z.object({
  body: z.object({
    CANTEENID: z.coerce.number().int().positive("Canteen ID is required"),
    OFFSERVID: z.coerce.number().int().positive("Official Service ID is required"),
    OFFCOMBOID: z.coerce.number().int().positive("Combo selection is required"),
    PURPOSE: z.string().trim().min(3, "Purpose must be at least 3 characters").max(255),
    VENUE: z.string().trim().min(2, "Venue must be at least 2 characters").max(255),
    EVENTDATETIME: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Valid event date and time is required",
    }),
    QUANTITY: z.coerce.number().int().min(1, "Quantity must be at least 1"),
    NOOFPEOPLE: z.coerce.number().int().min(1, "Number of people must be at least 1"),
    APPRLVL: z.enum(["L1", "L2"], {
      errorMap: () => ({ message: "Approver level must be L1 or L2" }),
    }),
    APPROVERID: z.coerce.number().int().positive("Approver officer selection is required"),
  }),
});

export const resubmitBookingSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Invalid Booking ID"),
  }),
  body: z.object({
    OFFCOMBOID: z.coerce.number().int().positive().optional(),
    PURPOSE: z.string().trim().min(3).max(255).optional(),
    VENUE: z.string().trim().min(2).max(255).optional(),
    EVENTDATETIME: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Valid event date and time is required",
      })
      .optional(),
    QUANTITY: z.coerce.number().int().min(1).optional(),
    NOOFPEOPLE: z.coerce.number().int().min(1).optional(),
    APPRLVL: z.enum(["L1", "L2"]).optional(),
    APPROVERID: z.coerce.number().int().positive().optional(),
  }),
});

export const approverActionSchema = z
  .object({
    params: z.object({
      id: z.coerce.number().int().positive("Invalid Booking ID"),
    }),
    body: z.object({
      ACTION: z.enum(["APPROVE", "REJECT"], {
        errorMap: () => ({ message: "Action must be APPROVE or REJECT" }),
      }),
      REJREASON: z.string().trim().max(500).optional().nullable(),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.body.ACTION === "REJECT" && (!data.body.REJREASON || data.body.REJREASON.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["body", "REJREASON"],
        message: "Rejection reason is required when rejecting a request",
      });
    }
  });

export const managerActionSchema = z
  .object({
    params: z.object({
      id: z.coerce.number().int().positive("Invalid Booking ID"),
    }),
    body: z.object({
      ACTION: z.enum(["ACCEPT", "REJECT"], {
        errorMap: () => ({ message: "Action must be ACCEPT or REJECT" }),
      }),
      REJREASON: z.string().trim().max(500).optional().nullable(),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.body.ACTION === "REJECT" && (!data.body.REJREASON || data.body.REJREASON.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["body", "REJREASON"],
        message: "Rejection reason is required when rejecting a request",
      });
    }
  });

export const levelMappingSchema = z.object({
  body: z.object({
    EMPLEVEL: z.coerce.number().int().positive("Valid employee level number required"),
    APPRLVL: z.enum(["L1", "L2"], {
      errorMap: () => ({ message: "Classification must be L1 or L2" }),
    }),
    ISACTIVE: z.coerce.number().int().min(0).max(1).default(1),
  }),
});

export const kitchenConfirmedQuerySchema = z.object({
  query: z.object({
    canteenId: z.coerce.number().int().positive("Canteen ID is required"),
    date: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
});

export const kitchenPrepSummaryQuerySchema = z.object({
  query: z.object({
    canteenId: z.coerce.number().int().positive("Canteen ID is required"),
    date: z.string().min(10, "Date (YYYY-MM-DD) is required"),
  }),
});
