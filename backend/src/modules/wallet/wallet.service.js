import * as walletRepo from "./wallet.repository.js";
import { findCustomerByIdentifier } from "../identity/identity.service.js";
import { PaymentStrategyFactory } from "./strategies/paymentStrategy.factory.js";
import { getResourceCanteenId } from "../canteen/canteen.service.js";
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

    // 3. Customer Type & Status Check
    const cust = await findCustomerByIdentifier(customerId);
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

    // 5. Execute Atomic Top-Up via Stored Procedure
    const result = await walletRepo.addWalletAmount({
      customerId: cust.CUSTOMERID,
      amount: topupAmount,
      paymentMethod: paymentResult.paymentMethod,
      refNo: paymentResult.refNo || null,
      createdBy,
      remarks: paymentResult.remarks,
      canteenId,
    });

    const amountVal = Number(result?.AMOUNT ?? topupAmount);
    const balanceVal = Number(result?.BALANCE ?? result?.BALAFTER ?? 0);
    const balAfterVal = Number(result?.BALAFTER ?? balanceVal);
    const balBeforeVal = Number(
      result?.BALBEFORE !== undefined && result?.BALBEFORE !== null
        ? result.BALBEFORE
        : (balAfterVal - amountVal).toFixed(2)
    );

    return {
      walletId: result?.WALLETID,
      customerId: result?.CUSTOMERID || cust.CUSTOMERID,
      amount: amountVal,
      balBefore: balBeforeVal,
      balAfter: balAfterVal,
      canteenId: result?.CANTEENID || canteenId,
      refNo: result?.REFNO || paymentResult.refNo,
      paymentMethod: result?.PAYMENTMETHOD || paymentResult.paymentMethod,
    };
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
   * List wallet transactions with optional pagination metadata.
   */
  static async listTransactions(customerId, fromDate, toDate, page = null, pageSize = null) {
    const rows = await walletRepo.listWalletTransactions(
      customerId,
      fromDate,
      toDate,
      page,
      pageSize
    );

    if (page && pageSize) {
      const totalRows = Number(rows[0]?.TOTALROWS || 0);
      const limit = Number(rows[0]?.PAGESIZE || pageSize || 20);
      const totalPages = Number(rows[0]?.TOTALPAGES || (totalRows > 0 ? Math.ceil(totalRows / limit) : 1));
      const currentPage = Number(rows[0]?.CURRENTPAGE || page || 1);

      return {
        rows,
        pagination: {
          totalRows,
          currentPage,
          pageSize: limit,
          totalPages,
        },
      };
    }

    return rows;
  }

  /**
   * Request a withdrawal.
   * Ensures contract employees have an assigned default canteen.
   */
  static async requestWithdrawal(customerId, amount, requestedBy, remarks) {
    const cust = await findCustomerByIdentifier(customerId);
    if (!cust) throw new NotFoundError("Customer not found or inactive");

    if (["CNT", "CONTEMP", "CONT"].includes(cust.CTYPECODE)) {
      if (!cust.DEFAULTCANTEENID) {
        throw new BadRequestError(
          "Contract employee does not have an assigned default canteen for withdrawal processing"
        );
      }
    }

    return await walletRepo.reqWalletWithdrawal(
      customerId,
      amount,
      requestedBy,
      remarks
    );
  }

  /**
   * Approve a withdrawal.
   * Validates acting manager is authorized for the employee's default canteen.
   */
  static async approveWithdrawal(walletWdId, processedBy, paymentMethod, refNo, remarks, user = null) {
    const isSysAdmin = (user?.SYSTEMROLES || []).includes("SYSADM");
    if (!isSysAdmin && user) {
      let targetCanteenId = await getResourceCanteenId("WALLETWD", walletWdId);
      if (!targetCanteenId) {
        // Fallback for visitors who do not have an assigned default canteen in CMS_CONTEMP
        targetCanteenId =
          user.CANTEENROLES?.find((r) => r.ISDEFAULT)?.CANTEENID ||
          user.CANTEENROLES?.[0]?.CANTEENID ||
          null;
      }
      if (!targetCanteenId) {
        throw new BadRequestError("Withdrawal request has no valid default canteen routing");
      }
      const hasCanteenAccess = (user?.CANTEENROLES || []).some(
        (r) =>
          ["CNTMGR", "CNTAST", "CMGR"].includes(r.ROLECODE) &&
          Number(r.CANTEENID) === Number(targetCanteenId)
      );
      if (!hasCanteenAccess) {
        throw new ForbiddenError(
          "You are only authorized to approve withdrawals for your assigned default canteen"
        );
      }
    }

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
   * Validates acting manager is authorized for the employee's default canteen.
   */
  static async rejectWithdrawal(walletWdId, processedBy, remarks, user = null) {
    const isSysAdmin = (user?.SYSTEMROLES || []).includes("SYSADM");
    if (!isSysAdmin && user) {
      let targetCanteenId = await getResourceCanteenId("WALLETWD", walletWdId);
      if (!targetCanteenId) {
        // Fallback for visitors who do not have an assigned default canteen in CMS_CONTEMP
        targetCanteenId =
          user.CANTEENROLES?.find((r) => r.ISDEFAULT)?.CANTEENID ||
          user.CANTEENROLES?.[0]?.CANTEENID ||
          null;
      }
      if (!targetCanteenId) {
        throw new BadRequestError("Withdrawal request has no valid default canteen routing");
      }
      const hasCanteenAccess = (user?.CANTEENROLES || []).some(
        (r) =>
          ["CNTMGR", "CNTAST", "CMGR"].includes(r.ROLECODE) &&
          Number(r.CANTEENID) === Number(targetCanteenId)
      );
      if (!hasCanteenAccess) {
        throw new ForbiddenError(
          "You are only authorized to reject withdrawals for your assigned default canteen"
        );
      }
    }

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
   * Scoped to customer (employee view), assigned canteen (manager view), or all (SYSADM).
   */
  static async listWithdrawals(customerId = null, status = null, canteenId = null, user = null) {
    // If customerId is provided, caller is an employee fetching their own request history
    if (customerId) {
      return await walletRepo.listWalletWithdrawals(customerId, status, null);
    }

    // Manager / Staff / Admin queue
    const isSysAdmin = (user?.SYSTEMROLES || []).includes("SYSADM");
    let effectiveCanteenId = canteenId ? Number(canteenId) : null;

    if (!isSysAdmin && user) {
      const userCanteenRoles = user?.CANTEENROLES || [];
      const managerCanteens = userCanteenRoles
        .filter((r) => ["CNTMGR", "CNTAST", "CMGR"].includes(r.ROLECODE))
        .map((r) => Number(r.CANTEENID));

      if (managerCanteens.length === 0) {
        throw new ForbiddenError("You are not authorized as canteen staff/manager for any canteen");
      }

      if (effectiveCanteenId) {
        if (!managerCanteens.includes(effectiveCanteenId)) {
          throw new ForbiddenError(
            "You are not authorized to view withdrawal requests for the selected canteen"
          );
        }
      } else {
        const defaultRole = userCanteenRoles.find(
          (r) => r.ISDEFAULT && managerCanteens.includes(Number(r.CANTEENID))
        );
        effectiveCanteenId = defaultRole ? Number(defaultRole.CANTEENID) : managerCanteens[0];
      }
    }

    return await walletRepo.listWalletWithdrawals(null, status, effectiveCanteenId);
  }
}
