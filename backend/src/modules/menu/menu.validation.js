import { z } from "zod";

const priceSchema = z.coerce.number();

export const menuIdSchema = z.object({
  params: z
    .object({
      id: z.coerce.number().int().positive(),
    })
    .strict(),
});

export const createMenuSchema = z.object({
  body: z
    .object({
      MENUCODE: z.string().trim().min(1).max(20),
      SHORTNAME: z.string().trim().min(1).max(30),
      ITEMNAME: z.string().trim().min(1).max(100),
      ITEMDESCR: z.string().trim().max(255).nullable().optional(),
      ISSPECIAL: z.coerce.number().int().optional(),
    })
    .strict(),
});

export const updateMenuSchema = z.object({
  params: z
    .object({
      id: z.coerce.number().int().positive(),
    })
    .strict(),
  body: z
    .object({
      SHORTNAME: z.string().trim().min(1).max(30),
      ITEMNAME: z.string().trim().min(1).max(100),
      ITEMDESCR: z.string().trim().max(255).nullable().optional(),
      ISSPECIAL: z.coerce.number().int().optional(),
      STATUS: z.string().trim().min(1).max(20),
      CHGREASON: z.string().trim().max(255).nullable().optional(),
    })
    .strict(),
});
