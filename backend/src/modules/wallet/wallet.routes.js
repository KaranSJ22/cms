import { Router } from "express";
import { WalletController } from "./wallet.controller.js";
import { walletValidation } from "./wallet.validation.js";
import { validate } from "../../middlwares/validate.middleware.js";
import { authorizeSystemRoles } from "../../middlwares/role.middleware.js";
import { authenticate } from "../../middlwares/auth.middleware.js";

const router = Router();

// Assuming all wallet routes require authentication
router.use(authenticate);

// Create a wallet (Admin/CTNMGR)
router.post(
  "/",
  authorizeSystemRoles("ADMIN", "CTNMNG"),
  validate(walletValidation.createWallet),
  WalletController.createWallet
);

// Top up a wallet (Admin/CTNMGR)
router.post(
  "/topup",
  authorizeSystemRoles("ADMIN", "CTNMNG"),
  validate(walletValidation.topupWallet),
  WalletController.topupWallet
);

// Fetch wallet details
router.get(
  "/customer/:customerId",
  validate(walletValidation.fetchWallet),
  WalletController.fetchWallet
);

// Fetch wallet transactions
router.get(
  "/customer/:customerId/transactions",
  validate(walletValidation.fetchTransactions),
  WalletController.fetchWalletTransactions
);

// Request a withdrawal (User/Customer)
router.post(
  "/withdraw/request",
  validate(walletValidation.requestWithdrawal),
  WalletController.requestWithdrawal
);

// Approve a withdrawal (Admin/CTNMGR)
router.post(
  "/withdraw/:walletWdId/approve",
  authorizeSystemRoles("ADMIN", "CTNMNG"),
  validate(walletValidation.approveWithdrawal),
  WalletController.approveWithdrawal
);

// Reject a withdrawal (Admin/CTNMGR)
router.post(
  "/withdraw/:walletWdId/reject",
  authorizeSystemRoles("ADMIN", "CTNMNG"),
  validate(walletValidation.rejectWithdrawal),
  WalletController.rejectWithdrawal
);

// List withdrawal requests (Admin/CTNMGR)
router.get(
  "/withdraw/requests",
  authorizeSystemRoles("ADMIN", "CTNMNG"),
  validate(walletValidation.fetchWithdrawals),
  WalletController.fetchWithdrawals
);

export default router;
