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
 */
export const addWalletAmount = async (customerId, amount, paymentMethod, refNo, createdBy, remarks) => {
  const [rows] = await pool.query(
    "CALL CMSADDWALLETAMT(?, ?, ?, ?, ?, ?)",
    [
      customerId,
      amount,
      paymentMethod ?? "CASH",
      refNo ?? null,
      createdBy,
      remarks ?? null,
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
  let rows;
  let isLegacySp = false;

  try {
    const [res] = await pool.query(
      "CALL CMSLISTWALLETTRAN(?, ?, ?, ?, ?)",
      [
        customerId,
        fromDate ?? null,
        toDate ?? null,
        page ? Number(page) : null,
        pageSize ? Number(pageSize) : null,
      ]
    );
    rows = res;
  } catch (err) {
    if (err.code === "ER_SP_WRONG_NO_OF_ARGS" || err.errno === 1318) {
      const [res] = await pool.query(
        "CALL CMSLISTWALLETTRAN(?, ?, ?)",
        [customerId, fromDate ?? null, toDate ?? null]
      );
      rows = res;
      isLegacySp = true;
    } else {
      throw err;
    }
  }

  const resultRows = rows[0] || [];
  if (page && pageSize) {
    if (isLegacySp) {
      const totalRows = resultRows.length;
      const limit = Number(pageSize) || 20;
      const currentPage = Number(page) || 1;
      const totalPages = totalRows > 0 ? Math.ceil(totalRows / limit) : 1;
      const offset = (currentPage - 1) * limit;
      const pagedRows = resultRows.slice(offset, offset + limit);

      return {
        rows: pagedRows,
        pagination: {
          totalRows,
          currentPage,
          pageSize: limit,
          totalPages,
        },
      };
    }

    const totalRows = resultRows[0]?.TOTALROWS || 0;
    const totalPages = resultRows[0]?.TOTALPAGES || (totalRows > 0 ? Math.ceil(totalRows / Number(pageSize)) : 1);
    const currentPage = resultRows[0]?.CURRENTPAGE || Number(page) || 1;
    const limit = resultRows[0]?.PAGESIZE || Number(pageSize) || 20;

    return {
      rows: resultRows,
      pagination: {
        totalRows: Number(totalRows),
        currentPage: Number(currentPage),
        pageSize: Number(limit),
        totalPages: Number(totalPages),
      },
    };
  }

  return resultRows;
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
 */
export const listWalletWithdrawals = async (customerId = null, status = null) => {
  const [rows] = await pool.query(
    "CALL CMSLISTWALLETWD(?, ?)",
    [customerId ?? null, status ?? null]
  );
  return rows[0];
};
