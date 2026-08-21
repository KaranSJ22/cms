import { z } from "zod";

export const walletValidation = {
  createWallet: z.object({
    body: z.object({
      customerId: z.number().int().positive(),
      openAmount: z.number().min(100),
      remarks: z.string().max(500).optional().nullable(),
    }),
  }),

  topupWallet: z.object({
    body: z.object({
      customerId: z.number().int().positive(),
      amount: z.number().positive(),
      paymentMethod: z.literal("CASH"),
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
    body: z.object({
      paymentMethod: z.literal("CASH"),
      refNo: z.string().max(80).optional().nullable(),
      remarks: z.string().max(500).optional().nullable(),
    }),
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
    query: z.object({
      customerId: z.coerce.number().int().positive().optional(),
      status: z.enum(["REQ", "COM", "REJ", "CAN"]).optional(),
    }).optional(),
  }),
};
