import { z } from "zod";

export const walletValidation = {
  createWallet: z.object({
    body: z.object({
      customerId: z.number().int().positive(),
      openAmount: z.coerce.number().min(0).default(0),
      remarks: z.string().max(500).optional().nullable(),
    }),
  }),

  topupWallet: z.object({
    body: z.object({
      customerId: z.number().int().positive(),
      amount: z.coerce.number().min(100, "Top-up amount must be at least 100"),
      paymentMethod: z.literal("CASH").default("CASH"),
      refNo: z.string().max(80).optional().nullable(),
      remarks: z.string().max(500).optional().nullable(),
    }),
  }),

  fetchWallet: z.object({
    params: z.object({
      customerId: z.coerce.number().int().positive(),
    }),
  }),

  fetchTransactions: z.object({
    params: z.object({
      customerId: z.coerce.number().int().positive(),
    }),
    query: z.object({
      fromDate: z.string().optional(), // Could add regex for date
      toDate: z.string().optional(),
    }).optional(),
  }),

  requestWithdrawal: z.object({
    body: z.object({
      customerId: z.number().int().positive(),
      amount: z.number().positive(),
      remarks: z.string().max(500).optional().nullable(),
    }),
  }),

  approveWithdrawal: z.object({
    params: z.object({
      walletWdId: z.coerce.number().int().positive(),
    }),
    body: z
      .object({
        paymentMethod: z.literal("CASH").optional().default("CASH"),
        refNo: z.string().max(80).optional().nullable(),
        remarks: z.string().max(500).optional().nullable(),
      })
      .optional()
      .default({ paymentMethod: "CASH" }),
  }),

  rejectWithdrawal: z.object({
    params: z.object({
      walletWdId: z.coerce.number().int().positive(),
    }),
    body: z.object({
      remarks: z.string().max(500).optional().nullable(),
    }),
  }),

  fetchWithdrawals: z.object({
    body: z.object({}).optional(),
    params: z.object({}).optional(),
    query: z.object({
      customerId: z.coerce.number().int().positive().optional(),
      status: z.enum(["REQ", "COM", "REJ", "CAN"]).optional(),
    }).optional(),
  }),
};
