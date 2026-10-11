import readline from "readline";
import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { closeDb } from "./db/sqlite.js";
import { initializeDatabase } from "../scripts/init-db.js";
import { startSyncWorker, stopSyncWorker } from "./modules/sync/sync.worker.js";

// 1. Initialize SQLite Database Tables
try {
  initializeDatabase();
} catch (err) {
  logger.fatal({ err }, "Failed to initialize local SQLite database. Halting agent boot.");
  process.exit(1);
}

// 2. Start HTTP Server
const server = app.listen(env.PORT, "0.0.0.0", () => {
  logger.info(`CMS Kiosk Agent running on http://127.0.0.1:${env.PORT} [Kiosk: ${env.KIOSK_CODE}]`);
});

server.on("error", (err) => {
  logger.fatal({ err }, "HTTP server error in kiosk agent");
  process.exit(1);
});

// 3. Start Background Sync Engine
startSyncWorker();

// -----------------------------------------------------------------------------
// Graceful Shutdown Protocol
// -----------------------------------------------------------------------------
let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`${signal} received. Initiating graceful shutdown...`);

  // Stop background sync timer
  stopSyncWorker();

  // Close idle connections
  if (typeof server.closeIdleConnections === "function") {
    server.closeIdleConnections();
  }

  // Force close timeout safety net
  const forceCloseTimeout = setTimeout(() => {
    if (typeof server.closeAllConnections === "function") {
      server.closeAllConnections();
    }
  }, 1500);
  forceCloseTimeout.unref();

  server.close(async (err) => {
    clearTimeout(forceCloseTimeout);

    if (err) {
      logger.error({ err }, "Error closing HTTP server");
    } else {
      logger.info("HTTP server closed to new connections");
    }

    // Flush WAL and close SQLite connection
    closeDb();

    setTimeout(() => {
      process.exit(0);
    }, 150);
  });
};

// Windows console readline wrapper for clean Ctrl+C
if (process.platform === "win32") {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("SIGINT", () => {
    process.emit("SIGINT");
  });
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("unhandledRejection", (reason, promise) => {
  logger.error({ reason, promise }, "Unhandled Rejection at Promise");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught Exception thrown");
  gracefulShutdown("uncaughtException");
});
