import { z } from "zod";

export const getKitchenSummarySchema = z.object({
  query: z.object({
    daySlotId: z.coerce.number().int().positive("Day Slot ID must be a positive integer"),
  }),
});

export const getMonthlyPayrollSchema = z.object({
  query: z.object({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    canteenId: z.coerce.number().int().positive().optional(),
    customerType: z.string().trim().optional(),
    loginId: z.string().trim().optional(),
  }),
});

export const getEmployeePayrollBreakdownSchema = z.object({
  params: z.object({
    customerId: z.coerce.number().int().positive("Customer ID is required"),
  }),
  query: z.object({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  }),
});
