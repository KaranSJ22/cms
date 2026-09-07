import { z } from "zod";

export const createUserSchema = z.object({
  body: z
    .object({
      LOGINID: z
        .string()
        .trim()
        .min(3, "LOGINID must be at least 3 characters")
        .max(50, "LOGINID must be at most 50 characters")
        .regex(/^[A-Za-z0-9@._-]+$/, "LOGINID contains invalid characters"),

      FULLNAME: z.string().trim().min(2).max(120),

      EMAIL: z.string().trim().email().max(120).nullable().optional(),

      MOBILENO: z
        .string()
        .trim()
        .regex(/^[6-9][0-9]{9}$/, "Invalid mobile number")
        .nullable()
        .optional(),

      PASSWORD: z.string().min(8).max(72),

      AUTHPROV: z.enum(["LOCAL", "SSO"]).default("LOCAL"),

      AUTHID: z.string().trim().max(120).nullable().optional(),
    })
    ,
});

export const assignUserRoleSchema = z.object({
  body: z
    .object({
      USERID: z.coerce.number().int().positive(),
      ROLEID: z.coerce.number().int().positive(),
      VALIDFROM: z.string().datetime().nullable().optional(),
      VALIDUNTIL: z.string().datetime().nullable().optional(),
    })
    ,
});


export const createCustomerSchema = z.object({
  body: z
    .object({
      USERID: z.coerce.number().int().positive().nullable().optional(),

      CTYPECODE: z.enum([
        "PRM",
        "CNT",
        "VIS",
        "OCE",
        "OFR",
      ]),

      DISPNAME: z.string().trim().min(2).max(120),

      STATUS: z.enum(["ACT", "DIS"]).default("ACT"),

      VALIDFROM: z.string().datetime().nullable().optional(),

      VALIDUNTIL: z.string().datetime().nullable().optional(),
    })
    ,
});

export const createPermanentEmployeeSchema = z.object({
  body: z
    .object({
      CUSTOMERID: z.coerce.number().int().positive(),

      EMPCODE: z
        .string()
        .trim()
        .min(2, "Employee code is required")
        .max(50),

      DEPT: z
        .string()
        .trim()
        .min(2, "Department is required")
        .max(100),

      DESIG: z
        .string()
        .trim()
        .min(2, "Designation is required")
        .max(100),
    })
    ,
});