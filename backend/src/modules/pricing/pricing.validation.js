import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");
const idSchema = z.coerce.number().int().positive();

const menuItemParams = z.object({
  menuItemId: idSchema,
});

export const createItemPriceSchema = z.object({
  params: menuItemParams,
  body: z
    .object({
      EFFFROM: dateSchema,
      PRICES: z
        .array(
          z
            .object({
              CTYPECODE: z.enum(["PRM", "CNT", "VIS", "OCE", "OFR"]),
              PRICE: z.coerce.number().nonnegative(),
            })
            .strict()
        )
        .min(1)
        .refine(
          (prices) => new Set(prices.map((price) => price.CTYPECODE)).size === prices.length,
          "Customer types must be unique"
        ),
    })
    .strict(),
});

export const itemPriceHistorySchema = z.object({
  params: menuItemParams,
});

export const effectiveItemPricesSchema = z.object({
  params: menuItemParams,
  query: z.object({ serviceDate: dateSchema }).strict(),
});

export const effectiveItemPriceSchema = z.object({
  params: z.object({
    menuItemId: idSchema,
    customerTypeCode: z.enum(["PRM", "CNT", "VIS", "OCE", "OFR"]),
  }),
  query: z.object({ serviceDate: dateSchema }).strict(),
});

export const itemPriceIdSchema = z.object({
  params: z.object({ itemPriceId: idSchema }),
});
