import * as walletRepo from "./wallet.repository.js";
import { getCustomerById } from "../identity/identity.repository.js";

export class WalletService {
  /**
   * Look up a customer profile and check their wallet eligibility & activation status.
   */
  static async customerLookup(customerId) {
    const customer = await getCustomerById(customerId);
    if (!customer) {
      const error = new Error("Customer record not found");
      error.statusCode = 404;
      throw error;
    }

    const isEligible = ["CNT", "VIS", "CONTEMP", "VISITOR"].includes(customer.CTYPECODE);
    const isPermanent = ["PRM", "PERM", "PERMEMP"].includes(customer.CTYPECODE);

    const wallet = await walletRepo.getWallet(customerId);

    return {
      customer: {
        CUSTOMERID: customer.CUSTOMERID,
        USERID: customer.USERID,
        LOGINID: customer.LOGINID,
        FULLNAME: customer.FULLNAME,
        DISPNAME: customer.DISPNAME,
        CTYPECODE: customer.CTYPECODE,
        CTYPENAME: customer.CTYPENAME,
        STATUSCODE: customer.STATUSCODE,
      },
      isEligible,
      isPermanent,
      hasWallet: !!wallet,
      wallet: wallet || null,
    };
  }

  /**
   * Add a new wallet for a customer.
   * Throws on DB error — handled by asyncHandler → errorHandler.
   */
  static async addWallet(customerId, openAmount, createdBy, remarks) {
    const result = await walletRepo.addWallet(customerId, openAmount, createdBy, remarks);
    return result;
  }

  /**
   * Top up a wallet.
   */
  static async topUpWallet(customerId, amount, paymentMethod, refNo, createdBy, remarks) {
    const result = await walletRepo.addWalletAmount(
      customerId,
      amount,
      paymentMethod,
      refNo,
      createdBy,
      remarks
    );
    return result;
  }

  /**
   * Get wallet details.
   */
  static async getWallet(customerId) {
    const result = await walletRepo.getWallet(customerId);
    if (!result) {
      const error = new Error("Wallet not found");
      error.statusCode = 404;
      throw error;
    }
    return result;
  }

  /**
   * List wallet transactions.
   */
  static async listTransactions(customerId, fromDate, toDate) {
    return await walletRepo.listWalletTransactions(customerId, fromDate, toDate);
  }

  /**
   * Request a withdrawal.
   */
  static async requestWithdrawal(customerId, amount, requestedBy, remarks) {
    return await walletRepo.reqWalletWithdrawal(customerId, amount, requestedBy, remarks);
  }

  /**
   * Approve a withdrawal.
   */
  static async approveWithdrawal(walletWdId, processedBy, paymentMethod, refNo, remarks) {
    return await walletRepo.approveWalletWithdrawal(
      walletWdId,
      processedBy,
      paymentMethod,
      refNo,
      remarks
    );
  }

  /**
   * Reject a withdrawal.
   */
  static async rejectWithdrawal(walletWdId, processedBy, remarks) {
    return await walletRepo.rejectWalletWithdrawal(walletWdId, processedBy, remarks);
  }

  /**
   * List withdrawal requests.
   */
  static async listWithdrawals(customerId, status) {
    return await walletRepo.listWalletWithdrawals(customerId, status);
  }
}
