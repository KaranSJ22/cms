import { z } from "zod";

export const scanSelfServiceSchema = z.object({
  body: z.object({
    PIDENTIFIER: z.string().min(1, "Identifier (RFID UID or Login ID) is required"),
    PCANTEENID: z.coerce.number().int().positive().optional(),
    PSERVICEID: z.coerce.number().int().positive().optional(),
  }),
});

export const kioskNextDayServicesSchema = z.object({
  query: z.object({
    canteenId: z.coerce.number().int().positive().optional(),
  }),
});

export const kioskNextDayMenuSchema = z.object({
  query: z.object({
    canteenId: z.coerce.number().int().positive().optional(),
    serviceId: z.coerce.number().int().positive().optional(),
  }),
});

export const kioskBookSchema = z.object({
  body: z.object({
    CUSTOMERID: z.coerce.number().int().positive("Customer ID is required"),
    SERVICEID: z.coerce.number().int().positive("Service ID is required"),
    SERVICEDATE: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Service date must be in YYYY-MM-DD format"),
    ITEMS: z.array(
      z.object({
        DAYMENUID: z.coerce.number().int().positive().optional(),
        dayMenuId: z.coerce.number().int().positive().optional(),
        MENUITEMID: z.coerce.number().int().positive().optional(),
        menuItemId: z.coerce.number().int().positive().optional(),
        QTY: z.coerce.number().int().min(1).max(10).optional(),
        qty: z.coerce.number().int().min(1).max(10).optional(),
      })
    ).min(1, "At least one menu item is required"),
    OFFLINEUUID: z.string().optional(),
    offlineUuid: z.string().optional(),
    KIOSKCODE: z.string().optional(),
    kioskCode: z.string().optional(),
    CANTEENID: z.coerce.number().int().positive().optional(),
    canteenId: z.coerce.number().int().positive().optional(),
  }),
});
export const kioskUpdateBookingSchema = z.object({
  body: z.object({
    BOOKINGID: z.coerce.number().int().positive("Booking ID is required"),
    CUSTOMERID: z.coerce.number().int().positive("Customer ID is required"),
    ITEMS: z.array(
      z.object({
        DAYMENUID: z.coerce.number().int().positive().optional(),
        dayMenuId: z.coerce.number().int().positive().optional(),
        MENUITEMID: z.coerce.number().int().positive().optional(),
        menuItemId: z.coerce.number().int().positive().optional(),
        QTY: z.coerce.number().int().min(1).max(10).optional(),
        qty: z.coerce.number().int().min(1).max(10).optional(),
      })
    ).min(1, "At least one item is required"),
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

// Hardware Kiosk Fleet Schemas (SYSADM)
export const listKioskDevicesSchema = z.object({
  query: z.object({
    canteenId: z.coerce.number().int().positive().optional(),
  }),
});

export const registerKioskDeviceSchema = z.object({
  body: z.object({
    DEVICECODE: z.string().trim().min(3).max(30),
    DEVICENAME: z.string().trim().min(2).max(100),
    IPADDRESS: z.string().trim().min(7).max(45),
    MACADDRESS: z.string().trim().max(17).nullable().optional(),
    CANTEENID: z.coerce.number().int().positive(),
    KIOSKTYPE: z.enum(["STAFF_COUNTER", "EMP_SELF_SERVICE"], {
      errorMap: () => ({ message: "Invalid Kiosk Type. Must be STAFF_COUNTER or EMP_SELF_SERVICE" }),
    }),
  }),
});

export const kioskIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Invalid Kiosk ID"),
  }),
});

export const updateKioskStatusSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Invalid Kiosk ID"),
  }),
  body: z.object({
    STATUSID: z.coerce.number().int().refine((val) => [10, 11].includes(val), {
      message: "Status ID must be 10 (ACT) or 11 (DIS)",
    }),
  }),
});
