import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { WalletService } from "./wallet.service.js";

export class WalletController {
  static customerLookup = asyncHandler(async (req, res) => {
    const identifier =
      req.validated?.params?.identifier ??
      req.params.identifier ??
      req.params.customerId;

    const data = await WalletService.customerLookup(identifier);
    return sendSuccess(res, data, "Customer wallet lookup successful");
  });


  static createWallet = asyncHandler(async (req, res) => {
    const { customerId, openAmount, remarks } = req.validated.body;
    const createdBy = req.user.USERID;

    const data = await WalletService.addWallet(customerId, openAmount, createdBy, remarks);
    return sendSuccess(res, data, "Wallet created successfully", 201);
  });

  static topupWallet = asyncHandler(async (req, res) => {
    const { customerId, amount, paymentMethod, refNo, remarks } = req.validated.body;
    const createdBy = req.user.USERID;

    const data = await WalletService.topUpWallet(customerId, amount, paymentMethod, refNo, createdBy, remarks);
    return sendSuccess(res, data, "Wallet top-up successful");
  });

  static fetchWallet = asyncHandler(async (req, res) => {
    const { customerId } = req.validated.params;

    const data = await WalletService.getWallet(customerId);
    return sendSuccess(res, data, "Wallet fetched successfully");
  });

  static fetchWalletTransactions = asyncHandler(async (req, res) => {
    const { customerId } = req.validated.params;
    const { fromDate, toDate, page, pageSize } = req.validated.query || {};

    const data = await WalletService.listTransactions(
      customerId,
      fromDate,
      toDate,
      page ? Number(page) : null,
      pageSize ? Number(pageSize) : null
    );
    if (data && data.pagination) {
      return sendSuccess(res, data.rows, "Wallet transactions fetched successfully", 200, data.pagination);
    }
    return sendSuccess(res, data, "Wallet transactions fetched successfully");
  });

  static requestWithdrawal = asyncHandler(async (req, res) => {
    const { customerId, amount, remarks } = req.validated.body;
    const requestedBy = req.user.USERID;

    const data = await WalletService.requestWithdrawal(customerId, amount, requestedBy, remarks);
    return sendSuccess(res, data, "Withdrawal requested successfully", 201);
  });

  static approveWithdrawal = asyncHandler(async (req, res) => {
    const { walletWdId } = req.validated.params;
    const { paymentMethod, refNo, remarks } = req.validated.body;
    const processedBy = req.user.USERID;

    const data = await WalletService.approveWithdrawal(walletWdId, processedBy, paymentMethod, refNo, remarks);
    return sendSuccess(res, data, "Withdrawal approved successfully");
  });

  static rejectWithdrawal = asyncHandler(async (req, res) => {
    const { walletWdId } = req.validated.params;
    const { remarks } = req.validated.body;
    const processedBy = req.user.USERID;

    const data = await WalletService.rejectWithdrawal(walletWdId, processedBy, remarks);
    return sendSuccess(res, data, "Withdrawal rejected successfully");
  });

  static fetchWithdrawals = asyncHandler(async (req, res) => {
    const { customerId, status } = req.validated.query || {};

    const data = await WalletService.listWithdrawals(customerId ?? null, status ?? null);
    return sendSuccess(res, data, "Withdrawal requests fetched successfully");
  });

  static cancelWithdrawal = asyncHandler(async (req, res) => {
    const { walletWdId } = req.validated.params;
    const { remarks } = req.validated.body || {};

    const sysRoles = req.user?.SYSTEMROLES || [];
    const canteenRoles = req.user?.CANTEENROLES || [];
    const isMgr =
      sysRoles.includes("SYSADM") ||
      canteenRoles.some((r) => ["CNTMGR", "CNTAST", "CMGR"].includes(r.ROLECODE));

    // If caller is canteen staff or sysadm, pass null for customerId (staff cancellation).
    // If caller is customer, pass their CUSTOMERID to enforce ownership in CMSCANWALLETWD.
    const customerId = isMgr ? null : (req.user?.CUSTOMERID ?? null);

    const data = await WalletService.cancelWithdrawal(walletWdId, customerId, remarks);
    return sendSuccess(res, data, "Withdrawal request cancelled successfully");
  });
}

