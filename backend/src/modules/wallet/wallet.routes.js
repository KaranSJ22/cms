import { Router } from "express";
import { WalletController } from "./wallet.controller.js";
import { walletValidation } from "./wallet.validation.js";
import { validate } from "../../middlwares/validate.middleware.js";
import { authenticate } from "../../middlwares/auth.middleware.js";

const router = Router();

// Guard: Exclusively SYSADM or Canteen Manager (CNTMGR / CMGR)
const isManager = (req) => {
  const sysRoles = req.user?.SYSTEMROLES || [];
  if (sysRoles.includes("SYSADM")) return true;

  const canteenRoles = req.user?.CANTEENROLES || [];
  return canteenRoles.some((r) => r.ROLECODE === "CNTMGR" || r.ROLECODE === "CMGR");
};

const getReqCustomerId = (req) => {
  return req.user?.CUSTOMERID ?? req.user?.CUSTOMER?.CUSTOMERID ?? null;
};

const getReqCustomerType = (req) => {
  return req.user?.CTYPECODE ?? req.user?.CUSTOMER?.CTYPECODE ?? null;
};

const canteenManagerOnly = [
  (req, res, next) => {
    if (isManager(req)) return next();

    return res.status(403).json({
      SUCCESS: false,
      MESSAGE: "Only Canteen Managers can perform this wallet operation",
    });
  },
];

// Guard: Canteen Manager OR the owning customer (Contract Employee / Visitor)
const walletOwnerOrManager = [
  (req, res, next) => {
    if (isManager(req)) return next();

    const paramCustomerId = Number(req.params.customerId);
    const userCustomerId = getReqCustomerId(req);
    const userCtype = getReqCustomerType(req);

    if (
      userCustomerId &&
      userCustomerId === paramCustomerId &&
      ["CNT", "VIS", "CONTEMP", "VISITOR"].includes(userCtype)
    ) {
      return next();
    }

    return res.status(403).json({
      SUCCESS: false,
      MESSAGE: "You do not have permission to view this wallet",
    });
  },
];

// Guard: Customer requesting withdrawal for their own wallet
const customerWithdrawalGuard = [
  (req, res, next) => {
    if (isManager(req)) return next();

    const bodyCustomerId = Number(req.body.customerId);
    const userCustomerId = getReqCustomerId(req);
    const userCtype = getReqCustomerType(req);

    if (
      userCustomerId &&
      userCustomerId === bodyCustomerId &&
      ["CNT", "VIS", "CONTEMP", "VISITOR"].includes(userCtype)
    ) {
      return next();
    }

    return res.status(403).json({
      SUCCESS: false,
      MESSAGE: "Withdrawal requests can only be submitted for your own wallet",
    });
  },
];

// Guard: Canteen Manager OR customer fetching their own withdrawal requests
const withdrawalListGuard = [
  (req, res, next) => {
    if (isManager(req)) return next();

    const queryCustomerId = Number(req.query?.customerId);
    const userCustomerId = getReqCustomerId(req);
    const userCtype = getReqCustomerType(req);

    if (
      userCustomerId &&
      queryCustomerId === userCustomerId &&
      ["CNT", "VIS", "CONTEMP", "VISITOR"].includes(userCtype)
    ) {
      return next();
    }

    return res.status(403).json({
      SUCCESS: false,
      MESSAGE: "You do not have permission to view withdrawal requests",
    });
  },
];

router.use(authenticate);

// Customer Profile & Wallet Lookup (Canteen Manager)
router.get(
  "/customer-lookup/:customerId",
  ...canteenManagerOnly,
  validate(walletValidation.fetchWallet),
  WalletController.customerLookup
);

// Create a wallet (Canteen Manager)
router.post(
  "/",
  ...canteenManagerOnly,
  validate(walletValidation.createWallet),
  WalletController.createWallet
);

// Top up a wallet (Canteen Manager)
router.post(
  "/topup",
  ...canteenManagerOnly,
  validate(walletValidation.topupWallet),
  WalletController.topupWallet
);

// Fetch wallet details (Canteen Manager OR owning Customer)
router.get(
  "/customer/:customerId",
  ...walletOwnerOrManager,
  validate(walletValidation.fetchWallet),
  WalletController.fetchWallet
);

// Fetch wallet transactions (Canteen Manager OR owning Customer)
router.get(
  "/customer/:customerId/transactions",
  ...walletOwnerOrManager,
  validate(walletValidation.fetchTransactions),
  WalletController.fetchWalletTransactions
);

// Request a withdrawal (Owning Customer)
router.post(
  "/withdraw/request",
  ...customerWithdrawalGuard,
  validate(walletValidation.requestWithdrawal),
  WalletController.requestWithdrawal
);

// Approve a withdrawal (Canteen Manager)
router.post(
  "/withdraw/:walletWdId/approve",
  ...canteenManagerOnly,
  validate(walletValidation.approveWithdrawal),
  WalletController.approveWithdrawal
);

// Reject a withdrawal (Canteen Manager)
router.post(
  "/withdraw/:walletWdId/reject",
  ...canteenManagerOnly,
  validate(walletValidation.rejectWithdrawal),
  WalletController.rejectWithdrawal
);

// List withdrawal requests (Canteen Manager OR owning Customer)
router.get(
  "/withdraw/requests",
  ...withdrawalListGuard,
  validate(walletValidation.fetchWithdrawals),
  WalletController.fetchWithdrawals
);

export default router;
