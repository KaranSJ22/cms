import { z } from "zod";

export const loginSchema = z.object({
  body: z
    .object({
      LOGINID: z.string().trim().min(3).max(50),
      PASSWORD: z.string().min(1).max(72),
    })
    ,
});

export const ssoLoginSchema = z.object({
  body: z
    .object({
      token: z.string().trim().min(5).optional(),
      SSO_TOKEN: z.string().trim().min(5).optional(),
    })
    .refine((data) => data.token || data.SSO_TOKEN, {
      message: "SSO token is required",
    }),
});