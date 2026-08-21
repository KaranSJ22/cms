import { pool } from "../../db/connection.js";

/**
 * Creates a new wallet for a customer.
 */
export const addWallet = async (customerId, openAmount, createdBy, remarks) => {
  const [rows] = await pool.execute(
    "CALL CMSADDWALLET(?, ?, ?, ?)",
    [customerId, openAmount, createdBy, remarks]
  );
  return rows[0]?.[0];
};

/**
 * Adds money to an existing wallet (Top-Up).
 */
export const addWalletAmount = async (customerId, amount, paymentMethod, refNo, createdBy, remarks) => {
  const [rows] = await pool.execute(
    "CALL CMSADDWALLETAMT(?, ?, ?, ?, ?, ?)",
    [customerId, amount, paymentMethod, refNo, createdBy, remarks]
  );
  return rows[0]?.[0];
};

/**
 * Gets wallet details for a customer.
 */
export const getWallet = async (customerId) => {
  const [rows] = await pool.execute(
    "CALL CMSGETWALLET(?)",
    [customerId]
  );
  return rows[0]?.[0];
};

/**
 * Lists transactions for a customer's wallet.
 */
export const listWalletTransactions = async (customerId, fromDate = null, toDate = null) => {
  const [rows] = await pool.execute(
    "CALL CMSLISTWALLETTRAN(?, ?, ?)",
    [customerId, fromDate, toDate]
  );
  return rows[0];
};

/**
 * Requests a withdrawal from the wallet.
 */
export const reqWalletWithdrawal = async (customerId, amount, requestedBy, remarks) => {
  const [rows] = await pool.execute(
    "CALL CMSREQWALLETWD(?, ?, ?, ?)",
    [customerId, amount, requestedBy, remarks]
  );
  return rows[0]?.[0];
};

/**
 * Approves a pending withdrawal request.
 */
export const approveWalletWithdrawal = async (walletWdId, processedBy, paymentMethod, refNo, remarks) => {
  const [rows] = await pool.execute(
    "CALL CMSAPPWALLETWD(?, ?, ?, ?, ?)",
    [walletWdId, processedBy, paymentMethod, refNo, remarks]
  );
  return rows[0]?.[0];
};

/**
 * Rejects a pending withdrawal request.
 */
export const rejectWalletWithdrawal = async (walletWdId, processedBy, remarks) => {
  const [rows] = await pool.execute(
    "CALL CMSREJWALLETWD(?, ?, ?)",
    [walletWdId, processedBy, remarks]
  );
  return rows[0]?.[0];
};

/**
 * Lists withdrawal requests.
 */
export const listWalletWithdrawals = async (customerId = null, status = null) => {
  const [rows] = await pool.execute(
    "CALL CMSLISTWALLETWD(?, ?)",
    [customerId ?? null, status ?? null]
  );
  return rows[0];
};
