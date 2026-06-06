import { z } from "zod";

export const loginSchema = z.object({
  body: z
    .object({
      LOGINID: z.string().trim().min(3).max(50),
      PASSWORD: z.string().min(1).max(72),
    })
    .strict(),
});