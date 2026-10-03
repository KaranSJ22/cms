import * as walletRepo from "./wallet.repository.js";
import { findCustomerByIdentifier } from "../identity/identity.service.js";
import { pool } from "../../db/connection.js";
import { PaymentStrategyFactory } from "./strategies/paymentStrategy.factory.js";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "../../common/errors/appError.js";

export class WalletService {
  /**
   * Look up a customer profile and check their wallet eligibility & activation status.
   * Supports lookup by Employee ID (CONTCODE / EMPCODE), Login ID (LOGINID), or Customer ID.
   */
  static async customerLookup(identifier) {
    const customer = await findCustomerByIdentifier(identifier);
    if (!customer) {
      throw new NotFoundError(`No employee or customer record found matching "${identifier}"`);
    }

    const isEligible = ["CNT", "VIS"].includes(customer.CTYPECODE);
    const isPermanent = customer.CTYPECODE === "PRM";

    const wallet = await walletRepo.getWallet(customer.CUSTOMERID);

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
        EMPLOYEE_CODE:
          customer.EMPLOYEE_CODE ||
          customer.CONTCODE ||
          customer.EMPCODE ||
          customer.LOGINID,
        CONTCODE: customer.CONTCODE || null,
        EMPCODE: customer.EMPCODE || null,
        VENDORNAME: customer.VENDORNAME || null,
        DEPT: customer.DEPT || null,
        DESIG: customer.DESIG || null,
      },
      isEligible,
      isPermanent,
      hasWallet: !!wallet,
      wallet: wallet || null,
    };
  }

  /**
   * Add a new wallet for a customer.
   */
  static async addWallet(customerId, openAmount, createdBy, remarks) {
    return await walletRepo.addWallet(customerId, openAmount, createdBy, remarks);
  }

  /**
   * Top-Up Wallet using Strategy Pattern, Canteen Attribution, & Status Master Codes
   */
  static async topUpWallet(
    customerId,
    amount,
    paymentMethod,
    refNo,
    createdBy,
    remarks,
    canteenId,
    user
  ) {
    // 1. Verify Canteen Manager Authority
    const isSysAdmin = (user?.SYSTEMROLES || []).includes("SYSADM");
    const canManageCanteen = (user?.CANTEENROLES || []).some(
      (r) => r.ROLECODE === "CNTMGR" && Number(r.CANTEENID) === Number(canteenId)
    );

    if (!isSysAdmin && !canManageCanteen) {
      throw new ForbiddenError(
        "You are not authorized as Canteen Manager for the selected canteen"
      );
    }

    // 2. Resolve Strategy via Factory (SOLID: Open-Closed Principle)
    const strategy = PaymentStrategyFactory.getStrategy(paymentMethod);
    await strategy.validate({ amount, refNo });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 3. Customer Type & Status Check (10 = 'ACT' from SEED_STATUS.sql)
      const [[cust]] = await conn.query(
        `SELECT CUSTOMERID, CTYPECODE, DISPNAME FROM CMS_CUSTOMER WHERE CUSTOMERID = ? AND STATUSID = 10`,
        [customerId]
      );
      if (!cust) throw new NotFoundError("Customer not found or inactive");

      const topupAmount = Number(amount);
      if (topupAmount <= 0) {
        throw new BadRequestError("Top-up amount must be greater than zero");
      }

      // Rule: Contract employees have ₹100 minimum; Visitors have no minimum (can pay exact amount)
      if (cust.CTYPECODE === "CNT" && topupAmount < 100.0) {
        throw new BadRequestError(
          "Contract employee top-up amount must be at least ₹100.00"
        );
      }

      // 4. Execute Payment Strategy
      const paymentResult = await strategy.processPayment({
        amount: topupAmount,
        customer: cust,
        refNo,
        createdBy,
        remarks,
      });

      // 5. Fetch or Auto-Initialize Wallet (Status 10 = 'ACT')
      let [[wallet]] = await conn.query(
        `SELECT WALLETID, BALANCE FROM CMS_WALLET WHERE CUSTOMERID = ? AND STATUSID = 10 FOR UPDATE`,
        [customerId]
      );

      if (!wallet) {
        const [wRes] = await conn.query(
          `INSERT INTO CMS_WALLET (CUSTOMERID, BALANCE, RESERVEDAMT, STATUSID) VALUES (?, 0.00, 0.00, 10)`,
          [customerId]
        );
        wallet = { WALLETID: wRes.insertId, BALANCE: 0.0 };
      }

      const balBefore = Number(wallet.BALANCE);
      const balAfter = Number((balBefore + topupAmount).toFixed(2));

      // 6. Update Wallet Balance
      await conn.query(
        `UPDATE CMS_WALLET SET BALANCE = ? WHERE WALLETID = ?`,
        [balAfter, wallet.WALLETID]
      );

      // 7. Resolve Transaction Reference Number
      let finalRefNo = paymentResult.refNo;
      if (!finalRefNo) {
        await conn.execute(`CALL CMSGENAUTO('CMS_WALLETTRAN', 'REFNO', @refNo)`);
        const [[refRow]] = await conn.execute(`SELECT @refNo AS REFNO`);
        finalRefNo = refRow?.REFNO || `TXN-${Date.now()}`;
      }

      // 8. Record Ledger Entry with CANTEENID and STATUSID = 40 ('DEP' / Deposit)
      await conn.query(
        `INSERT INTO CMS_WALLETTRAN (
           WALLETID, BOOKINGID, CANTEENID, TRANSTYPE, SOURCECODE,
           AMOUNT, BALBEFORE, BALAFTER, PAYMENTMETHOD, REFNO, STATUSID, CREATEDBY, REMARKS
         ) VALUES (
           ?, NULL, ?, 'CREDIT', 'TOPUP',
           ?, ?, ?, ?, ?, 40, ?, ?
         )`,
        [
          wallet.WALLETID,
          canteenId,
          topupAmount,
          balBefore,
          balAfter,
          paymentResult.paymentMethod,
          finalRefNo,
          createdBy,
          paymentResult.remarks,
        ]
      );

      await conn.commit();

      return {
        walletId: wallet.WALLETID,
        customerId,
        amount: topupAmount,
        balBefore,
        balAfter,
        canteenId,
        refNo: finalRefNo,
        paymentMethod: paymentResult.paymentMethod,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Get wallet details.
   */
  static async getWallet(customerId) {
    const result = await walletRepo.getWallet(customerId);
    if (!result) {
      throw new NotFoundError("Wallet not found");
    }
    return result;
  }

  /**
   * List wallet transactions.
   */
  static async listTransactions(customerId, fromDate, toDate, page = null, pageSize = null) {
    return await walletRepo.listWalletTransactions(
      customerId,
      fromDate,
      toDate,
      page,
      pageSize
    );
  }

  /**
   * Request a withdrawal.
   */
  static async requestWithdrawal(customerId, amount, requestedBy, remarks) {
    return await walletRepo.reqWalletWithdrawal(
      customerId,
      amount,
      requestedBy,
      remarks
    );
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
   * Cancel a withdrawal request by customer.
   */
  static async cancelWithdrawal(walletWdId, customerId, remarks) {
    return await walletRepo.cancelWalletWithdrawal(walletWdId, customerId, remarks);
  }

  /**
   * List withdrawal requests.
   */
  static async listWithdrawals(customerId, status) {
    return await walletRepo.listWalletWithdrawals(customerId, status);
  }
}
