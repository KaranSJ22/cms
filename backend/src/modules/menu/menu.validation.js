import { z } from "zod";

const priceSchema = z.coerce.number();

export const menuIdSchema = z.object({
  params: z
    .object({
      id: z.coerce.number().int().positive(),
    })
    ,
});

export const priceReadinessSchema = z.object({
  params: z
    .object({
      id: z.coerce.number().int().positive(),
    })
    ,
  query: z
    .object({
      serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional(),
    })
    ,
});

export const createMenuSchema = z.object({
  body: z
    .object({
      MENUCODE: z.string().trim().min(1).max(20).optional(),
      SHORTNAME: z.string().trim().min(1).max(30),
      ITEMNAME: z.string().trim().min(1).max(100),
      ITEMDESCR: z.string().trim().max(255).nullable().optional(),
      ISSPECIAL: z.coerce.number().int().optional(),
      SERVICEID: z.coerce.number().int().positive().nullable().optional(),
      PRICING: z
        .object({
          EFFFROM: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
            .optional(),
          PRICES: z
            .array(
              z.object({
                CTYPECODE: z.string().min(1),
                PRICE: z.coerce.number().nonnegative(),
              })
            )
            .min(1),
        })
        .optional(),
    }),
});

export const updateMenuSchema = z.object({
  params: z
    .object({
      id: z.coerce.number().int().positive(),
    }),
  body: z
    .object({
      SHORTNAME: z.string().trim().min(1).max(30),
      ITEMNAME: z.string().trim().min(1).max(100),
      ITEMDESCR: z.string().trim().max(255).nullable().optional(),
      ISSPECIAL: z.coerce.number().int().optional(),
      SERVICEID: z.coerce.number().int().positive().nullable().optional(),
      STATUS: z.enum(["ACT", "DIS"]).default("ACT"),
      CHGREASON: z.string().trim().max(255).nullable().optional(),
    }),
});
