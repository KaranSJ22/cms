// ============================================================
// CMS Kiosk Local Agent - System Constants
// ============================================================

export const OUTBOX_STATUS = {
  PENDING: "PENDING",
  SYNCING: "SYNCING",
  SYNCED: "SYNCED",
  REJECTED: "REJECTED",
  RETRYABLE_ERROR: "RETRYABLE_ERROR",
};

export const PAYMENT_METHOD = {
  OFFICIAL: "OFFICIAL",
  WALLET: "WALLET",
};

export const CUSTOMER_TYPE = {
  PERMANENT: "PRM",
  CONTRACT: "CNT",
  CONTEMP: "CONTEMP",
  VISITOR: "VIS",
  VISITOR_ALT: "VISITOR",
};

// Contract staff and visitors require prepaid wallet deduction
export const WALLET_ELIGIBLE_TYPES = ["CNT", "CONTEMP", "VIS", "VISITOR"];

export const BOOKING_STATUS = {
  CREATED: 30,
  CONFIRMED: 31,
  SERVED: 40,
  CANCELLED: 60,
};

export const SYNC_CONFIG = {
  DEFAULT_CHUNK_SIZE: 25,
  MAX_CHUNK_SIZE: 50,
  MAX_RETRY_COUNT: 5,
  INITIAL_BACKOFF_MS: 5000,
  MAX_BACKOFF_MS: 60000,
};
