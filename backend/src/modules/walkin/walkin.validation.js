import { z } from "zod";

export const walkinValidation = {
    // GET /api/walkin/employee-lookup?query=...
    employee: z.object({
        query: z.object({
            query: z.string().trim().min(1, "Search query is required"),
        })
    }),
    // GET /api/walkin/visitor-lookup?query=...
    visitorLookup: z.object({
        query: z.object({
            query: z.string().trim().min(1, "Search query is required"),
        }),
    }),
    // POST /api/walkin/register-visitor
    registerVisitor: z.object({
        body: z.object({
            VISNAME: z.string().trim().min(2, "Visitor Name is required").max(120),
            VISMOBILE: z
                .string()
                .trim()
                .regex(/^[6-9][0-9]{9}$/, "Invalid 10-digit mobile number"),
            VISORG: z.string().trim().max(150).optional().nullable(),
            VISPURPOSE: z.string().trim().max(255).optional().nullable(),
            KEYVALUE: z.string().trim().max(255).optional().nullable(), // Optional RFID / Pass
        }),
    }),
    // GET /api/walkin/active-menu?canteenId=...&ctypeCode=...
    activeMenu: z.object({
        query: z.object({
            canteenId: z.coerce.number().int().positive("Valid canteenId is required"),
            ctypeCode: z.enum(["PRM", "CNT", "VIS", "OCE", "OFF"]).default("PRM"),
        }),
    }),
    // POST /api/walkin/serve
    serveWalkin: z.object({
        body: z.object({
            customerId: z.coerce.number().int().positive("Customer ID is required"),
            canteenId: z.coerce.number().int().positive("Canteen ID is required"),
            serviceId: z.coerce.number().int().positive("Service ID is required"),
            items: z
                .array(
                    z.object({
                        dayMenuId: z.coerce.number().int().positive("DayMenu ID is required"),
                        qty: z.coerce.number().int().positive().default(1),
                    })
                )
                .min(1, "At least one item is required"),
        }),
    }),

}

