import { WalletService } from "./wallet.service.js";

export class WalletController {
  static async createWallet(req, res, next) {
    try {
      const { customerId, openAmount, remarks } = req.body;
      const createdBy = req.user.USERID;

      const result = await WalletService.addWallet(customerId, openAmount, createdBy, remarks);
      if (!result.success) {
        return res.status(400).json({ SUCCESS: false, MESSAGE: result.error });
      }

      return res.status(201).json({
        SUCCESS: true,
        MESSAGE: "Wallet created successfully",
        DATA: result.data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async topupWallet(req, res, next) {
    try {
      const { customerId, amount, paymentMethod, refNo, remarks } = req.body;
      const createdBy = req.user.USERID;

      const result = await WalletService.topUpWallet(customerId, amount, paymentMethod, refNo, createdBy, remarks);
      if (!result.success) {
        return res.status(400).json({ SUCCESS: false, MESSAGE: result.error });
      }

      return res.status(200).json({
        SUCCESS: true,
        MESSAGE: "Wallet top-up successful",
        DATA: result.data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async fetchWallet(req, res, next) {
    try {
      const { customerId } = req.params;

      const result = await WalletService.getWallet(customerId);
      if (!result.success) {
        return res.status(404).json({ SUCCESS: false, MESSAGE: result.error });
      }

      return res.status(200).json({
        SUCCESS: true,
        DATA: result.data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async fetchWalletTransactions(req, res, next) {
    try {
      const { customerId } = req.params;
      const { fromDate, toDate } = req.query;

      const result = await WalletService.listTransactions(customerId, fromDate, toDate);
      if (!result.success) {
        return res.status(400).json({ SUCCESS: false, MESSAGE: result.error });
      }

      return res.status(200).json({
        SUCCESS: true,
        DATA: result.data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async requestWithdrawal(req, res, next) {
    try {
      const { customerId, amount, remarks } = req.body;
      const requestedBy = req.user.USERID;

      const result = await WalletService.requestWithdrawal(customerId, amount, requestedBy, remarks);
      if (!result.success) {
        return res.status(400).json({ SUCCESS: false, MESSAGE: result.error });
      }

      return res.status(201).json({
        SUCCESS: true,
        MESSAGE: "Withdrawal requested successfully",
        DATA: result.data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async approveWithdrawal(req, res, next) {
    try {
      const { walletWdId } = req.params;
      const { paymentMethod, refNo, remarks } = req.body;
      const processedBy = req.user.USERID;

      const result = await WalletService.approveWithdrawal(walletWdId, processedBy, paymentMethod, refNo, remarks);
      if (!result.success) {
        return res.status(400).json({ SUCCESS: false, MESSAGE: result.error });
      }

      return res.status(200).json({
        SUCCESS: true,
        MESSAGE: "Withdrawal approved successfully",
        DATA: result.data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async rejectWithdrawal(req, res, next) {
    try {
      const { walletWdId } = req.params;
      const { remarks } = req.body;
      const processedBy = req.user.USERID;

      const result = await WalletService.rejectWithdrawal(walletWdId, processedBy, remarks);
      if (!result.success) {
        return res.status(400).json({ SUCCESS: false, MESSAGE: result.error });
      }

      return res.status(200).json({
        SUCCESS: true,
        MESSAGE: "Withdrawal rejected successfully",
        DATA: result.data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async fetchWithdrawals(req, res, next) {
    try {
      const { customerId, status } = req.query;

      const result = await WalletService.listWithdrawals(customerId, status);
      if (!result.success) {
        return res.status(400).json({ SUCCESS: false, MESSAGE: result.error });
      }

      return res.status(200).json({
        SUCCESS: true,
        DATA: result.data,
      });
    } catch (error) {
      next(error);
    }
  }
}
