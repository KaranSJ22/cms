import { useState } from "react";
import {
  lookupCustomerForWallet,
  createWallet,
  fetchWallet,
  fetchWalletTransactions,
  topupWallet,
} from "../api/walletApi";
import { formatINR } from "../../../utils/formatters";

/**
 * Custom hook to manage customer/employee wallet lookup,
 * initial wallet account creation, cash top-ups, and transaction history.
 */
export function useWalletLookup() {
  const [lookupId, setLookupId] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [customerWallet, setCustomerWallet] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [txnPage, setTxnPage] = useState(1);
  const txnPageSize = 10;
  const [txnPagination, setTxnPagination] = useState({
    totalRows: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
  });
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  // New Wallet Opening State (First-time user)
  const [openAmount, setOpenAmount] = useState("0");
  const [openRemarks, setOpenRemarks] = useState("Initial wallet account creation");
  const [openingSubmitting, setOpeningSubmitting] = useState(false);

  // Top-Up Form State
  const [topupAmount, setTopupAmount] = useState("");
  const [topupRefNo, setTopupRefNo] = useState("");
  const [topupRemarks, setTopupRemarks] = useState("");
  const [topupSubmitting, setTopupSubmitting] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState(null);

  const loadTransactions = async (customerId, page = 1) => {
    try {
      const txns = await fetchWalletTransactions(customerId, {
        page,
        pageSize: txnPageSize,
      });
      setWalletTransactions(Array.isArray(txns) ? txns : []);
      if (txns?.pagination) {
        setTxnPagination(txns.pagination);
      } else {
        setTxnPagination({
          totalRows: (txns || []).length,
          totalPages: 1,
          currentPage: page,
          pageSize: txnPageSize,
        });
      }
    } catch {
      setWalletTransactions([]);
    }
  };

  // Look up customer & wallet
  const handleLookupWallet = async (e) => {
    e?.preventDefault?.();
    if (!lookupId.trim()) return;

    setLookupLoading(true);
    setLookupError(null);
    setTopupSuccess(null);
    setLookupResult(null);
    setCustomerWallet(null);
    setWalletTransactions([]);

    try {
      const result = await lookupCustomerForWallet(lookupId.trim());
      setLookupResult(result);

      if (result.hasWallet && result.wallet) {
        setCustomerWallet(result.wallet);
        setTxnPage(1);
        await loadTransactions(result.customer.CUSTOMERID, 1);
      }
    } catch (err) {
      setLookupError(
        err.response?.data?.message ||
          "Customer or Employee not found. Please check Employee ID or Customer ID."
      );
    } finally {
      setLookupLoading(false);
    }
  };

  // Handle first-time wallet creation & activation
  const handleCreateWallet = async (e) => {
    e?.preventDefault?.();
    if (!lookupResult?.customer?.CUSTOMERID) return;
    const amountNum = Number(openAmount || 0);
    if (amountNum > 0 && amountNum < 100) {
      setLookupError(
        "Opening deposit must be at least ₹100 if depositing opening cash (or ₹0 to create empty wallet)."
      );
      return;
    }

    setOpeningSubmitting(true);
    setLookupError(null);
    setTopupSuccess(null);

    try {
      const newWallet = await createWallet({
        customerId: lookupResult.customer.CUSTOMERID,
        openAmount: amountNum,
        remarks:
          openRemarks.trim() ||
          (amountNum === 0
            ? "Initial 0-balance wallet creation"
            : "Initial cash opening deposit"),
      });

      setCustomerWallet(newWallet);
      setLookupResult((prev) =>
        prev ? { ...prev, hasWallet: true, wallet: newWallet } : prev
      );
      setTopupSuccess(
        amountNum > 0
          ? `Successfully activated wallet with ${formatINR(amountNum)} opening credit!`
          : `Successfully created wallet with ₹0 balance!`
      );

      // Refresh transactions
      setTxnPage(1);
      await loadTransactions(lookupResult.customer.CUSTOMERID, 1);
    } catch (err) {
      setLookupError(err.response?.data?.message || "Failed to create wallet.");
    } finally {
      setOpeningSubmitting(false);
    }
  };

  // Handle cash top-up
  const handleTopup = async (e) => {
    e?.preventDefault?.();
    const amountNum = Number(topupAmount);
    if (!customerWallet || !amountNum || amountNum < 100) {
      setLookupError("Top-up amount must be at least ₹100.00");
      return;
    }

    setTopupSubmitting(true);
    setTopupSuccess(null);
    setLookupError(null);

    try {
      await topupWallet({
        customerId: customerWallet.CUSTOMERID,
        amount: amountNum,
        paymentMethod: "CASH",
        refNo: topupRefNo.trim() || undefined,
        remarks: topupRemarks.trim() || "Cash top-up at canteen counter",
      });

      setTopupSuccess(
        `Successfully credited ${formatINR(amountNum)} cash to customer wallet!`
      );
      setTopupAmount("");
      setTopupRefNo("");
      setTopupRemarks("");

      // Refresh wallet & transactions
      const updatedWallet = await fetchWallet(customerWallet.CUSTOMERID);
      setCustomerWallet(updatedWallet);
      setTxnPage(1);
      await loadTransactions(customerWallet.CUSTOMERID, 1);
    } catch (err) {
      setLookupError(err.response?.data?.message || "Failed to process top-up.");
    } finally {
      setTopupSubmitting(false);
    }
  };

  return {
    lookupId,
    setLookupId,
    lookupResult,
    setLookupResult,
    customerWallet,
    setCustomerWallet,
    walletTransactions,
    txnPage,
    setTxnPage,
    txnPageSize,
    txnPagination,
    lookupLoading,
    lookupError,
    setLookupError,
    openAmount,
    setOpenAmount,
    openRemarks,
    setOpenRemarks,
    openingSubmitting,
    topupAmount,
    setTopupAmount,
    topupRefNo,
    setTopupRefNo,
    topupRemarks,
    setTopupRemarks,
    topupSubmitting,
    topupSuccess,
    setTopupSuccess,
    loadTransactions,
    handleLookupWallet,
    handleCreateWallet,
    handleTopup,
  };
}
