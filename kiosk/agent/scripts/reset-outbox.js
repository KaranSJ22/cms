import { getDb, closeDb } from "../src/db/sqlite.js";
import { logger } from "../src/utils/logger.js";
import { OUTBOX_STATUS } from "../src/config/constants.js";

const resetOutbox = () => {
  logger.info("Resetting stuck outbox bookings...");
  const db = getDb();

  const result = db
    .prepare(
      `UPDATE outbox_bookings
       SET sync_status = ?, retry_count = 0, sync_error = NULL
       WHERE sync_status IN (?, ?)`
    )
    .run(OUTBOX_STATUS.PENDING, OUTBOX_STATUS.SYNCING, OUTBOX_STATUS.RETRYABLE_ERROR);

  logger.info({ rowsReset: result.changes }, "Stuck outbox bookings successfully reset to PENDING");
};

try {
  resetOutbox();
  closeDb();
  process.exit(0);
} catch (err) {
  logger.error({ err }, "Failed to reset outbox");
  process.exit(1);
}
