import * as walletRepo from "./wallet.repository.js";

export class WalletService {
  /**
   * Add a new wallet for a customer
   */
  static async addWallet(customerId, openAmount, createdBy, remarks) {
    try {
      const result = await walletRepo.addWallet(customerId, openAmount, createdBy, remarks);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Top up a wallet
   */
  static async topUpWallet(customerId, amount, paymentMethod, refNo, createdBy, remarks) {
    try {
      const result = await walletRepo.addWalletAmount(
        customerId,
        amount,
        paymentMethod,
        refNo,
        createdBy,
        remarks
      );
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get wallet details
   */
  static async getWallet(customerId) {
    try {
      const result = await walletRepo.getWallet(customerId);
      if (!result) {
        return { success: false, error: "Wallet not found" };
      }
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * List wallet transactions
   */
  static async listTransactions(customerId, fromDate, toDate) {
    try {
      const result = await walletRepo.listWalletTransactions(customerId, fromDate, toDate);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Request a withdrawal
   */
  static async requestWithdrawal(customerId, amount, requestedBy, remarks) {
    try {
      const result = await walletRepo.reqWalletWithdrawal(
        customerId,
        amount,
        requestedBy,
        remarks
      );
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Approve a withdrawal
   */
  static async approveWithdrawal(walletWdId, processedBy, paymentMethod, refNo, remarks) {
    try {
      const result = await walletRepo.approveWalletWithdrawal(
        walletWdId,
        processedBy,
        paymentMethod,
        refNo,
        remarks
      );
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject a withdrawal
   */
  static async rejectWithdrawal(walletWdId, processedBy, remarks) {
    try {
      const result = await walletRepo.rejectWalletWithdrawal(
        walletWdId,
        processedBy,
        remarks
      );
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * List withdrawal requests
   */
  static async listWithdrawals(customerId, status) {
    try {
      const result = await walletRepo.listWalletWithdrawals(customerId, status);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
