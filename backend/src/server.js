import readline from "readline";
import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { pool } from "./db/connection.js";

const server = app.listen(env.PORT, "0.0.0.0", () => {
  logger.info(`CMS backend server running on port ${env.PORT}`);
});

server.on("error", (err) => {
  logger.error({ err }, "HTTP server error!");
  process.exit(1);
});

let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`${signal} received. Initiating graceful shutdown...`);

  // Close idle keep-alive connections immediately so server.close doesn't hang
  if (typeof server.closeIdleConnections === "function") {
    server.closeIdleConnections();
  }

  // Force close remaining active connections after a short grace period
  const forceCloseTimeout = setTimeout(() => {
    if (typeof server.closeAllConnections === "function") {
      server.closeAllConnections();
    }
  }, 1500);
  forceCloseTimeout.unref();

  // Emergency safety exit if server or DB pool hangs during shutdown
  const emergencyExitTimeout = setTimeout(async () => {
    logger.warn("Shutdown grace period exceeded. Forcing clean exit.");
    try {
      await pool.end();
    } catch {
      // Ignore pool closing error on emergency exit
    }
    setTimeout(() => process.exit(0), 150);
  }, 3000);
  emergencyExitTimeout.unref();

  server.close(async (err) => {
    clearTimeout(forceCloseTimeout);
    clearTimeout(emergencyExitTimeout);

    if (err) {
      logger.error({ err }, "Error closing HTTP server");
    } else {
      logger.info("HTTP server closed to new connections");
    }

    try {
      await pool.end();
      logger.info("Database pool closed successfully");
    } catch (poolErr) {
      logger.error({ err: poolErr }, "Error closing database pool");
    }

    // Allow pino worker transport (pino-pretty) time to flush buffers to stdout
    setTimeout(() => {
      process.exit(0);
    }, 150);
  });
};

// On Windows, nodemon & PowerShell console wrappers require a readline interface on stdin
// to reliably capture the Ctrl+C event and emit SIGINT to Node.js
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