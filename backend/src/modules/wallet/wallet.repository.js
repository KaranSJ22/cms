import { pool } from "../../db/connection.js";

/**
 * Creates a new wallet for a customer.
 */
export const addWallet = async (customerId, openAmount, createdBy, remarks) => {
  const [rows] = await pool.query(
    "CALL CMSADDWALLET(?, ?, ?, ?)",
    [customerId, openAmount ?? 0, createdBy, remarks ?? null]
  );
  return rows[0]?.[0];
};

/**
 * Adds money to an existing wallet (Top-Up).
 * Atomic transaction execution via Stored Procedure CMSADDWALLETAMT.
 */
export const addWalletAmount = async ({
  customerId,
  amount,
  paymentMethod = "CASH",
  refNo = null,
  createdBy,
  remarks = null,
  canteenId = null,
}) => {
  const [rows] = await pool.query(
    "CALL CMSADDWALLETAMT(?, ?, ?, ?, ?, ?, ?)",
    [
      customerId,
      amount,
      paymentMethod,
      refNo,
      createdBy,
      remarks,
      canteenId,
    ]
  );
  return rows[0]?.[0];
};

/**
 * Gets wallet details for a customer.
 */
export const getWallet = async (customerId) => {
  const [rows] = await pool.query(
    "CALL CMSGETWALLET(?)",
    [customerId]
  );
  return rows[0]?.[0];
};

/**
 * Lists transactions for a customer's wallet.
 */
export const listWalletTransactions = async (
  customerId,
  fromDate = null,
  toDate = null,
  page = null,
  pageSize = null
) => {
  const [rows] = await pool.query(
    "CALL CMSLISTWALLETTRAN(?, ?, ?, ?, ?)",
    [
      customerId,
      fromDate ?? null,
      toDate ?? null,
      page ? Number(page) : null,
      pageSize ? Number(pageSize) : null,
    ]
  );
  return rows[0] || [];
};

/**
 * Requests a withdrawal from the wallet.
 */
export const reqWalletWithdrawal = async (customerId, amount, requestedBy, remarks) => {
  const [rows] = await pool.query(
    "CALL CMSREQWALLETWD(?, ?, ?, ?)",
    [customerId, amount, requestedBy, remarks ?? null]
  );
  return rows[0]?.[0];
};

/**
 * Approves a pending withdrawal request.
 */
export const approveWalletWithdrawal = async (walletWdId, processedBy, paymentMethod, refNo, remarks) => {
  const [rows] = await pool.query(
    "CALL CMSAPPWALLETWD(?, ?, ?, ?, ?)",
    [
      walletWdId,
      processedBy,
      paymentMethod ?? "CASH",
      refNo ?? null,
      remarks ?? null,
    ]
  );
  return rows[0]?.[0];
};

/**
 * Rejects a pending withdrawal request.
 */
export const rejectWalletWithdrawal = async (walletWdId, processedBy, remarks) => {
  const [rows] = await pool.query(
    "CALL CMSREJWALLETWD(?, ?, ?)",
    [walletWdId, processedBy, remarks ?? null]
  );
  return rows[0]?.[0];
};

/**
 * Cancels a pending withdrawal request by the customer.
 */
export const cancelWalletWithdrawal = async (walletWdId, customerId, remarks = null) => {
  const [rows] = await pool.query(
    "CALL CMSCANWALLETWD(?, ?, ?)",
    [walletWdId, customerId ?? null, remarks ?? null]
  );
  return rows[0]?.[0];
};

/**
 * Lists withdrawal requests.
 * Supports customer-scoped history, canteen-scoped manager queue, and global admin view.
 */
export const listWalletWithdrawals = async (customerId = null, status = null, canteenId = null) => {
  const [rows] = await pool.query(
    "CALL CMSLISTWALLETWD(?, ?, ?)",
    [customerId ?? null, status ?? null, canteenId ?? null]
  );
  return rows[0] || [];
};
